import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    }
  });

  const base44 = createClientFromRequest(req);
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname; // e.g. /promotionEngine or /promotionFlags

  // Determine entity from the function name context via path param or referer
  // We use the path query param for sub-routing, OR the function URL itself
  // The frontend hits /api/promotion-rules → resolves to FUNCTIONS_BASE/promotionEngine?path=...
  // But since apiFetch strips /api/promotion-rules prefix, the ?path= may be empty.
  // We detect entity type from the Referer or a custom header — simplest: use a type query param
  // Actually the route map sends /api/promotion-rules → promotionEngine with no sub-path
  // and /api/promotion-flags → promotionEngine with no sub-path.
  // We need to differentiate — use URL search params

  const isFlags = url.searchParams.has('group_id') && url.href.includes('promotion-flags') ||
                  url.searchParams.has('flag') ||
                  req.headers.get('x-entity') === 'flags';

  // Better: check referer or use a dedicated ?entity= param
  // Since apiFetch maps both /api/promotion-rules and /api/promotion-flags to this function,
  // but strips the prefix differently, we need another signal.
  // The apiFetch resolveUrl does: path.slice(bestPrefix.length) as subPath
  // /api/promotion-rules → bestPrefix=/api/promotion-rules → subPath="" → no ?path=
  // So we can't tell them apart from the URL alone.
  //
  // Solution: check the original path from the request URL path segment
  // The function is always at /functions/promotionEngine — so we read from a custom header
  // that apiFetch should set, OR we just handle both and let the caller pass ?entity=rules|flags

  // Simplest reliable approach: caller passes ?entity=rules or ?entity=flags
  const entity = url.searchParams.get('entity') ?? 'rules';
  const entityName = entity === 'flags' ? 'PromotionFlag' : 'PromotionRule';
  const db = base44.asServiceRole.entities as any;

  try {
    // GET — list by group_id
    if (method === 'GET') {
      const groupId = url.searchParams.get('group_id');
      const status = url.searchParams.get('status');
      const id = url.searchParams.get('id');

      if (id) {
        const record = await db[entityName].get(id);
        return Response.json(record ?? null);
      }

      if (!groupId) return Response.json({ error: 'group_id required' }, { status: 400 });
      const filter: any = { group_id: groupId };
      if (status) filter.status = status;
      const records = await db[entityName].filter(filter);
      return Response.json(records ?? []);
    }

    // POST — create
    if (method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const record = await db[entityName].create(body);
      return Response.json(record, { status: 201 });
    }

    // PUT — update by ?id=
    if (method === 'PUT') {
      const id = url.searchParams.get('id');
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      const body = await req.json().catch(() => ({}));
      const record = await db[entityName].update(id, body);
      return Response.json(record);
    }

    // DELETE — delete by ?id=
    if (method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      await db[entityName].delete(id);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });

  } catch (e: any) {
    console.error('[promotionEngine] error:', e);
    return Response.json({ error: e.message ?? 'Internal error' }, { status: 500 });
  }
});
