import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "placeholder",
});

export interface ModerationResult {
  flagged: boolean;
  reason: string | null;
  categories: string[];
}

// ── Text moderation ───────────────────────────────────────────────────────────
// Uses OpenAI's moderation endpoint — fast, free, purpose-built.

export async function moderateText(text: string): Promise<ModerationResult> {
  try {
    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: text,
    });

    const result = response.results[0];
    if (!result) return { flagged: false, reason: null, categories: [] };

    const flaggedCats = Object.entries(result.categories)
      .filter(([, v]) => v === true)
      .map(([k]) => k);

    if (!result.flagged) return { flagged: false, reason: null, categories: [] };

    // Map category keys to readable labels
    const labelMap: Record<string, string> = {
      "hate": "hate speech",
      "hate/threatening": "threatening hate speech",
      "harassment": "harassment",
      "harassment/threatening": "threatening harassment",
      "self-harm": "self-harm content",
      "self-harm/intent": "self-harm intent",
      "self-harm/instructions": "self-harm instructions",
      "sexual": "sexual content",
      "sexual/minors": "sexual content involving minors",
      "violence": "violent content",
      "violence/graphic": "graphic violence",
      "illicit": "illicit content",
      "illicit/violent": "violent illicit content",
    };

    const readable = flaggedCats.map(c => labelMap[c] ?? c);
    return {
      flagged: true,
      reason: `Post contains ${readable.join(", ")}.`,
      categories: flaggedCats,
    };
  } catch (err) {
    console.error("Text moderation error:", err);
    // On API failure, fall through (do not block on moderation failure)
    return { flagged: false, reason: null, categories: [] };
  }
}

// ── Image moderation via vision ───────────────────────────────────────────────
// Passes the image (as base64 data URL) to the OpenAI moderation endpoint.

export async function moderateImage(base64DataUrl: string): Promise<ModerationResult> {
  try {
    // Use the vision model to assess the image for harmful content
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 200,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a strict content moderation system. Analyse this image and respond ONLY with a JSON object:
{
  "flagged": true/false,
  "categories": ["list any: nudity, gore, violence, sexual_content, graphic_injury, offensive_symbols, hate_speech_imagery"],
  "reason": "brief one-sentence explanation if flagged, otherwise null"
}

Flag the image if it contains ANY of: nudity or sexual content, graphic violence or gore, severe injuries, offensive/hateful symbols or imagery.
Do NOT flag: gaming screenshots, gaming clips, military equipment, normal social content, logos, text.
Be strict about nudity and gore. Be lenient about gaming violence (e.g. in-game shooting, explosions are fine).`,
            },
            {
              type: "image_url",
              image_url: { url: base64DataUrl, detail: "low" },
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      flagged: !!parsed.flagged,
      reason: parsed.flagged ? (parsed.reason ?? "Image contains inappropriate content.") : null,
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
    };
  } catch (err) {
    console.error("Image moderation error:", err);
    // On failure, do not block the post
    return { flagged: false, reason: null, categories: [] };
  }
}
