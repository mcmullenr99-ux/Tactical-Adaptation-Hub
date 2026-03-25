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

interface ReadinessFlag {
  severity: 'red' | 'amber';
  code: string;
  label: string;
  detail: string;
}

interface TrainingAssessment {
  doc_count: number;
  total_pages: number;
  avg_depth_score: number;
  has_sop: boolean;
  has_ttp: boolean;
  has_roe: boolean;
  has_drill: boolean;
  outdated_count: number;
  knowledge_factor: number;        // 0–100 composite
  knowledge_grade: 'expert' | 'proficient' | 'developing' | 'minimal' | 'none';
  knowledge_label: string;         // Human-readable verdict
  knowledge_detail: string;        // System narrative about the docs
}

interface ReadinessReport {
  status: 'green' | 'amber' | 'red';
  readiness_pct: number;
  total: number;
  active_this_week: number;
  active_this_month: number;
  capacity_grade: 'fireteam_incomplete' | 'squad_incomplete' | 'section_force' | 'platoon_plus';
  total_ops: number;
  completed_ops: number;
  days_since_last_op: number | null;
  days_since_last_aar: number | null;
  days_since_last_training: number | null;
  days_since_page_update: number | null;
  avg_rep_score: number;
  avg_experience: number;
  review_count: number;
  has_discord: boolean;
  has_steam: boolean;
  op_capability_tier: string;
  op_cap_score: number;
  training: TrainingAssessment;
  flags: ReadinessFlag[];
  narrative: string;
  narrative_lines: string[];
}

