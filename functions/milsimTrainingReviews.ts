// milsimTrainingReviews — renamed from milsimTrainingReview (singular) to match frontend calls
// CONF-011 fix: name mismatch + route mismatch resolved
// Frontend calls: GET /milsimTrainingReviews?group_id=X, POST /milsimTrainingReviews
import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";

Deno.serve(async (req: Request) => {
  const base44 = createClientFromRequest(req);
  const url = new URL(req.url);
  const path = url.searchParams.get("path") ?? "";
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    // GET /milsimTrainingReviews?group_id=X  (no path param — direct group_id query)
    // OR GET /milsimTrainingReviews?path=list&group_id=X
    if (req.method === "GET" && (path === "" || path === "list")) {
      const group_id = url.searchParams.get("group_id");
      const records = await base44.asServiceRole.entities.MilsimTrainingReview.filter(
        group_id ? { group_id } : {},
        { sort: "-created_date" }
      );
      // Return both formats: array directly AND { reviews: [...] }
      // Frontend expects array (Array.isArray(r)) OR r?.items fallback
      return json(records);
    }

    // POST /milsimTrainingReviews  — create new review
    if (req.method === "POST" && (path === "" || path === "create")) {
      const body = await req.json();
      const record = await base44.asServiceRole.entities.MilsimTrainingReview.create(body);
      return json({ review: record }, 201);
    }

    // PATCH /milsimTrainingReviews?path=:id  — update review
    if (req.method === "PATCH" && path) {
      const body = await req.json();
      const updated = await base44.asServiceRole.entities.MilsimTrainingReview.update(path, body);
      return json({ review: updated });
    }

    // DELETE /milsimTrainingReviews?path=:id
    if (req.method === "DELETE" && path) {
      await base44.asServiceRole.entities.MilsimTrainingReview.delete(path);
      return json({ ok: true });
    }

    // Legacy path=delete (POST body with id)
    if (path === "delete" && req.method === "POST") {
      const body = await req.json();
      await base44.asServiceRole.entities.MilsimTrainingReview.delete(body.id);
      return json({ ok: true });
    }

    return json({ error: "Unknown path" }, 400);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
