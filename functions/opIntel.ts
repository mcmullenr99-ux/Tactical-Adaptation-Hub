/**
 * opIntel.ts — AI-powered Op Intelligence Analysis
 * 
 * Reads all AARs, LACE reports, and SITREPs for a group and uses GPT-4o-mini
 * to calculate win rate, casualty trends, ammo consumption patterns, mission
 * success rates, and objectives performance. Results are used by the readiness
 * scoring system as an additional factor.
 *
 * Paths:
 *   GET  ?path=analyse&group_id=xxx   — run AI analysis, returns full intel report
 *   GET  ?path=latest&group_id=xxx    — return cached/latest intel without re-running AI
 *   POST ?path=confirm                — eyewitness confirmation on a report
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";
import { verify } from "npm:jsonwebtoken@9.0.2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const JWT_SECRET     = Deno.env.get("JWT_SECRET") ?? "tag-secret-fallback-change-in-production";

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function getCallerUser(base44: any, req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    return await base44.asServiceRole.entities.AppUser.get(payload.sub) ?? null;
  } catch { return null; }
}

// ─── Numeric helpers ────────────────────────────────────────────────────────

const CAS_WEIGHT: Record<string, number> = { NONE: 0, LOW: 1, MODERATE: 2, HEAVY: 3 };
const AMMO_WEIGHT: Record<string, number> = { GREEN: 0, ORANGE: 1, RED: 2 };
const LIQD_WEIGHT: Record<string, number> = { GREEN: 0, ORANGE: 1, RED: 2 };
const CONTACT_WEIGHT: Record<string, number> = { NONE: 0, POSSIBLE: 1, CONFIRMED: 2, ENGAGED: 3 };
const OUTCOME_WIN: Record<string, number> = {
  VICTORY: 1, "PARTIAL VICTORY": 0.6, DRAW: 0.5, DEFEAT: 0, INCOMPLETE: 0,
};

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ─── Statistical analysis (no AI required for the core numbers) ──────────────

function computeRawStats(aars: any[], laceReports: any[], sitreps: any[]) {
  // ── AAR stats ──
  const aarWithOutcome = aars.filter(a => a.outcome && a.outcome !== "INCOMPLETE");
  const totalAARs = aars.length;

  const winPoints = aarWithOutcome.reduce((s, a) => s + (OUTCOME_WIN[a.outcome] ?? 0), 0);
  const win_rate  = aarWithOutcome.length > 0
    ? Math.round((winPoints / aarWithOutcome.length) * 100)
    : null;

  const outcomeBreakdown: Record<string, number> = {};
  for (const a of aars) {
    const o = a.outcome ?? "INCOMPLETE";
    outcomeBreakdown[o] = (outcomeBreakdown[o] ?? 0) + 1;
  }

  // Objectives performance
  const aarWithObjs = aars.filter(a => (a.objectives_hit ?? 0) + (a.objectives_missed ?? 0) > 0);
  const totalObjHit    = aarWithObjs.reduce((s, a) => s + (Number(a.objectives_hit)    ?? 0), 0);
  const totalObjMissed = aarWithObjs.reduce((s, a) => s + (Number(a.objectives_missed) ?? 0), 0);
  const totalObjs      = totalObjHit + totalObjMissed;
  const objective_success_rate = pct(totalObjHit, totalObjs);

  // AAR casualty distribution
  const aarCasBreakdown: Record<string, number> = { NONE: 0, LOW: 0, MODERATE: 0, HEAVY: 0 };
  for (const a of aars) { const c = a.casualties ?? "NONE"; aarCasBreakdown[c] = (aarCasBreakdown[c] ?? 0) + 1; }
  const avgAARCasualties = avg(aars.map(a => CAS_WEIGHT[a.casualties ?? "NONE"] ?? 0));

  // ── LACE stats ──
  const avgAmmoStress = avg(laceReports.map(r => AMMO_WEIGHT[r.ammo ?? "GREEN"] ?? 0));
  const avgLiqStress  = avg(laceReports.map(r => LIQD_WEIGHT[r.liquid ?? "GREEN"] ?? 0));
  const avgLACECas    = avg(laceReports.map(r => CAS_WEIGHT[r.casualty ?? "NONE"] ?? 0));
  const laceCasBreakdown: Record<string, number> = { NONE: 0, LOW: 0, MODERATE: 0, HEAVY: 0 };
  for (const r of laceReports) { const c = r.casualty ?? "NONE"; laceCasBreakdown[c] = (laceCasBreakdown[c] ?? 0) + 1; }
  const ammoBreakdown: Record<string, number> = { GREEN: 0, ORANGE: 0, RED: 0 };
  for (const r of laceReports) { const a = r.ammo ?? "GREEN"; ammoBreakdown[a] = (ammoBreakdown[a] ?? 0) + 1; }
  const criticalAmmoRate = pct((ammoBreakdown.ORANGE ?? 0) + (ammoBreakdown.RED ?? 0), laceReports.length);

  // ── SITREP stats ──
  const avgContactLevel = avg(sitreps.map(r => CONTACT_WEIGHT[r.enemy_contact ?? "NONE"] ?? 0));
  const sitrepCasBreakdown: Record<string, number> = { NONE: 0, LOW: 0, MODERATE: 0, HEAVY: 0 };
  for (const r of sitreps) { const c = r.friendly_casualties ?? "NONE"; sitrepCasBreakdown[c] = (sitrepCasBreakdown[c] ?? 0) + 1; }
  const missionStatusBreakdown: Record<string, number> = {};
  for (const r of sitreps) { const s = r.mission_status ?? "ON TRACK"; missionStatusBreakdown[s] = (missionStatusBreakdown[s] ?? 0) + 1; }
  const onTrackRate = pct(missionStatusBreakdown["ON TRACK"] ?? 0, sitreps.length);

  // ── Cross-signal composite casualty pressure (0–100) ──
  const casSignals = [avgAARCasualties, avgLACECas, avg(sitreps.map(r => CAS_WEIGHT[r.friendly_casualties ?? "NONE"] ?? 0))].filter(n => !isNaN(n));
  const casualtyPressureIndex = Math.round((avg(casSignals) / 3) * 100);

  // ── Overall combat effectiveness score (0–100) ──
  // Win rate 40%, objective success 30%, mission on-track 20%, casualty pressure inverted 10%
  const effectivenessScore =
    (win_rate !== null ? win_rate * 0.4 : 0) +
    (aarWithObjs.length > 0 ? objective_success_rate * 0.3 : 0) +
    (sitreps.length > 0 ? onTrackRate * 0.2 : 0) +
    ((100 - casualtyPressureIndex) * 0.1);

  return {
    total_aars: totalAARs,
    total_lace: laceReports.length,
    total_sitreps: sitreps.length,
    win_rate,
    outcome_breakdown: outcomeBreakdown,
    objective_success_rate,
    total_objectives_hit: totalObjHit,
    total_objectives_missed: totalObjMissed,
    aar_casualty_breakdown: aarCasBreakdown,
    avg_aar_casualties: Math.round(avgAARCasualties * 100) / 100,
    lace_casualty_breakdown: laceCasBreakdown,
    lace_ammo_breakdown: ammoBreakdown,
    avg_ammo_stress: Math.round(avgAmmoStress * 100) / 100,
    avg_liq_stress:  Math.round(avgLiqStress  * 100) / 100,
    critical_ammo_rate: criticalAmmoRate,
    sitrep_contact_avg: Math.round(avgContactLevel * 100) / 100,
    sitrep_cas_breakdown: sitrepCasBreakdown,
    mission_status_breakdown: missionStatusBreakdown,
    on_track_rate: onTrackRate,
    casualty_pressure_index: casualtyPressureIndex,
    combat_effectiveness_score: Math.round(effectivenessScore),
  };
}

// ─── AI narrative generation ─────────────────────────────────────────────────

async function generateAINarrative(groupName: string, stats: ReturnType<typeof computeRawStats>, aars: any[], sitreps: any[]): Promise<{
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  threat_assessment: string;
  intel_grade: "ALPHA" | "BRAVO" | "CHARLIE" | "DELTA";
}> {
  if (!OPENAI_API_KEY) {
    return {
      summary: "AI analysis not configured — statistical data only.",
      strengths: [],
      weaknesses: [],
      recommendations: ["Configure OPENAI_API_KEY to enable AI narrative generation."],
      threat_assessment: "Unavailable",
      intel_grade: "DELTA",
    };
  }

  // Build a concise data packet for the AI — last 10 AAR summaries + recent sitrep notes
  const aarSamples = aars.slice(0, 10).map(a =>
    `[${a.op_date ?? "unknown date"}] ${a.op_name ?? "Op"}: outcome=${a.outcome ?? "INCOMPLETE"}, cas=${a.casualties ?? "NONE"}, objs_hit=${a.objectives_hit ?? 0}, objs_missed=${a.objectives_missed ?? 0}, summary="${(a.content ?? a.summary ?? "").slice(0, 200)}"`
  ).join("\n");

  const sitrepSamples = sitreps.slice(0, 10).map(s =>
    `[${s.report_time ?? "unknown"}] ${s.callsign ?? "?"}: contact=${s.enemy_contact ?? "NONE"}, cas=${s.friendly_casualties ?? "NONE"}, mission=${s.mission_status ?? "ON TRACK"}`
  ).join("\n");

  const prompt = `You are an experienced military intelligence analyst reviewing operational data for a milsim (military simulation) unit named "${groupName}".

OPERATIONAL STATISTICS:
- Total AARs: ${stats.total_aars}, Win Rate: ${stats.win_rate !== null ? stats.win_rate + "%" : "N/A"}
- Objective Success Rate: ${stats.objective_success_rate}% (${stats.total_objectives_hit} hit / ${stats.total_objectives_missed} missed)
- Outcome breakdown: ${JSON.stringify(stats.outcome_breakdown)}
- Casualty Pressure Index: ${stats.casualty_pressure_index}/100 (higher = worse)
- Critical Ammo Rate (ops where ammo was Orange/Red): ${stats.critical_ammo_rate}%
- SITREP Mission On-Track Rate: ${stats.on_track_rate}%
- Combat Effectiveness Score: ${stats.combat_effectiveness_score}/100

RECENT AAR ENTRIES:
${aarSamples || "No AARs available"}

RECENT SITREP ENTRIES:
${sitrepSamples || "No SITREPs available"}

Based on this operational data, provide a professional military intelligence assessment. Be concise and direct. Focus on patterns, not individual ops.

Respond with ONLY valid JSON (no markdown):
{
  "summary": "<2-3 sentence operational assessment of this unit's combat performance>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3 max>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3 max>"],
  "recommendations": ["<tactical rec 1>", "<tactical rec 2>", "<tactical rec 3 max>"],
  "threat_assessment": "<one sentence on casualty/ammo risk patterns>",
  "intel_grade": "<one of: ALPHA (90+% effectiveness), BRAVO (70-89%), CHARLIE (40-69%), DELTA (<40% or insufficient data)>"
}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        model:       "gpt-4o-mini",
        messages:    [{ role: "user", content: prompt }],
        max_tokens:  600,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      console.error("[opIntel/AI] OpenAI error", res.status);
      throw new Error("OpenAI API error");
    }

    const raw     = await res.json();
    const content = raw.choices?.[0]?.message?.content?.trim() ?? "";
    const cleaned = content.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("[opIntel/AI] Error:", err);
    return {
      summary: `Statistical analysis complete. ${stats.total_aars} AARs analysed. AI narrative generation failed.`,
      strengths:        stats.win_rate !== null && stats.win_rate >= 60 ? ["Win rate above 60%"] : [],
      weaknesses:       stats.casualty_pressure_index > 60 ? ["Elevated casualty pressure across ops"] : [],
      recommendations:  ["File more AARs with complete data for better AI analysis."],
      threat_assessment: "Insufficient AI data — review statistics manually.",
      intel_grade:      stats.combat_effectiveness_score >= 90 ? "ALPHA" : stats.combat_effectiveness_score >= 70 ? "BRAVO" : stats.combat_effectiveness_score >= 40 ? "CHARLIE" : "DELTA",
    };
  }
}

// ─── Eyewitness confirmation dispatch ────────────────────────────────────────

async function dispatchEyewitnessNotifications(
  base44: any,
  groupId: string,
  reportType: "AAR" | "LACE" | "SITREP",
  reportId: string,
  filerCallsign: string,
  opName: string,
  summary: string,
) {
  try {
    // Get all active roster members for this group
    const roster = await base44.asServiceRole.entities.MilsimRoster.filter({ group_id: groupId });
    const activeRoster = roster.filter((m: any) => m.status === "Active");

    // Get user records for each roster member
    const messagePromises = activeRoster.map(async (member: any) => {
      if (!member.user_id) return;
      try {
        const user = await base44.asServiceRole.entities.AppUser.get(member.user_id);
        if (!user) return;

        const subject = `[EYEWITNESS REQ] ${reportType} — ${opName}`;
        const body = `EYEWITNESS CONFIRMATION REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Report Type : ${reportType}
Filed By    : ${filerCallsign}
Operation   : ${opName}
Report ID   : ${reportId}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REPORT SUMMARY:
${summary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are receiving this because you are an active member of this unit. If you were present for this operation, please confirm this report to add your eyewitness verification.

To confirm: navigate to Operations → ${reportType === "AAR" ? "AARs" : reportType === "LACE" ? "LACE" : "SITREPs"} in your unit\'s HQ portal and click "Confirm" on this report.

This message was sent automatically by the TAG Eyewitness Confirmation System.`;

        await base44.asServiceRole.entities.Message.create({
          sender_id:          "system",
          sender_username:    "TAG System",
          recipient_id:       user.id,
          recipient_username: user.username,
          subject,
          body,
          is_read:            false,
          deleted_by_sender:  false,
          deleted_by_recipient: false,
        });
      } catch (err) {
        console.error(`[opIntel] Failed to notify ${member.callsign}:`, err);
      }
    });

    await Promise.allSettled(messagePromises);
    console.log(`[opIntel] Dispatched ${activeRoster.length} eyewitness notifications for ${reportType} ${reportId}`);
  } catch (err) {
    console.error("[opIntel] Dispatch error:", err);
  }
}

// ─── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const base44   = createClientFromRequest(req);
    const url      = new URL(req.url);
    const path     = url.searchParams.get("path") ?? "";
    const group_id = url.searchParams.get("group_id") ?? "";

    // ── POST: eyewitness confirmation ──
    if (req.method === "POST" && path === "confirm") {
      const caller = await getCallerUser(base44, req);
      if (!caller) return json({ error: "Unauthorized" }, 401);

      const { report_type, report_id, note } = await req.json();
      if (!report_type || !report_id) return json({ error: "report_type and report_id required" }, 400);

      // Get the user\'s callsign from roster
      const rosterEntries = await base44.asServiceRole.entities.MilsimRoster.filter({ user_id: caller.id });
      const callsign = rosterEntries?.[0]?.callsign ?? caller.username;

      const confirmation = {
        user_id:      caller.id,
        callsign,
        confirmed_at: new Date().toISOString(),
        note:         note ?? "",
      };

      // Update the appropriate entity
      let entity: any;
      if      (report_type === "AAR")    entity = base44.asServiceRole.entities.MilsimAAR;
      else if (report_type === "LACE")   entity = base44.asServiceRole.entities.MilsimLace;
      else if (report_type === "SITREP") entity = base44.asServiceRole.entities.MilsimSitrep;
      else return json({ error: "Invalid report_type" }, 400);

      const existing = await entity.get(report_id);
      if (!existing) return json({ error: "Report not found" }, 404);

      const confirmations = Array.isArray(existing.eyewitness_confirmations) ? existing.eyewitness_confirmations : [];

      // Prevent duplicate confirmations from same user
      if (confirmations.some((c: any) => c.user_id === caller.id)) {
        return json({ error: "You have already confirmed this report" }, 409);
      }

      confirmations.push(confirmation);
      await entity.update(report_id, {
        eyewitness_confirmations: confirmations,
        eyewitness_count: confirmations.length,
      });

      return json({ ok: true, eyewitness_count: confirmations.length });
    }

    // ── GET: latest cached intel (no AI re-run) ──
    if (req.method === "GET" && path === "latest" && group_id) {
      const [aars, laceReports, sitreps] = await Promise.all([
        base44.asServiceRole.entities.MilsimAAR.filter({ group_id }, { sort: "-created_date", limit: 100 }),
        base44.asServiceRole.entities.MilsimLace.filter({ group_id }, { sort: "-created_date", limit: 100 }),
        base44.asServiceRole.entities.MilsimSitrep.filter({ group_id }, { sort: "-created_date", limit: 100 }),
      ]);

      const stats = computeRawStats(aars, laceReports, sitreps);
      return json({ stats, ai_narrative: null, cached: true });
    }

    // ── GET: full AI analysis ──
    if (req.method === "GET" && path === "analyse" && group_id) {
      const [group, aars, laceReports, sitreps] = await Promise.all([
        base44.asServiceRole.entities.MilsimGroup.get(group_id),
        base44.asServiceRole.entities.MilsimAAR.filter({ group_id }, { sort: "-op_date", limit: 100 }),
        base44.asServiceRole.entities.MilsimLace.filter({ group_id }, { sort: "-created_date", limit: 100 }),
        base44.asServiceRole.entities.MilsimSitrep.filter({ group_id }, { sort: "-created_date", limit: 100 }),
      ]);

      if (!group) return json({ error: "Group not found" }, 404);

      const stats         = computeRawStats(aars, laceReports, sitreps);
      const ai_narrative  = await generateAINarrative(group.name ?? "Unknown Unit", stats, aars, sitreps);

      return json({
        group_id,
        group_name: group.name,
        generated_at: new Date().toISOString(),
        stats,
        ai_narrative,
        data_counts: { aars: aars.length, lace: laceReports.length, sitreps: sitreps.length },
      });
    }

    // ── POST: notify roster (called after filing any report) ──
    if (req.method === "POST" && path === "notify") {
      const { report_type, report_id, filer_callsign, op_name, summary } = await req.json();
      if (!group_id || !report_type || !report_id) return json({ error: "group_id, report_type, report_id required" }, 400);

      await dispatchEyewitnessNotifications(
        base44, group_id, report_type, report_id,
        filer_callsign ?? "Unknown", op_name ?? "Unknown Op", summary ?? "",
      );

      return json({ ok: true });
    }

    return json({ error: "Unknown path" }, 400);
  } catch (e: any) {
    console.error("[opIntel]", e);
    return json({ error: e.message }, 500);
  }
});
