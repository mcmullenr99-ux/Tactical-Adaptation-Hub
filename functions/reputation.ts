import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

// Minimum days a group must exist before reviews are allowed
const MIN_GROUP_AGE_DAYS = 30;
// Minimum days subject must be on the roster before they can be reviewed
const MIN_ROSTER_AGE_DAYS = 14;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

async function getCallerUser(base44: any, req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    return await base44.asServiceRole.entities.AppUser.get(payload.sub) ?? null;
  } catch { return null; }
}

function calcRepScore(reviews: any[]) {
  if (!reviews.length) return { activity: 0, attitude: 0, experience: 0, discipline: 0, overall: 0, grade: 'UNRATED', commends: 0, flags: 0, blacklisted: false, blacklist_reason: null };

  const commends        = reviews.filter(r => r.overall_vote === 'commend').length;
  const flags           = reviews.filter(r => r.overall_vote === 'flag').length;
  const blacklistReview = reviews.find(r => r.blacklisted === true);

  const avg = (field: string) => {
    const vals = reviews.map(r => r[field]).filter(v => typeof v === 'number');
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
  };

  const activity   = avg('activity');
  const attitude   = avg('attitude');
  const experience = avg('experience');
  const discipline = avg('discipline');
  const catAvg     = (activity + attitude + experience + discipline) / 4;
  const voteScore  = ((commends - flags) / reviews.length) * 20;
  const overall    = Math.min(100, Math.max(0, Math.round(catAvg * 10 + voteScore)));

  const grade =
    blacklistReview ? 'BLACKLISTED' :
    overall >= 85   ? 'ELITE'       :
    overall >= 70   ? 'TRUSTED'     :
    overall >= 50   ? 'STANDARD'    :
    overall >= 30   ? 'CAUTION'     : 'HIGH RISK';

  return { activity, attitude, experience, discipline, overall, grade, commends, flags, blacklisted: !!blacklistReview, blacklist_reason: blacklistReview?.blacklist_reason ?? null };
}

function daysSince(d: string | null | undefined): number {
  if (!d) return 0;
  return (Date.now() - new Date(d).getTime()) / 86400000;
}

// Shared validation for score fields
function validateScores(body: any): string | null {
  if (!['commend', 'neutral', 'flag'].includes(body.overall_vote))
    return 'overall_vote must be commend, neutral, or flag';
  for (const f of ['activity', 'attitude', 'experience', 'discipline']) {
    const v = body[f];
    if (v !== undefined && (typeof v !== 'number' || v < 1 || v > 10))
      return `${f} must be a number 1-10`;
  }
  return null;
}

