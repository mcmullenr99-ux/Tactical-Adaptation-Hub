// statsReadiness.ts v10 — gate-based tier system with hard prerequisites
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';


const ACCOUNT_MIN_AGE_DAYS        = 14;
const REP_REVIEW_MIN_ACCOUNT_DAYS = 30;
const OP_MIN_RSVP_COUNT           = 2;
const AAR_MIN_PARTICIPANTS        = 2;
const BULK_UPDATE_THRESHOLD       = 0.5;
const TRAINING_DOC_MIN_DEPTH      = 35;

function runAntiGamingChecks(params: any): any {
  const { roster, rosterUsers, ops, rsvps, aars, repReviews, groupId, ownerUserId } = params;
  const now = Date.now();
  const DAY = 86_400_000;
  const userMap = new Map(rosterUsers.map((u: any) => [u.id, u]));
  const unverifiedIds = new Set<string>();
  let unverified_count = 0;
  for (const r of roster) {
    if (ownerUserId && r.user_id === ownerUserId) continue; // owner always verified
    const u = userMap.get(r.user_id);
    if (!u) { unverifiedIds.add(r.user_id); unverified_count++; continue; }
    const age = (now - new Date(u.created_date ?? u.created_at ?? 0).getTime()) / DAY;
    if (age < ACCOUNT_MIN_AGE_DAYS) { unverifiedIds.add(r.user_id); unverified_count++; }
  }
  const verified_roster_count = roster.length - unverified_count;
  const rsvpMap = new Map<string, Set<string>>();
  for (const rv of rsvps) {
    if (!rsvpMap.has(rv.event_id)) rsvpMap.set(rv.event_id, new Set());
    rsvpMap.get(rv.event_id)!.add(rv.user_id);
  }
  let excluded_ops_count = 0;
  const validOps = ops.filter((o: any) => {
    const attending = rsvpMap.get(o.id);
    const count = attending ? [...attending].filter(uid => !unverifiedIds.has(uid)).length : 0;
    if (count < OP_MIN_RSVP_COUNT) { excluded_ops_count++; return false; }
    return true;
  });
  const valid_ops_count = validOps.length;
  let excluded_aars_count = 0;
  const validAARs = aars.filter((a: any) => {
    const p = Array.isArray(a.participants) ? a.participants.length : (a.participants ? 1 : 0);
    if (p < AAR_MIN_PARTICIPANTS) { excluded_aars_count++; return false; }
    return true;
  });
  const valid_aars_count = validAARs.length;
  const updateDates = roster.map((r: any) => r.updated_date ? new Date(r.updated_date).toDateString() : null).filter(Boolean);
  const dateFreq: Record<string, number> = {};
  for (const d of updateDates) { dateFreq[d as string] = (dateFreq[d as string] ?? 0) + 1; }
  const maxSame = Math.max(...Object.values(dateFreq), 0);
  const bulk_update_ratio = roster.length > 0 ? maxSame / roster.length : 0;
  const bulk_roster_update = bulk_update_ratio >= BULK_UPDATE_THRESHOLD && roster.length >= 4;
  const repUserIds = new Set(roster.map((r: any) => r.user_id));
  let rep_reviews_filtered = 0;
  for (const rv of repReviews) {
    if (repUserIds.has(rv.reviewer_id)) { rep_reviews_filtered++; continue; }
    const u = userMap.get(rv.reviewer_id);
    if (u) {
      const age = (now - new Date(u.created_date ?? u.created_at ?? 0).getTime()) / DAY;
      if (age < REP_REVIEW_MIN_ACCOUNT_DAYS) rep_reviews_filtered++;
    }
  }
  const integritySignals: string[] = [];
  if (unverified_count > 0 && unverified_count / Math.max(roster.length, 1) > 0.5) integritySignals.push('high_unverified_ratio');
  if (bulk_roster_update) integritySignals.push('bulk_update');
  if (rep_reviews_filtered > 0) integritySignals.push('filtered_reviews');
  const integrity_score = Math.max(0, 100 - integritySignals.length * 20);
  const integrity_grade = integritySignals.length >= 3 ? 'suspect' : integritySignals.length >= 2 ? 'questionable' : 'clean';
  const roster_padded = unverified_count > 0 && unverified_count / Math.max(roster.length, 1) > 0.3;
  return {
    verified_roster_count, unverified_count, unverifiedIds, excluded_ops_count, valid_ops_count,
    excluded_aars_count, valid_aars_count, bulk_roster_update, bulk_update_ratio,
    rep_reviews_filtered, integrity_score, integrity_grade, roster_padded,
  };
}

function assessAccountability(params: any): any {
  const { conductReports, pios, roleFitnessReviews, loas, trainingReviews, rosterCount } = params;
  const openConducts   = (conductReports ?? []).filter((c: any) => !c.outcome || c.outcome === 'pending').length;
  const activePios     = (pios ?? []).filter((p: any) => p.status === 'active').length;
  const openFitness    = (roleFitnessReviews ?? []).filter((r: any) => !r.acknowledged_at).length;
  const activeLoas     = (loas ?? []).filter((l: any) => l.status === 'approved').length;
  const recentReviews  = (trainingReviews ?? []).length;
  let net = 0;
  if (openConducts > 0)  net -= Math.min(openConducts * 5, 15);
  if (activePios > 0)    net -= Math.min(activePios * 3, 9);
  if (openFitness > 0)   net -= Math.min(openFitness * 2, 6);
  if (activeLoas > 0 && rosterCount > 0) {
    const loaRatio = activeLoas / rosterCount;
    if (loaRatio > 0.5) net -= 8;
    else if (loaRatio > 0.25) net -= 4;
    else net += 3;
  }
  if (recentReviews > 0) net += Math.min(recentReviews * 2, 8);
  return {
    open_conduct_reports: openConducts, active_pios: activePios, open_fitness_reviews: openFitness,
    active_loas: activeLoas, recent_training_reviews: recentReviews,
    net_accountability_delta: net,
  };
}

