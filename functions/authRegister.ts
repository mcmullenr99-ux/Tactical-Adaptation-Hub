import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import bcrypt from 'npm:bcryptjs@2.4.3';
import { sign } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET     = Deno.env.get('JWT_SECRET')     ?? 'tag-secret-fallback-change-in-production';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const APP_URL        = Deno.env.get('APP_URL')        ?? 'https://tacticaladaptationgroup.co.uk';

// ─── DISPOSABLE EMAIL BLOCKLIST ───────────────────────────────────────────────
// Covers the most common throwaway / burner providers used for smurf accounts.
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','guerrillamail.net','guerrillamail.org',
  'guerrillamail.biz','guerrillamail.de','guerrillamail.info',
  'tempmail.com','temp-mail.org','tempinbox.com','throwam.com',
  'trashmail.com','trashmail.me','trashmail.net','trashmail.at',
  'trashmail.io','trashmail.xyz','dispostable.com','sharklasers.com',
  'guerrillamailblock.com','grr.la','spam4.me','yopmail.com',
  'yopmail.fr','cool.fr.nf','jetable.fr.nf','nospam.ze.tc',
  'nomail.xl.cx','mega.zik.dj','speed.1s.fr','courriel.fr.nf',
  'moncourrier.fr.nf','monemail.fr.nf','monmail.fr.nf','fakeinbox.com',
  'mailnull.com','spamgourmet.com','spamgourmet.net','spamgourmet.org',
  'maildrop.cc','spamfree24.org','spamfree24.de','spamfree24.info',
  'spamfree24.biz','spamfree24.net','spamfree24.com','spam.la',
  'antispam.de','spam.su','nobulk.com','tempr.email','discard.email',
  'tempsky.com','throwam.com','spamhereplease.com','binkmail.com',
  'bobmail.info','chammy.info','devnullmail.com','letthemeatspam.com',
  'mailinater.com','mailnew.com','mailshell.com','mailsiphon.com',
  'mailzilla.com','mbx.cc','mega.zik.dj','meltmail.com','mezimages.net',
  'moncourrier.fr.nf','mt2009.com','mx0.wwwnew.eu','mycleaninbox.net',
  'mytrashmail.com','netmails.com','netmails.net','netzidiot.de',
  'obobbo.com','pookmail.com','proxymail.eu','rcpt.at','rklips.com',
  'rmqkr.net','rppkn.com','rtrtr.com','s0ny.net','safe-mail.net',
  'shortmail.net','sibmail.com','skeefmail.com','smellfear.com',
  'sneakemail.com','sofimail.com','sogetthis.com','soodonims.com',
  'spam.la','spambox.us','spamcannon.com','spamcannon.net',
  'spamcon.org','spamevader.com','spamevader.net','spamfree.eu',
  'spamfree24.org','spamhole.com','spamify.com','spaminator.de',
  'spamkill.info','spaml.com','spaml.de','spammotel.com','spamobox.com',
  'spamspot.com','spamthis.co.uk','spamthisplease.com','spamtrail.com',
  'speed.1s.fr','suremail.info','teewars.org','tempemail.net',
  'tempinbox.co.uk','tempinbox.com','temporaryemail.net','tempthe.net',
  'thanksnospam.info','thisisnotmyrealemail.com','throam.com',
  'throwam.com','throwaway.email','throwam.com','tilien.com',
  'tittbit.in','tmailinator.com','toomail.biz','tradermail.info',
  'trash-mail.at','trash-mail.com','trash-mail.de','trash-mail.io',
  'trash-mail.net','trash2009.com','trashdevil.com','trashdevil.de',
  'trashemail.de','trashmail.at','trashmail.com','trashmail.io',
  'trashmail.me','trashmail.net','trashmail.org','trashmail.xyz',
  'trillianpro.com','twinmail.de','tyldd.com','uggsrock.com',
  'uroid.com','veryrealemail.com','viditag.com','webm4il.info',
  'wegwerfmail.de','wegwerfmail.net','wegwerfmail.org','wh4f.org',
  'whatpaas.com','whyspam.me','willselfdestruct.com','wilemail.com',
  'winemaven.info','wronghead.com','wuzupmail.net','xagloo.com',
  'xemaps.com','xents.com','xmaily.com','xoxy.net','xyzfree.net',
  'yapped.net','yeah.net','yep.it','yogamaven.com','yopmail.com',
  'yopmail.fr','youmail.ga','ypmail.webarnak.fr.eu.org','yuurok.com',
  'z1p.biz','za.com','zehnminuten.de','zehnminutenmail.de',
  'zippymail.info','zoemail.net','zomg.inf','10minutemail.com',
  '10minutemail.net','10minutemail.org','10minutesmail.com',
  '20minutemail.com','20minutemail.it','filzmail.com','getnada.com',
  'inoutmail.de','inoutmail.eu','inoutmail.info','inoutmail.net',
  'mintemail.com','mohmal.com','mvrht.com','mydefipay.com',
  'nwldx.com','ownmail.net','pecinan.com','pecinan.net','pecinan.org',
  'pepbot.com','pinprice.com','plexolan.de','poczta.onet.pl',
  'politikerclub.de','pooae.com','poofy.org','pookmail.com',
]);

const BANNED_USERNAMES = ['admin','moderator','system','root','staff','tag','sunray'];

