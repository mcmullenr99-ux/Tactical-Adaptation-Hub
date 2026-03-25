import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";

Deno.serve(async (req: Request) => {
  const base44 = createClientFromRequest(req);
  const url = new URL(req.url);
  const path = url.searchParams.get("path") ?? "";

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    // GET /upvotes/:groupId — get upvote count + whether current user has voted
    if (req.method === "GET" && path.startsWith("/upvotes/")) {
      const groupId = path.replace("/upvotes/", "");
      const votes = await base44.asServiceRole.entities.GroupUpvote.filter({ group_id: groupId });
      let myVote = false;
      try {
        const me = await base44.auth.getUser();
        myVote = votes.some((v: any) => v.user_id === me.id);
      } catch {}
      return json({ count: votes.length, voted: myVote });
    }

    // GET /my-votes — all group_ids the current user has upvoted
    if (req.method === "GET" && path === "/my-votes") {
      const me = await base44.auth.getUser();
      const votes = await base44.asServiceRole.entities.GroupUpvote.filter({ user_id: me.id });
      return json({ voted_group_ids: votes.map((v: any) => v.group_id) });
    }

    // GET /counts — upvote counts for all groups (for registry sorting)
    if (req.method === "GET" && path === "/counts") {
      const all = await base44.asServiceRole.entities.GroupUpvote.list();
      const counts: Record<string, number> = {};
      for (const v of all) {
        counts[v.group_id] = (counts[v.group_id] ?? 0) + 1;
      }
      return json(counts);
    }

    // POST /upvotes/:groupId — cast or retract vote (toggle)
    if (req.method === "POST" && path.startsWith("/upvotes/")) {
      const groupId = path.replace("/upvotes/", "");
      const me = await base44.auth.getUser();

      // Check if already voted
      const existing = await base44.asServiceRole.entities.GroupUpvote.filter({ group_id: groupId, user_id: me.id });
      if (existing.length > 0) {
        // Retract
        await base44.asServiceRole.entities.GroupUpvote.delete(existing[0].id);
        const newCount = (await base44.asServiceRole.entities.GroupUpvote.filter({ group_id: groupId })).length;
        return json({ voted: false, count: newCount });
      } else {
        // Cast
        await base44.asServiceRole.entities.GroupUpvote.create({ group_id: groupId, user_id: me.id, username: me.username ?? "" });
        const newCount = (await base44.asServiceRole.entities.GroupUpvote.filter({ group_id: groupId })).length;
        return json({ voted: true, count: newCount });
      }
    }

    return json({ error: "Not found" }, 404);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
