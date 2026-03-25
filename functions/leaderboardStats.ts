import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";

Deno.serve(async (req: Request) => {
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

  try {
    const base44 = createClientFromRequest(req);
    const adminBase44 = base44.asServiceRole;

    // Fetch all approved/featured groups
    const groups = await adminBase44.entities.MilsimGroup.list();
    const eligibleGroups = groups.filter((g: any) => g.status === "approved" || g.status === "featured");
    const groupIds = eligibleGroups.map((g: any) => g.id);

    if (groupIds.length === 0) {
      return new Response(JSON.stringify([]), { status: 200, headers });
    }

    // Fetch all roster entries for eligible groups
    const allRosters = await adminBase44.entities.MilsimRoster.list();
    // Fetch all AARs for eligible groups
    const allAars = await adminBase44.entities.MilsimAAR.list();

    // Build per-group stats
    const stats = eligibleGroups.map((group: any) => {
      // Roster count — active members only
      const rosterEntries = allRosters.filter((r: any) =>
        r.group_id === group.id && (r.status === "active" || !r.status)
      );
      const roster_count = rosterEntries.length;

      // Op success rate from AARs
      const aars = allAars.filter((a: any) => a.group_id === group.id);
      const total_ops = aars.length;

      let op_success_rate: number | null = null;
      if (total_ops >= 3) {
        const victories = aars.filter((a: any) => a.outcome === "victory").length;
        op_success_rate = Math.round((victories / total_ops) * 100);
      }

      return {
        group_id: group.id,
        roster_count,
        total_ops,
        op_success_rate,
      };
    });

    return new Response(JSON.stringify(stats), { status: 200, headers });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
});
