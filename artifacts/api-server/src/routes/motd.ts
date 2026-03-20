import { Router, type IRouter } from "express";
import { sql as rawSql } from "drizzle-orm";
import { db } from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

// Ensure columns exist (idempotent migration)
export async function ensureMotdColumns() {
  await db.execute(rawSql`ALTER TABLE motd ADD COLUMN IF NOT EXISTS title TEXT`);
  await db.execute(rawSql`ALTER TABLE motd ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'info'`);
  await db.execute(rawSql`ALTER TABLE motd ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`);
}

router.get("/motd/active", async (req, res): Promise<void> => {
  const result = await db.execute(rawSql`
    SELECT m.*, u.username as author
    FROM motd m
    LEFT JOIN users u ON u.id = m.created_by
    WHERE m.is_active = true
      AND (m.expires_at IS NULL OR m.expires_at > NOW())
    ORDER BY m.created_at DESC
    LIMIT 1
  `);
  res.json(result.rows[0] ?? null);
});

router.get("/motd", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const result = await db.execute(rawSql`
    SELECT m.*, u.username as author
    FROM motd m
    LEFT JOIN users u ON u.id = m.created_by
    ORDER BY m.created_at DESC
    LIMIT 20
  `);
  res.json(result.rows);
});

router.post("/motd", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const { title, content, type = "info", expires_at } = req.body as any;
  if (!content?.trim()) { res.status(400).json({ error: "content required" }); return; }
  await db.execute(rawSql`UPDATE motd SET is_active = false`);
  const result = await db.execute(rawSql`
    INSERT INTO motd (title, content, type, expires_at, created_by, is_active)
    VALUES (${title?.trim() ?? null}, ${content.trim()}, ${type}, ${expires_at ?? null}, ${userId}, true)
    RETURNING *
  `);
  res.status(201).json(result.rows[0]);
});

router.delete("/motd/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.execute(rawSql`DELETE FROM motd WHERE id = ${id}`);
  res.sendStatus(204);
});

router.patch("/motd/:id/activate", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.execute(rawSql`UPDATE motd SET is_active = false`);
  await db.execute(rawSql`UPDATE motd SET is_active = true WHERE id = ${id}`);
  res.sendStatus(204);
});

export default router;
