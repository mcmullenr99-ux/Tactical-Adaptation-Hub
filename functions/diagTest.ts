import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const [list_all, filter_member, filter_admin] = await Promise.all([
      base44.asServiceRole.entities.AppUser.list({ limit: 5 }).catch((e: any) => ({ error: e.message })),
      base44.asServiceRole.entities.AppUser.filter({ role: 'member' }).catch((e: any) => ({ error: e.message })),
      base44.asServiceRole.entities.AppUser.filter({ role: 'admin' }).catch((e: any) => ({ error: e.message })),
    ]);
    return Response.json({
      list_count: Array.isArray(list_all) ? list_all.length : list_all,
      filter_member_count: Array.isArray(filter_member) ? filter_member.length : filter_member,
      filter_admin_count: Array.isArray(filter_admin) ? filter_admin.length : filter_admin,
      filter_admin_sample: Array.isArray(filter_admin) ? filter_admin[0]?.username : null,
    });
  } catch (err: any) {
    return Response.json({ fatal: err.message });
  }
});