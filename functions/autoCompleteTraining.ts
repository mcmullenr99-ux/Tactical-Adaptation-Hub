import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";

/**
 * Auto-complete training ops that are:
 * - event_type = "Training"
 * - scheduled_at is more than 2 hours in the past
 * - status is NOT already "Completed" or "Cancelled"
 */
Deno.serve(async (req: Request) => {
  try {
    const base44 = createClientFromRequest(req);
    const asAdmin = base44.asServiceRole;

    // Get all training ops
    const allOps = await asAdmin.entities.MilsimOp.list({ limit: 500 });

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    let completed = 0;
    const details: any[] = [];

    for (const op of allOps) {
      // Only process Training type ops
      if (op.event_type !== "Training") continue;

      // Skip if already Completed or Cancelled
      if (op.status === "Completed" || op.status === "Cancelled") continue;

      const scheduledAt = op.scheduled_at ? new Date(op.scheduled_at) : null;
      if (!scheduledAt) continue;

      // If op is more than 2 hours in the past
      if (scheduledAt < twoHoursAgo) {
        await asAdmin.entities.MilsimOp.update(op.id, { status: "Completed" });
        completed++;
        details.push({
          op_id: op.id,
          op_name: op.name,
          was_status: op.status,
          scheduled_at: op.scheduled_at,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto-completed ${completed} training ops (scheduled >2 hours ago)`,
        completed,
        details,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
