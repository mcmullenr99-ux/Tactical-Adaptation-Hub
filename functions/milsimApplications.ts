import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';
const WEBHOOKS_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/webhooks";

async function fireEvent(groupId: string, event: string, payload: object) {
  try {
    await fetch(`${WEBHOOKS_URL}?path=%2Ffire`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: groupId, event, payload }),
    });
  } catch (_) {}
}

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
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/milsimApplications/, '').split('/').filter(Boolean);
    const method = req.method;

    // GET /milsimApplications/mine
    if (method === 'GET' && parts[0] === 'mine') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const apps = await base44.asServiceRole.entities.MilsimApplication.filter({ applicant_id: full.id });
      return Response.json(apps);
    }

    // GET /milsimApplications/:groupId/applications
    if (method === 'GET' && parts.length === 2 && parts[1] === 'applications') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const apps = await base44.asServiceRole.entities.MilsimApplication.filter({ group_id: parts[0] });
      return Response.json(apps);
    }

    // POST /milsimApplications/:groupId/apply
    if (method === 'POST' && parts.length === 2 && parts[1] === 'apply') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const existing = await base44.asServiceRole.entities.MilsimApplication.filter({ group_id: parts[0], applicant_id: full.id });
      if (existing.length > 0) return Response.json({ error: 'Already applied' }, { status: 409 });

      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group) return Response.json({ error: 'Group not found' }, { status: 404 });

      const body = await req.json().catch(() => ({}));
      const app = await base44.asServiceRole.entities.MilsimApplication.create({
        group_id: parts[0], group_name: group.name,
        applicant_id: full.id, applicant_username: full.username,
        answers: body.answers ?? [], status: 'pending',
      });
      return Response.json(app, { status: 201 });
    }

    // PATCH /milsimApplications/:groupId/applications/:appId
    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'applications') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = { reviewed_by: full.id };
      if (body.status) updates.status = body.status;
      if (body.reviewNote !== undefined) updates.review_note = body.reviewNote;

      const updated = await base44.asServiceRole.entities.MilsimApplication.update(parts[2], updates);

      // If approved, check applicant has a verified email before adding to roster
      if (body.status === 'approved') {
        const app = await base44.asServiceRole.entities.MilsimApplication.get(parts[2]);
        if (app) {
          const applicantUser = await base44.asServiceRole.entities.User.get(app.applicant_id).catch(() => null);
          if (!applicantUser) return Response.json({ error: 'Applicant account not found.' }, { status: 404 });
          if (!applicantUser.email_verified) {
            return Response.json({ error: 'This applicant has not verified their email address. They must verify their email before being added to a roster.' }, { status: 403 });
          }
          await base44.asServiceRole.entities.MilsimRoster.create({
            group_id: parts[0], user_id: app.applicant_id,
            callsign: app.applicant_username,
          });
          await fireEvent(parts[0], "application.approved", {
            applicant_username: app.applicant_username,
            group_id: parts[0],
            application_id: parts[2],
          });
          await fireEvent(parts[0], "roster.member_joined", {
            callsign: app.applicant_username,
            user_id: app.applicant_id,
            group_id: parts[0],
          });
        }
      } else if (body.status === 'rejected') {
        const app2 = await base44.asServiceRole.entities.MilsimApplication.get(parts[2]);
        if (app2) {
          await fireEvent(parts[0], "application.rejected", {
            applicant_username: app2.applicant_username,
            group_id: parts[0],
            application_id: parts[2],
          });
        }
      }

      return Response.json(updated);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[milsimApplications]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
