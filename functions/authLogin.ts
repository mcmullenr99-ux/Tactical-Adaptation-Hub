import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import bcrypt from 'npm:bcryptjs@2.4.3';
import { sign } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const users = await base44.asServiceRole.entities.AppUser.filter({ email: email.toLowerCase().trim() });
    const user = users[0];

    if (!user || !user.password_hash) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.status === 'pending_verification' || user.email_verified === false) {
      return Response.json({
        error: 'Please verify your email address before logging in. Check your inbox for a verification link.',
        requires_verification: true,
        email: user.email,
      }, { status: 403 });
    }
    if (user.status === 'suspended') {
      return Response.json({ error: 'Account suspended' }, { status: 403 });
    }
    if (user.status === 'banned') {
      const reason = user.ban_reason ? ` Reason: ${user.ban_reason}` : '';
      return Response.json({ error: `Account permanently banned.${reason}` }, { status: 403 });
    }

    const token = sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    // Update activity tracking
    await base44.asServiceRole.entities.AppUser.update(user.id, {
      last_active_at: new Date().toISOString(),
      login_count: (user.login_count ?? 0) + 1,
    }).catch(() => {}); // non-fatal

    await base44.asServiceRole.entities.AuditLog.create({
      user_id: user.id,
      username: user.username,
      action_type: 'LOGIN',
      description: `${user.username} logged in`,
    });

    return Response.json({
      token,
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      bio: user.bio ?? null,
      discordTag: user.discord_tag ?? null,
      nationality: user.nationality ?? null,
      steam_profile_url: user.steam_profile_url ?? null,
      xbox_gamertag: user.xbox_gamertag ?? null,
      psn_id: user.psn_id ?? null,
      last_active_at: user.last_active_at ?? null,
      login_count: (user.login_count ?? 0) + 1,
      totpEnabled: user.totp_enabled ?? false,
      createdAt: user.created_date,
      created_at: user.created_date,
      on_duty_status: user.on_duty_status ?? 'available',
    });
  } catch (error) {
    console.error('[authLogin]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
