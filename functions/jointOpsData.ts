import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

function cors() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
}
function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors() } });
}

async function getCallerUser(base44: any, req: Request) {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    return await base44.asServiceRole.entities.AppUser.get(payload.sub) ?? null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });

  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'records';

    if (type === 'records') {
      const records = await base44.asServiceRole.entities.GroupCombatRecord.list();
      return json({ records });
    }

    if (type === 'challenges') {
      const challenges = await base44.asServiceRole.entities.JointOpChallenge.list();
      challenges.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
      return json({ challenges });
    }

    if (type === 'ops') {
      const ops = await base44.asServiceRole.entities.JointOp.list();
      ops.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
      return json({ ops });
    }

    if (type === 'groups') {
      // Fetch approved AND featured groups
      const [approved, featured] = await Promise.all([
        base44.asServiceRole.entities.MilsimGroup.filter({ status: 'approved' }),
        base44.asServiceRole.entities.MilsimGroup.filter({ status: 'featured' }),
      ]);
      const seen = new Set<string>();
      const groups = [...approved, ...featured].filter((g: any) => {
        if (seen.has(g.id)) return false;
        seen.add(g.id);
        return true;
      });
      return json({ groups });
    }

    // my-groups: returns groups where caller is owner OR active roster member
    if (type === 'my-groups') {
      const caller = await getCallerUser(base44, req);
      if (!caller) return json({ groups: [] });

      const [ownedApproved, ownedFeatured, rosterEntries] = await Promise.all([
        base44.asServiceRole.entities.MilsimGroup.filter({ owner_id: caller.id, status: 'approved' }),
        base44.asServiceRole.entities.MilsimGroup.filter({ owner_id: caller.id, status: 'featured' }),
        base44.asServiceRole.entities.MilsimRoster.filter({ user_id: caller.id }),
      ]);

      const seen = new Set<string>();
      const groups: any[] = [];

      for (const g of [...ownedApproved, ...ownedFeatured]) {
        if (!seen.has(g.id)) { seen.add(g.id); groups.push(g); }
      }

      // Add groups from active roster memberships
      const activeRoster = (rosterEntries as any[]).filter((r: any) => (r.status ?? 'active').toLowerCase() === 'active');
      await Promise.all(activeRoster.map(async (r: any) => {
        if (seen.has(r.group_id)) return;
        const g = await base44.asServiceRole.entities.MilsimGroup.get(r.group_id).catch(() => null);
        if (g && (g.status === 'approved' || g.status === 'featured')) {
          seen.add(r.group_id);
          groups.push(g);
        }
      }));

      return json({ groups });
    }

    return json({ error: 'Unknown type' }, 400);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
