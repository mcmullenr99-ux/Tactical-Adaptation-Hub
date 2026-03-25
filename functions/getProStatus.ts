import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const group_id = url.searchParams.get('group_id');

    if (!group_id) {
      return new Response(JSON.stringify({ error: 'group_id required' }), { status: 400 });
    }

    const records = await base44.asServiceRole.entities.CommanderPro.filter({ group_id });
    const active = records.find((r: any) => r.status === 'active' || r.status === 'trialing');

    return new Response(JSON.stringify({
      is_pro: !!active,
      status: active?.status || 'inactive',
      current_period_end: active?.current_period_end || null,
      cancel_at_period_end: active?.cancel_at_period_end || false,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
