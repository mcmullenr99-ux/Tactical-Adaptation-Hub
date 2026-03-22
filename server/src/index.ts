import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./lib/stripeClient";
import app from "./app";
import { db, usersTable, pool } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { ensureMotdColumns } from "./routes/motd";
import { ensureAwardDefsTable } from "./routes/milsim";

async function seedAdmin() {
  try {
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, "mcmullenr99@gmail.com"));
    if (existing) return;

    const hash = await bcrypt.hash("TempAccess2026!", 12);
    await db.insert(usersTable).values({
      username: "SunrayActual",
      email: "mcmullenr99@gmail.com",
      passwordHash: hash,
      role: "admin",
    });
    console.log("[startup] Admin account seeded in this environment");
  } catch (err: any) {
    console.error("[startup] Admin seed error (non-fatal):", err.message);
  }
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("DATABASE_URL not set — skipping Stripe init");
    return;
  }
  try {
    console.log("Initializing Stripe schema...");
    await runMigrations({ databaseUrl, schema: "stripe" });
    console.log("Stripe schema ready");

    const stripeSync = await getStripeSync();

    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
    console.log("Stripe webhook configured");

    stripeSync.syncBackfill()
      .then(() => console.log("Stripe backfill complete"))
      .catch((err: any) => console.error("Stripe backfill error:", err.message));
  } catch (err: any) {
    console.error("Stripe init error (non-fatal):", err.message);
  }
}

(async () => {
  const rawPort = process.env["PORT"];
  if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");

  const port = Number(rawPort);
  if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

  await seedAdmin();
  await ensureMotdColumns().catch((e: any) => console.error("[startup] motd column migration:", e.message));
  await ensureAwardDefsTable().catch((e: any) => console.error("[startup] award-defs migration:", e.message));
  await initStripe();

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
})();
