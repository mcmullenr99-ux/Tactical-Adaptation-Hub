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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/posts/, '').split('/').filter(Boolean);
    const method = req.method;

    // GET /posts
    if (method === 'GET' && parts.length === 0) {
      const category = url.searchParams.get('category');
      const milsim_group_id = url.searchParams.get('milsim_group_id');
      const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 50);
      const offset = parseInt(url.searchParams.get('offset') ?? '0');
      const filter: Record<string, any> = {};
      if (category) filter.category = category;
      if (milsim_group_id) filter.milsim_group_id = milsim_group_id;
      const allPosts = Object.keys(filter).length > 0
        ? await base44.asServiceRole.entities.Post.filter(filter)
        : await base44.asServiceRole.entities.Post.list();
      const sorted = allPosts.sort((a: any, b: any) => {
        if (b.pinned !== a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
      });
      return Response.json({ posts: sorted.slice(offset, offset + limit), total: sorted.length });
    }

    // GET /posts/:id
    if (method === 'GET' && parts.length === 1) {
      const post = await base44.asServiceRole.entities.Post.get(parts[0]);
      if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });
      const comments = await base44.asServiceRole.entities.PostComment.filter({ post_id: parts[0] });
      return Response.json({ ...post, comments });
    }

    // POST /posts — create
    if (method === 'POST' && parts.length === 0) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const body = await req.json().catch(() => ({}));
      const { title, postBody, category, milsim_group_id, image_url } = body;
      if (!postBody) return Response.json({ error: 'Body is required' }, { status: 400 });
      const post = await base44.asServiceRole.entities.Post.create({
        user_id: full.id, username: full.username, user_role: full.role,
        user_nationality: full.nationality ?? null, title: title ?? null,
        body: postBody, category: category ?? 'general',
        milsim_group_id: milsim_group_id ?? null, image_url: image_url ?? null,
        pinned: false, reactions: 0, comment_count: 0,
      });
      return Response.json(post, { status: 201 });
    }

    // PATCH /posts/:id
    if (method === 'PATCH' && parts.length === 1) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const post = await base44.asServiceRole.entities.Post.get(parts[0]);
      if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });
      const body = await req.json().catch(() => ({}));
      const isOwner = post.user_id === full.id;
      const isMod = ['staff', 'moderator', 'admin'].includes(full.role);
      if (!isOwner && !isMod) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const updates: Record<string, any> = {};
      if (body.pinned !== undefined && isMod) updates.pinned = body.pinned;
      if (body.title !== undefined && isOwner) updates.title = body.title;
      if (body.body !== undefined && isOwner) updates.body = body.body;
      return Response.json(await base44.asServiceRole.entities.Post.update(parts[0], updates));
    }

    // DELETE /posts/:id
    if (method === 'DELETE' && parts.length === 1) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const post = await base44.asServiceRole.entities.Post.get(parts[0]);
      if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });
      if (post.user_id !== full.id && !['staff', 'moderator', 'admin'].includes(full.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.Post.delete(parts[0]);
      return new Response(null, { status: 204 });
    }

    // POST /posts/:id/comments
    if (method === 'POST' && parts.length === 2 && parts[1] === 'comments') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const body = await req.json().catch(() => ({}));
      if (!body.body) return Response.json({ error: 'Comment body required' }, { status: 400 });
      const post = await base44.asServiceRole.entities.Post.get(parts[0]);
      if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });
      const comment = await base44.asServiceRole.entities.PostComment.create({
        post_id: parts[0], user_id: full.id, username: full.username, body: body.body,
      });
      await base44.asServiceRole.entities.Post.update(parts[0], { comment_count: (post.comment_count ?? 0) + 1 });
      return Response.json(comment, { status: 201 });
    }

    // DELETE /posts/:postId/comments/:commentId
    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'comments') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const comment = await base44.asServiceRole.entities.PostComment.get(parts[2]);
      if (!comment) return Response.json({ error: 'Comment not found' }, { status: 404 });
      if (comment.user_id !== full.id && !['staff', 'moderator', 'admin'].includes(full.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.PostComment.delete(parts[2]);
      const post = await base44.asServiceRole.entities.Post.get(parts[0]);
      if (post) await base44.asServiceRole.entities.Post.update(parts[0], { comment_count: Math.max(0, (post.comment_count ?? 1) - 1) });
      return new Response(null, { status: 204 });
    }

    // POST /posts/:id/react
    if (method === 'POST' && parts.length === 2 && parts[1] === 'react') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const post = await base44.asServiceRole.entities.Post.get(parts[0]);
      if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });
      const existing = await base44.asServiceRole.entities.PostReaction.filter({ post_id: parts[0], user_id: full.id });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.PostReaction.delete(existing[0].id);
        await base44.asServiceRole.entities.Post.update(parts[0], { reactions: Math.max(0, (post.reactions ?? 1) - 1) });
        return Response.json({ reacted: false });
      } else {
        await base44.asServiceRole.entities.PostReaction.create({ post_id: parts[0], user_id: full.id });
        await base44.asServiceRole.entities.Post.update(parts[0], { reactions: (post.reactions ?? 0) + 1 });
        return Response.json({ reacted: true });
      }
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[posts]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
