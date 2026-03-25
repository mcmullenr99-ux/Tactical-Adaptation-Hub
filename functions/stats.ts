import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

// ─── ANTI-GAMING CONSTANTS ────────────────────────────────────────────────────
const ACCOUNT_MIN_AGE_DAYS        = 14;   // roster members must be this old to count toward manpower
const REP_REVIEW_MIN_ACCOUNT_DAYS = 30;   // reviewer account must be this old to count
const OP_MIN_RSVP_COUNT           = 2;    // ops need at least 2 attending RSVPs to count
const AAR_MIN_PARTICIPANTS        = 2;    // AARs need at least 2 participants to count
const BULK_UPDATE_THRESHOLD       = 0.5;  // if >50% of roster updated same day → suspicious
const TRAINING_DOC_MIN_DEPTH      = 20;   // docs scoring below this are excluded (spam filter)

// ─── INTERFACES ───────────────────────────────────────────────────────────────
interface ReadinessFlag {
  severity: 'red' | 'amber' | 'info';
  code: string;
  label: string;
  detail: string;
}

interface AntiGamingResult {
  roster_padded: boolean;           // suspicious account-age pattern
  bulk_roster_update: boolean;      // roster all updated same day
  bulk_update_ratio: number;        // ratio of same-day updates
  verified_roster_count: number;    // members who pass age gate
  unverified_count: number;         // members excluded due to age
  valid_ops_count: number;          // ops with real RSVPs
  excluded_ops_count: number;       // ops with no RSVPs (likely fake)
  valid_aars_count: number;         // AARs with real participants
  excluded_aars_count: number;      // AARs with no/few participants
  rep_reviews_filtered: number;     // reputation reviews excluded (too new / conflict of interest)
  integrity_score: number;          // 0–100 overall integrity confidence
  integrity_grade: 'verified' | 'credible' | 'questionable' | 'suspect';
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
  excluded_thin_count: number;      // docs excluded for being below min depth
  knowledge_factor: number;
  knowledge_grade: 'expert' | 'proficient' | 'developing' | 'minimal' | 'none';
  knowledge_label: string;
  knowledge_detail: string;
}

interface ReadinessReport {
  status: 'green' | 'amber' | 'red';
  readiness_pct: number;
  total: number;
  verified_total: number;           // manpower score is based on this, not raw total
  active_this_week: number;
  active_this_month: number;
  capacity_grade: 'fireteam_incomplete' | 'squad_incomplete' | 'section_force' | 'platoon_plus';
  capacity_utilisation_pct: number;
  game_profile: { game: string; fullStrength: number; adequate: number; minimal: number; label: string; category: string };
  total_ops: number;
  valid_ops: number;
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
  anti_gaming: AntiGamingResult;
  flags: ReadinessFlag[];
  narrative: string;
  narrative_lines: string[];
}

