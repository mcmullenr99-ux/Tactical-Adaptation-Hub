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
    const parts = url.pathname.replace(/^\/functions\/messages/, '').split('/').filter(Boolean);
    const method = req.method;

    // GET /messages/inbox
    if (method === 'GET' && parts[0] === 'inbox') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const all = await base44.asServiceRole.entities.Message.filter({ recipient_id: full.id });
      const inbox = all
        .filter((m: any) => !m.deleted_by_recipient)
        .sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
      return Response.json(inbox);
    }

    // GET /messages/sent
    if (method === 'GET' && parts[0] === 'sent') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const all = await base44.asServiceRole.entities.Message.filter({ sender_id: full.id });
      const sent = all
        .filter((m: any) => !m.deleted_by_sender)
        .sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
      return Response.json(sent);
    }

    // POST /messages — send
    if (method === 'POST' && parts.length === 0) {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const body = await req.json().catch(() => ({}));
      const { recipientId, subject, body: msgBody } = body;
      if (!recipientId || !subject || !msgBody) return Response.json({ error: 'recipientId, subject, and body required' }, { status: 400 });
      if (msgBody.length > 5000) return Response.json({ error: 'Message body too long (max 5000 characters)' }, { status: 400 });
      if (subject.length > 200) return Response.json({ error: 'Subject too long (max 200 characters)' }, { status: 400 });

      const recipients = await base44.asServiceRole.entities.User.get(recipientId);
      if (!recipients) return Response.json({ error: 'Recipient not found' }, { status: 400 });

      const msg = await base44.asServiceRole.entities.Message.create({
        sender_id: full.id,
        sender_username: full.username,
        recipient_id: recipientId,
        recipient_username: recipients.username,
        subject,
        body: msgBody,
        is_read: false,
        deleted_by_sender: false,
        deleted_by_recipient: false,
      });
      return Response.json(msg, { status: 201 });
    }

    // PATCH /messages/read-all
    if (method === 'PATCH' && parts[0] === 'read-all') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const unread = await base44.asServiceRole.entities.Message.filter({ recipient_id: full.id, is_read: false });
      await Promise.all(unread.map((m: any) => base44.asServiceRole.entities.Message.update(m.id, { is_read: true })));
      return Response.json({ success: true });
    }

    // PATCH /messages/:id/read
    if (method === 'PATCH' && parts.length === 2 && parts[1] === 'read') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const msg = await base44.asServiceRole.entities.Message.get(parts[0]);
      if (!msg || msg.recipient_id !== full.id) return Response.json({ error: 'Message not found' }, { status: 404 });

      const updated = await base44.asServiceRole.entities.Message.update(parts[0], { is_read: true });
      return Response.json(updated);
    }

    // DELETE /messages/:id
    if (method === 'DELETE' && parts.length === 1) {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const msg = await base44.asServiceRole.entities.Message.get(parts[0]);
      if (!msg) return Response.json({ error: 'Message not found' }, { status: 404 });

      if (msg.sender_id === full.id) {
        await base44.asServiceRole.entities.Message.update(parts[0], { deleted_by_sender: true });
      } else if (msg.recipient_id === full.id) {
        await base44.asServiceRole.entities.Message.update(parts[0], { deleted_by_recipient: true });
      } else {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[messages]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