// ─── Training Intelligence Engine ──────────────────────────────────────────
function assessTrainingDocs(docs: any[]): TrainingAssessment {
  const now = Date.now();
  const DAY = 86_400_000;
  const STALE_DAYS = 180; // docs older than 6 months are considered outdated

  if (!docs || docs.length === 0) {
    return {
      doc_count: 0, total_pages: 0, avg_depth_score: 0,
      has_sop: false, has_ttp: false, has_roe: false, has_drill: false,
      outdated_count: 0, knowledge_factor: 0,
      knowledge_grade: 'none',
      knowledge_label: 'No Training Documentation',
      knowledge_detail: 'This unit has filed no training resources. Without documented procedures, tactics, or SOPs there is no basis for assessing doctrine or operator knowledge.',
    };
  }

  const activeDocs = docs.filter(d => d.is_current !== false);
  const doc_count = activeDocs.length;
  const total_pages = activeDocs.reduce((s: number, d: any) => s + (d.page_count ?? 1), 0);
  const outdated_count = activeDocs.filter((d: any) => {
    const ref = d.last_reviewed_at ?? d.updated_date ?? d.created_date;
    return ref && (now - new Date(ref).getTime()) > STALE_DAYS * DAY;
  }).length;

  const types = activeDocs.map((d: any) => d.doc_type ?? '');
  const has_sop   = types.some(t => t === 'SOP');
  const has_ttp   = types.some(t => t === 'TTP');
  const has_roe   = types.some(t => t === 'Rules of Engagement');
  const has_drill = types.some(t => t === 'Drill');

  // Compute per-doc depth scores and average
  const depthScores = activeDocs.map((d: any) => {
    let ds = d.depth_score ?? 0;
    if (!ds) {
      // Estimate depth from page count and word count if not stored
      const pages = d.page_count ?? 1;
      const words = d.word_count ?? 0;
      const wordsPerPage = pages > 0 && words > 0 ? words / pages : 300; // default 300 w/p
      // Dense docs (600+ wpp) score higher
      const densityFactor = Math.min(wordsPerPage / 600, 1.5);
      // Page count factor: 1–3 pages = basic, 4–10 = solid, 10+ = comprehensive
      const pageFactor = pages >= 10 ? 1 : pages >= 4 ? 0.7 : 0.4;
      ds = Math.round(Math.min(100, 40 + pageFactor * 40 + densityFactor * 20));
    }
    return ds;
  });
  const avg_depth_score = depthScores.length
    ? Math.round(depthScores.reduce((a: number, b: number) => a + b, 0) / depthScores.length)
    : 0;

  // ── Knowledge Factor (0–100) ─────────────────────────────────────────────
  // Volume (30pts): 1 doc = 5pts, 3 = 15pts, 5 = 25pts, 8+ = 30pts
  const volPts = Math.min(30, doc_count * (30 / 8));

  // Depth (30pts): avg depth score mapped linearly
  const depthPts = (avg_depth_score / 100) * 30;

  // Breadth (20pts): variety of doc types covered
  const typesPresent = [has_sop, has_ttp, has_roe, has_drill].filter(Boolean).length;
  const breadthPts = (typesPresent / 4) * 20;

  // Recency (20pts): penalise outdated docs
  const freshRatio = doc_count > 0 ? (doc_count - outdated_count) / doc_count : 0;
  const recencyPts = freshRatio * 20;

  const knowledge_factor = Math.round(Math.min(100, volPts + depthPts + breadthPts + recencyPts));

  const knowledge_grade: TrainingAssessment['knowledge_grade'] =
    knowledge_factor >= 80 ? 'expert' :
    knowledge_factor >= 60 ? 'proficient' :
    knowledge_factor >= 35 ? 'developing' :
    knowledge_factor > 0   ? 'minimal' : 'none';

  // System narrative
  const typeLabels = [has_sop && 'SOPs', has_ttp && 'TTPs', has_roe && 'Rules of Engagement', has_drill && 'Drills'].filter(Boolean).join(', ');
  let knowledge_label = '';
  let knowledge_detail = '';

  if (knowledge_grade === 'expert') {
    knowledge_label = 'Expert Knowledge Base';
    knowledge_detail = `This unit maintains ${doc_count} active training resource${doc_count !== 1 ? 's' : ''} spanning ${total_pages} pages with an average depth score of ${avg_depth_score}/100. ${typeLabels ? `Documentation covers ${typeLabels}.` : ''} ${outdated_count === 0 ? 'All resources are current and up to date.' : `${outdated_count} resource${outdated_count !== 1 ? 's' : ''} should be reviewed for currency.`} The volume, depth, and breadth of documented doctrine indicates a well-schooled, professional force with clear internal standards.`;
  } else if (knowledge_grade === 'proficient') {
    knowledge_label = 'Proficient — Solid Doctrine';
    knowledge_detail = `${doc_count} training resource${doc_count !== 1 ? 's' : ''} on file covering ${total_pages} page${total_pages !== 1 ? 's' : ''} (avg depth ${avg_depth_score}/100). ${typeLabels ? `Covers ${typeLabels}.` : ''} Documented procedures suggest this unit operates with defined standards. ${outdated_count > 0 ? `${outdated_count} document${outdated_count !== 1 ? 's are' : ' is'} overdue for review.` : 'Resources are current.'} Further depth and broader coverage would strengthen the knowledge base.`;
  } else if (knowledge_grade === 'developing') {
    knowledge_label = 'Developing — Limited Doctrine';
    knowledge_detail = `${doc_count} training resource${doc_count !== 1 ? 's' : ''} on file. ${typeLabels ? `Type coverage: ${typeLabels}.` : 'Limited variety of doc types.'} Average depth is ${avg_depth_score}/100 — documents may be brief or lacking in procedural detail. ${outdated_count > 0 ? `${outdated_count} resource${outdated_count !== 1 ? 's are' : ' is'} outdated and should be refreshed.` : ''} This unit is beginning to formalise its doctrine but has not yet reached a comprehensive standard.`;
  } else {
    knowledge_label = 'Minimal Documentation';
    knowledge_detail = `Only ${doc_count} training resource${doc_count !== 1 ? 's' : ''} filed. This is insufficient to demonstrate a credible doctrine framework. Commanders are encouraged to document SOPs, TTPs, and drill procedures to build a verifiable knowledge baseline.`;
  }

  return {
    doc_count, total_pages, avg_depth_score,
    has_sop, has_ttp, has_roe, has_drill,
    outdated_count, knowledge_factor,
    knowledge_grade, knowledge_label, knowledge_detail,
  };
}

