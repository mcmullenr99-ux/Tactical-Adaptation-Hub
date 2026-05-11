/**
 * Support Tickets & Feedback API
 * Routes (via ?path=):
 *   GET    /tickets                  — list user's own tickets (staff sees all)
 *   GET    /tickets/:id              — ticket detail + replies
 *   POST   /tickets                  — create ticket
 *   POST   /tickets/:id/reply        — add reply
 *   PATCH  /tickets/:id              — update status/resolution (staff)
 *   GET    /feedback                 — list feedback (staff only)
 *   POST   /feedback                 — submit feedback
 *   PATCH  /feedback/:id             — mark reviewed (staff)
 *   DELETE /feedback/:id             — delete feedback (staff)
 *   GET    /stats                    — ticket stats (staff)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
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

function isStaff(user: any) {
  return user && ['admin', 'moderator'].includes(user.role);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });

  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path') ?? '';
    const parts = pathOverride.split('/').filter(Boolean);
    const method = req.method;

    const caller = await getCallerUser(base44, req);
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: cors() });

    // ── TICKETS ──────────────────────────────────────────────────────────────

    // GET /tickets
    if (method === 'GET' && parts[0] === 'tickets' && parts.length === 1) {
      let tickets: any[];
      if (isStaff(caller)) {
        tickets = await base44.asServiceRole.entities.SupportTicket.list().catch(() => []);
      } else {
        tickets = await base44.asServiceRole.entities.SupportTicket.filter({ user_id: caller.id }).catch(() => []);
      }
      tickets.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
      return Response.json(tickets, { headers: cors() });
    }

    // GET /tickets/:id
    if (method === 'GET' && parts[0] === 'tickets' && parts.length === 2) {
      const ticket = await base44.asServiceRole.entities.SupportTicket.get(parts[1]).catch(() => null);
      if (!ticket) return Response.json({ error: 'Ticket not found' }, { status: 404, headers: cors() });
      if (!isStaff(caller) && ticket.user_id !== caller.id)
        return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors() });
      const replies = await base44.asServiceRole.entities.TicketReply.filter({ ticket_id: parts[1] }).catch(() => []);
      replies.sort((a: any, b: any) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
      return Response.json({ ...ticket, replies }, { headers: cors() });
    }

    // POST /tickets
    if (method === 'POST' && parts[0] === 'tickets' && parts.length === 1) {
      const body = await req.json().catch(() => ({}));
      const { subject, description, category = 'other', priority = 'medium' } = body;
      if (!subject?.trim() || !description?.trim())
        return Response.json({ error: 'Subject and description required' }, { status: 400, headers: cors() });

      const ticket_number = `TKT-${Date.now().toString().slice(-6)}`;
      const ticket = await base44.asServiceRole.entities.SupportTicket.create({
        ticket_number, subject, description, category, priority,
        status: 'open',
        user_id: caller.id,
        username: caller.username,
        email: caller.email ?? '',
      });
      return Response.json(ticket, { status: 201, headers: cors() });
    }

    // POST /tickets/:id/reply
    if (method === 'POST' && parts[0] === 'tickets' && parts[2] === 'reply') {
      const ticketId = parts[1];
      const ticket = await base44.asServiceRole.entities.SupportTicket.get(ticketId).catch(() => null);
      if (!ticket) return Response.json({ error: 'Ticket not found' }, { status: 404, headers: cors() });
      if (!isStaff(caller) && ticket.user_id !== caller.id)
        return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors() });

      const body = await req.json().catch(() => ({}));
      if (!body.body?.trim()) return Response.json({ error: 'Reply body required' }, { status: 400, headers: cors() });

      // Auto-update status when staff first replies
      if (isStaff(caller) && ticket.status === 'open') {
        await base44.asServiceRole.entities.SupportTicket.update(ticketId, { status: 'in_progress' }).catch(() => {});
      }

      const reply = await base44.asServiceRole.entities.TicketReply.create({
        ticket_id: ticketId,
        body: body.body,
        author_id: caller.id,
        author_username: caller.username,
        is_staff: isStaff(caller),
      });
      return Response.json(reply, { status: 201, headers: cors() });
    }

    // PATCH /tickets/:id — update status / resolution note (staff only)
    if (method === 'PATCH' && parts[0] === 'tickets' && parts.length === 2) {
      if (!isStaff(caller)) return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors() });
      const ticket = await base44.asServiceRole.entities.SupportTicket.get(parts[1]).catch(() => null);
      if (!ticket) return Response.json({ error: 'Ticket not found' }, { status: 404, headers: cors() });
      const body = await req.json().catch(() => ({}));
      const update: any = {};
      if (body.status) update.status = body.status;
      if (body.resolution_note !== undefined) update.resolution_note = body.resolution_note;
      if (body.assigned_to !== undefined) { update.assigned_to = body.assigned_to; update.assigned_username = body.assigned_username ?? ''; }
      if (body.status === 'resolved' || body.status === 'closed') update.closed_at = new Date().toISOString();
      const updated = await base44.asServiceRole.entities.SupportTicket.update(parts[1], update);
      return Response.json(updated, { headers: cors() });
    }

    // ── FEEDBACK ─────────────────────────────────────────────────────────────

    // GET /feedback — staff only
    if (method === 'GET' && parts[0] === 'feedback') {
      if (!isStaff(caller)) return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors() });
      const feedback = await base44.asServiceRole.entities.Feedback.list().catch(() => []);
      feedback.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
      return Response.json(feedback, { headers: cors() });
    }

    // POST /feedback
    if (method === 'POST' && parts[0] === 'feedback') {
      const body = await req.json().catch(() => ({}));
      const { category = 'general', rating = 5, message, page } = body;
      if (!message?.trim()) return Response.json({ error: 'Message required' }, { status: 400, headers: cors() });
      const fb = await base44.asServiceRole.entities.Feedback.create({
        category, rating: Number(rating) || 5, message,
        page: page ?? '/',
        reviewed: false,
        user_id: caller.id,
        username: caller.username,
      });
      return Response.json(fb, { status: 201, headers: cors() });
    }

    // PATCH /feedback/:id — mark reviewed
    if (method === 'PATCH' && parts[0] === 'feedback' && parts.length === 2) {
      if (!isStaff(caller)) return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors() });
      const body = await req.json().catch(() => ({}));
      const updated = await base44.asServiceRole.entities.Feedback.update(parts[1], { reviewed: !!body.reviewed });
      return Response.json(updated, { headers: cors() });
    }

    // DELETE /feedback/:id
    if (method === 'DELETE' && parts[0] === 'feedback' && parts.length === 2) {
      if (!isStaff(caller)) return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors() });
      await base44.asServiceRole.entities.Feedback.delete(parts[1]);
      return Response.json({ success: true }, { headers: cors() });
    }

    // ── STATS ─────────────────────────────────────────────────────────────────

    // GET /stats — staff only
    if (method === 'GET' && parts[0] === 'stats') {
      if (!isStaff(caller)) return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors() });
      const [tickets, feedback] = await Promise.all([
        base44.asServiceRole.entities.SupportTicket.list().catch(() => []),
        base44.asServiceRole.entities.Feedback.list().catch(() => []),
      ]);
      return Response.json({
        total: tickets.length,
        open: tickets.filter((t: any) => t.status === 'open').length,
        in_progress: tickets.filter((t: any) => t.status === 'in_progress').length,
        resolved: tickets.filter((t: any) => t.status === 'resolved').length,
        closed: tickets.filter((t: any) => t.status === 'closed').length,
        feedback_total: feedback.length,
        feedback_unreviewed: feedback.filter((f: any) => !f.reviewed).length,
      }, { headers: cors() });
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers: cors() });

  } catch (err) {
    console.error('[support]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500, headers: cors() });
  }
});
