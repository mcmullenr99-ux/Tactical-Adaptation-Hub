import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';
/**
 * Compute duty status from activity_dates (real participation, not logins).
 * - 5-7 days/week → "active"
 * - 3-4 days/week → "available"
 * - 1-2 days/week → "on-leave"
 * - 0 days/week   → "mia"
 */
function computeWeeklyActiveDays(activityDates: string[] | null | undefined): number {
  if (!activityDates || activityDates.length === 0) return 0;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoff = sevenDaysAgo.toISOString().slice(0, 10);
  return new Set(activityDates.filter(d => d >= cutoff)).size;
}

function computeDutyStatus(activityDates: string[] | null | undefined): string {
  const weekly = computeWeeklyActiveDays(activityDates);
  if (weekly >= 5) return 'active';
  if (weekly >= 3) return 'available';
  if (weekly >= 1) return 'on-leave';
  return 'mia';
}



async function getCallerUser(base44: any, req: Request) {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/users/, '').split('/').filter(Boolean);
    const method = req.method;

    // GET /users — list users (public, limited fields)
    if (method === 'GET' && parts.length === 0) {
      const users = await base44.asServiceRole.entities.User.list();
      return Response.json(users
        .filter((u: any) => u.status === 'active')
        .map((u: any) => ({
          id: u.id, username: u.username, role: u.role,
          nationality: u.nationality ?? null,
          on_duty_status: computeDutyStatus(u.activity_dates),
          createdAt: u.created_date,
        })));
    }

    // GET /users/:id — public profile
    if (method === 'GET' && parts.length === 1 && parts[0] !== 'me') {
      const user = await base44.asServiceRole.entities.User.get(parts[0]);
      if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
      return Response.json({
        id: user.id, username: user.username, role: user.role,
        bio: user.bio ?? null, nationality: user.nationality ?? null,
        discordTag: user.discord_tag ?? null,
        on_duty_status: computeDutyStatus(user.activity_dates),
        createdAt: user.created_date,
      });
    }

    // PATCH /users/me/duty — removed: duty status is now computed automatically from last_active_at

    // GET /referral-code/mine
    if (method === 'GET' && parts[0] === 'referral-code' && parts[1] === 'mine') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      return Response.json({ code: full.referral_code ?? null });
    }

    // POST /referral-code/generate
    if (method === 'POST' && parts[0] === 'referral-code' && parts[1] === 'generate') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (full.referral_code) return Response.json({ code: full.referral_code });
      const code = full.username.toUpperCase().slice(0, 6) + Math.random().toString(36).slice(2, 6).toUpperCase();
      await base44.asServiceRole.entities.User.update(full.id, { referral_code: code });
      return Response.json({ code });
    }

    // GET /referral-code/recruits
    if (method === 'GET' && parts[0] === 'referral-code' && parts[1] === 'recruits') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!full.referral_code) return Response.json([]);
      const recruits = await base44.asServiceRole.entities.User.filter({ referred_by: full.referral_code });
      return Response.json(recruits.map((u: any) => ({ id: u.id, username: u.username, createdAt: u.created_date })));
    }

    // PATCH /duty-status — legacy endpoint
    if (method === 'PATCH' && parts.length === 0 && url.pathname.includes('duty-status')) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const body = await req.json().catch(() => ({}));
      await base44.asServiceRole.entities.User.update(full.id, { on_duty_status: body.status ?? 'available' });
      return Response.json({ on_duty_status: body.status });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[users]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
