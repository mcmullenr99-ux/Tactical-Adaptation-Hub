import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import * as bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const users = await base44.asServiceRole.entities.User.filter({ email });
    const user = users[0];

    if (!user || !user.password_hash) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.status === 'suspended') {
      return Response.json({ error: 'Account suspended' }, { status: 403 });
    }
    if (user.status === 'banned') {
      const reason = user.ban_reason ? ` Reason: ${user.ban_reason}` : '';
      return Response.json({ error: `Account permanently banned.${reason}` }, { status: 403 });
    }

    await base44.asServiceRole.entities.AuditLog.create({
      user_id: user.id,
      username: user.username,
      action_type: 'LOGIN',
      description: `${user.username} logged in`,
    });

    return Response.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      bio: user.bio ?? null,
      discordTag: user.discord_tag ?? null,
      nationality: user.nationality ?? null,
      totpEnabled: user.totp_enabled ?? false,
      createdAt: user.created_date,
    });
  } catch (error) {
    console.error('[authLogin]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
