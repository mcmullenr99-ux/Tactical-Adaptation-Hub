import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const BASE44_APP_ID = '69bf52c997cae5d4cff87ae4';

function serviceHeaders() {
  const token = Deno.env.get('BASE44_SERVICE_TOKEN') || '';
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function cors() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, stripe-signature' };
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors() } });
}

// Minimal Stripe webhook signature verification (HMAC-SHA256)
async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  try {
    const parts = sigHeader.split(',');
    const tPart = parts.find(p => p.startsWith('t='));
    const v1Part = parts.find(p => p.startsWith('v1='));
    if (!tPart || !v1Part) return false;
    const timestamp = tPart.slice(2);
    const signature = v1Part.slice(3);
    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    return computed === signature;
  } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!webhookSecret) return json({ error: 'Webhook secret not configured' }, 500);

  const payload = await req.text();
  const sigHeader = req.headers.get('stripe-signature') || '';

  const valid = await verifyStripeSignature(payload, sigHeader, webhookSecret);
  if (!valid) return json({ error: 'Invalid signature' }, 400);

  const event = JSON.parse(payload);
  const base44 = createClientFromRequest(req);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const group_id = session.metadata?.group_id;
        const group_name = session.metadata?.group_name || '';
        const owner_id = session.metadata?.owner_id || '';
        const customer_id = session.customer;
        const subscription_id = session.subscription;

        if (!group_id) break;

        // Get subscription details for period end
        let period_end: string | undefined;
        let price_id: string | undefined;
        try {
          const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscription_id}`, {
            headers: { Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}` }
          });
          const sub = await subRes.json();
          period_end = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined;
          price_id = sub.items?.data?.[0]?.price?.id;
        } catch { /* noop */ }

        // Upsert CommanderPro record
        const existing = await base44.asServiceRole.entities.CommanderPro.filter({ group_id });
        const proData = {
          group_id,
          group_name,
          owner_id,
          stripe_customer_id: customer_id,
          stripe_subscription_id: subscription_id,
          stripe_price_id: price_id || '',
          status: 'active',
          current_period_end: period_end || '',
          cancel_at_period_end: false,
        };

        if (existing.length > 0) {
          await base44.asServiceRole.entities.CommanderPro.update(existing[0].id, proData);
        } else {
          await base44.asServiceRole.entities.CommanderPro.create(proData);
        }
        console.log(`✅ Commander Pro activated for group ${group_id}`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const group_id = sub.metadata?.group_id;
        if (!group_id) break;

        const period_end = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : '';
        const existing = await base44.asServiceRole.entities.CommanderPro.filter({ group_id });
        if (existing.length > 0) {
          await base44.asServiceRole.entities.CommanderPro.update(existing[0].id, {
            status: sub.status,
            current_period_end: period_end,
            cancel_at_period_end: sub.cancel_at_period_end || false,
            stripe_price_id: sub.items?.data?.[0]?.price?.id || existing[0].stripe_price_id,
          });
        }
        console.log(`✅ Subscription updated for group ${group_id} — status: ${sub.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const group_id = sub.metadata?.group_id;
        if (!group_id) break;

        const existing = await base44.asServiceRole.entities.CommanderPro.filter({ group_id });
        if (existing.length > 0) {
          await base44.asServiceRole.entities.CommanderPro.update(existing[0].id, {
            status: 'cancelled',
            cancel_at_period_end: false,
          });
        }
        console.log(`❌ Subscription cancelled for group ${group_id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customer_id = invoice.customer;
        // Find by customer ID
        const existing = await base44.asServiceRole.entities.CommanderPro.filter({ stripe_customer_id: customer_id });
        if (existing.length > 0) {
          await base44.asServiceRole.entities.CommanderPro.update(existing[0].id, { status: 'past_due' });
        }
        console.log(`⚠️ Payment failed for customer ${customer_id}`);
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return json({ received: true });
  } catch (e: any) {
    console.error('Webhook handler error:', e.message);
    return json({ error: e.message }, 500);
  }
});
