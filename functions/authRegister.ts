import { createClient } from 'npm:@base44/sdk@0.8.21';
import bcrypt from 'npm:bcryptjs@2.4.3';
import { sign } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://tactical-adaptation-hub.pages.dev';

const BANNED_USERNAMES = ['admin', 'moderator', 'system', 'root', 'staff'];

async function sendWelcomeEmail(to: string, username: string) {
  if (!RESEND_API_KEY) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Tactical Adaptation Group <noreply@tacticaladaptationgroup.co.uk>',
      to: [to],
      subject: 'Welcome to Tactical Adaptation Group',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0d1a; color: #ffffff; padding: 32px; border-radius: 8px;">
          <h2 style="color: #e63946; margin-bottom: 8px;">TACTICAL ADAPTATION GROUP</h2>
          <h3 style="color: #ffffff; margin-top: 0;">Welcome, ${username}.</h3>
          <p style="color: #cccccc;">Your account has been created. You are now part of the TAG community.</p>
          <p style="color: #cccccc;">Head to the portal to complete your profile, join a milsim group, or check upcoming ops.</p>
          <a href="${APP_URL}/portal/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #e63946; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0; font-weight: bold;">GO TO PORTAL</a>
          <hr style="border: none; border-top: 1px solid #333; margin: 24px 0;">
          <p style="color: #666; font-size: 12px;">Tactical Adaptation Group | tacticaladaptationgroup.co.uk</p>
        </div>
      `,
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') ?? '' });
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

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email.toLowerCase().trim(), username).catch(console.error);

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
