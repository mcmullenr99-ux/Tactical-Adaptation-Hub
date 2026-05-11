import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

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
      : url.pathname.replace(/^\/functions\/notifications/, '').split('/').filter(Boolean);
    const method = req.method;

    // POST /notifications/send — internal service call (no auth required, internal only)
    if (method === 'POST' && parts[0] === 'send') {
      const body = await req.json().catch(() => ({}));
      const { user_id, type, title, body: notifBody, link } = body;
      if (!user_id || !type || !title || !notifBody) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 });
      }
      const notif = await base44.asServiceRole.entities.Notification.create({
        user_id, type, title, body: notifBody,
        ...(link ? { link } : {}),
        is_read: false,
      });
      return Response.json({ ok: true, id: notif.id });
    }

    // GET /notifications/mine — fetch caller's notifications
    if (method === 'GET' && parts[0] === 'mine') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const notifs = await base44.asServiceRole.entities.Notification.filter({ user_id: full.id });
      // Sort newest first
      const sorted = (notifs as any[]).sort((a: any, b: any) =>
        new Date(b.created_date ?? 0).getTime() - new Date(a.created_date ?? 0).getTime()
      );
      return Response.json(sorted);
    }

    // GET /notifications/count — unread count for badge
    if (method === 'GET' && parts[0] === 'count') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const [notifs, messages, friendRequests] = await Promise.all([
        base44.asServiceRole.entities.Notification.filter({ user_id: full.id, is_read: false }),
        base44.asServiceRole.entities.Message.filter({ recipient_id: full.id, is_read: false }),
        base44.asServiceRole.entities.Friendship.filter({ addressee_id: full.id, status: 'pending' }),
      ]);
      const unreadMessages = (messages as any[]).filter((m: any) => !m.deleted_by_recipient).length;
      return Response.json({
        notifications: (notifs as any[]).length,
        unreadMessages,
        pendingFriendRequests: (friendRequests as any[]).length,
        total: (notifs as any[]).length + unreadMessages + (friendRequests as any[]).length,
      });
    }

    // PATCH /notifications/:id/read — mark one as read
    if (method === 'PATCH' && parts.length === 2 && parts[1] === 'read') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const notif = await base44.asServiceRole.entities.Notification.get(parts[0]);
      if (!notif || notif.user_id !== full.id) return Response.json({ error: 'Not found' }, { status: 404 });
      await base44.asServiceRole.entities.Notification.update(parts[0], { is_read: true });
      return Response.json({ ok: true });
    }

    // POST /notifications/read-all — mark all as read
    if (method === 'POST' && parts[0] === 'read-all') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const unread = await base44.asServiceRole.entities.Notification.filter({ user_id: full.id, is_read: false });
      await Promise.all((unread as any[]).map((n: any) =>
        base44.asServiceRole.entities.Notification.update(n.id, { is_read: true })
      ));
      return Response.json({ ok: true, marked: (unread as any[]).length });
    }

    // DELETE /notifications/:id — delete one
    if (method === 'DELETE' && parts.length === 1) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const notif = await base44.asServiceRole.entities.Notification.get(parts[0]);
      if (!notif || notif.user_id !== full.id) return Response.json({ error: 'Not found' }, { status: 404 });
      await base44.asServiceRole.entities.Notification.delete(parts[0]);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error: any) {
    console.error('[notifications]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
