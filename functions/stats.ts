import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

async function getCallerUser(base44: any, req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    return await base44.asServiceRole.entities.User.get(payload.sub) ?? null;
  } catch { return null; }
}

// ─── READINESS ENGINE ─────────────────────────────────────────────────────────
// Returns a full readiness report with status, score, flags and narrative.

interface ReadinessFlag {
  severity: 'red' | 'amber';
  code: string;
  label: string;
  detail: string;
}

interface ReadinessReport {
  // Status
  status: 'green' | 'amber' | 'red';
  readiness_pct: number;

  // Troop
  total: number;
  active_this_week: number;
  active_this_month: number;
  capacity_grade: 'fireteam_incomplete' | 'squad_incomplete' | 'section_force' | 'platoon_plus';

  // Ops
  total_ops: number;
  completed_ops: number;
  days_since_last_op: number | null;
  days_since_last_aar: number | null;
  days_since_last_training: number | null;
  days_since_page_update: number | null;

  // Rep
  avg_rep_score: number;
  avg_experience: number;
  review_count: number;

  // Links
  has_discord: boolean;
  has_steam: boolean;

  // Capability tier
  op_capability_tier: string;
  op_cap_score: number;

  // Flags (public breakdown of WHY it's good/bad)
  flags: ReadinessFlag[];

  // System-generated narrative (displayed on group page)
  narrative: string;
  narrative_lines: string[];
}

