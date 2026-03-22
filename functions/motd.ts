import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

async function getCallerUser(base44: any) {
  const user = await base44.auth.me();
  if (!user) return null;
  const users = await base44.asServiceRole.entities.User.filter({ email: user.email });
  return users[0] ?? null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const parts = url.pathname.replace(/^\/functions\/motd/, '').split('/').filter(Boolean);
    const method = req.method;

    // GET /motd — all
    if (method === 'GET' && parts.length === 0) {
      const all = await base44.asServiceRole.entities.Motd.list();
      return Response.json(all.sort((a: any, b: any) => (b.priority ?? 0) - (a.priority ?? 0)));
    }

    // GET /motd/active
    if (method === 'GET' && parts[0] === 'active') {
      const all = await base44.asServiceRole.entities.Motd.filter({ active: true });
      const now = new Date();
      const active = all.filter((m: any) => !m.expires_at || new Date(m.expires_at) > now);
      return Response.json(active.sort((a: any, b: any) => (b.priority ?? 0) - (a.priority ?? 0)));
    }

    // POST /motd — staff+
    if (method === 'POST' && parts.length === 0) {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!['staff', 'moderator', 'admin'].includes(full.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const motd = await base44.asServiceRole.entities.Motd.create({
        title: body.title, content: body.content,
        active: body.active ?? true, priority: body.priority ?? 0,
        author_id: full.id, author_username: full.username,
        expires_at: body.expiresAt ?? null,
      });
      return Response.json(motd, { status: 201 });
    }

    // PATCH /motd/:id
    if (method === 'PATCH' && parts.length === 1) {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!['staff', 'moderator', 'admin'].includes(full.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.content !== undefined) updates.content = body.content;
      if (body.active !== undefined) updates.active = body.active;
      if (body.priority !== undefined) updates.priority = body.priority;
      if (body.expiresAt !== undefined) updates.expires_at = body.expiresAt;
      const updated = await base44.asServiceRole.entities.Motd.update(parts[0], updates);
      return Response.json(updated);
    }

    // DELETE /motd/:id
    if (method === 'DELETE' && parts.length === 1) {
      const full = await getCallerUser(base44);
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
