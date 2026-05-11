import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const BASE44_APP_ID = '69bf52c997cae5d4cff87ae4';

function cors() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, stripe-signature' };
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors() } });
}

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

// Guard: never let the webhook touch a manual_override record
function isManualOverride(record: any): boolean {
  return record?.stripe_customer_id === 'manual_override' ||
         record?.stripe_subscription_id === 'manual_override';
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

        const existing = await base44.asServiceRole.entities.CommanderPro.filter({ group_id });

        // GUARD: never overwrite a manual_override record
        if (existing.length > 0 && isManualOverride(existing[0])) {
          console.log(`⚠️ Skipping checkout update for group ${group_id} — manual_override record protected`);
          break;
        }

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

        const existing = await base44.asServiceRole.entities.CommanderPro.filter({ group_id });
        if (existing.length === 0) break;

        // GUARD: never overwrite a manual_override record
        if (isManualOverride(existing[0])) {
          console.log(`⚠️ Skipping subscription update for group ${group_id} — manual_override record protected`);
          break;
        }

        const period_end = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : '';

        // Only update to a degraded status if the subscription is truly gone
        // Map Stripe statuses safely — don't downgrade active to incomplete/trialing noise
        const SAFE_STATUSES = ['active', 'past_due', 'cancelled', 'unpaid'];
        const newStatus = SAFE_STATUSES.includes(sub.status) ? sub.status : existing[0].status;

        await base44.asServiceRole.entities.CommanderPro.update(existing[0].id, {
          status: newStatus,
          current_period_end: period_end,
          cancel_at_period_end: sub.cancel_at_period_end || false,
          stripe_price_id: sub.items?.data?.[0]?.price?.id || existing[0].stripe_price_id,
        });
        console.log(`✅ Subscription updated for group ${group_id} — status: ${newStatus}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const group_id = sub.metadata?.group_id;
        if (!group_id) break;

        const existing = await base44.asServiceRole.entities.CommanderPro.filter({ group_id });
        if (existing.length === 0) break;

        // GUARD: never cancel a manual_override record
        if (isManualOverride(existing[0])) {
          console.log(`⚠️ Skipping cancellation for group ${group_id} — manual_override record protected`);
          break;
        }

        await base44.asServiceRole.entities.CommanderPro.update(existing[0].id, {
          status: 'cancelled',
          cancel_at_period_end: false,
        });
        console.log(`❌ Subscription cancelled for group ${group_id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customer_id = invoice.customer;
        const existing = await base44.asServiceRole.entities.CommanderPro.filter({ stripe_customer_id: customer_id });
        if (existing.length === 0) break;

        // GUARD: never touch manual_override
        if (isManualOverride(existing[0])) {
          console.log(`⚠️ Skipping payment_failed for manual_override record`);
          break;
        }

        await base44.asServiceRole.entities.CommanderPro.update(existing[0].id, { status: 'past_due' });
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
