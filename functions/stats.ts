import { createClient, createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/stats/, '').split('/').filter(Boolean);
    const method = req.method;

    // GET /stats/public
    if (method === 'GET' && parts[0] === 'public') {
      const [users, groups, ops, awards, aars] = await Promise.all([
        base44.asServiceRole.entities.User.list(),
        base44.asServiceRole.entities.MilsimGroup.list(),
        base44.asServiceRole.entities.MilsimOp.list(),
        base44.asServiceRole.entities.MilsimAward.list(),
        base44.asServiceRole.entities.MilsimAAR.list(),
      ]);

      const activeMembers = users.filter((u: any) => u.status === 'active').length;
      const completedOps = ops.filter((o: any) => o.status === 'completed').length;
      const oldest = users.sort((a: any, b: any) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime())[0];
      const founded = oldest ? new Date(oldest.created_date).getFullYear() : new Date().getFullYear();

      return Response.json({
        active_members: activeMembers,
        milsim_groups: groups.length,
        ops_completed: completedOps,
        awards_given: awards.length,
        aars_filed: aars.length,
        founded_year: founded,
        years_active: new Date().getFullYear() - founded,
      });
    }

    // GET /stats/readiness/:groupId
    if (method === 'GET' && parts[0] === 'readiness' && parts.length === 2) {
      const groupId = parts[1];
      const [roster, ops, aars] = await Promise.all([
        base44.asServiceRole.entities.MilsimRoster.filter({ group_id: groupId }),
        base44.asServiceRole.entities.MilsimOp.filter({ group_id: groupId }),
        base44.asServiceRole.entities.MilsimAAR.filter({ group_id: groupId }),
      ]);

      const completedOps = ops.filter((o: any) => o.status === 'completed').length;
      const totalOps = ops.length;
      const wins = aars.filter((a: any) => a.outcome === 'victory').length;
      const winRate = aars.length > 0 ? Math.round((wins / aars.length) * 100) : 0;

      return Response.json({
        total_members: roster.length,
        total_ops: totalOps,
        completed_ops: completedOps,
        total_aars: aars.length,
        win_rate: winRate,
      });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[stats]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
