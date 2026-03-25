import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const MONTHLY_PRICE_ID = 'price_1TEv5xQgAkBXMuJkXoprXgSV';
const ANNUAL_PRICE_ID  = 'price_1TEv5yQgAkBXMuJk8rp1b2UQ';
const SUCCESS_URL = 'https://tacticaladaptationgroup.co.uk/commander-pro?success=true';
const CANCEL_URL  = 'https://tacticaladaptationgroup.co.uk/commander-pro?cancelled=true';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return json({ error: 'Stripe not configured' }, 500);

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { group_id, billing } = body;

    if (!group_id) return json({ error: 'group_id required' }, 400);

    // Load group
    const group = await base44.asServiceRole.entities.MilsimGroup.get(group_id);
    if (!group) return json({ error: 'Group not found' }, 404);

    const priceId = billing === 'annual' ? ANNUAL_PRICE_ID : MONTHLY_PRICE_ID;

    // Check if existing Stripe customer
    const existing = await base44.asServiceRole.entities.CommanderPro.filter({ group_id });
    let customerId: string | undefined;
    if (existing.length > 0 && existing[0].stripe_customer_id && !existing[0].stripe_customer_id.startsWith('dev_')) {
      customerId = existing[0].stripe_customer_id;
    }

    const params = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      'metadata[group_id]': group_id,
      'metadata[group_name]': group.name || '',
      'metadata[owner_id]': group.owner_id || '',
    });

    if (customerId) {
      params.set('customer', customerId);
    } else if (group.owner_id) {
      // Try to find user email
      try {
        const users = await base44.asServiceRole.entities.User.filter({ id: group.owner_id });
        if (users.length > 0 && users[0].email) {
          params.set('customer_email', users[0].email);
        }
      } catch { /* noop */ }
    }

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await res.json();
    if (!res.ok) return json({ error: session.error?.message || 'Stripe error' }, 500);

    return json({ url: session.url });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});

function cors() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }; }
function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors() } });
}
