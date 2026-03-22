import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const { secret, user_id, username, password } = body;
    if (secret !== Deno.env.get('JWT_SECRET')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!user_id || !password) {
      return Response.json({ error: 'user_id and password required' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const updates: any = { password_hash, status: 'active' };
    if (username) updates.username = username;

    await base44.asServiceRole.entities.User.update(user_id, updates);
    return Response.json({ ok: true, message: 'Password and username updated.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
