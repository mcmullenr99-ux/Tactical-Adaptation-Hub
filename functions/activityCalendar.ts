import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";

Deno.serve(async (req: Request) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const url = new URL(req.url);
  const path = url.searchParams.get("path") ?? "";

  try {
    const base44 = createClientFromRequest(req);
    const asAdmin = base44.asServiceRole;

    // ── LIST ─────────────────────────────────────────────────
    if (path === "list") {
      const group_id = url.searchParams.get("group_id");
      if (!group_id) return new Response(JSON.stringify({ error: "group_id required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

      const events = await asAdmin.entities.MilsimOp.filter({ group_id });
      // Also pull any events that have calendar-style metadata
      return new Response(JSON.stringify({ events }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ── CREATE ────────────────────────────────────────────────
    if (path === "create" && req.method === "POST") {
      const { group_id, title, event_type, scheduled_at, end_date, description, game, status, created_by } = await req.json();
      if (!group_id || !title || !scheduled_at)
        return new Response(JSON.stringify({ error: "group_id, title, scheduled_at required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

      const ev = await asAdmin.entities.MilsimOp.create({
        group_id, name: title, description: description ?? "",
        game: game ?? "", scheduled_at,
        status: status ?? "Planned",
        created_by: created_by ?? "",
        // Store type in description prefix for now
        event_type: event_type ?? "Op",
        end_date: end_date ?? null,
      });

      return new Response(JSON.stringify({ event: ev }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ── UPDATE ────────────────────────────────────────────────
    if (path === "update" && req.method === "POST") {
      const { id, title, event_type, scheduled_at, end_date, description, game, status } = await req.json();
      if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

      const updated = await asAdmin.entities.MilsimOp.update(id, {
        name: title, event_type, scheduled_at, end_date, description, game, status
      });
      return new Response(JSON.stringify({ event: updated }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ── DELETE ────────────────────────────────────────────────
    if (path === "delete" && req.method === "POST") {
      const { id } = await req.json();
      await asAdmin.entities.MilsimOp.delete(id);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown path" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
