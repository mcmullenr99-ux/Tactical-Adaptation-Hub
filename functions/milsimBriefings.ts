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
      const briefings = await asAdmin.entities.MilsimBriefing.filter({ group_id });
      return new Response(JSON.stringify({ briefings }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ── CREATE ────────────────────────────────────────────────
    if (path === "create" && req.method === "POST") {
      const body = await req.json();
      const { group_id, created_by, title, op_id, content, classification } = body;
      if (!group_id || !title) return new Response(JSON.stringify({ error: "group_id and title required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
      const briefing = await asAdmin.entities.MilsimBriefing.create({
        group_id,
        created_by: created_by ?? "",
        title,
        op_id: op_id ?? null,
        content: content ?? "",
        classification: classification ?? "unclassified",
      });
      return new Response(JSON.stringify({ briefing }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ── UPDATE ────────────────────────────────────────────────
    if (path === "update" && req.method === "POST") {
      const { id, ...updates } = await req.json();
      if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
      const briefing = await asAdmin.entities.MilsimBriefing.update(id, updates);
      return new Response(JSON.stringify({ briefing }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ── DELETE ────────────────────────────────────────────────
    if (path === "delete" && req.method === "POST") {
      const { id } = await req.json();
      await asAdmin.entities.MilsimBriefing.delete(id);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ── LINK OP ───────────────────────────────────────────────
    if (path === "link-op" && req.method === "POST") {
      const { briefing_id, op_id } = await req.json();
      if (!briefing_id) return new Response(JSON.stringify({ error: "briefing_id required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
      await asAdmin.entities.MilsimBriefing.update(briefing_id, { op_id: op_id ?? null });
      return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown path" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
