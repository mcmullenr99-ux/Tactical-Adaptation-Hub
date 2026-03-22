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
      : url.pathname.replace(/^\/functions\/qualifications/, '').split('/').filter(Boolean);
    const method = req.method;

    // GET /qualifications/:groupId/qualifications
    if (method === 'GET' && parts.length === 2 && parts[1] === 'qualifications') {
      const quals = await base44.asServiceRole.entities.Qualification.filter({ group_id: parts[0] });
      return Response.json(quals);
    }

    // POST /qualifications/:groupId/qualifications
    if (method === 'POST' && parts.length === 2 && parts[1] === 'qualifications') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const qual = await base44.asServiceRole.entities.Qualification.create({
        group_id: parts[0], name: body.name, description: body.description ?? null, badge_url: body.badgeUrl ?? null,
      });
      return Response.json(qual, { status: 201 });
    }

    // DELETE /qualifications/:groupId/qualifications/:qid
    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'qualifications') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.Qualification.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // GET /qualifications/:groupId/roster/:rosterId/qualifications
    if (method === 'GET' && parts.length === 4 && parts[1] === 'roster' && parts[3] === 'qualifications') {
      const grants = await base44.asServiceRole.entities.QualificationGrant.filter({ roster_id: parts[2] });
      return Response.json(grants);
    }

    // POST /qualifications/:groupId/qualifications/:qid/grant
    if (method === 'POST' && parts.length === 4 && parts[1] === 'qualifications' && parts[3] === 'grant') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const qual = await base44.asServiceRole.entities.Qualification.get(parts[2]);
      const body = await req.json().catch(() => ({}));
      const grant = await base44.asServiceRole.entities.QualificationGrant.create({
        qualification_id: parts[2], qualification_name: qual?.name ?? '',
        group_id: parts[0], roster_id: body.rosterId, callsign: body.callsign,
        granted_by: full.id, notes: body.notes ?? null,
      });
      return Response.json(grant, { status: 201 });
    }

    // DELETE /qualifications/:groupId/qualifications/:qid/grant/:grantId
    if (method === 'DELETE' && parts.length === 5 && parts[1] === 'qualifications' && parts[3] === 'grant') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.QualificationGrant.delete(parts[4]);
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[qualifications]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