// ─── IP RATE LIMIT CHECK ──────────────────────────────────────────────────────
// Returns true if this IP has registered >= 2 accounts in the last 24h
async function isIpRateLimited(base44: any, ip: string): Promise<boolean> {
  if (!ip || ip === 'unknown') return false;
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentByIp = await base44.asServiceRole.entities.User.filter({ registration_ip: ip });
    const recent = recentByIp.filter((u: any) => u.created_date && u.created_date > cutoff);
    return recent.length >= 2;
  } catch { return false; }
}

// ─── EMAIL VERIFICATION MAILER ────────────────────────────────────────────────
async function sendVerificationEmail(to: string, username: string, token: string) {
  if (!RESEND_API_KEY) return;
  const verifyUrl = `${APP_URL}/portal/verify-email?token=${token}`;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Tactical Adaptation Group <noreply@tacticaladaptationgroup.co.uk>',
      to: [to],
      subject: 'Verify your TAG email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0d1a; color: #ffffff; padding: 32px; border-radius: 8px;">
          <h2 style="color: #e63946; margin-bottom: 8px;">TACTICAL ADAPTATION GROUP</h2>
          <h3 style="color: #ffffff; margin-top: 0;">Verify Your Email, ${username}.</h3>
          <p style="color: #cccccc;">You're almost in. Click the button below to verify your email address and activate your account.</p>
          <p style="color: #aaaaaa; font-size: 13px;">This link expires in <strong style="color:#e63946;">24 hours</strong>.</p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 14px 28px; background-color: #e63946; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; font-size: 15px; letter-spacing: 1px;">VERIFY EMAIL</a>
          <p style="color: #666; font-size: 12px; margin-top: 24px;">If you didn't create a TAG account, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #333; margin: 24px 0;">
          <p style="color: #666; font-size: 12px;">Tactical Adaptation Group | tacticaladaptationgroup.co.uk</p>
        </div>
      `,
    }),
  });
}

// ─── CRYPTO TOKEN GENERATOR ───────────────────────────────────────────────────
function generateToken(length = 48): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  for (const byte of arr) result += chars[byte % chars.length];
  return result;
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const body   = await req.json().catch(() => ({}));
    const { username, email, password } = body;

    // ── Basic field validation ──────────────────────────────────────────────
    if (!username || !email || !password)
      return Response.json({ error: 'Username, email, and password are required' }, { status: 400 });
    if (username.length < 3 || username.length > 20)
      return Response.json({ error: 'Username must be 3–20 characters' }, { status: 400 });
    if (!/^[a-zA-Z0-9_-]+$/.test(username))
      return Response.json({ error: 'Username can only contain letters, numbers, underscores, and hyphens' }, { status: 400 });
    if (BANNED_USERNAMES.includes(username.toLowerCase()))
      return Response.json({ error: 'That username is reserved' }, { status: 400 });
    if (password.length < 8)
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

    const cleanEmail = email.toLowerCase().trim();

    // ── Email format check ──────────────────────────────────────────────────
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
      return Response.json({ error: 'Invalid email address' }, { status: 400 });

    // ── Disposable email check ──────────────────────────────────────────────
    const emailDomain = cleanEmail.split('@')[1];
    if (DISPOSABLE_DOMAINS.has(emailDomain))
      return Response.json({ error: 'Disposable or temporary email addresses are not permitted. Please use a real email address.' }, { status: 400 });

    // ── IP extraction (Cloudflare → x-forwarded-for fallback) ──────────────
    const registrationIp =
      req.headers.get('cf-connecting-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      'unknown';

    // ── IP rate limit (max 2 registrations per IP per 24h) ─────────────────
    const rateLimited = await isIpRateLimited(base44, registrationIp);
    if (rateLimited)
      return Response.json({ error: 'Too many accounts registered from this network recently. Please try again later or contact support.' }, { status: 429 });

    // ── Duplicate email check ───────────────────────────────────────────────
    const existingEmail = await base44.asServiceRole.entities.User.filter({ email: cleanEmail });
    if (existingEmail.length > 0)
      return Response.json({ error: 'An account with that email already exists' }, { status: 409 });

    // ── Duplicate username check (case-insensitive) ─────────────────────────
    const allUsers   = await base44.asServiceRole.entities.User.list();
    const dupUsername = allUsers.find((u: any) => u.username?.toLowerCase() === username.toLowerCase());
    if (dupUsername)
      return Response.json({ error: 'That username is already taken' }, { status: 409 });

    // ── Create account — status: pending_verification ───────────────────────
    const password_hash       = await bcrypt.hash(password, 10);
    const email_verify_token  = generateToken(48);
    const email_verify_expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const user = await base44.asServiceRole.entities.User.create({
      username,
      email: cleanEmail,
      password_hash,
      role: 'member',
      status: 'pending_verification',   // blocked from roster join until verified
      email_verified: false,
      email_verify_token,
      email_verify_expires,
      registration_ip: registrationIp,
    });

    // ── Send verification email (non-blocking) ──────────────────────────────
    sendVerificationEmail(cleanEmail, username, email_verify_token).catch(console.error);

    // ── Return token but flag unverified — frontend shows banner ────────────
    const token = sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    return Response.json({
      token,
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      email_verified: false,
      requires_verification: true,
      createdAt: user.created_date,
      created_at: user.created_date,
      on_duty_status: 'available',
    }, { status: 201 });

  } catch (error: any) {
    console.error('[authRegister]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
