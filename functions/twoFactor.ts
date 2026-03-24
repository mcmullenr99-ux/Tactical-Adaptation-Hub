import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';
import bcrypt from 'npm:bcryptjs@2.4.3';
import * as OTPAuth from 'npm:otpauth@9.3.6';
import { encodeBase32 } from 'npm:@oslojs/encoding@1.1.0';
import QRCode from 'npm:qrcode@1.5.4';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';
const APP_NAME = 'TAG-HQ';

async function getCallerUser(base44: any, req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    return await base44.asServiceRole.entities.User.get(payload.sub) ?? null;
  } catch { return null; }
}

function generateSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32(bytes).replace(/=/g, '');
}

function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(5);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    codes.push(`${hex.slice(0, 5)}-${hex.slice(5)}`);
  }
  return codes;
}

function verifyTOTP(secret: string, code: string): boolean {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: APP_NAME,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const delta = totp.validate({ token: code.replace(/\s/g, ''), window: 1 });
    return delta !== null;
  } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const rawPath = pathOverride ?? url.pathname.replace(/^\/functions\/twoFactor/, '');
    const parts = rawPath.split('/').filter(Boolean);
    const method = req.method;

    const caller = await getCallerUser(base44, req);
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // GET /status
    if (method === 'GET' && parts[0] === 'status') {
      return Response.json({ enabled: caller.totp_enabled ?? false });
    }

    // POST /setup — generate secret + QR code
    if (method === 'POST' && parts[0] === 'setup') {
      const secret = generateSecret();
      const totp = new OTPAuth.TOTP({
        issuer: APP_NAME,
        label: caller.email ?? caller.username,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret),
      });
      const otpauthUrl = totp.toString();
      const qrCode = await QRCode.toDataURL(otpauthUrl);

      // Store secret temporarily (not enabled yet — only enabled after verify)
      await base44.asServiceRole.entities.User.update(caller.id, {
        totp_secret: secret,
        totp_enabled: false,
      });

      return Response.json({ qrCode, secret });
    }

    // POST /verify-setup — confirm code and enable 2FA
    if (method === 'POST' && parts[0] === 'verify-setup') {
      const body = await req.json().catch(() => ({}));
      const code = (body.code ?? '').toString().replace(/\s/g, '');
      if (!code) return Response.json({ error: 'Code required' }, { status: 400 });

      const secret = caller.totp_secret;
      if (!secret) return Response.json({ error: 'No setup in progress — call /setup first' }, { status: 400 });

      if (!verifyTOTP(secret, code)) {
        return Response.json({ error: 'Invalid code — check your authenticator app and try again' }, { status: 400 });
      }

      const backupCodes = generateBackupCodes();
      // Hash backup codes for storage
      const hashedCodes = await Promise.all(backupCodes.map(c => bcrypt.hash(c, 10)));

      await base44.asServiceRole.entities.User.update(caller.id, {
        totp_enabled: true,
        totp_backup_codes: hashedCodes,
      });

      return Response.json({ backupCodes });
    }

    // POST /disable — requires password (and optionally TOTP code)
    if (method === 'POST' && parts[0] === 'disable') {
      const body = await req.json().catch(() => ({}));
      const password = body.password ?? '';
      if (!password) return Response.json({ error: 'Password required' }, { status: 400 });

      const valid = await bcrypt.compare(password, caller.password_hash ?? '');
      if (!valid) return Response.json({ error: 'Incorrect password' }, { status: 400 });

      await base44.asServiceRole.entities.User.update(caller.id, {
        totp_enabled: false,
        totp_secret: null,
        totp_backup_codes: [],
      });

      return Response.json({ success: true });
    }

    // GET /backup-codes — return placeholder message (codes not stored in plain text)
    if (method === 'GET' && parts[0] === 'backup-codes') {
      if (!caller.totp_enabled) {
        return Response.json({ error: '2FA is not enabled' }, { status: 400 });
      }
      // Backup codes are hashed — can't return originals. Prompt regeneration instead.
      return Response.json({
        backupCodes: [],
        message: 'Backup codes are stored hashed and cannot be retrieved. Use regenerate to get new ones.',
      });
    }

    // POST /regenerate-backup-codes — requires password
    if (method === 'POST' && parts[0] === 'regenerate-backup-codes') {
      const body = await req.json().catch(() => ({}));
      const password = body.password ?? '';
      if (!password) return Response.json({ error: 'Password required' }, { status: 400 });

      const valid = await bcrypt.compare(password, caller.password_hash ?? '');
      if (!valid) return Response.json({ error: 'Incorrect password' }, { status: 400 });

      const backupCodes = generateBackupCodes();
      const hashedCodes = await Promise.all(backupCodes.map(c => bcrypt.hash(c, 10)));

      await base44.asServiceRole.entities.User.update(caller.id, {
        totp_backup_codes: hashedCodes,
      });

      return Response.json({ backupCodes });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error: any) {
    console.error('[twoFactor]', error);
    return Response.json({ error: error?.message ?? 'Unknown error' }, { status: 500 });
  }
});
