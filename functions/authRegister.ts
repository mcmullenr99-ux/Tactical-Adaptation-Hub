import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import * as bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return Response.json({ error: 'username, email, and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (username.length < 2 || username.length > 50) {
      return Response.json({ error: 'Username must be 2-50 characters' }, { status: 400 });
    }

    // Check lockdown
    const settings = await base44.asServiceRole.entities.SiteSetting.filter({ key: 'lockdown_mode' });
    if (settings[0]?.value === 'true') {
      return Response.json({ error: 'Registrations are temporarily closed. Please try again later.' }, { status: 503 });
    }

    // Check for existing user by username
    const existingByUsername = await base44.asServiceRole.entities.User.filter({ username });
    if (existingByUsername.length > 0) {
      return Response.json({ error: 'Email or username already in use' }, { status: 409 });
    }

    // Check by email
    const existingByEmail = await base44.asServiceRole.entities.User.filter({ email });
    if (existingByEmail.length > 0) {
      return Response.json({ error: 'Email or username already in use' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Create user via service role
    const user = await base44.asServiceRole.entities.User.create({
      email,
      username,
      password_hash,
      role: 'member',
      status: 'active',
      totp_enabled: false,
    });

    // Audit log
    await base44.asServiceRole.entities.AuditLog.create({
      user_id: user.id,
      username: user.username,
      action_type: 'REGISTER',
      description: `New account registered: ${username} (${email})`,
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
      createdAt: user.created_date,
    }, { status: 201 });

  } catch (error) {
    console.error('[authRegister]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