// ─── ANTI-GAMING ENGINE ───────────────────────────────────────────────────────
function runAntiGamingChecks(params: {
  roster: any[];
  rosterUsers: any[];
  ops: any[];
  rsvps: any[];
  aars: any[];
  repReviews: any[];
  groupId: string;
}): AntiGamingResult {
  const { roster, rosterUsers, ops, rsvps, aars, repReviews, groupId } = params;
  const now = Date.now();
  const DAY = 86_400_000;

  // Build user age map
  const userAgeMap: Record<string, number> = {};
  for (const u of rosterUsers) {
    if (u?.id && u?.created_date) {
      userAgeMap[u.id] = Math.floor((now - new Date(u.created_date).getTime()) / DAY);
    }
  }

  // 1. Account age gate — only count members whose account is old enough
  const verifiedRoster   = roster.filter(r => (userAgeMap[r.user_id] ?? 999) >= ACCOUNT_MIN_AGE_DAYS);
  const unverifiedCount  = roster.length - verifiedRoster.length;
  const rosterPadded     = unverifiedCount > 0 && (unverifiedCount / roster.length) > 0.3; // >30% new accounts = suspicious

  // 2. Bulk roster update detection — check if >50% updated on same calendar day
  let bulkUpdateRatio = 0;
  let bulkRosterUpdate = false;
  if (roster.length >= 4) {
    const dayCount: Record<string, number> = {};
    for (const r of roster) {
      if (r.updated_date) {
        const day = r.updated_date.substring(0, 10); // YYYY-MM-DD
        dayCount[day] = (dayCount[day] ?? 0) + 1;
      }
    }
    const maxSameDay = Math.max(...Object.values(dayCount));
    bulkUpdateRatio = maxSameDay / roster.length;
    bulkRosterUpdate = bulkUpdateRatio > BULK_UPDATE_THRESHOLD;
  }

  // 3. Op validity — must have >= 2 attending RSVPs from distinct users
  const rsvpsByOp: Record<string, Set<string>> = {};
  for (const r of rsvps) {
    if (r.status === 'attending' && r.event_id && r.user_id) {
      if (!rsvpsByOp[r.event_id]) rsvpsByOp[r.event_id] = new Set();
      rsvpsByOp[r.event_id].add(r.user_id);
    }
  }
  const validOps    = ops.filter(o => (rsvpsByOp[o.id]?.size ?? 0) >= OP_MIN_RSVP_COUNT);
  const excludedOps = ops.length - validOps.length;

  // 4. AAR validity — must list >= 2 participants
  const validAARs    = aars.filter(a => {
    const parts = a.participants;
    if (!parts) return false;
    if (Array.isArray(parts)) return parts.length >= AAR_MIN_PARTICIPANTS;
    if (typeof parts === 'string') {
      try { const p = JSON.parse(parts); return Array.isArray(p) && p.length >= AAR_MIN_PARTICIPANTS; } catch { return false; }
    }
    return false;
  });
  const excludedAARs = aars.length - validAARs.length;

  // 5. Reputation review filtering — exclude if reviewer account too new OR reviewer is in the group roster
  const rosterUserIds = new Set(roster.map((r: any) => r.user_id));
  const filteredRep = repReviews.filter(r => {
    const reviewerAge = userAgeMap[r.reviewer_id] ?? 999;
    const isMember    = rosterUserIds.has(r.reviewer_id);
    return reviewerAge >= REP_REVIEW_MIN_ACCOUNT_DAYS && !isMember;
  });
  const repFiltered = repReviews.length - filteredRep.length;

  // 6. Integrity score (0–100)
  let integrity = 100;
  if (rosterPadded)     integrity -= 25;
  if (bulkRosterUpdate) integrity -= 20;
  if (excludedOps > 0)  integrity -= Math.min(25, excludedOps * 8);
  if (excludedAARs > 0) integrity -= Math.min(15, excludedAARs * 5);
  if (repFiltered > 0)  integrity -= Math.min(15, repFiltered * 5);
  integrity = Math.max(0, integrity);

  const integrity_grade: AntiGamingResult['integrity_grade'] =
    integrity >= 85 ? 'verified' :
    integrity >= 65 ? 'credible' :
    integrity >= 40 ? 'questionable' : 'suspect';

  return {
    roster_padded: rosterPadded,
    bulk_roster_update: bulkRosterUpdate,
    bulk_update_ratio: Math.round(bulkUpdateRatio * 100) / 100,
    verified_roster_count: verifiedRoster.length,
    unverified_count: unverifiedCount,
    valid_ops_count: validOps.length,
    excluded_ops_count: excludedOps,
    valid_aars_count: validAARs.length,
    excluded_aars_count: excludedAARs,
    rep_reviews_filtered: repFiltered,
    integrity_score: integrity,
    integrity_grade,
  };
}

// ─── TRAINING INTELLIGENCE ENGINE ────────────────────────────────────────────
function assessTrainingDocs(docs: any[]): TrainingAssessment {
  const now = Date.now();
  const DAY = 86_400_000;
  const STALE_DAYS = 180;

  if (!docs || docs.length === 0) {
    return {
      doc_count: 0, total_pages: 0, avg_depth_score: 0,
      has_sop: false, has_ttp: false, has_roe: false, has_drill: false,
      outdated_count: 0, excluded_thin_count: 0, knowledge_factor: 0,
      knowledge_grade: 'none',
      knowledge_label: 'No Training Documentation',
      knowledge_detail: 'This unit has filed no training resources. Without documented procedures, tactics, or SOPs there is no basis for assessing doctrine or operator knowledge.',
    };
  }

  // Filter to active docs first
  const activeDocs = docs.filter(d => d.is_current !== false);

  // Compute depth for all, then exclude thin docs (anti-gaming: spam uploads)
  const scoredDocs = activeDocs.map((d: any) => {
    let ds = d.depth_score ?? 0;
    if (!ds) {
      const pages = d.page_count ?? 1;
      const words = d.word_count ?? 0;
      const wordsPerPage = pages > 0 && words > 0 ? words / pages : 300;
      const densityFactor = Math.min(wordsPerPage / 600, 1.5);
      const pageFactor = pages >= 10 ? 1 : pages >= 4 ? 0.7 : 0.4;
      ds = Math.round(Math.min(100, 40 + pageFactor * 40 + densityFactor * 20));
    }
    return { ...d, computed_depth: ds };
  });

  const qualifyingDocs    = scoredDocs.filter(d => d.computed_depth >= TRAINING_DOC_MIN_DEPTH);
  const excluded_thin_count = scoredDocs.length - qualifyingDocs.length;

  const doc_count   = qualifyingDocs.length;
  const total_pages = qualifyingDocs.reduce((s: number, d: any) => s + (d.page_count ?? 1), 0);
  const outdated_count = qualifyingDocs.filter((d: any) => {
    const ref = d.last_reviewed_at ?? d.updated_date ?? d.created_date;
    return ref && (now - new Date(ref).getTime()) > STALE_DAYS * DAY;
  }).length;

  const types   = qualifyingDocs.map((d: any) => d.doc_type ?? '');
  const has_sop   = types.some(t => t === 'SOP');
  const has_ttp   = types.some(t => t === 'TTP');
  const has_roe   = types.some(t => t === 'Rules of Engagement');
  const has_drill = types.some(t => t === 'Drill');

  const depthScores   = qualifyingDocs.map((d: any) => d.computed_depth);
  const avg_depth_score = depthScores.length
    ? Math.round(depthScores.reduce((a: number, b: number) => a + b, 0) / depthScores.length)
    : 0;

  const volPts      = Math.min(30, doc_count * (30 / 8));
  const depthPts    = (avg_depth_score / 100) * 30;
  const typesPresent = [has_sop, has_ttp, has_roe, has_drill].filter(Boolean).length;
  const breadthPts  = (typesPresent / 4) * 20;
  const freshRatio  = doc_count > 0 ? (doc_count - outdated_count) / doc_count : 0;
  const recencyPts  = freshRatio * 20;

  const knowledge_factor = Math.round(Math.min(100, volPts + depthPts + breadthPts + recencyPts));
  const knowledge_grade: TrainingAssessment['knowledge_grade'] =
    knowledge_factor >= 80 ? 'expert' :
    knowledge_factor >= 60 ? 'proficient' :
    knowledge_factor >= 35 ? 'developing' :
    knowledge_factor > 0   ? 'minimal' : 'none';

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
    outdated_count, excluded_thin_count,
    knowledge_factor, knowledge_grade, knowledge_label, knowledge_detail,
  };
}

