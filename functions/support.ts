/**
 * Support Tickets & Feedback API
 * Routes (via ?path=):
 *   GET    /tickets                  — list user's own tickets
 *   GET    /tickets/:id              — ticket detail + replies
 *   POST   /tickets                  — create ticket
 *   POST   /tickets/:id/reply        — add reply
 *   PATCH  /tickets/:id              — update status/resolution (staff)
 *   GET    /feedback                 — list feedback (staff)
 *   POST   /feedback                 — submit feedback
 *   PATCH  /feedback/:id             — mark reviewed (staff)
 *   DELETE /feedback/:id             — delete feedback (staff)
 *   GET    /stats                    — ticket stats (staff)
 */

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

function isStaff(user: any) {
  return user && ['admin', 'moderator'].includes(user.role);
}

let ticketCounter = 0;
async function makeTicketNumber(base44: any): Promise<string> {
  const all = await base44.asServiceRole.entities.AuditLog.filter({ action_type: 'ticket_create' }).catch(() => []);
  const num = String(all.length + 1 + ticketCounter++).padStart(4, '0');
  return `TKT-${num}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/support/, '').split('/').filter(Boolean);
    const method = req.method;

    const caller = await getCallerUser(base44, req);
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // ── TICKETS ──────────────────────────────────────────────────────────────

    // GET /tickets
    if (method === 'GET' && parts[0] === 'tickets' && parts.length === 1) {
      let tickets: any[];
      if (isStaff(caller)) {
        tickets = await base44.asServiceRole.entities.AuditLog.filter({ action_type: 'support_ticket' }).catch(() => []);
      } else {
        tickets = await base44.asServiceRole.entities.AuditLog.filter({
          action_type: 'support_ticket',
          user_id: caller.id,
        }).catch(() => []);
      }
      // Parse ticket data from description/new_snapshot
      const parsed = tickets.map((t: any) => {
        try { return { ...JSON.parse(t.new_snapshot ?? '{}'), id: t.id, created_date: t.created_date }; }
        catch { return null; }
      }).filter(Boolean);
      return Response.json(parsed.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
    }

    // GET /tickets/:id
    if (method === 'GET' && parts[0] === 'tickets' && parts.length === 2) {
      const ticketLog = await base44.asServiceRole.entities.AuditLog.get(parts[1]).catch(() => null);
      if (!ticketLog) return Response.json({ error: 'Ticket not found' }, { status: 404 });
      let ticket: any;
      try { ticket = { ...JSON.parse(ticketLog.new_snapshot ?? '{}'), id: ticketLog.id, created_date: ticketLog.created_date }; }
      catch { return Response.json({ error: 'Malformed ticket' }, { status: 500 }); }
      if (!isStaff(caller) && ticket.user_id !== caller.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      // Replies are SecurityIncidents with incident_type='ticket_reply' and target_id=ticketId
      const replyLogs = await base44.asServiceRole.entities.SecurityIncident.filter({
        incident_type: 'ticket_reply',
        user_id: ticketLog.id,
      }).catch(() => []);
      const replies = replyLogs.map((r: any) => {
        try { return { ...JSON.parse(r.description ?? '{}'), id: r.id, created_date: r.created_date }; }
        catch { return null; }
      }).filter(Boolean).sort((a: any, b: any) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
      return Response.json({ ...ticket, replies });
    }

    // POST /tickets
    if (method === 'POST' && parts[0] === 'tickets' && parts.length === 1) {
      const body = await req.json().catch(() => ({}));
      const { subject, description, category = 'other', priority = 'medium' } = body;
      if (!subject || !description) return Response.json({ error: 'Subject and description required' }, { status: 400 });
      const ticket_number = `TKT-${Date.now().toString().slice(-6)}`;
      const ticket = {
        ticket_number, subject, description, category, priority,
        status: 'open', user_id: caller.id, username: caller.username,
      };
      const record = await base44.asServiceRole.entities.AuditLog.create({
        action_type: 'support_ticket',
        user_id: caller.id,
        username: caller.username,
        description: `[Support Ticket] ${subject}`,
        new_snapshot: JSON.stringify(ticket),
        method: 'POST',
        path: '/support/tickets',
      });
      return Response.json({ ...ticket, id: record.id, created_date: record.created_date }, { status: 201 });
    }

    // POST /tickets/:id/reply
    if (method === 'POST' && parts[0] === 'tickets' && parts[2] === 'reply') {
      const ticketId = parts[1];
      const ticketLog = await base44.asServiceRole.entities.AuditLog.get(ticketId).catch(() => null);
      if (!ticketLog) return Response.json({ error: 'Ticket not found' }, { status: 404 });
      let ticket: any;
      try { ticket = JSON.parse(ticketLog.new_snapshot ?? '{}'); }
      catch { return Response.json({ error: 'Malformed ticket' }, { status: 500 }); }
      if (!isStaff(caller) && ticket.user_id !== caller.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      if (!body.body?.trim()) return Response.json({ error: 'Reply body required' }, { status: 400 });
      const reply = {
        ticket_id: ticketId, body: body.body, author_id: caller.id,
        author_username: caller.username, is_staff: isStaff(caller),
      };
      // Update ticket status if staff is replying
      if (isStaff(caller) && ticket.status === 'open') {
        ticket.status = 'in_progress';
        await base44.asServiceRole.entities.AuditLog.update(ticketId, {
          new_snapshot: JSON.stringify(ticket),
        }).catch(() => {});
      }
      const record = await base44.asServiceRole.entities.SecurityIncident.create({
        incident_type: 'ticket_reply',
        severity: 'low',
        user_id: ticketId, // abuse this field to link reply → ticket
        username: caller.username,
        description: JSON.stringify(reply),
        resolved: false,
      });
      return Response.json({ ...reply, id: record.id, created_date: record.created_date }, { status: 201 });
    }

    // PATCH /tickets/:id — update status / resolution note (staff)
    if (method === 'PATCH' && parts[0] === 'tickets' && parts.length === 2) {
      if (!isStaff(caller)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const ticketLog = await base44.asServiceRole.entities.AuditLog.get(parts[1]).catch(() => null);
      if (!ticketLog) return Response.json({ error: 'Ticket not found' }, { status: 404 });
      let ticket: any;
      try { ticket = JSON.parse(ticketLog.new_snapshot ?? '{}'); }
      catch { return Response.json({ error: 'Malformed ticket' }, { status: 500 }); }
      const body = await req.json().catch(() => ({}));
      if (body.status) ticket.status = body.status;
      if (body.resolution_note !== undefined) ticket.resolution_note = body.resolution_note;
      await base44.asServiceRole.entities.AuditLog.update(parts[1], { new_snapshot: JSON.stringify(ticket) });
      return Response.json({ ...ticket, id: parts[1] });
    }

    // ── FEEDBACK ─────────────────────────────────────────────────────────────

    // GET /feedback — staff only
    if (method === 'GET' && parts[0] === 'feedback') {
      if (!isStaff(caller)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const logs = await base44.asServiceRole.entities.AuditLog.filter({ action_type: 'support_feedback' }).catch(() => []);
      const parsed = logs.map((l: any) => {
        try { return { ...JSON.parse(l.new_snapshot ?? '{}'), id: l.id, created_date: l.created_date }; }
        catch { return null; }
      }).filter(Boolean);
      return Response.json(parsed.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
    }

    // POST /feedback
    if (method === 'POST' && parts[0] === 'feedback') {
      const body = await req.json().catch(() => ({}));
      const { category = 'general', rating = 5, message, page } = body;
      if (!message?.trim()) return Response.json({ error: 'Message required' }, { status: 400 });
      const fb = {
        category, rating, message, page: page ?? '/', reviewed: false,
        user_id: caller.id, username: caller.username,
      };
      const record = await base44.asServiceRole.entities.AuditLog.create({
        action_type: 'support_feedback',
        user_id: caller.id, username: caller.username,
        description: `[Feedback] ${category} — ${message.slice(0, 60)}`,
        new_snapshot: JSON.stringify(fb),
        method: 'POST', path: '/support/feedback',
      });
      return Response.json({ ...fb, id: record.id, created_date: record.created_date }, { status: 201 });
    }

    // PATCH /feedback/:id
    if (method === 'PATCH' && parts[0] === 'feedback' && parts.length === 2) {
      if (!isStaff(caller)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const log = await base44.asServiceRole.entities.AuditLog.get(parts[1]).catch(() => null);
      if (!log) return Response.json({ error: 'Not found' }, { status: 404 });
      const body = await req.json().catch(() => ({}));
      let fb: any;
      try { fb = JSON.parse(log.new_snapshot ?? '{}'); } catch { fb = {}; }
      if (body.reviewed !== undefined) fb.reviewed = body.reviewed;
      await base44.asServiceRole.entities.AuditLog.update(parts[1], { new_snapshot: JSON.stringify(fb) });
      return Response.json({ ...fb, id: parts[1] });
    }

    // DELETE /feedback/:id
    if (method === 'DELETE' && parts[0] === 'feedback' && parts.length === 2) {
      if (!isStaff(caller)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.AuditLog.delete(parts[1]).catch(() => {});
      return Response.json({ ok: true });
    }

    // ── STATS (staff) ─────────────────────────────────────────────────────────

    if (method === 'GET' && parts[0] === 'stats') {
      if (!isStaff(caller)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const [ticketLogs, feedbackLogs] = await Promise.all([
        base44.asServiceRole.entities.AuditLog.filter({ action_type: 'support_ticket' }).catch(() => []),
        base44.asServiceRole.entities.AuditLog.filter({ action_type: 'support_feedback' }).catch(() => []),
      ]);
      const tickets = ticketLogs.map((t: any) => { try { return JSON.parse(t.new_snapshot ?? '{}'); } catch { return {}; } });
      const open_count     = tickets.filter((t: any) => t.status === 'open').length;
      const inprog_count   = tickets.filter((t: any) => t.status === 'in_progress').length;
      const resolved_count = tickets.filter((t: any) => t.status === 'resolved' || t.status === 'closed').length;
      const avg_rating     = feedbackLogs.length > 0
        ? Math.round(feedbackLogs.reduce((sum: number, l: any) => {
            try { return sum + (JSON.parse(l.new_snapshot ?? '{}').rating ?? 5); } catch { return sum + 5; }
          }, 0) / feedbackLogs.length * 10) / 10
        : 0;
      const critical_count = tickets.filter((t: any) => t.priority === 'critical' && (t.status === 'open' || t.status === 'in_progress')).length;
      const unreviewed_count = feedbackLogs.filter((l: any) => { try { return !JSON.parse(l.new_snapshot ?? '{}').reviewed; } catch { return true; } }).length;
      return Response.json({
        tickets: {
          total: tickets.length,
          open: open_count,
          in_progress: inprog_count,
          resolved: resolved_count,
          critical: critical_count,
        },
        feedback: {
          total: feedbackLogs.length,
          unreviewed: unreviewed_count,
          avg_rating,
        },
      });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[support]', error);
    return Response.json({ error: error?.message ?? 'Unknown error' }, { status: 500 });
  }
});
