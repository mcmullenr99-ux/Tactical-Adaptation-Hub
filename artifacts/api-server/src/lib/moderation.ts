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
// Uses chat completions because the /moderations endpoint is not available on
// the Replit AI proxy. GPT-5.2 is used for consistent results.

export async function moderateText(text: string): Promise<ModerationResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 200,
      messages: [
        {
          role: "user",
          content: `You are a strict content moderation system for a military gaming community website. Analyse the following user-submitted text and respond ONLY with a JSON object:
{
  "flagged": true/false,
  "categories": ["list any that apply: hate_speech, harassment, threats, sexual_content, graphic_violence, self_harm, spam, slurs"],
  "reason": "one-sentence explanation if flagged, otherwise null"
}

Flag if the text contains: hate speech, slurs targeting race/religion/gender/sexuality, explicit sexual content, graphic descriptions of violence, threats against individuals, self-harm encouragement, or blatant spam.
Do NOT flag: tactical gaming discussion, military terminology, in-game violence references, recruitment posts, general community discussion.

Text to moderate:
"""
${text.slice(0, 4000)}
"""`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      flagged: !!parsed.flagged,
      reason: parsed.flagged ? (parsed.reason ?? "Post contains prohibited content.") : null,
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
    };
  } catch (err: any) {
    // If the Azure content filter itself fires, the text is problematic — flag it.
    if (err?.code === "content_filter" || err?.status === 400 && err?.error?.code === "content_filter") {
      return {
        flagged: true,
        reason: "Post contains content that violates community guidelines.",
        categories: ["content_filter"],
      };
    }
    console.error("Text moderation error:", err);
    // On unexpected API failure, block the post to be safe.
    return {
      flagged: true,
      reason: "Content could not be verified. Please try again.",
      categories: ["moderation_unavailable"],
    };
  }
}

// ── Image moderation ──────────────────────────────────────────────────────────
// Uses GPT-5.2 vision to analyse the image for harmful content.
// IMPORTANT: If Azure's own content filter fires (error code "content_filter"),
// that IS a positive detection — we must treat it as flagged, not swallow it.

export async function moderateImage(base64DataUrl: string): Promise<ModerationResult> {
  try {
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
  "categories": ["list any: nudity, sexual_content, gore, graphic_violence, graphic_injury, offensive_symbols, hate_speech_imagery"],
  "reason": "brief one-sentence explanation if flagged, otherwise null"
}

Flag the image if it contains ANY of: nudity or sexual content, graphic violence or gore, severe injuries, offensive or hateful symbols.
Do NOT flag: gaming screenshots, in-game combat, military equipment, logos, text, normal social content.
Be strict about nudity and gore. Gaming violence (e.g. explosions, shooting in-game) is acceptable.`,
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
  } catch (err: any) {
    // Azure's content filter fires when the image itself is explicit.
    // This IS a positive detection — treat it as flagged.
    if (err?.code === "content_filter" || err?.error?.code === "content_filter") {
      return {
        flagged: true,
        reason: "Image contains content that violates community guidelines.",
        categories: ["content_filter"],
      };
    }
    console.error("Image moderation error:", err);
    // On unexpected failure, block the upload to be safe.
    return {
      flagged: true,
      reason: "Image could not be verified. Please try again.",
      categories: ["moderation_unavailable"],
    };
  }
}
