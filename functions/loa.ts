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

    // ── LIST ────────────────────────────────────────────────
    if (path === "list") {
      const group_id = url.searchParams.get("group_id");
      if (!group_id) return new Response(JSON.stringify({ error: "group_id required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

      // Auto-expire stale LOAs
      const all = await asAdmin.entities.MilsimLOA.filter({ group_id });
      const today = new Date().toISOString().split("T")[0];
      for (const loa of all) {
        if (loa.status === "Active" && loa.end_date < today) {
          await asAdmin.entities.MilsimLOA.update(loa.id, { status: "Expired" });
          loa.status = "Expired";
        }
      }

      return new Response(JSON.stringify({ loas: all }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ── GRANT ───────────────────────────────────────────────
    if (path === "grant" && req.method === "POST") {
      const body = await req.json();
      const { group_id, roster_id, callsign, user_id, reason_category, reason_detail, start_date, end_date, notes, granted_by, granted_by_username } = body;
      if (!group_id || !roster_id || !end_date) return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

      // Revoke any existing active LOA for this member
      const existing = await asAdmin.entities.MilsimLOA.filter({ group_id, roster_id, status: "Active" });
      for (const e of existing) await asAdmin.entities.MilsimLOA.update(e.id, { status: "Revoked" });

      const loa = await asAdmin.entities.MilsimLOA.create({
        group_id, roster_id, user_id: user_id ?? "", callsign: callsign ?? "",
        reason_category: reason_category ?? "Other", reason_detail: reason_detail ?? "",
        start_date: start_date ?? new Date().toISOString().split("T")[0],
        end_date, notes: notes ?? "",
        status: "Active",
        granted_by: granted_by ?? "", granted_by_username: granted_by_username ?? "",
      });

      return new Response(JSON.stringify({ loa }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ── REVOKE ──────────────────────────────────────────────
    if (path === "revoke" && req.method === "POST") {
      const { loa_id } = await req.json();
      await asAdmin.entities.MilsimLOA.update(loa_id, { status: "Revoked" });
      return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ── REQUEST EXTENSION ───────────────────────────────────
    if (path === "request-extension" && req.method === "POST") {
      const { loa_id, extension_requested_until, extension_reason } = await req.json();
      if (!loa_id || !extension_requested_until || !extension_reason)
        return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

      await asAdmin.entities.MilsimLOA.update(loa_id, {
        status: "Extension Requested",
        extension_requested_until, extension_reason,
        extension_status: "Pending",
      });
      return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ── REVIEW EXTENSION ────────────────────────────────────
    if (path === "review-extension" && req.method === "POST") {
      const { loa_id, approve, reviewed_by } = await req.json();
      const loa = await asAdmin.entities.MilsimLOA.get(loa_id);
      if (!loa) return new Response(JSON.stringify({ error: "LOA not found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });

      if (approve) {
        await asAdmin.entities.MilsimLOA.update(loa_id, {
          end_date: loa.extension_requested_until,
          status: "Active",
          extension_status: "Approved",
          extension_reviewed_by: reviewed_by ?? "",
        });
      } else {
        await asAdmin.entities.MilsimLOA.update(loa_id, {
          status: "Active",
          extension_status: "Denied",
          extension_reviewed_by: reviewed_by ?? "",
        });
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown path" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