// ─── GAME CAPACITY PROFILES ───────────────────────────────────────────────────
interface GameCapacityProfile {
  game: string;
  maxSquadSize: number;
  fullStrength: number;
  adequate: number;
  minimal: number;
  label: string;
  category: 'large_format' | 'squad_tactical' | 'small_unit' | 'solo_coop';
}

const GAME_CAPACITY_PROFILES: Record<string, GameCapacityProfile> = {
  "Arma 3":               { game: "Arma 3",               maxSquadSize: 50, fullStrength: 30, adequate: 15, minimal: 6,  label: "Platoon Strength (30+)",        category: 'large_format'   },
  "Arma Reforger":        { game: "Arma Reforger",         maxSquadSize: 40, fullStrength: 25, adequate: 12, minimal: 6,  label: "Platoon Strength (25+)",        category: 'large_format'   },
  "Hell Let Loose":       { game: "Hell Let Loose",        maxSquadSize: 50, fullStrength: 30, adequate: 15, minimal: 6,  label: "Platoon Strength (30+)",        category: 'large_format'   },
  "Post Scriptum":        { game: "Post Scriptum",         maxSquadSize: 40, fullStrength: 25, adequate: 12, minimal: 6,  label: "Platoon Strength (25+)",        category: 'large_format'   },
  "Squad":                { game: "Squad",                 maxSquadSize: 50, fullStrength: 18, adequate: 9,  minimal: 4,  label: "Section Strength (18+)",        category: 'squad_tactical' },
  "Insurgency: Sandstorm":{ game: "Insurgency: Sandstorm", maxSquadSize: 20, fullStrength: 12, adequate: 6,  minimal: 3,  label: "Squad Strength (12+)",          category: 'squad_tactical' },
  "Operator":             { game: "Operator",              maxSquadSize: 8,  fullStrength: 6,  adequate: 3,  minimal: 2,  label: "Full Team (6)",                 category: 'small_unit'    },
  "DayZ":                 { game: "DayZ",                  maxSquadSize: 60, fullStrength: 16, adequate: 8,  minimal: 3,  label: "Group Strength (16+)",          category: 'squad_tactical' },
  "Ground Branch":        { game: "Ground Branch",         maxSquadSize: 10, fullStrength: 8,  adequate: 4,  minimal: 2,  label: "Team Strength (8+)",            category: 'squad_tactical' },
  "GHPC":                 { game: "GHPC",                  maxSquadSize: 16, fullStrength: 8,  adequate: 4,  minimal: 2,  label: "Crew/Section Strength (8+)",    category: 'squad_tactical' },
  "DCS World":            { game: "DCS World",             maxSquadSize: 16, fullStrength: 8,  adequate: 4,  minimal: 2,  label: "Flight/Element Strength (8+)",  category: 'squad_tactical' },
  "Ready or Not":         { game: "Ready or Not",          maxSquadSize: 5,  fullStrength: 5,  adequate: 3,  minimal: 2,  label: "Full Team (5)",                 category: 'small_unit'    },
  "Escape from Tarkov":   { game: "Escape from Tarkov",    maxSquadSize: 5,  fullStrength: 5,  adequate: 3,  minimal: 2,  label: "Full Squad (5)",                category: 'small_unit'    },
  "Other":                { game: "Other",                 maxSquadSize: 20, fullStrength: 12, adequate: 6,  minimal: 3,  label: "Squad Strength (12+)",          category: 'squad_tactical' },
};
const DEFAULT_PROFILE = GAME_CAPACITY_PROFILES["Other"];

