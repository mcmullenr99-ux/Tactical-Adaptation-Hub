import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';
const WEBHOOKS_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/webhooks";
async function fireEvent(groupId: string, event: string, payload: object) {
  try { await fetch(`${WEBHOOKS_URL}?path=%2Ffire`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group_id: groupId, event, payload }) }); } catch (_) {}
}

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
      : url.pathname.replace(/^\/functions\/milsimOps/, '').split('/').filter(Boolean);
    const method = req.method;
    // parts: [groupId, 'ops'] or [groupId, 'ops', opId] or [groupId, 'ops', 'active']

    // GET /milsimOps/:groupId/ops
    if (method === 'GET' && parts.length === 2 && parts[1] === 'ops') {
      const ops = await base44.asServiceRole.entities.MilsimOp.filter({ group_id: parts[0] });
      return Response.json(ops.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
    }

    // GET /milsimOps/:groupId/ops/active
    if (method === 'GET' && parts.length === 3 && parts[1] === 'ops' && parts[2] === 'active') {
      const ops = await base44.asServiceRole.entities.MilsimOp.filter({ group_id: parts[0], status: 'active' });
      return Response.json(ops[0] ?? null);
    }

    // GET /milsimOps/:groupId/ops/:opId
    if (method === 'GET' && parts.length === 3 && parts[1] === 'ops') {
      const op = await base44.asServiceRole.entities.MilsimOp.get(parts[2]);
      if (!op) return Response.json({ error: 'Op not found' }, { status: 404 });
      return Response.json(op);
    }

    // POST /milsimOps/:groupId/ops
    if (method === 'POST' && parts.length === 2 && parts[1] === 'ops') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const body = await req.json().catch(() => ({}));
      const op = await base44.asServiceRole.entities.MilsimOp.create({
        group_id: parts[0], name: body.name, description: body.description ?? null,
        game: body.game ?? null, scheduled_at: body.scheduledAt ? new Date(body.scheduledAt).toISOString() : null,
        status: 'planned', created_by: full.id,
      });
      // Stamp group's last_op_date
      await base44.asServiceRole.entities.MilsimGroup.update(parts[0], {
        last_op_date: new Date().toISOString(),
        last_page_update: new Date().toISOString(),
      }).catch(() => {});
      await fireEvent(parts[0], "op.created", { op_id: op.id, name: op.name, game: op.game, scheduled_at: op.scheduled_at, event_type: op.event_type });
      return Response.json(op, { status: 201 });
    }

    // PATCH /milsimOps/:groupId/ops/:opId
    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'ops') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.game !== undefined) updates.game = body.game;
      if (body.scheduledAt !== undefined) updates.scheduled_at = new Date(body.scheduledAt).toISOString();
      if (body.status !== undefined) updates.status = body.status;

      const updated = await base44.asServiceRole.entities.MilsimOp.update(parts[2], updates);
      if (body.status) {
        await fireEvent(parts[0], "op.status_changed", { op_id: parts[2], new_status: body.status });
        if (body.status === "Completed") await fireEvent(parts[0], "op.completed", { op_id: parts[2], name: updates.name });
      }
      return Response.json(updated);
    }

    // DELETE /milsimOps/:groupId/ops/:opId
    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'ops') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimOp.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[milsimOps]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
