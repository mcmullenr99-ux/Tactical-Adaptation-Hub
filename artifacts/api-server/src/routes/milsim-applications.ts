import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { moderateText } from "../lib/moderation";

const router: IRouter = Router();

// POST /api/milsim-groups/:groupId/apply
router.post("/milsim-groups/:groupId/apply", requireAuth, async (req, res): Promise<void> => {
  const groupId = parseInt(req.params.groupId, 10);
  const user = (req as any).user;
  const { answers } = req.body as { answers?: Record<string, string> };

  const groupResult = await db.execute(sql`SELECT * FROM milsim_groups WHERE id = ${groupId} AND status = 'approved'`);
  if (!groupResult.rows[0]) {
    res.status(404).json({ error: "Group not found or not approved" });
    return;
  }

  const existing = await db.execute(sql`
    SELECT id FROM milsim_group_applications WHERE group_id = ${groupId} AND user_id = ${user.id}
  `);
  if (existing.rows[0]) {
    res.status(409).json({ error: "You have already applied to this group" });
    return;
  }

  if (answers && Object.keys(answers).length > 0) {
    const combinedAnswers = Object.values(answers).filter(Boolean).join("\n\n");
    const answerCheck = await moderateText(combinedAnswers);
    if (answerCheck.flagged) {
      res.status(422).json({ error: `Application rejected by content moderation: ${answerCheck.reason}`, moderation: true });
      return;
    }
  }

  const result = await db.execute(sql`
    INSERT INTO milsim_group_applications (group_id, user_id, username, answers)
    VALUES (${groupId}, ${user.id}, ${user.username}, ${answers ? JSON.stringify(answers) : null})
    RETURNING *
  `);
  res.status(201).json(result.rows[0]);
});

// GET /api/milsim-groups/:groupId/applications — group owner
router.get("/milsim-groups/:groupId/applications", requireAuth, async (req, res): Promise<void> => {
  const groupId = parseInt(req.params.groupId, 10);
  const user = (req as any).user;

  const group = await db.execute(sql`SELECT owner_id FROM milsim_groups WHERE id = ${groupId}`);
  if (!group.rows[0]) { res.status(404).json({ error: "Group not found" }); return; }
  if ((group.rows[0] as any).owner_id !== user.id && user.role !== "admin" && user.role !== "moderator") {
    res.status(403).json({ error: "Not authorised" });
    return;
  }

  const result = await db.execute(sql`
    SELECT * FROM milsim_group_applications WHERE group_id = ${groupId} ORDER BY created_at DESC
  `);
  res.json(result.rows);
});

// PATCH /api/milsim-groups/:groupId/applications/:appId — group owner
router.patch("/milsim-groups/:groupId/applications/:appId", requireAuth, async (req, res): Promise<void> => {
  const groupId = parseInt(req.params.groupId, 10);
  const appId = parseInt(req.params.appId, 10);
  const user = (req as any).user;
  const { status, reviewNote } = req.body as { status: string; reviewNote?: string };

  const group = await db.execute(sql`SELECT owner_id FROM milsim_groups WHERE id = ${groupId}`);
  if (!group.rows[0]) { res.status(404).json({ error: "Group not found" }); return; }
  if ((group.rows[0] as any).owner_id !== user.id && user.role !== "admin" && user.role !== "moderator") {
    res.status(403).json({ error: "Not authorised" }); return;
  }

  const validStatuses = ["pending", "approved", "rejected"];
  if (!validStatuses.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }

  await db.execute(sql`
    UPDATE milsim_group_applications
    SET status = ${status}, review_note = ${reviewNote ?? null}, reviewed_by = ${user.id}
    WHERE id = ${appId} AND group_id = ${groupId}
  `);

  res.json({ success: true });
});

// GET /api/milsim-applications/mine — current user's own applications
router.get("/milsim-applications/mine", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const result = await db.execute(sql`
    SELECT a.*, g.name AS group_name, g.slug AS group_slug
    FROM milsim_group_applications a
    JOIN milsim_groups g ON a.group_id = g.id
    WHERE a.user_id = ${user.id}
    ORDER BY a.created_at DESC
  `);
  res.json(result.rows);
});

export default router;
