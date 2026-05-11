// groupComms v3 — force register
import { createClientFromRequest } from "npm:@base44/sdk@0.2.0";
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

const JWT_SECRET = Deno.env.get("JWT_SECRET") ?? "change-me-prod-v2";

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["verify"]);
}

async function getCallerUser(base44: any, req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const key = await getCryptoKey(JWT_SECRET);
    const payload = await verify(token, key) as { sub: string };
    const user = await base44.asServiceRole.entities.AppUser.get(payload.sub);
    return user ?? null;
  } catch {
    return null;
  }
}

async function getRosterEntry(base44: any, groupId: string, userId: string) {
  const results = await base44.asServiceRole.entities.MilsimRoster.filter({ group_id: groupId, user_id: userId });
  return results?.[0] ?? null;
}

function canManageChannels(roster: any) {
  if (!roster) return false;
  const perms = roster.hq_permissions ?? [];
  return perms.includes("admin") || perms.includes("manage_channels") || roster.role_id === "owner";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Authorization,Content-Type", "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS" } });

  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const path = url.searchParams.get("path") ?? "";
    const parts = path.split("/").filter(Boolean);
    const method = req.method;

    const user = await getCallerUser(base44, req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers });

    // GET /channels?group_id=xxx
    if (method === "GET" && parts[0] === "channels") {
      const groupId = url.searchParams.get("group_id");
      if (!groupId) return Response.json({ error: "group_id required" }, { status: 400, headers });
      const roster = await getRosterEntry(base44, groupId, user.id);
      if (!roster || roster.status !== "active") return Response.json({ error: "Not a member" }, { status: 403, headers });
      const channels = await base44.asServiceRole.entities.GroupChannel.filter({ group_id: groupId });
      const visible = channels.filter((ch: any) => {
        const allowed = ch.allowed_role_ids ?? [];
        if (allowed.length === 0) return true;
        return allowed.includes(roster.role_id);
      });
      visible.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      return Response.json(visible, { headers });
    }

    // POST /channels — create channel
    if (method === "POST" && parts[0] === "channels") {
      const groupId = url.searchParams.get("group_id");
      if (!groupId) return Response.json({ error: "group_id required" }, { status: 400, headers });
      const roster = await getRosterEntry(base44, groupId, user.id);
      if (!canManageChannels(roster)) return Response.json({ error: "Insufficient permissions" }, { status: 403, headers });
      const body = await req.json().catch(() => ({}));
      const { name, description, category, channel_type, allowed_role_ids, is_readonly, sort_order } = body;
      if (!name) return Response.json({ error: "name required" }, { status: 400, headers });
      const channel = await base44.asServiceRole.entities.GroupChannel.create({
        group_id: groupId,
        name: name.trim(),
        description: description ?? "",
        category: category ?? "general",
        channel_type: channel_type ?? "text",
        allowed_role_ids: allowed_role_ids ?? [],
        is_readonly: is_readonly ?? false,
        sort_order: sort_order ?? 0,
        created_by: user.id,
        created_by_callsign: roster?.callsign ?? user.username,
      });
      return Response.json(channel, { status: 201, headers });
    }

    // PATCH /channels/:id
    if (method === "PATCH" && parts[0] === "channels" && parts[1]) {
      const channel = await base44.asServiceRole.entities.GroupChannel.get(parts[1]);
      if (!channel) return Response.json({ error: "Not found" }, { status: 404, headers });
      const roster = await getRosterEntry(base44, channel.group_id, user.id);
      if (!canManageChannels(roster)) return Response.json({ error: "Insufficient permissions" }, { status: 403, headers });
      const body = await req.json().catch(() => ({}));
      const updated = await base44.asServiceRole.entities.GroupChannel.update(parts[1], body);
      return Response.json(updated, { headers });
    }

    // DELETE /channels/:id
    if (method === "DELETE" && parts[0] === "channels" && parts[1]) {
      const channel = await base44.asServiceRole.entities.GroupChannel.get(parts[1]);
      if (!channel) return Response.json({ error: "Not found" }, { status: 404, headers });
      const roster = await getRosterEntry(base44, channel.group_id, user.id);
      if (!canManageChannels(roster)) return Response.json({ error: "Insufficient permissions" }, { status: 403, headers });
      const msgs = await base44.asServiceRole.entities.GroupMessage.filter({ channel_id: parts[1] });
      await Promise.all(msgs.map((m: any) => base44.asServiceRole.entities.GroupMessage.delete(m.id)));
      await base44.asServiceRole.entities.GroupChannel.delete(parts[1]);
      return new Response(null, { status: 204 });
    }

    // GET /messages?channel_id=xxx&limit=50
    if (method === "GET" && parts[0] === "messages") {
      const channelId = url.searchParams.get("channel_id");
      if (!channelId) return Response.json({ error: "channel_id required" }, { status: 400, headers });
      const channel = await base44.asServiceRole.entities.GroupChannel.get(channelId);
      if (!channel) return Response.json({ error: "Not found" }, { status: 404, headers });
      const roster = await getRosterEntry(base44, channel.group_id, user.id);
      if (!roster || roster.status !== "active") return Response.json({ error: "Not a member" }, { status: 403, headers });
      const allowed = channel.allowed_role_ids ?? [];
      if (allowed.length > 0 && !allowed.includes(roster.role_id)) return Response.json({ error: "No access" }, { status: 403, headers });
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
      const msgs = await base44.asServiceRole.entities.GroupMessage.filter({ channel_id: channelId }, { limit, sort: "-created_date" });
      const visible = (msgs ?? []).filter((m: any) => !m.deleted);
      visible.reverse();
      return Response.json(visible, { headers });
    }

    // POST /messages?channel_id=xxx
    if (method === "POST" && parts[0] === "messages") {
      const channelId = url.searchParams.get("channel_id");
      if (!channelId) return Response.json({ error: "channel_id required" }, { status: 400, headers });
      const channel = await base44.asServiceRole.entities.GroupChannel.get(channelId);
      if (!channel) return Response.json({ error: "Not found" }, { status: 404, headers });
      const roster = await getRosterEntry(base44, channel.group_id, user.id);
      if (!roster || roster.status !== "active") return Response.json({ error: "Not a member" }, { status: 403, headers });
      if (channel.is_readonly && !canManageChannels(roster)) return Response.json({ error: "Read-only channel" }, { status: 403, headers });
      const allowed = channel.allowed_role_ids ?? [];
      if (allowed.length > 0 && !allowed.includes(roster.role_id)) return Response.json({ error: "No access" }, { status: 403, headers });
      const body = await req.json().catch(() => ({}));
      const { content, image_url, mentions } = body;
      if (!content?.trim() && !image_url) return Response.json({ error: "content required" }, { status: 400, headers });
      let rankName = "";
      if (roster.rank_id) {
        try {
          const rank = await base44.asServiceRole.entities.MilsimRank.get(roster.rank_id);
          rankName = rank?.abbreviation ?? rank?.name ?? "";
        } catch { /* ignore */ }
      }
      const msg = await base44.asServiceRole.entities.GroupMessage.create({
        channel_id: channelId,
        group_id: channel.group_id,
        author_id: user.id,
        author_callsign: roster.callsign ?? user.username,
        author_rank: rankName,
        content: content?.trim() ?? "",
        image_url: image_url ?? "",
        mentions: mentions ?? [],
        is_pinned: false,
        deleted: false,
      });
      await base44.asServiceRole.entities.GroupChannel.update(channelId, {
        last_message_at: new Date().toISOString(),
        last_message_preview: (content ?? "").slice(0, 80),
      });
      return Response.json(msg, { status: 201, headers });
    }

    // DELETE /messages/:id
    if (method === "DELETE" && parts[0] === "messages" && parts[1]) {
      const msg = await base44.asServiceRole.entities.GroupMessage.get(parts[1]);
      if (!msg) return Response.json({ error: "Not found" }, { status: 404, headers });
      const roster = await getRosterEntry(base44, msg.group_id, user.id);
      if (msg.author_id !== user.id && !canManageChannels(roster)) return Response.json({ error: "Cannot delete" }, { status: 403, headers });
      await base44.asServiceRole.entities.GroupMessage.update(parts[1], { deleted: true, content: "[message deleted]" });
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: "Not found" }, { status: 404, headers });

  } catch (err: any) {
    return Response.json({ error: err.message ?? "Internal error" }, { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
});
