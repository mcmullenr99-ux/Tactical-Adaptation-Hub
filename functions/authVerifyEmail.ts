import { createClient } from 'npm:@base44/sdk@0.8.21';

const APP_URL = (Deno.env.get('APP_URL') ?? 'https://tacticaladaptationgroup.co.uk').replace(/\/+$/, '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID')!, serviceToken: Deno.env.get('BASE44_SERVICE_TOKEN')! });
    const url = new URL(req.url);

    let token: string | null = url.searchParams.get('token');
    if (!token && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      token = body.token ?? null;
    }

    if (!token)
      return Response.json({ error: 'Verification token is required' }, { status: 400 });

    const users = await base44.entities.User.filter({ email_verify_token: token });
    const user  = users[0];

    if (!user)
      return Response.json({ error: 'Invalid or already used verification link.' }, { status: 404 });

    if (user.email_verify_expires && new Date(user.email_verify_expires) < new Date())
      return Response.json({ error: 'Verification link has expired. Please request a new one.' }, { status: 410 });

    await base44.entities.User.update(user.id, {
      email_verified: true,
      status: 'active',
      email_verify_token: null,
      email_verify_expires: null,
    });

    if (req.method === 'GET') {
      return Response.redirect(`${APP_URL}/portal/dashboard?verified=1`, 302);
    }

    return Response.json({ success: true, message: 'Email verified. Account is now active.' });

  } catch (error: any) {
    console.error('[authVerifyEmail]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
