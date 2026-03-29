// v2 - auto-roster CO on group create
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';
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

async function recordActivityDateForRoster(base44: any, rosterIds: string[]): Promise<void> {
  if (!rosterIds || rosterIds.length === 0) return;
  const today = new Date().toISOString().slice(0, 10);
  await Promise.allSettled(rosterIds.map(async (rosterId: string) => {
    try {
      const entry = await base44.asServiceRole.entities.MilsimRoster.get(rosterId);
      if (!entry?.user_id) return;
      const user = await base44.asServiceRole.entities.AppUser.get(entry.user_id);
      if (!user) return;
      const existing: string[] = Array.isArray(user.activity_dates) ? user.activity_dates : [];
      if (existing.includes(today)) return;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      const updated = [...existing.filter((d: string) => d >= cutoffStr), today];
      await base44.asServiceRole.entities.AppUser.update(entry.user_id, { activity_dates: updated });
    } catch {}
  }));
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
      const all = await base44.asServiceRole.entities.MilsimGroup.list();
      const visible = all.filter((g: any) => g.status === 'approved' || g.status === 'featured');
      const proSubs = await base44.asServiceRole.entities.CommanderPro.filter({ status: 'active' }).catch(() => []);
      const proGroupIds = new Set(proSubs.map((p: any) => String(p.group_id)));
      const normalised = visible.map((g: any) => ({
        ...g,
        is_pro:       proGroupIds.has(String(g.id)),
        unitType:     g.unit_type     ?? g.unitType     ?? null,
        tagLine:      g.tag_line      ?? g.tagLine      ?? null,
        discordUrl:   g.discord_url   ?? g.discordUrl   ?? null,
        websiteUrl:   g.website_url   ?? g.websiteUrl   ?? null,
        steamGroupUrl:g.steam_group_url ?? g.steamGroupUrl ?? null,
        logoUrl:      g.logo_url      ?? g.logoUrl      ?? null,
        streamUrl:    g.stream_url    ?? g.streamUrl    ?? null,
        lastPageUpdate: g.last_page_update ?? g.lastPageUpdate ?? null,
        lastOpDate:   g.last_op_date  ?? g.lastOpDate   ?? null,
        lastAarDate:  g.last_aar_date ?? g.lastAarDate  ?? null,
      }));
      return new Response(JSON.stringify(normalised), { status: 200, headers: cors });
    }

    if (method === 'GET' && parts[0] === 'mine' && parts[1] === 'own') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const groups = await base44.asServiceRole.entities.MilsimGroup.filter({ owner_id: full.id });
      if (groups.length === 0) return new Response(JSON.stringify(null), { status: 200, headers: cors });
      return new Response(JSON.stringify(await groupFullDetail(base44, groups[0])), { status: 200, headers: cors });
    }

    if (method === 'GET' && parts[0] === 'mine' && parts[1] === 'memberships') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const roster = await base44.asServiceRole.entities.MilsimRoster.filter({ user_id: full.id });
      const groups = await Promise.all(roster.map((r: any) => base44.asServiceRole.entities.MilsimGroup.get(r.group_id)));
      return new Response(JSON.stringify(groups.filter(Boolean).map((g: any) => ({ id: g.id, name: g.name, slug: g.slug }))), { status: 200, headers: cors });
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
      });

      // Set them as CO in chain of command
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
      if (body.sops !== undefined) updates.sops = body.sops;
      if (body.orbat !== undefined) updates.orbat = body.orbat;
      if (body.selection_criteria !== undefined) updates.selection_criteria = body.selection_criteria;
      if (body.visibility !== undefined) updates.visibility = JSON.stringify(body.visibility);
      if (body.country !== undefined) updates.country = body.country;
      if (body.language !== undefined) updates.language = body.language;
      if (body.branch !== undefined) updates.branch = body.branch;
      if (body.unitType !== undefined) updates.unit_type = body.unitType;
      if (body.games !== undefined) updates.games = body.games;
      if (body.tags !== undefined) updates.tags = body.tags;
      if (body.chain_of_command !== undefined) updates.chain_of_command = body.chain_of_command;
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


    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'roles' && parts[2] === 'reorder') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      // body.order = [{id, sort_order}, ...]
      const updates = Array.isArray(body.order) ? body.order : [];
      await Promise.all(updates.map((u: any) => base44.asServiceRole.entities.MilsimRole.update(u.id, { sort_order: u.sort_order })));
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
    }

    // ── RANKS ────────────────────────────────────────────────────────────────

    if (method === 'POST' && parts.length === 2 && parts[1] === 'ranks') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      const rank = await base44.asServiceRole.entities.MilsimRank.create({
        group_id: parts[0], name: body.name, abbreviation: body.abbreviation ?? null, tier: body.tier ?? 1,
      });
      return new Response(JSON.stringify(rank), { status: 201, headers: cors });
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'ranks') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      await base44.asServiceRole.entities.MilsimRank.delete(parts[2]);
      return new Response(null, { status: 204 });
    }


    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'ranks' && parts[2] === 'reorder') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      // body.order = [{id, sort_order}, ...]
      const updates = Array.isArray(body.order) ? body.order : [];
      await Promise.all(updates.map((u: any) => base44.asServiceRole.entities.MilsimRank.update(u.id, { sort_order: u.sort_order })));
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
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
        await base44.asServiceRole.entities.MilsimRoster.create({
          group_id: parts[0], user_id: body.applicant_id, callsign: body.callsign,
          status: 'active', join_date: new Date().toISOString().slice(0, 10), ops_count: 0,
        });
      }
      return new Response(JSON.stringify(updated), { status: 200, headers: cors });
    }

    // ── AWARD DEFS ───────────────────────────────────────────────────────────

    if (method === 'GET' && parts.length === 2 && parts[1] === 'award-defs') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const defs = await base44.asServiceRole.entities.MilsimAwardDef.filter({ group_id: parts[0] });
      return new Response(JSON.stringify(defs), { status: 200, headers: cors });
    }

    if (method === 'POST' && parts.length === 2 && parts[1] === 'award-defs') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      const def = await base44.asServiceRole.entities.MilsimAwardDef.create({
        group_id: parts[0], name: body.name, description: body.description ?? null,
        image_url: body.image_url ?? null, sort_order: body.sort_order ?? 0,
        award_type: body.award_type ?? 'medal',
        ribbon_color_1: body.ribbon_color_1 ?? null, ribbon_color_2: body.ribbon_color_2 ?? null,
        ribbon_color_3: body.ribbon_color_3 ?? null,
        source_country: body.source_country ?? null, source_branch: body.source_branch ?? null,
      });
      return new Response(JSON.stringify(def), { status: 201, headers: cors });
    }

    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'award-defs') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.image_url !== undefined) updates.image_url = body.image_url;
      if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
      if (body.award_type !== undefined) updates.award_type = body.award_type;
      if (body.ribbon_color_1 !== undefined) updates.ribbon_color_1 = body.ribbon_color_1;
      if (body.ribbon_color_2 !== undefined) updates.ribbon_color_2 = body.ribbon_color_2;
      if (body.ribbon_color_3 !== undefined) updates.ribbon_color_3 = body.ribbon_color_3;
      if (body.source_country !== undefined) updates.source_country = body.source_country;
      if (body.source_branch !== undefined) updates.source_branch = body.source_branch;
      const updated = await base44.asServiceRole.entities.MilsimAwardDef.update(parts[2], updates);
      return new Response(JSON.stringify(updated), { status: 200, headers: cors });
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'award-defs') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      await base44.asServiceRole.entities.MilsimAwardDef.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── AWARDS ───────────────────────────────────────────────────────────────

    if (method === 'GET' && parts.length === 2 && parts[1] === 'awards') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const awards = await base44.asServiceRole.entities.MilsimAward.filter({ group_id: parts[0] });
      return new Response(JSON.stringify(awards), { status: 200, headers: cors });
    }

    if (method === 'POST' && parts.length === 2 && parts[1] === 'awards') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      let awardDef: any = null;
      if (body.award_def_id) { try { awardDef = await base44.asServiceRole.entities.MilsimAwardDef.get(body.award_def_id); } catch {} }
      const award = await base44.asServiceRole.entities.MilsimAward.create({
        group_id: parts[0], award_def_id: body.award_def_id ?? null,
        award_name: body.award_name ?? awardDef?.name ?? 'Award',
        award_description: body.award_description ?? awardDef?.description ?? null,
        award_image_url: body.award_image_url ?? awardDef?.image_url ?? null,
        recipient_roster_id: body.recipient_roster_id, recipient_callsign: body.recipient_callsign,
        awarded_by: full.username, reason: body.reason ?? null,
      });
      await fireEvent(parts[0], 'award.granted', { award_id: award.id, recipient: body.recipient_callsign });
      return new Response(JSON.stringify(award), { status: 201, headers: cors });
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'awards') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      await base44.asServiceRole.entities.MilsimAward.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── QUALIFICATIONS ───────────────────────────────────────────────────────

    if (method === 'GET' && parts.length === 2 && parts[1] === 'qualifications') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const defs = await base44.asServiceRole.entities.Qualification.filter({ group_id: parts[0] });
      const grants = await base44.asServiceRole.entities.QualificationGrant.filter({ group_id: parts[0] });
      return new Response(JSON.stringify({ defs, grants }), { status: 200, headers: cors });
    }

    if (method === 'POST' && parts.length === 2 && parts[1] === 'qualifications') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      if (body.roster_id) {
        const grant = await base44.asServiceRole.entities.QualificationGrant.create({
          qualification_id: body.qualification_id, qualification_name: body.qualification_name ?? null,
          group_id: parts[0], roster_id: body.roster_id, callsign: body.callsign ?? null,
          granted_by: full.username, notes: body.notes ?? null,
        });
        return new Response(JSON.stringify(grant), { status: 201, headers: cors });
      }
      const def = await base44.asServiceRole.entities.Qualification.create({
        group_id: parts[0], name: body.name, description: body.description ?? null, badge_url: body.badge_url ?? null,
      });
      return new Response(JSON.stringify(def), { status: 201, headers: cors });
    }

    if (method === 'DELETE' && parts.length === 4 && parts[1] === 'qualifications' && parts[3] === 'grant') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      await base44.asServiceRole.entities.QualificationGrant.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'qualifications') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      await base44.asServiceRole.entities.Qualification.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── OPS ──────────────────────────────────────────────────────────────────

    if (method === 'GET' && parts.length === 2 && parts[1] === 'ops') {
      const ops = await base44.asServiceRole.entities.MilsimOp.filter({ group_id: parts[0] });
      return new Response(JSON.stringify(ops), { status: 200, headers: cors });
    }

    if (method === 'GET' && parts.length === 3 && parts[1] === 'ops' && parts[2] === 'active') {
      const ops = await base44.asServiceRole.entities.MilsimOp.filter({ group_id: parts[0] });
      const active = ops.filter((o: any) => o.status === 'active' || o.status === 'planned');
      return new Response(JSON.stringify(active), { status: 200, headers: cors });
    }

    if (method === 'POST' && parts.length === 2 && parts[1] === 'ops') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || (group.owner_id !== full.id && full.role !== 'admin')) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      const op = await base44.asServiceRole.entities.MilsimOp.create({
        group_id: parts[0], name: body.name, description: body.description ?? null,
        game: body.game ?? null, scheduled_at: body.scheduled_at ?? null, end_date: body.end_date ?? null,
        event_type: body.event_type ?? 'op', status: body.status ?? 'planned',
        created_by: full.username, participants: body.participants ?? [],
      });
      await fireEvent(parts[0], 'op.created', { op_id: op.id, name: op.name });
      return new Response(JSON.stringify(op), { status: 201, headers: cors });
    }

    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'ops') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || (group.owner_id !== full.id && full.role !== 'admin')) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.game !== undefined) updates.game = body.game;
      if (body.scheduled_at !== undefined) updates.scheduled_at = body.scheduled_at;
      if (body.end_date !== undefined) updates.end_date = body.end_date;
      if (body.event_type !== undefined) updates.event_type = body.event_type;
      if (body.status !== undefined) updates.status = body.status;
      if (body.participants !== undefined) updates.participants = body.participants;
      const updated = await base44.asServiceRole.entities.MilsimOp.update(parts[2], updates);
      if (body.status === 'completed') {
        try {
          const op = await base44.asServiceRole.entities.MilsimOp.get(parts[2]);
          const participantIds: string[] = Array.isArray(op?.participants) ? op.participants : [];
          if (participantIds.length > 0) await recordActivityDateForRoster(base44, participantIds);
        } catch (e) { console.error('[ops PATCH activity]', e); }
      }
      return new Response(JSON.stringify(updated), { status: 200, headers: cors });
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'ops') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || (group.owner_id !== full.id && full.role !== 'admin')) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      await base44.asServiceRole.entities.MilsimOp.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── AARS ─────────────────────────────────────────────────────────────────

    if (method === 'GET' && parts.length === 2 && parts[1] === 'aars') {
      const aars = await base44.asServiceRole.entities.MilsimAAR.filter({ group_id: parts[0] });
      return new Response(JSON.stringify(aars), { status: 200, headers: cors });
    }

    if (method === 'POST' && parts.length === 2 && parts[1] === 'aars') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const body = await req.json().catch(() => ({}));
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group) return new Response(JSON.stringify({ error: 'Group not found' }), { status: 404, headers: cors });
      const aar = await base44.asServiceRole.entities.MilsimAAR.create({
        group_id: parts[0], op_id: body.op_id ?? null, op_name: body.op_name ?? null,
        author_id: full.id, author_username: full.username,
        title: body.title, content: body.content ?? null,
        outcome: body.outcome ?? null, lessons_learned: body.lessons_learned ?? null,
        participants: body.participants ?? [], lb_flagged: false,
        classification: body.classification ?? 'UNCLASSIFIED',
        objectives_hit: body.objectives_hit ?? null, objectives_missed: body.objectives_missed ?? null,
        casualties: body.casualties ?? null, commendations: body.commendations ?? null,
        op_date: body.op_date ?? null,
      });
      await base44.asServiceRole.entities.MilsimGroup.update(parts[0], { last_aar_date: new Date().toISOString() });
      if (Array.isArray(body.participants) && body.participants.length > 0) {
        await recordActivityDateForRoster(base44, body.participants);
      }
      await fireEvent(parts[0], 'aar.submitted', { aar_id: aar.id, title: aar.title });
      return new Response(JSON.stringify(aar), { status: 201, headers: cors });
    }

    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'aars') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const aar = await base44.asServiceRole.entities.MilsimAAR.get(parts[2]);
      if (!aar || (aar.author_id !== full.id && full.role !== 'admin')) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.content !== undefined) updates.content = body.content;
      if (body.outcome !== undefined) updates.outcome = body.outcome;
      if (body.lessons_learned !== undefined) updates.lessons_learned = body.lessons_learned;
      if (body.participants !== undefined) updates.participants = body.participants;
      if (body.lb_flagged !== undefined) updates.lb_flagged = body.lb_flagged;
      if (body.classification !== undefined) updates.classification = body.classification;
      if (body.objectives_hit !== undefined) updates.objectives_hit = body.objectives_hit;
      if (body.objectives_missed !== undefined) updates.objectives_missed = body.objectives_missed;
      if (body.casualties !== undefined) updates.casualties = body.casualties;
      if (body.commendations !== undefined) updates.commendations = body.commendations;
      if (body.op_date !== undefined) updates.op_date = body.op_date;
      const updated = await base44.asServiceRole.entities.MilsimAAR.update(parts[2], updates);
      return new Response(JSON.stringify(updated), { status: 200, headers: cors });
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'aars') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const aar = await base44.asServiceRole.entities.MilsimAAR.get(parts[2]);
      if (!aar || (aar.author_id !== full.id && full.role !== 'admin')) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      await base44.asServiceRole.entities.MilsimAAR.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── BRIEFINGS ────────────────────────────────────────────────────────────

    if (method === 'GET' && parts.length === 2 && parts[1] === 'briefings') {
      const briefings = await base44.asServiceRole.entities.MilsimBriefing.filter({ group_id: parts[0] });
      return new Response(JSON.stringify(briefings), { status: 200, headers: cors });
    }

    if (method === 'POST' && parts.length === 2 && parts[1] === 'briefings') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || (group.owner_id !== full.id && full.role !== 'admin')) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      const briefing = await base44.asServiceRole.entities.MilsimBriefing.create({
        group_id: parts[0], op_id: body.op_id ?? null, title: body.title,
        content: body.content ?? null, classification: body.classification ?? 'UNCLASSIFIED',
        created_by: full.username, status: body.status ?? 'draft',
        ao: body.ao ?? null, objectives: body.objectives ?? null, comms_plan: body.comms_plan ?? null,
        roe: body.roe ?? null, additional_notes: body.additional_notes ?? null, op_date: body.op_date ?? null,
      });
      return new Response(JSON.stringify(briefing), { status: 201, headers: cors });
    }

    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'briefings') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const briefing = await base44.asServiceRole.entities.MilsimBriefing.get(parts[2]);
      if (!briefing) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(briefing.group_id);
      if (!group || (group.owner_id !== full.id && full.role !== 'admin')) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.content !== undefined) updates.content = body.content;
      if (body.classification !== undefined) updates.classification = body.classification;
      if (body.status !== undefined) updates.status = body.status;
      if (body.ao !== undefined) updates.ao = body.ao;
      if (body.objectives !== undefined) updates.objectives = body.objectives;
      if (body.comms_plan !== undefined) updates.comms_plan = body.comms_plan;
      if (body.roe !== undefined) updates.roe = body.roe;
      if (body.additional_notes !== undefined) updates.additional_notes = body.additional_notes;
      if (body.op_date !== undefined) updates.op_date = body.op_date;
      const updated = await base44.asServiceRole.entities.MilsimBriefing.update(parts[2], updates);
      return new Response(JSON.stringify(updated), { status: 200, headers: cors });
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'briefings') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const briefing = await base44.asServiceRole.entities.MilsimBriefing.get(parts[2]);
      if (!briefing) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(briefing.group_id);
      if (!group || (group.owner_id !== full.id && full.role !== 'admin')) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      await base44.asServiceRole.entities.MilsimBriefing.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── WARNOS ───────────────────────────────────────────────────────────────

    if (method === 'GET' && parts.length === 2 && parts[1] === 'warnos') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const warnos = await base44.asServiceRole.entities.MilsimWarno.filter({ group_id: parts[0] });
      return new Response(JSON.stringify(warnos), { status: 200, headers: cors });
    }

    if (method === 'POST' && parts.length === 2 && parts[1] === 'warnos') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || (group.owner_id !== full.id && full.role !== 'admin')) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const body = await req.json().catch(() => ({}));
      const warno = await base44.asServiceRole.entities.MilsimWarno.create({
        group_id: parts[0], op_id: body.op_id ?? null, title: body.title,
        status: body.status ?? 'draft', created_by: full.username,
        situation_ground: body.situation_ground ?? null, situation_enemy: body.situation_enemy ?? null,
        situation_friendly: body.situation_friendly ?? null, mission: body.mission ?? null,
        timings_hh: body.timings_hh ?? null, timings_nmb: body.timings_nmb ?? null,
        timings_other: body.timings_other ?? null, o_group_time: body.o_group_time ?? null,
        o_group_loc: body.o_group_loc ?? null, o_group_other: body.o_group_other ?? null,
        css: body.css ?? null,
        acknowledge_1_sect: false, acknowledge_2_sect: false, acknowledge_3_sect: false,
        acknowledge_4_sect: false, acknowledge_pl_sgt: false,
        acknowledge_atts_1: false, acknowledge_atts_2: false, acknowledge_atts_3: false,
        op_date: body.op_date ?? null,
      });
      return new Response(JSON.stringify(warno), { status: 201, headers: cors });
    }

    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'warnos') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const warno = await base44.asServiceRole.entities.MilsimWarno.get(parts[2]);
      if (!warno) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: cors });
      const body = await req.json().catch(() => ({}));
      const updated = await base44.asServiceRole.entities.MilsimWarno.update(parts[2], body);
      return new Response(JSON.stringify(updated), { status: 200, headers: cors });
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'warnos') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      await base44.asServiceRole.entities.MilsimWarno.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── FIRE ─────────────────────────────────────────────────────────────────

    if (parts[0] === 'fire' && method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const { group_id, event, payload } = body;
      if (!group_id || !event) return new Response(JSON.stringify({ error: 'group_id and event required' }), { status: 400, headers: cors });
      await fireEvent(group_id, event, payload ?? {});
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
    }

    // ── ANALYTICS ────────────────────────────────────────────────────────────

    if (parts[0] === 'analytics' && parts.length === 2) {
      const groupId = parts[1];
      const [roster, aars, ops, loas] = await Promise.all([
        base44.asServiceRole.entities.MilsimRoster.filter({ group_id: groupId }),
        base44.asServiceRole.entities.MilsimAAR.filter({ group_id: groupId }),
        base44.asServiceRole.entities.MilsimOp.filter({ group_id: groupId }),
        base44.asServiceRole.entities.MilsimLOA.filter({ group_id: groupId }),
      ]);
      return new Response(JSON.stringify({ roster_count: roster.length, aar_count: aars.length, op_count: ops.length, loa_count: loas.length }), { status: 200, headers: cors });
    }

    // ── LEADERBOARD ──────────────────────────────────────────────────────────

    if (parts[0] === 'leaderboard' && method === 'GET') {
      const groups = await base44.asServiceRole.entities.MilsimGroup.list();
      const approved = groups.filter((g: any) => g.status === 'approved' || g.status === 'featured');
      const scored = await Promise.all(approved.map(async (g: any) => {
        const [roster, aars, ops] = await Promise.all([
          base44.asServiceRole.entities.MilsimRoster.filter({ group_id: g.id }),
          base44.asServiceRole.entities.MilsimAAR.filter({ group_id: g.id }),
          base44.asServiceRole.entities.MilsimOp.filter({ group_id: g.id }),
        ]);
        const score = (roster.length * 5) + (aars.length * 10) + (ops.length * 8);
        return { id: g.id, name: g.name, slug: g.slug, logo_url: g.logo_url, score, roster_count: roster.length, aar_count: aars.length, op_count: ops.length };
      }));
      return new Response(JSON.stringify(scored.sort((a: any, b: any) => b.score - a.score)), { status: 200, headers: cors });
    }

    // ── UPVOTE (redirect) ─────────────────────────────────────────────────────

    if (parts[0] === 'upvote') {
      return new Response(JSON.stringify({ error: 'Use /groupUpvotes for upvote operations' }), { status: 308, headers: cors });
    }

    // ── REVIEW ───────────────────────────────────────────────────────────────

    if (parts[0] === 'review' && method === 'POST') {
      const full = await getCallerUser(base44, req);
      if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const body = await req.json().catch(() => ({}));
      const groupId = parts[1] ?? body.group_id;
      if (!groupId) return new Response(JSON.stringify({ error: 'group_id required' }), { status: 400, headers: cors });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(groupId);
      if (!group) return new Response(JSON.stringify({ error: 'Group not found' }), { status: 404, headers: cors });
      const review = await base44.asServiceRole.entities.GroupReview.create({
        group_id: groupId, group_name: group.name,
        reviewer_id: full.id, reviewer_username: full.username,
        rating: body.rating ?? 3, organisation: body.organisation ?? 3,
        communication: body.communication ?? 3, gameplay: body.gameplay ?? 3, community: body.community ?? 3,
        headline: body.headline ?? null, body: body.body ?? null,
        served_months: body.served_months ?? 0, recommend: body.recommend ?? true,
      });
      return new Response(JSON.stringify(review), { status: 201, headers: cors });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: cors });
  } catch (error: any) {
    console.error('[milsimGroups]', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
  }
});