function assessTrainingDocs(docs: any[]): any {
  if (!docs || docs.length === 0) {
    return {
      doc_count: 0, qualified_count: 0, excluded_thin_count: 0,
      knowledge_factor: 0, knowledge_grade: 'none',
      has_sop: false, has_ttp: false, has_roe: false, has_drill: false,
      avg_depth_score: 0, doc_types: [],
    };
  }
  const qualified = docs.filter((d: any) => (d.depth_score ?? 0) >= TRAINING_DOC_MIN_DEPTH);
  const excluded_thin_count = docs.length - qualified.length;
  const docTypes = [...new Set(qualified.map((d: any) => d.doc_type))];
  const has_sop   = docTypes.includes('SOP');
  const has_ttp   = docTypes.includes('TTP');
  const has_roe   = docTypes.includes('Rules of Engagement');
  const has_drill = docTypes.includes('Drill');
  const avgDepth = qualified.length > 0
    ? Math.round(qualified.reduce((s: number, d: any) => s + (d.depth_score ?? 0), 0) / qualified.length)
    : 0;
  let knowledge_factor = 0;
  if (qualified.length >= 10 && avgDepth >= 85 && docTypes.length >= 5) knowledge_factor = 120;
  else if (qualified.length >= 8 && avgDepth >= 80) knowledge_factor = 100;
  else if (qualified.length >= 6 && avgDepth >= 65) knowledge_factor = 80;
  else if (qualified.length >= 4 && avgDepth >= 50) knowledge_factor = 60;
  else if (qualified.length >= 2 && avgDepth >= 40) knowledge_factor = 35;
  else if (qualified.length >= 1) knowledge_factor = 15;
  const knowledge_grade =
    knowledge_factor >= 120 ? 'elite' :
    knowledge_factor >= 80  ? 'expert' :
    knowledge_factor >= 60  ? 'proficient' :
    knowledge_factor >= 35  ? 'developing' :
    knowledge_factor >= 15  ? 'minimal' : 'none';
  return {
    doc_count: qualified.length, qualified_count: qualified.length, excluded_thin_count,
    knowledge_factor, knowledge_grade, has_sop, has_ttp, has_roe, has_drill,
    avg_depth_score: avgDepth, doc_types: docTypes,
  };
}

const GAME_PROFILES: Record<string, any> = {
  'Arma 3':          { fullStrength: 20, adequate: 12, minimal: 6,  label: 'Arma 3',          category: 'large' },
  'Arma Reforger':   { fullStrength: 16, adequate: 10, minimal: 5,  label: 'Arma Reforger',   category: 'large' },
  'Squad':           { fullStrength: 20, adequate: 12, minimal: 6,  label: 'Squad',            category: 'large' },
  'Hell Let Loose':  { fullStrength: 20, adequate: 12, minimal: 6,  label: 'Hell Let Loose',   category: 'large' },
  'DayZ':            { fullStrength: 8,  adequate: 5,  minimal: 3,  label: 'DayZ',             category: 'small' },
  'Ground Branch':   { fullStrength: 8,  adequate: 5,  minimal: 3,  label: 'Ground Branch',    category: 'small' },
  'Ready Or Not':    { fullStrength: 5,  adequate: 4,  minimal: 2,  label: 'Ready Or Not',     category: 'small' },
  'Escape From Tarkov': { fullStrength: 5, adequate: 3, minimal: 2, label: 'EFT',              category: 'small' },
  'Gray Zone Warfare': { fullStrength: 8, adequate: 5, minimal: 3,  label: 'GZW',              category: 'small' },
  'Body Cam':        { fullStrength: 5,  adequate: 3,  minimal: 2,  label: 'Body Cam',         category: 'small' },
  'Operator':        { fullStrength: 5,  adequate: 3,  minimal: 2,  label: 'Operator',         category: 'small' },
  'Exfil':           { fullStrength: 5,  adequate: 3,  minimal: 2,  label: 'Exfil',            category: 'small' },
};
const DEFAULT_PROFILE = { fullStrength: 12, adequate: 8, minimal: 4, label: 'Unknown', category: 'unknown' };

function getCapacityProfile(games: string | string[] | undefined) {
  const list = Array.isArray(games) ? games : games ? [games] : [];
  for (const g of list) { if (GAME_PROFILES[g]) return GAME_PROFILES[g]; }
  return DEFAULT_PROFILE;
}

function getCapacityGrade(count: number, profile: any) {
  if (count >= profile.fullStrength) return 'full_strength';
  if (count >= profile.adequate)     return 'adequate';
  if (count >= profile.minimal)      return 'minimal';
  return 'undermanned';
}

function manpowerScore(verifiedTotal: number, gameProfile: any): number {
  if      (verifiedTotal >= gameProfile.fullStrength) return 30;
  else if (verifiedTotal >= gameProfile.adequate)     return 20;
  else if (verifiedTotal >= gameProfile.minimal)      return 10;
  else                                                return 0;
}

function getTierFromPoints(pts: number): number {
  if (pts >= 100) return 5;
  if (pts >= 60)  return 4;
  if (pts >= 30)  return 3;
  if (pts >= 10)  return 2;
  return 1;
}

