import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const users = await base44.asServiceRole.entities.User.filter({ email: user.email });
    const full = users[0];
    if (!full) return Response.json({ error: 'User not found' }, { status: 404 });

    const [messages, friendRequests] = await Promise.all([
      base44.asServiceRole.entities.Message.filter({ recipient_id: full.id, is_read: false }),
      base44.asServiceRole.entities.Friendship.filter({ addressee_id: full.id, status: 'pending' }),
    ]);

    const unreadMessages = messages.filter((m: any) => !m.deleted_by_recipient).length;

    return Response.json({
      unreadMessages,
      pendingFriendRequests: friendRequests.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
