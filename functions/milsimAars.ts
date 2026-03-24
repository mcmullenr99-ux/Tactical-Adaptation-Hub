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


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/milsimAars/, '').split('/').filter(Boolean);
    const method = req.method;

    // GET /milsimAars/:groupId/aars
    if (method === 'GET' && parts.length === 2 && parts[1] === 'aars') {
      const aars = await base44.asServiceRole.entities.MilsimAAR.filter({ group_id: parts[0] });
      return Response.json(aars.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
    }

    // GET /milsimAars/:groupId/aars/:aarId
    if (method === 'GET' && parts.length === 3 && parts[1] === 'aars') {
      const aar = await base44.asServiceRole.entities.MilsimAAR.get(parts[2]);
      if (!aar) return Response.json({ error: 'AAR not found' }, { status: 404 });
      return Response.json(aar);
    }

    // POST /milsimAars/:groupId/aars
    if (method === 'POST' && parts.length === 2 && parts[1] === 'aars') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const body = await req.json().catch(() => ({}));
      if (!body.title || !body.content) return Response.json({ error: 'Title and content required' }, { status: 400 });

      let opName: string | null = null;
      if (body.opId) {
        const op = await base44.asServiceRole.entities.MilsimOp.get(body.opId);
        opName = op?.name ?? null;
      }

      const aar = await base44.asServiceRole.entities.MilsimAAR.create({
        group_id: parts[0], op_id: body.opId ?? null, op_name: opName,
        author_id: full.id, author_username: full.username,
        title: body.title, content: body.content,
        outcome: body.outcome ?? null, lessons_learned: body.lessonsLearned ?? null,
      });
      // Stamp group's last_aar_date
      await base44.asServiceRole.entities.MilsimGroup.update(parts[0], {
        last_aar_date: new Date().toISOString(),
        last_page_update: new Date().toISOString(),
      }).catch(() => {});
      return Response.json(aar, { status: 201 });
    }

    // PATCH /milsimAars/:groupId/aars/:aarId
    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'aars') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const aar = await base44.asServiceRole.entities.MilsimAAR.get(parts[2]);
      if (!aar) return Response.json({ error: 'AAR not found' }, { status: 404 });
      if (aar.author_id !== full.id && full.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.content !== undefined) updates.content = body.content;
      if (body.outcome !== undefined) updates.outcome = body.outcome;
      if (body.lessonsLearned !== undefined) updates.lessons_learned = body.lessonsLearned;

      const updated = await base44.asServiceRole.entities.MilsimAAR.update(parts[2], updates);
      return Response.json(updated);
    }

    // DELETE /milsimAars/:groupId/aars/:aarId
    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'aars') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const aar = await base44.asServiceRole.entities.MilsimAAR.get(parts[2]);
      if (!aar) return Response.json({ error: 'AAR not found' }, { status: 404 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (aar.author_id !== full.id && group?.owner_id !== full.id && full.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      await base44.asServiceRole.entities.MilsimAAR.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[milsimAars]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
