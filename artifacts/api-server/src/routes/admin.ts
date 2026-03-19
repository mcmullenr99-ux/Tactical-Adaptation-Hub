import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

const adminGuard = [requireAuth, requireRole("admin")];

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

router.get("/admin/users", ...adminGuard, async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users.map(toProfile));
});

router.patch("/admin/users/:id/role", ...adminGuard, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { role } = req.body as { role: string };
  const validRoles = ["member", "staff", "moderator", "admin"];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }
  const [user] = await db.update(usersTable).set({ role }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(toProfile(user));
});

router.patch("/admin/users/:id/ban", ...adminGuard, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { reason } = req.body as { reason?: string };
  const [user] = await db
    .update(usersTable)
    .set({ status: "banned", banReason: reason ?? "TOS Violation", bannedAt: new Date() })
    .where(eq(usersTable.id, id))
    .returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(toProfile(user));
});

router.patch("/admin/users/:id/unban", ...adminGuard, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [user] = await db
    .update(usersTable)
    .set({ status: "active", banReason: null, bannedAt: null })
    .where(eq(usersTable.id, id))
    .returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(toProfile(user));
});

router.delete("/admin/users/:id", ...adminGuard, async (req, res): Promise<void> => {
  const adminId = (req.session as any).userId;
  const id = parseInt(req.params.id, 10);
  if (id === adminId) {
    res.status(400).json({ error: "You cannot delete your own account" });
    return;
  }
  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ success: true });
});

// ─── MilSim Groups ────────────────────────────────────────────────────────────

router.get("/admin/milsim-groups", ...adminGuard, async (req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT
      g.id, g.name, g.slug, g.status, g.tag_line, g.description,
      g.discord_url, g.website_url, g.logo_url, g.created_at,
      u.id   AS owner_id,
      u.username AS owner_username,
      u.email    AS owner_email
    FROM milsim_groups g
    LEFT JOIN users u ON g.owner_id = u.id
    ORDER BY g.created_at DESC
  `);
  res.json(rows.rows);
});

router.patch("/admin/milsim-groups/:id/status", ...adminGuard, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body as { status: string };
  const validStatuses = ["pending", "approved", "featured", "rejected"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  const [row] = await db.execute(sql`
    UPDATE milsim_groups SET status = ${status} WHERE id = ${id} RETURNING *
  `) as any;
  res.json({ success: true, group: row });
});

router.delete("/admin/milsim-groups/:id", ...adminGuard, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.execute(sql`DELETE FROM milsim_groups WHERE id = ${id}`);
  res.json({ success: true });
});

export default router;
