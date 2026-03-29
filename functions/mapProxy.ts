// mapProxy.ts — proxies map tile images from external sources to avoid CORS issues
// Supports: plan-ops.fr Arma 3 map screenshots via query params
import { base44 } from "../src/lib/base44Client";

const ALLOWED_HOSTS = [
  "atlas.plan-ops.fr",
  "reforger.recoil.org",
  "raw.githubusercontent.com",
  "i.imgur.com",
];

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const mapUrl = url.searchParams.get("url");

  if (!mapUrl) {
    return new Response(JSON.stringify({ error: "Missing ?url= param" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(mapUrl);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const hostAllowed = ALLOWED_HOSTS.some(
    (h) => parsedUrl.hostname === h || parsedUrl.hostname.endsWith("." + h)
  );

  if (!hostAllowed) {
    return new Response(JSON.stringify({ error: "Host not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const upstream = await fetch(mapUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TAG-MapProxy/1.0)",
        Accept: "image/*,*/*",
      },
    });

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: `Upstream ${upstream.status}` }), {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const body = await upstream.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
