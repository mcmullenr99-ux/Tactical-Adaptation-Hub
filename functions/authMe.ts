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

    return Response.json({
      id: full.id,
      username: full.username,
      email: full.email,
      role: full.role,
      status: full.status,
      bio: full.bio ?? null,
      discordTag: full.discord_tag ?? null,
      nationality: full.nationality ?? null,
      totpEnabled: full.totp_enabled ?? false,
      createdAt: full.created_date,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
