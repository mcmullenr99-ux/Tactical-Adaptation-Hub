/**
 * normaliseReadiness.ts — v10 alignment
 * ─────────────────────────────────────────────────────────────────────────────
 * Maps raw statsReadiness v10 API response into the stable NormalisedReadiness
 * interface used by MilsimGroup.tsx and MilsimManage.tsx.
 *
 * RULE: JSX must NEVER read raw API fields directly.
 *       If the backend shape changes, update THIS FILE ONLY.
 *
 * v10 CHANGES (gate-based tier system):
 *  - Top-level: readiness_pct, readiness_score, verified_total, total, status ('red'|'amber'|'green')
 *  - score_breakdown now has: manpower, activity, ops_history, op_recency, aar_discipline,
 *    training_doctrine, game_breadth, discord, page_maintenance, reputation, doctrine_bonus,
 *    combat_intel, joint_ops, accountability_delta
 *  - New top-level: score_tier, gate_qualified_tier, gate_results, joint_ops{}, roster_churn_90d
 *  - training{} and accountability{} are direct sub-objects (not nested under manpower/ops)
 *  - No more composite_grade / composite_score — use readiness_pct + status directly
 */

export interface NormalisedReadinessFlag {
  severity: string;   // 'red' | 'amber' | 'info'
  code: string;
  label: string;
  detail: string;
}

export interface NormalisedScoreBreakdown {
  manpower: number;
  activity: number;
  ops_history: number;
  op_recency: number;
  aar_discipline: number;
  training_doctrine: number;
  game_breadth: number;
  discord: number;
  page_maintenance: number;
  reputation: number;
  doctrine_bonus: number;
  combat_intel: number;
  joint_ops: number;
  accountability_delta: number;
  // legacy aliases
  operations: number;
  knowledge: number;
  integrity: number;
  accountability_adj: number;
}

export interface NormalisedReadiness {
  // ── Composite ─────────────────────────────────────────────────────────────
  readiness_pct: number;
  readiness_score: number;
  composite_score: number;        // alias of readiness_pct
  composite_grade: string;        // derived from status
  status: string;                 // display label: 'POOR'|'DEVELOPING'|'ADEQUATE'|'STRONG'|'EXCEPTIONAL'
  status_color: 'green' | 'amber' | 'red';

  // ── Capability ─────────────────────────────────────────────────────────────
  op_capability_tier: string;
  op_cap_score: number;
  op_capability_score: number;
  score_tier: string;             // uncapped score-based tier
  gate_qualified_tier: string;    // highest gate passed
  gate_results: Record<string, { pass: boolean; checks: Array<{ label: string; pass: boolean; value: any }> }>;

  // ── Manpower ───────────────────────────────────────────────────────────────
  total: number;
  verified_total: number;
  active_this_month: number;
  active_this_week: number;
  capacity_grade: string;

  // ── Operations ─────────────────────────────────────────────────────────────
  total_ops: number;
  completed_ops: number;
  valid_ops: number;
  days_since_last_op: number | null;
  days_since_last_aar: number | null;
  days_since_page_update: number | null;

  // ── Reputation ─────────────────────────────────────────────────────────────
  avg_rep_score: number;
  avg_experience: number;
  review_count: number;

  // ── Joint Ops ──────────────────────────────────────────────────────────────
  joint_ops: { confirmed_count: number; unique_opponents: number; win_rate: number };
  roster_churn_90d: number;

  // ── Flags & Narrative ──────────────────────────────────────────────────────
  flags: NormalisedReadinessFlag[];
  narrative: string;
  narrative_lines: string[];

  // ── Misc ───────────────────────────────────────────────────────────────────
  has_discord: boolean;
  win_rate: number | null;

  // ── Score breakdown ────────────────────────────────────────────────────────
  score_breakdown: NormalisedScoreBreakdown;

  // ── Raw sub-objects ────────────────────────────────────────────────────────
  training: any;
  accountability: any;
  anti_gaming: any;
  // legacy sub-object aliases
  manpower: any;
  activity: any;
  operations: any;
  reputation: any;
  integrity: any;
  combat_record: any;
}

