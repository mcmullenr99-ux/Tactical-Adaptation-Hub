// rangeCards — Range Card CRUD — build:20260411b
import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";

function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    },
  });
}
function fail(msg: string, status = 400) { return ok({ error: msg }, status); }

async function getUser(req: Request) {
  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const p = JSON.parse(atob(parts[1]));
    const id = p.sub ?? p.user_id ?? p.id;
    return id ? { id, role: p.role ?? "user" } : null;
  } catch { return null; }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return ok("", 204);

  const base44 = createClientFromRequest(req);
  const db = base44.asServiceRole.entities;

  const url = new URL(req.url);
  const raw = (url.searchParams.get("path") ?? "").replace(/^\//, "");
  const parts = raw.split("/").filter(Boolean);
  const method = req.method.toUpperCase();

  const user = await getUser(req);

  // GET /:groupId/range-cards
  if (method === "GET" && parts.length === 2 && parts[1] === "range-cards") {
    if (!user) return fail("Unauthorised", 401);
    const groupId = parts[0];
    const roster = await db.MilsimRoster.filter({ group_id: groupId, user_id: user.id }).catch(() => []);
    if (!roster?.length && user.role !== "admin") return fail("Unauthorised", 401);
    const cards = await db.MilsimRangeCard.filter({ group_id: groupId });
    return ok(cards ?? []);
  }

  // POST /:groupId/range-cards
  if (method === "POST" && parts.length === 2 && parts[1] === "range-cards") {
    if (!user) return fail("Unauthorised", 401);
    const groupId = parts[0];
    const roster = await db.MilsimRoster.filter({ group_id: groupId, user_id: user.id }).catch(() => []);
    if (!roster?.length && user.role !== "admin") return fail("Unauthorised", 401);
    const body = await req.json();
    const card = await db.MilsimRangeCard.create({
      group_id: groupId, group_name: body.group_name ?? "",
      title: body.title ?? "Range Card",
      own_position_gr: body.own_position_gr ?? "",
      aiming_point: body.aiming_point ?? "",
      aiming_gr: body.aiming_gr ?? "",
      aiming_bearings: body.aiming_bearings ?? "",
      aiming_descrip: body.aiming_descrip ?? "",
      aiming_range: body.aiming_range ?? "",
      made_out_by: body.made_out_by ?? "",
      made_out_by_id: user.id,
      date: body.date ?? new Date().toISOString().slice(0, 10),
      map_sheet: body.map_sheet ?? "",
      scale: body.scale ?? "1:50000",
      max_range_m: body.max_range_m ?? 600,
      targets: body.targets ?? [],
      status: "saved",
    });
    return ok(card, 201);
  }

  // PATCH /:groupId/range-cards/:cardId
  if (method === "PATCH" && parts.length === 3 && parts[1] === "range-cards") {
    if (!user) return fail("Unauthorised", 401);
    const groupId = parts[0]; const cardId = parts[2];
    const roster = await db.MilsimRoster.filter({ group_id: groupId, user_id: user.id }).catch(() => []);
    if (!roster?.length && user.role !== "admin") return fail("Unauthorised", 401);
    const body = await req.json();
    const updated = await db.MilsimRangeCard.update(cardId, body);
    return ok(updated);
  }

  // DELETE /:groupId/range-cards/:cardId
  if (method === "DELETE" && parts.length === 3 && parts[1] === "range-cards") {
    if (!user) return fail("Unauthorised", 401);
    const groupId = parts[0]; const cardId = parts[2];
    const roster = await db.MilsimRoster.filter({ group_id: groupId, user_id: user.id }).catch(() => []);
    if (!roster?.length && user.role !== "admin") return fail("Unauthorised", 401);
    await db.MilsimRangeCard.delete(cardId);
    return ok({ ok: true });
  }

  return fail("Not found", 404);
});
