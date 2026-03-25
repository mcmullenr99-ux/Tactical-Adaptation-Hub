import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const MONTHLY_PRICE_ID = 'price_1TEv0BQgAkBXMuJkdH6kMQ6h';
const ANNUAL_PRICE_ID = 'price_1TEv0BQgAkBXMuJkVwLPFhFG';
const SUCCESS_URL = 'https://tacticaladaptationgroup.co.uk/commander-pro?success=true';
const CANCEL_URL = 'https://tacticaladaptationgroup.co.uk/commander-pro?cancelled=true';
const APP_ID = '69bf52c997cae5d4cff87ae4';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const serviceToken = Deno.env.get('BASE44_SERVICE_TOKEN');
    if (!stripeKey) return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 500 });

    const body = await req.json().catch(() => ({}));
    const { group_id, group_name, user_id, username, email, billing } = body;

    if (!group_id || !user_id || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const priceId = billing === 'annual' ? ANNUAL_PRICE_ID : MONTHLY_PRICE_ID;

    // Check if already has a subscription
    const existingRes = await fetch(
      `https://api.base44.com/api/apps/${APP_ID}/entities/CommanderPro/query`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceToken}` },
        body: JSON.stringify({ group_id }),
      }
    );
    const existing = await existingRes.json();
    const activeRecord = (existing?.data || []).find((r: any) => r.status === 'active' || r.status === 'trialing');
    if (activeRecord) {
      return new Response(JSON.stringify({ error: 'Group already has an active Commander Pro subscription' }), { status: 409 });
    }

    // Create Stripe checkout session
    const params = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      customer_email: email,
      success_url: `${SUCCESS_URL}&group_id=${group_id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: CANCEL_URL,
      'metadata[group_id]': group_id,
      'metadata[group_name]': group_name || '',
      'metadata[user_id]': user_id,
      'metadata[username]': username || '',
      'subscription_data[metadata][group_id]': group_id,
      'subscription_data[metadata][user_id]': user_id,
    });

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await res.json();
    if (!res.ok) return new Response(JSON.stringify({ error: session.error?.message }), { status: 400 });

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
