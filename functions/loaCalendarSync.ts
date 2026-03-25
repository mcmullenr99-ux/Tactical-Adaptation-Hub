import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";

Deno.serve(async (req: Request) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  try {
    const base44 = createClientFromRequest(req);
    const asAdmin = base44.asServiceRole;

    // Get all LOAs
    const allLoas = await asAdmin.entities.MilsimLOA.list({ limit: 500 });
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const updates = { expired: 0, activated: 0 };

    // Check each LOA
    for (const loa of allLoas.records) {
      const startDate = new Date(loa.start_date);
      const endDate = new Date(loa.end_date);

      // Normalize dates to midnight for comparison
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

      // Mark as Expired if end_date is in past and still Active
      if (end < today && loa.status === "Active") {
        await asAdmin.entities.MilsimLOA.update(loa.id, { status: "Expired" });
        updates.expired++;
      }

      // Mark as Active if start_date is today or past and status is Approved
      if (start <= today && loa.status === "Approved") {
        await asAdmin.entities.MilsimLOA.update(loa.id, { status: "Active" });
        updates.activated++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, expired: updates.expired, activated: updates.activated }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
