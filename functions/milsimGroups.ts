import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

async function getCallerUser(base44: any, req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    return await base44.asServiceRole.entities.User.get(payload.sub) ?? null;
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

    // Enrich each roster entry with their quals and awards
    const enrichedRoster = (roster ?? []).map((entry: any) => ({
      ...entry,
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path'); const parts = pathOverride ? pathOverride.split('/').filter(Boolean) : url.pathname.replace(/^\/functions\/milsimGroups/, '').split('/').filter(Boolean);
    const method = req.method;

    // ── LIST / PUBLIC ────────────────────────────────────────────────────────

    // GET / — list approved groups
    if (method === 'GET' && parts.length === 0) {
      const all = await base44.asServiceRole.entities.MilsimGroup.list();
      const visible = all.filter((g: any) => g.status === 'approved' || g.status === 'featured');
      // Normalise snake_case → camelCase so frontend filters work
      const normalised = visible.map((g: any) => ({
        ...g,
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
      return Response.json(normalised);
    }

    // GET /mine/own
    if (method === 'GET' && parts[0] === 'mine' && parts[1] === 'own') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const groups = await base44.asServiceRole.entities.MilsimGroup.filter({ owner_id: full.id });
      if (groups.length === 0) return Response.json(null);
      return Response.json(await groupFullDetail(base44, groups[0]));
    }

    // GET /mine/memberships
    if (method === 'GET' && parts[0] === 'mine' && parts[1] === 'memberships') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const roster = await base44.asServiceRole.entities.MilsimRoster.filter({ user_id: full.id });
      const groups = await Promise.all(roster.map((r: any) => base44.asServiceRole.entities.MilsimGroup.get(r.group_id)));
      return Response.json(groups.filter(Boolean).map((g: any) => ({ id: g.id, name: g.name, slug: g.slug })));
    }

    // GET /mine/all — owner's group (pending too)
    if (method === 'GET' && parts[0] === 'mine' && parts[1] === 'all') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const groups = await base44.asServiceRole.entities.MilsimGroup.filter({ owner_id: full.id });
      if (groups.length === 0) return Response.json(null);
      return Response.json(await groupFullDetail(base44, groups[0]));
    }

    // GET /mine/awards-summary
    if (method === 'GET' && parts[0] === 'mine' && parts[1] === 'awards-summary') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const rosterEntries = await base44.asServiceRole.entities.MilsimRoster.filter({ user_id: full.id });
      const awards = [];
      for (const entry of rosterEntries) {
        const groupAwards = await base44.asServiceRole.entities.MilsimAward.filter({ recipient_roster_id: entry.id });
        awards.push(...groupAwards);
      }
      return Response.json(awards);
    }

    // GET /:slug — public group by slug
    if (method === 'GET' && parts.length === 1) {
      const all = await base44.asServiceRole.entities.MilsimGroup.filter({ slug: parts[0] });
      const group = all[0];
      if (!group) return Response.json({ error: 'Group not found' }, { status: 404 });
      return Response.json(await groupFullDetail(base44, group));
    }

    // ── CREATE ───────────────────────────────────────────────────────────────

    // POST / — create group
    if (method === 'POST' && parts.length === 0) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const existing = await base44.asServiceRole.entities.MilsimGroup.filter({ owner_id: full.id });
      if (existing.length > 0) return Response.json({ error: 'You already have a registered group' }, { status: 409 });
      const body = await req.json().catch(() => ({}));
      const { name, tagLine, description, discordUrl, websiteUrl, steamGroupUrl, logoUrl, sops, orbat,
              country, language, branch, unitType, games, tags } = body;
      if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });
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
      return Response.json(await groupFullDetail(base44, group), { status: 201 });
    }

    // ── GROUP MANAGEMENT ─────────────────────────────────────────────────────

    // PATCH /:id/info
    if (method === 'PATCH' && parts.length === 2 && parts[1] === 'info') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group) return Response.json({ error: 'Group not found' }, { status: 404 });
      if (group.owner_id !== full.id && full.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
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
      if (body.visibility !== undefined) updates.visibility = JSON.stringify(body.visibility);
      if (body.country !== undefined) updates.country = body.country;
      if (body.language !== undefined) updates.language = body.language;
      if (body.branch !== undefined) updates.branch = body.branch;
      if (body.unitType !== undefined) updates.unit_type = body.unitType;
      if (body.games !== undefined) updates.games = body.games;
      if (body.tags !== undefined) updates.tags = body.tags;
      updates.last_page_update = new Date().toISOString();
      await base44.asServiceRole.entities.MilsimGroup.update(parts[0], updates);
      const updated = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      return Response.json(await groupFullDetail(base44, updated));
    }

    // PATCH /:id/stream
    if (method === 'PATCH' && parts.length === 2 && parts[1] === 'stream') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || (group.owner_id !== full.id && full.role !== 'admin')) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.discordUrl !== undefined) updates.discord_url = body.discordUrl;
      if (body.websiteUrl !== undefined) updates.website_url = body.websiteUrl;
      await base44.asServiceRole.entities.MilsimGroup.update(parts[0], updates);
      const updated = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      return Response.json(await groupFullDetail(base44, updated));
    }

    // PATCH /:id/status — mod/admin only
    if (method === 'PATCH' && parts.length === 2 && parts[1] === 'status') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!['moderator', 'admin'].includes(full.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updated = await base44.asServiceRole.entities.MilsimGroup.update(parts[0], { status: body.status });
      return Response.json(updated);
    }

    // DELETE /:id
    if (method === 'DELETE' && parts.length === 1) {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group) return Response.json({ error: 'Not found' }, { status: 404 });
      if (group.owner_id !== full.id && full.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimGroup.delete(parts[0]);
      return new Response(null, { status: 204 });
    }

    // ── ROLES ────────────────────────────────────────────────────────────────

    if (method === 'POST' && parts.length === 2 && parts[1] === 'roles') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const role = await base44.asServiceRole.entities.MilsimRole.create({
        group_id: parts[0], name: body.name, description: body.description ?? null, sort_order: body.sortOrder ?? 0,
      });
      return Response.json(role, { status: 201 });
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'roles') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimRole.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── RANKS ────────────────────────────────────────────────────────────────

    if (method === 'POST' && parts.length === 2 && parts[1] === 'ranks') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const rank = await base44.asServiceRole.entities.MilsimRank.create({
        group_id: parts[0], name: body.name, abbreviation: body.abbreviation ?? null, tier: body.tier ?? 0,
      });
      return Response.json(rank, { status: 201 });
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'ranks') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimRank.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── ROSTER ───────────────────────────────────────────────────────────────

    if (method === 'POST' && parts.length === 2 && parts[1] === 'roster') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const entry = await base44.asServiceRole.entities.MilsimRoster.create({
        group_id: parts[0], callsign: body.callsign,
        rank_id: body.rankId ?? null, role_id: body.roleId ?? null, notes: body.notes ?? null,
        status: body.status ?? 'Active',
        specialisations: body.specialisations ?? [],
        join_date: body.join_date ?? null,
        ops_count: body.ops_count ?? 0,
      });
      return Response.json(entry, { status: 201 });
    }

    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'roster') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.callsign !== undefined) updates.callsign = body.callsign;
      if (body.rankId !== undefined) updates.rank_id = body.rankId;
      if (body.roleId !== undefined) updates.role_id = body.roleId;
      if (body.notes !== undefined) updates.notes = body.notes;
      if (body.status !== undefined) updates.status = body.status;
      if (body.specialisations !== undefined) updates.specialisations = body.specialisations;
      if (body.join_date !== undefined) updates.join_date = body.join_date;
      if (body.ops_count !== undefined) updates.ops_count = body.ops_count;
      const updated = await base44.asServiceRole.entities.MilsimRoster.update(parts[2], updates);
      return Response.json(updated);
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'roster') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimRoster.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── QUESTIONS ────────────────────────────────────────────────────────────

    if (method === 'POST' && parts.length === 2 && parts[1] === 'questions') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const q = await base44.asServiceRole.entities.MilsimAppQuestion.create({
        group_id: parts[0], question: body.question, sort_order: body.sortOrder ?? 0, required: body.required ?? false,
      });
      return Response.json(q, { status: 201 });
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'questions') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimAppQuestion.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── APPLICATIONS ─────────────────────────────────────────────────────────

    // GET /:id/applications
    if (method === 'GET' && parts.length === 2 && parts[1] === 'applications') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const apps = await base44.asServiceRole.entities.MilsimApplication.filter({ group_id: parts[0] });
      return Response.json(apps);
    }

    // POST /:id/apply
    if (method === 'POST' && parts.length === 2 && parts[1] === 'apply') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const existing = await base44.asServiceRole.entities.MilsimApplication.filter({ group_id: parts[0], applicant_id: full.id });
      if (existing.length > 0) return Response.json({ error: 'Already applied' }, { status: 409 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group) return Response.json({ error: 'Group not found' }, { status: 404 });
      const body = await req.json().catch(() => ({}));
      const app = await base44.asServiceRole.entities.MilsimApplication.create({
        group_id: parts[0], group_name: group.name,
        applicant_id: full.id, applicant_username: full.username,
        answers: body.answers ?? [], status: 'pending',
      });
      return Response.json(app, { status: 201 });
    }

    // PATCH /:id/applications/:appId
    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'applications') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = { reviewed_by: full.id };
      if (body.status) updates.status = body.status;
      if (body.reviewNote !== undefined) updates.review_note = body.reviewNote;
      const updated = await base44.asServiceRole.entities.MilsimApplication.update(parts[2], updates);
      if (body.status === 'approved') {
        const app = await base44.asServiceRole.entities.MilsimApplication.get(parts[2]);
        if (app) {
          await base44.asServiceRole.entities.MilsimRoster.create({
            group_id: parts[0], user_id: app.applicant_id, callsign: app.applicant_username,
          });
        }
      }
      return Response.json(updated);
    }

    // ── AWARD DEFS ───────────────────────────────────────────────────────────

    if (method === 'GET' && parts.length === 2 && parts[1] === 'award-defs') {
      const defs = await base44.asServiceRole.entities.MilsimAwardDef.filter({ group_id: parts[0] });
      return Response.json(defs.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
    }

    if (method === 'POST' && parts.length === 2 && parts[1] === 'award-defs') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const def = await base44.asServiceRole.entities.MilsimAwardDef.create({
        group_id: parts[0], name: body.name, description: body.description ?? null,
        image_url: body.imageUrl ?? null, sort_order: body.sortOrder ?? 0,
      });
      return Response.json(def, { status: 201 });
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'award-defs') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimAwardDef.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── AWARDS ───────────────────────────────────────────────────────────────

    if (method === 'GET' && parts.length === 2 && parts[1] === 'awards') {
      const awards = await base44.asServiceRole.entities.MilsimAward.filter({ group_id: parts[0] });
      return Response.json(awards);
    }

    if (method === 'POST' && parts.length === 2 && parts[1] === 'awards') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      let awardName = body.awardName;
      let awardDescription = body.awardDescription ?? null;
      let awardImageUrl = body.awardImageUrl ?? null;
      if (body.awardDefId) {
        const def = await base44.asServiceRole.entities.MilsimAwardDef.get(body.awardDefId);
        if (def) { awardName ??= def.name; awardDescription ??= def.description; awardImageUrl ??= def.image_url; }
      }
      const award = await base44.asServiceRole.entities.MilsimAward.create({
        group_id: parts[0], award_def_id: body.awardDefId ?? null,
        award_name: awardName, award_description: awardDescription, award_image_url: awardImageUrl,
        recipient_roster_id: body.recipientRosterId, recipient_callsign: body.recipientCallsign,
        awarded_by: full.id, reason: body.reason ?? null,
      });
      return Response.json(award, { status: 201 });
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'awards') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimAward.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── QUALIFICATIONS ───────────────────────────────────────────────────────

    if (method === 'GET' && parts.length === 2 && parts[1] === 'qualifications') {
      const quals = await base44.asServiceRole.entities.Qualification.filter({ group_id: parts[0] });
      const grants = await base44.asServiceRole.entities.QualificationGrant.filter({ group_id: parts[0] });
      return Response.json(quals.map((q: any) => ({
        ...q,
        grants: grants.filter((g: any) => g.qualification_id === q.id),
      })));
    }

    // POST /:id/qualifications
    if (method === 'POST' && parts.length === 2 && parts[1] === 'qualifications') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const qual = await base44.asServiceRole.entities.Qualification.create({
        group_id: parts[0], name: body.name, description: body.description ?? null, badge_url: body.badgeUrl ?? null,
      });
      return Response.json(qual, { status: 201 });
    }

    // DELETE /:id/qualifications/:qid
    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'qualifications') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.Qualification.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // POST /:id/qualifications/:qid/grant
    if (method === 'POST' && parts.length === 4 && parts[1] === 'qualifications' && parts[3] === 'grant') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const qual = await base44.asServiceRole.entities.Qualification.get(parts[2]);
      const rosterEntry = await base44.asServiceRole.entities.MilsimRoster.get(body.rosterEntryId);
      const grant = await base44.asServiceRole.entities.QualificationGrant.create({
        qualification_id: parts[2], qualification_name: qual?.name ?? '',
        group_id: parts[0], roster_id: body.rosterEntryId,
        callsign: rosterEntry?.callsign ?? body.callsign ?? '',
        granted_by: full.id, notes: body.notes ?? null,
      });
      return Response.json(grant, { status: 201 });
    }

    // DELETE /:id/qualifications/:qid/grant/:grantId
    if (method === 'DELETE' && parts.length === 5 && parts[1] === 'qualifications' && parts[3] === 'grant') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.QualificationGrant.delete(parts[4]);
      return new Response(null, { status: 204 });
    }

    // ── OPS ──────────────────────────────────────────────────────────────────

    // GET /:id/ops
    if (method === 'GET' && parts.length === 2 && parts[1] === 'ops') {
      const ops = await base44.asServiceRole.entities.MilsimOp.filter({ group_id: parts[0] });
      return Response.json(ops.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
    }

    // GET /:id/ops/active
    if (method === 'GET' && parts.length === 3 && parts[1] === 'ops' && parts[2] === 'active') {
      const ops = await base44.asServiceRole.entities.MilsimOp.filter({ group_id: parts[0], status: 'active' });
      return Response.json(ops[0] ?? null);
    }

    // POST /:id/ops
    if (method === 'POST' && parts.length === 2 && parts[1] === 'ops') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      if (!body.name?.trim()) return Response.json({ error: 'name is required' }, { status: 400 });
      const op = await base44.asServiceRole.entities.MilsimOp.create({
        group_id: parts[0], name: body.name, description: body.description ?? null,
        game: body.game ?? null, status: 'active', created_by: full.id,
        scheduled_at: new Date().toISOString(), participants: [],
      });
      return Response.json(op, { status: 201 });
    }

    // PATCH /:id/ops/:opId/end
    if (method === 'PATCH' && parts.length === 4 && parts[1] === 'ops' && parts[3] === 'end') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updateData: any = { status: 'completed' };
      if (Array.isArray(body.participants)) updateData.participants = body.participants;
      const updated = await base44.asServiceRole.entities.MilsimOp.update(parts[2], updateData);
      // Update roster ops_count for each participant
      if (Array.isArray(body.participants) && body.participants.length > 0) {
        await Promise.allSettled(body.participants.map(async (rosterId: string) => {
          try {
            const entry = await base44.asServiceRole.entities.MilsimRoster.get(rosterId);
            if (entry) await base44.asServiceRole.entities.MilsimRoster.update(rosterId, { ops_count: (entry.ops_count ?? 0) + 1 });
          } catch {}
        }));
      }
      return Response.json(updated);
    }

    // DELETE /:id/ops/:opId
    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'ops') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimOp.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── AARs ─────────────────────────────────────────────────────────────────

    if (method === 'GET' && parts.length === 2 && parts[1] === 'aars') {
      const aars = await base44.asServiceRole.entities.MilsimAAR.filter({ group_id: parts[0] });
      return Response.json(aars.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
    }

    if (method === 'POST' && parts.length === 2 && parts[1] === 'aars') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      if (!body.op_name?.trim()) return Response.json({ error: 'op_name required' }, { status: 400 });
      const aar = await base44.asServiceRole.entities.MilsimAAR.create({
        group_id: parts[0], op_id: body.op_id ?? null, op_name: body.op_name,
        author_id: full.id, author_username: full.username ?? full.email,
        title: body.op_name, content: body.summary ?? null,
        outcome: body.outcome ?? null, lessons_learned: body.recommendations ?? null,
        participants: Array.isArray(body.participants) ? body.participants : [],
      });
      await base44.asServiceRole.entities.MilsimGroup.update(parts[0], { last_aar_date: new Date().toISOString() }).catch(() => {});
      return Response.json(aar, { status: 201 });
    }

    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'aars') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.op_name !== undefined) updates.op_name = body.op_name;
      if (body.summary !== undefined) updates.content = body.summary;
      if (body.objectives_hit !== undefined) updates.objectives_hit = body.objectives_hit;
      if (body.objectives_missed !== undefined) updates.objectives_missed = body.objectives_missed;
      if (body.casualties !== undefined) updates.casualties = body.casualties;
      if (body.commendations !== undefined) updates.commendations = body.commendations;
      if (body.recommendations !== undefined) updates.lessons_learned = body.recommendations;
      if (body.classification !== undefined) updates.classification = body.classification;
      if (Array.isArray(body.participants)) updates.participants = body.participants;
      const updated = await base44.asServiceRole.entities.MilsimAAR.update(parts[2], updates);
      return Response.json(updated);
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'aars') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimAAR.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── BRIEFINGS ────────────────────────────────────────────────────────────

    if (method === 'GET' && parts.length === 2 && parts[1] === 'briefings') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const briefings = await base44.asServiceRole.entities.MilsimBriefing.filter({ group_id: parts[0] });
      return Response.json(briefings.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
    }

    if (method === 'POST' && parts.length === 2 && parts[1] === 'briefings') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      if (!body.title?.trim()) return Response.json({ error: 'title required' }, { status: 400 });
      // Build structured content from form fields
      const contentParts: string[] = [];
      if (body.ao) contentParts.push(`**Area of Operations:** ${body.ao}`);
      if (body.objectives) contentParts.push(`**Objectives:**
${body.objectives}`);
      if (body.comms_plan) contentParts.push(`**Comms Plan:**
${body.comms_plan}`);
      if (body.additional_notes) contentParts.push(`**Additional Notes:**
${body.additional_notes}`);
      const content = body.content ?? contentParts.join('

');
      const briefing = await base44.asServiceRole.entities.MilsimBriefing.create({
        group_id: parts[0], op_id: body.op_id ?? null, title: body.title.trim(),
        content, classification: body.classification ?? 'unclassified', created_by: full.id,
      });
      return Response.json(briefing, { status: 201 });
    }

    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'briefings') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.classification !== undefined) updates.classification = body.classification;
      // Rebuild content from fields if present
      if (body.content !== undefined) {
        updates.content = body.content;
      } else {
        const contentParts: string[] = [];
        if (body.ao) contentParts.push(`**Area of Operations:** ${body.ao}`);
        if (body.objectives) contentParts.push(`**Objectives:**
${body.objectives}`);
        if (body.comms_plan) contentParts.push(`**Comms Plan:**
${body.comms_plan}`);
        if (body.additional_notes) contentParts.push(`**Additional Notes:**
${body.additional_notes}`);
        if (contentParts.length > 0) updates.content = contentParts.join('

');
      }
      const updated = await base44.asServiceRole.entities.MilsimBriefing.update(parts[2], updates);
      return Response.json(updated);
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'briefings') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimBriefing.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[milsimGroups]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
