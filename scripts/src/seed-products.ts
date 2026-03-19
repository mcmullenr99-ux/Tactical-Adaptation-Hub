import { getUncachableStripeClient } from './stripeClient';

/**
 * TAG Stripe Product Seed Script
 *
 * Creates supporter subscription tiers and donation products in Stripe.
 * Safe to run multiple times — checks for existing products first.
 *
 * Run with: pnpm --filter @workspace/scripts exec tsx src/seed-products.ts
 */
async function seedProducts() {
  const stripe = await getUncachableStripeClient();
  console.log('Seeding TAG Stripe products...\n');

  // ── TAG Supporter Subscription ──────────────────────────────────────────
  const existingSub = await stripe.products.search({ query: "name:'TAG Supporter' AND active:'true'" });

  let supporterProduct: any;
  if (existingSub.data.length > 0) {
    supporterProduct = existingSub.data[0];
    console.log(`TAG Supporter already exists: ${supporterProduct.id}`);
  } else {
    supporterProduct = await stripe.products.create({
      name: 'TAG Supporter',
      description: 'Support the TAG community. Your contribution keeps the servers running and the community growing.',
      metadata: { type: 'subscription' },
    });
    console.log(`Created product: ${supporterProduct.name} (${supporterProduct.id})`);

    const monthly = await stripe.prices.create({
      product: supporterProduct.id,
      unit_amount: 499,
      currency: 'gbp',
      recurring: { interval: 'month' },
      nickname: 'Monthly',
    });
    console.log(`  Monthly price: £4.99/mo (${monthly.id})`);

    const annual = await stripe.prices.create({
      product: supporterProduct.id,
      unit_amount: 4999,
      currency: 'gbp',
      recurring: { interval: 'year' },
      nickname: 'Annual',
    });
    console.log(`  Annual price: £49.99/yr (${annual.id})`);
  }

  // ── One-Time Donation ────────────────────────────────────────────────────
  const existingDonation = await stripe.products.search({ query: "name:'TAG Donation' AND active:'true'" });

  if (existingDonation.data.length > 0) {
    console.log(`\nTAG Donation already exists: ${existingDonation.data[0].id}`);
  } else {
    const donationProduct = await stripe.products.create({
      name: 'TAG Donation',
      description: 'One-time donation to support the TAG community.',
      metadata: { type: 'donation' },
    });
    console.log(`\nCreated product: ${donationProduct.name} (${donationProduct.id})`);

    for (const [label, amount] of [['£5', 500], ['£10', 1000], ['£25', 2500]] as const) {
      const price = await stripe.prices.create({
        product: donationProduct.id,
        unit_amount: amount,
        currency: 'gbp',
        nickname: label,
      });
      console.log(`  Donation price: ${label} (${price.id})`);
    }
  }

  console.log('\n✓ Products seeded. Webhooks will sync data to your local database.');
}

seedProducts().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
