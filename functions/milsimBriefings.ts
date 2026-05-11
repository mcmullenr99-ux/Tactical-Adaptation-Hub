// milsimBriefings — CRUD for MilsimBriefing entity
// CONF-010 fix: update handler now accepts both POST and PATCH
// Added: save-plan route for TacticalPlanner
import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";

Deno.serve(async (req: Request) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const url = new URL(req.url);
  const path = url.searchParams.get("path") ?? "";
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const base44 = createClientFromRequest(req);
    const asAdmin = base44.asServiceRole;

    // ── LIST ─────────────────────────────────────────────────
    if (path === "list") {
      const group_id = url.searchParams.get("group_id");
      if (!group_id) return json({ error: "group_id required" }, 400);
      const briefings = await asAdmin.entities.MilsimBriefing.filter({ group_id });
      return json({ briefings });
    }

    // ── CREATE ────────────────────────────────────────────────
    if (path === "create" && req.method === "POST") {
      const body = await req.json();
      const { group_id, created_by, title, op_id, content, classification, ao, objectives, comms_plan, roe, additional_notes, op_date } = body;
      if (!group_id || !title) return json({ error: "group_id and title required" }, 400);
      const briefing = await asAdmin.entities.MilsimBriefing.create({
        group_id,
        created_by: created_by ?? "",
        title,
        op_id: op_id ?? null,
        content: content ?? "",
        classification: classification ?? "unclassified",
        ao: ao ?? null,
        objectives: objectives ?? null,
        comms_plan: comms_plan ?? null,
        roe: roe ?? null,
        additional_notes: additional_notes ?? null,
        op_date: op_date ?? null,
      });
      return json({ briefing });
    }

    // ── UPDATE — accepts both POST and PATCH (CONF-010 fix) ───
    if (path === "update" && (req.method === "POST" || req.method === "PATCH")) {
      const body = await req.json();
      const id = body.id ?? url.searchParams.get("id");
      if (!id) return json({ error: "id required" }, 400);
      const { id: _id, ...updates } = body;
      const briefing = await asAdmin.entities.MilsimBriefing.update(id, updates);
      return json({ briefing });
    }

    // ── DELETE ────────────────────────────────────────────────
    if (path === "delete" && (req.method === "POST" || req.method === "DELETE")) {
      const body = req.method === "DELETE" ? {} : await req.json();
      const id = body.id ?? url.searchParams.get("id");
      if (!id) return json({ error: "id required" }, 400);
      await asAdmin.entities.MilsimBriefing.delete(id);
      return json({ ok: true });
    }

    // ── SAVE-PLAN — TacticalPlanner: upsert by group_id + op_id ──
    if (path === "save-plan" && req.method === "POST") {
      const body = await req.json();
      const { group_id, op_id, content, title } = body;
      if (!group_id) return json({ error: "group_id required" }, 400);
      // Look for existing briefing for this op
      const filter: Record<string, any> = { group_id };
      if (op_id) filter.op_id = op_id;
      const existing = await asAdmin.entities.MilsimBriefing.filter(filter);
      let briefing;
      if (existing && existing.length > 0) {
        briefing = await asAdmin.entities.MilsimBriefing.update(existing[0].id, { content: content ?? "", title: title ?? existing[0].title });
      } else {
        briefing = await asAdmin.entities.MilsimBriefing.create({
          group_id,
          op_id: op_id ?? null,
          title: title ?? "Battle Plan",
          content: content ?? "",
          classification: "unclassified",
          created_by: body.created_by ?? "",
        });
      }
      return json({ briefing });
    }

    // ── LINK OP ───────────────────────────────────────────────
    if (path === "link-op" && req.method === "POST") {
      const { briefing_id, op_id } = await req.json();
      if (!briefing_id) return json({ error: "briefing_id required" }, 400);
      await asAdmin.entities.MilsimBriefing.update(briefing_id, { op_id: op_id ?? null });
      return json({ ok: true });
    }

    return json({ error: "Unknown path" }, 404);
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
