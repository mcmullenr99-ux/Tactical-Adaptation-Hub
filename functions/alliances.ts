import base44 from "./base44-sdk-stub.ts";

// alliances — Allied Units system for TAG
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.searchParams.get("path") ?? "";
  const method = req.method;

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return json({ error: "Unauthorized" }, 401);

  let currentUser: any = null;
  try { currentUser = await base44.auth.getUser(token); } catch { return json({ error: "Unauthorized" }, 401); }
  if (!currentUser?.id) return json({ error: "Unauthorized" }, 401);

  const db = base44.asServiceRole;

  if (method === "GET" && path === "list") {
    const groupId = url.searchParams.get("group_id");
    if (!groupId) return json({ error: "group_id required" }, 400);
    const [asRequester, asAddressee] = await Promise.all([
      db.entities.UnitAlliance.filter({ requester_group_id: groupId }),
      db.entities.UnitAlliance.filter({ addressee_group_id: groupId }),
    ]);
    return json([...(asRequester ?? []), ...(asAddressee ?? [])]);
  }

  if (method === "GET" && path === "pending") {
    const groupId = url.searchParams.get("group_id");
    if (!groupId) return json({ error: "group_id required" }, 400);
    const pending = await db.entities.UnitAlliance.filter({ addressee_group_id: groupId, status: "pending" });
    return json(pending ?? []);
  }

  if (method === "POST" && path === "request") {
    const body = await req.json();
    const { requester_group_id, requester_group_name, requester_group_tag, requester_logo_url,
            addressee_group_id, addressee_group_name, addressee_group_tag, addressee_logo_url, message } = body;
    if (!requester_group_id || !addressee_group_id) return json({ error: "Both group IDs required" }, 400);
    if (requester_group_id === addressee_group_id) return json({ error: "Cannot ally with yourself" }, 400);
    const [fwd, rev] = await Promise.all([
      db.entities.UnitAlliance.filter({ requester_group_id, addressee_group_id }),
      db.entities.UnitAlliance.filter({ requester_group_id: addressee_group_id, addressee_group_id: requester_group_id }),
    ]);
    const live = [...(fwd ?? []), ...(rev ?? [])].find((a: any) => a.status === "active" || a.status === "pending");
    if (live) return json({ error: "Alliance already exists or pending" }, 409);
    const [roster, group] = await Promise.all([
      db.entities.MilsimRoster.filter({ group_id: requester_group_id, user_id: currentUser.id }),
      db.entities.MilsimGroup.get(requester_group_id).catch(() => null),
    ]);
    const entry = (roster ?? [])[0];
    const isOwner = (group as any)?.owner_id === currentUser.id;
    const hasPerm = isOwner || (entry?.hq_permissions ?? []).includes("manage_alliances") || (entry?.hq_permissions ?? []).includes("manage_group");
    if (!hasPerm) return json({ error: "Insufficient permissions" }, 403);
    const alliance = await db.entities.UnitAlliance.create({
      requester_group_id, requester_group_name: requester_group_name ?? "",
      requester_group_tag: requester_group_tag ?? "", requester_logo_url: requester_logo_url ?? "",
      addressee_group_id, addressee_group_name: addressee_group_name ?? "",
      addressee_group_tag: addressee_group_tag ?? "", addressee_logo_url: addressee_logo_url ?? "",
      status: "pending", message: message ?? "",
    });
    try {
      const ag: any = await db.entities.MilsimGroup.get(addressee_group_id).catch(() => null);
      if (ag?.owner_id) await db.entities.Notification.create({
        user_id: ag.owner_id, type: "alliance_request", title: "Alliance Request",
        body: `${requester_group_name ?? "A unit"} has sent your unit an alliance request.`,
        link: `/portal/manage/${addressee_group_id}?tab=alliances`, is_read: false,
      });
    } catch {}
    return json(alliance, 201);
  }

  if (method === "POST" && path === "respond") {
    const { alliance_id, action, group_id } = await req.json();
    if (!alliance_id || !action) return json({ error: "alliance_id and action required" }, 400);
    const alliance: any = await db.entities.UnitAlliance.get(alliance_id).catch(() => null);
    if (!alliance) return json({ error: "Alliance not found" }, 404);
    if (alliance.addressee_group_id !== group_id) return json({ error: "Only the addressee can respond" }, 403);
    if (alliance.status !== "pending") return json({ error: "Already responded" }, 409);
    const [roster, group] = await Promise.all([
      db.entities.MilsimRoster.filter({ group_id, user_id: currentUser.id }),
      db.entities.MilsimGroup.get(group_id).catch(() => null),
    ]);
    const entry = (roster ?? [])[0];
    const isOwner = (group as any)?.owner_id === currentUser.id;
    const hasPerm = isOwner || (entry?.hq_permissions ?? []).includes("manage_alliances") || (entry?.hq_permissions ?? []).includes("manage_group");
    if (!hasPerm) return json({ error: "Insufficient permissions" }, 403);
    const updated = await db.entities.UnitAlliance.update(alliance_id, { status: action === "accept" ? "active" : "rejected", responded_at: new Date().toISOString() });
    try {
      const rg: any = await db.entities.MilsimGroup.get(alliance.requester_group_id).catch(() => null);
      if (rg?.owner_id) await db.entities.Notification.create({
        user_id: rg.owner_id, type: "alliance_response",
        title: action === "accept" ? "Alliance Accepted" : "Alliance Rejected",
        body: action === "accept"
          ? `${alliance.addressee_group_name ?? "A unit"} has accepted your alliance request.`
          : `${alliance.addressee_group_name ?? "A unit"} has declined your alliance request.`,
        link: `/portal/manage/${alliance.requester_group_id}?tab=alliances`, is_read: false,
      });
    } catch {}
    return json(updated);
  }

  if (method === "POST" && path === "dissolve") {
    const { alliance_id, group_id } = await req.json();
    if (!alliance_id || !group_id) return json({ error: "alliance_id and group_id required" }, 400);
    const alliance: any = await db.entities.UnitAlliance.get(alliance_id).catch(() => null);
    if (!alliance) return json({ error: "Alliance not found" }, 404);
    if (alliance.requester_group_id !== group_id && alliance.addressee_group_id !== group_id) return json({ error: "Not part of this alliance" }, 403);
    const [roster, group] = await Promise.all([
      db.entities.MilsimRoster.filter({ group_id, user_id: currentUser.id }),
      db.entities.MilsimGroup.get(group_id).catch(() => null),
    ]);
    const entry = (roster ?? [])[0];
    const isOwner = (group as any)?.owner_id === currentUser.id;
    const hasPerm = isOwner || (entry?.hq_permissions ?? []).includes("manage_alliances") || (entry?.hq_permissions ?? []).includes("manage_group");
    if (!hasPerm) return json({ error: "Insufficient permissions" }, 403);
    return json(await db.entities.UnitAlliance.update(alliance_id, {
      status: "rejected", dissolved_at: new Date().toISOString(), dissolved_by_group_id: group_id,
    }));
  }

  return json({ error: "Not found" }, 404);
}

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}
