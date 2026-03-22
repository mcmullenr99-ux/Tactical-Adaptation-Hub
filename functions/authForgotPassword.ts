import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { randomBytes } from 'node:crypto';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') ?? '';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://tagHub.vercel.app';

async function sendEmail(to: string, subject: string, html: string) {
  if (!BREVO_API_KEY) { console.warn('[email] No BREVO_API_KEY, skipping send'); return; }
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'Tactical Adaptation Group', email: 'noreply.tacticaladaptationgroup@gmail.com' },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json().catch(() => ({}));
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    const users = await base44.asServiceRole.entities.User.filter({ email });
    // Always respond 200 to prevent user enumeration
    if (!users[0]) return Response.json({ message: 'If that email exists, a reset link has been sent.' });

    const user = users[0];
    const token = randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 3600 * 1000).toISOString();

    await base44.asServiceRole.entities.PasswordResetToken.create({
      user_id: user.id,
      token,
      expires_at,
      used: false,
    });

    const link = `${APP_URL}/portal/reset-password?token=${token}`;
    const html = `<p>Hello ${user.username},</p><p>Click <a href="${link}">here</a> to reset your password. Link expires in 1 hour.</p><p>If you did not request this, ignore this email.</p>`;
    await sendEmail(email, 'TAG Password Reset', html);

    return Response.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
