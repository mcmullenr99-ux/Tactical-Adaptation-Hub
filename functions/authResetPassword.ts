import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const { token, newPassword } = await req.json().catch(() => ({}));
    if (!token || !newPassword) return Response.json({ error: 'Token and new password required' }, { status: 400 });
    if (newPassword.length < 8) return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

    const tokens = await base44.asServiceRole.entities.PasswordResetToken.filter({ token });
    const rec = tokens[0];
    if (!rec) return Response.json({ error: 'Invalid or expired token' }, { status: 400 });
    if (rec.used) return Response.json({ error: 'Token already used' }, { status: 400 });
    if (new Date(rec.expires_at) < new Date()) return Response.json({ error: 'Token expired' }, { status: 400 });

    const password_hash = await bcrypt.hash(newPassword, 10);
    await base44.asServiceRole.entities.AppUser.update(rec.user_id, { password_hash });
    await base44.asServiceRole.entities.PasswordResetToken.update(rec.id, { used: true });

    return Response.json({ message: 'Password reset successfully' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
