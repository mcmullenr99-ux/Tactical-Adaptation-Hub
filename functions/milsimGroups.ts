import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

async function getCallerUser(base44: any) {
  const user = await base44.auth.me();
  if (!user) return null;
  const users = await base44.asServiceRole.entities.User.filter({ email: user.email });
  return users[0] ?? null;
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
  const [roles, ranks, roster, questions] = await Promise.all([
    base44.asServiceRole.entities.MilsimRole.filter({ group_id: group.id }),
    base44.asServiceRole.entities.MilsimRank.filter({ group_id: group.id }),
    base44.asServiceRole.entities.MilsimRoster.filter({ group_id: group.id }),
    base44.asServiceRole.entities.MilsimAppQuestion.filter({ group_id: group.id }),
  ]);
  return { ...group, roles, ranks, roster, questions };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const parts = url.pathname.replace(/^\/functions\/milsimGroups/, '').split('/').filter(Boolean);
    const method = req.method;

    // GET /milsimGroups — list approved/featured
    if (method === 'GET' && parts.length === 0) {
      const all = await base44.asServiceRole.entities.MilsimGroup.list();
      const visible = all.filter((g: any) => g.status === 'approved' || g.status === 'featured');
      return Response.json(visible);
    }

    // GET /milsimGroups/mine/own
    if (method === 'GET' && parts[0] === 'mine' && parts[1] === 'own') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const groups = await base44.asServiceRole.entities.MilsimGroup.filter({ owner_id: full.id });
      if (groups.length === 0) return Response.json(null);
      return Response.json(await groupFullDetail(base44, groups[0]));
    }

    // GET /milsimGroups/mine/memberships
    if (method === 'GET' && parts[0] === 'mine' && parts[1] === 'memberships') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const roster = await base44.asServiceRole.entities.MilsimRoster.filter({ user_id: full.id });
      const groups = await Promise.all(roster.map((r: any) => base44.asServiceRole.entities.MilsimGroup.get(r.group_id)));
      return Response.json(groups.filter(Boolean).map((g: any) => ({ id: g.id, name: g.name, slug: g.slug })));
    }

    // GET /milsimGroups/:slug — by slug
    if (method === 'GET' && parts.length === 1) {
      const all = await base44.asServiceRole.entities.MilsimGroup.filter({ slug: parts[0] });
      const group = all[0];
      if (!group) return Response.json({ error: 'Group not found' }, { status: 404 });
      return Response.json(await groupFullDetail(base44, group));
    }

    // POST /milsimGroups — create
    if (method === 'POST' && parts.length === 0) {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const existing = await base44.asServiceRole.entities.MilsimGroup.filter({ owner_id: full.id });
      if (existing.length > 0) return Response.json({ error: 'You already have a registered group' }, { status: 409 });

      const body = await req.json().catch(() => ({}));
      const { name, tagLine, description, discordUrl, websiteUrl, logoUrl, sops, orbat } = body;
      if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });

      const slug = await makeUniqueSlug(base44, name);
      const group = await base44.asServiceRole.entities.MilsimGroup.create({
        name, slug,
        tag_line: tagLine ?? null,
        description: description ?? null,
        discord_url: discordUrl ?? null,
        website_url: websiteUrl ?? null,
        logo_url: logoUrl ?? null,
        sops: sops ?? null,
        orbat: orbat ?? null,
        status: 'pending',
        owner_id: full.id,
        owner_username: full.username,
      });
      return Response.json(await groupFullDetail(base44, group), { status: 201 });
    }

    // PATCH /milsimGroups/:id/info
    if (method === 'PATCH' && parts.length === 2 && parts[1] === 'info') {
      const full = await getCallerUser(base44);
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
      if (body.logoUrl !== undefined) updates.logo_url = body.logoUrl;
      if (body.sops !== undefined) updates.sops = body.sops;
      if (body.orbat !== undefined) updates.orbat = body.orbat;

      await base44.asServiceRole.entities.MilsimGroup.update(parts[0], updates);
      const updated = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      return Response.json(await groupFullDetail(base44, updated));
    }

    // PATCH /milsimGroups/:id/status — mod/admin only
    if (method === 'PATCH' && parts.length === 2 && parts[1] === 'status') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!['moderator', 'admin'].includes(full.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const body = await req.json().catch(() => ({}));
      const updated = await base44.asServiceRole.entities.MilsimGroup.update(parts[0], { status: body.status });
      return Response.json(updated);
    }

    // DELETE /milsimGroups/:id
    if (method === 'DELETE' && parts.length === 1) {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group) return Response.json({ error: 'Not found' }, { status: 404 });
      if (group.owner_id !== full.id && full.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

      await base44.asServiceRole.entities.MilsimGroup.delete(parts[0]);
      return new Response(null, { status: 204 });
    }

    // POST /milsimGroups/:id/roles
    if (method === 'POST' && parts.length === 2 && parts[1] === 'roles') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const body = await req.json().catch(() => ({}));
      const role = await base44.asServiceRole.entities.MilsimRole.create({
        group_id: parts[0], name: body.name, description: body.description ?? null, sort_order: body.sortOrder ?? 0,
      });
      return Response.json(role, { status: 201 });
    }

    // DELETE /milsimGroups/:id/roles/:roleId
    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'roles') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimRole.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // POST /milsimGroups/:id/ranks
    if (method === 'POST' && parts.length === 2 && parts[1] === 'ranks') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const rank = await base44.asServiceRole.entities.MilsimRank.create({
        group_id: parts[0], name: body.name, abbreviation: body.abbreviation ?? null, tier: body.tier ?? 0,
      });
      return Response.json(rank, { status: 201 });
    }

    // DELETE /milsimGroups/:id/ranks/:rankId
    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'ranks') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimRank.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // POST /milsimGroups/:id/roster
    if (method === 'POST' && parts.length === 2 && parts[1] === 'roster') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const entry = await base44.asServiceRole.entities.MilsimRoster.create({
        group_id: parts[0], callsign: body.callsign,
        rank_id: body.rankId ?? null, role_id: body.roleId ?? null,
        notes: body.notes ?? null, user_id: body.userId ?? null,
      });
      return Response.json(entry, { status: 201 });
    }

    // PATCH /milsimGroups/:id/roster/:entryId
    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'roster') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.callsign !== undefined) updates.callsign = body.callsign;
      if (body.rankId !== undefined) updates.rank_id = body.rankId;
      if (body.roleId !== undefined) updates.role_id = body.roleId;
      if (body.notes !== undefined) updates.notes = body.notes;
      const updated = await base44.asServiceRole.entities.MilsimRoster.update(parts[2], updates);
      return Response.json(updated);
    }

    // DELETE /milsimGroups/:id/roster/:entryId
    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'roster') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimRoster.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // POST /milsimGroups/:id/questions
    if (method === 'POST' && parts.length === 2 && parts[1] === 'questions') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const q = await base44.asServiceRole.entities.MilsimAppQuestion.create({
        group_id: parts[0], question: body.question,
        sort_order: body.sortOrder ?? 0, required: body.required ?? true,
      });
      return Response.json(q, { status: 201 });
    }

    // DELETE /milsimGroups/:id/questions/:qId
    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'questions') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimAppQuestion.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[milsimGroups]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
