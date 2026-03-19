import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

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
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (user.status === "suspended") {
    res.status(403).json({ error: "Account suspended" });
    return;
  }

  req.session.userId = user.id;
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
