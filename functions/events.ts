import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

async function getCallerUser(base44: any) {
  const user = await base44.auth.me();
  if (!user) return null;
  const users = await base44.asServiceRole.entities.User.filter({ email: user.email });
  return users[0] ?? null;
}

const STAFF = ['staff', 'moderator', 'admin'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const parts = url.pathname.replace(/^\/functions\/events/, '').split('/').filter(Boolean);
    const method = req.method;

    // GET /events
    if (method === 'GET' && parts.length === 0) {
      const all = await base44.asServiceRole.entities.OpsEvent.list();
      const sorted = all.sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
      return Response.json(sorted);
    }

    // GET /events/:id
    if (method === 'GET' && parts.length === 1) {
      const event = await base44.asServiceRole.entities.OpsEvent.get(parts[0]);
      if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });
      const rsvps = await base44.asServiceRole.entities.EventRSVP.filter({ event_id: parts[0] });
      return Response.json({ ...event, rsvps });
    }

    // POST /events
    if (method === 'POST' && parts.length === 0) {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!STAFF.includes(full.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const body = await req.json().catch(() => ({}));
      const { title, game, description, eventDate, endDate, maxSlots, eventType, location } = body;
      if (!title || !eventDate) return Response.json({ error: 'Title and event date are required' }, { status: 400 });

      const event = await base44.asServiceRole.entities.OpsEvent.create({
        title, game: game ?? null, description: description ?? null,
        event_date: new Date(eventDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        organizer_id: full.id, organizer_username: full.username,
        max_slots: maxSlots ?? null, event_type: eventType ?? 'ops',
        location: location ?? null, status: 'scheduled',
      });

      await base44.asServiceRole.entities.AuditLog.create({
        user_id: full.id, username: full.username,
        action_type: 'CREATE', target_table: 'OpsEvent', target_id: event.id,
        description: `${full.username} created event: ${title}`,
      });

      return Response.json(event, { status: 201 });
    }

    // PATCH /events/:id
    if (method === 'PATCH' && parts.length === 1) {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!STAFF.includes(full.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const event = await base44.asServiceRole.entities.OpsEvent.get(parts[0]);
      if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.game !== undefined) updates.game = body.game;
      if (body.description !== undefined) updates.description = body.description;
      if (body.eventDate !== undefined) updates.event_date = new Date(body.eventDate).toISOString();
      if (body.endDate !== undefined) updates.end_date = new Date(body.endDate).toISOString();
      if (body.maxSlots !== undefined) updates.max_slots = body.maxSlots;
      if (body.status !== undefined) updates.status = body.status;
      if (body.eventType !== undefined) updates.event_type = body.eventType;
      if (body.location !== undefined) updates.location = body.location;

      const updated = await base44.asServiceRole.entities.OpsEvent.update(parts[0], updates);
      return Response.json(updated);
    }

    // DELETE /events/:id
    if (method === 'DELETE' && parts.length === 1) {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!STAFF.includes(full.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });

      await base44.asServiceRole.entities.OpsEvent.delete(parts[0]);
      return new Response(null, { status: 204 });
    }

    // POST /events/:id/rsvp
    if (method === 'POST' && parts.length === 2 && parts[1] === 'rsvp') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const { status } = await req.json().catch(() => ({ status: 'attending' }));
      const existing = await base44.asServiceRole.entities.EventRSVP.filter({ event_id: parts[0], user_id: full.id });

      if (existing.length > 0) {
        const updated = await base44.asServiceRole.entities.EventRSVP.update(existing[0].id, { status });
        return Response.json(updated);
      }

      const rsvp = await base44.asServiceRole.entities.EventRSVP.create({
        event_id: parts[0], user_id: full.id, username: full.username, status: status ?? 'attending',
      });
      return Response.json(rsvp, { status: 201 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[events]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
