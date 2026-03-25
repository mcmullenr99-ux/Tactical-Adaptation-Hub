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
      const aars = await asAdmin.entities.MilsimAAR.filter({ group_id });
      return new Response(JSON.stringify({ aars }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ── CREATE ────────────────────────────────────────────────
    if (path === "create" && req.method === "POST") {
      const body = await req.json();
      const { group_id, author_id, author_username, title, op_name, op_id, outcome, lessons_learned, content, participants } = body;
      if (!group_id || !title) return new Response(JSON.stringify({ error: "group_id and title required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
      const aar = await asAdmin.entities.MilsimAAR.create({
        group_id,
        author_id: author_id ?? "",
        author_username: author_username ?? "",
        title: title ?? "",
        op_name: op_name ?? "",
        op_id: op_id ?? null,
        outcome: outcome ?? "",
        lessons_learned: lessons_learned ?? "",
        content: content ?? "",
        participants: participants ?? [],
      });
      return new Response(JSON.stringify({ aar }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ── UPDATE ────────────────────────────────────────────────
    if (path === "update" && req.method === "POST") {
      const { id, ...updates } = await req.json();
      if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
      const aar = await asAdmin.entities.MilsimAAR.update(id, updates);
      return new Response(JSON.stringify({ aar }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ── DELETE ────────────────────────────────────────────────
    if (path === "delete" && req.method === "POST") {
      const { id } = await req.json();
      await asAdmin.entities.MilsimAAR.delete(id);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ── LINK OP ───────────────────────────────────────────────
    if (path === "link-op" && req.method === "POST") {
      const { aar_id, op_id } = await req.json();
      if (!aar_id) return new Response(JSON.stringify({ error: "aar_id required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
      await asAdmin.entities.MilsimAAR.update(aar_id, { op_id: op_id ?? null });
      return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown path" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
