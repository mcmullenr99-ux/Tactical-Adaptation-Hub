import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";

const BASE44_APP_ID = "69bf52c997cae5d4cff87ae4";

Deno.serve(async (req: Request) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const base44 = createClientFromRequest(req);
    const asAdmin = base44.asServiceRole;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rankId = formData.get("rank_id") as string | null;

    if (!file) return new Response(JSON.stringify({ error: "No file provided" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

    // Get service token from env
    const serviceToken = Deno.env.get("BASE44_SERVICE_TOKEN") ?? "";

    // Upload to Base44 public file storage
    const uploadForm = new FormData();
    uploadForm.append("file", file, file.name || "rank-icon.png");

    const uploadRes = await fetch(`https://base44.app/api/apps/${BASE44_APP_ID}/integration-endpoints/Core/UploadFile`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${serviceToken}` },
      body: uploadForm,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`File upload failed (${uploadRes.status}): ${errText}`);
    }

    const uploadData = await uploadRes.json();
    let iconUrl: string | null = uploadData.file_url ?? uploadData.url ?? null;
    if (!iconUrl) throw new Error("No URL returned from upload");
    // Rewrite internal Base44 API URL to public CDN URL
    const internalMatch = iconUrl.match(/\/api\/apps\/([^\/]+)\/files\/mp\/public\/([^\/]+)\/(.+)$/);
    if (internalMatch) {
      iconUrl = `https://media.base44.com/images/public/${internalMatch[2]}/${internalMatch[3]}`;
    }

    // If rank_id provided, update the rank record directly
    if (rankId) {
      await asAdmin.entities.MilsimRank.update(rankId, { icon_url: iconUrl });
    }

    return new Response(JSON.stringify({ url: iconUrl }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
