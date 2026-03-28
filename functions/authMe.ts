import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';
import bcrypt from 'npm:bcryptjs@2.4.3';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

async function getUserFromRequest(req: Request, base44: any): Promise<any | null> {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    const user = await base44.asServiceRole.entities.AppUser.get(payload.sub);
    return user ?? null;
  } catch {
    return null;
  }
}

/**
 * Count unique active days in the last 7 days from activity_dates array.
 * activity_dates = ["2026-03-20", "2026-03-22", ...] — deduplicated ISO date strings
 * populated by AAR participation, Op attendance, and Training completion.
 */
function computeWeeklyActiveDays(activityDates: string[] | null | undefined): number {
  if (!activityDates || activityDates.length === 0) return 0;
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoff = sevenDaysAgo.toISOString().slice(0, 10); // "YYYY-MM-DD"
  const unique = new Set(activityDates.filter(d => d >= cutoff));
  return unique.size;
}

/**
 * Derive duty status from weekly active days (cross-referenced with real activity).
 * - 5-7 days/week → "active"      (fully committed)
 * - 3-4 days/week → "available"   (regularly active)
 * - 1-2 days/week → "on-leave"    (light activity)
 * - 0 days/week   → "mia"         (no recorded activity this week)
 */
function computeDutyStatus(activityDates: string[] | null | undefined): string {
  const weekly = computeWeeklyActiveDays(activityDates);
  if (weekly >= 5) return 'active';
  if (weekly >= 3) return 'available';
  if (weekly >= 1) return 'on-leave';
  return 'mia';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/authMe/, '').split('/').filter(Boolean);
    const method = req.method;

    const user = await getUserFromRequest(req, base44);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // GET / — return current user
    if (method === 'GET' && parts.length === 0) {
      const weeklyActiveDays = computeWeeklyActiveDays(user.activity_dates);
      const dutyStatus = computeDutyStatus(user.activity_dates);

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
        weekly_active_days: weeklyActiveDays,
        activity_dates: user.activity_dates ?? [],
      });
    }

    // DELETE / — delete own account
    if (method === 'DELETE' && parts.length === 0) {
      const body = await req.json().catch(() => ({}));
      if (!body.password) return Response.json({ error: 'Password required to delete account' }, { status: 400 });
      const valid = await bcrypt.compare(body.password, user.password_hash ?? '');
      if (!valid) return Response.json({ error: 'Incorrect password' }, { status: 400 });
      await base44.asServiceRole.entities.AppUser.delete(user.id);
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[authMe]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