function getCapacityProfile(games: string[] | string | undefined): GameCapacityProfile {
  if (!games) return DEFAULT_PROFILE;
  const gameList = Array.isArray(games) ? games : [games];
  if (!gameList.length) return DEFAULT_PROFILE;
  let best: GameCapacityProfile | null = null;
  for (const g of gameList) {
    const profile = GAME_CAPACITY_PROFILES[g];
    if (profile && (!best || profile.fullStrength > best.fullStrength)) best = profile;
  }
  return best ?? DEFAULT_PROFILE;
}

type CapacityGrade = 'full_strength' | 'adequate' | 'minimal' | 'undermanned';

function getCapacityGrade(total: number, profile: GameCapacityProfile): CapacityGrade {
  if (total >= profile.fullStrength) return 'full_strength';
  if (total >= profile.adequate)     return 'adequate';
  if (total >= profile.minimal)      return 'minimal';
  return 'undermanned';
}

function manpowerScore(total: number, profile: GameCapacityProfile): number {
  const utilisation = Math.min(total / profile.fullStrength, 1.0);
  if (utilisation >= 1.0) return 20;
  const adequateRatio = profile.adequate / profile.fullStrength;
  const minimalRatio  = profile.minimal  / profile.fullStrength;
  if (utilisation >= adequateRatio)
    return Math.round(10 + (utilisation - adequateRatio) / (1 - adequateRatio) * 10);
  if (utilisation >= minimalRatio)
    return Math.round(4  + (utilisation - minimalRatio)  / (adequateRatio - minimalRatio) * 6);
  return Math.round(utilisation / minimalRatio * 4);
}

