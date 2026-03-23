import { createClient } from 'npm:@base44/sdk@0.8.21';
import { randomBytes } from 'node:crypto';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://tactical-adaptation-hub.pages.dev';

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) { console.warn('[email] No RESEND_API_KEY, skipping send'); return; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Tactical Adaptation Group <noreply@tacticaladaptationgroup.co.uk>',
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('[email] Resend error:', err);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') ?? '' });
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
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Tactical Adaptation Group</h2>
        <p>Hello <strong>${user.username}</strong>,</p>
        <p>We received a request to reset your password. Click the button below to proceed:</p>
        <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #e63946; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #999; font-size: 12px;">Tactical Adaptation Group | tacticaladaptationgroup.co.uk</p>
      </div>
    `;
    await sendEmail(email, 'TAG - Password Reset Request', html);

    return Response.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
