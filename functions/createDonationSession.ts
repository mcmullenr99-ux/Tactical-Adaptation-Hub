import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const STRIPE_PRICE_ID = 'price_1TEupJQgAkBXMuJkCabK2W1k';
const SUCCESS_URL = 'https://tacticaladaptationgroup.co.uk/donate?success=true';
const CANCEL_URL = 'https://tacticaladaptationgroup.co.uk/donate?cancelled=true';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 500 });

    const body = await req.json().catch(() => ({}));
    const amount = body.amount_gbp ? Math.round(body.amount_gbp * 100) : null;

    const params = new URLSearchParams({
      mode: 'payment',
      submit_type: 'donate',
      'line_items[0][price]': STRIPE_PRICE_ID,
      'line_items[0][quantity]': '1',
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      currency: 'gbp',
    });

    if (amount) {
      params.set('line_items[0][price_data][currency]', 'gbp');
      params.set('line_items[0][price_data][product_data][name]', 'TAG Donation');
      params.set('line_items[0][price_data][unit_amount]', String(amount));
      params.delete('line_items[0][price]');
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
    if (!res.ok) return new Response(JSON.stringify({ error: session.error?.message }), { status: 400 });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
