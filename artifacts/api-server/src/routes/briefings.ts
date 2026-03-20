import { Router, type IRouter } from "express";
import { sql as rawSql } from "drizzle-orm";
import { db, milsimGroupsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function gid(req: any) {
  return parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
}

async function isGroupOwner(userId: number, groupId: number): Promise<boolean> {
  const [g] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, groupId));
  return !!g && g.ownerId === userId;
}

router.get("/milsim-groups/:id/briefings", requireAuth, async (req, res): Promise<void> => {
  const groupId = gid(req);
  const result = await db.execute(rawSql`
    SELECT * FROM milsim_briefings WHERE group_id = ${groupId} ORDER BY op_date DESC NULLS LAST, created_at DESC
  `);
  res.json(result.rows);
});

router.get("/milsim-groups/:id/briefings/:bid", requireAuth, async (req, res): Promise<void> => {
  const groupId = gid(req);
  const bid = parseInt(req.params.bid, 10);
  const result = await db.execute(rawSql`SELECT * FROM milsim_briefings WHERE id = ${bid} AND group_id = ${groupId}`);
  if (!result.rows[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(result.rows[0]);
});

router.post("/milsim-groups/:id/briefings", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const groupId = gid(req);
  if (!(await isGroupOwner(userId, groupId))) { res.status(403).json({ error: "Forbidden" }); return; }
  const { title, op_date, ao, objectives, comms_plan, roe, additional_notes, status } = req.body as any;
  if (!title?.trim()) { res.status(400).json({ error: "title required" }); return; }
  const result = await db.execute(rawSql`
    INSERT INTO milsim_briefings (group_id, title, op_date, ao, objectives, comms_plan, roe, additional_notes, status, created_by)
    VALUES (
      ${groupId}, ${title.trim()}, ${op_date ?? null}, ${ao ?? null},
      ${objectives ?? null}, ${comms_plan ?? null}, ${roe ?? null},
      ${additional_notes ?? null}, ${status ?? "draft"}, ${(req as any).user.username}
    )
    RETURNING *
  `);
  res.status(201).json(result.rows[0]);
});

router.patch("/milsim-groups/:id/briefings/:bid", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const groupId = gid(req);
  const bid = parseInt(req.params.bid, 10);
  if (!(await isGroupOwner(userId, groupId))) { res.status(403).json({ error: "Forbidden" }); return; }
  const { title, op_date, ao, objectives, comms_plan, roe, additional_notes, status } = req.body as any;
  await db.execute(rawSql`
    UPDATE milsim_briefings SET
      title = COALESCE(${title ?? null}, title),
      op_date = COALESCE(${op_date ?? null}::timestamptz, op_date),
      ao = COALESCE(${ao ?? null}, ao),
      objectives = COALESCE(${objectives ?? null}, objectives),
      comms_plan = COALESCE(${comms_plan ?? null}, comms_plan),
      roe = COALESCE(${roe ?? null}, roe),
      additional_notes = COALESCE(${additional_notes ?? null}, additional_notes),
      status = COALESCE(${status ?? null}, status),
      updated_at = now()
    WHERE id = ${bid} AND group_id = ${groupId}
  `);
  const r = await db.execute(rawSql`SELECT * FROM milsim_briefings WHERE id = ${bid}`);
  res.json(r.rows[0]);
});

router.delete("/milsim-groups/:id/briefings/:bid", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const groupId = gid(req);
  const bid = parseInt(req.params.bid, 10);
  if (!(await isGroupOwner(userId, groupId))) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.execute(rawSql`DELETE FROM milsim_briefings WHERE id = ${bid} AND group_id = ${groupId}`);
  res.sendStatus(204);
});

export default router;
