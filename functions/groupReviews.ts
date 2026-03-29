import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

async function getCallerUser(base44: any, req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    return await base44.asServiceRole.entities.AppUser.get(payload.sub) ?? null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const path = url.searchParams.get('path') ?? '';
    const method = req.method;

    // GET /list?group_id=xxx — public, no auth needed
    if (path === '/list' && method === 'GET') {
      const groupId = url.searchParams.get('group_id');
      if (!groupId) return Response.json({ error: 'group_id required' }, { status: 400 });
      const reviews = await base44.asServiceRole.entities.GroupReview.filter({ group_id: groupId });
      // Sort newest first
      reviews.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
      return Response.json(reviews);
    }

    // POST /create — must be roster member of the group
    if (path === '/create' && method === 'POST') {
      const user = await getCallerUser(base44, req);
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const body = await req.json().catch(() => ({}));
      const { group_id, rating, organisation, communication, gameplay, community, headline, body: reviewBody, served_months, recommend } = body;
      if (!group_id) return Response.json({ error: 'group_id required' }, { status: 400 });
      if (!rating || rating < 1 || rating > 5) return Response.json({ error: 'rating must be 1-5' }, { status: 400 });
      if (!headline?.trim()) return Response.json({ error: 'headline required' }, { status: 400 });

      // Check user is (or was) on the roster
      const roster = await base44.asServiceRole.entities.MilsimRoster.filter({ group_id, user_id: user.id });
      if (roster.length === 0) {
        return Response.json({ error: 'You must be a roster member of this unit to review it' }, { status: 403 });
      }

      // One review per user per group
      const existing = await base44.asServiceRole.entities.GroupReview.filter({ group_id, reviewer_id: user.id });
      if (existing.length > 0) {
        return Response.json({ error: 'You have already reviewed this unit. Edit your existing review instead.' }, { status: 409 });
      }

      const review = await base44.asServiceRole.entities.GroupReview.create({
        group_id,
        group_name: body.group_name ?? null,
        reviewer_id: user.id,
        reviewer_username: user.username ?? user.full_name ?? 'Anonymous',
        rating,
        organisation: organisation ?? null,
        communication: communication ?? null,
        gameplay: gameplay ?? null,
        community: community ?? null,
        headline: headline.trim(),
        body: reviewBody?.trim() ?? null,
        served_months: served_months ?? null,
        recommend: recommend ?? true,
      });
      return Response.json(review, { status: 201 });
    }

    // PATCH /update?id=xxx — reviewer only
    if (path === '/update' && method === 'PATCH') {
      const user = await getCallerUser(base44, req);
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const id = url.searchParams.get('id');
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      const review = await base44.asServiceRole.entities.GroupReview.get(id);
      if (!review) return Response.json({ error: 'Not found' }, { status: 404 });
      if (review.reviewer_id !== user.id && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const allowed = ['rating','organisation','communication','gameplay','community','headline','body','served_months','recommend'];
      const updates: Record<string, any> = {};
      for (const k of allowed) { if (body[k] !== undefined) updates[k] = body[k]; }
      const updated = await base44.asServiceRole.entities.GroupReview.update(id, updates);
      return Response.json(updated);
    }

    // DELETE /delete?id=xxx — reviewer or admin
    if (path === '/delete' && method === 'DELETE') {
      const user = await getCallerUser(base44, req);
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const id = url.searchParams.get('id');
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      const review = await base44.asServiceRole.entities.GroupReview.get(id);
      if (!review) return Response.json({ error: 'Not found' }, { status: 404 });
      if (review.reviewer_id !== user.id && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.GroupReview.delete(id);
      return Response.json({ ok: true });
    }

    // GET /mine?group_id=xxx — check if current user has already reviewed
    if (path === '/mine' && method === 'GET') {
      const user = await getCallerUser(base44, req);
      if (!user) return Response.json(null);
      const groupId = url.searchParams.get('group_id');
      if (!groupId) return Response.json(null);
      const existing = await base44.asServiceRole.entities.GroupReview.filter({ group_id: groupId, reviewer_id: user.id });
      return Response.json(existing[0] ?? null);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (err: any) {
    console.error('[groupReviews]', err);
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 });
  }
});
