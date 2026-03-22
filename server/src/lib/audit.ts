import { rawQuery } from "@workspace/db";
import { sql } from "drizzle-orm";
import type { Request } from "express";

export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? req.ip ?? "unknown";
}

export interface AuditParams {
  userId?: number | null;
  username?: string | null;
  ip?: string;
  userAgent?: string;
  method: string;
  path: string;
  actionType: string;
  targetTable?: string | null;
  targetId?: string | number | null;
  description?: string;
  oldSnapshot?: object | null;
  newSnapshot?: object | null;
  requestBody?: object | null;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await rawQuery(sql`
      INSERT INTO audit_logs
        (user_id, username, ip_address, user_agent, method, path, action_type,
         target_table, target_id, description, old_snapshot, new_snapshot, request_body)
      VALUES
        (${params.userId ?? null},
         ${params.username ?? null},
         ${params.ip ?? null},
         ${params.userAgent ?? null},
         ${params.method},
         ${params.path},
         ${params.actionType},
         ${params.targetTable ?? null},
         ${params.targetId !== undefined && params.targetId !== null ? String(params.targetId) : null},
         ${params.description ?? null},
         ${params.oldSnapshot ? JSON.stringify(params.oldSnapshot) : null},
         ${params.newSnapshot ? JSON.stringify(params.newSnapshot) : null},
         ${params.requestBody ? JSON.stringify(params.requestBody) : null})
    `);
  } catch (err) {
    console.error("[audit] Failed to write audit log:", err);
  }
}

export function buildAuditFromReq(
  req: Request,
  extras: Omit<AuditParams, "method" | "path" | "ip" | "userAgent" | "userId" | "username">
): AuditParams {
  const user = (req as any).user;
  const safeBody = req.body ? sanitiseBody(req.body) : null;
  return {
    userId: user?.id ?? (req.session as any)?.userId ?? null,
    username: user?.username ?? null,
    ip: getClientIp(req),
    userAgent: req.headers["user-agent"] ?? undefined,
    method: req.method,
    path: req.path,
    requestBody: safeBody,
    ...extras,
  };
}

function sanitiseBody(body: Record<string, unknown>): Record<string, unknown> {
  const HIDDEN = new Set(["password", "passwordHash", "newPassword", "confirmPassword", "passcode"]);
  return Object.fromEntries(
    Object.entries(body).map(([k, v]) => [k, HIDDEN.has(k.toLowerCase()) ? "[REDACTED]" : v])
  );
}
