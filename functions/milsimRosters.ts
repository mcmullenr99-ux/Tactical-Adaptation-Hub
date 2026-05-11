// milsimRosters — CRUD proxy for MilsimRoster entity
// INC-039 fix: was missing entirely
// Frontend calls: GET /milsimRosters?group_id=X, PUT /milsimRosters?id=X
import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";

Deno.serve(async (req: Request) => {
  const base44 = createClientFromRequest(req);
  const url = new URL(req.url);
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const id = url.searchParams.get("id");
    const group_id = url.searchParams.get("group_id");
    const user_id = url.searchParams.get("user_id");

    // GET /milsimRosters?group_id=X  — list roster for group
    if (req.method === "GET" && group_id) {
      const filter: Record<string, string> = { group_id };
      if (user_id) filter.user_id = user_id;
      const records = await base44.asServiceRole.entities.MilsimRoster.filter(filter);
      return json(records);
    }

    // GET /milsimRosters?id=X  — get single roster entry
    if (req.method === "GET" && id) {
      const record = await base44.asServiceRole.entities.MilsimRoster.get(id);
      if (!record) return json({ error: "Not found" }, 404);
      return json(record);
    }

    // POST /milsimRosters  — create roster entry
    if (req.method === "POST") {
      const body = await req.json();
      const record = await base44.asServiceRole.entities.MilsimRoster.create(body);
      return json(record, 201);
    }

    // PUT /milsimRosters?id=X  — full update (used by promotion engine)
    if ((req.method === "PUT" || req.method === "PATCH") && id) {
      const body = await req.json();
      const updated = await base44.asServiceRole.entities.MilsimRoster.update(id, body);
      return json(updated);
    }

    // DELETE /milsimRosters?id=X
    if (req.method === "DELETE" && id) {
      await base44.asServiceRole.entities.MilsimRoster.delete(id);
      return json({ ok: true });
    }

    return json({ error: "group_id or id required" }, 400);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
