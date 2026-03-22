import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

async function getCallerUser(base44: any) {
  const authHeader = (base44._req as Request | undefined)?.headers?.get('Authorization') ?? '';
  // Fall back to base44.auth.me() which reads the Bearer token
  const user = await base44.auth.me().catch(() => null);
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

    // ── LIST / PUBLIC ────────────────────────────────────────────────────────

    // GET / — list approved groups
    if (method === 'GET' && parts.length === 0) {
      const all = await base44.asServiceRole.entities.MilsimGroup.list();
      return Response.json(all.filter((g: any) => g.status === 'approved' || g.status === 'featured'));
    }

    // GET /mine/own
    if (method === 'GET' && parts[0] === 'mine' && parts[1] === 'own') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const groups = await base44.asServiceRole.entities.MilsimGroup.filter({ owner_id: full.id });
      if (groups.length === 0) return Response.json(null);
      return Response.json(await groupFullDetail(base44, groups[0]));
    }

    // GET /mine/memberships
    if (method === 'GET' && parts[0] === 'mine' && parts[1] === 'memberships') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const roster = await base44.asServiceRole.entities.MilsimRoster.filter({ user_id: full.id });
      const groups = await Promise.all(roster.map((r: any) => base44.asServiceRole.entities.MilsimGroup.get(r.group_id)));
      return Response.json(groups.filter(Boolean).map((g: any) => ({ id: g.id, name: g.name, slug: g.slug })));
    }

    // GET /mine/all — owner's group (pending too)
    if (method === 'GET' && parts[0] === 'mine' && parts[1] === 'all') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const groups = await base44.asServiceRole.entities.MilsimGroup.filter({ owner_id: full.id });
      if (groups.length === 0) return Response.json(null);
      return Response.json(await groupFullDetail(base44, groups[0]));
    }

    // GET /mine/awards-summary
    if (method === 'GET' && parts[0] === 'mine' && parts[1] === 'awards-summary') {
      const full = await getCallerUser(base44);
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
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const existing = await base44.asServiceRole.entities.MilsimGroup.filter({ owner_id: full.id });
      if (existing.length > 0) return Response.json({ error: 'You already have a registered group' }, { status: 409 });
      const body = await req.json().catch(() => ({}));
      const { name, tagLine, description, discordUrl, websiteUrl, logoUrl, sops, orbat } = body;
      if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });
      const slug = await makeUniqueSlug(base44, name);
      const group = await base44.asServiceRole.entities.MilsimGroup.create({
        name, slug, tag_line: tagLine ?? null, description: description ?? null,
        discord_url: discordUrl ?? null, website_url: websiteUrl ?? null,
        logo_url: logoUrl ?? null, sops: sops ?? null, orbat: orbat ?? null,
        status: 'pending', owner_id: full.id, owner_username: full.username,
      });
      return Response.json(await groupFullDetail(base44, group), { status: 201 });
    }

    // ── GROUP MANAGEMENT ─────────────────────────────────────────────────────

    // PATCH /:id/info
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

    // PATCH /:id/stream
    if (method === 'PATCH' && parts.length === 2 && parts[1] === 'stream') {
      const full = await getCallerUser(base44);
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
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!['moderator', 'admin'].includes(full.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updated = await base44.asServiceRole.entities.MilsimGroup.update(parts[0], { status: body.status });
      return Response.json(updated);
    }

    // DELETE /:id
    if (method === 'DELETE' && parts.length === 1) {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group) return Response.json({ error: 'Not found' }, { status: 404 });
      if (group.owner_id !== full.id && full.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimGroup.delete(parts[0]);
      return new Response(null, { status: 204 });
    }

    // ── ROLES ────────────────────────────────────────────────────────────────

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

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'roles') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimRole.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── RANKS ────────────────────────────────────────────────────────────────

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

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'ranks') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimRank.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── ROSTER ───────────────────────────────────────────────────────────────

    if (method === 'POST' && parts.length === 2 && parts[1] === 'roster') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const entry = await base44.asServiceRole.entities.MilsimRoster.create({
        group_id: parts[0], callsign: body.callsign,
        rank_id: body.rankId ?? null, role_id: body.roleId ?? null, notes: body.notes ?? null,
      });
      return Response.json(entry, { status: 201 });
    }

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

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'roster') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimRoster.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── QUESTIONS ────────────────────────────────────────────────────────────

    if (method === 'POST' && parts.length === 2 && parts[1] === 'questions') {
      const full = await getCallerUser(base44);
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
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimAppQuestion.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── APPLICATIONS ─────────────────────────────────────────────────────────

    // GET /:id/applications
    if (method === 'GET' && parts.length === 2 && parts[1] === 'applications') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const apps = await base44.asServiceRole.entities.MilsimApplication.filter({ group_id: parts[0] });
      return Response.json(apps);
    }

    // POST /:id/apply
    if (method === 'POST' && parts.length === 2 && parts[1] === 'apply') {
      const full = await getCallerUser(base44);
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
      const full = await getCallerUser(base44);
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
      const full = await getCallerUser(base44);
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
      const full = await getCallerUser(base44);
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
      const full = await getCallerUser(base44);
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
      const full = await getCallerUser(base44);
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
      const full = await getCallerUser(base44);
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
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.Qualification.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // POST /:id/qualifications/:qid/grant
    if (method === 'POST' && parts.length === 4 && parts[1] === 'qualifications' && parts[3] === 'grant') {
      const full = await getCallerUser(base44);
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
      const full = await getCallerUser(base44);
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
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const op = await base44.asServiceRole.entities.MilsimOp.create({
        group_id: parts[0], name: body.name, description: body.description ?? null,
        game: body.game ?? null, status: 'active', created_by: full.id,
      });
      return Response.json(op, { status: 201 });
    }

    // PATCH /:id/ops/:opId/end
    if (method === 'PATCH' && parts.length === 4 && parts[1] === 'ops' && parts[3] === 'end') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const updated = await base44.asServiceRole.entities.MilsimOp.update(parts[2], { status: 'completed' });
      return Response.json(updated);
    }

    // DELETE /:id/ops/:opId
    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'ops') {
      const full = await getCallerUser(base44);
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
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const aar = await base44.asServiceRole.entities.MilsimAAR.create({
        group_id: parts[0], op_id: body.opId ?? null, op_name: body.opName ?? null,
        author_id: full.id, author_username: full.username,
        title: body.title, content: body.content,
        outcome: body.outcome ?? null, lessons_learned: body.lessonsLearned ?? null,
      });
      return Response.json(aar, { status: 201 });
    }

    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'aars') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.content !== undefined) updates.content = body.content;
      if (body.outcome !== undefined) updates.outcome = body.outcome;
      if (body.lessonsLearned !== undefined) updates.lessons_learned = body.lessonsLearned;
      const updated = await base44.asServiceRole.entities.MilsimAAR.update(parts[2], updates);
      return Response.json(updated);
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'aars') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimAAR.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // ── BRIEFINGS ────────────────────────────────────────────────────────────

    if (method === 'GET' && parts.length === 2 && parts[1] === 'briefings') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const briefings = await base44.asServiceRole.entities.MilsimBriefing.filter({ group_id: parts[0] });
      return Response.json(briefings.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
    }

    if (method === 'POST' && parts.length === 2 && parts[1] === 'briefings') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const briefing = await base44.asServiceRole.entities.MilsimBriefing.create({
        group_id: parts[0], op_id: body.opId ?? null, title: body.title, content: body.content,
        classification: body.classification ?? 'unclassified', created_by: full.id,
      });
      return Response.json(briefing, { status: 201 });
    }

    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'briefings') {
      const full = await getCallerUser(base44);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.content !== undefined) updates.content = body.content;
      if (body.classification !== undefined) updates.classification = body.classification;
      const updated = await base44.asServiceRole.entities.MilsimBriefing.update(parts[2], updates);
      return Response.json(updated);
    }

    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'briefings') {
      const full = await getCallerUser(base44);
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
