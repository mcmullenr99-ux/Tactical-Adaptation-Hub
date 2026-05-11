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

async function getFriendship(base44: any, userAId: string, userBId: string) {
  const a = await base44.asServiceRole.entities.Friendship.filter({ requester_id: userAId, addressee_id: userBId });
  if (a.length > 0) return a[0];
  const b = await base44.asServiceRole.entities.Friendship.filter({ requester_id: userBId, addressee_id: userAId });
  return b[0] ?? null;
}

async function pushNotif(base44: any, userId: string, type: string, title: string, body: string, link?: string) {
  try {
    await base44.asServiceRole.entities.Notification.create({
      user_id: userId, type, title, body,
      ...(link ? { link } : {}),
      is_read: false,
    });
  } catch (e) {
    console.error('[pushNotif] failed:', e);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/friends/, '').split('/').filter(Boolean);
    const method = req.method;

    // GET /friends — list accepted friends
    if (method === 'GET' && parts.length === 0) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const [asRequester, asAddressee] = await Promise.all([
        base44.asServiceRole.entities.Friendship.filter({ requester_id: full.id, status: 'accepted' }),
        base44.asServiceRole.entities.Friendship.filter({ addressee_id: full.id, status: 'accepted' }),
      ]);
      // Build map: friendUserId → { friendship_id, friends_since }
      const friendMap: Record<string, { friendship_id: string; friends_since: string }> = {};
      asRequester.forEach((f: any) => { friendMap[f.addressee_id] = { friendship_id: f.id, friends_since: f.created_date }; });
      asAddressee.forEach((f: any) => { friendMap[f.requester_id] = { friendship_id: f.id, friends_since: f.created_date }; });
      const friendIds = Object.keys(friendMap);
      const friends = await Promise.all(friendIds.map((id: string) => base44.asServiceRole.entities.AppUser.get(id)));
      return Response.json(friends.filter(Boolean).map((u: any) => ({
        id: u.id,
        friendship_id: friendMap[u.id]?.friendship_id ?? null,
        friends_since: friendMap[u.id]?.friends_since ?? null,
        username: u.username,
        role: u.role,
        bio: u.bio ?? null,
        discord_tag: u.discord_tag ?? null,
        nationality: u.nationality ?? null,
        avatar_url: u.avatar_url ?? null,
      })));
    }

    // GET /friends/requests
    if (method === 'GET' && parts[0] === 'requests') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const pending = await base44.asServiceRole.entities.Friendship.filter({ addressee_id: full.id, status: 'pending' });
      const withUsers = await Promise.all(pending.map(async (f: any) => {
        const sender = await base44.asServiceRole.entities.AppUser.get(f.requester_id);
        return {
          friendship_id: f.id,
          friends_since: f.created_date,
          id: sender?.id ?? f.requester_id,
          username: sender?.username ?? f.requester_username,
          role: sender?.role ?? 'member',
          bio: sender?.bio ?? null,
          discord_tag: sender?.discord_tag ?? null,
          nationality: sender?.nationality ?? null,
          avatar_url: sender?.avatar_url ?? null,
        };
      }));
      return Response.json(withUsers);
    }

    // GET /friends/status/:userId
    if (method === 'GET' && parts[0] === 'status' && parts.length === 2) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const row = await getFriendship(base44, full.id, parts[1]);
      if (!row) return Response.json({ status: 'none' });
      return Response.json({ status: row.status, friendshipId: row.id, iAmRequester: row.requester_id === full.id });
    }

    // POST /friends/request/:userId
    if (method === 'POST' && parts[0] === 'request' && parts.length === 2) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (full.id === parts[1]) return Response.json({ error: 'Cannot add yourself' }, { status: 400 });
      const existing = await getFriendship(base44, full.id, parts[1]);
      if (existing) return Response.json({ error: 'Friendship already exists', status: existing.status }, { status: 409 });
      const other = await base44.asServiceRole.entities.AppUser.get(parts[1]);
      const friendship = await base44.asServiceRole.entities.Friendship.create({
        requester_id: full.id, requester_username: full.username,
        addressee_id: parts[1], addressee_username: other?.username ?? '', status: 'pending',
      });
      // Notify addressee of the incoming request
      await pushNotif(
        base44,
        parts[1],
        'friend_request',
        full.username + ' sent you a connection request',
        'Head to Comms & Connections to accept or decline.',
        '/portal/comms?section=requests'
      );
      return Response.json(friendship, { status: 201 });
    }

    // PATCH /friends/:id/accept
    if (method === 'PATCH' && parts.length === 2 && parts[1] === 'accept') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const row = await base44.asServiceRole.entities.Friendship.get(parts[0]);
      if (!row || row.addressee_id !== full.id) return Response.json({ error: 'Not authorised' }, { status: 403 });
      const updated = await base44.asServiceRole.entities.Friendship.update(parts[0], { status: 'accepted' });
      // Notify the original requester that they were accepted
      await pushNotif(
        base44,
        row.requester_id,
        'friend_accepted',
        full.username + ' accepted your connection request',
        'You are now connected. Send them a message in Comms.',
        '/portal/comms?section=connections'
      );
      return Response.json(updated);
    }

    // PATCH /friends/:id/decline
    if (method === 'PATCH' && parts.length === 2 && parts[1] === 'decline') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const row = await base44.asServiceRole.entities.Friendship.get(parts[0]);
      if (!row || row.addressee_id !== full.id) return Response.json({ error: 'Not authorised' }, { status: 403 });
      await base44.asServiceRole.entities.Friendship.delete(parts[0]);
      return new Response(null, { status: 204 });
    }

    // DELETE /friends/:userId — unfriend
    if (method === 'DELETE' && parts.length === 1) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const row = await getFriendship(base44, full.id, parts[0]);
      if (!row) return Response.json({ error: 'Not friends' }, { status: 404 });
      await base44.asServiceRole.entities.Friendship.delete(row.id);
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error: any) {
    console.error('[friends]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