function buildReadinessReport(params: {
  roster: any[];
  ops: any[];
  aars: any[];
  repReviews: any[];
  group: any;
}): ReadinessReport {
  const { roster, ops, aars, repReviews, group } = params;
  const now = Date.now();
  const DAY = 86_400_000;

  // ── Troop counts ────────────────────────────────────────────────────────
  const total = roster.length;
  const active_this_week  = roster.filter((r: any) => r.updated_date && (now - new Date(r.updated_date).getTime()) < 7 * DAY).length;
  const active_this_month = roster.filter((r: any) => r.updated_date && (now - new Date(r.updated_date).getTime()) < 30 * DAY).length;

  // Capacity grade — hard rules per user spec
  const capacity_grade: ReadinessReport['capacity_grade'] =
    total < 4  ? 'fireteam_incomplete' :
    total < 9  ? 'squad_incomplete'    :
    total < 30 ? 'section_force'       :
                 'platoon_plus';

  // ── Ops & recency ────────────────────────────────────────────────────────
  const totalOps     = ops.length;
  const completedOps = ops.filter((o: any) => o.status === 'completed').length;

  function daysSince(isoDate: string | null | undefined): number | null {
    if (!isoDate) return null;
    const ms = now - new Date(isoDate).getTime();
    return ms > 0 ? Math.floor(ms / DAY) : 0;
  }

  const lastOpDate  = ops.length  ? ops.sort((a: any, b: any)  => new Date(b.scheduled_at ?? b.created_date).getTime() - new Date(a.scheduled_at ?? a.created_date).getTime())[0].scheduled_at ?? ops[0].created_date : null;
  const lastAarDate = aars.length ? aars.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())[0].created_date : null;

  const days_since_last_op       = daysSince(lastOpDate    ?? group.last_op_date);
  const days_since_last_aar      = daysSince(lastAarDate   ?? group.last_aar_date);
  const days_since_last_training = daysSince(group.last_training_date);
  const days_since_page_update   = daysSince(group.last_page_update ?? group.updated_date);

  // ── Rep scores ───────────────────────────────────────────────────────────
  let avg_rep_score  = 0;
  let avg_experience = 0;
  if (repReviews.length > 0) {
    const expVals = repReviews.map((r: any) => r.experience ?? 5).filter((v: number) => v > 0);
    avg_experience = expVals.length
      ? Math.round((expVals.reduce((a: number, b: number) => a + b, 0) / expVals.length) * 10) / 10
      : 0;
    const scores = repReviews.map((r: any) =>
      ((r.activity ?? 5) + (r.attitude ?? 5) + (r.experience ?? 5) + (r.discipline ?? 5)) / 4 * 10
    );
    avg_rep_score = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
  }

  // ── External links ───────────────────────────────────────────────────────
  const has_discord = !!(group.discordUrl ?? group.discord_url);
  const has_steam   = !!(group.steamGroupUrl ?? group.steam_group_url);

  // ── Readiness SCORING ─────────────────────────────────────────────────────
  // Points-based system out of 100. Each bucket can only add if conditions met.
  // Max 100. Deductions stack.

  let score = 50; // start at neutral

  // CAPACITY (±25 pts)
  if (capacity_grade === 'platoon_plus')    score += 25;
  else if (capacity_grade === 'section_force')  score += 10;
  else if (capacity_grade === 'squad_incomplete') score -= 15;
  else                                          score -= 25; // fireteam_incomplete

  // ACTIVITY RATIO — active_this_month vs total (±15 pts)
  const activityRatio = total > 0 ? active_this_month / total : 0;
  if (activityRatio >= 0.7)      score += 15;
  else if (activityRatio >= 0.4) score += 5;
  else if (activityRatio >= 0.2) score -= 5;
  else                           score -= 15;

  // DISCORD LINKED (±8 pts)
  if (has_discord) score += 8;
  else             score -= 8;

  // OPS HISTORY (±10 pts)
  if (totalOps >= 10)     score += 10;
  else if (totalOps >= 5) score += 5;
  else if (totalOps >= 1) score += 2;
  else                    score -= 5;

  // AAR CULTURE — logging lessons learned (±10 pts)
  const aarRatio = totalOps > 0 ? aars.length / totalOps : 0;
  if (aarRatio >= 0.8)      score += 10;
  else if (aarRatio >= 0.4) score += 5;
  else if (aarRatio >= 0.1) score += 2;
  else if (totalOps > 0)    score -= 10; // ops but no AARs = bad

  // RECENCY — last op (±8 pts)
  if (days_since_last_op === null) score -= 5;
  else if (days_since_last_op <= 14)  score += 8;
  else if (days_since_last_op <= 30)  score += 4;
  else if (days_since_last_op <= 60)  score -= 2;
  else                                score -= 8;

  // PAGE MAINTENANCE — commander engagement (±8 pts)
  if (days_since_page_update === null) score -= 4;
  else if (days_since_page_update <= 7)   score += 8;
  else if (days_since_page_update <= 30)  score += 4;
  else if (days_since_page_update <= 90)  score -= 2;
  else                                    score -= 8;

  // REP SCORE (±6 pts)
  if (avg_rep_score >= 70)      score += 6;
  else if (avg_rep_score >= 50) score += 3;
  else if (avg_rep_score > 0)   score -= 3;

  // Clamp 0–100
  const readiness_pct = Math.min(100, Math.max(0, Math.round(score)));

  // STATUS — based on capacity grade AND score
  // Red if capacity is critically low regardless of score
  const status: ReadinessReport['status'] =
    capacity_grade === 'fireteam_incomplete' ? 'red' :
    capacity_grade === 'squad_incomplete'    ? 'red' :
    readiness_pct >= 65 ? 'green' :
    readiness_pct >= 35 ? 'amber' : 'red';

  // ── OPERATIONAL CAPABILITY TIER (no win rate — removed per spec) ──────────
  const opCapScore =
    (Math.min(totalOps, 20) / 20) * 35 +         // op history (35pts)
    (avg_experience / 10) * 30 +                  // avg troop experience (30pts)
    (Math.min(total, 50) / 50) * 20 +             // troop count (20pts)
    (aars.length > 0 ? Math.min(aarRatio, 1) : 0) * 15; // AAR culture (15pts)

  const op_capability_tier =
    opCapScore >= 80 ? 'TIER I'   :
    opCapScore >= 60 ? 'TIER II'  :
    opCapScore >= 40 ? 'TIER III' :
    opCapScore >= 20 ? 'TIER IV'  : 'FORMING';

  // ── FLAG GENERATION ───────────────────────────────────────────────────────
  const flags: ReadinessFlag[] = [];

  if (capacity_grade === 'fireteam_incomplete') {
    flags.push({ severity: 'red', code: 'CRITICAL_UNDERMANNED', label: 'Critical — Below Fireteam Strength', detail: `This unit has only ${total} member${total !== 1 ? 's' : ''}. A minimum fireteam requires 4 personnel. This unit cannot sustain any meaningful operation.` });
  } else if (capacity_grade === 'squad_incomplete') {
    flags.push({ severity: 'red', code: 'UNDERMANNED', label: 'Below Squad Strength', detail: `This unit has ${total} members — insufficient to form a complete squad (9+). Operational capacity is severely limited.` });
  } else if (capacity_grade === 'section_force') {
    flags.push({ severity: 'amber', code: 'LIMITED_STRENGTH', label: 'Section-Level Force Only', detail: `This unit fields ${total} members — above squad strength but below platoon size (30+). Adequate for small-scale operations.` });
  }

  if (!has_discord) {
    flags.push({ severity: 'red', code: 'NO_DISCORD', label: 'No Discord Server Linked', detail: 'No Discord server has been linked to this unit. Discord activity is a primary indicator of organisational cohesion. Units without a Discord link cannot be assessed for real-time activity.' });
  }

  if (activityRatio < 0.3 && total > 0) {
    flags.push({ severity: 'red', code: 'HIGH_INACTIVITY', label: 'High Member Inactivity', detail: `Only ${active_this_month} of ${total} roster members (${Math.round(activityRatio * 100)}%) showed activity in the last 30 days. This unit appears to carry ghost members on its rolls.` });
  } else if (activityRatio < 0.5 && total > 0) {
    flags.push({ severity: 'amber', code: 'MODERATE_INACTIVITY', label: 'Moderate Inactivity', detail: `${active_this_month} of ${total} members (${Math.round(activityRatio * 100)}%) were active in the last 30 days. More than half the roster is dormant.` });
  }

  if (days_since_page_update !== null && days_since_page_update > 60) {
    flags.push({ severity: 'amber', code: 'STALE_PAGE', label: 'Commander Not Maintaining Page', detail: `This unit's page has not been updated in ${days_since_page_update} days. Active commanders maintain their page — this suggests a lack of organisational engagement.` });
  }

  if (totalOps > 0 && aars.length === 0) {
    flags.push({ severity: 'red', code: 'NO_AARS', label: 'No After-Action Reports Filed', detail: `This unit has logged ${totalOps} operation${totalOps !== 1 ? 's' : ''} but filed zero After-Action Reports. Units that don't log and learn from their operations do not improve. This is a serious discipline indicator.` });
  } else if (totalOps >= 3 && aarRatio < 0.3) {
    flags.push({ severity: 'amber', code: 'LOW_AAR_RATE', label: 'Poor AAR Discipline', detail: `Only ${aars.length} of ${totalOps} operations have documented AARs. Units that don't debrief their operations fail to adapt and develop.` });
  }

  if (days_since_last_op !== null && days_since_last_op > 60) {
    flags.push({ severity: 'amber', code: 'INACTIVE_OPS', label: 'No Recent Operations', detail: `Last recorded operation was ${days_since_last_op} days ago. An inactive unit is not a combat-ready unit.` });
  }

  if (totalOps === 0) {
    flags.push({ severity: 'amber', code: 'NO_OPS_HISTORY', label: 'No Operations Logged', detail: 'This unit has not logged any operations. Without an operational record there is no basis for assessing real combat readiness.' });
  }

  // ── NARRATIVE GENERATION ──────────────────────────────────────────────────
  const narrative_lines: string[] = [];

  // Opener — capacity
  if (capacity_grade === 'fireteam_incomplete') {
    narrative_lines.push(`⚠️ This unit currently has ${total} registered member${total !== 1 ? 's' : ''} — that is fewer than a fireteam. There is no basis to evaluate operational capability at this size.`);
  } else if (capacity_grade === 'squad_incomplete') {
    narrative_lines.push(`⚠️ With only ${total} members on the rolls, this unit cannot form a complete squad. It exists below minimum operational threshold.`);
  } else if (capacity_grade === 'section_force') {
    narrative_lines.push(`This unit fields ${total} members — enough for small-unit operations, but well short of platoon strength (30+). Growth is needed before this can be considered a full-scale force.`);
  } else {
    narrative_lines.push(`This unit has ${total} registered members — platoon strength or above. They have the numbers to mount meaningful operations.`);
  }

  // Activity
  if (activityRatio < 0.3 && total > 0) {
    narrative_lines.push(`${active_this_month} of those members have shown any activity in the last 30 days. This unit is carrying a significant number of inactive operators on its books.`);
  } else if (activityRatio >= 0.7) {
    narrative_lines.push(`${active_this_month} of ${total} members were active in the last 30 days — a strong activity rate suggesting this is a genuinely engaged unit.`);
  } else if (total > 0) {
    narrative_lines.push(`${active_this_month} of ${total} members were active in the last 30 days. Activity levels are moderate.`);
  }

  // Discord
  if (!has_discord) {
    narrative_lines.push(`This unit has not linked a Discord server. Without a verified Discord presence, there is no way to assess real-time communication and cohesion.`);
  } else {
    narrative_lines.push(`A Discord server is linked, providing a baseline for organisational communication.`);
  }

  // Ops and AARs
  if (totalOps === 0) {
    narrative_lines.push(`No operations have been logged. This unit has no verifiable combat record on this platform.`);
  } else {
    narrative_lines.push(`${totalOps} operation${totalOps !== 1 ? 's' : ''} on record with ${completedOps} completed.`);
    if (aars.length === 0) {
      narrative_lines.push(`Despite this, no After-Action Reports have been filed. A unit that doesn't debrief doesn't improve.`);
    } else if (aarRatio >= 0.8) {
      narrative_lines.push(`${aars.length} AARs filed — this unit consistently documents and learns from its operations.`);
    } else {
      narrative_lines.push(`${aars.length} of ${totalOps} operations have AARs. AAR discipline could be stronger.`);
    }
  }

  // Page maintenance
  if (days_since_page_update !== null && days_since_page_update > 60) {
    narrative_lines.push(`The commander has not updated this unit's page in ${days_since_page_update} days. Active leadership maintains an active presence.`);
  }

  // Rep
  if (repReviews.length > 0 && avg_rep_score > 0) {
    const repLabel = avg_rep_score >= 70 ? 'positive' : avg_rep_score >= 50 ? 'mixed' : 'concerning';
    narrative_lines.push(`Peer reputation across ${repReviews.length} review${repReviews.length !== 1 ? 's' : ''} is ${repLabel} (${avg_rep_score}/100).`);
  } else {
    narrative_lines.push(`No peer reputation reviews have been recorded for this unit's members.`);
  }

  // Closing verdict
  if (status === 'green') {
    narrative_lines.push(`Overall this unit demonstrates solid readiness indicators. Active, organised, and maintaining an operational record.`);
  } else if (status === 'amber') {
    narrative_lines.push(`This unit shows potential but has notable gaps that should be addressed before it can be considered reliably combat ready.`);
  } else {
    narrative_lines.push(`Based on available data, this unit does not currently meet the threshold for operational readiness.`);
  }

  const narrative = narrative_lines.join(' ');

  return {
    status,
    readiness_pct,
    total,
    active_this_week,
    active_this_month,
    capacity_grade,
    total_ops: totalOps,
    completed_ops: completedOps,
    days_since_last_op,
    days_since_last_aar,
    days_since_last_training,
    days_since_page_update,
    avg_rep_score,
    avg_experience,
    review_count: repReviews.length,
    has_discord,
    has_steam,
    op_capability_tier,
    op_cap_score: Math.round(opCapScore),
    flags,
    narrative,
    narrative_lines,
  };
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

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

    // ── GET /stats/public ─────────────────────────────────────────────────
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

    // ── GET /stats/readiness/:groupId ─────────────────────────────────────
    if (method === 'GET' && parts[0] === 'readiness' && parts.length === 2) {
      const groupId = parts[1];
      const [roster, ops, aars, repReviews, group] = await Promise.all([
        base44.asServiceRole.entities.MilsimRoster.filter({ group_id: groupId }),
        base44.asServiceRole.entities.MilsimOp.filter({ group_id: groupId }),
        base44.asServiceRole.entities.MilsimAAR.filter({ group_id: groupId }),
        base44.asServiceRole.entities.OperatorReputation.filter({ group_id: groupId }),
        base44.asServiceRole.entities.MilsimGroup.get(groupId),
      ]);

      const report = buildReadinessReport({ roster, ops, aars, repReviews, group: group ?? {} });
      return Response.json(report);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[stats]', error);
    return Response.json({ error: error?.message ?? 'Unknown error' }, { status: 500 });
  }
});
