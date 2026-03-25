import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url    = new URL(req.url);

    // Token comes from query param (?token=...) for GET (link click)
    // or from POST body for programmatic calls
    let token: string | null = url.searchParams.get('token');
    if (!token && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      token = body.token ?? null;
    }

    if (!token)
      return Response.json({ error: 'Verification token is required' }, { status: 400 });

    // Find the user with this token
    const users = await base44.asServiceRole.entities.User.filter({ email_verify_token: token });
    const user  = users[0];

    if (!user)
      return Response.json({ error: 'Invalid or already used verification link.' }, { status: 404 });

    // Check expiry
    if (user.email_verify_expires && new Date(user.email_verify_expires) < new Date())
      return Response.json({ error: 'Verification link has expired. Please request a new one.' }, { status: 410 });

    // Mark verified — clear the token, set status to active
    await base44.asServiceRole.entities.User.update(user.id, {
      email_verified: true,
      status: 'active',
      email_verify_token: null,
      email_verify_expires: null,
    });

    // If request was a GET (link click), redirect to portal with success param
    if (req.method === 'GET') {
      const appUrl = Deno.env.get('APP_URL') ?? 'https://tacticaladaptationgroup.co.uk';
      return Response.redirect(`${appUrl}/portal/dashboard?verified=1`, 302);
    }

    return Response.json({ success: true, message: 'Email verified. Account is now active.' });

  } catch (error: any) {
    console.error('[authVerifyEmail]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
