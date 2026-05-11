// siteSettings — CRUD for SiteSetting entity (group notification rules, platform config)
// INC-039 fix: was missing entirely
// Frontend calls:
//   GET /siteSettings?key=X
//   GET /siteSettings?id=X
//   POST /siteSettings
//   PUT /siteSettings?id=X
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
    const key = url.searchParams.get("key");
    const id = url.searchParams.get("id");

    // GET ?key=X — find settings by key (returns array, may be empty)
    if (req.method === "GET" && key) {
      const records = await base44.asServiceRole.entities.SiteSetting.filter({ key });
      return json(records);
    }

    // GET ?id=X — single setting by id
    if (req.method === "GET" && id) {
      const record = await base44.asServiceRole.entities.SiteSetting.get(id);
      if (!record) return json({ error: "Not found" }, 404);
      return json(record);
    }

    // GET (no params) — list all settings (admin use)
    if (req.method === "GET") {
      const records = await base44.asServiceRole.entities.SiteSetting.list();
      return json(records);
    }

    // POST — create new setting
    if (req.method === "POST") {
      const body = await req.json();
      if (!body.key) return json({ error: "key required" }, 400);
      const record = await base44.asServiceRole.entities.SiteSetting.create(body);
      return json(record, 201);
    }

    // PUT ?id=X — full replace
    if ((req.method === "PUT" || req.method === "PATCH") && id) {
      const body = await req.json();
      const updated = await base44.asServiceRole.entities.SiteSetting.update(id, body);
      return json(updated);
    }

    // DELETE ?id=X
    if (req.method === "DELETE" && id) {
      await base44.asServiceRole.entities.SiteSetting.delete(id);
      return json({ ok: true });
    }

    return json({ error: "key or id required" }, 400);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
