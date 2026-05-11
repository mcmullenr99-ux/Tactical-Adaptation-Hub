import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

async function getCallerUser(base44: any, req: Request) {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    return await base44.asServiceRole.entities.AppUser.get(payload.sub) ?? null;
  } catch { return null; }
}

function cors() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
}
function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors() } });
}

type CapTier = "SOF" | "SOC" | "STRATEGIC" | "OPERATIONAL" | "TACTICAL" | "LIMITED" | "POOR";

const CAP_TIER_NUMERIC: Record<CapTier, number> = {
  SOF: 7, SOC: 6, STRATEGIC: 5, OPERATIONAL: 4, TACTICAL: 3, LIMITED: 2, POOR: 1,
};

function getTier(pts: number): CapTier {
  if (pts >= 1200) return "SOF";
  if (pts >= 900)  return "SOC";
  if (pts >= 650)  return "STRATEGIC";
  if (pts >= 400)  return "OPERATIONAL";
  if (pts >= 200)  return "TACTICAL";
  if (pts >= 75)   return "LIMITED";
  return "POOR";
}

function calcDelta(outcome: 'win' | 'draw' | 'loss', myTier: CapTier, oppTier: CapTier): number {
  const myN = CAP_TIER_NUMERIC[myTier] ?? 1;
  const oppN = CAP_TIER_NUMERIC[oppTier] ?? 1;
  if (outcome === 'win') return Math.round(100 * (oppN / myN));
  if (outcome === 'draw') return Math.round(100 * (oppN / myN) * 0.4);
  return -25;
}

