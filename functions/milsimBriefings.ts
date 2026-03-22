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
    const parts = url.pathname.replace(/^\/functions\/milsimBriefings/, '').split('/').filter(Boolean);
    const method = req.method;

    // GET /milsimBriefings/:groupId/briefings
    if (method === 'GET' && parts.length === 2 && parts[1] === 'briefings') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const briefings = await base44.asServiceRole.entities.MilsimBriefing.filter({ group_id: parts[0] });
      return Response.json(briefings.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
    }

    // GET /milsimBriefings/:groupId/briefings/:bid
    if (method === 'GET' && parts.length === 3 && parts[1] === 'briefings') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const briefing = await base44.asServiceRole.entities.MilsimBriefing.get(parts[2]);
      if (!briefing) return Response.json({ error: 'Briefing not found' }, { status: 404 });
      return Response.json(briefing);
    }

    // POST /milsimBriefings/:groupId/briefings
    if (method === 'POST' && parts.length === 2 && parts[1] === 'briefings') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const briefing = await base44.asServiceRole.entities.MilsimBriefing.create({
        group_id: parts[0], op_id: body.opId ?? null, title: body.title,
        content: body.content, classification: body.classification ?? 'unclassified',
        created_by: full.id,
      });
      return Response.json(briefing, { status: 201 });
    }

    // PATCH /milsimBriefings/:groupId/briefings/:bid
    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'briefings') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.content !== undefined) updates.content = body.content;
      if (body.classification !== undefined) updates.classification = body.classification;
      const updated = await base44.asServiceRole.entities.MilsimBriefing.update(parts[2], updates);
      return Response.json(updated);
    }

    // DELETE /milsimBriefings/:groupId/briefings/:bid
    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'briefings') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimBriefing.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[milsimBriefings]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
