import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";

function getPath(req: Request): string {
  const url = new URL(req.url);
  return url.searchParams.get("path") ?? "/";
}

function generateKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "tag_";
  for (let i = 0; i < 48; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

function generateSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let s = "whsec_";
  for (let i = 0; i < 32; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const base44 = createClientFromRequest(req);
  const path = getPath(req);

  try {
    // GET /keys?group_id=xxx — list keys for group (no raw key, just prefix + metadata)
    if (req.method === "GET" && path === "/keys") {
      const url = new URL(req.url);
      const groupId = url.searchParams.get("group_id");
      if (!groupId) return new Response(JSON.stringify({ error: "group_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const keys = await base44.asServiceRole.entities.MilsimApiKey.filter({ group_id: groupId });
      const safe = (keys ?? []).map((k: any) => ({
        id: k.id,
        label: k.label,
        key_prefix: k.key_prefix,
        is_active: k.is_active,
        last_used_at: k.last_used_at,
        created_date: k.created_date,
        // webhook_secret shown only once at create time
      }));
      return new Response(JSON.stringify(safe), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // POST /generate — create a new API key for a group
    if (req.method === "POST" && path === "/generate") {
      const body = await req.json();
      const { group_id, label } = body;
      if (!group_id) return new Response(JSON.stringify({ error: "group_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // Max 3 active keys per group
      const existing = await base44.asServiceRole.entities.MilsimApiKey.filter({ group_id, is_active: true });
      if ((existing ?? []).length >= 3) {
        return new Response(JSON.stringify({ error: "Maximum 3 active API keys per group. Revoke one first." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const rawKey = generateKey();
      const hash = await hashKey(rawKey);
      const prefix = rawKey.slice(0, 12) + "...";
      const webhookSecret = generateSecret();

      await base44.asServiceRole.entities.MilsimApiKey.create({
        group_id,
        key_hash: hash,
        key_prefix: prefix,
        webhook_secret: webhookSecret,
        label: label || "Default",
        is_active: true,
        last_used_at: null,
      });

      // Return the raw key ONCE — never stored
      return new Response(JSON.stringify({
        raw_key: rawKey,
        webhook_secret: webhookSecret,
        prefix,
        label: label || "Default",
        warning: "Save this key now — it will not be shown again.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // POST /revoke — deactivate a key by id
    if (req.method === "POST" && path === "/revoke") {
      const body = await req.json();
      const { key_id } = body;
      if (!key_id) return new Response(JSON.stringify({ error: "key_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      await base44.asServiceRole.entities.MilsimApiKey.update(key_id, { is_active: false });
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // POST /verify — validate an API key (used by other functions to authenticate API consumers)
    if (req.method === "POST" && path === "/verify") {
      const body = await req.json();
      const { api_key } = body;
      if (!api_key) return new Response(JSON.stringify({ valid: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const hash = await hashKey(api_key);
      const keys = await base44.asServiceRole.entities.MilsimApiKey.filter({ key_hash: hash, is_active: true });
      if (!keys || keys.length === 0) {
        return new Response(JSON.stringify({ valid: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      // Update last_used_at
      await base44.asServiceRole.entities.MilsimApiKey.update(keys[0].id, { last_used_at: new Date().toISOString() });
      return new Response(JSON.stringify({ valid: true, group_id: keys[0].group_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