async function getOrCreateRecord(base44: any, groupId: string, groupName: string, groupTag: string) {
  const existing = await base44.asServiceRole.entities.GroupCombatRecord.filter({ group_id: groupId });
  if (existing.length > 0) return existing[0];
  return await base44.asServiceRole.entities.GroupCombatRecord.create({
    group_id: groupId,
    group_name: groupName,
    group_tag: groupTag,
    tier: "POOR",
    total_points: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    ops_played: 0,
    ops_cooperative: 0,
    win_rate: 0,
    current_streak: 0,
    best_streak: 0,
    season: '2026-S1',
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });

  try {
    const base44 = createClientFromRequest(req);
    const caller = await getCallerUser(base44, req);
    if (!caller) return json({ error: 'Authentication required' }, 401);

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // ── ISSUE CHALLENGE ──────────────────────────────────────
    if (action === 'issue_challenge') {
      const {
        challenger_group_id, challenger_group_name, challenger_group_tag,
        defender_group_id, defender_group_name, defender_group_tag,
        game, op_type, proposed_date, message
      } = body;

      if (!challenger_group_id || !defender_group_id) return json({ error: 'Missing group IDs' }, 400);
      if (challenger_group_id === defender_group_id) return json({ error: 'Cannot challenge your own unit' }, 400);

      // AUTH: verify caller is owner or active roster member of challenger group
      const challengerGroup = await base44.asServiceRole.entities.MilsimGroup.get(challenger_group_id).catch(() => null);
      if (!challengerGroup) return json({ error: 'Challenger group not found' }, 404);
      const isOwner = challengerGroup.owner_id === caller.id;
      if (!isOwner) {
        const rosterCheck = await base44.asServiceRole.entities.MilsimRoster.filter({ group_id: challenger_group_id, user_id: caller.id }).catch(() => []);
        const activeEntry = (rosterCheck as any[]).find((r: any) => (r.status ?? 'active').toLowerCase() === 'active');
        if (!activeEntry) return json({ error: 'You are not an active member of this unit' }, 403);
      }

      // ANTI-FRAUD: max 3 open challenges per challenger group
      const openChallenges = await base44.asServiceRole.entities.JointOpChallenge.filter({
        challenger_group_id,
        status: 'pending',
      });
      if (openChallenges.length >= 3) return json({ error: 'You already have 3 open challenges. Wait for responses before issuing more.' }, 400);

      // ANTI-FRAUD: no duplicate pending challenge to same defender
      const dupe = openChallenges.find((c: any) => c.defender_group_id === defender_group_id);
      if (dupe) return json({ error: 'You already have an open challenge against this unit.' }, 400);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const challenge = await base44.asServiceRole.entities.JointOpChallenge.create({
        challenger_group_id, challenger_group_name, challenger_group_tag: challenger_group_tag || '',
        defender_group_id, defender_group_name, defender_group_tag: defender_group_tag || '',
        game, op_type, proposed_date: proposed_date || null,
        message: message || '',
        status: 'pending',
        expires_at: expiresAt,
      });
      return json({ challenge });
    }

    // ── ACCEPT / DECLINE CHALLENGE ──────────────────────────
    if (action === 'accept' || action === 'decline') {
      const { challenge_id, note } = body;
      if (!challenge_id) return json({ error: 'challenge_id required' }, 400);

      const challenge = await base44.asServiceRole.entities.JointOpChallenge.get(challenge_id);
      if (!challenge) return json({ error: 'Challenge not found' }, 404);
      if (challenge.status !== 'pending') return json({ error: 'Challenge already resolved' }, 400);

      await base44.asServiceRole.entities.JointOpChallenge.update(challenge_id, {
        status: action === 'accept' ? 'accepted' : 'declined',
        response_note: note || '',
        responded_at: new Date().toISOString(),
      });

      if (action === 'accept') {
        // Create JointOp
        await base44.asServiceRole.entities.JointOp.create({
          challenge_id,
          group_a_id: challenge.challenger_group_id,
          group_a_name: challenge.challenger_group_name,
          group_a_tag: challenge.challenger_group_tag || '',
          group_b_id: challenge.defender_group_id,
          group_b_name: challenge.defender_group_name,
          group_b_tag: challenge.defender_group_tag || '',
          game: challenge.game,
          op_type: challenge.op_type,
          scheduled_at: challenge.proposed_date || null,
          status: 'scheduled',
          outcome: 'null',
          disputed: false,
          eyewitness_count: 0,
        });
      }
      return json({ ok: true });
    }

    // ── SUBMIT RESULT ────────────────────────────────────────
    if (action === 'submit_result') {
      const { op_id, outcome, outcome_note, submitted_by_group } = body;
      if (!op_id || !outcome) return json({ error: 'op_id and outcome required' }, 400);

      const op = await base44.asServiceRole.entities.JointOp.get(op_id);
      if (!op) return json({ error: 'Op not found' }, 404);
      if (op.status === 'completed') return json({ error: 'Op already completed' }, 400);

      // If no prior submission, record it and wait for confirmation
      if (!op.submitted_by) {
        await base44.asServiceRole.entities.JointOp.update(op_id, {
          outcome,
          outcome_note: outcome_note || '',
          submitted_by_group,
          status: 'in_progress',
        });
        return json({ ok: true, status: 'awaiting_confirmation' });
      }

      // Both submitted — check for conflict
      if (op.outcome !== outcome) {
        // ANTI-FRAUD: conflicting results → dispute
        await base44.asServiceRole.entities.JointOp.update(op_id, {
          status: 'disputed',
          disputed: true,
          dispute_reason: `Conflicting results: ${op.submitted_by_group} submitted "${op.outcome}", ${submitted_by_group} submitted "${outcome}"`,
          dispute_raised_by: 'system',
        });
        return json({ ok: true, status: 'disputed', message: 'Results conflict. Op has been flagged for admin review.' });
      }

      // Results match — finalise and award points
      const recA = await getOrCreateRecord(base44, op.group_a_id, op.group_a_name, op.group_a_tag || '');
      const recB = await getOrCreateRecord(base44, op.group_b_id, op.group_b_name, op.group_b_tag || '');

      const tierA = getTier(recA.total_points || 0);
      const tierB = getTier(recB.total_points || 0);

      // ANTI-FRAUD: tier gap >3 flagged
      if (Math.abs(CAP_TIER_NUMERIC[tierA] - CAP_TIER_NUMERIC[tierB]) > 2) {
        await base44.asServiceRole.entities.JointOp.update(op_id, {
          status: 'disputed',
          disputed: true,
          dispute_reason: `Tier gap (${tierA} vs ${tierB}) exceeds safe threshold. Flagged for admin review.`,
          dispute_raised_by: 'system',
        });
        return json({ ok: true, status: 'flagged', message: 'Op flagged for admin review due to large tier gap.' });
      }

      let deltaA = 0, deltaB = 0;
      let winsA = recA.wins || 0, lossesA = recA.losses || 0, drawsA = recA.draws || 0;
      let winsB = recB.wins || 0, lossesB = recB.losses || 0, drawsB = recB.draws || 0;
      let streakA = recA.current_streak || 0, streakB = recB.current_streak || 0;

      if (outcome === 'group_a_win') {
        deltaA = calcDelta('win', tierA, tierB);
        deltaB = calcDelta('loss', tierB, tierA);
        winsA++; lossesB++;
        streakA = Math.max(0, streakA) + 1;
        streakB = Math.min(0, streakB) - 1;
      } else if (outcome === 'group_b_win') {
        deltaA = calcDelta('loss', tierA, tierB);
        deltaB = calcDelta('win', tierB, tierA);
        lossesA++; winsB++;
        streakA = Math.min(0, streakA) - 1;
        streakB = Math.max(0, streakB) + 1;
      } else {
        deltaA = calcDelta('draw', tierA, tierB);
        deltaB = calcDelta('draw', tierB, tierA);
        drawsA++; drawsB++;
        streakA = 0; streakB = 0;
      }

      const newPtsA = Math.max(0, (recA.total_points || 0) + deltaA);
      const newPtsB = Math.max(0, (recB.total_points || 0) + deltaB);
      const opsA = (recA.ops_played || 0) + 1;
      const opsB = (recB.ops_played || 0) + 1;

      await Promise.all([
        base44.asServiceRole.entities.GroupCombatRecord.update(recA.id, {
          total_points: newPtsA,
          tier: getTier(newPtsA),
          wins: winsA, losses: lossesA, draws: drawsA,
          ops_played: opsA,
          win_rate: Math.round((winsA / opsA) * 100),
          current_streak: Math.abs(streakA),
          best_streak: Math.max(recA.best_streak || 0, Math.abs(streakA)),
          last_op_at: new Date().toISOString(),
        }),
        base44.asServiceRole.entities.GroupCombatRecord.update(recB.id, {
          total_points: newPtsB,
          tier: getTier(newPtsB),
          wins: winsB, losses: lossesB, draws: drawsB,
          ops_played: opsB,
          win_rate: Math.round((winsB / opsB) * 100),
          current_streak: Math.abs(streakB),
          best_streak: Math.max(recB.best_streak || 0, Math.abs(streakB)),
          last_op_at: new Date().toISOString(),
        }),
        base44.asServiceRole.entities.JointOp.update(op_id, {
          status: 'completed',
          outcome,
          confirmed_by_group: submitted_by_group,
          confirmed_at: new Date().toISOString(),
          group_a_points_delta: deltaA,
          group_b_points_delta: deltaB,
        }),
      ]);

      return json({ ok: true, status: 'completed', deltaA, deltaB });
    }

    // ── ADMIN: RESOLVE DISPUTE ──────────────────────────────
    if (action === 'resolve_dispute') {
      if (caller.role !== 'admin') return json({ error: 'Admin only' }, 403);
      const { op_id, outcome, admin_note } = body;
      if (!op_id || !outcome) return json({ error: 'op_id and outcome required' }, 400);

      const op = await base44.asServiceRole.entities.JointOp.get(op_id);
      if (!op) return json({ error: 'Op not found' }, 404);

      const recA = await getOrCreateRecord(base44, op.group_a_id, op.group_a_name, op.group_a_tag || '');
      const recB = await getOrCreateRecord(base44, op.group_b_id, op.group_b_name, op.group_b_tag || '');
      const tierA = getTier(recA.total_points || 0);
      const tierB = getTier(recB.total_points || 0);

      let deltaA = 0, deltaB = 0;
      let winsA = recA.wins || 0, lossesA = recA.losses || 0, drawsA = recA.draws || 0;
      let winsB = recB.wins || 0, lossesB = recB.losses || 0, drawsB = recB.draws || 0;
      let streakA = recA.current_streak || 0, streakB = recB.current_streak || 0;

      if (outcome === 'group_a_win') {
        deltaA = calcDelta('win', tierA, tierB); deltaB = calcDelta('loss', tierB, tierA);
        winsA++; lossesB++; streakA = Math.max(0, streakA) + 1; streakB = Math.min(0, streakB) - 1;
      } else if (outcome === 'group_b_win') {
        deltaA = calcDelta('loss', tierA, tierB); deltaB = calcDelta('win', tierB, tierA);
        lossesA++; winsB++; streakA = Math.min(0, streakA) - 1; streakB = Math.max(0, streakB) + 1;
      } else {
        deltaA = calcDelta('draw', tierA, tierB); deltaB = calcDelta('draw', tierB, tierA);
        drawsA++; drawsB++; streakA = 0; streakB = 0;
      }

      const newPtsA = Math.max(0, (recA.total_points || 0) + deltaA);
      const newPtsB = Math.max(0, (recB.total_points || 0) + deltaB);
      const opsA = (recA.ops_played || 0) + 1;
      const opsB = (recB.ops_played || 0) + 1;

      await Promise.all([
        base44.asServiceRole.entities.GroupCombatRecord.update(recA.id, {
          total_points: newPtsA, tier: getTier(newPtsA),
          wins: winsA, losses: lossesA, draws: drawsA, ops_played: opsA,
          win_rate: Math.round((winsA / opsA) * 100),
          current_streak: Math.abs(streakA), best_streak: Math.max(recA.best_streak || 0, Math.abs(streakA)),
          last_op_at: new Date().toISOString(),
        }),
        base44.asServiceRole.entities.GroupCombatRecord.update(recB.id, {
          total_points: newPtsB, tier: getTier(newPtsB),
          wins: winsB, losses: lossesB, draws: drawsB, ops_played: opsB,
          win_rate: Math.round((winsB / opsB) * 100),
          current_streak: Math.abs(streakB), best_streak: Math.max(recB.best_streak || 0, Math.abs(streakB)),
          last_op_at: new Date().toISOString(),
        }),
        base44.asServiceRole.entities.JointOp.update(op_id, {
          status: 'completed', outcome, disputed: false,
          outcome_note: admin_note || 'Resolved by admin',
          confirmed_by: caller.username, confirmed_by_group: 'admin',
          confirmed_at: new Date().toISOString(),
          group_a_points_delta: deltaA, group_b_points_delta: deltaB,
        }),
      ]);

      return json({ ok: true, deltaA, deltaB });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
