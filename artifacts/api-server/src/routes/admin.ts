import { Router, type IRouter } from "express";
import { db, pool, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { logAudit, buildAuditFromReq } from "../lib/audit";

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
  try {
    const { rows } = await pool.query("SELECT value FROM site_settings WHERE key = 'lockdown_mode'");
    return rows[0]?.value === "true";
  } catch {
    return false;
  }
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
  const actor = (req as any).user;
  await logAudit(buildAuditFromReq(req, {
    actionType: active ? "LOCKDOWN_ON" : "LOCKDOWN_OFF",
    description: `Lockdown ${active ? "activated" : "deactivated"} by ${actor.username}`,
  }));
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

  const [before] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!before) { res.status(404).json({ error: "User not found" }); return; }

  const [user] = await db.update(usersTable).set({ role }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const actor = (req as any).user;
  await logAudit(buildAuditFromReq(req, {
    actionType: "ROLE_CHANGE",
    targetTable: "users",
    targetId: id,
    description: `${actor.username} changed role of ${before.username} from ${before.role} to ${role}`,
    oldSnapshot: toProfile(before),
    newSnapshot: toProfile(user),
  }));

  res.json(toProfile(user));
});

// PATCH /api/admin/users/:id/ban — mods and admins, with rate limit
router.patch("/admin/users/:id/ban", ...staffGuard, async (req, res): Promise<void> => {
  const actorId = (req.session as any).userId as number;
  const actor   = (req as any).user as typeof usersTable.$inferSelect;
  const id      = parseInt(req.params.id, 10);

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }

  if (actor.role === "moderator" && (target.role === "admin" || target.role === "moderator")) {
    res.status(403).json({ error: "Moderators cannot ban admins or other moderators" });
    return;
  }

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

  await logAudit(buildAuditFromReq(req, {
    actionType: "BAN",
    targetTable: "users",
    targetId: id,
    description: `${actor.username} banned ${target.username}. Reason: ${reason ?? "TOS Violation"}`,
    oldSnapshot: toProfile(target),
    newSnapshot: toProfile(user!),
  }));

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

  await logAudit(buildAuditFromReq(req, {
    actionType: "UNBAN",
    targetTable: "users",
    targetId: id,
    description: `${actor.username} unbanned ${target.username}`,
    oldSnapshot: toProfile(target),
    newSnapshot: toProfile(user!),
  }));

  res.json(toProfile(user!));
});

// DELETE /api/admin/users/:id — admin only
router.delete("/admin/users/:id", ...adminGuard, async (req, res): Promise<void> => {
  const adminId = (req.session as any).userId as number;
  const actor   = (req as any).user as typeof usersTable.$inferSelect;
  const id      = parseInt(req.params.id, 10);
  if (id === adminId) { res.status(400).json({ error: "Cannot delete your own account" }); return; }

  const [before] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!before) { res.status(404).json({ error: "User not found" }); return; }

  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "User not found" }); return; }

  await logAudit(buildAuditFromReq(req, {
    actionType: "DELETE",
    targetTable: "users",
    targetId: id,
    description: `${actor.username} deleted account ${before.username} (${before.email})`,
    oldSnapshot: toProfile(before),
  }));

  res.json({ success: true });
});

// ─── MilSim Groups ────────────────────────────────────────────────────────────

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

router.patch("/admin/milsim-groups/:id/status", ...staffGuard, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body as { status: string };
  const validStatuses = ["pending", "approved", "featured", "rejected"];
  if (!validStatuses.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }

  const [before] = await db.execute(sql`SELECT * FROM milsim_groups WHERE id = ${id}`) as any;
  await db.execute(sql`UPDATE milsim_groups SET status = ${status} WHERE id = ${id}`);
  const actor = (req as any).user;

  await logAudit(buildAuditFromReq(req, {
    actionType: "UPDATE",
    targetTable: "milsim_groups",
    targetId: id,
    description: `${actor.username} changed MilSim group ${id} status to ${status}`,
    oldSnapshot: before ?? null,
  }));

  res.json({ success: true });
});

router.delete("/admin/milsim-groups/:id", ...adminGuard, async (req, res): Promise<void> => {
  const id    = parseInt(req.params.id, 10);
  const actor = (req as any).user as typeof usersTable.$inferSelect;

  const beforeResult = await db.execute(sql`SELECT * FROM milsim_groups WHERE id = ${id}`);
  const before = beforeResult.rows[0] ?? null;

  await db.execute(sql`DELETE FROM milsim_groups WHERE id = ${id}`);

  await logAudit(buildAuditFromReq(req, {
    actionType: "DELETE",
    targetTable: "milsim_groups",
    targetId: id,
    description: `${actor.username} deleted MilSim group id=${id}`,
    oldSnapshot: before,
  }));

  res.json({ success: true });
});

// POST /api/admin/broadcast — admin only, sends message to all active members from System
router.post("/admin/broadcast", ...adminGuard, async (req, res): Promise<void> => {
  const actor = (req as any).user;
  const { subject, body } = req.body as { subject: string; body: string };

  if (!subject || !body) { res.status(400).json({ error: "Subject and body required" }); return; }
  if (body.length > 5000) { res.status(400).json({ error: "Body too long (max 5000 chars)" }); return; }

  // Get all active non-admin users
  const usersResult = await db.execute(sql`SELECT id FROM users WHERE status = 'active' AND id != ${actor.id}`);
  const recipients = usersResult.rows as Array<{ id: number }>;

  if (!recipients.length) { res.json({ sent: 0 }); return; }

  await db.execute(sql`
    INSERT INTO messages (sender_id, recipient_id, subject, body)
    SELECT ${actor.id}, u.id, ${subject}, ${body}
    FROM unnest(ARRAY[${sql.raw(recipients.map(r => r.id).join(","))}]::int[]) AS u(id)
  `);

  await logAudit(buildAuditFromReq(req, {
    actionType: "CREATE",
    targetTable: "messages",
    description: `${actor.username} sent broadcast to ${recipients.length} members: "${subject}"`,
  }));

  res.json({ sent: recipients.length });
});

// GET /api/admin/reset-tokens — admin can look up pending reset tokens
router.get("/admin/reset-tokens", ...adminGuard, async (req, res): Promise<void> => {
  const result = await db.execute(sql`
    SELECT t.id, t.token, t.expires_at, t.used, t.created_at, u.username, u.email
    FROM password_reset_tokens t
    JOIN users u ON t.user_id = u.id
    WHERE t.used = false AND t.expires_at > NOW()
    ORDER BY t.created_at DESC
  `);
  res.json(result.rows);
});

export { getLockdown };
export default router;
