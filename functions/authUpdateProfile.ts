import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const fullUsers = await base44.asServiceRole.entities.User.filter({ email: user.email });
    const full = fullUsers[0];
    if (!full) return Response.json({ error: 'User not found' }, { status: 404 });

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
      totpEnabled: updated.totp_enabled ?? false,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
