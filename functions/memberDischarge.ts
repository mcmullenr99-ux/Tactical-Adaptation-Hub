// Standalone endpoint: GET ?path=/:groupId — returns caller's own discharge records for a group
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

async function getCallerUser(base44: any, req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    const user = await base44.asServiceRole.entities.AppUser.get(payload.sub);
    return user ?? null;
  } catch (e: any) {
    console.log('[memberDischarge] auth error:', e.message);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path') ?? '';
    const parts = pathOverride.split('/').filter(Boolean);

    if (req.method === 'GET' && parts.length === 1) {
      const caller = await getCallerUser(base44, req);
      if (!caller) return json({ error: 'Unauthorized' }, 401);

      const groupId = parts[0];
      const all = await base44.asServiceRole.entities.MilsimDischarge.filter({ group_id: groupId });

      // Match by user_id OR callsign (case-insensitive fallback)
      const mine = all.filter((d: any) =>
        d.user_id === caller.id ||
        (d.callsign ?? '').toLowerCase() === (caller.username ?? '').toLowerCase()
      );

      return json(mine);
    }

    return json({ error: 'Not found' }, 404);
  } catch (e: any) {
    console.error('[memberDischarge] error:', e.message);
    return json({ error: e.message }, 500);
  }
});
