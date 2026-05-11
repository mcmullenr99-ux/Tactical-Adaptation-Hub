import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const path = url.searchParams.get('path') ?? '';
    const group_id = url.searchParams.get('group_id') ?? '';

    // GET — list all servers for a group
    if (req.method === 'GET' && !path) {
      if (!group_id) return Response.json({ error: 'group_id required' }, { status: 400, headers: cors() });
      const servers = await base44.asServiceRole.entities.GameServer.filter({ group_id });
      return Response.json(servers, { headers: cors() });
    }

    // POST — create
    if (req.method === 'POST' && !path) {
      const body = await req.json();
      const server = await base44.asServiceRole.entities.GameServer.create(body);
      return Response.json(server, { headers: cors() });
    }

    // PUT /:id — update
    if (req.method === 'PUT' && path) {
      const id = path.replace(/^\//, '');
      const body = await req.json();
      const server = await base44.asServiceRole.entities.GameServer.update(id, body);
      return Response.json(server, { headers: cors() });
    }

    // DELETE /:id — delete
    if (req.method === 'DELETE' && path) {
      const id = path.replace(/^\//, '');
      await base44.asServiceRole.entities.GameServer.delete(id);
      return Response.json({ ok: true }, { headers: cors() });
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers: cors() });
  } catch (err: any) {
    console.error('[gameServers]', err);
    return Response.json({ error: err.message ?? 'Server error' }, { status: 500, headers: cors() });
  }
});
