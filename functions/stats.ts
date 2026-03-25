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

  // ── READINESS SCORING (points from zero — nothing is free) ──────────────
  // Maximum = 100. A truly organised, active unit with full docs/ops/roster
  // can reach 100. An empty/new group starts and stays near 0.

  let score = 0;

  const activityRatio = total > 0 ? active_this_month / total : 0;

  // 1. MANPOWER (max 20pts) ─────────────────────────────────────────────────
  // Platoon+ (30+): 20 | Section (9–29): 10 | Squad incomplete (4–8): 4 | <4: 0
  if      (capacity_grade === 'platoon_plus')      score += 20;
  else if (capacity_grade === 'section_force')     score += 10;
  else if (capacity_grade === 'squad_incomplete')  score += 4;
  // fireteam_incomplete = 0pts

  // 2. MEMBER ACTIVITY (max 15pts) ──────────────────────────────────────────
  // Requires >50% active last 30 days to earn meaningful points
  if      (activityRatio >= 0.8) score += 15;
  else if (activityRatio >= 0.6) score += 10;
  else if (activityRatio >= 0.4) score += 5;
  else if (activityRatio >= 0.2) score += 2;
  // <20% active = 0pts

  // 3. OPERATIONS HISTORY (max 20pts) ───────────────────────────────────────
  // Must actually run ops. 1 op is almost nothing.
  const aarRatio = totalOps > 0 ? aars.length / totalOps : 0;
  if      (totalOps >= 20) score += 20;
  else if (totalOps >= 10) score += 14;
  else if (totalOps >= 5)  score += 8;
  else if (totalOps >= 3)  score += 4;
  else if (totalOps >= 1)  score += 2;
  // 0 ops = 0pts

  // 4. RECENCY OF OPERATIONS (max 10pts) ────────────────────────────────────
  // Dead units with old ops get nothing
  if      (days_since_last_op !== null && days_since_last_op <= 14)  score += 10;
  else if (days_since_last_op !== null && days_since_last_op <= 30)  score += 6;
  else if (days_since_last_op !== null && days_since_last_op <= 60)  score += 3;
  // no ops or >60 days = 0pts

  // 5. AAR DISCIPLINE (max 10pts) ────────────────────────────────────────────
  // Only awarded if ops exist. No ops = no AAR pts.
  if (totalOps >= 1) {
    if      (aarRatio >= 0.8) score += 10;
    else if (aarRatio >= 0.5) score += 6;
    else if (aarRatio >= 0.2) score += 3;
    else if (aarRatio > 0)    score += 1;
  }

  // 6. TRAINING DOCTRINE (max 15pts) ────────────────────────────────────────
  // Based on knowledge_factor from training docs engine
  score += Math.round((training.knowledge_factor / 100) * 15);

  // 7. DISCORD LINKED (max 5pts) ────────────────────────────────────────────
  if (has_discord) score += 5;

  // 8. PAGE MAINTENANCE (max 5pts) ──────────────────────────────────────────
  // Commander is actively updating the group profile
  if      (days_since_page_update !== null && days_since_page_update <= 14)  score += 5;
  else if (days_since_page_update !== null && days_since_page_update <= 30)  score += 3;
  else if (days_since_page_update !== null && days_since_page_update <= 90)  score += 1;

  // 9. REPUTATION / REVIEWS (max 5pts) ──────────────────────────────────────
  // Based on actual external peer reviews — minimum 3 reviews to earn full pts
  if (review_count >= 3 && avg_rep_score >= 70)      score += 5;
  else if (review_count >= 3 && avg_rep_score >= 50) score += 3;
  else if (review_count >= 1 && avg_rep_score >= 50) score += 2;
  else if (review_count >= 1)                        score += 1;

  const readiness_pct = Math.min(100, Math.max(0, Math.round(score)));

  // Green requires 75+, amber 45–74, red <45
  // Also force red if below squad strength regardless of score
  const status: ReadinessReport['status'] =
    (capacity_grade === 'fireteam_incomplete' || capacity_grade === 'squad_incomplete') ? 'red' :
    readiness_pct >= 75 ? 'green' :
    readiness_pct >= 45 ? 'amber' : 'red';

  // ── OPERATIONAL CAPABILITY TIER ──────────────────────────────────────────
  // Now includes knowledge_factor as a 20pt input (was troop count 20pt, now 15pt)
  const opCapScore =
    (Math.min(totalOps, 20) / 20) * 30 +                    // op history (30pts)
    (avg_experience / 10) * 25 +                             // avg troop experience (25pts)
    (Math.min(total, 50) / 50) * 15 +                        // troop count (15pts)
    (aars.length > 0 ? Math.min(aarRatio, 1) : 0) * 10 +    // AAR culture (10pts)
    (training.knowledge_factor / 100) * 20;                  // training docs (20pts)

  // Tier colour system: TIER I (platinum) > TIER II (gold) > TIER III (silver) > TIER IV (bronze) > FORMING
  const op_capability_tier =
    opCapScore >= 80 ? 'TIER I'   :
    opCapScore >= 60 ? 'TIER II'  :
    opCapScore >= 40 ? 'TIER III' :
    opCapScore >= 20 ? 'TIER IV'  : 'FORMING';

  // ── FLAGS ─────────────────────────────────────────────────────────────────
  const flags: ReadinessFlag[] = [];

  // 1. Manpower
  if (capacity_grade === 'fireteam_incomplete') {
    const needed = 4 - total;
    flags.push({ severity: 'red', code: 'CRITICAL_UNDERMANNED', label: 'Critical — Below Fireteam Strength',
      detail: `This unit has only ${total} member${total !== 1 ? 's' : ''} on roster — ${needed} short of a minimum fireteam (4). No meaningful operation can be assessed at this strength. Scoring 0/20 on manpower, directly capping composite readiness.` });
  } else if (capacity_grade === 'squad_incomplete') {
    const needed = 9 - total;
    flags.push({ severity: 'red', code: 'UNDERMANNED', label: 'Below Squad Strength',
      detail: `This unit has ${total} roster members — ${needed} short of a full squad (9). Below squad strength forces Red status regardless of all other scores, and earns only 4/20 manpower points. Operational capacity is limited to individual-level tasks only.` });
  } else if (capacity_grade === 'section_force') {
    const needed = 30 - total;
    flags.push({ severity: 'amber', code: 'LIMITED_STRENGTH', label: 'Section-Level Force Only',
      detail: `This unit fields ${total} members — ${needed} short of platoon size (30+). Earning 10/20 manpower points. Adequate for small-scale section operations but lacking the depth for sustained platoon-level engagements. Recruiting ${needed} more members would unlock the full 20 manpower points.` });
  }

  // 2. Discord
  if (!has_discord) {
    flags.push({ severity: 'red', code: 'NO_DISCORD', label: 'No Discord Server Linked',
      detail: 'No Discord server is linked — scoring 0/5 on the Discord category. Discord is the primary coordination and activity hub for milsim units. Its absence signals a lack of accessible command infrastructure. Link your server in the Group Info tab to recover these 5 points.' });
  }

  // 3. Activity
  if (activityRatio < 0.3 && total > 0) {
    const inactive = total - active_this_month;
    flags.push({ severity: 'red', code: 'HIGH_INACTIVITY', label: 'High Member Inactivity',
      detail: `Only ${active_this_month} of ${total} roster members (${Math.round(activityRatio * 100)}%) were active in the last 30 days — ${inactive} members inactive. Scoring 0/15 on activity. This suggests roster bloat or unit stagnation. Consider auditing the roster and removing ghost members. Reaching 40% active earns 5pts; 60% earns 10pts; 80%+ earns the full 15pts.` });
  } else if (activityRatio < 0.5 && total > 0) {
    const inactive = total - active_this_month;
    flags.push({ severity: 'amber', code: 'MODERATE_INACTIVITY', label: 'Moderate Member Inactivity',
      detail: `${active_this_month} of ${total} members (${Math.round(activityRatio * 100)}%) active in the last 30 days — ${inactive} currently inactive. Earning 5/15 on activity. Reaching 60% active would increase this to 10/15, and 80%+ achieves the full 15 points.` });
  }

  // 4. Page maintenance
  if (days_since_page_update !== null && days_since_page_update > 60) {
    flags.push({ severity: 'amber', code: 'STALE_PAGE', label: 'Commander Not Maintaining Page',
      detail: `Group profile has not been updated in ${days_since_page_update} days — scoring 0/5 on page maintenance. A stale page signals an absent command posture. Updating group info at least once every 30 days earns the full 5 points; within 90 days earns 1 point.` });
  } else if (days_since_page_update !== null && days_since_page_update > 30) {
    flags.push({ severity: 'amber', code: 'PAGE_AGEING', label: 'Group Page Ageing',
      detail: `Group profile was last updated ${days_since_page_update} days ago — earning 1/5 on page maintenance. Refreshing the profile within the last 30 days earns 3 points; within 14 days earns the full 5 points.` });
  }

  // 5. Operations
  if (totalOps === 0) {
    flags.push({ severity: 'amber', code: 'NO_OPS_HISTORY', label: 'No Operations Logged',
      detail: 'Zero operations logged — scoring 0/20 on operational history and 0/10 on op recency. These two categories represent 30pts of the 100pt readiness score and 55% of the capability tier score. Without an operational record there is no basis for assessing real combat readiness. Log your first op in the Ops tab to begin building your record.' });
  } else {
    if (aarRatio < 0.2 && totalOps >= 3) {
      const missing = totalOps - aars.length;
      flags.push({ severity: 'amber', code: 'POOR_AAR_DISCIPLINE', label: 'Low AAR Discipline',
        detail: `Only ${aars.length} AAR${aars.length !== 1 ? 's' : ''} for ${totalOps} operations — ${Math.round(aarRatio * 100)}% coverage. ${missing} op${missing !== 1 ? 's are' : ' is'} missing post-op reports, costing points in the 10pt AAR category. AARs demonstrate that commanders learn from each engagement. Filing AARs for past ops will recover these points.` });
    } else if (aarRatio < 0.5 && totalOps >= 2) {
      flags.push({ severity: 'amber', code: 'WEAK_AAR_DISCIPLINE', label: 'Inconsistent AAR Discipline',
        detail: `${aars.length} AAR${aars.length !== 1 ? 's' : ''} for ${totalOps} operations (${Math.round(aarRatio * 100)}% coverage). Below the 50% threshold for good points in the 10pt AAR category. Consistently filing AARs after each op is a hallmark of professional units.` });
    }
    if (days_since_last_op !== null && days_since_last_op > 45) {
      flags.push({ severity: 'amber', code: 'OPS_DORMANT', label: 'No Recent Operations',
        detail: `Last operation was ${days_since_last_op} days ago — scoring 0/10 on operational recency. Active units should be running regular ops. Running an op within the last 14 days earns the full 10pts; within 30 days earns 6pts; within 60 days earns 3pts.` });
    } else if (days_since_last_op !== null && days_since_last_op > 30) {
      flags.push({ severity: 'amber', code: 'OPS_SLOWING', label: 'Operational Tempo Slowing',
        detail: `Last operation was ${days_since_last_op} days ago — earning 3/10 on recency. Running an op within the next ${days_since_last_op - 14} days would bring this to the maximum 10 points.` });
    }
  }

  // 6. Training docs
  if (training.knowledge_grade === 'none') {
    flags.push({ severity: 'amber', code: 'NO_TRAINING_DOCS', label: 'No Training Documentation Filed',
      detail: `Zero training resources uploaded — scoring 0/15 on training doctrine (readiness) and 0/20 on training doctrine (capability tier). SOPs, TTPs, Rules of Engagement, and drill documents are the primary evidence of a unit's knowledge base. Filing even a single SOP will begin earning points in this category.` });
  } else if (training.knowledge_grade === 'minimal') {
    flags.push({ severity: 'amber', code: 'MINIMAL_TRAINING_DOCS', label: 'Training Documentation Insufficient',
      detail: `${training.doc_count} document${training.doc_count !== 1 ? 's' : ''} on file — knowledge factor ${training.knowledge_factor}/100, earning ~${Math.round((training.knowledge_factor / 100) * 15)}/15 on training doctrine. The knowledge base is too thin to demonstrate credible doctrine. Add more docs covering SOPs, TTPs, and drills to raise the score.` });
  } else if (training.outdated_count > 0) {
    const pct = training.doc_count > 0 ? Math.round((training.outdated_count / training.doc_count) * 100) : 0;
    flags.push({ severity: 'amber', code: 'STALE_TRAINING_DOCS', label: `${training.outdated_count} Training Doc${training.outdated_count !== 1 ? 's' : ''} Outdated`,
      detail: `${training.outdated_count} of ${training.doc_count} documents (${pct}%) are over 6 months since last review. Stale doctrine reduces the recency component of your knowledge factor. Review and update these documents to restore lost points. Outdated SOPs can be operationally misleading.` });
  }

  // 7. Reputation
  if (review_count === 0) {
    flags.push({ severity: 'amber', code: 'NO_REPUTATION_DATA', label: 'No Peer Reputation Reviews',
      detail: `No peer reputation reviews on file — scoring 0/5 on reputation. Reviews are submitted by commanders who have operated alongside this unit's members. Without external validation there is no basis for assessing peer standing. Participating in joint ops and encouraging peer reviews will unlock these points.` });
  } else if (review_count < 3) {
    flags.push({ severity: 'amber', code: 'INSUFFICIENT_REPUTATION_DATA', label: 'Insufficient Reputation Sample',
      detail: `Only ${review_count} reputation review${review_count !== 1 ? 's' : ''} on file. A minimum of 3 reviews is required for full reputation points. ${3 - review_count} more review${(3 - review_count) !== 1 ? 's' : ''} would allow proper peer standing assessment.` });
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
