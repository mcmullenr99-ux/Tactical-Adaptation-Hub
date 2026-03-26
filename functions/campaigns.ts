import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const url = new URL(req.url);
  const path = url.searchParams.get('path') || '';

  try {
    const base44 = createClientFromRequest(req);

    // ── Check Pro ──────────────────────────────────────────────────────────────
    async function checkPro(group_id: string): Promise<boolean> {
      const records = await base44.asServiceRole.entities.CommanderPro.filter({ group_id });
      return records.some((r: any) => r.status === 'active' || r.status === 'trialing');
    }

    // ── GET /list?group_id= ─────────────────────────────────────────────────
    if (req.method === 'GET' && path === 'list') {
      const group_id = url.searchParams.get('group_id');
      if (!group_id) return json({ error: 'group_id required' }, 400);
      if (!await checkPro(group_id)) return json({ error: 'Commander Pro required', code: 'NOT_PRO' }, 403);

      const campaigns = await base44.asServiceRole.entities.MilsimCampaign.filter({ group_id });
      campaigns.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());

      // Enrich each campaign with linked ops and stats
      const enriched = await Promise.all(campaigns.map(async (c: any) => {
        const opIds: string[] = c.op_ids || [];
        let ops: any[] = [];
        if (opIds.length > 0) {
          const allOps = await base44.asServiceRole.entities.MilsimOp.filter({ group_id });
          ops = allOps.filter((o: any) => opIds.includes(o.id));
        }
        const aars = ops.length > 0
          ? await base44.asServiceRole.entities.MilsimAAR.filter({ group_id })
              .then((all: any[]) => all.filter((a: any) => opIds.includes(a.op_id)))
          : [];
        const totalParticipants = aars.reduce((sum: number, a: any) => sum + (a.participants?.length || 0), 0);
        const avgAttendance = aars.length ? Math.round(totalParticipants / aars.length) : 0;
        const victories = aars.filter((a: any) => (a.outcome || '').toLowerCase() === 'victory').length;
        return {
          ...c,
          ops_count: ops.length,
          aars_count: aars.length,
          avg_attendance: avgAttendance,
          win_rate: aars.length ? Math.round((victories / aars.length) * 100) : null,
          ops,
        };
      }));

      return json(enriched);
    }

    // ── POST /create ────────────────────────────────────────────────────────
    if (req.method === 'POST' && path === 'create') {
      const body = await req.json();
      const { group_id } = body;
      if (!group_id) return json({ error: 'group_id required' }, 400);
      if (!await checkPro(group_id)) return json({ error: 'Commander Pro required', code: 'NOT_PRO' }, 403);
      const campaign = await base44.asServiceRole.entities.MilsimCampaign.create(body);
      return json(campaign, 201);
    }

    // ── PATCH /update?id= ───────────────────────────────────────────────────
    if (req.method === 'PATCH' && path === 'update') {
      const id = url.searchParams.get('id');
      if (!id) return json({ error: 'id required' }, 400);
      const body = await req.json();
      const existing = await base44.asServiceRole.entities.MilsimCampaign.get(id);
      if (!existing) return json({ error: 'Not found' }, 404);
      if (!await checkPro(existing.group_id)) return json({ error: 'Commander Pro required', code: 'NOT_PRO' }, 403);
      const updated = await base44.asServiceRole.entities.MilsimCampaign.update(id, body);
      return json(updated);
    }

    // ── DELETE /delete?id= ──────────────────────────────────────────────────
    if (req.method === 'DELETE' && path === 'delete') {
      const id = url.searchParams.get('id');
      if (!id) return json({ error: 'id required' }, 400);
      const existing = await base44.asServiceRole.entities.MilsimCampaign.get(id);
      if (!existing) return json({ error: 'Not found' }, 404);
      if (!await checkPro(existing.group_id)) return json({ error: 'Commander Pro required', code: 'NOT_PRO' }, 403);
      await base44.asServiceRole.entities.MilsimCampaign.delete(id);
      return json({ ok: true });
    }

    // ── GET /ops?group_id= — list available ops to link ────────────────────
    if (req.method === 'GET' && path === 'ops') {
      const group_id = url.searchParams.get('group_id');
      if (!group_id) return json({ error: 'group_id required' }, 400);
      if (!await checkPro(group_id)) return json({ error: 'Commander Pro required', code: 'NOT_PRO' }, 403);
      const ops = await base44.asServiceRole.entities.MilsimOp.filter({ group_id });
      ops.sort((a: any, b: any) => new Date(b.scheduled_at || b.created_date).getTime() - new Date(a.scheduled_at || a.created_date).getTime());
      return json(ops);
    }

    return json({ error: 'Not found' }, 404);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
