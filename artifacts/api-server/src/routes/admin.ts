import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

const staffGuard  = [requireAuth, requireRole("moderator", "admin")];
const adminGuard  = [requireAuth, requireRole("admin")];

// ─── Ban rate-limiter (in-memory, per moderator, max 5 bans / 60 s) ──────────
const banLog: Map<number, number[]> = new Map();

function checkBanRateLimit(userId: number): boolean {
  const now = Date.now();
  const window = 60_000;
  const max = 5;
  const hits = (banLog.get(userId) ?? []).filter(t => now - t < window);
  if (hits.length >= max) return false;
  hits.push(now);
  banLog.set(userId, hits);
  return true;
}

// ─── Lockdown helpers ────────────────────────────────────────────────────────

async function getLockdown(): Promise<boolean> {
  const [row] = await db.execute(sql`SELECT value FROM site_settings WHERE key = 'lockdown_mode'`) as any;
  return row?.value === "true";
}

// GET /api/admin/lockdown
router.get("/admin/lockdown", ...staffGuard, async (req, res): Promise<void> => {
  const active = await getLockdown();
  res.json({ active });
});

// PATCH /api/admin/lockdown — admin only
router.patch("/admin/lockdown", ...adminGuard, async (req, res): Promise<void> => {
  const { active } = req.body as { active: boolean };
  await db.execute(sql`
    UPDATE site_settings SET value = ${active ? "true" : "false"} WHERE key = 'lockdown_mode'
  `);
  res.json({ active });
});

// ─── Profile helper ────────────────────────────────────────────────────────────

function toProfile(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    banReason: user.banReason ?? null,
    bannedAt: user.bannedAt ? user.bannedAt.toISOString() : null,
    bio: user.bio ?? null,
    discordTag: user.discordTag ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

// ─── Users ───────────────────────────────────────────────────────────────────

// GET /api/admin/users — mods and admins can list
router.get("/admin/users", ...staffGuard, async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users.map(toProfile));
});

// PATCH /api/admin/users/:id/role — admin only
router.patch("/admin/users/:id/role", ...adminGuard, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { role } = req.body as { role: string };
  const validRoles = ["member", "staff", "moderator", "admin"];
  if (!validRoles.includes(role)) { res.status(400).json({ error: "Invalid role" }); return; }
  const [user] = await db.update(usersTable).set({ role }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(toProfile(user));
});

// PATCH /api/admin/users/:id/ban — mods and admins, with rate limit
router.patch("/admin/users/:id/ban", ...staffGuard, async (req, res): Promise<void> => {
  const actorId = (req.session as any).userId as number;
  const actor   = (req as any).user as typeof usersTable.$inferSelect;
  const id      = parseInt(req.params.id, 10);

  // Fetch target
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }

  // Anti-raid: mods cannot act on admins or other mods
  if (actor.role === "moderator" && (target.role === "admin" || target.role === "moderator")) {
    res.status(403).json({ error: "Moderators cannot ban admins or other moderators" });
    return;
  }

  // Anti-raid: rate limit
  if (!checkBanRateLimit(actorId)) {
    res.status(429).json({ error: "Ban rate limit exceeded. Max 5 bans per 60 seconds." });
    return;
  }

  const { reason } = req.body as { reason?: string };
  const [user] = await db
    .update(usersTable)
    .set({ status: "banned", banReason: reason ?? "TOS Violation", bannedAt: new Date() })
    .where(eq(usersTable.id, id))
    .returning();
  res.json(toProfile(user!));
});

// PATCH /api/admin/users/:id/unban — mods and admins
router.patch("/admin/users/:id/unban", ...staffGuard, async (req, res): Promise<void> => {
  const actor = (req as any).user as typeof usersTable.$inferSelect;
  const id    = parseInt(req.params.id, 10);

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }

  if (actor.role === "moderator" && (target.role === "admin" || target.role === "moderator")) {
    res.status(403).json({ error: "Moderators cannot unban admins or other moderators" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ status: "active", banReason: null, bannedAt: null })
    .where(eq(usersTable.id, id))
    .returning();
  res.json(toProfile(user!));
});

// DELETE /api/admin/users/:id — admin only
router.delete("/admin/users/:id", ...adminGuard, async (req, res): Promise<void> => {
  const adminId = (req.session as any).userId as number;
  const id      = parseInt(req.params.id, 10);
  if (id === adminId) { res.status(400).json({ error: "Cannot delete your own account" }); return; }
  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ success: true });
});

// ─── MilSim Groups ────────────────────────────────────────────────────────────

// GET /api/admin/milsim-groups — mods and admins
router.get("/admin/milsim-groups", ...staffGuard, async (req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT
      g.id, g.name, g.slug, g.status, g.tag_line, g.description,
      g.discord_url, g.website_url, g.logo_url, g.created_at,
      u.id          AS owner_id,
      u.username    AS owner_username,
      u.email       AS owner_email
    FROM milsim_groups g
    LEFT JOIN users u ON g.owner_id = u.id
    ORDER BY g.created_at DESC
  `);
  res.json(rows.rows);
});

// PATCH /api/admin/milsim-groups/:id/status — mods and admins
router.patch("/admin/milsim-groups/:id/status", ...staffGuard, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body as { status: string };
  const validStatuses = ["pending", "approved", "featured", "rejected"];
  if (!validStatuses.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }
  await db.execute(sql`UPDATE milsim_groups SET status = ${status} WHERE id = ${id}`);
  res.json({ success: true });
});

// DELETE /api/admin/milsim-groups/:id — admin only
router.delete("/admin/milsim-groups/:id", ...adminGuard, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.execute(sql`DELETE FROM milsim_groups WHERE id = ${id}`);
  res.json({ success: true });
});

export { getLockdown };
export default router;
