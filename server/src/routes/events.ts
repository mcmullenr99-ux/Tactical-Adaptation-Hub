import { Router, type IRouter } from "express";
import { rawQuery } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { logAudit, buildAuditFromReq } from "../lib/audit";

const router: IRouter = Router();
const staffGuard = [requireAuth, requireRole("staff", "moderator", "admin")];

// GET /api/events — public
router.get("/events", async (_req, res): Promise<void> => {
  const result = await rawQuery(sql`
    SELECT * FROM ops_events ORDER BY event_date ASC
  `);
  res.json(result.rows);
});

// POST /api/events — staff+
router.post("/events", ...staffGuard, async (req, res): Promise<void> => {
  const actor = (req as any).user;
  const { title, game, description, eventDate, endDate, maxSlots, eventType, location } = req.body as {
    title: string; game?: string; description?: string;
    eventDate: string; endDate?: string; maxSlots?: number;
    eventType?: string; location?: string;
  };

  if (!title || !eventDate) {
    res.status(400).json({ error: "Title and event date are required" });
    return;
  }

  const result = await rawQuery(sql`
    INSERT INTO ops_events (title, game, description, event_date, end_date, organizer_id, organizer_username, max_slots, event_type, location)
    VALUES (${title}, ${game ?? null}, ${description ?? null}, ${new Date(eventDate)},
            ${endDate ? new Date(endDate) : null}, ${actor.id}, ${actor.username}, ${maxSlots ?? null},
            ${eventType ?? "ops"}, ${location ?? null})
    RETURNING *
  `);

  await logAudit(buildAuditFromReq(req, {
    actionType: "CREATE",
    targetTable: "ops_events",
    targetId: (result.rows[0] as any)?.id,
    description: `${actor.username} created event: ${title}`,
    newSnapshot: result.rows[0] as any,
  }));

  res.status(201).json(result.rows[0]);
});

// PATCH /api/events/:id — staff+
router.patch("/events/:id", ...staffGuard, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const actor = (req as any).user;
  const { title, game, description, eventDate, endDate, maxSlots, status, eventType, location } = req.body as any;

  const before = await rawQuery(sql`SELECT * FROM ops_events WHERE id = ${id}`);
  if (!before.rows[0]) { res.status(404).json({ error: "Event not found" }); return; }

  await rawQuery(sql`
    UPDATE ops_events SET
      title = COALESCE(${title ?? null}, title),
      game = COALESCE(${game ?? null}, game),
      description = COALESCE(${description ?? null}, description),
      event_date = COALESCE(${eventDate ? new Date(eventDate) : null}, event_date),
      end_date = COALESCE(${endDate ? new Date(endDate) : null}, end_date),
      max_slots = COALESCE(${maxSlots ?? null}, max_slots),
      status = COALESCE(${status ?? null}, status),
      event_type = COALESCE(${eventType ?? null}, event_type),
      location = COALESCE(${location ?? null}, location)
    WHERE id = ${id}
  `);

  await logAudit(buildAuditFromReq(req, {
    actionType: "UPDATE",
    targetTable: "ops_events",
    targetId: id,
    description: `${actor.username} updated event id=${id}`,
    oldSnapshot: before.rows[0] as any,
  }));

  const updated = await rawQuery(sql`SELECT * FROM ops_events WHERE id = ${id}`);
  res.json(updated.rows[0]);
});

// DELETE /api/events/:id — staff+
router.delete("/events/:id", ...staffGuard, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const actor = (req as any).user;
  await rawQuery(sql`DELETE FROM ops_events WHERE id = ${id}`);
  await logAudit(buildAuditFromReq(req, {
    actionType: "DELETE",
    targetTable: "ops_events",
    targetId: id,
    description: `${actor.username} deleted event id=${id}`,
  }));
  res.json({ success: true });
});

export default router;
