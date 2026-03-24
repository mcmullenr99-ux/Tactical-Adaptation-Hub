import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

async function getCallerUser(base44: any, req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    const user = await base44.asServiceRole.entities.User.get(payload.sub);
    return user ?? null;
  } catch { return null; }
}

function calcRepScore(reviews: any[]): {
  activity: number; attitude: number; experience: number; discipline: number;
  overall: number; grade: string; commends: number; flags: number; blacklisted: boolean;
  blacklist_reason: string | null;
} {
  if (!reviews.length) return { activity: 0, attitude: 0, experience: 0, discipline: 0, overall: 0, grade: 'UNRATED', commends: 0, flags: 0, blacklisted: false, blacklist_reason: null };

  const commends = reviews.filter(r => r.overall_vote === 'commend').length;
  const flags = reviews.filter(r => r.overall_vote === 'flag').length;
  const blacklistReview = reviews.find(r => r.blacklisted === true);

  const avg = (field: string) => {
    const vals = reviews.map(r => r[field]).filter(v => typeof v === 'number');
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
  };

  const activity = avg('activity');
  const attitude = avg('attitude');
  const experience = avg('experience');
  const discipline = avg('discipline');

  // Score: weighted average of categories + commend/flag ratio
  const catAvg = (activity + attitude + experience + discipline) / 4;
  const voteScore = reviews.length > 0 ? ((commends - flags) / reviews.length) * 20 : 0;
  const overall = Math.min(100, Math.max(0, Math.round(catAvg * 10 + voteScore)));

  const grade =
    blacklistReview ? 'BLACKLISTED' :
    overall >= 85 ? 'ELITE' :
    overall >= 70 ? 'TRUSTED' :
    overall >= 50 ? 'STANDARD' :
    overall >= 30 ? 'CAUTION' : 'HIGH RISK';

  return {
    activity, attitude, experience, discipline, overall, grade,
    commends, flags,
    blacklisted: !!blacklistReview,
    blacklist_reason: blacklistReview?.blacklist_reason ?? null,
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
      : url.pathname.replace(/^\/functions\/reputation/, '').split('/').filter(Boolean);
    const method = req.method;

    // GET /reputation/:userId — public reputation summary for a user
    if (method === 'GET' && parts.length === 1) {
      const userId = parts[0];
      const reviews = await base44.asServiceRole.entities.OperatorReputation.filter({ subject_id: userId });
      const score = calcRepScore(reviews);
      return Response.json({ userId, reviews, score });
    }

    // POST /reputation/:userId — commander submits/updates a review
    if (method === 'POST' && parts.length === 1) {
      const caller = await getCallerUser(base44, req);
      if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      // Must be a commander — check they own or manage at least one milsim group
      const groups = await base44.asServiceRole.entities.MilsimGroup.filter({ owner_id: caller.id });
      const isAdmin = caller.role === 'admin' || caller.role === 'moderator';
      if (!groups.length && !isAdmin) {
        return Response.json({ error: 'Only unit commanders can submit reputation reviews' }, { status: 403 });
      }

      const userId = parts[0];
      const subject = await base44.asServiceRole.entities.User.get(userId);
      if (!subject) return Response.json({ error: 'User not found' }, { status: 404 });

      const body = await req.json().catch(() => ({}));
      const { activity, attitude, experience, discipline, overall_vote, blacklisted, blacklist_reason, notes, group_id, group_name } = body;

      if (!['commend', 'neutral', 'flag'].includes(overall_vote)) {
        return Response.json({ error: 'overall_vote must be commend, neutral, or flag' }, { status: 400 });
      }

      // Validate scores are 1-10
      for (const [field, val] of Object.entries({ activity, attitude, experience, discipline })) {
        if (val !== undefined && (typeof val !== 'number' || val < 1 || val > 10)) {
          return Response.json({ error: `${field} must be a number 1-10` }, { status: 400 });
        }
      }

      // Check if reviewer already reviewed this user — update if so
      const existing = await base44.asServiceRole.entities.OperatorReputation.filter({
        subject_id: userId,
        reviewer_id: caller.id,
      });

      const data = {
        subject_id: userId,
        subject_username: subject.username,
        reviewer_id: caller.id,
        reviewer_username: caller.username,
        group_id: group_id ?? (groups[0]?.id ?? null),
        group_name: group_name ?? (groups[0]?.name ?? null),
        activity: activity ?? null,
        attitude: attitude ?? null,
        experience: experience ?? null,
        discipline: discipline ?? null,
        overall_vote,
        blacklisted: blacklisted ?? false,
        blacklist_reason: blacklisted ? (blacklist_reason ?? null) : null,
        notes: notes ?? null,
      };

      let result;
      if (existing.length > 0) {
        result = await base44.asServiceRole.entities.OperatorReputation.update(existing[0].id, data);
      } else {
        result = await base44.asServiceRole.entities.OperatorReputation.create(data);
      }

      return Response.json(result, { status: 200 });
    }

    // DELETE /reputation/:reviewId — commander deletes their own review
    if (method === 'DELETE' && parts.length === 1) {
      const caller = await getCallerUser(base44, req);
      if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const review = await base44.asServiceRole.entities.OperatorReputation.get(parts[0]);
      if (!review) return Response.json({ error: 'Review not found' }, { status: 404 });
      if (review.reviewer_id !== caller.id && caller.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      await base44.asServiceRole.entities.OperatorReputation.delete(parts[0]);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[reputation]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
