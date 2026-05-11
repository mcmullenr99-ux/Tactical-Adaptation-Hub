// mapProxy.ts — proxies map tile images from external sources to avoid CORS issues
// Supports: plan-ops.fr Arma 3 map screenshots via query params
const ALLOWED_HOSTS = [
  "atlas.plan-ops.fr",
  "reforger.recoil.org",
  "raw.githubusercontent.com",
  "i.imgur.com",
];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const mapUrl = url.searchParams.get("url");

  if (!mapUrl) {
    return new Response(JSON.stringify({ error: "Missing ?url= param" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(mapUrl);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  const hostAllowed = ALLOWED_HOSTS.some(
    (h) => parsedUrl.hostname === h || parsedUrl.hostname.endsWith("." + h)
  );

  if (!hostAllowed) {
    return new Response(JSON.stringify({ error: "Host not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
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
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const body = await upstream.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        ...CORS_HEADERS,
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});
