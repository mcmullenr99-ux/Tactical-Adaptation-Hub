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

router.get("/milsim-groups/:id/aars", requireAuth, async (req, res): Promise<void> => {
  const groupId = gid(req);
  const result = await db.execute(rawSql`
    SELECT * FROM milsim_aars WHERE group_id = ${groupId} ORDER BY op_date DESC, created_at DESC
  `);
  res.json(result.rows);
});

router.get("/milsim-groups/:id/aars/:aarId", requireAuth, async (req, res): Promise<void> => {
  const groupId = gid(req);
  const aarId = parseInt(req.params.aarId, 10);
  const result = await db.execute(rawSql`SELECT * FROM milsim_aars WHERE id = ${aarId} AND group_id = ${groupId}`);
  if (!result.rows[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(result.rows[0]);
});

router.post("/milsim-groups/:id/aars", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const groupId = gid(req);
  if (!(await isGroupOwner(userId, groupId))) { res.status(403).json({ error: "Forbidden" }); return; }
  const { op_name, op_date, summary, objectives_hit, objectives_missed, casualties, commendations, recommendations, classification } = req.body as any;
  if (!op_name?.trim()) { res.status(400).json({ error: "op_name required" }); return; }
  const result = await db.execute(rawSql`
    INSERT INTO milsim_aars (group_id, op_name, op_date, summary, objectives_hit, objectives_missed, casualties, commendations, recommendations, classification, created_by)
    VALUES (
      ${groupId}, ${op_name.trim()}, ${op_date ?? null}, ${summary ?? null},
      ${objectives_hit ?? null}, ${objectives_missed ?? null}, ${casualties ?? null},
      ${commendations ?? null}, ${recommendations ?? null},
      ${classification ?? "unclassified"}, ${(req as any).user.username}
    )
    RETURNING *
  `);
  res.status(201).json(result.rows[0]);
});

router.patch("/milsim-groups/:id/aars/:aarId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const groupId = gid(req);
  const aarId = parseInt(req.params.aarId, 10);
  if (!(await isGroupOwner(userId, groupId))) { res.status(403).json({ error: "Forbidden" }); return; }
  const { op_name, op_date, summary, objectives_hit, objectives_missed, casualties, commendations, recommendations, classification } = req.body as any;
  await db.execute(rawSql`
    UPDATE milsim_aars SET
      op_name = COALESCE(${op_name ?? null}, op_name),
      op_date = COALESCE(${op_date ?? null}::date, op_date),
      summary = COALESCE(${summary ?? null}, summary),
      objectives_hit = COALESCE(${objectives_hit ?? null}, objectives_hit),
      objectives_missed = COALESCE(${objectives_missed ?? null}, objectives_missed),
      casualties = COALESCE(${casualties ?? null}, casualties),
      commendations = COALESCE(${commendations ?? null}, commendations),
      recommendations = COALESCE(${recommendations ?? null}, recommendations),
      classification = COALESCE(${classification ?? null}, classification),
      updated_at = now()
    WHERE id = ${aarId} AND group_id = ${groupId}
  `);
  const r = await db.execute(rawSql`SELECT * FROM milsim_aars WHERE id = ${aarId}`);
  res.json(r.rows[0]);
});

router.delete("/milsim-groups/:id/aars/:aarId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const groupId = gid(req);
  const aarId = parseInt(req.params.aarId, 10);
  if (!(await isGroupOwner(userId, groupId))) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.execute(rawSql`DELETE FROM milsim_aars WHERE id = ${aarId} AND group_id = ${groupId}`);
  res.sendStatus(204);
});

export default router;