// ─── MAIN READINESS REPORT ────────────────────────────────────────────────────
function buildReadinessReport(params: {
  roster: any[];
  rosterUsers: any[];
  ops: any[];
  rsvps: any[];
  aars: any[];
  repReviews: any[];
  group: any;
  trainingDocs: any[];
}): ReadinessReport {
  const { roster, rosterUsers, ops, rsvps, aars, repReviews, group, trainingDocs } = params;
  const now = Date.now();
  const DAY = 86_400_000;

  // Run anti-gaming checks first — all scoring uses clean data
  const ag = runAntiGamingChecks({ roster, rosterUsers, ops, rsvps, aars, repReviews, groupId: group.id });

  // Use verified roster count for manpower scoring
  const total          = roster.length;
  const verifiedTotal  = ag.verified_roster_count;

  // Activity uses verified roster only (bulk update penalty)
  const activityBase = ag.bulk_roster_update
    ? roster.filter((r: any) => r.updated_date && (now - new Date(r.updated_date).getTime()) < 30 * DAY).length
    : roster.filter((r: any) => r.updated_date && (now - new Date(r.updated_date).getTime()) < 30 * DAY).length;
  const active_this_month = ag.bulk_roster_update
    ? Math.round(activityBase * (1 - ag.bulk_update_ratio)) // penalise proportionally
    : activityBase;
  const active_this_week = roster.filter((r: any) => r.updated_date && (now - new Date(r.updated_date).getTime()) < 7 * DAY).length;

  const gameProfile      = getCapacityProfile(group.games ?? group.game);
  const capacityGradeNew = getCapacityGrade(verifiedTotal, gameProfile); // use verified count
  const utilPct          = Math.round(Math.min(verifiedTotal / gameProfile.fullStrength, 1.0) * 100);

  const capacity_grade: ReadinessReport['capacity_grade'] =
    capacityGradeNew === 'full_strength' ? 'platoon_plus' :
    capacityGradeNew === 'adequate'      ? 'section_force' :
    capacityGradeNew === 'minimal'       ? 'squad_incomplete' : 'fireteam_incomplete';

  // Use only valid ops / valid AARs for scoring
  const validOpsCount = ag.valid_ops_count;
  const validAARsCount = ag.valid_aars_count;
  const totalOps     = ops.length;
  const completedOps = ops.filter((o: any) => o.status === 'completed').length;
  const aarRatio     = validOpsCount > 0 ? validAARsCount / validOpsCount : 0;

  function daysSince(d: string | null | undefined): number | null {
    if (!d) return null;
    const ms = now - new Date(d).getTime();
    return ms > 0 ? Math.floor(ms / DAY) : 0;
  }

  // Last op date — only from valid ops
  const validOps = ops.filter((o: any) => (ag.valid_ops_count > 0)); // use count from ag
  const sortedOps = [...ops].sort((a: any, b: any) => new Date(b.scheduled_at ?? b.created_date).getTime() - new Date(a.scheduled_at ?? a.created_date).getTime());
  const lastOpDate  = sortedOps.length ? (sortedOps[0].scheduled_at ?? sortedOps[0].created_date) : null;
  const sortedAARs  = [...aars].sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
  const lastAarDate = sortedAARs.length ? sortedAARs[0].created_date : null;

  const days_since_last_op       = daysSince(lastOpDate ?? group.last_op_date);
  const days_since_last_aar      = daysSince(lastAarDate ?? group.last_aar_date);
  const days_since_last_training = daysSince(group.last_training_date);
  const days_since_page_update   = daysSince(group.last_page_update ?? group.updated_date);

  // Reputation — use filtered reviews only
  let avg_rep_score = 0, avg_experience = 0;
  const review_count = ag.valid_aars_count; // reuse filtered count conceptually
  const cleanRepReviews = repReviews.filter(r => {
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

  // ─── SCORING (all using clean/verified data) ─────────────────────────────
  let score = 0;

  // Manpower (0–20): based on verified roster count
  score += manpowerScore(verifiedTotal, gameProfile);

  // Activity (0–15)
  if      (activityRatio >= 0.8) score += 15;
  else if (activityRatio >= 0.6) score += 10;
  else if (activityRatio >= 0.4) score += 5;
  else if (activityRatio >= 0.2) score += 2;

  // Ops history (0–20): uses valid op count only
  if      (validOpsCount >= 20) score += 20;
  else if (validOpsCount >= 10) score += 14;
  else if (validOpsCount >= 5)  score += 8;
  else if (validOpsCount >= 3)  score += 4;
  else if (validOpsCount >= 1)  score += 2;

  // Op recency (0–10)
  if      (days_since_last_op !== null && days_since_last_op <= 14) score += 10;
  else if (days_since_last_op !== null && days_since_last_op <= 30) score += 6;
  else if (days_since_last_op !== null && days_since_last_op <= 60) score += 3;

  // AAR discipline (0–10): uses valid AAR / valid op ratio
  if (validOpsCount >= 1) {
    if      (aarRatio >= 0.8) score += 10;
    else if (aarRatio >= 0.5) score += 6;
    else if (aarRatio >= 0.2) score += 3;
    else if (aarRatio > 0)    score += 1;
  }

  // Training (0–15)
  score += Math.round((training.knowledge_factor / 100) * 15);

  // Discord (0–5)
  if (has_discord) score += 5;

  // Page maintenance (0–5)
  if      (days_since_page_update !== null && days_since_page_update <= 14) score += 5;
  else if (days_since_page_update !== null && days_since_page_update <= 30) score += 3;
  else if (days_since_page_update !== null && days_since_page_update <= 90) score += 1;

  // Reputation (0–5): from clean reviews only
  if      (clean_review_count >= 3 && avg_rep_score >= 70) score += 5;
  else if (clean_review_count >= 3 && avg_rep_score >= 50) score += 3;
  else if (clean_review_count >= 1 && avg_rep_score >= 50) score += 2;
  else if (clean_review_count >= 1)                        score += 1;

  const readiness_pct = Math.min(100, Math.max(0, Math.round(score)));
  const status: ReadinessReport['status'] =
    capacityGradeNew === 'undermanned' ? 'red' :
    readiness_pct >= 75 ? 'green' :
    readiness_pct >= 45 ? 'amber' : 'red';

  const opCapScore =
    (Math.min(validOpsCount, 20) / 20) * 30 +
    (avg_experience / 10) * 25 +
    (Math.min(utilPct, 100) / 100) * 15 +
    (validAARsCount > 0 ? Math.min(aarRatio, 1) : 0) * 10 +
    (training.knowledge_factor / 100) * 20;

  const op_capability_tier =
    opCapScore >= 80 ? 'TIER I'   :
    opCapScore >= 60 ? 'TIER II'  :
    opCapScore >= 40 ? 'TIER III' :
    opCapScore >= 20 ? 'TIER IV'  : 'TIER V';

  // ─── FLAGS ───────────────────────────────────────────────────────────────
  const flags: ReadinessFlag[] = [];
  const gameName = Array.isArray(group.games) ? (group.games as string[]).join(', ') : (group.games ?? 'your game');
  const mPts = manpowerScore(verifiedTotal, gameProfile);

  // Anti-gaming integrity flags
  if (ag.integrity_grade === 'suspect') {
    flags.push({ severity: 'red', code: 'INTEGRITY_SUSPECT', label: 'Data Integrity: Suspect',
      detail: `Multiple data integrity signals detected. Integrity score: ${ag.integrity_score}/100. This group's readiness data shows patterns consistent with manipulation — results should be treated with significant caution.` });
  } else if (ag.integrity_grade === 'questionable') {
    flags.push({ severity: 'amber', code: 'INTEGRITY_QUESTIONABLE', label: 'Data Integrity: Questionable',
      detail: `Some data integrity concerns detected. Integrity score: ${ag.integrity_score}/100. One or more readiness signals show patterns that reduce confidence in the reported score.` });
  }

  if (ag.roster_padded) {
    flags.push({ severity: 'amber', code: 'ROSTER_PADDING_SUSPECTED', label: 'Roster Padding Suspected',
      detail: `${ag.unverified_count} of ${total} roster members have accounts less than ${ACCOUNT_MIN_AGE_DAYS} days old (${Math.round((ag.unverified_count / total) * 100)}% of roster). These members are excluded from manpower scoring until their accounts age in.` });
  } else if (ag.unverified_count > 0) {
    flags.push({ severity: 'info', code: 'ROSTER_MEMBERS_PENDING', label: `${ag.unverified_count} Roster Member${ag.unverified_count !== 1 ? 's' : ''} Pending Verification`,
      detail: `${ag.unverified_count} member${ag.unverified_count !== 1 ? 's' : ''} joined within the last ${ACCOUNT_MIN_AGE_DAYS} days and will be counted toward manpower once their accounts have been active for ${ACCOUNT_MIN_AGE_DAYS} days.` });
  }

  if (ag.bulk_roster_update) {
    flags.push({ severity: 'amber', code: 'SUSPICIOUS_BULK_UPDATE', label: 'Suspicious Bulk Roster Update Detected',
      detail: `${Math.round(ag.bulk_update_ratio * 100)}% of roster records were updated on the same day. This pattern is consistent with artificial activity inflation. Activity score has been adjusted downward accordingly.` });
  }

  if (ag.excluded_ops_count > 0) {
    flags.push({ severity: 'amber', code: 'UNVERIFIED_OPS_EXCLUDED', label: `${ag.excluded_ops_count} Op${ag.excluded_ops_count !== 1 ? 's' : ''} Excluded — No RSVPs`,
      detail: `${ag.excluded_ops_count} operation${ag.excluded_ops_count !== 1 ? 's were' : ' was'} excluded from scoring because ${ag.excluded_ops_count !== 1 ? 'they have' : 'it has'} fewer than ${OP_MIN_RSVP_COUNT} confirmed attending RSVPs. Only operations with real participant sign-ups count.` });
  }

  if (ag.excluded_aars_count > 0) {
    flags.push({ severity: 'amber', code: 'THIN_AARS_EXCLUDED', label: `${ag.excluded_aars_count} AAR${ag.excluded_aars_count !== 1 ? 's' : ''} Excluded — Insufficient Participants`,
      detail: `${ag.excluded_aars_count} AAR${ag.excluded_aars_count !== 1 ? 's were' : ' was'} excluded from scoring because ${ag.excluded_aars_count !== 1 ? 'they list' : 'it lists'} fewer than ${AAR_MIN_PARTICIPANTS} participants. AARs must document real attendance to count.` });
  }

  if (ag.rep_reviews_filtered > 0) {
    flags.push({ severity: 'amber', code: 'REP_REVIEWS_FILTERED', label: `${ag.rep_reviews_filtered} Reputation Review${ag.rep_reviews_filtered !== 1 ? 's' : ''} Filtered`,
      detail: `${ag.rep_reviews_filtered} reputation review${ag.rep_reviews_filtered !== 1 ? 's were' : ' was'} excluded — either submitted by current group members (conflict of interest) or from accounts less than ${REP_REVIEW_MIN_ACCOUNT_DAYS} days old.` });
  }

  if (training.excluded_thin_count > 0) {
    flags.push({ severity: 'amber', code: 'THIN_TRAINING_DOCS_EXCLUDED', label: `${training.excluded_thin_count} Training Doc${training.excluded_thin_count !== 1 ? 's' : ''} Excluded — Too Thin`,
      detail: `${training.excluded_thin_count} training document${training.excluded_thin_count !== 1 ? 's were' : ' was'} excluded from doctrine scoring because ${training.excluded_thin_count !== 1 ? 'their' : 'its'} depth score falls below the minimum threshold of ${TRAINING_DOC_MIN_DEPTH}/100. Only substantive documents count toward the knowledge grade.` });
  }

  // Standard readiness flags
  if (capacityGradeNew === 'undermanned') {
    const needed = gameProfile.minimal - verifiedTotal;
    flags.push({ severity: 'red', code: 'CRITICAL_UNDERMANNED', label: `Undermanned for ${gameName}`,
      detail: `This unit has only ${verifiedTotal} verified member${verifiedTotal !== 1 ? 's' : ''} on roster. For ${gameName}, the minimum for meaningful ops is ${gameProfile.minimal} — ${needed} short. Scoring ${mPts}/20 on manpower.` });
  } else if (capacityGradeNew === 'minimal') {
    const needed = gameProfile.adequate - verifiedTotal;
    flags.push({ severity: 'red', code: 'UNDERMANNED', label: `Below Adequate Strength for ${gameName}`,
      detail: `This unit has ${verifiedTotal} verified roster member${verifiedTotal !== 1 ? 's' : ''} — ${needed} short of adequate strength for ${gameName} (${gameProfile.adequate}+). Earning ${mPts}/20 on manpower.` });
  } else if (capacityGradeNew === 'adequate') {
    const needed = gameProfile.fullStrength - verifiedTotal;
    flags.push({ severity: 'amber', code: 'LIMITED_STRENGTH', label: `Adequate but Below Full Strength for ${gameName}`,
      detail: `This unit fields ${verifiedTotal} verified member${verifiedTotal !== 1 ? 's' : ''} — ${needed} short of full strength for ${gameName} (${gameProfile.fullStrength}). Earning ${mPts}/20 on manpower (${utilPct}% utilisation).` });
  }

  if (!has_discord) {
    flags.push({ severity: 'red', code: 'NO_DISCORD', label: 'No Discord Server Linked',
      detail: 'No Discord server is linked — scoring 0/5 on the Discord category.' });
  }
  if (activityRatio < 0.3 && verifiedTotal > 0) {
    const inactive = verifiedTotal - active_this_month;
    flags.push({ severity: 'red', code: 'HIGH_INACTIVITY', label: 'High Member Inactivity',
      detail: `Only ${active_this_month} of ${verifiedTotal} verified members (${Math.round(activityRatio * 100)}%) were active in the last 30 days — ${inactive} members inactive. Scoring 0/15 on activity.` });
  } else if (activityRatio < 0.5 && verifiedTotal > 0) {
    const inactive = verifiedTotal - active_this_month;
    flags.push({ severity: 'amber', code: 'MODERATE_INACTIVITY', label: 'Moderate Member Inactivity',
      detail: `${active_this_month} of ${verifiedTotal} members (${Math.round(activityRatio * 100)}%) active in the last 30 days — ${inactive} currently inactive.` });
  }
  if (days_since_page_update !== null && days_since_page_update > 60) {
    flags.push({ severity: 'amber', code: 'STALE_PAGE', label: 'Commander Not Maintaining Page',
      detail: `Group profile has not been updated in ${days_since_page_update} days — scoring 0/5 on page maintenance.` });
  } else if (days_since_page_update !== null && days_since_page_update > 30) {
    flags.push({ severity: 'amber', code: 'PAGE_AGEING', label: 'Group Page Ageing',
      detail: `Group profile was last updated ${days_since_page_update} days ago — earning 1/5 on page maintenance.` });
  }
  if (validOpsCount === 0) {
    flags.push({ severity: 'amber', code: 'NO_OPS_HISTORY', label: 'No Verified Operations Logged',
      detail: `Zero operations with confirmed attendance logged — scoring 0/20 on operational history and 0/10 on op recency.` });
  } else {
    if (aarRatio < 0.2 && validOpsCount >= 3) {
      const missing = validOpsCount - validAARsCount;
      flags.push({ severity: 'amber', code: 'POOR_AAR_DISCIPLINE', label: 'Low AAR Discipline',
        detail: `Only ${validAARsCount} valid AAR${validAARsCount !== 1 ? 's' : ''} for ${validOpsCount} verified operations — ${Math.round(aarRatio * 100)}% coverage. ${missing} op${missing !== 1 ? 's are' : ' is'} missing post-op reports.` });
    } else if (aarRatio < 0.5 && validOpsCount >= 2) {
      flags.push({ severity: 'amber', code: 'WEAK_AAR_DISCIPLINE', label: 'Inconsistent AAR Discipline',
        detail: `${validAARsCount} valid AAR${validAARsCount !== 1 ? 's' : ''} for ${validOpsCount} verified operations (${Math.round(aarRatio * 100)}% coverage).` });
    }
    if (days_since_last_op !== null && days_since_last_op > 45) {
      flags.push({ severity: 'amber', code: 'OPS_DORMANT', label: 'No Recent Operations',
        detail: `Last operation was ${days_since_last_op} days ago — scoring 0/10 on operational recency.` });
    } else if (days_since_last_op !== null && days_since_last_op > 30) {
      flags.push({ severity: 'amber', code: 'OPS_SLOWING', label: 'Operational Tempo Slowing',
        detail: `Last operation was ${days_since_last_op} days ago — earning 3/10 on recency.` });
    }
  }
  if (training.knowledge_grade === 'none') {
    flags.push({ severity: 'amber', code: 'NO_TRAINING_DOCS', label: 'No Training Documentation Filed',
      detail: 'Zero qualifying training resources uploaded — scoring 0/15 on training doctrine.' });
  } else if (training.knowledge_grade === 'minimal') {
    flags.push({ severity: 'amber', code: 'MINIMAL_TRAINING_DOCS', label: 'Training Documentation Insufficient',
      detail: `${training.doc_count} qualifying document${training.doc_count !== 1 ? 's' : ''} on file — knowledge factor ${training.knowledge_factor}/100.` });
  } else if (training.outdated_count > 0) {
    const pct = training.doc_count > 0 ? Math.round((training.outdated_count / training.doc_count) * 100) : 0;
    flags.push({ severity: 'amber', code: 'STALE_TRAINING_DOCS', label: `${training.outdated_count} Training Doc${training.outdated_count !== 1 ? 's' : ''} Outdated`,
      detail: `${training.outdated_count} of ${training.doc_count} documents (${pct}%) are over 6 months since last review.` });
  }
  if (clean_review_count === 0) {
    flags.push({ severity: 'amber', code: 'NO_REPUTATION_DATA', label: 'No Independent Reputation Reviews',
      detail: 'No peer reputation reviews from independent parties on file — scoring 0/5 on reputation.' });
  } else if (clean_review_count < 3) {
    flags.push({ severity: 'amber', code: 'INSUFFICIENT_REPUTATION_DATA', label: 'Insufficient Reputation Sample',
      detail: `Only ${clean_review_count} independent reputation review${clean_review_count !== 1 ? 's' : ''} on file. Minimum 3 required for full points.` });
  }

  const narrative_lines: string[] = [];
  if (status === 'green') narrative_lines.push('Overall this unit demonstrates solid readiness indicators. Active, organised, and maintaining a verified operational record.');
  else narrative_lines.push('Based on available data, this unit does not currently meet the threshold for operational readiness.');
  if (training.knowledge_grade !== 'none') narrative_lines.push(training.knowledge_detail);
  const narrative = narrative_lines.join(' ');

  return {
    status, readiness_pct, total, verified_total: verifiedTotal,
    active_this_week, active_this_month,
    capacity_grade, capacity_utilisation_pct: utilPct,
    game_profile: { game: gameProfile.game, fullStrength: gameProfile.fullStrength, adequate: gameProfile.adequate, minimal: gameProfile.minimal, label: gameProfile.label, category: gameProfile.category },
    total_ops: totalOps, valid_ops: validOpsCount, completed_ops: completedOps,
    days_since_last_op, days_since_last_aar, days_since_last_training, days_since_page_update,
    avg_rep_score, avg_experience, review_count: clean_review_count,
    has_discord, has_steam,
    op_capability_tier, op_cap_score: Math.round(opCapScore),
    training, anti_gaming: ag, flags, narrative, narrative_lines,
  };
}

// ─── HTTP HANDLER ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/stats/, '').split('/').filter(Boolean);

    if (req.method === 'GET' && parts[0] === 'readiness' && parts[1]) {
      const groupId = parts[1];

      const [group, roster, ops, aars, repReviews, trainingDocs, rsvps] = await Promise.all([
        base44.asServiceRole.entities.MilsimGroup.get(groupId),
        base44.asServiceRole.entities.MilsimRoster.filter({ group_id: groupId }),
        base44.asServiceRole.entities.MilsimOp.filter({ group_id: groupId }),
        base44.asServiceRole.entities.MilsimAAR.filter({ group_id: groupId }),
        base44.asServiceRole.entities.OperatorReputation.filter({ group_id: groupId }),
        base44.asServiceRole.entities.TrainingDoc.filter({ group_id: groupId }),
        base44.asServiceRole.entities.EventRSVP.filter({ }),  // all RSVPs — filter by op id in engine
      ]);

      if (!group) return new Response(JSON.stringify({ error: 'Group not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

      // Fetch User records for all roster members (for account age check)
      const rosterList = roster ?? [];
      const userIds = [...new Set(rosterList.map((r: any) => r.user_id).filter(Boolean))];
      const rosterUsers: any[] = [];
      for (const uid of userIds) {
        try {
          const u = await base44.asServiceRole.entities.User.get(uid);
          if (u) rosterUsers.push(u);
        } catch { /* skip */ }
      }

      const report = buildReadinessReport({
        roster: rosterList,
        rosterUsers,
        ops: ops ?? [],
        rsvps: rsvps ?? [],
        aars: aars ?? [],
        repReviews: repReviews ?? [],
        group,
        trainingDocs: trainingDocs ?? [],
      });

      return new Response(JSON.stringify(report), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
