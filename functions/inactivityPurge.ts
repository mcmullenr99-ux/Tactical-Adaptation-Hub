import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";

Deno.serve(async (req: Request) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const url = new URL(req.url);
  const path = url.searchParams.get("path") ?? "";

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;

    // ── GET scan?group_id=xxx ──────────────────────────────────────────────
    if (req.method === "GET" && path === "scan") {
      const groupId = url.searchParams.get("group_id");
      if (!groupId) return json({ error: "group_id required" }, 400);

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const roster = await db.entities.MilsimRoster.filter({ group_id: groupId, status: "active" });
      if (!roster?.length) return json({ inactive: [], total_active: 0, scanned_at: new Date().toISOString() });

      // Active LOAs — these members are excused
      const loas = await db.entities.MilsimLOA.filter({ group_id: groupId, status: "approved" });
      const loaRosterIds = new Set((loas || []).map((l: any) => l.roster_id));

      // Recent ops — any participant in last 30 days counts as active
      const ops = await db.entities.MilsimOp.filter({ group_id: groupId });
      const recentOpRosterIds = new Set<string>();
      for (const op of (ops || [])) {
        if (!op.scheduled_at) continue;
        if (new Date(op.scheduled_at) >= thirtyDaysAgo) {
          if (Array.isArray(op.participants)) {
            for (const p of op.participants) {
              const id = typeof p === "string" ? p : p?.roster_id;
              if (id) recentOpRosterIds.add(id);
            }
          }
        }
      }

      const inactive = [];
      for (const m of roster) {
        if (loaRosterIds.has(m.id)) return false;
        if (recentOpRosterIds.has(m.id)) continue;
        // Members who joined < 30 days ago are still onboarding — skip
        const joinRef = m.join_date || m.created_date;
        if (joinRef && new Date(joinRef) >= thirtyDaysAgo) continue;

        inactive.push({
          id: m.id,
          user_id: m.user_id,
          callsign: m.callsign,
          rank_id: m.rank_id,
          role_id: m.role_id,
          join_date: m.join_date,
          ops_count: m.ops_count || 0,
        });
      }

      return json({ inactive, total_active: roster.length, scanned_at: new Date().toISOString() });
    }

    // ── POST bulk-update ───────────────────────────────────────────────────
    if (req.method === "POST" && path === "bulk-update") {
      const body = await req.json();
      const { roster_ids, new_status, group_id } = body;

      if (!Array.isArray(roster_ids) || !roster_ids.length) return json({ error: "roster_ids required" }, 400);
      if (!new_status) return json({ error: "new_status required" }, 400);
      if (!group_id) return json({ error: "group_id required" }, 400);

      const valid = ["inactive", "discharged", "awol"];
      if (!valid.includes(new_status)) return json({ error: `new_status must be one of: ${valid.join(", ")}` }, 400);

      let updated = 0;
      const errors: string[] = [];
      for (const id of roster_ids) {
        try {
          await db.entities.MilsimRoster.update(id, {
            status: new_status,
            notes: `Marked ${new_status} via Inactivity Purge on ${new Date().toLocaleDateString("en-GB")}`,
          });
          updated++;
        } catch (e: any) {
          errors.push(`${id}: ${e.message}`);
        }
      }

      return json({ updated, errors, new_status });
    }

    // ── POST weekly-scan (called by weekly automation) ─────────────────────
    if (req.method === "POST" && path === "weekly-scan") {
      const _allProRecords = await db.entities.CommanderPro.list();
      const proRecords = (_allProRecords ?? []).filter((r: any) =>
        r.status === 'active' ||
        r.status === 'trialing' ||
        r.status === 'manual_override' ||
        r.stripe_customer_id === 'manual_override' ||
        r.stripe_subscription_id === 'manual_override'
      );
      if (!proRecords?.length) return json({ message: "No active Pro groups", processed: 0 });

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const results = [];

      for (const pro of proRecords) {
        const groupId = pro.group_id;
        const roster = await db.entities.MilsimRoster.filter({ group_id: groupId, status: "active" });
        if (!roster?.length) continue;

        const loas = await db.entities.MilsimLOA.filter({ group_id: groupId, status: "approved" });
        const loaRosterIds = new Set((loas || []).map((l: any) => l.roster_id));

        const ops = await db.entities.MilsimOp.filter({ group_id: groupId });
        const recentOpRosterIds = new Set<string>();
        for (const op of (ops || [])) {
          if (!op.scheduled_at) continue;
          if (new Date(op.scheduled_at) >= thirtyDaysAgo) {
            if (Array.isArray(op.participants)) {
              for (const p of op.participants) {
                const id = typeof p === "string" ? p : p?.roster_id;
                if (id) recentOpRosterIds.add(id);
              }
            }
          }
        }

        const inactive = roster.filter((m: any) => {
          if (loaRosterIds.has(m.id)) return false;
          if (recentOpRosterIds.has(m.id)) return false;
          const ref = m.join_date || m.created_date;
          if (ref && new Date(ref) >= thirtyDaysAgo) return false;
          return true;
        });

        if (inactive.length > 0) {
          await db.entities.Notification.create({
            user_id: pro.owner_id,
            type: "inactivity_report",
            title: `Inactivity Report — ${inactive.length} member${inactive.length !== 1 ? "s" : ""} flagged`,
            body: `${inactive.length} member${inactive.length !== 1 ? "s have" : " has"} had no recorded activity in the last 30 days. Open Unit HQ → Troop Management → Inactivity to review.`,
            link: `/portal/member-hq`,
            is_read: false,
          });
        }

        results.push({ group_id: groupId, inactive_count: inactive.length, active_count: roster.length });
      }

      return json({ processed: proRecords.length, results });
    }

    return json({ error: "Not found" }, 404);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
