import { Router, type IRouter, type Request, type Response } from "express";
import { db, rawQuery, usersTable } from "@workspace/db";
import { eq, sql, desc, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { logAudit, buildAuditFromReq, getClientIp } from "../lib/audit";

const router: IRouter = Router();
const adminGuard = [requireAuth, requireRole("admin")];
const staffGuard = [requireAuth, requireRole("moderator", "admin")];

// ── Helpers ────────────────────────────────────────────────────────────────────

function userLabel(req: Request) {
  const u = (req as any).user;
  return { userId: u?.id, username: u?.username };
}

// ── GET /api/security/audit-logs ── full log, admin/mod only ──────────────────

router.get("/security/audit-logs", ...staffGuard, async (req: Request, res: Response): Promise<void> => {
  const limit  = Math.min(parseInt(String(req.query.limit  ?? "200"), 10), 500);
  const offset = parseInt(String(req.query.offset ?? "0"),   10);
  const userId = req.query.userId ? parseInt(String(req.query.userId), 10) : null;

  let query = userId
    ? sql`SELECT * FROM audit_logs WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
    : sql`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

  const rows = await db.execute(query);
  res.json(rows.rows);
});

// ── GET /api/security/evidence/:userId ── evidence package for a specific user ─

router.get("/security/evidence/:userId", ...adminGuard, async (req: Request, res: Response): Promise<void> => {
  const targetId = parseInt(req.params.userId, 10);

  const [targetUser] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  if (!targetUser) { res.status(404).json({ error: "User not found" }); return; }

  const logsResult = await rawQuery(sql`
    SELECT * FROM audit_logs WHERE user_id = ${targetId} ORDER BY created_at ASC
  `);
  const logs = logsResult.rows as any[];

  const ips = [...new Set(logs.map((l: any) => l.ip_address).filter(Boolean))];
  const userAgents = [...new Set(logs.map((l: any) => l.user_agent).filter(Boolean))];
  const actionSummary: Record<string, number> = {};
  logs.forEach((l: any) => {
    actionSummary[l.action_type] = (actionSummary[l.action_type] ?? 0) + 1;
  });

  res.json({
    generatedAt: new Date().toISOString(),
    subject: {
      id: targetUser.id,
      username: targetUser.username,
      email: targetUser.email,
      role: targetUser.role,
      status: targetUser.status,
      registeredAt: targetUser.createdAt,
      bannedAt: targetUser.bannedAt ?? null,
      banReason: targetUser.banReason ?? null,
    },
    networkFingerprints: {
      ipAddresses: ips,
      userAgents,
      note: "IP addresses can be submitted to the relevant ISP under the Computer Misuse Act 1990 (UK) to obtain subscriber details. Log timestamps are UTC.",
    },
    activitySummary: actionSummary,
    totalActions: logs.length,
    timeline: logs,
    legalNotice: [
      "This evidence package may be used in support of a report under the Computer Misuse Act 1990 (UK), specifically sections 1 (unauthorised access), 2 (access with intent), and 3 (unauthorised acts with intent to impair).",
      "Retain this document and do not alter it. Submit to Action Fraud (UK) at https://www.actionfraud.police.uk/ or contact your local police force.",
      "Reference: Computer Misuse Act 1990 – https://www.legislation.gov.uk/ukpga/1990/18/contents",
    ],
  });
});

// ── POST /api/security/emergency ── full emergency lockdown, admin only ─────────

router.post("/security/emergency", ...adminGuard, async (req: Request, res: Response): Promise<void> => {
  const { description, affectedUserId } = req.body as {
    description?: string;
    affectedUserId?: number;
  };
  const actor = (req as any).user;

  // 1. Activate lockdown
  await rawQuery(sql`UPDATE site_settings SET value = 'true' WHERE key = 'lockdown_mode'`);

  // 2. Terminate ALL non-admin sessions from the DB
  const terminatedResult = await rawQuery(sql`
    DELETE FROM user_sessions
    WHERE sess::jsonb->'userId' IS NOT NULL
      AND (
        SELECT role FROM users WHERE id = (sess::jsonb->>'userId')::int
      ) != 'admin'
    RETURNING sid
  `);
  const terminatedCount = (terminatedResult.rows ?? []).length;

  // 3. Gather recent suspicious activity (last 100 actions)
  const recentResult = await rawQuery(sql`
    SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100
  `);
  const recentLogs = recentResult.rows;

  // 4. Gather affected user info if specified
  let affectedUser = null;
  if (affectedUserId) {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, affectedUserId));
    affectedUser = u ?? null;
  }

  // 5. Create security incident record
  await rawQuery(sql`
    INSERT INTO security_incidents
      (triggered_by, triggered_by_username, description, affected_user_id, affected_username, evidence_summary, status)
    VALUES
      (${actor.id}, ${actor.username},
       ${description ?? "Emergency protocol triggered by administrator"},
       ${affectedUserId ?? null},
       ${affectedUser?.username ?? null},
       ${JSON.stringify({ terminatedSessions: terminatedCount, recentActivity: recentLogs.slice(0, 20) })},
       'active')
  `);

  // 6. Audit log the emergency itself
  await logAudit(buildAuditFromReq(req, {
    actionType: "EMERGENCY_PROTOCOL",
    description: `Emergency lockdown triggered by ${actor.username}. ${terminatedCount} sessions terminated.`,
  }));

  res.json({
    success: true,
    lockdownActive: true,
    sessionsTerminated: terminatedCount,
    message: `Emergency protocol activated. Lockdown enabled. ${terminatedCount} non-admin sessions terminated.`,
  });
});

// ── POST /api/security/rollback/:userId ── revert all changes by a user ─────────

