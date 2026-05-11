// v3 — SDK asServiceRole for uploads (handles platform auth internally)
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

async function getCallerUser(base44: any, req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  let token: string | null = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    const cookieHeader = req.headers.get('cookie') ?? '';
    const match = cookieHeader.match(/(?:^|;\s*)tag_auth_token=([^;]+)/);
    if (match) token = decodeURIComponent(match[1]);
  }
  if (!token) return { user: null, rawToken: null };
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    const user = await base44.asServiceRole.entities.AppUser.get(payload.sub) ?? null;
    return { user, rawToken: token };
  } catch { return { user: null, rawToken: null }; }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  }});
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path') ?? '';
    const parts = pathOverride.split('/').filter(Boolean);
    const method = req.method;

    // ── IMAGE UPLOAD ─────────────────────────────────────────────────────────
    if (method === 'POST' && pathOverride === 'upload') {
      const { user } = await getCallerUser(base44, req);
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });

      const formData = await req.formData().catch(() => null);
      const file = formData?.get('file') as File | null;
      if (!file) return new Response(JSON.stringify({ error: 'No file' }), { status: 400, headers: cors });

      // SDK asServiceRole handles platform auth internally — no manual token needed
      let fileUrl: string | null = null;
      try {
        const result = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        fileUrl = result?.file_url ?? result?.url ?? null;
        console.log('[rankReorder] SDK upload result:', JSON.stringify(result));
      } catch (sdkErr: any) {
        console.error('[rankReorder] SDK upload failed:', sdkErr?.message ?? sdkErr);
        return new Response(JSON.stringify({ error: 'Upload failed: ' + (sdkErr?.message ?? 'SDK error') }), { status: 500, headers: cors });
      }

      if (!fileUrl) return new Response(JSON.stringify({ error: 'Upload returned no URL' }), { status: 500, headers: cors });

      // Normalise internal URL → public CDN URL
      const internalMatch = fileUrl.match(/\/api\/apps\/([^\/]+)\/files\/mp\/public\/([^\/]+)\/(.+)$/);
      if (internalMatch) fileUrl = `https://media.base44.com/images/public/${internalMatch[2]}/${internalMatch[3]}`;

      return new Response(JSON.stringify({ url: fileUrl }), { status: 200, headers: cors });
    }

    if (parts.length < 3) return new Response(JSON.stringify({ error: 'Bad path' }), { status: 400, headers: cors });

    const groupId = parts[0];
    const section = parts[1];
    const target  = parts[2];

    const { user: full } = await getCallerUser(base44, req);
    if (!full) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });

    const group = await base44.asServiceRole.entities.MilsimGroup.get(groupId);
    if (!group) return new Response(JSON.stringify({ error: 'Group not found' }), { status: 404, headers: cors });
    const isOwner = group.owner_id === full.id || full.role === 'admin';

    if (!isOwner) {
      const rosters = await base44.asServiceRole.entities.MilsimRoster.filter({ group_id: groupId, user_id: full.id });
      const roster = rosters[0];
      if (!roster) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      const hqPerms = roster.hq_permissions ?? {};
      if (!['manage'].includes(hqPerms['troops'] ?? 'none')) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: cors });
      }
    }

    // ── RANK ICON UPDATE ─────────────────────────────────────────────────────
    if (method === 'PATCH' && section === 'ranks' && target && target !== 'reorder') {
      const body = await req.json().catch(() => ({}));
      const patch: Record<string, any> = {};
      if (body.icon_url !== undefined) patch.icon_url = body.icon_url;
      if (body.name !== undefined) patch.name = body.name;
      if (body.abbreviation !== undefined) patch.abbreviation = body.abbreviation;
      if (body.tier !== undefined) patch.tier = body.tier;
      const updated = await base44.asServiceRole.entities.MilsimRank.update(target, patch);
      return new Response(JSON.stringify(updated), { status: 200, headers: cors });
    }

    // ── RANK REORDER ─────────────────────────────────────────────────────────
    if (method === 'PATCH' && section === 'ranks' && target === 'reorder') {
      const body = await req.json().catch(() => ({}));
      const updates = Array.isArray(body.order) ? body.order : [];
      await Promise.all(updates.map((u: any) =>
        base44.asServiceRole.entities.MilsimRank.update(u.id, { sort_order: u.sort_order })
      ));
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
    }

    // ── ROLE REORDER ─────────────────────────────────────────────────────────
    if (method === 'PATCH' && section === 'roles' && target === 'reorder') {
      const body = await req.json().catch(() => ({}));
      const updates = Array.isArray(body.order) ? body.order : [];
      await Promise.all(updates.map((u: any) =>
        base44.asServiceRole.entities.MilsimRole.update(u.id, { sort_order: u.sort_order })
      ));
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
    }

    // ── ROLE SLOT UPDATE ─────────────────────────────────────────────────────
    if (method === 'PATCH' && section === 'roles' && target !== 'reorder') {
      const body = await req.json().catch(() => ({}));
      const patch: Record<string, any> = {};
      if (body.slot_status !== undefined) patch.slot_status = body.slot_status;
      if (body.slots_total !== undefined) patch.slots_total = body.slots_total != null ? parseInt(String(body.slots_total)) : null;
      if (body.slots_filled !== undefined) patch.slots_filled = body.slots_filled != null ? parseInt(String(body.slots_filled)) : null;
      if (body.publicly_visible !== undefined) patch.publicly_visible = body.publicly_visible;
      if (body.name !== undefined) patch.name = body.name;
      if (body.description !== undefined) patch.description = body.description;
      if (body.sort_order !== undefined) patch.sort_order = body.sort_order;
      const updated = await base44.asServiceRole.entities.MilsimRole.update(target, patch);
      return new Response(JSON.stringify(updated), { status: 200, headers: cors });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: cors });

  } catch (err: any) {
    console.error('[rankReorder]', err);
    return new Response(JSON.stringify({ error: err?.message ?? 'Internal error' }), { status: 500, headers: cors });
  }
});
