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
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/staffApplications/, '').split('/').filter(Boolean);
    const method = req.method;

    // GET /staffApplications — mod+
    if (method === 'GET' && parts.length === 0) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!['moderator', 'admin'].includes(full.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const apps = await base44.asServiceRole.entities.StaffApplication.list();
      return Response.json(apps.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
    }

    // GET /staffApplications/mine
    if (method === 'GET' && parts[0] === 'mine') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const apps = await base44.asServiceRole.entities.StaffApplication.filter({ user_id: full.id });
      return Response.json(apps[0] ?? null);
    }

    // POST /staffApplications
    if (method === 'POST' && parts.length === 0) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const existing = await base44.asServiceRole.entities.StaffApplication.filter({ user_id: full.id });
      if (existing.length > 0) return Response.json({ error: 'Application already submitted' }, { status: 409 });
      const body = await req.json().catch(() => ({}));
      const app = await base44.asServiceRole.entities.StaffApplication.create({
        user_id: full.id, username: full.username,
        gamertag: body.gamertag, games: body.games ?? [],
        experience: body.experience, motivation: body.motivation,
        status: 'pending',
      });
      return Response.json(app, { status: 201 });
    }

    // PATCH /staffApplications/:id — mod+
    if (method === 'PATCH' && parts.length === 1) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!['moderator', 'admin'].includes(full.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = { reviewed_by: full.id };
      if (body.status) updates.status = body.status;
      if (body.reviewNote !== undefined) updates.review_note = body.reviewNote;
      const updated = await base44.asServiceRole.entities.StaffApplication.update(parts[0], updates);
      // Auto-promote to staff if approved
      if (body.status === 'approved') {
        const app = await base44.asServiceRole.entities.StaffApplication.get(parts[0]);
        if (app) await base44.asServiceRole.entities.AppUser.update(app.user_id, { role: 'staff' });
      }
      return Response.json(updated);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[staffApplications]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
