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


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/milsimAwards/, '').split('/').filter(Boolean);
    const method = req.method;

    // GET /milsimAwards/:groupId/award-defs
    if (method === 'GET' && parts.length === 2 && parts[1] === 'award-defs') {
      const defs = await base44.asServiceRole.entities.MilsimAwardDef.filter({ group_id: parts[0] });
      return Response.json(defs.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
    }

    // POST /milsimAwards/:groupId/award-defs
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

    // DELETE /milsimAwards/:groupId/award-defs/:defId
    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'award-defs') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimAwardDef.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // GET /milsimAwards/:groupId/awards
    if (method === 'GET' && parts.length === 2 && parts[1] === 'awards') {
      const awards = await base44.asServiceRole.entities.MilsimAward.filter({ group_id: parts[0] });
      return Response.json(awards);
    }

    // POST /milsimAwards/:groupId/awards
    if (method === 'POST' && parts.length === 2 && parts[1] === 'awards') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));

      let awardName = body.awardName;
      let awardDescription: string | null = body.awardDescription ?? null;
      let awardImageUrl: string | null = body.awardImageUrl ?? null;
      if (body.awardDefId) {
        const def = await base44.asServiceRole.entities.MilsimAwardDef.get(body.awardDefId);
        if (def) {
          awardName = awardName ?? def.name;
          awardDescription = awardDescription ?? def.description;
          awardImageUrl = awardImageUrl ?? def.image_url;
        }
      }

      const award = await base44.asServiceRole.entities.MilsimAward.create({
        group_id: parts[0], award_def_id: body.awardDefId ?? null,
        award_name: awardName, award_description: awardDescription, award_image_url: awardImageUrl,
        recipient_roster_id: body.recipientRosterId, recipient_callsign: body.recipientCallsign,
        awarded_by: full.id, reason: body.reason ?? null, award_type: body.awardType ?? null,
      });
      return Response.json(award, { status: 201 });
    }

    // DELETE /milsimAwards/:groupId/awards/:awardId
    if (method === 'DELETE' && parts.length === 3 && parts[1] === 'awards') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimAward.delete(parts[2]);
      return new Response(null, { status: 204 });
    }

    // GET /milsimAwards/mine — all ribbon-type awards for the calling user
    if (method === 'GET' && parts.length === 1 && parts[0] === 'mine') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      // Get roster entries for this user
      const rosters = await base44.asServiceRole.entities.MilsimRoster.filter({ user_id: full.id });
      const rosterIds = rosters.map((r: any) => r.id);
      if (rosterIds.length === 0) return Response.json([]);
      // Get all awards for those roster IDs
      const allAwards: any[] = [];
      for (const rid of rosterIds) {
        const awards = await base44.asServiceRole.entities.MilsimAward.filter({ recipient_roster_id: rid });
        allAwards.push(...awards);
      }
      // Enrich with award def metadata (ribbon colors) and group name
      const enriched = await Promise.all(allAwards.map(async (a: any) => {
        let color1 = null, color2 = null, color3 = null, awardType = 'medal';
        if (a.award_def_id) {
          try {
            const def = await base44.asServiceRole.entities.MilsimAwardDef.get(a.award_def_id);
            if (def) {
              color1 = def.ribbon_color_1 ?? null;
              color2 = def.ribbon_color_2 ?? null;
              color3 = def.ribbon_color_3 ?? null;
              awardType = def.award_type ?? 'medal';
            }
          } catch {}
        }
        let groupName = '';
        if (a.group_id) {
          try {
            const g = await base44.asServiceRole.entities.MilsimGroup.get(a.group_id);
            groupName = g?.name ?? '';
          } catch {}
        }
        // Resolve awarder username
        let awardedByName = a.awarded_by ?? '';
        if (a.awarded_by) {
          try {
            const awarder = await base44.asServiceRole.entities.User.get(a.awarded_by);
            awardedByName = awarder?.username ?? awarder?.full_name ?? a.awarded_by;
          } catch {}
        }
        return { ...a, ribbon_color_1: color1, ribbon_color_2: color2, ribbon_color_3: color3, award_type: awardType, group_name: groupName, awarded_by: awardedByName };
      }));
      return Response.json(enriched);
    }

        return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[milsimAwards]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
