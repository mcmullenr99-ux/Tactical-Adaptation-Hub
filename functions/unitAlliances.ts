// unitAlliances — Allied Units system — build:20260510a
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Authorization,Content-Type",
    },
  });
}

async function getUser(base44: any, req: Request) {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    return await base44.asServiceRole.entities.AppUser.get(payload.sub) ?? null;
  } catch { return null; }
}

async function checkPerm(base44: any, groupId: string, userId: string): Promise<boolean> {
  const [roster, group] = await Promise.all([
    base44.asServiceRole.entities.MilsimRoster.filter({ group_id: groupId, user_id: userId }),
    base44.asServiceRole.entities.MilsimGroup.get(groupId).catch(() => null),
  ]);
  const entry = (roster ?? [])[0];
  return (group as any)?.owner_id === userId
    || (entry?.hq_permissions ?? []).includes("manage_alliances")
    || (entry?.hq_permissions ?? []).includes("manage_group");
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return json(null, 204);

  const url = new URL(req.url);
  const path = url.searchParams.get("path") ?? "";
  const method = req.method;
  const base44 = createClientFromRequest(req);

  // GET list — all alliances for a group (no auth required for public view)
  if (method === "GET" && path === "list") {
    const gid = url.searchParams.get("group_id");
    if (!gid) return json({ error: "group_id required" }, 400);
    const [a, b] = await Promise.all([
      base44.asServiceRole.entities.UnitAlliance.filter({ requester_group_id: gid }),
      base44.asServiceRole.entities.UnitAlliance.filter({ addressee_group_id: gid }),
    ]);
    return json([...(a ?? []), ...(b ?? [])]);
  }

  // GET pending — incoming requests for a group
  if (method === "GET" && path === "pending") {
    const gid = url.searchParams.get("group_id");
    if (!gid) return json({ error: "group_id required" }, 400);
    return json((await base44.asServiceRole.entities.UnitAlliance.filter({ addressee_group_id: gid, status: "pending" })) ?? []);
  }

  // All write operations require auth
  const me = await getUser(base44, req);
  if (!me?.id) return json({ error: "Unauthorized" }, 401);

  // POST request — send alliance request
  if (method === "POST" && path === "request") {
    const body = await req.json();
    const { requester_group_id: rgid, requester_group_name: rname, requester_group_tag: rtag,
            requester_logo_url: rlogo, addressee_group_id: agid, addressee_group_name: aname,
            addressee_group_tag: atag, addressee_logo_url: alogo, message } = body;
    if (!rgid || !agid) return json({ error: "Both group IDs required" }, 400);
    if (rgid === agid) return json({ error: "Cannot ally with yourself" }, 400);
    const [fwd, rev] = await Promise.all([
      base44.asServiceRole.entities.UnitAlliance.filter({ requester_group_id: rgid, addressee_group_id: agid }),
      base44.asServiceRole.entities.UnitAlliance.filter({ requester_group_id: agid, addressee_group_id: rgid }),
    ]);
    if ([...(fwd ?? []), ...(rev ?? [])].find((x: any) => x.status === "active" || x.status === "pending"))
      return json({ error: "Alliance already exists or pending" }, 409);
    if (!(await checkPerm(base44, rgid, me.id))) return json({ error: "Insufficient permissions" }, 403);
    const rec = await base44.asServiceRole.entities.UnitAlliance.create({
      requester_group_id: rgid, requester_group_name: rname ?? "",
      requester_group_tag: rtag ?? "", requester_logo_url: rlogo ?? "",
      addressee_group_id: agid, addressee_group_name: aname ?? "",
      addressee_group_tag: atag ?? "", addressee_logo_url: alogo ?? "",
      status: "pending", message: message ?? "",
    });
    try {
      const ag: any = await base44.asServiceRole.entities.MilsimGroup.get(agid).catch(() => null);
      if (ag?.owner_id) await base44.asServiceRole.entities.Notification.create({
        user_id: ag.owner_id, type: "alliance_request", title: "Alliance Request",
        body: `${rname ?? "A unit"} has sent your unit an alliance request.`,
        link: `/portal/manage/${agid}?tab=alliances`, is_read: false,
      });
    } catch {}
    return json(rec, 201);
  }

  // POST respond — accept or reject
  if (method === "POST" && path === "respond") {
    const { alliance_id, action, group_id } = await req.json();
    if (!alliance_id || !action) return json({ error: "alliance_id and action required" }, 400);
    const al: any = await base44.asServiceRole.entities.UnitAlliance.get(alliance_id).catch(() => null);
    if (!al) return json({ error: "Alliance not found" }, 404);
    if (al.addressee_group_id !== group_id) return json({ error: "Only the addressee can respond" }, 403);
    if (al.status !== "pending") return json({ error: "Already responded" }, 409);
    if (!(await checkPerm(base44, group_id, me.id))) return json({ error: "Insufficient permissions" }, 403);
    const updated = await base44.asServiceRole.entities.UnitAlliance.update(alliance_id, {
      status: action === "accept" ? "active" : "rejected",
      responded_at: new Date().toISOString(),
    });
    try {
      const rg: any = await base44.asServiceRole.entities.MilsimGroup.get(al.requester_group_id).catch(() => null);
      if (rg?.owner_id) await base44.asServiceRole.entities.Notification.create({
        user_id: rg.owner_id, type: "alliance_response",
        title: action === "accept" ? "Alliance Accepted" : "Alliance Rejected",
        body: action === "accept"
          ? `${al.addressee_group_name ?? "A unit"} has accepted your alliance request.`
          : `${al.addressee_group_name ?? "A unit"} has declined your alliance request.`,
        link: `/portal/manage/${al.requester_group_id}?tab=alliances`, is_read: false,
      });
    } catch {}
    return json(updated);
  }

  // POST dissolve — end an active alliance
  if (method === "POST" && path === "dissolve") {
    const { alliance_id, group_id } = await req.json();
    if (!alliance_id || !group_id) return json({ error: "alliance_id and group_id required" }, 400);
    const al: any = await base44.asServiceRole.entities.UnitAlliance.get(alliance_id).catch(() => null);
    if (!al) return json({ error: "Alliance not found" }, 404);
    if (al.requester_group_id !== group_id && al.addressee_group_id !== group_id)
      return json({ error: "Not part of this alliance" }, 403);
    if (!(await checkPerm(base44, group_id, me.id))) return json({ error: "Insufficient permissions" }, 403);
    return json(await base44.asServiceRole.entities.UnitAlliance.update(alliance_id, {
      status: "rejected",
      dissolved_at: new Date().toISOString(),
      dissolved_by_group_id: group_id,
    }));
  }

  return json({ error: "Not found" }, 404);
});
