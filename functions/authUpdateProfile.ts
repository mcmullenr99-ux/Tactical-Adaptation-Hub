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
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/authUpdateProfile/, '').split('/').filter(Boolean);

    const full = await getCallerUser(base44, req);
    if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // POST /auth/upload-avatar — multipart form upload
    if (req.method === 'POST' && parts.includes('upload-avatar')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) return Response.json({ error: 'File exceeds 5MB limit' }, { status: 400 });

      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowed.includes(file.type)) return Response.json({ error: 'Invalid file type' }, { status: 400 });

      // Upload to Base44 storage
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const ext = file.type.split('/')[1] ?? 'jpg';
      const filename = `avatars/${full.id}-${Date.now()}.${ext}`;

      // Store as base64 data URL for now (Base44 doesn't expose raw storage here)
      // We'll use a data URL approach via the SDK's file upload
      const base64 = btoa(String.fromCharCode(...bytes));
      const dataUrl = `data:${file.type};base64,${base64}`;

      await base44.asServiceRole.entities.User.update(full.id, { avatar_url: dataUrl });
      return Response.json({ avatar_url: dataUrl });
    }

    // PATCH — update profile fields
    if (req.method === 'PATCH') {
      const body = await req.json().catch(() => ({}));
      const { bio, discordTag, nationality, currentPassword, newPassword } = body;

      const updates: Record<string, any> = {};
      if (bio !== undefined) updates.bio = bio;
      if (discordTag !== undefined) updates.discord_tag = discordTag;
      if (nationality !== undefined) updates.nationality = nationality;

      if (newPassword) {
        if (!currentPassword) return Response.json({ error: 'Current password required' }, { status: 400 });
        const bcrypt = await import('npm:bcryptjs@2.4.3');
        const valid = await bcrypt.compare(currentPassword, full.password_hash ?? '');
        if (!valid) return Response.json({ error: 'Current password is incorrect' }, { status: 400 });
        if (newPassword.length < 8) return Response.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
        updates.password_hash = await bcrypt.hash(newPassword, 10);
      }

      const updated = await base44.asServiceRole.entities.User.update(full.id, updates);

      return Response.json({
        id: updated.id,
        username: updated.username,
        email: updated.email,
        role: updated.role,
        status: updated.status,
        bio: updated.bio ?? null,
        discordTag: updated.discord_tag ?? null,
        nationality: updated.nationality ?? null,
        avatar_url: updated.avatar_url ?? null,
        totpEnabled: updated.totp_enabled ?? false,
      });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
