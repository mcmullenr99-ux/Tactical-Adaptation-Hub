import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import OpenAI from "openai";

const router: IRouter = Router();
const staffGuard = [requireAuth, requireRole("staff", "moderator", "admin")];
const adminGuard = [requireAuth, requireRole("admin")];

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "placeholder",
});

// ── AI ID Verification ────────────────────────────────────────────────────────

async function analyzeVeteranID(
  base64Image: string,
  idType: string
): Promise<{ confidence: number; summary: string; fields: Record<string, string>; verdict: "verified" | "flagged" | "rejected" }> {
  const typeLabel =
    idType === "va_card" ? "US Veterans Affairs (VA) ID Card" :
    idType === "uk_veteran_card" ? "UK HM Armed Forces Veteran Identity Card" :
    idType === "mod90" ? "UK MOD Form 90 (Military ID)" :
    idType === "f214" ? "UK F214 Discharge Certificate" :
    "Military/Veteran Identity Document";

  const prompt = `You are a military ID verification assistant. Analyse this image which is claimed to be a ${typeLabel}.

Respond ONLY with a JSON object in this exact format:
{
  "isValidDocument": true/false,
  "documentType": "what type of document this appears to be",
  "name": "name visible on card or null",
  "serviceInfo": "any service/branch info visible or null",
  "expiryOrDate": "any date visible or null",
  "confidence": 0-100,
  "flags": ["list of any concerns e.g. 'image quality low', 'possible edit detected', 'partial document']
  "summary": "one sentence summary of findings"
}

Be strict. If the image is not clearly a military/veteran ID document, set isValidDocument to false and confidence below 30.
If you cannot read the document clearly, set confidence below 50.
Never hallucinate data not visible in the image.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: base64Image, detail: "high" } },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const confidence = Math.min(100, Math.max(0, parsed.confidence ?? 0));
    const fields: Record<string, string> = {};
    if (parsed.name) fields.name = parsed.name;
    if (parsed.serviceInfo) fields.serviceInfo = parsed.serviceInfo;
    if (parsed.expiryOrDate) fields.date = parsed.expiryOrDate;
    if (parsed.documentType) fields.documentType = parsed.documentType;
    if (parsed.flags?.length) fields.flags = parsed.flags.join(", ");

    const verdict =
      !parsed.isValidDocument || confidence < 30 ? "rejected" :
      confidence < 65 || (parsed.flags?.length > 0) ? "flagged" :
      "verified";

    return { confidence, summary: parsed.summary ?? "AI analysis complete.", fields, verdict };
  } catch (err) {
    console.error("AI ID analysis error:", err);
    return { confidence: 0, summary: "AI analysis failed. Manual review required.", fields: {}, verdict: "flagged" };
  }
}

// ── Submit Application ────────────────────────────────────────────────────────

router.post("/veteran-app", requireAuth, async (req, res): Promise<void> => {
  const actor = (req as any).user;

  // Check for existing application
  const existing = await db.execute(sql`SELECT id, status FROM veteran_applications WHERE user_id = ${actor.id}`);
  if (existing.rows.length > 0) {
    const app = existing.rows[0] as any;
    if (app.status !== "rejected") {
      res.status(409).json({ error: "You already have an application on file.", status: app.status });
      return;
    }
    // Allow resubmission if previously rejected
    await db.execute(sql`DELETE FROM veteran_applications WHERE user_id = ${actor.id}`);
  }

  const {
    country, branch, rank, isCurrentlyServing, serviceStart, serviceEnd,
    mosRole, unitOrFormation, deploymentHistory,
    reasonForJoining, tacticalExperience, additionalInfo,
    idType, idUploadData,
  } = req.body as Record<string, any>;

  if (!country || !branch || !rank || !serviceStart || !mosRole || !reasonForJoining || !tacticalExperience) {
    res.status(400).json({ error: "Missing required fields." });
    return;
  }

  // Run AI verification if ID was uploaded
  let idVerificationStatus = "not_submitted";
  let aiVerificationResult: string | null = null;
  let aiConfidenceScore: number | null = null;

  if (idUploadData && idType) {
    idVerificationStatus = "pending";
    try {
      const analysis = await analyzeVeteranID(idUploadData, idType);
      aiConfidenceScore = analysis.confidence;
      aiVerificationResult = JSON.stringify({ ...analysis.fields, summary: analysis.summary, confidence: analysis.confidence });
      idVerificationStatus = analysis.verdict === "verified" ? "ai_verified"
        : analysis.verdict === "rejected" ? "rejected"
        : "ai_flagged";
    } catch {
      idVerificationStatus = "ai_flagged";
    }
  }

  const result = await db.execute(sql`
    INSERT INTO veteran_applications (
      user_id, username, country, branch, rank, is_currently_serving,
      service_start, service_end, mos_role, unit_or_formation, deployment_history,
      reason_for_joining, tactical_experience, additional_info,
      id_type, id_upload_data, id_verification_status, ai_verification_result, ai_confidence_score
    ) VALUES (
      ${actor.id}, ${actor.username}, ${country}, ${branch}, ${rank}, ${!!isCurrentlyServing},
      ${serviceStart}, ${serviceEnd ?? null}, ${mosRole}, ${unitOrFormation ?? null}, ${deploymentHistory ?? null},
      ${reasonForJoining}, ${tacticalExperience}, ${additionalInfo ?? null},
      ${idType ?? null}, ${idUploadData ?? null}, ${idVerificationStatus}, ${aiVerificationResult}, ${aiConfidenceScore}
    ) RETURNING id, status, id_verification_status, ai_confidence_score
  `);

  res.status(201).json(result.rows[0]);
});

// ── Get Own Application ───────────────────────────────────────────────────────

router.get("/veteran-app/mine", requireAuth, async (req, res): Promise<void> => {
  const actor = (req as any).user;
  const result = await db.execute(sql`
    SELECT id, status, id_verification_status, ai_confidence_score,
           review_note, created_at, updated_at,
           country, branch, rank, is_currently_serving, service_start, service_end,
           mos_role, unit_or_formation, id_type
    FROM veteran_applications WHERE user_id = ${actor.id}
  `);
  res.json(result.rows[0] ?? null);
});

// ── Admin: List All Applications ──────────────────────────────────────────────

router.get("/admin/veteran-apps", ...staffGuard, async (_req, res): Promise<void> => {
  const result = await db.execute(sql`
    SELECT v.*, u.email
    FROM veteran_applications v
    JOIN users u ON u.id = v.user_id
    ORDER BY v.created_at DESC
  `);
  // Strip id_upload_data from list view for performance
  const rows = (result.rows as any[]).map(r => {
    const { id_upload_data, ...rest } = r;
    return { ...rest, has_id_upload: !!id_upload_data };
  });
  res.json(rows);
});

// ── Admin: Get Single Application (with ID image) ─────────────────────────────

router.get("/admin/veteran-apps/:id", ...staffGuard, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const result = await db.execute(sql`
    SELECT v.*, u.email FROM veteran_applications v
    JOIN users u ON u.id = v.user_id
    WHERE v.id = ${id}
  `);
  if (!result.rows[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(result.rows[0]);
});

// ── Admin: Review Application ─────────────────────────────────────────────────

router.patch("/admin/veteran-apps/:id", ...staffGuard, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const reviewer = (req as any).user;
  const { status, reviewNote, idVerificationStatus } = req.body as {
    status?: string; reviewNote?: string; idVerificationStatus?: string;
  };

  if (!status && !reviewNote && !idVerificationStatus) {
    res.status(400).json({ error: "Nothing to update." });
    return;
  }

  await db.execute(sql`
    UPDATE veteran_applications SET
      status = COALESCE(${status ?? null}, status),
      review_note = COALESCE(${reviewNote ?? null}, review_note),
      id_verification_status = COALESCE(${idVerificationStatus ?? null}, id_verification_status),
      reviewed_by = ${reviewer.id},
      reviewed_at = NOW(),
      updated_at = NOW()
    WHERE id = ${id}
  `);

  const updated = await db.execute(sql`SELECT * FROM veteran_applications WHERE id = ${id}`);
  res.json(updated.rows[0]);
});

// ── Admin: Re-run AI Verification ─────────────────────────────────────────────

router.post("/admin/veteran-apps/:id/verify-id", ...staffGuard, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const result = await db.execute(sql`SELECT * FROM veteran_applications WHERE id = ${id}`);
  const app = result.rows[0] as any;
  if (!app) { res.status(404).json({ error: "Not found" }); return; }
  if (!app.id_upload_data || !app.id_type) {
    res.status(400).json({ error: "No ID uploaded for this application." });
    return;
  }

  const analysis = await analyzeVeteranID(app.id_upload_data, app.id_type);
  const newStatus = analysis.verdict === "verified" ? "ai_verified"
    : analysis.verdict === "rejected" ? "rejected"
    : "ai_flagged";

  await db.execute(sql`
    UPDATE veteran_applications SET
      ai_verification_result = ${JSON.stringify({ ...analysis.fields, summary: analysis.summary, confidence: analysis.confidence })},
      ai_confidence_score = ${analysis.confidence},
      id_verification_status = ${newStatus},
      updated_at = NOW()
    WHERE id = ${id}
  `);

  res.json({ verdict: analysis.verdict, confidence: analysis.confidence, summary: analysis.summary, newStatus });
});

export default router;
