import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateUserRoleBody, UpdateUserStatusBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

function toProfile(user: typeof usersTable.$inferSelect) {
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

router.get(
  "/users",
  requireAuth,
  requireRole("moderator", "admin"),
  async (req, res): Promise<void> => {
    const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
    res.json(users.map(toProfile));
  }
);

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(toProfile(user));
});

router.patch(
  "/users/:id/role",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const parsed = UpdateUserRoleBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }
    const [user] = await db
      .update(usersTable)
      .set({ role: parsed.data.role })
      .where(eq(usersTable.id, id))
      .returning();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(toProfile(user));
  }
);

router.patch(
  "/users/:id/status",
  requireAuth,
  requireRole("moderator", "admin"),
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const parsed = UpdateUserStatusBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const [user] = await db
      .update(usersTable)
      .set({ status: parsed.data.status })
      .where(eq(usersTable.id, id))
      .returning();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(toProfile(user));
  }
);

export default router;
