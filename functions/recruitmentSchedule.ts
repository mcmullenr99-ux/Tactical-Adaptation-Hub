import { createClientFromRequest, createClient } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';
const APP_ID = '69bf52c997cae5d4cff87ae4';
const API_KEY = Deno.env.get('BASE44_API_KEY') ?? '';

async function getCallerUser(base44: any, req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    return await base44.asServiceRole.entities.AppUser.get(payload.sub) ?? null;
  } catch { return null; }
}

async function isProGroup(base44: any, groupId: string): Promise<boolean> {
  try {
    const records = await base44.asServiceRole.entities.CommanderPro.filter({ group_id: groupId });
    return records.some((r: any) => r.status === 'active' || r.stripe_customer_id === 'manual_override');
  } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path') ?? '';
    const parts = pathOverride.split('/').filter(Boolean);
    const method = req.method;

    // ── CRON TRIGGER ──────────────────────────────────────────────────
    // POST /recruitmentSchedule?path=cron  (called by automation, no auth)
    if (method === 'POST' && parts[0] === 'cron') {
      const serviceClient = createClient({ appId: APP_ID, apiKey: API_KEY });
      const schedules = await serviceClient.asServiceRole.entities.RecruitmentSchedule.filter({ status: 'active' });
      const now = Date.now();
      let fired = 0;

      for (const sched of schedules) {
        const intervalMs = (sched.interval_hours ?? 48) * 60 * 60 * 1000;
        const lastPosted = sched.last_posted_at ? new Date(sched.last_posted_at).getTime() : 0;
        if (now - lastPosted < intervalMs) continue;

        // Verify group still has Pro
        const pro = await isProGroup(serviceClient, sched.group_id);
        if (!pro) {
          await serviceClient.asServiceRole.entities.RecruitmentSchedule.update(sched.id, { status: 'paused' });
          continue;
        }

        // Build body with looking_for appended if present
        const fullBody = sched.looking_for
          ? `${sched.body}\n\n---\n**Looking for:** ${sched.looking_for}`
          : sched.body;

        // Build social links block
        const links = [
          sched.discord_url ? `Discord: ${sched.discord_url}` : null,
          sched.youtube_url ? `YouTube: ${sched.youtube_url}` : null,
          sched.twitch_url ? `Twitch: ${sched.twitch_url}` : null,
          sched.steam_url ? `Steam: ${sched.steam_url}` : null,
          sched.website_url ? `Website: ${sched.website_url}` : null,
        ].filter(Boolean);
        const bodyWithLinks = links.length > 0 ? `${fullBody}\n\n${links.join(' | ')}` : fullBody;

        await serviceClient.asServiceRole.entities.Post.create({
          user_id: sched.owner_id,
          username: sched.group_name ?? 'Unit',
          user_role: 'admin',
          category: 'recruitment',
          milsim_group_id: sched.group_id,
          title: sched.title,
          body: bodyWithLinks,
          image_url: sched.image_url ?? null,
          pinned: false,
          reactions: {},
          comment_count: 0,
        });

        // Update last_posted_at + increment count
        await serviceClient.asServiceRole.entities.RecruitmentSchedule.update(sched.id, {
          last_posted_at: new Date().toISOString(),
          post_count: (sched.post_count ?? 0) + 1,
        });

        fired++;
      }

      return Response.json({ ok: true, fired, total_active: schedules.length });
    }

    // All other routes require auth
    const caller = await getCallerUser(base44, req);
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // ── GET /recruitmentSchedule?path=&group_id=xxx  — get schedule for group ──
    if (method === 'GET' && parts.length === 0) {
      const groupId = url.searchParams.get('group_id');
      if (!groupId) return Response.json({ error: 'group_id required' }, { status: 400 });

      const schedules = await base44.asServiceRole.entities.RecruitmentSchedule.filter({ group_id: groupId });
      const sched = schedules[0] ?? null;
      return Response.json({ schedule: sched });
    }

    // ── POST /recruitmentSchedule  — create or update schedule ──
    if (method === 'POST' && parts.length === 0) {
      const body = await req.json();
      const {
        group_id, title, body: postBody, looking_for,
        image_url, video_url,
        discord_url, youtube_url, twitch_url, steam_url, website_url,
        tags, min_age, timezone,
        interval_hours,
      } = body;
      if (!group_id || !title || !postBody) return Response.json({ error: 'group_id, title and body required' }, { status: 400 });

      const pro = await isProGroup(base44, group_id);
      if (!pro) return Response.json({ error: 'Commander Pro required for recruitment scheduling' }, { status: 403 });

      const groups = await base44.asServiceRole.entities.MilsimGroup.filter({ id: group_id });
      const group = groups[0];

      const fields = {
        title, body: postBody,
        looking_for: looking_for ?? null,
        image_url: image_url ?? null,
        video_url: video_url ?? null,
        discord_url: discord_url ?? null,
        youtube_url: youtube_url ?? null,
        twitch_url: twitch_url ?? null,
        steam_url: steam_url ?? null,
        website_url: website_url ?? null,
        tags: tags ?? [],
        min_age: min_age ?? null,
        timezone: timezone ?? null,
        interval_hours: interval_hours ?? 48,
        status: 'active',
      };

      const existing = await base44.asServiceRole.entities.RecruitmentSchedule.filter({ group_id });
      if (existing.length > 0) {
        const updated = await base44.asServiceRole.entities.RecruitmentSchedule.update(existing[0].id, fields);
        return Response.json({ schedule: updated });
      } else {
        const created = await base44.asServiceRole.entities.RecruitmentSchedule.create({
          group_id,
          group_name: group?.name ?? 'Unit',
          owner_id: caller.id,
          ...fields,
          last_posted_at: null,
          post_count: 0,
        });
        return Response.json({ schedule: created });
      }
    }

    // ── PATCH /recruitmentSchedule?path=:id/status  — pause / resume ──
    if (method === 'PATCH' && parts.length === 2 && parts[1] === 'status') {
      const schedId = parts[0];
      const body = await req.json();
      const updated = await base44.asServiceRole.entities.RecruitmentSchedule.update(schedId, {
        status: body.status,
      });
      return Response.json({ schedule: updated });
    }

    // ── DELETE /recruitmentSchedule?path=:id  — delete schedule ──
    if (method === 'DELETE' && parts.length === 1) {
      await base44.asServiceRole.entities.RecruitmentSchedule.delete(parts[0]);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });

  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
});
