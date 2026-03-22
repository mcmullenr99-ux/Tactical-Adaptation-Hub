import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

async function getCallerUser(base44: any, req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    return await base44.asServiceRole.entities.User.get(payload.sub) ?? null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const parts = url.pathname.replace(/^\/functions\/security/, '').split('/').filter(Boolean);
    const method = req.method;

    const full = await getCallerUser(base44, req);
    if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['moderator', 'admin'].includes(full.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // GET /security/audit-logs
    if (method === 'GET' && parts[0] === 'audit-logs') {
      const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 200);
      const all = await base44.asServiceRole.entities.AuditLog.list();
      const sorted = all.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
      return Response.json(sorted.slice(0, limit));
    }

    // GET /security/incidents
    if (method === 'GET' && parts[0] === 'incidents') {
      const incidents = await base44.asServiceRole.entities.SecurityIncident.list();
      return Response.json(incidents.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
    }

    // POST /security/incidents
    if (method === 'POST' && parts[0] === 'incidents') {
      const body = await req.json().catch(() => ({}));
      const incident = await base44.asServiceRole.entities.SecurityIncident.create({
        incident_type: body.incidentType, severity: body.severity ?? 'low',
        user_id: body.userId ?? null, username: body.username ?? null,
        ip: body.ip ?? null, description: body.description,
        evidence: body.evidence ?? null, resolved: false,
      });
      return Response.json(incident, { status: 201 });
    }

    // PATCH /security/incidents/:id/resolve
    if (method === 'PATCH' && parts.length === 3 && parts[0] === 'incidents' && parts[2] === 'resolve') {
      const body = await req.json().catch(() => ({}));
      const updated = await base44.asServiceRole.entities.SecurityIncident.update(parts[1], {
        resolved: true, resolved_by: full.id, resolution_note: body.note ?? null,
      });
      return Response.json(updated);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[security]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
