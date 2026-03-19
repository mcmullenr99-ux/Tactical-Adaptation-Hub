import { Router, type IRouter } from "express";
import { db, staffApplicationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SubmitStaffApplicationBody, ReviewStaffApplicationBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

async function formatApp(app: typeof staffApplicationsTable.$inferSelect) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, app.userId));
  return {
    id: app.id,
    userId: app.userId,
    username: user?.username ?? "unknown",
    gamertag: app.gamertag,
    games: app.games,
    experience: app.experience,
    motivation: app.motivation,
    status: app.status,
    reviewNote: app.reviewNote,
    reviewedBy: app.reviewedBy,
    createdAt: app.createdAt.toISOString(),
  };
}

router.post("/staff-applications", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const parsed = SubmitStaffApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [app] = await db
    .insert(staffApplicationsTable)
    .values({ userId, ...parsed.data })
    .returning();

  res.status(201).json(await formatApp(app));
});

router.get(
  "/staff-applications",
  requireAuth,
  requireRole("moderator", "admin"),
  async (req, res): Promise<void> => {
    const apps = await db
      .select()
      .from(staffApplicationsTable)
      .orderBy(staffApplicationsTable.createdAt);
    const formatted = await Promise.all(apps.map(formatApp));
    res.json(formatted.reverse());
  }
);

router.patch(
  "/staff-applications/:id",
  requireAuth,
  requireRole("moderator", "admin"),
  async (req, res): Promise<void> => {
    const reviewerId = (req as any).user.id;
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);

    const parsed = ReviewStaffApplicationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const [existing] = await db
      .select()
      .from(staffApplicationsTable)
      .where(eq(staffApplicationsTable.id, id));
    if (!existing) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    const [app] = await db
      .update(staffApplicationsTable)
      .set({
        status: parsed.data.status,
        reviewNote: parsed.data.reviewNote ?? null,
        reviewedBy: reviewerId,
      })
      .where(eq(staffApplicationsTable.id, id))
      .returning();

    // If approved, promote user to staff
    if (parsed.data.status === "approved") {
      await db
        .update(usersTable)
        .set({ role: "staff" })
        .where(eq(usersTable.id, existing.userId));
    }

    res.json(await formatApp(app));
  }
);

export default router;
