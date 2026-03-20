import { Router, type IRouter } from "express";
import { sql as rawSql } from "drizzle-orm";
import { db, milsimGroupsTable, milsimRosterTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function gid(req: any) {
  return parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
}

async function isGroupOwner(userId: number, groupId: number): Promise<boolean> {
  const [g] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, groupId));
  return !!g && g.ownerId === userId;
}

async function getRosterEntry(userId: number, groupId: number) {
  const result = await db.select().from(milsimRosterTable)
    .where(and(eq(milsimRosterTable.groupId, groupId), eq(milsimRosterTable.userId, userId)));
  return result[0] ?? null;
}

router.get("/milsim-groups/:id/ops", requireAuth, async (req, res): Promise<void> => {
  const groupId = gid(req);
  const result = await db.execute(rawSql`
    SELECT o.*,
      (SELECT COUNT(*) FROM milsim_op_checkins WHERE op_id = o.id) AS checkin_count
    FROM milsim_ops o
    WHERE o.group_id = ${groupId}
    ORDER BY o.started_at DESC
    LIMIT 50
  `);
  res.json(result.rows);
});

router.get("/milsim-groups/:id/ops/active", requireAuth, async (req, res): Promise<void> => {
  const groupId = gid(req);
  const result = await db.execute(rawSql`
    SELECT o.*,
      COALESCE(json_agg(json_build_object(
        'id', c.id, 'callsign', c.callsign, 'checked_in_at', c.checked_in_at
      )) FILTER (WHERE c.id IS NOT NULL), '[]') AS checkins
    FROM milsim_ops o
    LEFT JOIN milsim_op_checkins c ON c.op_id = o.id
    WHERE o.group_id = ${groupId} AND o.status = 'active'
    GROUP BY o.id
    ORDER BY o.started_at DESC
    LIMIT 1
  `);
  res.json(result.rows[0] ?? null);
});

router.get("/milsim-groups/:id/ops/:opId", requireAuth, async (req, res): Promise<void> => {
  const opId = parseInt(req.params.opId, 10);
  const result = await db.execute(rawSql`
    SELECT o.*,
      COALESCE(json_agg(json_build_object(
        'id', c.id, 'callsign', c.callsign, 'roster_entry_id', c.roster_entry_id, 'checked_in_at', c.checked_in_at
      )) FILTER (WHERE c.id IS NOT NULL), '[]') AS checkins
    FROM milsim_ops o
    LEFT JOIN milsim_op_checkins c ON c.op_id = o.id
    WHERE o.id = ${opId}
    GROUP BY o.id
  `);
  if (!result.rows[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(result.rows[0]);
});

router.post("/milsim-groups/:id/ops", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const groupId = gid(req);
  if (!(await isGroupOwner(userId, groupId))) { res.status(403).json({ error: "Forbidden" }); return; }
  const { name, description } = req.body as any;
  if (!name?.trim()) { res.status(400).json({ error: "name required" }); return; }
  await db.execute(rawSql`UPDATE milsim_ops SET status = 'ended', ended_at = now() WHERE group_id = ${groupId} AND status = 'active'`);
  const result = await db.execute(rawSql`
    INSERT INTO milsim_ops (group_id, name, description, started_by)
    VALUES (${groupId}, ${name.trim()}, ${description ?? null}, ${(req as any).user.username})
    RETURNING *
  `);
  res.status(201).json(result.rows[0]);
});

router.patch("/milsim-groups/:id/ops/:opId/end", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const groupId = gid(req);
  const opId = parseInt(req.params.opId, 10);
  if (!(await isGroupOwner(userId, groupId))) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.execute(rawSql`UPDATE milsim_ops SET status = 'ended', ended_at = now() WHERE id = ${opId} AND group_id = ${groupId}`);
  res.sendStatus(204);
});

router.post("/milsim-groups/:id/ops/:opId/checkin", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const groupId = gid(req);
  const opId = parseInt(req.params.opId, 10);
  const entry = await getRosterEntry(userId, groupId);
  if (!entry) { res.status(403).json({ error: "Not a roster member" }); return; }
  const op = await db.execute(rawSql`SELECT * FROM milsim_ops WHERE id = ${opId} AND group_id = ${groupId} AND status = 'active'`);
  if (!op.rows[0]) { res.status(404).json({ error: "No active op found" }); return; }
  const result = await db.execute(rawSql`
    INSERT INTO milsim_op_checkins (op_id, roster_entry_id, callsign)
    VALUES (${opId}, ${entry.id}, ${entry.callsign})
    ON CONFLICT (op_id, roster_entry_id) DO NOTHING
    RETURNING *
  `);
  res.status(201).json(result.rows[0] ?? { already: true });
});

router.delete("/milsim-groups/:id/ops/:opId/checkin", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const groupId = gid(req);
  const opId = parseInt(req.params.opId, 10);
  const entry = await getRosterEntry(userId, groupId);
  if (!entry) { res.status(403).json({ error: "Not a roster member" }); return; }
  await db.execute(rawSql`DELETE FROM milsim_op_checkins WHERE op_id = ${opId} AND roster_entry_id = ${entry.id}`);
  res.sendStatus(204);
});

export default router;
