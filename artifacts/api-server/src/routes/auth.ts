import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
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

export default router;
