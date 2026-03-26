import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";

// Auto-verify criteria (all must pass):
// 1. status === "approved"
// 2. roster >= 3 active members
// 3. total AARs filed >= 5
// 4. active in last 90 days (op or AAR)
// 5. has logo, description, at least 1 game
// 6. has SOPs or ORBAT published
// verify_override = true bypasses criteria (admin manual grant)

const CRITERIA = {
  MIN_ROSTER:      3,
  MIN_AARS:        5,
  ACTIVITY_DAYS:   90,
};

Deno.serve(async (req: Request) => {
  const base44 = createClientFromRequest(req);
  const db = base44.asServiceRole.entities;

  try {
    // Fetch all approved groups
    const groups: any[] = await db.MilsimGroup.filter({ status: "approved" });

    let verified = 0;
    let unverified = 0;
    const results: any[] = [];

    const cutoff = Date.now() - CRITERIA.ACTIVITY_DAYS * 24 * 60 * 60 * 1000;

    for (const group of groups) {
      // Admin override — skip criteria, always verified
      if (group.verify_override) {
        if (!group.is_verified) {
          await db.MilsimGroup.update(group.id, {
            is_verified: true,
            verified_at: new Date().toISOString(),
            verification_score: 100,
          });
        }
        verified++;
        results.push({ name: group.name, result: "verified (override)" });
        continue;
      }

      // 1. Roster count
      const roster: any[] = await db.MilsimRoster.filter({ group_id: group.id, status: "active" }).catch(() => []);
      const rosterCount = roster.length;

      // 2. AARs filed
      const aars: any[] = await db.MilsimAAR.filter({ group_id: group.id }).catch(() => []);
      const aarCount = aars.length;

      // 3. Recent activity
      const lastOp = group.last_op_date ? new Date(group.last_op_date).getTime() : 0;
      const lastAar = group.last_aar_date ? new Date(group.last_aar_date).getTime() : 0;
      const isActive = Math.max(lastOp, lastAar) > cutoff;

      // 4. Profile completeness
      const hasLogo = !!(group.logo_url && group.logo_url.length > 5);
      const hasDescription = !!(group.description && group.description.length >= 20);
      const hasGames = Array.isArray(group.games) && group.games.length > 0;
      const hasDoctrine = !!(group.sops || group.orbat);

      // Score (0-100)
      let score = 0;
      if (rosterCount >= CRITERIA.MIN_ROSTER)  score += 25;
      else if (rosterCount >= 1)                score += 10;
      if (aarCount >= CRITERIA.MIN_AARS)        score += 25;
      else if (aarCount >= 2)                   score += 10;
      if (isActive)                             score += 20;
      if (hasLogo)                              score += 10;
      if (hasDescription)                       score += 10;
      if (hasGames)                             score += 5;
      if (hasDoctrine)                          score += 5;

      const passes =
        rosterCount >= CRITERIA.MIN_ROSTER &&
        aarCount >= CRITERIA.MIN_AARS &&
        isActive &&
        hasLogo &&
        hasDescription &&
        hasGames;

      const updates: any = { verification_score: score };

      if (passes && !group.is_verified) {
        updates.is_verified = true;
        updates.verified_at = new Date().toISOString();
        verified++;
        results.push({ name: group.name, result: "newly verified", score });
      } else if (!passes && group.is_verified) {
        updates.is_verified = false;
        updates.verified_at = null;
        unverified++;
        results.push({
          name: group.name, result: "verification removed", score,
          reason: [
            rosterCount < CRITERIA.MIN_ROSTER ? `roster ${rosterCount}/${CRITERIA.MIN_ROSTER}` : null,
            aarCount < CRITERIA.MIN_AARS ? `aars ${aarCount}/${CRITERIA.MIN_AARS}` : null,
            !isActive ? `inactive ${CRITERIA.ACTIVITY_DAYS}d` : null,
            !hasLogo ? "no logo" : null,
            !hasDescription ? "no description" : null,
            !hasGames ? "no games" : null,
          ].filter(Boolean).join(", ")
        });
      } else {
        results.push({ name: group.name, result: passes ? "already verified" : "not eligible", score });
      }

      await db.MilsimGroup.update(group.id, updates);
    }

    return Response.json({
      success: true,
      processed: groups.length,
      newly_verified: verified,
      newly_unverified: unverified,
      results,
    });

  } catch (err: any) {
    console.error("autoVerifyGroups error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
