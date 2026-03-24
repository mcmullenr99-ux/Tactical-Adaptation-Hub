import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/stats/, '').split('/').filter(Boolean);
    const method = req.method;

    // ── GET /stats/public ──────────────────────────────────────────────────
    if (method === 'GET' && parts[0] === 'public') {
      const [users, groups, ops, awards, aars] = await Promise.all([
        base44.asServiceRole.entities.User.list(),
        base44.asServiceRole.entities.MilsimGroup.list(),
        base44.asServiceRole.entities.MilsimOp.list(),
        base44.asServiceRole.entities.MilsimAward.list(),
        base44.asServiceRole.entities.MilsimAAR.list(),
      ]);
      const activeMembers = users.filter((u: any) => u.status === 'active').length;
      const completedOps = ops.filter((o: any) => o.status === 'completed').length;
      const oldest = [...users].sort((a: any, b: any) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime())[0];
      const founded = oldest ? new Date(oldest.created_date).getFullYear() : new Date().getFullYear();
      return Response.json({
        active_members: activeMembers,
        milsim_groups: groups.filter((g: any) => g.status === 'approved' || g.status === 'featured').length,
        ops_completed: completedOps,
        awards_given: awards.length,
        aars_filed: aars.length,
        founded_year: founded,
        years_active: new Date().getFullYear() - founded,
      });
    }

    // ── GET /stats/readiness/:groupId ──────────────────────────────────────
    // Returns: status (green/amber/red), readiness_pct, total, active_this_week,
    //          active_this_month, op_tempo, win_rate, avg_rep_score,
    //          op_capability_tier, capacity metrics
    if (method === 'GET' && parts[0] === 'readiness' && parts.length === 2) {
      const groupId = parts[1];

      const [roster, ops, aars, repReviews] = await Promise.all([
        base44.asServiceRole.entities.MilsimRoster.filter({ group_id: groupId }),
        base44.asServiceRole.entities.MilsimOp.filter({ group_id: groupId }),
        base44.asServiceRole.entities.MilsimAAR.filter({ group_id: groupId }),
        base44.asServiceRole.entities.OperatorReputation.filter({ group_id: groupId }),
      ]);

      const total = roster.length;
      const now = Date.now();
      const sevenDays  = 7  * 24 * 60 * 60 * 1000;
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;

      // Active counts based on when roster entries were last updated
      // (proxy for activity — actual last login not available per roster)
      const active_this_week  = roster.filter((r: any) => r.updated_date && (now - new Date(r.updated_date).getTime()) < sevenDays).length;
      const active_this_month = roster.filter((r: any) => r.updated_date && (now - new Date(r.updated_date).getTime()) < thirtyDays).length;

      // Ops stats
      const completedOps = ops.filter((o: any) => o.status === 'completed').length;
      const totalOps     = ops.length;
      const wins         = aars.filter((a: any) => a.outcome?.toLowerCase() === 'victory').length;
      const win_rate     = aars.length > 0 ? Math.round((wins / aars.length) * 100) : 0;
      const op_tempo     = totalOps; // raw count

      // Rep-weighted average experience score from all reviews for this group
      let avg_rep_score = 0;
      let avg_experience = 0;
      if (repReviews.length > 0) {
        const expVals = repReviews.map((r: any) => r.experience ?? 5).filter((v: number) => v > 0);
        avg_experience = expVals.length ? Math.round((expVals.reduce((a: number, b: number) => a + b, 0) / expVals.length) * 10) / 10 : 0;
        // Overall rep score: combine activity + discipline + experience + attitude
        const scores = repReviews.map((r: any) => {
          const avg = ((r.activity ?? 5) + (r.attitude ?? 5) + (r.experience ?? 5) + (r.discipline ?? 5)) / 4;
          return avg * 10; // scale to 100
        });
        avg_rep_score = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
      }

      // Readiness %:
      // 40% weight → capacity factor (active_this_month / total if total > 0)
      // 40% weight → rep-based score (avg_rep_score / 100)
      // 20% weight → op record (win_rate / 100, or neutral 50 if no ops)
      const capacityFactor  = total > 0 ? (active_this_month / total) * 100 : 0;
      const repFactor       = avg_rep_score > 0 ? avg_rep_score : 50; // neutral if no reviews
      const opFactor        = aars.length > 0 ? win_rate : 50;         // neutral if no AARs
      const readiness_pct   = Math.round(capacityFactor * 0.4 + repFactor * 0.4 + opFactor * 0.2);

      // Status thresholds
      const status = readiness_pct >= 70 ? 'green' : readiness_pct >= 40 ? 'amber' : 'red';

      // Operational Capability Tier:
      // Based on op_tempo, win_rate, avg_experience and member count
      const opCapScore =
        (Math.min(totalOps, 20) / 20) * 30 +      // up to 30pts from op history
        (win_rate / 100) * 30 +                    // up to 30pts from win rate
        (avg_experience / 10) * 25 +               // up to 25pts from avg troop experience
        (Math.min(total, 50) / 50) * 15;           // up to 15pts from troop count

      const op_capability_tier =
        opCapScore >= 80 ? 'TIER I'   :
        opCapScore >= 60 ? 'TIER II'  :
        opCapScore >= 40 ? 'TIER III' :
        opCapScore >= 20 ? 'TIER IV'  : 'FORMING';

      return Response.json({
        // Core readiness
        total,
        active_this_week,
        active_this_month,
        readiness_pct,
        status,
        // Op record
        total_ops: totalOps,
        completed_ops: completedOps,
        win_rate,
        op_tempo,
        // Rep data
        avg_rep_score,
        avg_experience,
        review_count: repReviews.length,
        // Capability
        op_capability_tier,
        op_cap_score: Math.round(opCapScore),
      });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[stats]', error);
    return Response.json({ error: error?.message ?? 'Unknown error' }, { status: 500 });
  }
});