function statusToColor(status: string): 'green' | 'amber' | 'red' {
  if (status === 'green') return 'green';
  if (status === 'amber') return 'amber';
  return 'red';
}

function pctToGrade(pct: number): string {
  if (pct >= 80) return 'exceptional';
  if (pct >= 60) return 'strong';
  if (pct >= 40) return 'adequate';
  if (pct >= 20) return 'developing';
  return 'poor';
}

function pctToLabel(pct: number): string {
  if (pct >= 80) return 'EXCEPTIONAL';
  if (pct >= 60) return 'STRONG';
  if (pct >= 40) return 'ADEQUATE';
  if (pct >= 20) return 'DEVELOPING';
  return 'POOR';
}

export function normaliseReadiness(raw: any): NormalisedReadiness {
  if (!raw || typeof raw !== 'object') {
    return {
      readiness_pct: 0, readiness_score: 0, composite_score: 0, composite_grade: 'poor',
      status: 'POOR', status_color: 'red',
      op_capability_tier: 'POOR', op_cap_score: 0, op_capability_score: 0,
      score_tier: 'POOR', gate_qualified_tier: 'POOR', gate_results: {},
      total: 0, verified_total: 0, active_this_month: 0, active_this_week: 0, capacity_grade: '',
      total_ops: 0, completed_ops: 0, valid_ops: 0,
      days_since_last_op: null, days_since_last_aar: null, days_since_page_update: null,
      avg_rep_score: 0, avg_experience: 0, review_count: 0,
      joint_ops: { confirmed_count: 0, unique_opponents: 0, win_rate: 0 }, roster_churn_90d: 0,
      flags: [], narrative: '', narrative_lines: [],
      has_discord: false, win_rate: null,
      score_breakdown: { manpower: 0, activity: 0, ops_history: 0, op_recency: 0, aar_discipline: 0, training_doctrine: 0, game_breadth: 0, discord: 0, page_maintenance: 0, reputation: 0, doctrine_bonus: 0, combat_intel: 0, joint_ops: 0, accountability_delta: 0, operations: 0, knowledge: 0, integrity: 0, accountability_adj: 0 },
      training: {}, accountability: {}, anti_gaming: {},
      manpower: {}, activity: {}, operations: {}, reputation: {}, integrity: {}, combat_record: null,
    };
  }

  const pct        = raw.readiness_pct ?? 0;
  const rawStatus  = raw.status ?? 'red';
  const color      = statusToColor(rawStatus);
  const grade      = pctToGrade(pct);
  const label      = pctToLabel(pct);

  const sb = raw.score_breakdown ?? {};
  const training       = raw.training ?? {};
  const accountability = raw.accountability ?? {};
  const antiGaming     = raw.anti_gaming ?? {};

  const scoreBreakdown: NormalisedScoreBreakdown = {
    manpower:           sb.manpower           ?? 0,
    activity:           sb.activity           ?? 0,
    ops_history:        sb.ops_history        ?? 0,
    op_recency:         sb.op_recency         ?? 0,
    aar_discipline:     sb.aar_discipline     ?? 0,
    training_doctrine:  sb.training_doctrine  ?? 0,
    game_breadth:       sb.game_breadth       ?? 0,
    discord:            sb.discord            ?? 0,
    page_maintenance:   sb.page_maintenance   ?? 0,
    reputation:         sb.reputation         ?? 0,
    doctrine_bonus:     sb.doctrine_bonus     ?? 0,
    combat_intel:       sb.combat_intel       ?? 0,
    joint_ops:          sb.joint_ops          ?? 0,
    accountability_delta: sb.accountability_delta ?? 0,
    // legacy aliases
    operations:         sb.ops_history        ?? 0,
    knowledge:          sb.training_doctrine  ?? 0,
    integrity:          0,
    accountability_adj: sb.accountability_delta ?? 0,
  };

  const flags: NormalisedReadinessFlag[] = (raw.flags ?? []).map((f: any, i: number) => ({
    severity: f.severity ?? (f.type === 'critical' ? 'red' : f.type === 'warn' ? 'amber' : 'info'),
    code:     f.code ?? f.label ?? `flag_${i}`,
    label:    f.label ?? '',
    detail:   f.detail ?? '',
  }));

  // Build rich narrative_lines from v10 data
  const narrativeLines: string[] = [];
  narrativeLines.push(`Tier: ${raw.op_capability_tier ?? 'POOR'}`);
  if (raw.gate_qualified_tier && raw.gate_qualified_tier !== raw.op_capability_tier) {
    narrativeLines.push(`Gate qualified: ${raw.gate_qualified_tier} — score capped to ${raw.op_capability_tier}`);
  }
  if (raw.score_tier && raw.score_tier !== raw.op_capability_tier) {
    narrativeLines.push(`Score-based tier: ${raw.score_tier}`);
  }
  if (raw.verified_total != null) narrativeLines.push(`Verified roster: ${raw.verified_total} operator${raw.verified_total !== 1 ? 's' : ''}`);
  if (raw.valid_ops > 0) narrativeLines.push(`Verified ops: ${raw.valid_ops}`);
  if (training.knowledge_grade && training.knowledge_grade !== 'none') narrativeLines.push(`Doctrine: ${training.knowledge_grade}`);
  if (raw.joint_ops?.confirmed_count > 0) narrativeLines.push(`Joint ops: ${raw.joint_ops.confirmed_count} confirmed (${raw.joint_ops.unique_opponents} unique opponents)`);
  if (raw.roster_churn_90d > 0) narrativeLines.push(`Roster churn (90d): ${raw.roster_churn_90d}%`);
  if (raw.win_rate != null) narrativeLines.push(`Internal win rate: ${raw.win_rate}%`);

  return {
    readiness_pct:       pct,
    readiness_score:     raw.readiness_score     ?? 0,
    composite_score:     pct,
    composite_grade:     grade,
    status:              label,
    status_color:        color,

    op_capability_tier:  raw.op_capability_tier  ?? 'POOR',
    op_cap_score:        Math.round(raw.op_cap_score ?? 0),
    op_capability_score: Math.round(raw.op_cap_score ?? 0),
    score_tier:          raw.score_tier          ?? 'POOR',
    gate_qualified_tier: raw.gate_qualified_tier ?? 'POOR',
    gate_results:        raw.gate_results        ?? {},

    total:               raw.total               ?? 0,
    verified_total:      raw.verified_total      ?? 0,
    active_this_month:   raw.active_this_month   ?? 0,
    active_this_week:    raw.active_this_week    ?? 0,
    capacity_grade:      raw.capacity_grade      ?? '',

    total_ops:           raw.total_ops           ?? 0,
    completed_ops:       raw.completed_ops       ?? 0,
    valid_ops:           raw.valid_ops           ?? 0,
    days_since_last_op:  raw.days_since_last_op  ?? null,
    days_since_last_aar: raw.days_since_last_aar ?? null,
    days_since_page_update: raw.days_since_page_update ?? null,

    avg_rep_score:       raw.avg_rep_score       ?? 0,
    avg_experience:      raw.avg_experience      ?? 0,
    review_count:        raw.review_count        ?? 0,

    joint_ops:           raw.joint_ops           ?? { confirmed_count: 0, unique_opponents: 0, win_rate: 0 },
    roster_churn_90d:    raw.roster_churn_90d    ?? 0,

    flags,
    narrative:           raw.narrative           ?? '',
    narrative_lines:     narrativeLines,

    has_discord:         raw.has_discord         ?? false,
    win_rate:            raw.win_rate            ?? null,

    score_breakdown:     scoreBreakdown,

    training,
    accountability,
    anti_gaming:         antiGaming,
    // legacy aliases
    manpower:            { verified_total: raw.verified_total, capacity_grade: raw.capacity_grade },
    activity:            { active_count: raw.active_this_month },
    operations:          { count: raw.total_ops },
    reputation:          { avg_raw: raw.avg_rep_score, score: raw.avg_rep_score * 20 },
    integrity:           { grade: antiGaming.integrity_grade ?? 'clean', score: antiGaming.integrity_score ?? 100 },
    combat_record:       null,
  };
}
