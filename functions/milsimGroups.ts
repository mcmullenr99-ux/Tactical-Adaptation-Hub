// v4.12 — banner_position fix — 1775233738
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

const FULL_HQ_PERMISSIONS: Record<string, string> = {
  onboarding: 'manage', troops: 'manage', eventhub: 'manage',
  recognition: 'manage', legacy: 'manage', developer: 'manage',
  readiness: 'manage', analytics: 'manage', stream: 'manage', permissions: 'manage',
};

const WEBHOOKS_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/webhooks";
async function fireEvent(groupId: string, event: string, payload: object) {
  try { await fetch(`${WEBHOOKS_URL}?path=%2Ffire`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group_id: groupId, event, payload }) }); } catch (_) {}
}

async function getCallerUser(base44: any, req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    return await base44.asServiceRole.entities.AppUser.get(payload.sub) ?? null;
  } catch { return null; }
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function makeUniqueSlug(base44: any, name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let attempt = 0;
  while (true) {
    const existing = await base44.asServiceRole.entities.MilsimGroup.filter({ slug });
    if (existing.length === 0) break;
    attempt++;
    slug = `${base}-${attempt}`;
  }
  return slug;
}

async function groupFullDetail(base44: any, group: any) {
  try {
    const [roles, ranks, roster, questions, qualDefs, qualGrants, awards] = await Promise.all([
      base44.asServiceRole.entities.MilsimRole.filter({ group_id: group.id }).catch(() => []),
      base44.asServiceRole.entities.MilsimRank.filter({ group_id: group.id }).catch(() => []),
      base44.asServiceRole.entities.MilsimRoster.filter({ group_id: group.id }).catch(() => []),
      base44.asServiceRole.entities.MilsimAppQuestion.filter({ group_id: group.id }).catch(() => []),
      base44.asServiceRole.entities.Qualification.filter({ group_id: group.id }).catch(() => []),
      base44.asServiceRole.entities.QualificationGrant.filter({ group_id: group.id }).catch(() => []),
      base44.asServiceRole.entities.MilsimAward.filter({ group_id: group.id }).catch(() => []),
    ]);
    const enrichedRoster = (roster ?? []).map((entry: any) => ({
      ...entry,
      rankId: entry.rank_id ?? entry.rankId ?? null,
      roleId: entry.role_id ?? entry.roleId ?? null,
      qualifications: (qualGrants ?? [])
        .filter((g: any) => g.roster_id === entry.id)
        .map((g: any) => {
          const def = (qualDefs ?? []).find((q: any) => q.id === g.qualification_id);
          return { id: g.id, name: g.qualification_name ?? def?.name ?? 'Unknown', badge_url: def?.badge_url ?? null };
        }),
      awards: (awards ?? [])
        .filter((a: any) => a.recipient_roster_id === entry.id)
        .map((a: any) => ({ id: a.id, name: a.award_name, image_url: a.award_image_url ?? null, reason: a.reason ?? null })),
    }));
    return {
      ...group,
      tagLine: group.tagLine ?? group.tag_line ?? null,
      discordUrl: group.discordUrl ?? group.discord_url ?? null,
      websiteUrl: group.websiteUrl ?? group.website_url ?? null,
      steamGroupUrl: group.steamGroupUrl ?? group.steam_group_url ?? null,
      logoUrl: group.logoUrl ?? group.logo_url ?? null,
      banner_url: group.banner_url ?? null,
      banner_position: group.banner_position ?? null,
      unitType: group.unitType ?? group.unit_type ?? null,
      branch: group.branch ?? null,
      roles: roles ?? [],
      ranks: ranks ?? [],
      roster: enrichedRoster,
      questions: questions ?? [],
    };
  } catch (err) {
    console.error('[groupFullDetail]', err);
    return { ...group, roles: [], ranks: [], roster: [], questions: [] };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' } });
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/milsimGroups/, '').split('/').filter(Boolean);
    const method = req.method;

    // ── PUBLIC STATS (no auth required) ─────────────────────────────────────
    if (parts[0] === 'stats' && parts[1] === 'public' && method === 'GET') {
      const [groups, ops] = await Promise.all([
        base44.asServiceRole.entities.MilsimGroup.filter({ status: 'approved' }),
        base44.asServiceRole.entities.MilsimOp.list(),
      ]);
      return new Response(JSON.stringify({
        unit_count: groups.length,
        ops_count: ops.length,
      }), { status: 200, headers: cors });
    }

    // ── ROSTER MEMBER (must be early to avoid slug-catch-all) ────────────────

    if (parts[0] === 'roster_member' && method === 'GET') {
      const groupId = url.searchParams.get('group_id');
      const userId  = url.searchParams.get('user_id');
      if (!groupId || !userId) return new Response(JSON.stringify({ error: 'group_id and user_id required' }), { status: 400, headers: cors });
      const rosters = await base44.asServiceRole.entities.MilsimRoster.filter({ group_id: groupId, user_id: userId });
      return new Response(JSON.stringify({ roster_member: rosters[0] ?? null }), { status: 200, headers: cors });
    }

    if (parts[0] === 'update_roster_member' && method === 'POST') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const body = await req.json().catch(() => ({}));
      const rosterEntry = await base44.asServiceRole.entities.MilsimRoster.get(body.roster_id);
      if (!rosterEntry) return new Response(JSON.stringify({ error: 'Roster entry not found' }), { status: 404, headers: cors });
      if (rosterEntry.user_id !== full.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      await base44.asServiceRole.entities.MilsimRoster.update(body.roster_id, {
        ribbon_bar_order: body.ribbon_bar_order ?? [],
        ribbon_bar_mods: body.ribbon_bar_mods ?? {},
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
    }

    if (parts[0] === 'roster' && method === 'GET') {
      const groupId = url.searchParams.get('group_id');
      if (!groupId) return new Response(JSON.stringify({ error: 'group_id required' }), { status: 400, headers: cors });
      const roster = await base44.asServiceRole.entities.MilsimRoster.filter({ group_id: groupId });
      const enriched = await Promise.all(roster.map(async (m: any) => {
        let rank_name = null;
        if (m.rank_id) {
          try { const rank = await base44.asServiceRole.entities.MilsimRank.get(m.rank_id); rank_name = rank?.abbreviation ?? rank?.name ?? null; } catch {}
        }
        return { ...m, rank_name };
      }));
      return new Response(JSON.stringify({ roster: enriched }), { status: 200, headers: cors });
    }

    // ── LIST / PUBLIC ────────────────────────────────────────────────────────

    if (method === 'GET' && parts.length === 0) {
      // Delegated to milsimGroupsB/list to keep this function under size limit
      const res = await fetch("https://agent-tag-lead-developer-cff87ae4.base44.app/functions/milsimGroupsB?path=%2Flist");
      const data = await res.json().catch(() => []);
      return new Response(JSON.stringify(data), { status: res.status, headers: cors });
    }

    if (method === 'GET' && parts[0] === 'mine' && parts[1] === 'own') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const groups = await base44.asServiceRole.entities.MilsimGroup.filter({ owner_id: full.id });
      if (groups.length === 0) return new Response(JSON.stringify(null), { status: 200, headers: cors });
      try {
        const detail = await groupFullDetail(base44, groups[0]);
        return new Response(JSON.stringify(detail), { status: 200, headers: cors });
      } catch (err) {
        console.error('[mine/own] groupFullDetail failed, returning bare group:', err);
        // Return the bare group so the frontend doesn't show "no group registered"
        return new Response(JSON.stringify({ ...groups[0], roles: [], ranks: [], roster: [], questions: [] }), { status: 200, headers: cors });
      }
    }

    if (method === 'GET' && parts[0] === 'mine' && parts[1] === 'memberships') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const roster = await base44.asServiceRole.entities.MilsimRoster.filter({ user_id: full.id });
      const groups = await Promise.all(roster.map((r: any) => base44.asServiceRole.entities.MilsimGroup.get(r.group_id)));
      return new Response(JSON.stringify(groups.filter(Boolean).map((g: any) => ({ id: g.id, name: g.name, slug: g.slug }))), { status: 200, headers: cors });
    }

    // GET mine/hq-access — returns groups the caller can access HQ for, with resolved permissions
    if (method === 'GET' && parts[0] === 'mine' && parts[1] === 'hq-access') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });

      // All roster entries for this user
      const rosterEntries = await base44.asServiceRole.entities.MilsimRoster.filter({ user_id: full.id });
      const result: any[] = [];

      for (const entry of rosterEntries) {
        if (!['Active', 'active'].includes(entry.status ?? '')) continue;
        const group = await base44.asServiceRole.entities.MilsimGroup.get(entry.group_id).catch(() => null);
        if (!group) continue;

        const isOwner = group.owner_id === full.id;

        // Resolve role permissions
        let rolePerms: Record<string, string> = {};
        if (entry.role_id) {
          const role = await base44.asServiceRole.entities.MilsimRole.get(entry.role_id).catch(() => null);
          if (role?.permissions) rolePerms = role.permissions;
        }

        // Member overrides win over role (like Discord user overrides)
        const memberPerms: Record<string, string> = entry.hq_permissions ?? {};
        const merged: Record<string, string> = { ...rolePerms, ...memberPerms };

        // Owner has full access always
        const hasAnyAccess = isOwner || Object.values(merged).some(v => v === 'view' || v === 'manage');

        // Owner always gets full access — self-heal missing permissions
        if (isOwner) {
          if (!entry.hq_permissions || Object.keys(entry.hq_permissions).length === 0) {
            await base44.asServiceRole.entities.MilsimRoster.update(entry.id, { hq_permissions: FULL_HQ_PERMISSIONS }).catch(() => {});
          }
          const groupDetail = await groupFullDetail(base44, group).catch(() => group);
          result.push({
            group_id: group.id,
            group_name: group.name,
            group_slug: group.slug,
            is_owner: true,
            roster_id: entry.id,
            permissions: '__owner__',
            group_detail: groupDetail,
          });
        } else if (hasAnyAccess) {
          const groupDetail = await groupFullDetail(base44, group).catch(() => group);
          result.push({
            group_id: group.id,
            group_name: group.name,
            group_slug: group.slug,
            is_owner: false,
            roster_id: entry.id,
            permissions: merged,
            group_detail: groupDetail,
          });
        }
      }

      // Also add groups where user is owner but may not be on roster
      const ownedGroups = await base44.asServiceRole.entities.MilsimGroup.filter({ owner_id: full.id });
      for (const og of ownedGroups) {
        if (!result.find(r => r.group_id === og.id)) {
          const groupDetail = await groupFullDetail(base44, og).catch(() => og);
          result.push({ group_id: og.id, group_name: og.name, group_slug: og.slug, is_owner: true, roster_id: null, permissions: '__owner__', group_detail: groupDetail });
        }
      }

      return new Response(JSON.stringify(result), { status: 200, headers: cors });
    }

    // PATCH /:groupId/roster/:rosterId/permissions — update member HQ permissions
    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'roster' && parts[2] === 'permissions') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]).catch(() => null);
      if (!group || (group.owner_id !== full.id && full.role !== 'admin')) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json();
      const rosterEntries = await base44.asServiceRole.entities.MilsimRoster.filter({ group_id: parts[0] });
      const entry = rosterEntries.find((r: any) => r.id === body.roster_id);
      if (!entry) return new Response(JSON.stringify({ error: 'Roster entry not found' }), { status: 404, headers: cors });
      const updated = await base44.asServiceRole.entities.MilsimRoster.update(entry.id, { hq_permissions: body.permissions });
      return new Response(JSON.stringify(updated), { status: 200, headers: cors });
    }

    // PATCH /:groupId/roles/:roleId/permissions — update role HQ permissions
    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'roles' && parts[2] === 'permissions') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]).catch(() => null);
      if (!group || (group.owner_id !== full.id && full.role !== 'admin')) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json();
      const roles = await base44.asServiceRole.entities.MilsimRole.filter({ group_id: parts[0] });
      const role = roles.find((r: any) => r.id === body.role_id);
      if (!role) return new Response(JSON.stringify({ error: 'Role not found' }), { status: 404, headers: cors });
      const updated = await base44.asServiceRole.entities.MilsimRole.update(role.id, { permissions: body.permissions });
      return new Response(JSON.stringify(updated), { status: 200, headers: cors });
    }

        if (method === 'GET' && parts[0] === 'mine' && parts[1] === 'all') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const groups = await base44.asServiceRole.entities.MilsimGroup.filter({ owner_id: full.id });
      if (groups.length === 0) return new Response(JSON.stringify(null), { status: 200, headers: cors });
      return new Response(JSON.stringify(await groupFullDetail(base44, groups[0])), { status: 200, headers: cors });
    }

    if (method === 'GET' && parts[0] === 'mine' && parts[1] === 'awards-summary') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const rosterEntries = await base44.asServiceRole.entities.MilsimRoster.filter({ user_id: full.id });
      const awards: any[] = [];
      for (const entry of rosterEntries) {
        const groupAwards = await base44.asServiceRole.entities.MilsimAward.filter({ recipient_roster_id: entry.id });
        awards.push(...groupAwards);
      }
      return new Response(JSON.stringify(awards), { status: 200, headers: cors });
    }

    // GET /:slug — public group by slug
    const RESERVED_PATHS = ['roster', 'roster_member', 'mine', 'search', 'registry', 'upvote', 'review', 'fire', 'analytics', 'leaderboard', 'update_roster_member'];
    if (method === 'GET' && parts.length === 1 && !RESERVED_PATHS.includes(parts[0])) {
      const all = await base44.asServiceRole.entities.MilsimGroup.filter({ slug: parts[0] });
      const group = all[0];
      if (!group) return new Response(JSON.stringify({ error: 'Group not found' }), { status: 404, headers: cors });
      return new Response(JSON.stringify(await groupFullDetail(base44, group)), { status: 200, headers: cors });
    }

    // ── CREATE ───────────────────────────────────────────────────────────────

    if (method === 'POST' && parts.length === 0) {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const existing = await base44.asServiceRole.entities.MilsimGroup.filter({ owner_id: full.id });
      if (existing.length > 0) return new Response(JSON.stringify({ error: 'You already have a registered group' }), { status: 409, headers: cors });
      const body = await req.json().catch(() => ({}));
      const { name, tagLine, description, discordUrl, websiteUrl, steamGroupUrl, logoUrl, sops, orbat,
              country, language, branch, unitType, games, tags } = body;
      if (!name) return new Response(JSON.stringify({ error: 'Name is required' }), { status: 400, headers: cors });
      const slug = await makeUniqueSlug(base44, name);
      const group = await base44.asServiceRole.entities.MilsimGroup.create({
        name, slug, tag_line: tagLine ?? null, description: description ?? null,
        discord_url: discordUrl ?? null, website_url: websiteUrl ?? null, steam_group_url: steamGroupUrl ?? null,
        logo_url: logoUrl ?? null, sops: sops ?? null, orbat: orbat ?? null,
        status: 'pending', owner_id: full.id, owner_username: full.username, visibility: null,
        country: country ?? null, language: language ?? null,
        branch: branch ?? null, unit_type: unitType ?? null,
        games: games ?? null, tags: tags ?? null,
      });

      // Auto-add the commander to the roster as CO
      const today = new Date().toISOString().split('T')[0];
      const rosterEntry = await base44.asServiceRole.entities.MilsimRoster.create({
        group_id: group.id,
        user_id: full.id,
        callsign: full.callsign ?? full.username,
        status: 'Active',
        join_date: today,
        ops_count: 0,
        hq_permissions: FULL_HQ_PERMISSIONS,
      });

      // Set them as CO in chain of command (stored as JSON string)
      await base44.asServiceRole.entities.MilsimGroup.update(group.id, {
        chain_of_command: [{
          id: crypto.randomUUID(),
          title: 'Commanding Officer',
          roster_id: rosterEntry.id,
          callsign: full.callsign ?? full.username,
          sort_order: 0,
        }],
      });

      return new Response(JSON.stringify(await groupFullDetail(base44, group)), { status: 201, headers: cors });
    }

    // ── GROUP MANAGEMENT ─────────────────────────────────────────────────────

    // GET /:groupId/full — full group detail for authorized roster member
    if (method === 'GET' && parts.length === 2 && parts[1] === 'full') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]).catch(() => null);
      if (!group) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: cors });
      // Allow if owner or active roster member
      const isOwner = group.owner_id === full.id || full.role === 'admin';
      if (!isOwner) {
        const roster = await base44.asServiceRole.entities.MilsimRoster.filter({ group_id: parts[0], user_id: full.id });
        const active = roster.find((r: any) => ['Active', 'active'].includes(r.status ?? ''));
        if (!active) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      }
      return new Response(JSON.stringify(await groupFullDetail(base44, group)), { status: 200, headers: cors });
    }

        if (method === 'PATCH' && parts.length === 2 && parts[1] === 'info') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group) return new Response(JSON.stringify({ error: 'Group not found' }), { status: 404, headers: cors });
      if (group.owner_id !== full.id && full.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.tagLine !== undefined) updates.tag_line = body.tagLine;
      if (body.description !== undefined) updates.description = body.description;
      if (body.discordUrl !== undefined) updates.discord_url = body.discordUrl;
      if (body.websiteUrl !== undefined) updates.website_url = body.websiteUrl;
      if (body.steamGroupUrl !== undefined) updates.steam_group_url = body.steamGroupUrl;
      if (body.logoUrl !== undefined) updates.logo_url = body.logoUrl;
      if (body.banner_url !== undefined) updates.banner_url = body.banner_url;
      if (body.bannerUrl !== undefined) updates.banner_url = body.bannerUrl;
      if (body.banner_position !== undefined) updates.banner_position = body.banner_position;
      if (body.bannerPosition !== undefined) updates.banner_position = body.bannerPosition;
      if (body.sops !== undefined) updates.sops = typeof body.sops === 'string' ? body.sops : JSON.stringify(body.sops);
      if (body.roe !== undefined) updates.roe = typeof body.roe === 'string' ? body.roe : JSON.stringify(body.roe);
      if (body.orbat !== undefined) updates.orbat = typeof body.orbat === 'string' ? body.orbat : JSON.stringify(body.orbat);
      if (body.selection_criteria !== undefined) updates.selection_criteria = typeof body.selection_criteria === 'string' ? body.selection_criteria : JSON.stringify(body.selection_criteria);
      if (body.visibility !== undefined) updates.visibility = (typeof body.visibility === 'string') ? body.visibility : JSON.stringify(body.visibility);
      if (body.country !== undefined) updates.country = body.country;
      if (body.language !== undefined) updates.language = body.language;
      if (body.branch !== undefined) updates.branch = body.branch;
      if (body.unitType !== undefined) updates.unit_type = body.unitType;
      if (body.games !== undefined) updates.games = body.games;
      if (body.tags !== undefined) updates.tags = body.tags;
      if (body.chain_of_command !== undefined) updates.chain_of_command = Array.isArray(body.chain_of_command) ? body.chain_of_command : (typeof body.chain_of_command === 'string' ? JSON.parse(body.chain_of_command) : []);
      if (body.structure_doctrine !== undefined) updates.structure_doctrine = body.structure_doctrine;
      if (body.structure_lock_roles !== undefined) updates.structure_lock_roles = body.structure_lock_roles;
      // Social links
      if (body.discord_url !== undefined) updates.discord_url = body.discord_url;
      if (body.website_url !== undefined) updates.website_url = body.website_url;
      if (body.steam_group_url !== undefined) updates.steam_group_url = body.steam_group_url;
      if (body.twitter_url !== undefined) updates.twitter_url = body.twitter_url;
      if (body.instagram_url !== undefined) updates.instagram_url = body.instagram_url;
      if (body.tiktok_url !== undefined) updates.tiktok_url = body.tiktok_url;
      if (body.youtube_url !== undefined) updates.youtube_url = body.youtube_url;
      if (body.twitch_url !== undefined) updates.twitch_url = body.twitch_url;
      updates.last_page_update = new Date().toISOString();
      await base44.asServiceRole.entities.MilsimGroup.update(parts[0], updates);
      const updated = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      return new Response(JSON.stringify(await groupFullDetail(base44, updated)), { status: 200, headers: cors });
    }

    if (method === 'PATCH' && parts.length === 2 && parts[1] === 'stream') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || (group.owner_id !== full.id && full.role !== 'admin')) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.discordUrl !== undefined) updates.discord_url = body.discordUrl;
      if (body.websiteUrl !== undefined) updates.website_url = body.websiteUrl;
      if (body.streamUrl !== undefined) updates.stream_url = body.streamUrl;
      if (body.isLive !== undefined) updates.is_live = body.isLive;
      await base44.asServiceRole.entities.MilsimGroup.update(parts[0], updates);
      const updated = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      return new Response(JSON.stringify(await groupFullDetail(base44, updated)), { status: 200, headers: cors });
    }

    if (method === 'PATCH' && parts.length === 2 && parts[1] === 'status') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      if (!['moderator', 'admin'].includes(full.role)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      const updated = await base44.asServiceRole.entities.MilsimGroup.update(parts[0], { status: body.status });
      return new Response(JSON.stringify(updated), { status: 200, headers: cors });
    }

    if (method === 'DELETE' && parts.length === 1) {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: cors });
      if (group.owner_id !== full.id && full.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      await base44.asServiceRole.entities.MilsimGroup.delete(parts[0]);
      return new Response(null, { status: 204 });
    }

    // ── ROLES ────────────────────────────────────────────────────────────────

    // GET /:groupId/roles — list all roles for a group (fresh from entity)
    if (method === 'GET' && parts.length === 2 && parts[1] === 'roles') {
      const roles = await base44.asServiceRole.entities.MilsimRole.filter({ group_id: parts[0] });
      return new Response(JSON.stringify(roles ?? []), { status: 200, headers: cors });
    }

    if (method === 'POST' && parts.length === 2 && parts[1] === 'roles') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      const role = await base44.asServiceRole.entities.MilsimRole.create({
        group_id: parts[0], name: body.name, description: body.description ?? null, sort_order: body.sortOrder ?? 0,
      });
      return new Response(JSON.stringify(role), { status: 201, headers: cors });
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'roles') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      await base44.asServiceRole.entities.MilsimRole.delete(parts[2]);
      return new Response(null, { status: 204 });
    }


    // PATCH /:groupId/roles/:roleId — update slot_status, description, publicly_visible, slots_total
    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'roles' && parts[2] !== 'reorder' && parts[2] !== 'permissions') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || (group.owner_id !== full.id && full.role !== 'admin')) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      const patch: Record<string,any> = {};
      if (body.slot_status !== undefined) patch.slot_status = body.slot_status;
      if (body.slots_total !== undefined) patch.slots_total = body.slots_total != null ? parseInt(String(body.slots_total)) : null;
      if (body.slots_filled !== undefined) patch.slots_filled = body.slots_filled != null ? parseInt(String(body.slots_filled)) : null;
      if (body.publicly_visible !== undefined) patch.publicly_visible = body.publicly_visible;
      if (body.name !== undefined) patch.name = body.name;
      if (body.description !== undefined) patch.description = body.description;
      if (body.sort_order !== undefined) patch.sort_order = body.sort_order;
      const updated = await base44.asServiceRole.entities.MilsimRole.update(parts[2], patch);
      return new Response(JSON.stringify(updated), { status: 200, headers: cors });
    }


    // ── ROSTER ────────────────────────────────────────────────────────────────



    if (method === 'POST' && parts.length === 2 && parts[1] === 'roster') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      const entry = await base44.asServiceRole.entities.MilsimRoster.create({
        group_id: parts[0], user_id: body.user_id ?? null, callsign: body.callsign,
        rank_id: body.rank_id ?? null, role_id: body.role_id ?? null,
        notes: body.notes ?? null, status: body.status ?? 'active',
        specialisations: body.specialisations ?? null, join_date: body.join_date ?? null,
        ops_count: body.ops_count ?? 0,
      });
      return new Response(JSON.stringify(entry), { status: 201, headers: cors });
    }

    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'roster') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      const rosterEntry = await base44.asServiceRole.entities.MilsimRoster.get(parts[2]);
      const isOwner = group?.owner_id === full.id || full.role === 'admin';
      const isSelf = rosterEntry?.user_id === full.id;
      if (!isOwner && !isSelf) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.callsign !== undefined) updates.callsign = body.callsign;
      if (body.rank_id !== undefined) updates.rank_id = body.rank_id;
      if (body.role_id !== undefined) updates.role_id = body.role_id;
      if (body.notes !== undefined) updates.notes = body.notes;
      if (body.status !== undefined) updates.status = body.status;
      if (body.specialisations !== undefined) updates.specialisations = body.specialisations;
      if (body.join_date !== undefined) updates.join_date = body.join_date;
      if (body.ops_count !== undefined) updates.ops_count = body.ops_count;
      if (body.user_id !== undefined && isOwner) updates.user_id = body.user_id;
      await base44.asServiceRole.entities.MilsimRoster.update(parts[2], updates);
      const updated = await base44.asServiceRole.entities.MilsimRoster.get(parts[2]);
      return new Response(JSON.stringify(updated), { status: 200, headers: cors });
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'roster') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      await base44.asServiceRole.entities.MilsimRoster.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── DISCHARGE ────────────────────────────────────────────────────────────

    if (method === 'POST' && parts.length === 3 && parts[1] === 'roster' && parts[2] === 'discharge') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || (group.owner_id !== full.id && full.role !== 'admin')) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      const { roster_id, discharge_type, reason, effective_date, notes, reinstatement_eligible } = body;
      if (!roster_id || !discharge_type || !reason) return new Response(JSON.stringify({ error: 'roster_id, discharge_type, and reason are required' }), { status: 400, headers: cors });
      const rosterEntry = await base44.asServiceRole.entities.MilsimRoster.get(roster_id).catch(() => null);
      if (!rosterEntry) return new Response(JSON.stringify({ error: 'Roster entry not found' }), { status: 404, headers: cors });
      const ranks = await base44.asServiceRole.entities.MilsimRank.filter({ group_id: parts[0] }).catch(() => []);
      const roles = await base44.asServiceRole.entities.MilsimRole.filter({ group_id: parts[0] }).catch(() => []);
      const finalRank = (ranks as any[]).find((r: any) => r.id === rosterEntry.rank_id)?.name ?? null;
      const finalRole = (roles as any[]).find((r: any) => r.id === rosterEntry.role_id)?.name ?? null;
      const discharge = await base44.asServiceRole.entities.MilsimDischarge.create({
        group_id: parts[0],
        group_name: group.name,
        roster_id: roster_id,
        user_id: rosterEntry.user_id,
        callsign: rosterEntry.callsign,
        discharge_type: discharge_type,
        reason: reason,
        effective_date: effective_date ?? new Date().toISOString().slice(0, 10),
        conducted_by: full.id,
        conducted_by_username: full.username,
        notes: notes ?? null,
        final_rank: finalRank,
        final_role: finalRole,
        ops_served: rosterEntry.ops_count ?? 0,
        join_date: rosterEntry.join_date ?? null,
        reinstatement_eligible: reinstatement_eligible ?? (discharge_type !== 'Dishonourable'),
      });
      await base44.asServiceRole.entities.MilsimRoster.update(roster_id, { status: 'Discharged' });
      return new Response(JSON.stringify({ discharge, message: 'Discharge processed successfully' }), { status: 201, headers: cors });
    }

    if (method === 'GET' && parts.length === 2 && parts[1] === 'discharges') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || (group.owner_id !== full.id && full.role !== 'admin')) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const discharges = await base44.asServiceRole.entities.MilsimDischarge.filter({ group_id: parts[0] });
      return new Response(JSON.stringify(discharges ?? []), { status: 200, headers: cors });
    }

    // GET /:groupId/my-discharge — member fetches their own discharge record for this group
    if (method === 'GET' && parts.length === 2 && parts[1] === 'my-discharge') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      // Find discharge records for this user in this group
      const all = await base44.asServiceRole.entities.MilsimDischarge.filter({ group_id: parts[0] });
      const mine = all.filter((d: any) => d.user_id === full.id || d.callsign?.toLowerCase() === full.username?.toLowerCase());
      return new Response(JSON.stringify(mine ?? []), { status: 200, headers: cors });
    }

    // ── APPLICATIONS ─────────────────────────────────────────────────────────

    if (method === 'GET' && parts.length === 2 && parts[1] === 'applications') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const apps = await base44.asServiceRole.entities.MilsimApplication.filter({ group_id: parts[0] });
      return new Response(JSON.stringify(apps), { status: 200, headers: cors });
    }

    if (method === 'POST' && parts.length === 2 && parts[1] === 'apply') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group) return new Response(JSON.stringify({ error: 'Group not found' }), { status: 404, headers: cors });
      // ── MULTI-MILSIM BLOCKER: check if user is already on any active roster ──
      const allRosterEntries = await base44.asServiceRole.entities.MilsimRoster.filter({ user_id: full.id }).catch(() => []);
      const activeRosterEntry = (allRosterEntries as any[]).find((r: any) => (r.status ?? 'active').toLowerCase() === 'active');
      if (activeRosterEntry) {
        const existingGroup = await base44.asServiceRole.entities.MilsimGroup.get(activeRosterEntry.group_id).catch(() => null);
        const existingName = existingGroup?.name ?? 'another unit';
        return new Response(JSON.stringify({ error: `You are already an active member of ${existingName}. You must be discharged before applying to a new unit.` }), { status: 409, headers: cors });
      }
      const existing = await base44.asServiceRole.entities.MilsimApplication.filter({ group_id: parts[0], applicant_id: full.id });
      if (existing.some((a: any) => a.status === 'pending')) return new Response(JSON.stringify({ error: 'Application already pending' }), { status: 409, headers: cors });
      const body = await req.json().catch(() => ({}));
      const app = await base44.asServiceRole.entities.MilsimApplication.create({
        group_id: parts[0], group_name: group.name, applicant_id: full.id, applicant_username: full.username,
        answers: body.answers ?? {}, status: 'pending',
      });
      return new Response(JSON.stringify(app), { status: 201, headers: cors });
    }

    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'applications') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || (group.owner_id !== full.id && full.role !== 'admin')) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      const updated = await base44.asServiceRole.entities.MilsimApplication.update(parts[2], {
        status: body.status, review_note: body.review_note ?? null, reviewed_by: full.username,
      });
      if (body.status === 'accepted' && body.callsign) {
        // ── MULTI-MILSIM BLOCKER: guard on accept too ──
        const existingRoster = await base44.asServiceRole.entities.MilsimRoster.filter({ user_id: body.applicant_id }).catch(() => []);
        const alreadyActive = (existingRoster as any[]).find((r: any) => (r.status ?? 'active').toLowerCase() === 'active');
        if (alreadyActive) {
          const blockingGroup = await base44.asServiceRole.entities.MilsimGroup.get(alreadyActive.group_id).catch(() => null);
          return new Response(JSON.stringify({ error: `Applicant is already an active member of ${blockingGroup?.name ?? 'another unit'}. They must be discharged first.` }), { status: 409, headers: cors });
        }
        await base44.asServiceRole.entities.MilsimRoster.create({
          group_id: parts[0], user_id: body.applicant_id, callsign: body.callsign,
          status: 'active', join_date: new Date().toISOString().slice(0, 10), ops_count: 0,
        });
      }
      return new Response(JSON.stringify(updated), { status: 200, headers: cors });
    }


    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: cors });
  } catch (err: any) {
    console.error('[milsimGroups]', err);
    return new Response(JSON.stringify({ error: err.message ?? 'Server error' }), { status: 500, headers: cors });
  }
});