router.post("/security/rollback/:userId", ...adminGuard, async (req: Request, res: Response): Promise<void> => {
  const targetId = parseInt(req.params.userId, 10);
  const actor = (req as any).user;

  if (targetId === actor.id) {
    res.status(400).json({ error: "Cannot rollback your own actions" });
    return;
  }

  const [targetUser] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  if (!targetUser) { res.status(404).json({ error: "User not found" }); return; }

  // Safety: cannot rollback an admin
  if (targetUser.role === "admin") {
    res.status(403).json({ error: "Cannot rollback actions of an admin account" });
    return;
  }

  // Fetch all rollback-able logs for this user in reverse order (newest first)
  const logsResult = await rawQuery(sql`
    SELECT * FROM audit_logs
    WHERE user_id = ${targetId}
      AND old_snapshot IS NOT NULL
      AND target_table IS NOT NULL
      AND target_id IS NOT NULL
    ORDER BY created_at DESC
  `);
  const logs = logsResult.rows as any[];

  const results: { logId: number; action: string; status: string; detail?: string }[] = [];

  for (const log of logs) {
    try {
      const table = log.target_table as string;
      const recordId = log.target_id as string;
      const oldSnap = log.old_snapshot as Record<string, unknown>;
      const actionType = log.action_type as string;

      // Only rollback data-mutating actions
      if (!["CREATE", "UPDATE", "DELETE", "BAN", "UNBAN", "ROLE_CHANGE"].includes(actionType)) {
        continue;
      }

      if (actionType === "CREATE" && table) {
        // Undo a creation by deleting the record
        await rawQuery(sql`DELETE FROM ${sql.raw(table)} WHERE id = ${recordId}`);
        results.push({ logId: log.id, action: `DELETE from ${table} id=${recordId}`, status: "ok" });
      } else if ((actionType === "UPDATE" || actionType === "BAN" || actionType === "UNBAN" || actionType === "ROLE_CHANGE") && oldSnap) {
        // Restore old snapshot — build SET clauses from old_snapshot
        if (table === "users") {
          await rawQuery(sql`
            UPDATE users SET
              role       = ${oldSnap.role as string},
              status     = ${oldSnap.status as string},
              ban_reason = ${(oldSnap.banReason as string | null) ?? null},
              banned_at  = ${oldSnap.bannedAt ? new Date(oldSnap.bannedAt as string) : null}
            WHERE id = ${recordId}
          `);
        } else if (table === "milsim_groups") {
          await rawQuery(sql`
            UPDATE milsim_groups SET
              name        = ${oldSnap.name as string},
              tag_line    = ${(oldSnap.tagLine as string | null) ?? null},
              description = ${(oldSnap.description as string | null) ?? null},
              status      = ${(oldSnap.status as string) ?? 'pending'},
              sops        = ${(oldSnap.sops as string | null) ?? null},
              orbat       = ${(oldSnap.orbat as string | null) ?? null}
            WHERE id = ${recordId}
          `);
        } else if (table === "messages") {
          await rawQuery(sql`
            UPDATE messages SET subject = ${oldSnap.subject as string}, body = ${oldSnap.body as string}
            WHERE id = ${recordId}
          `);
        }
        results.push({ logId: log.id, action: `RESTORE ${table} id=${recordId} to old snapshot`, status: "ok" });
      } else if (actionType === "DELETE" && oldSnap) {
        // Re-insert a deleted record — only for milsim_groups
        if (table === "milsim_groups") {
          await rawQuery(sql`
            INSERT INTO milsim_groups (id, owner_id, name, slug, tag_line, description, status, sops, orbat, discord_url, website_url, logo_url, created_at)
            VALUES (
              ${oldSnap.id as number}, ${oldSnap.ownerId as number},
              ${oldSnap.name as string}, ${oldSnap.slug as string},
              ${(oldSnap.tagLine as string | null) ?? null},
              ${(oldSnap.description as string | null) ?? null},
              ${(oldSnap.status as string) ?? 'pending'},
              ${(oldSnap.sops as string | null) ?? null},
              ${(oldSnap.orbat as string | null) ?? null},
              ${(oldSnap.discordUrl as string | null) ?? null},
              ${(oldSnap.websiteUrl as string | null) ?? null},
              ${(oldSnap.logoUrl as string | null) ?? null},
              ${new Date(oldSnap.createdAt as string)}
            ) ON CONFLICT (id) DO NOTHING
          `);
          results.push({ logId: log.id, action: `RESTORE deleted milsim_group id=${recordId}`, status: "ok" });
        }
      }
    } catch (err: any) {
      results.push({ logId: log.id, action: `log ${log.id}`, status: "error", detail: err.message });
    }
  }

  await logAudit(buildAuditFromReq(req, {
    actionType: "ROLLBACK",
    targetTable: "multiple",
    targetId: targetId,
    description: `Rollback of ${results.length} actions by user ${targetUser.username} (id=${targetId}) performed by ${actor.username}`,
  }));

  res.json({
    success: true,
    targetUser: { id: targetUser.id, username: targetUser.username },
    actionsProcessed: results.length,
    results,
  });
});

// ── GET /api/security/incidents ── list incidents, admin only ─────────────────

router.get("/security/incidents", ...adminGuard, async (_req: Request, res: Response): Promise<void> => {
  const result = await rawQuery(sql`
    SELECT * FROM security_incidents ORDER BY created_at DESC LIMIT 50
  `);
  res.json(result.rows);
});

// ── PATCH /api/security/incidents/:id/resolve ─────────────────────────────────

router.patch("/security/incidents/:id/resolve", ...adminGuard, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const actor = (req as any).user;
  await rawQuery(sql`
    UPDATE security_incidents
    SET status = 'resolved', resolved_by = ${actor.id}, resolved_at = NOW()
    WHERE id = ${id}
  `);
  res.json({ success: true });
});

export default router;
