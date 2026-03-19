import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { stripeStorage } from "../lib/stripeStorage";
import { getUncachableStripeClient, getStripePublishableKey } from "../lib/stripeClient";

const router = Router();

router.get("/stripe/config", async (_req, res): Promise<void> => {
  const publishableKey = await getStripePublishableKey();
  res.json({ publishableKey });
});

router.get("/stripe/products", async (_req, res): Promise<void> => {
  try {
    const rows = await stripeStorage.listProductsWithPrices(true);
    const productsMap = new Map<string, any>();
    for (const row of rows) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          images: row.product_images ?? [],
          metadata: row.product_metadata ?? {},
          prices: [],
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
        });
      }
    }
    res.json({ data: Array.from(productsMap.values()) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/stripe/checkout", requireAuth, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const { priceId, mode = "subscription" } = req.body as { priceId: string; mode?: string };

    if (!priceId) {
      res.status(400).json({ error: "priceId is required" });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;

    let customerId = user.stripeCustomerId as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: { userId: String(user.id) },
      });
      await stripeStorage.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: mode as any,
      success_url: `${baseUrl}/portal/dashboard?payment=success`,
      cancel_url: `${baseUrl}/support`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/stripe/portal", requireAuth, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const stripe = await getUncachableStripeClient();
    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;

    if (!user.stripeCustomerId) {
      res.status(400).json({ error: "No Stripe customer found for this account" });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/portal/dashboard`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stripe/subscription", requireAuth, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user.stripeSubscriptionId) {
      res.json({ subscription: null });
      return;
    }
    const subscription = await stripeStorage.getSubscription(user.stripeSubscriptionId);
    res.json({ subscription });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
