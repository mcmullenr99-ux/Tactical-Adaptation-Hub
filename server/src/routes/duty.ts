import { Router, type IRouter } from "express";
import { sql as rawSql } from "drizzle-orm";
import { db } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

const VALID_STATUSES = ["available", "deployed", "on-leave", "mia"];

router.patch("/duty-status", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const { status } = req.body as any;
  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    return;
  }
  await db.execute(rawSql`UPDATE users SET on_duty_status = ${status} WHERE id = ${userId}`);
  res.json({ on_duty_status: status });
});

router.patch("/referral-code/generate", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const user = (req as any).user;
  const code = (user.username as string).toUpperCase().slice(0, 6) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  let final = code;
  const existing = await db.execute(rawSql`SELECT id FROM users WHERE referral_code = ${code}`);
  if (existing.rows.length > 0) {
    final = code + Math.random().toString(36).slice(2, 4).toUpperCase();
  }
  await db.execute(rawSql`UPDATE users SET referral_code = ${final} WHERE id = ${userId}`);
  res.json({ referral_code: final });
});

router.get("/referral-code/mine", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const result = await db.execute(rawSql`SELECT referral_code FROM users WHERE id = ${userId}`);
  res.json({ referral_code: (result.rows[0] as any)?.referral_code ?? null });
});

router.get("/referral-code/recruits", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const result = await db.execute(rawSql`
    SELECT id, username, created_at FROM users WHERE referred_by_id = ${userId} ORDER BY created_at DESC
  `);
  res.json(result.rows);
});

export default router;
