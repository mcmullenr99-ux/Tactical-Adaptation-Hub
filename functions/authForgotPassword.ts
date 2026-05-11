import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { randomBytes } from 'node:crypto';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const APP_URL = (Deno.env.get('APP_URL') ?? 'https://tacticaladaptationgroup.co.uk').replace(/\/+$/, '');

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
    const base44 = createClientFromRequest(req);
    const { email } = await req.json().catch(() => ({}));
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    const users = await base44.asServiceRole.entities.AppUser.filter({ email });
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0d1a; color: #ffffff; padding: 32px; border-radius: 8px;">
        <h2 style="color: #e63946; margin-bottom: 8px;">TACTICAL ADAPTATION GROUP</h2>
        <h3 style="color: #ffffff; margin-top: 0;">Password Reset Request</h3>
        <p style="color: #cccccc;">Hello <strong>${user.username}</strong>,</p>
        <p style="color: #cccccc;">We received a request to reset your password. Click the button below to proceed:</p>
        <p style="color: #aaaaaa; font-size: 13px;">This link expires in <strong style="color:#e63946;">1 hour</strong>.</p>
        <a href="${link}" style="display: inline-block; padding: 14px 28px; background-color: #e63946; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; font-size: 15px; letter-spacing: 1px;">RESET PASSWORD</a>
        <p style="color: #666; font-size: 12px; margin-top: 24px;">If you did not request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #333; margin: 24px 0;">
        <p style="color: #666; font-size: 12px;">Tactical Adaptation Group | tacticaladaptationgroup.co.uk</p>
      </div>
    `;
    await sendEmail(email, 'TAG — Password Reset Request', html);

    return Response.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
