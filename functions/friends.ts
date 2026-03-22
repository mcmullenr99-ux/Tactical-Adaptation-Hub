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

async function getFriendship(base44: any, userAId: string, userBId: string) {
  const a = await base44.asServiceRole.entities.Friendship.filter({ requester_id: userAId, addressee_id: userBId });
  if (a.length > 0) return a[0];
  const b = await base44.asServiceRole.entities.Friendship.filter({ requester_id: userBId, addressee_id: userAId });
  return b[0] ?? null;
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
      const friendIds = [...asRequester.map((f: any) => f.addressee_id), ...asAddressee.map((f: any) => f.requester_id)];
      const friends = await Promise.all(friendIds.map((id: string) => base44.asServiceRole.entities.User.get(id)));
      return Response.json(friends.filter(Boolean).map((u: any) => ({ id: u.id, username: u.username, role: u.role, bio: u.bio ?? null, discord_tag: u.discord_tag ?? null, nationality: u.nationality ?? null })));
    }

    // GET /friends/requests
    if (method === 'GET' && parts[0] === 'requests') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const pending = await base44.asServiceRole.entities.Friendship.filter({ addressee_id: full.id, status: 'pending' });
      const withUsers = await Promise.all(pending.map(async (f: any) => {
        const sender = await base44.asServiceRole.entities.User.get(f.requester_id);
        return { friendship_id: f.id, ...f, user: sender };
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
      const other = await base44.asServiceRole.entities.User.get(parts[1]);
      const friendship = await base44.asServiceRole.entities.Friendship.create({
        requester_id: full.id, requester_username: full.username,
        addressee_id: parts[1], addressee_username: other?.username ?? '', status: 'pending',
      });
      return Response.json(friendship, { status: 201 });
    }

    // PATCH /friends/:id/accept
    if (method === 'PATCH' && parts.length === 2 && parts[1] === 'accept') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const row = await base44.asServiceRole.entities.Friendship.get(parts[0]);
      if (!row || row.addressee_id !== full.id) return Response.json({ error: 'Not authorised' }, { status: 403 });
      return Response.json(await base44.asServiceRole.entities.Friendship.update(parts[0], { status: 'accepted' }));
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
  } catch (error) {
    console.error('[friends]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
