import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

async function getCallerUser(base44: any, req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    const user = await base44.asServiceRole.entities.User.get(payload.sub);
    return user ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
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
      const users = await base44.asServiceRole.entities.User.list();
      return Response.json(users.map((u: any) => ({
        id: u.id, username: u.username, email: u.email, role: u.role, status: u.status,
        bio: u.bio ?? null, discordTag: u.discord_tag ?? null, createdAt: u.created_date,
      })));
    }

    // GET /admin/users/:id
    if (method === 'GET' && parts[0] === 'users' && parts.length === 2) {
      if (!isMod) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const user = await base44.asServiceRole.entities.User.get(parts[1]);
      if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
      return Response.json({ id: user.id, username: user.username, email: user.email, role: user.role, status: user.status });
    }

    // PATCH /admin/users/:id/role — admin only
    if (method === 'PATCH' && parts[0] === 'users' && parts[2] === 'role') {
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const validRoles = ['member', 'staff', 'moderator', 'admin'];
      if (!validRoles.includes(body.role)) return Response.json({ error: 'Invalid role' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.User.update(parts[1], { role: body.role });
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
      const updated = await base44.asServiceRole.entities.User.update(parts[1], updates);
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
      const updated = await base44.asServiceRole.entities.User.update(parts[1], { status: 'banned', ban_reason: body.reason ?? null });
      return Response.json(updated);
    }

    // PATCH /admin/users/:id/unban — mod+
    if (method === 'PATCH' && parts[0] === 'users' && parts[2] === 'unban') {
      if (!isMod) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const updated = await base44.asServiceRole.entities.User.update(parts[1], { status: 'active', ban_reason: null });
      return Response.json(updated);
    }

    // DELETE /admin/users/:id — admin
    if (method === 'DELETE' && parts[0] === 'users' && parts.length === 2) {
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.User.delete(parts[1]);
      return new Response(null, { status: 204 });
    }

    // GET /admin/reset-tokens — mod+
    if (method === 'GET' && parts[0] === 'reset-tokens') {
      if (!isMod) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const tokens = await base44.asServiceRole.entities.PasswordResetToken.list();
      const unused = tokens.filter((t: any) => !t.used && new Date(t.expires_at) > new Date());
      // Enrich with user info
      const enriched = await Promise.all(unused.map(async (t: any) => {
        const user = await base44.asServiceRole.entities.User.get(t.user_id).catch(() => null);
        return { ...t, username: user?.username ?? 'Unknown', email: user?.email ?? '' };
      }));
      return Response.json(enriched);
    }

    // POST /admin/reset-tokens — generate a reset token for a user (mod+)
    if (method === 'POST' && parts[0] === 'reset-tokens') {
      if (!isMod) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      if (!body.userId) return Response.json({ error: 'userId required' }, { status: 400 });
      // Expire any existing unused tokens for this user
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

    // POST /admin/broadcast — admin only — creates a MOTD/site-wide notice
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
        user_id: full.id, username: full.username,
        action_type: body.active ? 'LOCKDOWN_ON' : 'LOCKDOWN_OFF',
        description: `Lockdown ${body.active ? 'activated' : 'deactivated'} by ${full.username}`,
      });
      return Response.json({ active: body.active });
    }

    // GET /admin/milsim-groups — all groups
    if (method === 'GET' && parts[0] === 'milsim-groups') {
      if (!isMod) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const groups = await base44.asServiceRole.entities.MilsimGroup.list();
      return Response.json(groups);
    }

    // PATCH /admin/milsim-groups/:id/status
    if (method === 'PATCH' && parts[0] === 'milsim-groups' && parts[2] === 'status') {
      if (!isMod) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const updated = await base44.asServiceRole.entities.MilsimGroup.update(parts[1], { status: body.status });
      return Response.json(updated);
    }

    // DELETE /admin/milsim-groups/:id
    if (method === 'DELETE' && parts[0] === 'milsim-groups' && parts.length === 2) {
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await base44.asServiceRole.entities.MilsimGroup.delete(parts[1]);
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[admin]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
