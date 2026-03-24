import { createClient } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';
import bcrypt from 'npm:bcryptjs@2.4.3';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

async function getUserFromRequest(req: Request, base44: any): Promise<any | null> {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    const user = await base44.asServiceRole.entities.User.get(payload.sub);
    return user ?? null;
  } catch {
    return null;
  }
}

/**
 * Derive duty status automatically from last_active_at.
 * - Within 24h  → "active"     (recently online)
 * - Within 7d   → "available"  (active this week)
 * - Within 30d  → "on-leave"   (gone quiet)
 * - Beyond 30d  → "mia"        (missing in action)
 */
function computeDutyStatus(lastActiveAt: string | null | undefined): string {
  if (!lastActiveAt) return 'mia';
  const last = new Date(lastActiveAt);
  if (isNaN(last.getTime())) return 'mia';
  const diffMs = Date.now() - last.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 1)  return 'active';
  if (diffDays < 7)  return 'available';
  if (diffDays < 30) return 'on-leave';
  return 'mia';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') ?? '' });
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/authMe/, '').split('/').filter(Boolean);
    const method = req.method;

    const user = await getUserFromRequest(req, base44);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // GET / — return current user + update last_active_at as heartbeat
    if (method === 'GET' && parts.length === 0) {
      const now = new Date().toISOString();
      // Heartbeat: update last_active_at on every /me call (throttled to once per 5 min to avoid noise)
      const lastActive = user.last_active_at ? new Date(user.last_active_at) : null;
      const msSinceLast = lastActive ? Date.now() - lastActive.getTime() : Infinity;
      if (msSinceLast > 5 * 60 * 1000) {
        await base44.asServiceRole.entities.User.update(user.id, { last_active_at: now });
        user.last_active_at = now;
      }

      const dutyStatus = computeDutyStatus(user.last_active_at);

      return Response.json({
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
        login_count: user.login_count ?? 0,
        totpEnabled: user.totp_enabled ?? false,
        createdAt: user.created_date,
        created_at: user.created_date,
        on_duty_status: dutyStatus,
      });
    }

    // DELETE / — delete own account
    if (method === 'DELETE' && parts.length === 0) {
      const body = await req.json().catch(() => ({}));
      if (!body.password) return Response.json({ error: 'Password required to delete account' }, { status: 400 });
      const valid = await bcrypt.compare(body.password, user.password_hash ?? '');
      if (!valid) return Response.json({ error: 'Incorrect password' }, { status: 400 });
      await base44.asServiceRole.entities.User.delete(user.id);
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[authMe]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
