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
      : url.pathname.replace(/^\/functions\/dutyRoster/, '').split('/').filter(Boolean);
    const method = req.method;

    // GET /dutyRoster/:groupId
    if (method === 'GET' && parts.length === 1) {
      const rosters = await base44.asServiceRole.entities.DutyRoster.filter({ group_id: parts[0] });
      return Response.json(rosters.sort((a: any, b: any) => new Date(a.duty_date ?? a.created_date).getTime() - new Date(b.duty_date ?? b.created_date).getTime()));
    }

    // POST /dutyRoster/:groupId
    if (method === 'POST' && parts.length === 1) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const roster = await base44.asServiceRole.entities.DutyRoster.create({
        group_id: parts[0], title: body.title,
        description: body.description ?? null,
        duty_date: body.dutyDate ? new Date(body.dutyDate).toISOString() : null,
        assignments: body.assignments ?? [],
        created_by: full.id,
      });
      return Response.json(roster, { status: 201 });
    }

    // PATCH /dutyRoster/:groupId/:rosterId
    if (method === 'PATCH' && parts.length === 2) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.description !== undefined) updates.description = body.description;
      if (body.dutyDate !== undefined) updates.duty_date = new Date(body.dutyDate).toISOString();
      if (body.assignments !== undefined) updates.assignments = body.assignments;
      const updated = await base44.asServiceRole.entities.DutyRoster.update(parts[1], updates);
      return Response.json(updated);
    }

    // DELETE /dutyRoster/:groupId/:rosterId
    if (method === 'DELETE' && parts.length === 2) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.DutyRoster.delete(parts[1]);
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[dutyRoster]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
