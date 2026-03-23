import { createClient, createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const full = await getCallerUser(base44, req);
    if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [messages, friendRequests] = await Promise.all([
      base44.asServiceRole.entities.Message.filter({ recipient_id: full.id, is_read: false }),
      base44.asServiceRole.entities.Friendship.filter({ addressee_id: full.id, status: 'pending' }),
    ]);

    const unreadMessages = messages.filter((m: any) => !m.deleted_by_recipient).length;

    return Response.json({
      unreadMessages,
      pendingFriendRequests: friendRequests.length,
      total: unreadMessages + friendRequests.length,
    });
  } catch (error) {
    console.error('[notifications]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
