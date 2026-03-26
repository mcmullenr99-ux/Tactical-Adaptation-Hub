import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";

Deno.serve(async (req: Request) => {
  const base44 = createClientFromRequest(req);
  const url = new URL(req.url);
  const path = url.searchParams.get("path") ?? "";

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    if (path === "list") {
      const group_id = url.searchParams.get("group_id");
      const op_id = url.searchParams.get("op_id");
      const query: Record<string, string> = {};
      if (group_id) query.group_id = group_id;
      if (op_id) query.op_id = op_id;
      const records = await base44.asServiceRole.entities.MilsimLace.filter(query, { sort: "-created_date" });
      return json({ lace_reports: records });
    }

    if (path === "create") {
      const body = await req.json();
      const record = await base44.asServiceRole.entities.MilsimLace.create(body);
      return json({ lace_report: record });
    }

    if (path === "delete") {
      const body = await req.json();
      await base44.asServiceRole.entities.MilsimLace.delete(body.id);
      return json({ ok: true });
    }

    return json({ error: "Unknown path" }, 400);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