// Upsert a reputation review record
async function upsertReview(base44: any, caller: any, userId: string, subject: any, body: any) {
  const { activity, attitude, experience, discipline, overall_vote, blacklisted, blacklist_reason, notes, group_id, group_name } = body;
  const existing = await base44.asServiceRole.entities.OperatorReputation.filter({
    subject_id: userId,
    reviewer_id: caller.id,
  });
  const data = {
    subject_id:        userId,
    subject_username:  subject.username,
    reviewer_id:       caller.id,
    reviewer_username: caller.username,
    group_id:          group_id   ?? null,
    group_name:        group_name ?? null,
    activity:    activity    ?? null,
    attitude:    attitude    ?? null,
    experience:  experience  ?? null,
    discipline:  discipline  ?? null,
    overall_vote,
    blacklisted:      blacklisted ?? false,
    blacklist_reason: blacklisted ? (blacklist_reason ?? null) : null,
    notes:            notes ?? null,
  };
  return existing.length > 0
    ? base44.asServiceRole.entities.OperatorReputation.update(existing[0].id, data)
    : base44.asServiceRole.entities.OperatorReputation.create(data);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  try {
    const base44      = createClientFromRequest(req);
    const url         = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const parts       = (pathOverride ?? '').split('/').filter(Boolean);
    const method      = req.method;

    // ── GET /group/:groupId ───────────────────────────────────────────────────
    if (method === 'GET' && parts.length === 2 && parts[0] === 'group') {
      const reviews = await base44.asServiceRole.entities.OperatorReputation.filter({ group_id: parts[1] });
      return json(reviews);
    }

    // ── GET /:userId ──────────────────────────────────────────────────────────
    if (method === 'GET' && parts.length === 1) {
      const reviews = await base44.asServiceRole.entities.OperatorReputation.filter({ subject_id: parts[0] });
      const score   = calcRepScore(reviews);
      return json({ userId: parts[0], reviews, score, review_count: reviews.length });
    }

    // ── POST /:userId/peer — roster member peer review ────────────────────────
    // Any member can review a fellow roster member.
    // Commanders CANNOT use this route to review their own unit members
    // (they have the commander route — this prevents double reviews).
    if (method === 'POST' && parts.length === 2 && parts[1] === 'peer') {
      const caller = await getCallerUser(base44, req);
      if (!caller) return json({ error: 'Unauthorized' }, 401);

      const userId = parts[0];

      // Rule: no self-review
      if (caller.id === userId)
        return json({ error: 'You cannot review yourself.' }, 403);

      const subject = await base44.asServiceRole.entities.AppUser.get(userId);
      if (!subject) return json({ error: 'User not found' }, 404);

      const body = await req.json().catch(() => ({}));
      const { group_id } = body;
      const isAdmin = caller.role === 'admin' || caller.role === 'moderator';

      if (!group_id)
        return json({ error: 'group_id is required for peer reviews.' }, 400);

      // Rule: reviewer must be on the roster of this group
      const callerRoster = await base44.asServiceRole.entities.MilsimRoster.filter({
        group_id,
        user_id: caller.id,
      });
      if (callerRoster.length === 0)
        return json({ error: 'You must be a member of this unit to submit a peer review.' }, 403);

      // Rule: commanders cannot peer-review their own unit members
      // (they use the commander review route instead — prevents double-dipping)
      if (!isAdmin) {
        const ownedGroups = await base44.asServiceRole.entities.MilsimGroup.filter({ owner_id: caller.id });
        const ownsThisGroup = ownedGroups.some((g: any) => g.id === group_id);

        // Also check HQ manage permissions
        const callerHQPerms = callerRoster[0]?.hq_permissions ?? {};
        const hasCommanderPerms = callerHQPerms.troops === 'manage' || callerHQPerms.recognition === 'manage';

        if (ownsThisGroup || hasCommanderPerms) {
          return json({
            error: 'Commanders use the commander review route — not peer review. This prevents the same person submitting two scores for one operator.'
          }, 403);
        }
      }

      // Rule: subject must also be on the roster of this group
      const subjectRoster = await base44.asServiceRole.entities.MilsimRoster.filter({
        group_id,
        user_id: userId,
      });
      if (subjectRoster.length === 0)
        return json({ error: 'You can only peer-review operators in the same unit as you.' }, 403);

      // Rule: group must be at least MIN_GROUP_AGE_DAYS old (anti-farm)
      if (!isAdmin) {
        const reviewingGroup = await base44.asServiceRole.entities.MilsimGroup.get(group_id);
        if (reviewingGroup && daysSince(reviewingGroup.created_date) < MIN_GROUP_AGE_DAYS) {
          return json({
            error: `This unit must be at least ${MIN_GROUP_AGE_DAYS} days old before peer reviews can be submitted. It was created ${Math.floor(daysSince(reviewingGroup.created_date))} day(s) ago.`
          }, 403);
        }
      }

      // Rule: subject must have been on roster for MIN_ROSTER_AGE_DAYS
      if (!isAdmin) {
        const rosterAge = daysSince(subjectRoster[0].join_date ?? subjectRoster[0].created_date);
        if (rosterAge < MIN_ROSTER_AGE_DAYS) {
          return json({
            error: `${subject.username} must have been on the roster for at least ${MIN_ROSTER_AGE_DAYS} days before you can review them. They joined ${Math.floor(rosterAge)} day(s) ago.`
          }, 403);
        }
      }

      const scoreErr = validateScores(body);
      if (scoreErr) return json({ error: scoreErr }, 400);

      const result = await upsertReview(base44, caller, userId, subject, body);
      return json(result, 200);
    }

    // ── POST /:userId — commander review ──────────────────────────────────────
    if (method === 'POST' && parts.length === 1) {
      const caller = await getCallerUser(base44, req);
      if (!caller) return json({ error: 'Unauthorized' }, 401);

      const userId = parts[0];

      // Rule 1: no self-review
      if (caller.id === userId)
        return json({ error: 'You cannot submit a reputation review for yourself.' }, 403);

      const subject = await base44.asServiceRole.entities.AppUser.get(userId);
      if (!subject) return json({ error: 'User not found' }, 404);

      const body = await req.json().catch(() => ({}));
      const { group_id, group_name } = body;

      // Rule 2: commander check
      const ownedGroups    = await base44.asServiceRole.entities.MilsimGroup.filter({ owner_id: caller.id });
      const isAdmin        = caller.role === 'admin' || caller.role === 'moderator';
      let isCommander      = ownedGroups.length > 0 || isAdmin;
      let commanderGroupIds: string[] = ownedGroups.map((g: any) => g.id);

      if (!isCommander) {
        const rosterEntries = await base44.asServiceRole.entities.MilsimRoster.filter({ user_id: caller.id });
        const hqEntries = rosterEntries.filter((r: any) => {
          const p = r.hq_permissions ?? {};
          return p.troops === 'manage' || p.recognition === 'manage';
        });
        if (hqEntries.length > 0) {
          isCommander = true;
          commanderGroupIds = hqEntries.map((r: any) => r.group_id);
        }
      }

      if (!isCommander)
        return json({ error: 'Only unit commanders can submit reputation reviews.' }, 403);

      if (!isAdmin) {
        const reviewingGroupId = group_id ?? commanderGroupIds[0] ?? null;
        if (reviewingGroupId) {
          // Rule 3: group must be at least MIN_GROUP_AGE_DAYS old
          const reviewingGroup = await base44.asServiceRole.entities.MilsimGroup.get(reviewingGroupId);
          if (reviewingGroup && daysSince(reviewingGroup.created_date) < MIN_GROUP_AGE_DAYS) {
            return json({
              error: `Your unit must be at least ${MIN_GROUP_AGE_DAYS} days old before you can submit reputation reviews. It was created ${Math.floor(daysSince(reviewingGroup.created_date))} day(s) ago.`
            }, 403);
          }

          // Rule 4: subject must have been on roster for MIN_ROSTER_AGE_DAYS
          const subjectRosterEntries = await base44.asServiceRole.entities.MilsimRoster.filter({
            group_id: reviewingGroupId,
            user_id: userId,
          });
          if (subjectRosterEntries.length === 0)
            return json({ error: 'You can only review operators who are or have been on your unit\'s roster.' }, 403);

          const rosterAge = daysSince(subjectRosterEntries[0].join_date ?? subjectRosterEntries[0].created_date);
          if (rosterAge < MIN_ROSTER_AGE_DAYS) {
            return json({
              error: `${subject.username} must have been on your roster for at least ${MIN_ROSTER_AGE_DAYS} days before you can review them. They joined ${Math.floor(rosterAge)} day(s) ago.`
            }, 403);
          }

          // Rule 5: unit must have at least 3 non-owner members (anti thin-group exploit)
          const allRosterMembers = await base44.asServiceRole.entities.MilsimRoster.filter({ group_id: reviewingGroupId });
          const nonOwnerMembers  = allRosterMembers.filter((r: any) => r.user_id !== caller.id);
          if (nonOwnerMembers.length < 3) {
            return json({
              error: 'Your unit must have at least 3 members (excluding yourself) before you can submit reputation reviews.'
            }, 403);
          }
        }
      }

      const scoreErr = validateScores(body);
      if (scoreErr) return json({ error: scoreErr }, 400);

      const result = await upsertReview(base44, caller, userId, subject, { ...body, group_id: group_id ?? commanderGroupIds[0] ?? null, group_name: group_name ?? ownedGroups[0]?.name ?? null });
      return json(result, 200);
    }

    // ── DELETE /:reviewId ─────────────────────────────────────────────────────
    if (method === 'DELETE' && parts.length === 1) {
      const caller = await getCallerUser(base44, req);
      if (!caller) return json({ error: 'Unauthorized' }, 401);
      const review = await base44.asServiceRole.entities.OperatorReputation.get(parts[0]);
      if (!review) return json({ error: 'Review not found' }, 404);
      if (review.reviewer_id !== caller.id && caller.role !== 'admin')
        return json({ error: 'Forbidden' }, 403);
      await base44.asServiceRole.entities.OperatorReputation.delete(parts[0]);
      return json({ success: true });
    }

    return json({ error: 'Not found' }, 404);
  } catch (error: any) {
    console.error('[reputation] unhandled error:', error.message);
    return json({ error: error.message }, 500);
  }
});
