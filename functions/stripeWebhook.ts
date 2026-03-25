// Stripe webhook handler — updates CommanderPro entity on subscription events
const APP_ID = '69bf52c997cae5d4cff87ae4';

async function serviceHeaders() {
  const token = Deno.env.get('BASE44_SERVICE_TOKEN');
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

async function upsertProRecord(data: Record<string, any>) {
  const headers = await serviceHeaders();
  // Check existing
  const qRes = await fetch(`https://api.base44.com/api/apps/${APP_ID}/entities/CommanderPro/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ group_id: data.group_id }),
  });
  const q = await qRes.json();
  const existing = (q?.data || [])[0];

  if (existing) {
    await fetch(`https://api.base44.com/api/apps/${APP_ID}/entities/CommanderPro/${existing.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
  } else {
    await fetch(`https://api.base44.com/api/apps/${APP_ID}/entities/CommanderPro`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const body = await req.text();
    let event: any;

    try {
      event = JSON.parse(body);
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const type = event.type;
    const obj = event.data?.object;

    if (type === 'checkout.session.completed' && obj.mode === 'subscription') {
      const meta = obj.metadata || {};
      const subId = obj.subscription;

      // Fetch subscription details from Stripe
      const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
      const sub = await subRes.json();

      await upsertProRecord({
        group_id: meta.group_id,
        group_name: meta.group_name || '',
        owner_id: meta.user_id,
        owner_username: meta.username || '',
        stripe_customer_id: obj.customer,
        stripe_subscription_id: subId,
        stripe_price_id: sub.items?.data?.[0]?.price?.id || '',
        status: sub.status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      });
    }

    if (type === 'customer.subscription.updated' || type === 'customer.subscription.deleted') {
      const meta = obj.metadata || {};
      if (meta.group_id) {
        await upsertProRecord({
          group_id: meta.group_id,
          stripe_subscription_id: obj.id,
          stripe_customer_id: obj.customer,
          stripe_price_id: obj.items?.data?.[0]?.price?.id || '',
          status: obj.status === 'canceled' ? 'cancelled' : obj.status,
          current_period_end: new Date(obj.current_period_end * 1000).toISOString(),
          cancel_at_period_end: obj.cancel_at_period_end,
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
