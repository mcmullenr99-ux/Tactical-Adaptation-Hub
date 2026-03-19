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

// Public profile by username — no auth required
router.get("/users/profile/:username", async (req, res): Promise<void> => {
  const username = req.params.username as string;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user || user.status === "banned") {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    bio: user.bio ?? null,
    discordTag: user.discordTag ?? null,
    nationality: user.nationality ?? null,
    createdAt: user.createdAt.toISOString(),
  });
});

// User search by username fragment (for compose autocomplete)
router.get("/users/search", requireAuth, async (req, res): Promise<void> => {
  const q = String(req.query.q ?? "").trim().slice(0, 50);
  if (!q || q.length < 2) { res.json([]); return; }
  const { ilike } = await import("drizzle-orm");
  const results = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    role: usersTable.role,
  }).from(usersTable).where(ilike(usersTable.username, `%${q}%`)).limit(10);
  res.json(results);
});

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
