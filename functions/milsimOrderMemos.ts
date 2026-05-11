import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.searchParams.get("path") ?? "";
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const client = createClientFromRequest(req);
  const db = client.entities.MilsimOrderMemo;

  try {
    // GET /milsimOrderMemos?path=group/:id  → list issued for group
    if (req.method === "GET" && path.startsWith("group/")) {
      const groupId = path.replace("group/", "");
      const items = await db.filter({ group_id: groupId });
      return Response.json(items, { headers: cors });
    }

    // GET /milsimOrderMemos?path=member/:groupId/:rosterId  → list for member (all + role/rank match)
    if (req.method === "GET" && path.startsWith("member/")) {
      const parts = path.replace("member/", "").split("/");
      const groupId = parts[0];
      const roleId  = parts[1] ?? "";
      const rankId  = parts[2] ?? "";
      const all = await db.filter({ group_id: groupId, status: "issued" });
      const visible = all.filter((m: any) => {
        if (m.audience === "all") return true;
        if (m.audience === "role"  && m.audience_role_id === roleId) return true;
        if (m.audience === "rank"  && m.audience_rank_id === rankId) return true;
        return false;
      });
      return Response.json(visible, { headers: cors });
    }

    // POST /milsimOrderMemos  → create
    if (req.method === "POST" && !path) {
      const body = await req.json();
      const created = await db.create(body);
      return Response.json(created, { status: 201, headers: cors });
    }

    // PATCH /milsimOrderMemos?path=:id  → update (status, ack etc)
    if (req.method === "PATCH" && path) {
      const body = await req.json();
      const updated = await db.update(path, body);
      return Response.json(updated, { headers: cors });
    }

    // DELETE /milsimOrderMemos?path=:id
    if (req.method === "DELETE" && path) {
      await db.delete(path);
      return Response.json({ ok: true }, { headers: cors });
    }

    return Response.json({ error: "Not found" }, { status: 404, headers: cors });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
});