function buildReadinessReport(params: {
  roster: any[]; ops: any[]; aars: any[];
  repReviews: any[]; group: any; trainingDocs: any[];
}): ReadinessReport {
  const { roster, ops, aars, repReviews, group, trainingDocs } = params;
  const now = Date.now();
  const DAY = 86_400_000;

  const total = roster.length;
  const active_this_week  = roster.filter((r: any) => r.updated_date && (now - new Date(r.updated_date).getTime()) < 7 * DAY).length;
  const active_this_month = roster.filter((r: any) => r.updated_date && (now - new Date(r.updated_date).getTime()) < 30 * DAY).length;

  const capacity_grade: ReadinessReport['capacity_grade'] =
    total < 4  ? 'fireteam_incomplete' :
    total < 9  ? 'squad_incomplete'    :
    total < 30 ? 'section_force'       :
                 'platoon_plus';

  const totalOps     = ops.length;
  const completedOps = ops.filter((o: any) => o.status === 'completed').length;

  function daysSince(isoDate: string | null | undefined): number | null {
    if (!isoDate) return null;
    const ms = now - new Date(isoDate).getTime();
    return ms > 0 ? Math.floor(ms / DAY) : 0;
  }

  const lastOpDate  = ops.length  ? ops.sort((a: any, b: any) => new Date(b.scheduled_at ?? b.created_date).getTime() - new Date(a.scheduled_at ?? a.created_date).getTime())[0].scheduled_at ?? ops[0].created_date : null;
  const lastAarDate = aars.length ? aars.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())[0].created_date : null;

  const days_since_last_op       = daysSince(lastOpDate ?? group.last_op_date);
  const days_since_last_aar      = daysSince(lastAarDate ?? group.last_aar_date);
  const days_since_last_training = daysSince(group.last_training_date);
  const days_since_page_update   = daysSince(group.last_page_update ?? group.updated_date);

  let avg_rep_score  = 0;
  let avg_experience = 0;
  const review_count = repReviews.length;
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

  const has_discord = !!(group.discordUrl ?? group.discord_url);
  const has_steam   = !!(group.steamGroupUrl ?? group.steam_group_url);

  // ── Training assessment ───────────────────────────────────────────────────
  const training = assessTrainingDocs(trainingDocs);

  // ── READINESS SCORING ─────────────────────────────────────────────────────
  let score = 50;

  if (capacity_grade === 'platoon_plus')        score += 25;
  else if (capacity_grade === 'section_force')  score += 10;
  else if (capacity_grade === 'squad_incomplete') score -= 15;
  else                                          score -= 25;

  const activityRatio = total > 0 ? active_this_month / total : 0;
  if (activityRatio >= 0.7)      score += 15;
  else if (activityRatio >= 0.4) score += 5;
  else if (activityRatio >= 0.2) score -= 5;
  else                           score -= 15;

  if (has_discord) score += 8; else score -= 8;

  if (totalOps >= 10)     score += 10;
  else if (totalOps >= 5) score += 5;
  else if (totalOps >= 1) score += 2;
  else                    score -= 5;

  const aarRatio = totalOps > 0 ? aars.length / totalOps : 0;
  if (aarRatio >= 0.8)      score += 10;
  else if (aarRatio >= 0.4) score += 5;
  else if (aarRatio >= 0.1) score += 2;
  else if (totalOps > 0)    score -= 10;

  if (days_since_last_op === null) score -= 5;
  else if (days_since_last_op <= 14)  score += 8;
  else if (days_since_last_op <= 30)  score += 4;
  else if (days_since_last_op <= 60)  score -= 2;
  else                                score -= 8;

  if (days_since_page_update === null) score -= 4;
  else if (days_since_page_update <= 7)   score += 8;
  else if (days_since_page_update <= 30)  score += 4;
  else if (days_since_page_update <= 90)  score -= 2;
  else                                    score -= 8;

  if (avg_rep_score >= 70)      score += 6;
  else if (avg_rep_score >= 50) score += 3;
  else if (avg_rep_score > 0)   score -= 3;

  const readiness_pct = Math.min(100, Math.max(0, Math.round(score)));

  const status: ReadinessReport['status'] =
    capacity_grade === 'fireteam_incomplete' ? 'red' :
    capacity_grade === 'squad_incomplete'    ? 'red' :
    readiness_pct >= 65 ? 'green' :
    readiness_pct >= 35 ? 'amber' : 'red';

  // ── OPERATIONAL CAPABILITY TIER ──────────────────────────────────────────
  // Now includes knowledge_factor as a 20pt input (was troop count 20pt, now 15pt)
  const opCapScore =
    (Math.min(totalOps, 20) / 20) * 30 +                    // op history (30pts)
    (avg_experience / 10) * 25 +                             // avg troop experience (25pts)
    (Math.min(total, 50) / 50) * 15 +                        // troop count (15pts)
    (aars.length > 0 ? Math.min(aarRatio, 1) : 0) * 10 +    // AAR culture (10pts)
    (training.knowledge_factor / 100) * 20;                  // training docs (20pts)

  // T1=Elite(green) > T2=Operational(yellow) > T3=Capable(amber) > T4=Limited(red) > T5=Under Developed(dark red)
  const op_capability_tier =
    opCapScore >= 80 ? 'T1' :
    opCapScore >= 60 ? 'T2' :
    opCapScore >= 40 ? 'T3' :
    opCapScore >= 20 ? 'T4' : 'T5';

  // ── FLAGS ─────────────────────────────────────────────────────────────────
  const flags: ReadinessFlag[] = [];

  // Manpower
  if (capacity_grade === 'fireteam_incomplete') {
    flags.push({ severity: 'red', code: 'CRITICAL_UNDERMANNED', label: 'Critical — Below Fireteam Strength',
      detail: 'Unit does not have enough personnel to form a minimum fireteam. No meaningful operation can be fielded at this strength.' });
  } else if (capacity_grade === 'squad_incomplete') {
    flags.push({ severity: 'red', code: 'UNDERMANNED', label: 'Below Squad Strength',
      detail: 'Unit does not have enough personnel to form a complete squad. Operational capacity is severely limited.' });
  } else if (capacity_grade === 'section_force') {
    flags.push({ severity: 'amber', code: 'LIMITED_STRENGTH', label: 'Section-Level Force Only',
      detail: 'Unit is above squad strength but has not yet reached platoon size. Suitable for small-scale section operations only.' });
  }

  // Discord
  if (!has_discord) {
    flags.push({ severity: 'red', code: 'NO_DISCORD', label: 'No Discord Server Linked',
      detail: 'No Discord server is linked to this group. Discord is the primary coordination and communication hub for milsim units.' });
  }

  // Activity
  if (activityRatio < 0.3 && total > 0) {
    flags.push({ severity: 'red', code: 'HIGH_INACTIVITY', label: 'High Member Inactivity',
      detail: 'The majority of this unit's roster has shown no recent activity. This suggests roster bloat, unit stagnation, or unreported departures.' });
  } else if (activityRatio < 0.5 && total > 0) {
    flags.push({ severity: 'amber', code: 'MODERATE_INACTIVITY', label: 'Moderate Member Inactivity',
      detail: 'Fewer than half of this unit's roster members have been recently active. Activity levels are below what is expected of an operational unit.' });
  }

  // Page maintenance
  if (days_since_page_update !== null && days_since_page_update > 60) {
    flags.push({ severity: 'amber', code: 'STALE_PAGE', label: 'Commander Not Maintaining Page',
      detail: 'This group profile has not been updated in over 60 days. A stale page signals an absent command posture.' });
  } else if (days_since_page_update !== null && days_since_page_update > 30) {
    flags.push({ severity: 'amber', code: 'PAGE_AGEING', label: 'Group Page Ageing',
      detail: 'This group profile has not been updated in over 30 days. Commanders should keep their unit page current.' });
  }

  // Operations
  if (totalOps === 0) {
    flags.push({ severity: 'amber', code: 'NO_OPS_HISTORY', label: 'No Operations Logged',
      detail: 'This unit has no logged operations. Without an operational record there is no basis for assessing real combat readiness.' });
  } else {
    if (aarRatio < 0.2 && totalOps >= 3) {
      flags.push({ severity: 'amber', code: 'POOR_AAR_DISCIPLINE', label: 'Low AAR Discipline',
        detail: 'The majority of this unit's operations have no After Action Report. AAR discipline demonstrates that commanders learn from each engagement.' });
    } else if (aarRatio < 0.5 && totalOps >= 2) {
      flags.push({ severity: 'amber', code: 'WEAK_AAR_DISCIPLINE', label: 'Inconsistent AAR Discipline',
        detail: 'Fewer than half of this unit's operations have an After Action Report filed. Consistent post-op documentation is expected of professional units.' });
    }
    if (days_since_last_op !== null && days_since_last_op > 45) {
      flags.push({ severity: 'amber', code: 'OPS_DORMANT', label: 'No Recent Operations',
        detail: 'This unit has not logged an operation in over 45 days. Extended inactivity suggests the unit may be dormant.' });
    } else if (days_since_last_op !== null && days_since_last_op > 30) {
      flags.push({ severity: 'amber', code: 'OPS_SLOWING', label: 'Operational Tempo Slowing',
        detail: 'This unit has not logged an operation in over 30 days. Active units are expected to maintain regular operational tempo.' });
    }
  }

  // Training docs
  if (training.knowledge_grade === 'none') {
    flags.push({ severity: 'amber', code: 'NO_TRAINING_DOCS', label: 'No Training Documentation Filed',
      detail: 'This unit has no training resources on file. Standard Operating Procedures, Tactics Techniques and Procedures, and drill documents are the primary evidence of a unit's knowledge base.' });
  } else if (training.knowledge_grade === 'minimal') {
    flags.push({ severity: 'amber', code: 'MINIMAL_TRAINING_DOCS', label: 'Training Documentation Insufficient',
      detail: 'This unit has minimal training documentation. The knowledge base is insufficient to demonstrate credible doctrine.' });
  } else if (training.outdated_count > 0) {
    flags.push({ severity: 'amber', code: 'STALE_TRAINING_DOCS', label: `${training.outdated_count} Training Doc${training.outdated_count !== 1 ? 's' : ''} Outdated`,
      detail: 'Some of this unit's training documents have not been reviewed in over 6 months. Outdated doctrine reflects procedures that may no longer be current.' });
  }

  // Reputation
  if (review_count === 0) {
    flags.push({ severity: 'amber', code: 'NO_REPUTATION_DATA', label: 'No Peer Reputation Reviews',
      detail: 'This unit has no peer reputation reviews. Without external validation from other commanders there is no basis for assessing peer standing.' });
  } else if (review_count < 3) {
    flags.push({ severity: 'amber', code: 'INSUFFICIENT_REPUTATION_DATA', label: 'Insufficient Reputation Sample',
      detail: `Only ${review_count} peer reputation review${review_count !== 1 ? 's' : ''} on file. A minimum of 3 reviews is needed to properly assess this unit's community standing.` });
  }

  // ── NARRATIVE ─────────────────────────────────────────────────────────────
  const narrative_lines: string[] = [];

  if (status === 'green') {
    narrative_lines.push('Overall this unit demonstrates solid readiness indicators. Active, organised, and maintaining an operational record.');
  } else {
    narrative_lines.push('Based on available data, this unit does not currently meet the threshold for operational readiness.');
  }

  if (training.knowledge_grade !== 'none') {
    narrative_lines.push(training.knowledge_detail);
  }

  const narrative = narrative_lines.join(' ');

  return {
    status, readiness_pct, total, active_this_week, active_this_month, capacity_grade,
    total_ops: totalOps, completed_ops: completedOps,
    days_since_last_op, days_since_last_aar, days_since_last_training, days_since_page_update,
    avg_rep_score, avg_experience, review_count,
    has_discord, has_steam,
    op_capability_tier, op_cap_score: Math.round(opCapScore),
    training,
    flags,
    narrative, narrative_lines,
  };
}

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

    if (method === 'GET' && parts[0] === 'readiness' && parts.length === 2) {
      const groupId = parts[1];
      const [roster, ops, aars, repReviews, group, trainingDocs] = await Promise.all([
        base44.asServiceRole.entities.MilsimRoster.filter({ group_id: groupId }),
        base44.asServiceRole.entities.MilsimOp.filter({ group_id: groupId }),
        base44.asServiceRole.entities.MilsimAAR.filter({ group_id: groupId }),
        base44.asServiceRole.entities.OperatorReputation.filter({ group_id: groupId }),
        base44.asServiceRole.entities.MilsimGroup.get(groupId),
        base44.asServiceRole.entities.TrainingDoc.filter({ group_id: groupId }),
      ]);
      const report = buildReadinessReport({ roster, ops, aars, repReviews, group: group ?? {}, trainingDocs: trainingDocs ?? [] });
      return Response.json(report);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[stats]', error);
    return Response.json({ error: error?.message ?? 'Unknown error' }, { status: 500 });
  }
});
