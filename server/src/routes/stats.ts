import { Router, type IRouter } from "express";
import { sql as rawSql } from "drizzle-orm";
import { db } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/public", async (req, res): Promise<void> => {
  const [members] = (await db.execute(rawSql`SELECT COUNT(*) as count FROM users WHERE status = 'active'`)).rows as any[];
  const [groups] = (await db.execute(rawSql`SELECT COUNT(*) as count FROM milsim_groups`)).rows as any[];
  const [ops] = (await db.execute(rawSql`SELECT COUNT(*) as count FROM milsim_ops WHERE status = 'ended'`)).rows as any[];
  const [awards] = (await db.execute(rawSql`SELECT COUNT(*) as count FROM milsim_awards`)).rows as any[];
  const [aars] = (await db.execute(rawSql`SELECT COUNT(*) as count FROM milsim_aars`)).rows as any[];
  const [oldest] = (await db.execute(rawSql`SELECT created_at FROM users ORDER BY created_at ASC LIMIT 1`)).rows as any[];
  const founded = oldest?.created_at ? new Date(oldest.created_at).getFullYear() : new Date().getFullYear();

  res.json({
    active_members: parseInt(members.count),
    milsim_groups: parseInt(groups.count),
    ops_completed: parseInt(ops.count),
    awards_given: parseInt(awards.count),
    aars_filed: parseInt(aars.count),
    founded_year: founded,
    years_active: new Date().getFullYear() - founded,
  });
});

router.get("/stats/readiness/:groupId", async (req, res): Promise<void> => {
  const groupId = parseInt(req.params.groupId, 10);
  const thirtyDays = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDays = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [total] = (await db.execute(rawSql`SELECT COUNT(*) as count FROM milsim_roster WHERE group_id = ${groupId}`)).rows as any[];
  const [activeWeek] = (await db.execute(rawSql`
    SELECT COUNT(DISTINCT r.id) as count
    FROM milsim_roster r
    JOIN users u ON u.id = r.user_id
    WHERE r.group_id = ${groupId} AND u.last_seen_at > ${sevenDays}
  `)).rows as any[];
  const [activeMonth] = (await db.execute(rawSql`
    SELECT COUNT(DISTINCT r.id) as count
    FROM milsim_roster r
    JOIN users u ON u.id = r.user_id
    WHERE r.group_id = ${groupId} AND u.last_seen_at > ${thirtyDays}
  `)).rows as any[];

  const totalCount = parseInt(total.count);
  const weekCount = parseInt(activeWeek.count);
  const monthCount = parseInt(activeMonth.count);
  const pct = totalCount > 0 ? Math.round((weekCount / totalCount) * 100) : 0;

  res.json({
    total: totalCount,
    active_this_week: weekCount,
    active_this_month: monthCount,
    readiness_pct: pct,
    status: pct >= 70 ? "green" : pct >= 40 ? "amber" : "red",
  });
});

export default router;
