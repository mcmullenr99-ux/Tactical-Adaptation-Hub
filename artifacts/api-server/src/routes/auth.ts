import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, or, sql } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { getLockdown } from "./admin";
import { logAudit, getClientIp } from "../lib/audit";

const router: IRouter = Router();

function toAuthUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    bio: user.bio,
    discordTag: user.discordTag,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  // Anti-raid: block new registrations during lockdown
  const locked = await getLockdown();
  if (locked) {
    res.status(503).json({ error: "Registrations are temporarily closed. Please try again later." });
    return;
  }

  const { username, email, password } = parsed.data;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(or(eq(usersTable.email, email), eq(usersTable.username, username)));

  if (existing) {
    res.status(409).json({ error: "Email or username already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ username, email, passwordHash })
    .returning();

  req.session.userId = user.id;
  await logAudit({
    userId: user.id, username: user.username,
    ip: getClientIp(req), userAgent: req.headers["user-agent"],
    method: "POST", path: "/auth/register",
    actionType: "REGISTER",
    description: `New account registered: ${username} (${email})`,
  });
  res.status(201).json(toAuthUser(user));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user) {
    await logAudit({
      ip: getClientIp(req), userAgent: req.headers["user-agent"],
      method: "POST", path: "/auth/login",
      actionType: "FAILED_LOGIN",
      description: `Failed login attempt for unknown email: ${email}`,
      requestBody: { email },
    });
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await logAudit({
      userId: user.id, username: user.username,
      ip: getClientIp(req), userAgent: req.headers["user-agent"],
      method: "POST", path: "/auth/login",
      actionType: "FAILED_LOGIN",
      description: `Failed login attempt for ${user.username} (wrong password)`,
    });
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (user.status === "suspended") {
    res.status(403).json({ error: "Account suspended" });
    return;
  }

  if (user.status === "banned") {
    const reason = user.banReason ? ` Reason: ${user.banReason}` : "";
    res.status(403).json({ error: `Account permanently banned.${reason}` });
    return;
  }

  req.session.userId = user.id;
  await logAudit({
    userId: user.id, username: user.username,
    ip: getClientIp(req), userAgent: req.headers["user-agent"],
    method: "POST", path: "/auth/login",
    actionType: "LOGIN",
    description: `${user.username} logged in`,
  });
  res.json(toAuthUser(user));
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {});
  res.sendStatus(204);
});

router.get("/auth/me", requireAuth, (req, res): void => {
  const user = (req as any).user;
  res.json(toAuthUser(user));
});

// PATCH /auth/profile — update bio + discordTag
router.patch("/auth/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const { bio, discordTag } = req.body as { bio?: string; discordTag?: string };
  const [updated] = await db
    .update(usersTable)
    .set({
      bio: bio !== undefined ? bio.slice(0, 500) : undefined,
      discordTag: discordTag !== undefined ? discordTag.slice(0, 50) : undefined,
    })
    .where(eq(usersTable.id, userId))
    .returning();
  res.json(toAuthUser(updated));
});

// PATCH /auth/password — change password (logged in)
router.patch("/auth/password", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user as typeof usersTable.$inferSelect;
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters" });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(403).json({ error: "Current password is incorrect" });
    return;
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash: hash }).where(eq(usersTable.id, user.id));
  res.json({ success: true });
});

// POST /auth/forgot-password — generate admin-delivered reset token
router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body as { email: string };
  if (!email) { res.status(400).json({ error: "Email required" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  // Always return 200 to avoid email enumeration
  if (!user) { res.json({ success: true }); return; }

  const crypto = await import("crypto");
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.execute(sql`DELETE FROM password_reset_tokens WHERE user_id = ${user.id}`);
  await db.execute(sql`
    INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (${user.id}, ${token}, ${expires})
  `);

  res.json({ success: true, token, username: user.username });
});

// POST /auth/reset-password — use token to set new password
router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  if (!token || !newPassword || newPassword.length < 8) {
    res.status(400).json({ error: "Token and password (min 8 chars) required" });
    return;
  }

  const result = await db.execute(sql`
    SELECT * FROM password_reset_tokens WHERE token = ${token} AND used = false AND expires_at > NOW()
  `);
  const row = result.rows[0] as any;
  if (!row) { res.status(400).json({ error: "Invalid or expired reset token" }); return; }

  const hash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash: hash }).where(eq(usersTable.id, row.user_id));
  await db.execute(sql`UPDATE password_reset_tokens SET used = true WHERE id = ${row.id}`);
  res.json({ success: true });
});

// DELETE /auth/account — GDPR self-deletion
router.delete("/auth/account", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user as typeof usersTable.$inferSelect;
  const { password } = req.body as { password: string };

  if (!password) { res.status(400).json({ error: "Password required to confirm deletion" }); return; }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) { res.status(403).json({ error: "Incorrect password" }); return; }

  await db.delete(usersTable).where(eq(usersTable.id, user.id));
  req.session.destroy(() => {});
  res.json({ success: true });
});

export default router;
