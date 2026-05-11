// milsimOps — Op management, RSVPs
// CONF-012 fix: added list, upcoming, group/:id, detail/:id, update/:id handlers
// Redeploy from stale state
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

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/milsimOps/, '').split('/').filter(Boolean);
    const method = req.method;

    // ── LEGACY PATTERNS (/:groupId/ops/:opId structure) ─────────────────

    // GET /:groupId/ops/active
    if (method === 'GET' && parts.length === 3 && parts[1] === 'ops' && parts[2] === 'active') {
      const ops = await base44.asServiceRole.entities.MilsimOp.filter({ group_id: parts[0] });
      const active = ops.filter((o: any) => ['active', 'planned', 'Active', 'Planned'].includes(o.status));
      return json(active[0] ?? null);
    }

    // GET /:groupId/ops/:opId
    if (method === 'GET' && parts.length === 3 && parts[1] === 'ops') {
      const op = await base44.asServiceRole.entities.MilsimOp.get(parts[2]);
      if (!op) return json({ error: 'Op not found' }, 404);
      return json(op);
    }

    // GET /:groupId/ops
    if (method === 'GET' && parts.length === 2 && parts[1] === 'ops') {
      const ops = await base44.asServiceRole.entities.MilsimOp.filter({ group_id: parts[0] });
      return json(ops.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
    }

    // POST /:groupId/ops
    if (method === 'POST' && parts.length === 2 && parts[1] === 'ops') {
      const full = await getCallerUser(base44, req);
      if (!full) return json({ error: 'Unauthorized' }, 401);
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return json({ error: 'Forbidden' }, 403);
      const body = await req.json().catch(() => ({}));
      const op = await base44.asServiceRole.entities.MilsimOp.create({
        group_id: parts[0], name: body.name, description: body.description ?? null,
        game: body.game ?? null, scheduled_at: body.scheduledAt ? new Date(body.scheduledAt).toISOString() : null,
        status: 'planned', created_by: full.id,
      });
      await base44.asServiceRole.entities.MilsimGroup.update(parts[0], { last_op_date: new Date().toISOString(), last_page_update: new Date().toISOString() }).catch(() => {});
      await fireEvent(parts[0], "op.created", { op_id: op.id, name: op.name, game: op.game, scheduled_at: op.scheduled_at });
      return json(op, 201);
    }

    // PATCH /:groupId/ops/:opId
    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'ops') {
      const full = await getCallerUser(base44, req);
      if (!full) return json({ error: 'Unauthorized' }, 401);
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return json({ error: 'Forbidden' }, 403);
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.game !== undefined) updates.game = body.game;
      if (body.scheduledAt !== undefined) updates.scheduled_at = new Date(body.scheduledAt).toISOString();
      if (body.status !== undefined) updates.status = body.status;
      if (body.end_date !== undefined) updates.end_date = body.end_date;
      if (body.event_type !== undefined) updates.event_type = body.event_type;
      if (body.location !== undefined) updates.location = body.location;
      if (body.max_slots !== undefined) updates.max_slots = body.max_slots;
      const updated = await base44.asServiceRole.entities.MilsimOp.update(parts[2], updates);
      if (body.status) {
        await fireEvent(parts[0], "op.status_changed", { op_id: parts[2], new_status: body.status });
        if (body.status === "Completed") await fireEvent(parts[0], "op.completed", { op_id: parts[2], name: updates.name });
      }
      return json(updated);
    }

    // DELETE /:groupId/ops/:opId
    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'ops') {
      const full = await getCallerUser(base44, req);
      if (!full) return json({ error: 'Unauthorized' }, 401);
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return json({ error: 'Forbidden' }, 403);
      await base44.asServiceRole.entities.MilsimOp.delete(parts[2]);
      return new Response(null, { status: 204, headers: cors });
    }

    // ── NEW PATTERNS (flat path= params used by frontend) ───────────────

    // GET ?path=list&group_id=X  OR  ?group_id=X (no path)
    if (method === 'GET' && (parts[0] === 'list' || (parts.length === 0 && url.searchParams.get('group_id')))) {
      const group_id = url.searchParams.get('group_id');
      if (!group_id) return json({ error: 'group_id required' }, 400);
      const ops = await base44.asServiceRole.entities.MilsimOp.filter({ group_id });
      return json(ops.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
    }

    // GET ?path=upcoming&limit=N  — next N ops across platform sorted by scheduled_at
    if (method === 'GET' && parts[0] === 'upcoming') {
      const limit = parseInt(url.searchParams.get('limit') ?? '3');
      const all = await base44.asServiceRole.entities.MilsimOp.filter({});
      const now = new Date();
      const upcoming = all
        .filter((o: any) => o.scheduled_at && new Date(o.scheduled_at) >= now)
        .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
        .slice(0, limit);
      return json(upcoming);
    }

    // GET ?path=group/:groupId  — list ops for a group (alias for list)
    if (method === 'GET' && parts[0] === 'group' && parts[1]) {
      const ops = await base44.asServiceRole.entities.MilsimOp.filter({ group_id: parts[1] });
      return json(ops.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
    }

    // GET ?path=:groupId/list  — list ops for group (alias)
    if (method === 'GET' && parts.length === 2 && parts[1] === 'list') {
      const ops = await base44.asServiceRole.entities.MilsimOp.filter({ group_id: parts[0] });
      return json(ops.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
    }

    // GET ?path=:opId/detail  — get single op by id
    if (method === 'GET' && parts.length === 2 && parts[1] === 'detail') {
      const op = await base44.asServiceRole.entities.MilsimOp.get(parts[0]);
      if (!op) return json({ error: 'Op not found' }, 404);
      return json(op);
    }

    // PATCH ?path=:opId/update  — update op by id (no auth check — HQ-level access)
    if (method === 'PATCH' && parts.length === 2 && parts[1] === 'update') {
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.game !== undefined) updates.game = body.game;
      if (body.scheduled_at !== undefined) updates.scheduled_at = body.scheduled_at;
      if (body.status !== undefined) updates.status = body.status;
      if (body.end_date !== undefined) updates.end_date = body.end_date;
      if (body.event_type !== undefined) updates.event_type = body.event_type;
      if (body.location !== undefined) updates.location = body.location;
      if (body.max_slots !== undefined) updates.max_slots = body.max_slots;
      const updated = await base44.asServiceRole.entities.MilsimOp.update(parts[0], updates);
      return json(updated);
    }

    // ── RSVP ROUTES ──────────────────────────────────────────────────────

    // GET ?path=my-rsvps&group_id=X
    if (method === 'GET' && parts[0] === 'my-rsvps') {
      const caller = await getCallerUser(base44, req);
      if (!caller) return json({ error: 'Unauthorized' }, 401);
      const groupId = url.searchParams.get('group_id');
      if (!groupId) return json({ error: 'group_id required' }, 400);
      const ops = await base44.asServiceRole.entities.MilsimOp.filter({ group_id: groupId });
      const opIds = ops.map((o: any) => o.id);
      const allRsvps = await base44.asServiceRole.entities.EventRSVP.filter({ user_id: caller.id });
      const relevant = allRsvps.filter((r: any) => opIds.includes(r.event_id));
      return json({ rsvps: relevant });
    }

    // POST ?path=rsvp
    if (method === 'POST' && parts[0] === 'rsvp') {
      const caller = await getCallerUser(base44, req);
      if (!caller) return json({ error: 'Unauthorized' }, 401);
      const body = await req.json().catch(() => ({}));
      const { op_id, group_id, status } = body;
      if (!op_id || !['attending', 'declined', 'maybe'].includes(status)) {
        return json({ error: 'op_id and valid status required' }, 400);
      }
      const roster = await base44.asServiceRole.entities.MilsimRoster.filter({ group_id, user_id: caller.id });
      if (!roster || roster.length === 0) return json({ error: 'Not on roster' }, 403);
      const rosterEntry = roster[0];
      const existing = await base44.asServiceRole.entities.EventRSVP.filter({ event_id: op_id, user_id: caller.id });
      let rsvp;
      if (existing && existing.length > 0) {
        rsvp = await base44.asServiceRole.entities.EventRSVP.update(existing[0].id, { status });
      } else {
        rsvp = await base44.asServiceRole.entities.EventRSVP.create({
          event_id: op_id, user_id: caller.id,
          username: caller.username ?? rosterEntry.callsign ?? '',
          status,
        });
      }
      return json({ rsvp }, 200);
    }

    return json({ error: 'Not found' }, 404);
  } catch (error: any) {
    return json({ error: error.message }, 500);
  }
});
