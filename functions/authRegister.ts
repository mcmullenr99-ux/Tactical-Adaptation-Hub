import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import * as bcrypt from 'npm:bcryptjs@2.4.3';
import { sign } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

const BANNED_USERNAMES = ['admin', 'moderator', 'system', 'root', 'staff'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return Response.json({ error: 'Username, email, and password are required' }, { status: 400 });
    }
    if (username.length < 3 || username.length > 20) {
      return Response.json({ error: 'Username must be 3-20 characters' }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return Response.json({ error: 'Username can only contain letters, numbers, underscores, and hyphens' }, { status: 400 });
    }
    if (BANNED_USERNAMES.includes(username.toLowerCase())) {
      return Response.json({ error: 'That username is reserved' }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check duplicate email
    const existingEmail = await base44.asServiceRole.entities.User.filter({ email: email.toLowerCase().trim() });
    if (existingEmail.length > 0) {
      return Response.json({ error: 'An account with that email already exists' }, { status: 409 });
    }

    // Check duplicate username (case-insensitive)
    const allUsers = await base44.asServiceRole.entities.User.list();
    const dupUsername = allUsers.find((u: any) => u.username?.toLowerCase() === username.toLowerCase());
    if (dupUsername) {
      return Response.json({ error: 'That username is already taken' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await base44.asServiceRole.entities.User.create({
      username,
      email: email.toLowerCase().trim(),
      password_hash,
      role: 'member',
      status: 'active',
    });

    const token = sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    return Response.json({
      token,
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.created_date,
      created_at: user.created_date,
      on_duty_status: 'available',
    }, { status: 201 });
  } catch (error) {
    console.error('[authRegister]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
