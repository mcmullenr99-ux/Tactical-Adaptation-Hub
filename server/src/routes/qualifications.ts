import { Router, type IRouter } from "express";
import { sql as rawSql } from "drizzle-orm";
import { db, milsimGroupsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function groupId(req: any) {
  return parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
}

async function isGroupOwner(userId: number, gid: number): Promise<boolean> {
  const [g] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, gid));
  return !!g && g.ownerId === userId;
}

router.get("/milsim-groups/:id/qualifications", requireAuth, async (req, res): Promise<void> => {
  const gid = groupId(req);
  const result = await db.execute(rawSql`
    SELECT q.*,
      COALESCE(json_agg(json_build_object(
        'id', mq.id,
        'roster_entry_id', mq.roster_entry_id,
        'callsign', ro.callsign,
        'awarded_by', mq.awarded_by,
        'awarded_at', mq.awarded_at
      )) FILTER (WHERE mq.id IS NOT NULL), '[]') AS grants
    FROM milsim_qualifications q
    LEFT JOIN milsim_member_quals mq ON mq.qualification_id = q.id
    LEFT JOIN milsim_roster ro ON ro.id = mq.roster_entry_id
    WHERE q.group_id = ${gid}
    GROUP BY q.id
    ORDER BY q.sort_order, q.name
  `);
  res.json(result.rows);
});

router.post("/milsim-groups/:id/qualifications", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const gid = groupId(req);
  if (!(await isGroupOwner(userId, gid))) { res.status(403).json({ error: "Forbidden" }); return; }
  const { name, description, sort_order } = req.body as any;
  if (!name?.trim()) { res.status(400).json({ error: "name required" }); return; }
  const result = await db.execute(rawSql`
    INSERT INTO milsim_qualifications (group_id, name, description, sort_order)
    VALUES (${gid}, ${name.trim()}, ${description ?? null}, ${sort_order ?? 0})
    RETURNING *
  `);
  res.status(201).json(result.rows[0]);
});

router.patch("/milsim-groups/:id/qualifications/:qid", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const gid = groupId(req);
  const qid = parseInt(req.params.qid, 10);
  if (!(await isGroupOwner(userId, gid))) { res.status(403).json({ error: "Forbidden" }); return; }
  const { name, description, sort_order } = req.body as any;
  await db.execute(rawSql`
    UPDATE milsim_qualifications SET
      name = COALESCE(${name ?? null}, name),
      description = COALESCE(${description ?? null}, description),
      sort_order = COALESCE(${sort_order ?? null}, sort_order)
    WHERE id = ${qid} AND group_id = ${gid}
  `);
  res.sendStatus(204);
});

router.delete("/milsim-groups/:id/qualifications/:qid", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const gid = groupId(req);
  const qid = parseInt(req.params.qid, 10);
  if (!(await isGroupOwner(userId, gid))) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.execute(rawSql`DELETE FROM milsim_qualifications WHERE id = ${qid} AND group_id = ${gid}`);
  res.sendStatus(204);
});

router.post("/milsim-groups/:id/qualifications/:qid/grant", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const gid = groupId(req);
  const qid = parseInt(req.params.qid, 10);
  if (!(await isGroupOwner(userId, gid))) { res.status(403).json({ error: "Forbidden" }); return; }
  const { rosterEntryId } = req.body as any;
  if (!rosterEntryId) { res.status(400).json({ error: "rosterEntryId required" }); return; }
  const awardedBy = (req as any).user.username;
  const result = await db.execute(rawSql`
    INSERT INTO milsim_member_quals (qualification_id, roster_entry_id, awarded_by)
    VALUES (${qid}, ${rosterEntryId}, ${awardedBy})
    ON CONFLICT (qualification_id, roster_entry_id) DO NOTHING
    RETURNING *
  `);
  res.status(201).json(result.rows[0] ?? { already: true });
});

router.delete("/milsim-groups/:id/qualifications/:qid/grant/:grantId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const gid = groupId(req);
  const qid = parseInt(req.params.qid, 10);
  const grantId = parseInt(req.params.grantId, 10);
  if (!(await isGroupOwner(userId, gid))) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.execute(rawSql`DELETE FROM milsim_member_quals WHERE id = ${grantId} AND qualification_id = ${qid}`);
  res.sendStatus(204);
});

router.get("/milsim-groups/:id/roster/:rosterId/qualifications", requireAuth, async (req, res): Promise<void> => {
  const rosterId = parseInt(req.params.rosterId, 10);
  const result = await db.execute(rawSql`
    SELECT q.name, q.description, mq.awarded_by, mq.awarded_at
    FROM milsim_member_quals mq
    JOIN milsim_qualifications q ON q.id = mq.qualification_id
    WHERE mq.roster_entry_id = ${rosterId}
    ORDER BY mq.awarded_at DESC
  `);
  res.json(result.rows);
});

export default router;
