import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';
import bcrypt from 'npm:bcryptjs@2.4.3';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

async function getUserFromRequest(req: Request, base44: any): Promise<any | null> {
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
    const parts = url.pathname.replace(/^\/functions\/authMe/, '').split('/').filter(Boolean);
    const method = req.method;

    const user = await getUserFromRequest(req, base44);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // GET / — return current user
    if (method === 'GET' && parts.length === 0) {
      return Response.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        bio: user.bio ?? null,
        discordTag: user.discord_tag ?? null,
        nationality: user.nationality ?? null,
        totpEnabled: user.totp_enabled ?? false,
        createdAt: user.created_date,
        created_at: user.created_date,
        on_duty_status: user.on_duty_status ?? 'available',
      });
    }

    // DELETE / — delete own account
    if (method === 'DELETE' && parts.length === 0) {
      const body = await req.json().catch(() => ({}));
      if (!body.password) return Response.json({ error: 'Password required to delete account' }, { status: 400 });
      const valid = await bcrypt.compare(body.password, user.password_hash ?? '');
      if (!valid) return Response.json({ error: 'Incorrect password' }, { status: 400 });
      await base44.asServiceRole.entities.User.delete(user.id);
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[authMe]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
