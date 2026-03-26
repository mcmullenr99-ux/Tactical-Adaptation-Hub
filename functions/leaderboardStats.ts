import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";

// ─── Anti-cheat constants ────────────────────────────────────────────────────
const MIN_PARTICIPANTS = 3;       // AAR must list at least 3 participants
const MAX_SCORING_PER_DAY = 1;    // Max 1 scoring AAR per group per calendar day
const MAX_VICTORIES_PER_7D = 3;   // >3 victories in 7 days → auto-flag the excess
const VERIFIED_ONLY_LB = true;    // Op Success LB requires Verified status

function isVerifiedGroup(group: any): boolean {
  if (!group.is_pro) return false; // needs pro flag — we'll check via commanderPro entity
  const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000;
  const lastOp = group.last_op_date ? new Date(group.last_op_date).getTime() : 0;
  const lastAar = group.last_aar_date ? new Date(group.last_aar_date).getTime() : 0;
  return Math.max(lastOp, lastAar) > cutoff;
}

function dayKey(dateStr: string): string {
  return new Date(dateStr).toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function applyAntiCheat(aars: any[]): { scored: any[]; flagged: { id: string; reason: string }[] } {
  const flagged: { id: string; reason: string }[] = [];

  // Step 1: Filter out already-admin-flagged AARs
  const clean = aars.filter(a => !a.lb_flagged);

  // Step 2: Filter min participants
  const withParticipants = clean.filter(a => {
    const count = Array.isArray(a.participants) ? a.participants.length : 0;
    if (count < MIN_PARTICIPANTS) {
      flagged.push({ id: a.id, reason: `Below minimum participants (${count}/${MIN_PARTICIPANTS})` });
      return false;
    }
    return true;
  });

  // Step 3: Rate limit — max 1 scoring AAR per group per calendar day
  const seenDays = new Map<string, number>(); // groupId_day → count
  const afterRateLimit = withParticipants.filter(a => {
    const key = `${a.group_id}_${dayKey(a.created_date)}`;
    const count = seenDays.get(key) ?? 0;
    if (count >= MAX_SCORING_PER_DAY) {
      flagged.push({ id: a.id, reason: `Rate limit: >1 scoring AAR filed same day by group` });
      return false;
    }
    seenDays.set(key, count + 1);
    return true;
  });

  // Step 4: Velocity check — flag victories if >MAX_VICTORIES_PER_7D in any 7d window
  // Build per-group sorted victory list
  const byGroup: Record<string, any[]> = {};
  afterRateLimit.forEach(a => {
    if (!byGroup[a.group_id]) byGroup[a.group_id] = [];
    byGroup[a.group_id].push(a);
  });

  const velocityFlagged = new Set<string>();
  Object.values(byGroup).forEach(groupAars => {
    const victories = groupAars
      .filter(a => a.outcome === "victory")
      .sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());

    // Sliding window: for each victory, count victories in next 7 days
    for (let i = 0; i < victories.length; i++) {
      const windowStart = new Date(victories[i].created_date).getTime();
      const windowEnd = windowStart + 7 * 24 * 60 * 60 * 1000;
      const inWindow = victories.filter(v => {
        const t = new Date(v.created_date).getTime();
        return t >= windowStart && t <= windowEnd;
      });
      if (inWindow.length > MAX_VICTORIES_PER_7D) {
        // Flag the excess (keep first MAX, flag the rest)
        inWindow.slice(MAX_VICTORIES_PER_7D).forEach(v => {
          if (!velocityFlagged.has(v.id)) {
            velocityFlagged.add(v.id);
            flagged.push({ id: v.id, reason: `Velocity: >${MAX_VICTORIES_PER_7D} victories filed in 7-day window` });
          }
        });
      }
    }
  });

  const scored = afterRateLimit.filter(a => !velocityFlagged.has(a.id));
  return { scored, flagged };
}

Deno.serve(async (req: Request) => {
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

  try {
    const base44 = createClientFromRequest(req);
    const admin = base44.asServiceRole;

    // Parallel fetch
    const [groups, allRosters, allAars, proRecords] = await Promise.all([
      admin.entities.MilsimGroup.list(),
      admin.entities.MilsimRoster.list(),
      admin.entities.MilsimAAR.list(),
      admin.entities.CommanderPro.list(),
    ]);

    const eligibleGroups = groups.filter((g: any) => g.status === "approved" || g.status === "featured");

    // Build pro map
    const proMap = new Map<string, boolean>();
    proRecords.forEach((p: any) => {
      if (p.status === "active") proMap.set(p.group_id, true);
    });

    // Add is_pro to groups
    const enrichedGroups = eligibleGroups.map((g: any) => ({ ...g, is_pro: proMap.get(g.id) ?? false }));

    // Run anti-cheat on all AARs
    const { scored: scoredAars, flagged: newFlags } = applyAntiCheat(allAars);

    // Auto-write flags back to entity for admin visibility (fire and forget)
    if (newFlags.length > 0) {
      Promise.allSettled(
        newFlags.map(f =>
          admin.entities.MilsimAAR.update(f.id, { lb_flagged: true, lb_flag_reason: f.reason })
        )
      ).catch(() => {});
    }

    // Build per-group stats
    const stats = enrichedGroups.map((group: any) => {
      const verified = isVerifiedGroup(group);

      // Roster count — active members only
      const roster_count = allRosters.filter((r: any) =>
        r.group_id === group.id && (r.status === "active" || !r.status)
      ).length;

      // Op success from anti-cheat-passed AARs
      const groupAars = scoredAars.filter((a: any) => a.group_id === group.id);
      const total_ops = groupAars.length;

      // For LB: verified-only requirement
      let op_success_rate: number | null = null;
      if (VERIFIED_ONLY_LB && !verified) {
        op_success_rate = null; // won't appear on op success LB
      } else if (total_ops >= 3) {
        const victories = groupAars.filter((a: any) => a.outcome === "victory").length;
        op_success_rate = Math.round((victories / total_ops) * 100);
      }

      return {
        group_id: group.id,
        roster_count,
        total_ops,
        op_success_rate,
        verified,
        is_pro: group.is_pro,
      };
    });

    return new Response(JSON.stringify(stats), { status: 200, headers });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
});
