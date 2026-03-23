import { createClient, createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
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

const PRIORITY_ORDER: Record<string, number> = { critical: 4, warning: 3, info: 2, success: 1 };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/motd/, '').split('/').filter(Boolean);
    const method = req.method;

    if (method === 'GET' && parts.length === 0) {
      const all = await base44.asServiceRole.entities.Motd.list();
      return Response.json(all.sort((a: any, b: any) => (PRIORITY_ORDER[b.priority] ?? 0) - (PRIORITY_ORDER[a.priority] ?? 0)));
    }

    if (method === 'GET' && parts[0] === 'active') {
      const all = await base44.asServiceRole.entities.Motd.filter({ active: true });
      const now = new Date();
      const active = all.filter((m: any) => !m.expires_at || new Date(m.expires_at) > now);
      return Response.json(active.sort((a: any, b: any) => (PRIORITY_ORDER[b.priority] ?? 0) - (PRIORITY_ORDER[a.priority] ?? 0)));
    }

    if (method === 'GET' && parts[0] === 'latest') {
      const all = await base44.asServiceRole.entities.Motd.filter({ active: true });
      const now = new Date();
      const active = all.filter((m: any) => !m.expires_at || new Date(m.expires_at) > now);
      const sorted = active.sort((a: any, b: any) => (PRIORITY_ORDER[b.priority] ?? 0) - (PRIORITY_ORDER[a.priority] ?? 0));
      return Response.json(sorted[0] ?? null);
    }

    if (method === 'POST' && parts.length === 0) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!['staff', 'moderator', 'admin'].includes(full.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const motd = await base44.asServiceRole.entities.Motd.create({
        title: body.title, content: body.content,
        active: body.active ?? true, priority: body.priority ?? 'info',
        author_id: full.id, author_username: full.username,
        expires_at: body.expiresAt ?? body.expires_at ?? null,
      });
      return Response.json(motd, { status: 201 });
    }

    if (method === 'PATCH' && parts.length === 1) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!['staff', 'moderator', 'admin'].includes(full.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.content !== undefined) updates.content = body.content;
      if (body.active !== undefined) updates.active = body.active;
      if (body.priority !== undefined) updates.priority = body.priority;
      if (body.expiresAt !== undefined) updates.expires_at = body.expiresAt;
      return Response.json(await base44.asServiceRole.entities.Motd.update(parts[0], updates));
    }

    if (method === 'DELETE' && parts.length === 1) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!['staff', 'moderator', 'admin'].includes(full.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.Motd.delete(parts[0]);
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[motd]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
