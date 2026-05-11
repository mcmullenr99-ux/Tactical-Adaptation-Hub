// roleExpectations — CRUD for RoleExpectation entity
// INC-039 fix: was missing entirely
// Frontend calls:
//   GET /roleExpectations?group_id=X
//   POST /roleExpectations
//   PATCH /roleExpectations/${editId}
//   DELETE /roleExpectations/${id}
import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";

Deno.serve(async (req: Request) => {
  const base44 = createClientFromRequest(req);
  const url = new URL(req.url);
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    // Frontend sends path as: /roleExpectations/${id} — extract from pathname
    const pathParts = url.pathname.replace(/^\/functions\/roleExpectations/, "").split("/").filter(Boolean);
    const pathId = pathParts[0] ?? null;
    const group_id = url.searchParams.get("group_id");

    // GET ?group_id=X — list expectations for group
    if (req.method === "GET" && group_id) {
      const records = await base44.asServiceRole.entities.RoleExpectation.filter({ group_id });
      return json(records);
    }

    // GET single
    if (req.method === "GET" && pathId) {
      const record = await base44.asServiceRole.entities.RoleExpectation.get(pathId);
      if (!record) return json({ error: "Not found" }, 404);
      return json(record);
    }

    // POST — create
    if (req.method === "POST") {
      const body = await req.json();
      if (!body.group_id || !body.role_id) return json({ error: "group_id and role_id required" }, 400);
      const record = await base44.asServiceRole.entities.RoleExpectation.create(body);
      return json(record, 201);
    }

    // PATCH /:id
    if (req.method === "PATCH" && pathId) {
      const body = await req.json();
      const updated = await base44.asServiceRole.entities.RoleExpectation.update(pathId, body);
      return json(updated);
    }

    // DELETE /:id
    if (req.method === "DELETE" && pathId) {
      await base44.asServiceRole.entities.RoleExpectation.delete(pathId);
      return json({ ok: true });
    }

    return json({ error: "group_id required or invalid path" }, 400);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
