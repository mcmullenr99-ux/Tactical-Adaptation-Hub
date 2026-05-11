// admin.ts v5 — strip TAG JWT from SDK init to fix asServiceRole 403
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';
import bcrypt from 'npm:bcryptjs@2.4.3';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

// Strip Authorization header so SDK doesn't try to use our TAG JWT as a Base44 session
// (which causes 403 "app is private" and breaks asServiceRole)
function makeCleanRequest(req: Request): Request {
  const headers = new Headers(req.headers);
  headers.delete('Authorization');
  headers.delete('authorization');
  return new Request(req.url, { method: req.method, headers });
}

async function getCallerUser(base44: any, req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    const results = await base44.asServiceRole.entities.AppUser.filter({ id: payload.sub });
    return results[0] ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    // Use clean request (no Authorization) so asServiceRole initialises properly
    const base44 = createClientFromRequest(makeCleanRequest(req));
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/admin/, '').split('/').filter(Boolean);
    const method = req.method;

    const full = await getCallerUser(base44, req);
    if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const isMod = ['moderator', 'admin'].includes(full.role);
    const isAdmin = full.role === 'admin';

    // GET /admin/users — mod+
    if (method === 'GET' && parts[0] === 'users' && parts.length === 1) {
      if (!isMod) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const users = await base44.asServiceRole.entities.AppUser.filter({ status: ["active","suspended","banned","pending_verification"] }, { limit: 500 });
      return Response.json(users.map((u: any) => ({
        id: u.id, username: u.username, email: u.email, role: u.role, status: u.status,
        email_verified: u.email_verified ?? false, bio: u.bio ?? null, discordTag: u.discord_tag ?? null, createdAt: u.created_date,
      })));
    }

    // GET /admin/users/:id
    if (method === 'GET' && parts[0] === 'users' && parts.length === 2) {
      if (!isMod) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const userRes = await base44.asServiceRole.entities.AppUser.filter({ id: parts[1] });
      const user = userRes[0] ?? null;
      if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
      return Response.json({ id: user.id, username: user.username, email: user.email, role: user.role, status: user.status });
    }

    // PATCH /admin/users/:id/role — admin only
    if (method === 'PATCH' && parts[0] === 'users' && parts[2] === 'role') {
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const validRoles = ['member', 'staff', 'moderator', 'admin'];
      if (!validRoles.includes(body.role)) return Response.json({ error: 'Invalid role' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.AppUser.update(parts[1], { role: body.role });
      await base44.asServiceRole.entities.AuditLog.create({
        user_id: full.id, username: full.username, action_type: 'ROLE_CHANGE',
        target_table: 'User', target_id: parts[1],
        description: `${full.username} changed role of user ${parts[1]} to ${body.role}`,
      });
      return Response.json(updated);
    }

    // PATCH /admin/users/:id/status — mod+
    if (method === 'PATCH' && parts[0] === 'users' && parts[2] === 'status') {
      if (!isMod) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const validStatuses = ['active', 'suspended', 'banned'];
      if (!validStatuses.includes(body.status)) return Response.json({ error: 'Invalid status' }, { status: 400 });
      const updates: Record<string, any> = { status: body.status };
      if (body.banReason) updates.ban_reason = body.banReason;
      const updated = await base44.asServiceRole.entities.AppUser.update(parts[1], updates);
      await base44.asServiceRole.entities.AuditLog.create({
        user_id: full.id, username: full.username, action_type: 'STATUS_CHANGE',
        target_table: 'User', target_id: parts[1],
        description: `${full.username} changed status of user ${parts[1]} to ${body.status}`,
      });
      return Response.json(updated);
    }

    // PATCH /admin/users/:id/ban — mod+
    if (method === 'PATCH' && parts[0] === 'users' && parts[2] === 'ban') {
      if (!isMod) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updated = await base44.asServiceRole.entities.AppUser.update(parts[1], { status: 'banned', ban_reason: body.reason ?? null });
      return Response.json(updated);
    }

    // PATCH /admin/users/:id/unban — mod+
    if (method === 'PATCH' && parts[0] === 'users' && parts[2] === 'unban') {
      if (!isMod) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const updated = await base44.asServiceRole.entities.AppUser.update(parts[1], { status: 'active', ban_reason: null });
      return Response.json(updated);
    }

    // DELETE /admin/users/:id — admin
    if (method === 'DELETE' && parts[0] === 'users' && parts.length === 2) {
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.AppUser.delete(parts[1]);
      return new Response(null, { status: 204 });
    }

    // POST /admin/users/:id/force-verify — admin: manually verify email & activate account
    if (method === 'POST' && parts[0] === 'users' && parts[2] === 'force-verify') {
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const updated = await base44.asServiceRole.entities.AppUser.update(parts[1], {
        email_verified: true,
        status: 'active',
        email_verify_token: null,
        email_verify_expires: null,
      });
      return Response.json(updated);
    }

    // GET /admin/reset-tokens — mod+
    if (method === 'GET' && parts[0] === 'reset-tokens') {
      if (!isMod) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const tokens = await base44.asServiceRole.entities.PasswordResetToken.list();
      const unused = tokens.filter((t: any) => !t.used && new Date(t.expires_at) > new Date());
      const enriched = await Promise.all(unused.map(async (t: any) => {
        const userRes2 = await base44.asServiceRole.entities.AppUser.filter({ id: t.user_id }).catch(() => []);
        const user = userRes2[0] ?? null;
        return { ...t, username: user?.username ?? 'Unknown', email: user?.email ?? '' };
      }));
      return Response.json(enriched);
    }

    // POST /admin/reset-tokens — generate a reset token for a user (mod+)
    if (method === 'POST' && parts[0] === 'reset-tokens') {
      if (!isMod) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      if (!body.userId) return Response.json({ error: 'userId required' }, { status: 400 });
      const existing = await base44.asServiceRole.entities.PasswordResetToken.filter({ user_id: body.userId, used: false });
      for (const t of existing) {
        await base44.asServiceRole.entities.PasswordResetToken.update(t.id, { used: true });
      }
      const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const rec = await base44.asServiceRole.entities.PasswordResetToken.create({
        user_id: body.userId, token, expires_at: expiresAt, used: false,
      });
      return Response.json({ token: rec.token, expiresAt: rec.expires_at });
    }

    // POST /admin/broadcast — admin only
    if (method === 'POST' && parts[0] === 'broadcast') {
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      if (!body.title || !body.content) return Response.json({ error: 'title and content required' }, { status: 400 });
      const motd = await base44.asServiceRole.entities.Motd.create({
        title: body.title,
        content: body.content,
        active: true,
        priority: body.priority ?? 'info',
        author_id: full.id,
        author_username: full.username,
        expires_at: body.expiresAt ?? null,
      });
      await base44.asServiceRole.entities.AuditLog.create({
        user_id: full.id, username: full.username, action_type: 'BROADCAST',
        description: `${full.username} broadcast: ${body.title}`,
      });
      return Response.json(motd, { status: 201 });
    }

    // GET /admin/lockdown
    if (method === 'GET' && parts[0] === 'lockdown') {
      if (!isMod) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const settings = await base44.asServiceRole.entities.SiteSetting.filter({ key: 'lockdown_mode' });
      return Response.json({ active: settings[0]?.value === 'true' });
    }

    // PATCH /admin/lockdown — admin
    if (method === 'PATCH' && parts[0] === 'lockdown') {
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const settings = await base44.asServiceRole.entities.SiteSetting.filter({ key: 'lockdown_mode' });
      if (settings[0]) {
        await base44.asServiceRole.entities.SiteSetting.update(settings[0].id, { value: body.active ? 'true' : 'false' });
      } else {
        await base44.asServiceRole.entities.SiteSetting.create({ key: 'lockdown_mode', value: body.active ? 'true' : 'false' });
      }
      await base44.asServiceRole.entities.AuditLog.create({
        user_id: full.id, username: full.username, action_type: 'LOCKDOWN_TOGGLE',
        description: `${full.username} set lockdown to ${body.active}`,
      });
      return Response.json({ active: body.active });
    }

    // GET /admin/milsim-groups — all groups
    if (method === 'GET' && parts[0] === 'milsim-groups') {
      if (!isMod) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const groups = await base44.asServiceRole.entities.MilsimGroup.filter({ status: ["approved","pending","suspended","rejected"] }, { limit: 500 });
      return Response.json(Array.isArray(groups) ? groups : []);
    }

    // PATCH /admin/milsim-groups/:id/status
    if (method === 'PATCH' && parts[0] === 'milsim-groups' && parts[2] === 'status') {
      if (!isMod) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if ('status' in body) updates.status = body.status;
      if ('featured_requested' in body) updates.featured_requested = body.featured_requested;
      const updated = await base44.asServiceRole.entities.MilsimGroup.update(parts[1], updates);
      return Response.json(updated);
    }

    // PATCH /admin/milsim-groups/:id — general field update
    if (method === 'PATCH' && parts[0] === 'milsim-groups' && parts.length === 2) {
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const allowed = ['verify_override', 'is_verified', 'verified_at', 'status', 'visibility', 'featured_requested'];
      const updates: Record<string, any> = {};
      for (const key of allowed) { if (key in body) updates[key] = body[key]; }
      const updated = await base44.asServiceRole.entities.MilsimGroup.update(parts[1], updates);
      return Response.json(updated);
    }

    // DELETE /admin/milsim-groups/:id — cascade delete
    if (method === 'DELETE' && parts[0] === 'milsim-groups' && parts.length === 2) {
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const gid = parts[1];
      try {
        const childEntities = [
          'MilsimRole','MilsimRank','MilsimRoster','MilsimAppQuestion','MilsimApplication',
          'MilsimOp','MilsimAAR','MilsimBriefing','MilsimAward','MilsimAwardDef',
          'Qualification','QualificationGrant','MilsimLOA','MilsimCampaign',
          'MilsimWarno','MilsimLace','MilsimSitrep','MilsimTrainingReview',
          'MilsimConductReport','DutyRoster','GroupChannel','GroupMessage',
          'WebhookEndpoint','MilsimApiKey','MilsimDischarge','PromotionRule',
          'PromotionFlag','RoleFitnessReview','PerformanceImprovementOrder',
          'RoleExpectation','IntelDocument','ThreatProfile','MilsimOrderMemo',
          'MilsimRangeCard','SaluteReport','LoadoutKit','GameServer',
          'GroupCombatRecord','TrainingDoc',
        ];
        for (const entity of childEntities) {
          try {
            const records = await (base44.asServiceRole.entities as any)[entity]?.filter({ group_id: gid }) ?? [];
            await Promise.allSettled(records.map((r: any) => (base44.asServiceRole.entities as any)[entity].delete(r.id)));
          } catch {}
        }
        await base44.asServiceRole.entities.MilsimGroup.delete(gid);
        return new Response(null, { status: 204 });
      } catch (err: any) {
        console.error('[admin] group delete failed:', err);
        return Response.json({ error: err.message ?? 'Delete failed' }, { status: 500 });
      }
    }

    // POST /admin/users/create — admin: manually create a user account
    if (method === 'POST' && parts[0] === 'users' && parts[1] === 'create') {
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const { username, email, password, role } = body;
      if (!username || !email || !password) return Response.json({ error: 'username, email and password required' }, { status: 400 });
      const dupeCheck = await base44.asServiceRole.entities.AppUser.filter({ email });
      if (dupeCheck.length > 0) return Response.json({ error: 'Email already registered' }, { status: 409 });
      const dupeUser = await base44.asServiceRole.entities.AppUser.filter({ username });
      if (dupeUser.length > 0) return Response.json({ error: 'Username already taken' }, { status: 409 });
      const password_hash = await bcrypt.hash(password, 10);
      const newUser = await base44.asServiceRole.entities.AppUser.create({
        username, email, password_hash,
        role: role ?? 'member',
        status: 'active',
        email_verified: true,
        login_count: 0,
      });
      await base44.asServiceRole.entities.AuditLog.create({
        user_id: full.id, username: full.username, action_type: 'USER_CREATE',
        target_table: 'AppUser', target_id: newUser.id,
        description: `${full.username} manually created account for ${username}`,
      });
      return Response.json({ id: newUser.id, username: newUser.username, email: newUser.email }, { status: 201 });
    }

    return Response.json({ error: 'Not Found' }, { status: 404 });
  } catch (err: any) {
    console.error('[admin] unhandled error:', err);
    return Response.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
});
