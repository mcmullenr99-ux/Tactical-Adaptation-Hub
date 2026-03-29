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
    const user = await base44.asServiceRole.entities.AppUser.get(payload.sub);
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
    // Strip query string from pathOverride before splitting into parts
    // (apiFetch encodes the full path including ?q= into the path= param)
    const pathForParts = pathOverride ? pathOverride.split('?')[0] : null;
    const parts = pathForParts
      ? pathForParts.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/users/, '').split('/').filter(Boolean);
    const method = req.method;

    // GET /users/search?q= — search users by username (for friend finder)
    // Note: apiFetch encodes full path e.g. /search?q=buffet into pathOverride
    // parts is built from path stripped of query string, so parts[0] === 'search' correctly
    // q is extracted from the pathOverride string directly
    if (method === 'GET' && parts[0] === 'search') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      // Extract q from pathOverride (e.g. "/search?q=buffet") or outer query string
      let q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
      if (!q && pathOverride) {
        const qMatch = pathOverride.match(/[?&]q=([^&]*)/);
        if (qMatch) q = decodeURIComponent(qMatch[1]).trim().toLowerCase();
      }
      if (q.length < 2) return Response.json([]);
      const all = await base44.asServiceRole.entities.AppUser.list();
      const results = all
        .filter((u: any) => u.status === 'active' && u.id !== full.id && u.username?.toLowerCase().includes(q))
        .slice(0, 20)
        .map((u: any) => ({ id: u.id, username: u.username, role: u.role, nationality: u.nationality ?? null, bio: u.bio ?? null }));
      return Response.json(results);
    }

    // GET /users — list users (public, limited fields)
    if (method === 'GET' && parts.length === 0) {
      const users = await base44.asServiceRole.entities.AppUser.list();
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
      const user = await base44.asServiceRole.entities.AppUser.get(parts[0]);
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
      await base44.asServiceRole.entities.AppUser.update(full.id, { referral_code: code });
      return Response.json({ code });
    }

    // GET /referral-code/recruits
    if (method === 'GET' && parts[0] === 'referral-code' && parts[1] === 'recruits') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!full.referral_code) return Response.json([]);
      const recruits = await base44.asServiceRole.entities.AppUser.filter({ referred_by: full.referral_code });
      return Response.json(recruits.map((u: any) => ({ id: u.id, username: u.username, createdAt: u.created_date })));
    }

    // PATCH /duty-status — legacy endpoint
    if (method === 'PATCH' && parts.length === 0 && url.pathname.includes('duty-status')) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const body = await req.json().catch(() => ({}));
      await base44.asServiceRole.entities.AppUser.update(full.id, { on_duty_status: body.status ?? 'available' });
      return Response.json({ on_duty_status: body.status });
    }

    // GET /users/profile/:username — public profile by username (enriched)
    if (method === 'GET' && parts.length === 2 && parts[0] === 'profile') {
      const username = parts[1];
      const users = await base44.asServiceRole.entities.AppUser.list();
      const user = users.find((u: any) => u.username?.toLowerCase() === username.toLowerCase());
      if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

      // Get milsim roster memberships
      const rosters = await base44.asServiceRole.entities.MilsimRoster.filter({ user_id: user.id });
      const milsimGroups: any[] = [];
      for (const r of (rosters ?? [])) {
        if (!r.group_id || r.status === 'inactive') continue;
        try {
          const g = await base44.asServiceRole.entities.MilsimGroup.get(r.group_id);
          if (!g) continue;
          // Get rank label
          let rankLabel = null;
          if (r.rank_id) {
            try { const rank = await base44.asServiceRole.entities.MilsimRank.get(r.rank_id); rankLabel = rank ? `${rank.abbreviation ?? ''} ${rank.name ?? ''}`.trim() : null; } catch {}
          }
          // Get role label
          let roleLabel = null;
          if (r.role_id) {
            try { const role = await base44.asServiceRole.entities.MilsimRole.get(r.role_id); roleLabel = role?.name ?? null; } catch {}
          }
          milsimGroups.push({
            group_id: g.id, group_name: g.name, group_slug: g.slug,
            logo_url: g.logo_url ?? null, country: g.country ?? null,
            callsign: r.callsign ?? null, rank: rankLabel, role: roleLabel,
            join_date: r.join_date ?? r.created_date, ops_count: r.ops_count ?? 0,
            owner_id: g.owner_id, owner_username: g.owner_username,
            is_owner: g.owner_id === user.id,
          });
        } catch {}
      }

      // Total op count across all groups
      const total_ops = milsimGroups.reduce((s, g) => s + (g.ops_count ?? 0), 0);

      // Post count
      let post_count = 0;
      try { const posts = await base44.asServiceRole.entities.Post.filter({ user_id: user.id }); post_count = (posts ?? []).length; } catch {}

      return Response.json({
        id: user.id, username: user.username, role: user.role,
        bio: user.bio ?? null, nationality: user.nationality ?? null,
        discord_tag: user.discord_tag ?? null,
        avatar_url: user.avatar_url ?? null,
        is_verified: user.is_verified ?? false,
        createdAt: user.created_date,
        milsim_groups: milsimGroups,
        total_ops, post_count,
        login_count: user.login_count ?? 0,
      });
    }

    // GET /users/profile/:username/ribbons — public ribbon rack for a user
    if (method === 'GET' && parts.length === 3 && parts[0] === 'profile' && parts[2] === 'ribbons') {
      const username = parts[1];
      const users = await base44.asServiceRole.entities.AppUser.list();
      const user = users.find((u: any) => u.username?.toLowerCase() === username.toLowerCase());
      if (!user) return Response.json([]);
      // Get rosters for this user
      const rosters = await base44.asServiceRole.entities.MilsimRoster.filter({ user_id: user.id });
      const rosterIds = rosters.map((r: any) => r.id);
      if (rosterIds.length === 0) return Response.json([]);
      // Get all awards
      const allAwards: any[] = [];
      for (const rid of rosterIds) {
        const awards = await base44.asServiceRole.entities.MilsimAward.filter({ recipient_roster_id: rid });
        allAwards.push(...awards);
      }
      // Filter to ribbons only and enrich
      const enriched = await Promise.all(allAwards.map(async (a: any) => {
        let color1 = null, color2 = null, color3 = null, awardType = 'medal';
        if (a.award_def_id) {
          try {
            const def = await base44.asServiceRole.entities.MilsimAwardDef.get(a.award_def_id);
            if (def) { color1 = def.ribbon_color_1; color2 = def.ribbon_color_2; color3 = def.ribbon_color_3; awardType = def.award_type ?? 'medal'; }
          } catch {}
        }
        let groupName = '';
        if (a.group_id) {
          try { const g = await base44.asServiceRole.entities.MilsimGroup.get(a.group_id); groupName = g?.name ?? ''; } catch {}
        }
        return { ...a, ribbon_color_1: color1, ribbon_color_2: color2, ribbon_color_3: color3, award_type: awardType, group_name: groupName };
      }));
      const ribbonsOnly = enriched.filter((a: any) => a.award_type === 'ribbon');
      return Response.json(ribbonsOnly);
    }

        return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[users]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
