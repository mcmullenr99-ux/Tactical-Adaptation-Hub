import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const group_id = url.searchParams.get('group_id');
    if (!group_id) return Response.json({ is_pro: false }, { headers: cors() });

    const records = await base44.asServiceRole.entities.CommanderPro.filter({ group_id });
    const active = records.find((r: any) => r.status === 'active' || r.status === 'trialing');
    return Response.json({ is_pro: !!active, status: active?.status ?? null }, { headers: cors() });
  } catch (err) {
    console.error('[getProStatus]', err);
    return Response.json({ is_pro: false }, { headers: cors() });
  }
});