function buildReadinessReport(params: any): any {
  const { roster, rosterUsers, ops, rsvps, aars, repReviews, group, trainingDocs, combatRecord,
          conductReports, pios, roleFitnessReviews, loas, trainingReviews, jointOps, roles, ranks,
          applications, discharges } = params;
  const now = Date.now();
  const DAY = 86_400_000;
  const ag = runAntiGamingChecks({ roster, rosterUsers, ops, rsvps, aars, repReviews, groupId: group.id, ownerUserId: group.owner_id });
  const total         = roster.length;
  const verifiedTotal = ag.verified_roster_count;
  const activityBase = roster.filter((r: any) => r.updated_date && (now - new Date(r.updated_date).getTime()) < 30 * DAY).length;
  const active_this_month = ag.bulk_roster_update
    ? Math.round(activityBase * (1 - ag.bulk_update_ratio))
    : activityBase;
  const active_this_week = roster.filter((r: any) => r.updated_date && (now - new Date(r.updated_date).getTime()) < 7 * DAY).length;
  const gameProfile      = getCapacityProfile(group.games ?? group.game);
  const capacityGradeNew = getCapacityGrade(verifiedTotal, gameProfile);
  const utilPct          = Math.round(Math.min(verifiedTotal / gameProfile.fullStrength, 1.0) * 100);
  const capacity_grade =
    capacityGradeNew === 'full_strength' ? 'platoon_plus' :
    capacityGradeNew === 'adequate'      ? 'section_force' :
    capacityGradeNew === 'minimal'       ? 'squad_incomplete' : 'fireteam_incomplete';
  const validOpsCount  = ag.valid_ops_count;
  const validAARsCount = ag.valid_aars_count;
  const totalOps       = ops.length;
  const completedOps   = ops.filter((o: any) => o.status === 'completed').length;
  const aarRatio       = validOpsCount > 0 ? validAARsCount / validOpsCount : 0;

  function daysSince(d: string | null | undefined): number | null {
    if (!d) return null;
    const ms = now - new Date(d).getTime();
    return ms > 0 ? Math.floor(ms / DAY) : 0;
  }

  const sortedOps  = [...ops].sort((a: any, b: any) => new Date(b.scheduled_at ?? b.created_date).getTime() - new Date(a.scheduled_at ?? a.created_date).getTime());
  const lastOpDate = sortedOps.length ? (sortedOps[0].scheduled_at ?? sortedOps[0].created_date) : null;
  const sortedAARs  = [...aars].sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
  const lastAarDate = sortedAARs.length ? sortedAARs[0].created_date : null;
  const days_since_last_op       = daysSince(lastOpDate ?? group.last_op_date);
  const days_since_last_aar      = daysSince(lastAarDate ?? group.last_aar_date);
  const days_since_last_training = daysSince(group.last_training_date);
  const days_since_page_update   = daysSince(group.last_page_update ?? group.updated_date);

  let avg_rep_score = 0, avg_experience = 0;
  const cleanRepReviews = repReviews.filter((r: any) => {
    const rosterUserIds = new Set(roster.map((m: any) => m.user_id));
    return !rosterUserIds.has(r.reviewer_id);
  });
  const clean_review_count = cleanRepReviews.length;
  if (clean_review_count > 0) {
    const expVals = cleanRepReviews.map((r: any) => r.experience ?? 5).filter((v: number) => v > 0);
    avg_experience = expVals.length ? Math.round((expVals.reduce((a: number, b: number) => a + b, 0) / expVals.length) * 10) / 10 : 0;
    const scores = cleanRepReviews.map((r: any) => ((r.activity ?? 5) + (r.attitude ?? 5) + (r.experience ?? 5) + (r.discipline ?? 5)) / 4 * 10);
    avg_rep_score = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
  }
  const has_discord = !!(group.discordUrl ?? group.discord_url);
  const has_steam   = !!(group.steamGroupUrl ?? group.steam_group_url);
  const training    = assessTrainingDocs(trainingDocs);
  const activityRatio = verifiedTotal > 0 ? active_this_month / verifiedTotal : 0;
  const accountability = assessAccountability({
    conductReports, pios, roleFitnessReviews, loas, trainingReviews,
    rosterCount: total,
  });

  // ── Joint Ops Analysis ──────────────────────────────────────────────────────
  const confirmedJointOps = (jointOps ?? []).filter((j: any) =>
    j.status === 'completed' && (j.group_a_id === group.id || j.group_b_id === group.id)
  );
  const confirmedJointOpsCount = confirmedJointOps.length;
  const uniqueOpponents = new Set<string>();
  let jointWins = 0;
  for (const j of confirmedJointOps) {
    const opponentId = j.group_a_id === group.id ? j.group_b_id : j.group_a_id;
    if (opponentId) uniqueOpponents.add(opponentId);
    const isGroupA = j.group_a_id === group.id;
    if (j.outcome === 'group_a_win' && isGroupA) jointWins++;
    if (j.outcome === 'group_b_win' && !isGroupA) jointWins++;
  }
  const uniqueOpponentCount = uniqueOpponents.size;
  const jointWinRate = confirmedJointOpsCount > 0 ? Math.round((jointWins / confirmedJointOpsCount) * 100) : 0;

  // ── Roster Churn (90-day) ──────────────────────────────────────────────────
  const ninetyDaysAgo = now - 90 * DAY;
  const recentDischarges = (discharges ?? []).filter((d: any) =>
    d.effective_date && new Date(d.effective_date).getTime() > ninetyDaysAgo
  ).length;
  const churnRate = total > 0 ? Math.round((recentDischarges / total) * 100) : 0;

  // ── Leadership Check ──────────────────────────────────────────────────────
  const officerRanks = new Set(
    (ranks ?? []).filter((r: any) => r.rank_class === 'officer' || r.rank_class === 'snco').map((r: any) => r.id)
  );
  const hasDefinedLeadership = (ranks ?? []).some((r: any) => r.rank_class === 'officer' || r.rank_class === 'snco');
  const leadershipFilled = roster.some((r: any) => officerRanks.has(r.rank_id));

  // ── Multi-game capability ─────────────────────────────────────────────────
  const gameList = Array.isArray(group.games) ? group.games as string[] : group.games ? [group.games as string] : [];
  const qualifiedGames = gameList.filter((g: string) => {
    const gp = GAME_PROFILES[g];
    return gp ? verifiedTotal >= gp.minimal : verifiedTotal >= 4;
  });
  const qualifiedGameCount = qualifiedGames.length;

  // ── LOA system in active use ───────────────────────────────────────────────
  const loaSystemActive = (loas ?? []).length > 0;

  // ── Application avg response ──────────────────────────────────────────────
  const processedApps = (applications ?? []).filter((a: any) =>
    a.status !== 'pending' && a.created_date && a.updated_date
  );
  let avgAppResponseDays = 999;
  if (processedApps.length > 0) {
    const totalMs = processedApps.reduce((s: number, a: any) =>
      s + (new Date(a.updated_date).getTime() - new Date(a.created_date).getTime()), 0
    );
    avgAppResponseDays = Math.round((totalMs / processedApps.length) / DAY);
  }

  // ── Group registration age ────────────────────────────────────────────────
  const groupAgeDays = daysSince(group.created_date) ?? 0;

  // ── TIER GATE EVALUATION ──────────────────────────────────────────────────
  // Returns the highest tier the unit QUALIFIES for based on hard prerequisites
  // Score still determines exact placement within that ceiling
  function evaluateTierGates(): { qualified_tier: string; gate_results: any } {
    const gates: Record<string, { pass: boolean; checks: any[] }> = {};

    // POOR → LIMITED
    gates['LIMITED'] = {
      pass: verifiedTotal >= 1,
      checks: [
        { label: '1 verified roster member', pass: verifiedTotal >= 1, value: verifiedTotal }
      ]
    };

    // LIMITED → TACTICAL
    gates['TACTICAL'] = {
      pass: verifiedTotal >= 3 && groupAgeDays >= 7,
      checks: [
        { label: '3 verified members', pass: verifiedTotal >= 3, value: verifiedTotal },
        { label: 'Registered 7+ days', pass: groupAgeDays >= 7, value: groupAgeDays }
      ]
    };

    // TACTICAL → OPERATIONAL
    gates['OPERATIONAL'] = {
      pass: verifiedTotal >= 8 && confirmedJointOpsCount >= 1 && groupAgeDays >= 30 && hasDefinedLeadership && leadershipFilled,
      checks: [
        { label: '8 verified members', pass: verifiedTotal >= 8, value: verifiedTotal },
        { label: '1 confirmed joint op', pass: confirmedJointOpsCount >= 1, value: confirmedJointOpsCount },
        { label: 'Registered 30+ days', pass: groupAgeDays >= 30, value: groupAgeDays },
        { label: 'Officer/leadership rank defined & filled', pass: hasDefinedLeadership && leadershipFilled, value: leadershipFilled }
      ]
    };

    // OPERATIONAL → STRATEGIC
    const hasTrainingDoc = (trainingDocs ?? []).length > 0;
    gates['STRATEGIC'] = {
      pass: verifiedTotal >= 15 && confirmedJointOpsCount >= 3 && jointWinRate >= 25 && groupAgeDays >= 60 && hasTrainingDoc,
      checks: [
        { label: '15 verified members', pass: verifiedTotal >= 15, value: verifiedTotal },
        { label: '3 confirmed joint ops', pass: confirmedJointOpsCount >= 3, value: confirmedJointOpsCount },
        { label: 'Joint op win rate ≥ 25%', pass: jointWinRate >= 25, value: jointWinRate + '%' },
        { label: 'Registered 60+ days', pass: groupAgeDays >= 60, value: groupAgeDays },
        { label: '1 training doc uploaded', pass: hasTrainingDoc, value: (trainingDocs ?? []).length }
      ]
    };

    // STRATEGIC → SOC
    const repAvgRaw = clean_review_count > 0 ? avg_rep_score / 10 : 0;
    const hasGoodRep = clean_review_count >= 1 && repAvgRaw >= 3.5;
    const noIntegrityFlags = ag.integrity_grade === 'clean';
    gates['SOC'] = {
      pass: verifiedTotal >= 25 && confirmedJointOpsCount >= 8 && jointWinRate >= 35 &&
            (training.knowledge_grade === 'proficient' || training.knowledge_grade === 'expert' || training.knowledge_grade === 'elite') &&
            uniqueOpponentCount >= 3 && churnRate <= 40 &&
            avgAppResponseDays <= 30 && hasGoodRep && noIntegrityFlags,
      checks: [
        { label: '25 verified members', pass: verifiedTotal >= 25, value: verifiedTotal },
        { label: '8 confirmed joint ops', pass: confirmedJointOpsCount >= 8, value: confirmedJointOpsCount },
        { label: 'Joint op win rate ≥ 35%', pass: jointWinRate >= 35, value: jointWinRate + '%' },
        { label: 'Knowledge grade ≥ Proficient', pass: training.knowledge_grade === 'proficient' || training.knowledge_grade === 'expert' || training.knowledge_grade === 'elite', value: training.knowledge_grade },
        { label: '3+ unique joint op opponents', pass: uniqueOpponentCount >= 3, value: uniqueOpponentCount },
        { label: 'Roster churn ≤ 40% (90d)', pass: churnRate <= 40, value: churnRate + '%' },
        { label: 'Applications processed within 30 days avg', pass: avgAppResponseDays <= 30, value: avgAppResponseDays === 999 ? 'N/A' : avgAppResponseDays + 'd' },
        { label: '1 reputation review ≥ 3.5 avg', pass: hasGoodRep, value: clean_review_count > 0 ? repAvgRaw.toFixed(1) : 'none' },
        { label: 'No active integrity flags', pass: noIntegrityFlags, value: ag.integrity_grade }
      ]
    };

    // SOC → SOF
    const repAvgHighRaw = clean_review_count > 0 ? avg_rep_score / 10 : 0;
    const hasHighRep = clean_review_count >= 1 && repAvgHighRaw >= 4.0;
    gates['SOF'] = {
      pass: verifiedTotal >= 40 && confirmedJointOpsCount >= 15 && jointWinRate >= 45 &&
            (training.knowledge_grade === 'proficient' || training.knowledge_grade === 'expert') &&
            uniqueOpponentCount >= 5 && qualifiedGameCount >= 2 &&
            churnRate <= 25 && loaSystemActive && hasHighRep &&
            aarRatio >= 0.6 && noIntegrityFlags,
      checks: [
        { label: '40 verified members', pass: verifiedTotal >= 40, value: verifiedTotal },
        { label: '15 confirmed joint ops', pass: confirmedJointOpsCount >= 15, value: confirmedJointOpsCount },
        { label: 'Joint op win rate ≥ 45%', pass: jointWinRate >= 45, value: jointWinRate + '%' },
        { label: 'Knowledge grade: Elite', pass: training.knowledge_grade === 'elite', value: training.knowledge_grade },
        { label: '5+ unique joint op opponents', pass: uniqueOpponentCount >= 5, value: uniqueOpponentCount },
        { label: 'Ops across 2+ games', pass: qualifiedGameCount >= 2, value: qualifiedGameCount },
        { label: 'Roster churn ≤ 25% (90d)', pass: churnRate <= 25, value: churnRate + '%' },
        { label: 'LOA system in active use', pass: loaSystemActive, value: loaSystemActive },
        { label: 'Reputation avg ≥ 4.0', pass: hasHighRep, value: clean_review_count > 0 ? repAvgHighRaw.toFixed(1) : 'none' },
        { label: 'AAR discipline ≥ 60%', pass: aarRatio >= 0.6, value: Math.round(aarRatio * 100) + '%' },
        { label: 'No active integrity flags', pass: noIntegrityFlags, value: ag.integrity_grade }
      ]
    };

    // SOF hold: requires Expert knowledge grade
    // Checked post-assignment in the main tier resolution

    // Walk tiers top-down and find the highest gate that passes
    const tierOrder = ['SOF', 'SOC', 'STRATEGIC', 'OPERATIONAL', 'TACTICAL', 'LIMITED', 'POOR'];
    for (const tier of tierOrder) {
      if (tier === 'POOR') return { qualified_tier: 'POOR', gate_results: gates };
      if (gates[tier]?.pass) return { qualified_tier: tier, gate_results: gates };
    }
    return { qualified_tier: 'POOR', gate_results: gates };
  }

  const { qualified_tier, gate_results } = evaluateTierGates();

  // ── Score-based tier (existing logic, now capped by gate) ─────────────────
  let score = 0;
  score += manpowerScore(verifiedTotal, gameProfile);
  if (verifiedTotal >= gameProfile.minimal) {
    if      (activityRatio >= 0.8) score += 25;
    else if (activityRatio >= 0.6) score += 18;
    else if (activityRatio >= 0.4) score += 10;
    else if (activityRatio >= 0.2) score += 4;
  }
  if      (validOpsCount >= 25) score += 35;
  else if (validOpsCount >= 15) score += 25;
  else if (validOpsCount >= 8)  score += 16;
  else if (validOpsCount >= 4)  score += 8;
  else if (validOpsCount >= 1)  score += 3;
  if      (days_since_last_op !== null && days_since_last_op <= 7)  score += 20;
  else if (days_since_last_op !== null && days_since_last_op <= 14) score += 16;
  else if (days_since_last_op !== null && days_since_last_op <= 30) score += 9;
  else if (days_since_last_op !== null && days_since_last_op <= 60) score += 4;
  if (validOpsCount >= 1) {
    if      (aarRatio >= 0.9) score += 25;
    else if (aarRatio >= 0.7) score += 18;
    else if (aarRatio >= 0.5) score += 10;
    else if (aarRatio >= 0.2) score += 4;
    else if (aarRatio > 0)    score += 2;
  }
  score += Math.round((training.knowledge_factor / 100) * 60);
  if (has_discord && verifiedTotal >= gameProfile.minimal) score += 10;
  if      (days_since_page_update !== null && days_since_page_update <= 14) score += 10;
  else if (days_since_page_update !== null && days_since_page_update <= 30) score += 6;
  else if (days_since_page_update !== null && days_since_page_update <= 60) score += 2;
  if      (clean_review_count >= 5 && avg_rep_score >= 75) score += 15;
  else if (clean_review_count >= 3 && avg_rep_score >= 70) score += 10;
  else if (clean_review_count >= 3 && avg_rep_score >= 50) score += 7;
  else if (clean_review_count >= 1 && avg_rep_score >= 50) score += 4;
  else if (clean_review_count >= 1)                        score += 2;
  let combatIntelPts = 0;
  let win_rate: number | null = null;
  let obj_rate: number | null = null;
  let effectiveness_score: number | null = null;
  let combat_aar_count = 0;
  try {
    const aarList = aars.filter((a: any) => a.outcome && a.outcome !== 'INCOMPLETE' && a.group_id === group.id);
    combat_aar_count = aarList.length;
    if (aarList.length >= 3) {
      const OUTCOME_WIN_W: Record<string, number> = { VICTORY: 1, 'PARTIAL VICTORY': 0.6, DRAW: 0.5, DEFEAT: 0, INCOMPLETE: 0 };
      const winPts = aarList.reduce((s: number, a: any) => s + (OUTCOME_WIN_W[a.outcome] ?? 0), 0);
      win_rate = Math.round((winPts / aarList.length) * 100);
      const aarWithObjs = aarList.filter((a: any) => (a.objectives_hit ?? 0) + (a.objectives_missed ?? 0) > 0);
      const objHit   = aarWithObjs.reduce((s: number, a: any) => s + (Number(a.objectives_hit) ?? 0), 0);
      const objTotal = aarWithObjs.reduce((s: number, a: any) => s + (Number(a.objectives_hit) ?? 0) + (Number(a.objectives_missed) ?? 0), 0);
      obj_rate = objTotal > 0 ? Math.round((objHit / objTotal) * 100) : null;
      const objRateForScore = obj_rate ?? 50;
      effectiveness_score = Math.round(win_rate * 0.6 + objRateForScore * 0.4);
      if      (effectiveness_score >= 75) combatIntelPts = 25;
      else if (effectiveness_score >= 60) combatIntelPts = 18;
      else if (effectiveness_score >= 40) combatIntelPts = 11;
      else if (effectiveness_score >= 20) combatIntelPts = 5;
      else                                combatIntelPts = 2;
    }
  } catch { combatIntelPts = 0; }
  score += combatIntelPts;
  let gameBreadthPts = 0;
  if      (qualifiedGameCount >= 5) gameBreadthPts = 15;
  else if (qualifiedGameCount >= 4) gameBreadthPts = 12;
  else if (qualifiedGameCount >= 3) gameBreadthPts = 8;
  else if (qualifiedGameCount >= 2) gameBreadthPts = 4;
  else if (qualifiedGameCount >= 1) gameBreadthPts = 1;
  score += gameBreadthPts;
  const doctrineBonusPts = (training.has_sop && training.has_ttp && training.has_roe && training.has_drill && training.avg_depth_score >= 70) ? 20 : 0;
  score += doctrineBonusPts;
  score += accountability.net_accountability_delta;
  const readiness_score = Math.min(350, Math.max(0, Math.round(score)));
  const readiness_pct   = Math.round((readiness_score / 350) * 100);
  const status =
    capacityGradeNew === 'undermanned' ? 'red' :
    readiness_pct >= 68 ? 'green' :
    readiness_pct >= 41 ? 'amber' : 'red';
  let jointOpsFactor = 0;
  if (combatRecord && combatRecord.ops_played >= 1) {
    const cr = combatRecord;
    const crTier: number = cr.tier ?? getTierFromPoints(cr.total_points ?? 0);
    const opsPlayed: number = cr.ops_played ?? 0;
    const winRate: number  = cr.win_rate ?? 0;
    const tierPts = Math.min(5, (crTier - 1) * 1.25);
    const volPts  = opsPlayed >= 10 ? 5 : opsPlayed >= 5 ? 3 : opsPlayed >= 2 ? 1.5 : 0.5;
    const wrPts   = winRate >= 65 ? 5 : winRate >= 50 ? 3.5 : winRate >= 35 ? 2 : 1;
    jointOpsFactor = Math.min(20, Math.round((tierPts + volPts + wrPts) * 10) / 10);
  }
  const opCapScore =
    (Math.min(validOpsCount, 20) / 20) * 30 +
    (avg_experience / 10) * 25 +
    (Math.min(utilPct, 100) / 100) * 15 +
    (validAARsCount > 0 ? Math.min(aarRatio, 1) : 0) * 10 +
    (training.knowledge_factor / 100) * 20 +
    jointOpsFactor;

  // Score-based tier (uncapped)
  const scoreTier =
    opCapScore >= 90 ? 'SOF'         :
    opCapScore >= 78 ? 'SOC'         :
    opCapScore >= 62 ? 'STRATEGIC'   :
    opCapScore >= 45 ? 'OPERATIONAL' :
    opCapScore >= 28 ? 'TACTICAL'    :
    opCapScore >= 12 ? 'LIMITED'     : 'POOR';

  // Final tier = min(score_tier, gate_tier)
  const TIER_RANK: Record<string, number> = { POOR: 0, LIMITED: 1, TACTICAL: 2, OPERATIONAL: 3, STRATEGIC: 4, SOC: 5, SOF: 6 };
  const scoreTierRank = TIER_RANK[scoreTier] ?? 0;
  const gateTierRank  = TIER_RANK[qualified_tier] ?? 0;
  let op_capability_tier = scoreTierRank <= gateTierRank ? scoreTier : qualified_tier;

  // SOF hold rule: Expert knowledge required — demote to SOC if not met
  if (op_capability_tier === 'SOF' && training.knowledge_grade !== 'elite') {
    op_capability_tier = 'SOC';
  }

  // ── Flags ─────────────────────────────────────────────────────────────────
  type ReadinessFlag = { severity: string; code: string; label: string; detail: string };
  const flags: ReadinessFlag[] = [];
  const primaryGame = gameProfile.label ?? 'Unknown';
  if (ag.integrity_grade === 'suspect') {
    flags.push({ severity: 'red', code: 'INTEGRITY_SUSPECT', label: 'Data Integrity: Suspect',
      detail: `Multiple data integrity signals detected. Integrity score: ${ag.integrity_score}/100. This group\'s readiness data shows patterns consistent with manipulation — results should be treated with significant caution.` });
  } else if (ag.integrity_grade === 'questionable') {
    flags.push({ severity: 'amber', code: 'INTEGRITY_QUESTIONABLE', label: 'Data Integrity: Questionable',
      detail: `Some data integrity concerns detected. Integrity score: ${ag.integrity_score}/100.` });
  }
  if (ag.roster_padded) {
    flags.push({ severity: 'amber', code: 'ROSTER_PADDING_SUSPECTED', label: 'Roster Padding Suspected',
      detail: `${ag.unverified_count} of ${total} roster members have accounts less than ${ACCOUNT_MIN_AGE_DAYS} days old (${Math.round((ag.unverified_count / total) * 100)}% of roster). Excluded from manpower scoring.` });
  } else if (ag.unverified_count > 0) {
    flags.push({ severity: 'info', code: 'ROSTER_MEMBERS_PENDING', label: `${ag.unverified_count} Roster Member${ag.unverified_count !== 1 ? 's' : ''} Pending Verification`,
      detail: `${ag.unverified_count} member${ag.unverified_count !== 1 ? 's' : ''} joined within the last ${ACCOUNT_MIN_AGE_DAYS} days and will be counted toward manpower once their accounts have been active for ${ACCOUNT_MIN_AGE_DAYS} days.` });
  }
  if (ag.bulk_roster_update) {
    flags.push({ severity: 'amber', code: 'SUSPICIOUS_BULK_UPDATE', label: 'Suspicious Bulk Roster Update Detected',
      detail: `${Math.round(ag.bulk_update_ratio * 100)}% of roster records updated on the same day. Activity score adjusted downward.` });
  }
  if (ag.excluded_ops_count > 0) {
    flags.push({ severity: 'amber', code: 'UNVERIFIED_OPS_EXCLUDED', label: `${ag.excluded_ops_count} Op${ag.excluded_ops_count !== 1 ? 's' : ''} Excluded — No RSVPs`,
      detail: `${ag.excluded_ops_count} operation${ag.excluded_ops_count !== 1 ? 's were' : ' was'} excluded — fewer than ${OP_MIN_RSVP_COUNT} confirmed attending RSVPs.` });
  }
  if (ag.excluded_aars_count > 0) {
    flags.push({ severity: 'amber', code: 'THIN_AARS_EXCLUDED', label: `${ag.excluded_aars_count} AAR${ag.excluded_aars_count !== 1 ? 's' : ''} Excluded — Insufficient Participants`,
      detail: `${ag.excluded_aars_count} AAR${ag.excluded_aars_count !== 1 ? 's were' : ' was'} excluded — fewer than ${AAR_MIN_PARTICIPANTS} participants listed.` });
  }
  if (ag.rep_reviews_filtered > 0) {
    flags.push({ severity: 'amber', code: 'REP_REVIEWS_FILTERED', label: `${ag.rep_reviews_filtered} Reputation Review${ag.rep_reviews_filtered !== 1 ? 's' : ''} Filtered`,
      detail: `${ag.rep_reviews_filtered} review${ag.rep_reviews_filtered !== 1 ? 's' : ''} excluded — conflict of interest or account too new.` });
  }
  if (training.excluded_thin_count > 0) {
    flags.push({ severity: 'amber', code: 'THIN_TRAINING_DOCS_EXCLUDED', label: `${training.excluded_thin_count} Training Doc${training.excluded_thin_count !== 1 ? 's' : ''} Excluded — Too Thin`,
      detail: `${training.excluded_thin_count} training document${training.excluded_thin_count !== 1 ? 's' : ''} below minimum depth threshold of ${TRAINING_DOC_MIN_DEPTH}/100.` });
  }
  if (capacityGradeNew === 'undermanned') {
    flags.push({ severity: 'red', code: 'CRITICAL_UNDERMANNED', label: `Undermanned — ${primaryGame}`,
      detail: `Only ${verifiedTotal} verified member${verifiedTotal !== 1 ? 's' : ''} — minimum ${gameProfile.minimal} required for ${primaryGame}.` });
  } else if (capacityGradeNew === 'minimal') {
    flags.push({ severity: 'red', code: 'UNDERMANNED', label: `Below Adequate Strength — ${primaryGame}`,
      detail: `${verifiedTotal} verified member${verifiedTotal !== 1 ? 's' : ''} — ${gameProfile.adequate - verifiedTotal} short of adequate strength for ${primaryGame}.` });
  } else if (capacityGradeNew === 'adequate') {
    flags.push({ severity: 'amber', code: 'LIMITED_STRENGTH', label: `Adequate but Below Full Strength — ${primaryGame}`,
      detail: `${verifiedTotal} of ${gameProfile.fullStrength} full-strength for ${primaryGame} — ${utilPct}% utilisation.` });
  }
  if (!has_discord) {
    flags.push({ severity: 'red', code: 'NO_DISCORD', label: 'No Discord Server Linked',
      detail: 'No Discord server linked. Connect one to improve your readiness score.' });
  }
  if (activityRatio < 0.3 && verifiedTotal > 0) {
    flags.push({ severity: 'red', code: 'HIGH_INACTIVITY', label: 'High Member Inactivity',
      detail: `Only ${Math.round(activityRatio * 100)}% of verified roster active in the last 30 days (${active_this_month}/${verifiedTotal}).` });
  } else if (activityRatio < 0.5 && verifiedTotal > 0) {
    flags.push({ severity: 'amber', code: 'MODERATE_INACTIVITY', label: 'Moderate Member Inactivity',
      detail: `${Math.round(activityRatio * 100)}% of roster active in the last 30 days (${active_this_month}/${verifiedTotal}).` });
  }
  if (days_since_page_update !== null && days_since_page_update > 60) {
    flags.push({ severity: 'amber', code: 'STALE_PAGE', label: 'Commander Not Maintaining Page',
      detail: `Group profile not updated in ${days_since_page_update} days.` });
  } else if (days_since_page_update !== null && days_since_page_update > 30) {
    flags.push({ severity: 'amber', code: 'PAGE_AGEING', label: 'Group Page Ageing',
      detail: `Group profile last updated ${days_since_page_update} days ago.` });
  }
  if (validOpsCount === 0) {
    flags.push({ severity: 'amber', code: 'NO_OPS_HISTORY', label: 'No Verified Operations Logged',
      detail: 'Zero operations with confirmed attendance logged.' });
  } else {
    if (aarRatio < 0.2 && validOpsCount >= 3) {
      flags.push({ severity: 'amber', code: 'POOR_AAR_DISCIPLINE', label: 'Low AAR Discipline',
        detail: `Only ${Math.round(aarRatio * 100)}% AAR coverage — ${validOpsCount - validAARsCount} op${(validOpsCount - validAARsCount) !== 1 ? 's are' : ' is'} missing post-op reports.` });
    } else if (aarRatio < 0.5 && validOpsCount >= 2) {
      flags.push({ severity: 'amber', code: 'WEAK_AAR_DISCIPLINE', label: 'Inconsistent AAR Discipline',
        detail: `${Math.round(aarRatio * 100)}% AAR coverage across ${validOpsCount} verified operations.` });
    }
    if (days_since_last_op !== null && days_since_last_op > 45) {
      flags.push({ severity: 'amber', code: 'OPS_DORMANT', label: 'No Recent Operations',
        detail: `Last operation was ${days_since_last_op} days ago.` });
    } else if (days_since_last_op !== null && days_since_last_op > 30) {
      flags.push({ severity: 'amber', code: 'OPS_SLOWING', label: 'Operational Tempo Slowing',
        detail: `Last operation was ${days_since_last_op} days ago.` });
    }
  }
  if (training.knowledge_grade === 'none') {
    flags.push({ severity: 'amber', code: 'NO_TRAINING_DOCS', label: 'No Training Documentation Filed',
      detail: 'Zero qualifying training resources uploaded — Training doctrine scores 0%.' });
  } else if (training.knowledge_grade === 'minimal') {
    flags.push({ severity: 'amber', code: 'MINIMAL_TRAINING_DOCS', label: 'Training Documentation Insufficient',
      detail: `${training.doc_count} qualifying document${training.doc_count !== 1 ? 's' : ''} on file. Upload more to improve doctrine score.` });
  } else if (training.knowledge_grade === 'developing') {
    flags.push({ severity: 'info', code: 'DEVELOPING_TRAINING_DOCS', label: 'Training Doctrine: Developing',
      detail: `${training.doc_count} qualifying documents on file. Average depth: ${training.avg_depth_score}/100. Continue adding depth to reach Proficient.` });
  }
  if (churnRate > 40) {
    flags.push({ severity: 'amber', code: 'HIGH_ROSTER_CHURN', label: 'High Roster Churn',
      detail: `${churnRate}% of roster discharged in last 90 days — indicates retention issues.` });
  }
  if (op_capability_tier === 'SOF' && training.knowledge_grade !== 'elite') {
    flags.push({ severity: 'amber', code: 'SOF_DOCTRINE_REQUIRED', label: 'SOF Hold: Expert Doctrine Required',
      detail: `Current knowledge grade is ${training.knowledge_grade}. Elite grade required to hold SOF tier.` });
  }

  // ── Narrative ─────────────────────────────────────────────────────────────
  const narrative_items: string[] = [];
  if (verifiedTotal > 0) narrative_items.push(`${verifiedTotal} verified operator${verifiedTotal !== 1 ? 's' : ''}`);
  if (confirmedJointOpsCount > 0) narrative_items.push(`${confirmedJointOpsCount} confirmed joint op${confirmedJointOpsCount !== 1 ? 's' : ''}`);
  if (training.knowledge_grade !== 'none') narrative_items.push(`${training.knowledge_grade} doctrine`);
  const narrative_lines = [
    `Tier: ${op_capability_tier}`,
    `Gate-qualified: ${qualified_tier}`,
    `Score-based tier: ${scoreTier}`,
    ...narrative_items,
  ];
  const narrative = narrative_lines.join(' | ');

  const manpowerPts   = manpowerScore(verifiedTotal, gameProfile);
  const activityPts   = verifiedTotal >= gameProfile.minimal
    ? (activityRatio >= 0.8 ? 25 : activityRatio >= 0.6 ? 18 : activityRatio >= 0.4 ? 10 : activityRatio >= 0.2 ? 4 : 0)
    : 0;
  const opHistoryPts  = validOpsCount >= 25 ? 35 : validOpsCount >= 15 ? 25 : validOpsCount >= 8 ? 16 : validOpsCount >= 4 ? 8 : validOpsCount >= 1 ? 3 : 0;
  const opRecencyPts  = days_since_last_op === null ? 0 : days_since_last_op <= 7 ? 20 : days_since_last_op <= 14 ? 16 : days_since_last_op <= 30 ? 9 : days_since_last_op <= 60 ? 4 : 0;
  const aarPts        = validOpsCount < 1 ? 0 : aarRatio >= 0.9 ? 25 : aarRatio >= 0.7 ? 18 : aarRatio >= 0.5 ? 10 : aarRatio >= 0.2 ? 4 : aarRatio > 0 ? 2 : 0;
  const trainingPts   = Math.round((training.knowledge_factor / 100) * 60);
  const discordPts    = has_discord && verifiedTotal >= gameProfile.minimal ? 10 : 0;
  const pagePts       = days_since_page_update === null ? 0 : days_since_page_update <= 14 ? 10 : days_since_page_update <= 30 ? 6 : days_since_page_update <= 60 ? 2 : 0;
  const repPts        = clean_review_count >= 5 && avg_rep_score >= 75 ? 15 : clean_review_count >= 3 && avg_rep_score >= 70 ? 10 : clean_review_count >= 3 && avg_rep_score >= 50 ? 7 : clean_review_count >= 1 && avg_rep_score >= 50 ? 4 : clean_review_count >= 1 ? 2 : 0;

  return {
    status, readiness_score, readiness_pct, total, verified_total: verifiedTotal,
    active_this_week, active_this_month,
    capacity_grade, capacity_utilisation_pct: utilPct, game_profile: gameProfile,
    total_ops: totalOps, valid_ops: validOpsCount, completed_ops: completedOps,
    days_since_last_op, days_since_last_aar, days_since_last_training, days_since_page_update,
    avg_rep_score, avg_experience, review_count: clean_review_count,
    has_discord, has_steam,
    op_capability_tier, op_cap_score: Math.round(opCapScore),
    score_tier: scoreTier, gate_qualified_tier: qualified_tier,
    win_rate, obj_rate, effectiveness_score, combat_aar_count,
    joint_ops: {
      confirmed_count: confirmedJointOpsCount,
      unique_opponents: uniqueOpponentCount,
      win_rate: jointWinRate,
    },
    roster_churn_90d: churnRate,
    leadership_defined: hasDefinedLeadership && leadershipFilled,
    loa_system_active: loaSystemActive,
    multi_game_capable: qualifiedGameCount >= 2,
    training, accountability, anti_gaming: ag, flags,
    gate_results,
    narrative, narrative_lines, narrative_items,
    score_breakdown: {
      manpower: manpowerPts, activity: activityPts, ops_history: opHistoryPts, op_recency: opRecencyPts,
      aar_discipline: aarPts, training_doctrine: trainingPts, game_breadth: gameBreadthPts,
      discord: discordPts, page_maintenance: pagePts, reputation: repPts,
      doctrine_bonus: doctrineBonusPts, combat_intel: combatIntelPts, joint_ops: Math.round(jointOpsFactor),
      accountability_delta: accountability.net_accountability_delta,
    },
  };
}


