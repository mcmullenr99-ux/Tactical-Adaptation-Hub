import { createClient } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET     = Deno.env.get('JWT_SECRET')     ?? 'tag-secret-fallback-change-in-production';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const APP_URL        = (Deno.env.get('APP_URL') ?? 'https://tacticaladaptationgroup.co.uk').replace(/\/+$/, '');

function generateToken(length = 48): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  for (const byte of arr) result += chars[byte % chars.length];
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID')!, serviceToken: Deno.env.get('BASE44_SERVICE_TOKEN')! });

    const authHeader = req.headers.get('Authorization') ?? '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const body = await req.json().catch(() => ({}));

    let user: any = null;

    if (bearerToken) {
      let payload: any;
      try { payload = verify(bearerToken, JWT_SECRET); } catch { return Response.json({ error: 'Invalid token' }, { status: 401 }); }
      user = await base44.entities.User.get(payload.sub);
    } else if (body.email) {
      const found = await base44.entities.User.filter({ email: body.email.toLowerCase().trim() });
      user = found[0] ?? null;
    } else {
      return Response.json({ error: 'Email or authentication token required' }, { status: 400 });
    }

    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
    if (user.email_verified) return Response.json({ error: 'Email is already verified' }, { status: 400 });

    if (user.email_verify_expires) {
      const expiresAt = new Date(user.email_verify_expires).getTime();
      const issuedAt  = expiresAt - 24 * 60 * 60 * 1000;
      const secsSinceIssue = (Date.now() - issuedAt) / 1000;
      if (secsSinceIssue < 300)
        return Response.json({ error: 'Please wait a few minutes before requesting another verification email.' }, { status: 429 });
    }

    const newToken   = generateToken(48);
    const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await base44.entities.User.update(user.id, {
      email_verify_token:   newToken,
      email_verify_expires: newExpires,
    });

    if (RESEND_API_KEY) {
      const verifyUrl = `${APP_URL}/portal/verify-email?token=${newToken}`;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Tactical Adaptation Group <noreply@tacticaladaptationgroup.co.uk>',
          to: [user.email],
          subject: 'Verify your TAG email address',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0d1a; color: #ffffff; padding: 32px; border-radius: 8px;">
              <h2 style="color: #e63946; margin-bottom: 8px;">TACTICAL ADAPTATION GROUP</h2>
              <h3 style="color: #ffffff; margin-top: 0;">Email Verification</h3>
              <p style="color: #cccccc;">Click below to verify your email address. This link expires in <strong style="color:#e63946;">24 hours</strong>.</p>
              <a href="${verifyUrl}" style="display: inline-block; padding: 14px 28px; background-color: #e63946; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; font-size: 15px; letter-spacing: 1px;">VERIFY EMAIL</a>
              <hr style="border: none; border-top: 1px solid #333; margin: 24px 0;">
              <p style="color: #666; font-size: 12px;">Tactical Adaptation Group | tacticaladaptationgroup.co.uk</p>
            </div>
          `,
        }),
      });
    }

    return Response.json({ success: true, message: 'Verification email sent.' });
  } catch (error: any) {
    console.error('[authResendVerification]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
