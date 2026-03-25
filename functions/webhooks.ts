import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";

// ─── Supported webhook events ──────────────────────────────────────────────
export const WEBHOOK_EVENTS = [
  "application.submitted",
  "application.approved",
  "application.rejected",
  "roster.member_joined",
  "roster.member_left",
  "roster.rank_changed",
  "roster.status_changed",
  "op.created",
  "op.status_changed",
  "op.completed",
  "aar.posted",
  "loa.submitted",
  "loa.approved",
  "loa.expired",
  "award.granted",
  "briefing.published",
];

function getPath(req: Request): string {
  return new URL(req.url).searchParams.get("path") ?? "/";
}

// ─── HMAC-SHA256 signature ─────────────────────────────────────────────────
async function signPayload(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return "sha256=" + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ─── Deliver a webhook to a single endpoint ───────────────────────────────
async function deliver(endpoint: any, event: string, payload: object): Promise<{ ok: boolean; status?: number; error?: string }> {
  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    group_id: endpoint.group_id,
    data: payload,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "TAG-Webhooks/1.0",
    "X-TAG-Event": event,
    "X-TAG-Delivery": crypto.randomUUID(),
  };

  if (endpoint.secret) {
    headers["X-TAG-Signature"] = await signPayload(endpoint.secret, body);
  }

  try {
    const res = await fetch(endpoint.url, { method: "POST", headers, body, signal: AbortSignal.timeout(10000) });
    return { ok: res.ok, status: res.status };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// ─── Fire event to all matching endpoints for a group ─────────────────────
export async function fireWebhookEvent(base44: any, groupId: string, event: string, payload: object): Promise<void> {
  const endpoints = await base44.asServiceRole.entities.WebhookEndpoint.filter({ group_id: groupId, is_active: true });
  if (!endpoints || endpoints.length === 0) return;

  const targets = endpoints.filter((ep: any) => !ep.events || ep.events.length === 0 || ep.events.includes(event));

  await Promise.allSettled(targets.map(async (ep: any) => {
    const result = await deliver(ep, event, payload);
    await base44.asServiceRole.entities.WebhookEndpoint.update(ep.id, {
      last_triggered_at: new Date().toISOString(),
      last_status_code: result.status ?? null,
      last_error: result.error ?? null,
      delivery_count: (ep.delivery_count ?? 0) + 1,
      failure_count: result.ok ? (ep.failure_count ?? 0) : (ep.failure_count ?? 0) + 1,
    });
  }));
}

// ─── HTTP handler ──────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const base44 = createClientFromRequest(req);
  const path = getPath(req);
  const url = new URL(req.url);
  const json = (data: object, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    // GET /endpoints?group_id=xxx — list webhook endpoints
    if (req.method === "GET" && path === "/endpoints") {
      const groupId = url.searchParams.get("group_id");
      if (!groupId) return json({ error: "group_id required" }, 400);
      const eps = await base44.asServiceRole.entities.WebhookEndpoint.filter({ group_id: groupId });
      // Never expose the secret
      const safe = (eps ?? []).map((ep: any) => ({
        id: ep.id,
        label: ep.label,
        url: ep.url,
        events: ep.events ?? [],
        is_active: ep.is_active,
        last_triggered_at: ep.last_triggered_at,
        last_status_code: ep.last_status_code,
        last_error: ep.last_error,
        delivery_count: ep.delivery_count ?? 0,
        failure_count: ep.failure_count ?? 0,
        created_date: ep.created_date,
      }));
      return json(safe);
    }

    // POST /endpoints — register a new webhook endpoint
    if (req.method === "POST" && path === "/endpoints") {
      const body = await req.json();
      const { group_id, label, webhook_url, events } = body;
      if (!group_id || !webhook_url) return json({ error: "group_id and webhook_url required" }, 400);

      // Validate URL
      try { new URL(webhook_url); } catch { return json({ error: "Invalid URL" }, 400); }

      // Max 5 endpoints per group
      const existing = await base44.asServiceRole.entities.WebhookEndpoint.filter({ group_id, is_active: true });
      if ((existing ?? []).length >= 5) return json({ error: "Maximum 5 active webhook endpoints per group" }, 400);

      // Validate events
      const validEvents = (events ?? []).filter((e: string) => WEBHOOK_EVENTS.includes(e));

      // Generate a signing secret
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let secret = "whsec_";
      for (let i = 0; i < 32; i++) secret += chars[Math.floor(Math.random() * chars.length)];

      const ep = await base44.asServiceRole.entities.WebhookEndpoint.create({
        group_id,
        label: label || "My Endpoint",
        url: webhook_url,
        events: validEvents,
        secret,
        is_active: true,
        delivery_count: 0,
        failure_count: 0,
      });

      return json({ ...ep, secret, message: "Save the signing secret — it won't be shown again." });
    }

    // PATCH /endpoints/:id — update events list or label
    if (req.method === "PATCH" && path.startsWith("/endpoints/")) {
      const id = path.replace("/endpoints/", "");
      const body = await req.json();
      const updates: any = {};
      if (body.label !== undefined) updates.label = body.label;
      if (body.events !== undefined) updates.events = (body.events ?? []).filter((e: string) => WEBHOOK_EVENTS.includes(e));
      if (body.is_active !== undefined) updates.is_active = body.is_active;
      await base44.asServiceRole.entities.WebhookEndpoint.update(id, updates);
      return json({ ok: true });
    }

    // DELETE /endpoints/:id — remove endpoint
    if (req.method === "DELETE" && path.startsWith("/endpoints/")) {
      const id = path.replace("/endpoints/", "");
      await base44.asServiceRole.entities.WebhookEndpoint.update(id, { is_active: false });
      return json({ ok: true });
    }

    // POST /test — send a test ping to an endpoint
    if (req.method === "POST" && path === "/test") {
      const body = await req.json();
      const { endpoint_id } = body;
      if (!endpoint_id) return json({ error: "endpoint_id required" }, 400);

      const eps = await base44.asServiceRole.entities.WebhookEndpoint.filter({ id: endpoint_id });
      if (!eps || eps.length === 0) return json({ error: "Endpoint not found" }, 404);

      const ep = eps[0];
      const result = await deliver(ep, "test.ping", {
        message: "This is a test delivery from TAG Webhooks.",
        group_id: ep.group_id,
      });

      await base44.asServiceRole.entities.WebhookEndpoint.update(ep.id, {
        last_triggered_at: new Date().toISOString(),
        last_status_code: result.status ?? null,
        last_error: result.error ?? null,
        delivery_count: (ep.delivery_count ?? 0) + 1,
        failure_count: result.ok ? (ep.failure_count ?? 0) : (ep.failure_count ?? 0) + 1,
      });

      return json({ ok: result.ok, status: result.status, error: result.error });
    }

    // POST /fire — internal use: fire an event to all group endpoints
    if (req.method === "POST" && path === "/fire") {
      const body = await req.json();
      const { group_id, event, payload } = body;
      if (!group_id || !event) return json({ error: "group_id and event required" }, 400);
      if (!WEBHOOK_EVENTS.includes(event) && event !== "test.ping") return json({ error: "Unknown event type" }, 400);
      await fireWebhookEvent(base44, group_id, event, payload ?? {});
      return json({ ok: true });
    }

    // GET /events — list all supported event types
    if (req.method === "GET" && path === "/events") {
      return json({ events: WEBHOOK_EVENTS });
    }

    return json({ error: "Not found" }, 404);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