Deno.serve(async (req: Request) => {
  try {
    const base44 = createClientFromRequest(req);
    const url    = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/statsReadiness\//, '').split('/').filter(Boolean);

    if (req.method === 'GET' && parts[0] === 'readiness' && parts[1]) {
      const groupId = parts[1];

      const [group, roster, ops, aars, repReviews, trainingDocs, combatRecords,
             conductReports, pios, roleFitnessReviews, loas, trainingReviews,
             jointOpsA, jointOpsB, roles, ranks, applications, discharges] = await Promise.all([
        base44.asServiceRole.entities.MilsimGroup.get(groupId),
        base44.asServiceRole.entities.MilsimRoster.filter({ group_id: groupId }),
        base44.asServiceRole.entities.MilsimOp.filter({ group_id: groupId }),
        base44.asServiceRole.entities.MilsimAAR.filter({ group_id: groupId }),
        base44.asServiceRole.entities.OperatorReputation.filter({ group_id: groupId }),
        base44.asServiceRole.entities.TrainingDoc.filter({ group_id: groupId }),
        base44.asServiceRole.entities.GroupCombatRecord.filter({ group_id: groupId }).catch(() => []),
        base44.asServiceRole.entities.MilsimConductReport.filter({ group_id: groupId }).catch(() => []),
        base44.asServiceRole.entities.PerformanceImprovementOrder.filter({ group_id: groupId }).catch(() => []),
        base44.asServiceRole.entities.RoleFitnessReview.filter({ group_id: groupId }).catch(() => []),
        base44.asServiceRole.entities.MilsimLOA.filter({ group_id: groupId }).catch(() => []),
        base44.asServiceRole.entities.MilsimTrainingReview.filter({ group_id: groupId }).catch(() => []),
        base44.asServiceRole.entities.JointOp.filter({ group_a_id: groupId }).catch(() => []),
        base44.asServiceRole.entities.JointOp.filter({ group_b_id: groupId }).catch(() => []),
        base44.asServiceRole.entities.MilsimRole.filter({ group_id: groupId }).catch(() => []),
        base44.asServiceRole.entities.MilsimRank.filter({ group_id: groupId }).catch(() => []),
        base44.asServiceRole.entities.MilsimApplication.filter({ group_id: groupId }).catch(() => []),
        base44.asServiceRole.entities.MilsimDischarge.filter({ group_id: groupId }).catch(() => []),
      ]);

      if (!group) return new Response(JSON.stringify({ error: 'Group not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });

      // Merge joint ops from both sides, dedup by id
      const jointOpsMap = new Map<string, any>();
      for (const j of [...(jointOpsA ?? []), ...(jointOpsB ?? [])]) {
        if (j?.id) jointOpsMap.set(j.id, j);
      }
      const jointOps = [...jointOpsMap.values()];

      const combatRecord = Array.isArray(combatRecords) && combatRecords.length > 0 ? combatRecords[0] : null;
      const opIds = (ops ?? []).map((o: any) => o.id);
      let rsvps: any[] = [];
      if (opIds.length > 0) {
        const chunks: string[][] = [];
        for (let i = 0; i < opIds.length; i += 20) chunks.push(opIds.slice(i, i + 20));
        const results = await Promise.all(chunks.map((chunk: string[]) =>
          Promise.all(chunk.map((opId: string) =>
            base44.asServiceRole.entities.EventRSVP.filter({ event_id: opId }).catch(() => [])
          ))
        ));
        rsvps = results.flat(2);
      }

      const rosterList = roster ?? [];
      const userIds = [...new Set(rosterList.map((r: any) => r.user_id).filter(Boolean))];
      const rosterUsers: any[] = [];
      for (const uid of userIds) {
        try {
          const u = await base44.asServiceRole.entities.AppUser.get(uid);
          if (u) rosterUsers.push(u);
        } catch { /* skip */ }
      }

      const report = buildReadinessReport({
        roster: rosterList, rosterUsers,
        ops: ops ?? [], rsvps, aars: aars ?? [],
        repReviews: repReviews ?? [], group, trainingDocs: trainingDocs ?? [], combatRecord,
        conductReports: conductReports ?? [],
        pios: pios ?? [],
        roleFitnessReviews: roleFitnessReviews ?? [],
        loas: loas ?? [],
        trainingReviews: trainingReviews ?? [],
        jointOps,
        roles: roles ?? [],
        ranks: ranks ?? [],
        applications: applications ?? [],
        discharges: discharges ?? [],
      });

      return new Response(JSON.stringify(report), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'Internal error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
});
