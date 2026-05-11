/**
 * Google API export utilities — Slides, Docs, Sheets
 * All functions use the user's Google OAuth token via apiFetch connector endpoint.
 */

const SLIDES_API = "https://slides.googleapis.com/v1/presentations";
const DOCS_API = "https://docs.googleapis.com/v1/documents";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const DRIVE_API = "https://www.googleapis.com/drive/v3/files";

// ─── Token helpers ─────────────────────────────────────────────────────────────

async function getSlidesToken(): Promise<string> {
  const r = await fetch("/api/connectors/googleslides/token");
  if (!r.ok) throw new Error("Google Slides not connected");
  const d = await r.json();
  return d.access_token ?? d.accessToken;
}

async function getDocsToken(): Promise<string> {
  const r = await fetch("/api/connectors/googledocs/token");
  if (!r.ok) throw new Error("Google Docs not connected");
  const d = await r.json();
  return d.access_token ?? d.accessToken;
}

async function getSheetsToken(): Promise<string> {
  const r = await fetch("/api/connectors/googlesheets/token");
  if (!r.ok) throw new Error("Google Sheets not connected");
  const d = await r.json();
  return d.access_token ?? d.accessToken;
}

// ─── Google Slides — Op Briefing Deck ─────────────────────────────────────────

export async function generateBriefingSlides(briefing: any, groupName: string): Promise<string> {
  const token = await getSlidesToken();
  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // 1. Create blank presentation
  const createRes = await fetch(SLIDES_API, {
    method: "POST", headers: auth,
    body: JSON.stringify({ title: `${briefing.title} — ${groupName}` }),
  });
  if (!createRes.ok) throw new Error("Failed to create presentation");
  const pres = await createRes.json();
  const presId = pres.presentationId;
  const slideId = pres.slides[0].objectId;

  // Helper to generate unique IDs
  const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

  // 2. Build requests for all slides
  const requests: any[] = [];

  // --- Slide 1: Title slide (already exists) ---
  const titleTxtId = uid("title_txt");
  const subtitleTxtId = uid("sub_txt");
  requests.push(
    { deleteObject: { objectId: slideId } }, // delete default blank slide, replace with our own
  );

  // We'll delete default slide and insert styled slides
  // Slide 1 — TITLE
  const s1 = uid("s1");
  const s1bg = uid("s1bg");
  const s1t = uid("s1t");
  const s1sub = uid("s1sub");
  requests.push(
    { createSlide: { objectId: s1, insertionIndex: 0, slideLayoutReference: { predefinedLayout: "BLANK" } } },
    { createShape: { objectId: s1bg, shapeType: "RECTANGLE", elementProperties: { pageObjectId: s1, size: { width: { magnitude: 9144000, unit: "EMU" }, height: { magnitude: 5143500, unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0, unit: "EMU" } } } },
    { updateShapeProperties: { objectId: s1bg, shapeProperties: { shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.05, green: 0.07, blue: 0.09 } } } } }, fields: "shapeBackgroundFill" } },
    { createShape: { objectId: s1t, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: s1, size: { width: { magnitude: 7500000, unit: "EMU" }, height: { magnitude: 1500000, unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: 800000, translateY: 1600000, unit: "EMU" } } } },
    { insertText: { objectId: s1t, text: briefing.title ?? "OPERATION BRIEFING" } },
    { updateTextStyle: { objectId: s1t, style: { bold: true, fontSize: { magnitude: 36, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: { red: 0.85, green: 0.1, blue: 0.1 } } } }, fields: "bold,fontSize,foregroundColor" } },
    { createShape: { objectId: s1sub, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: s1, size: { width: { magnitude: 7500000, unit: "EMU" }, height: { magnitude: 800000, unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: 800000, translateY: 3100000, unit: "EMU" } } } },
    { insertText: { objectId: s1sub, text: `${groupName}${briefing.op_date ? " · " + new Date(briefing.op_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}` } },
    { updateTextStyle: { objectId: s1sub, style: { fontSize: { magnitude: 16, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: { red: 0.7, green: 0.7, blue: 0.7 } } } }, fields: "fontSize,foregroundColor" } },
  );

  // Helper to add a content slide
  const addContentSlide = (index: number, sectionTitle: string, body: string) => {
    const sId = uid(`s${index}`);
    const sBg = uid(`sb${index}`);
    const sHdr = uid(`sh${index}`);
    const sBdy = uid(`sbdy${index}`);
    const sAccent = uid(`sa${index}`);
    requests.push(
      { createSlide: { objectId: sId, insertionIndex: index, slideLayoutReference: { predefinedLayout: "BLANK" } } },
      // dark bg
      { createShape: { objectId: sBg, shapeType: "RECTANGLE", elementProperties: { pageObjectId: sId, size: { width: { magnitude: 9144000, unit: "EMU" }, height: { magnitude: 5143500, unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0, unit: "EMU" } } } },
      { updateShapeProperties: { objectId: sBg, shapeProperties: { shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.05, green: 0.07, blue: 0.09 } } } } }, fields: "shapeBackgroundFill" } },
      // red accent bar
      { createShape: { objectId: sAccent, shapeType: "RECTANGLE", elementProperties: { pageObjectId: sId, size: { width: { magnitude: 9144000, unit: "EMU" }, height: { magnitude: 120000, unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: 0, translateY: 700000, unit: "EMU" } } } },
      { updateShapeProperties: { objectId: sAccent, shapeProperties: { shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.85, green: 0.1, blue: 0.1 } } } } }, fields: "shapeBackgroundFill" } },
      // section header
      { createShape: { objectId: sHdr, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: sId, size: { width: { magnitude: 8000000, unit: "EMU" }, height: { magnitude: 600000, unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: 600000, translateY: 100000, unit: "EMU" } } } },
      { insertText: { objectId: sHdr, text: sectionTitle } },
      { updateTextStyle: { objectId: sHdr, style: { bold: true, fontSize: { magnitude: 22, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: { red: 1, green: 1, blue: 1 } } } }, fields: "bold,fontSize,foregroundColor" } },
      // body
      { createShape: { objectId: sBdy, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: sId, size: { width: { magnitude: 8000000, unit: "EMU" }, height: { magnitude: 3800000, unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: 600000, translateY: 1000000, unit: "EMU" } } } },
      { insertText: { objectId: sBdy, text: body || "N/A" } },
      { updateTextStyle: { objectId: sBdy, style: { fontSize: { magnitude: 14, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: { red: 0.85, green: 0.85, blue: 0.85 } } } }, fields: "fontSize,foregroundColor" } },
    );
  };

  let slideIndex = 1;
  if (briefing.ao) { addContentSlide(slideIndex++, "AREA OF OPERATIONS", briefing.ao); }
  if (briefing.objectives) { addContentSlide(slideIndex++, "OBJECTIVES", briefing.objectives); }
  if (briefing.comms_plan) { addContentSlide(slideIndex++, "COMMS PLAN", briefing.comms_plan); }
  if (briefing.roe) { addContentSlide(slideIndex++, "RULES OF ENGAGEMENT", briefing.roe); }
  if (briefing.additional_notes) { addContentSlide(slideIndex++, "ADDITIONAL NOTES", briefing.additional_notes); }

  // 3. Batch update
  const batchRes = await fetch(`${SLIDES_API}/${presId}:batchUpdate`, {
    method: "POST", headers: auth,
    body: JSON.stringify({ requests }),
  });
  if (!batchRes.ok) {
    const err = await batchRes.text();
    throw new Error(`Slides batch update failed: ${err}`);
  }

  return `https://docs.google.com/presentation/d/${presId}/edit`;
}

// ─── Google Docs — AAR Doc ─────────────────────────────────────────────────────

export async function generateAARDoc(aar: any, groupName: string): Promise<string> {
  const token = await getDocsToken();
  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const createRes = await fetch(DOCS_API, {
    method: "POST", headers: auth,
    body: JSON.stringify({ title: `AAR — ${aar.title ?? aar.op_name} — ${groupName}` }),
  });
  if (!createRes.ok) throw new Error("Failed to create Google Doc");
  const doc = await createRes.json();
  const docId = doc.documentId;

  const line = (text: string) => `${text}\n`;
  const section = (title: string, body: string) =>
    body ? `${title}\n${body}\n\n` : "";

  const outcome = aar.outcome === "success" ? "SUCCESS" : aar.outcome === "partial_success" ? "PARTIAL SUCCESS" : "FAILURE";
  const opDate = aar.op_date ? new Date(aar.op_date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "N/A";

  const content =
    line(`AFTER ACTION REVIEW`) +
    line(`${groupName} — ${aar.op_name ?? "Unknown Op"}`) +
    line(`Author: ${aar.author_username ?? "Unknown"} | Date: ${opDate} | Outcome: ${outcome}`) +
    line(`─────────────────────────────────────────`) +
    `\n` +
    section("SUMMARY", aar.content) +
    section("LESSONS LEARNED", aar.lessons_learned) +
    (aar.objectives_hit?.length ? section("OBJECTIVES ACHIEVED", aar.objectives_hit.join("\n")) : "") +
    (aar.objectives_missed?.length ? section("OBJECTIVES MISSED", aar.objectives_missed.join("\n")) : "") +
    section("CASUALTIES", aar.casualties_note) +
    (aar.commendations?.length ? section("COMMENDATIONS", aar.commendations.join("\n")) : "") +
    `\n─────────────────────────────────────────\n` +
    `Classification: ${aar.classification ?? "UNCLASSIFIED"}\n`;

  const batchRes = await fetch(`${DOCS_API}/${docId}:batchUpdate`, {
    method: "POST", headers: auth,
    body: JSON.stringify({
      requests: [{ insertText: { location: { index: 1 }, text: content } }],
    }),
  });
  if (!batchRes.ok) throw new Error("Failed to write Doc content");

  return `https://docs.google.com/document/d/${docId}/edit`;
}

// ─── Google Docs — Briefing Doc ────────────────────────────────────────────────

export async function generateBriefingDoc(briefing: any, groupName: string): Promise<string> {
  const token = await getDocsToken();
  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const createRes = await fetch(DOCS_API, {
    method: "POST", headers: auth,
    body: JSON.stringify({ title: `OPORD — ${briefing.title} — ${groupName}` }),
  });
  if (!createRes.ok) throw new Error("Failed to create Google Doc");
  const doc = await createRes.json();
  const docId = doc.documentId;

  const opDate = briefing.op_date ? new Date(briefing.op_date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "TBC";
  const section = (title: string, body: string) => body ? `${title}\n${body}\n\n` : "";

  const content =
    `OPERATION ORDER\n` +
    `${briefing.title}\n` +
    `${groupName} | ${opDate}\n` +
    `─────────────────────────────────────────\n\n` +
    section("1. SITUATION / AREA OF OPERATIONS", briefing.ao) +
    section("2. MISSION", briefing.content ?? "") +
    section("3. OBJECTIVES", briefing.objectives) +
    section("4. COMMS PLAN", briefing.comms_plan) +
    section("5. RULES OF ENGAGEMENT", briefing.roe) +
    section("6. ADDITIONAL NOTES", briefing.additional_notes) +
    `\n─────────────────────────────────────────\n` +
    `Classification: ${briefing.classification ?? "UNCLASSIFIED"} | Status: ${briefing.status ?? "draft"}\n`;

  await fetch(`${DOCS_API}/${docId}:batchUpdate`, {
    method: "POST", headers: auth,
    body: JSON.stringify({
      requests: [{ insertText: { location: { index: 1 }, text: content } }],
    }),
  });

  return `https://docs.google.com/document/d/${docId}/edit`;
}

// ─── Google Sheets — Roster Export ────────────────────────────────────────────

export async function exportRosterToSheets(roster: any[], ranks: any[], roles: any[], groupName: string): Promise<string> {
  const token = await getSheetsToken();
  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const rankById = Object.fromEntries(ranks.map(r => [r.id, r.name]));
  const roleById = Object.fromEntries(roles.map(r => [r.id, r.name]));

  const createRes = await fetch(SHEETS_API, {
    method: "POST", headers: auth,
    body: JSON.stringify({
      properties: { title: `${groupName} — Roster Export ${new Date().toLocaleDateString("en-GB")}` },
      sheets: [{ properties: { title: "Roster" } }],
    }),
  });
  if (!createRes.ok) throw new Error("Failed to create spreadsheet");
  const sheet = await createRes.json();
  const sheetId = sheet.spreadsheetId;

  const headers = ["Callsign", "Rank", "Role", "Status", "Specialisations", "Ops Count", "Join Date"];
  const rows = roster.map(m => [
    m.callsign ?? "",
    m.rank_id ? (rankById[m.rank_id] ?? m.rank_id) : "",
    m.role_id ? (roleById[m.role_id] ?? m.role_id) : "",
    m.status ?? "active",
    Array.isArray(m.specialisations) ? m.specialisations.join(", ") : "",
    m.ops_count ?? 0,
    m.join_date ? new Date(m.join_date).toLocaleDateString("en-GB") : "",
  ]);

  const values = [headers, ...rows];
  const sheetName = encodeURIComponent("Roster");
  const rangeEnd = `${String.fromCharCode(64 + headers.length)}${values.length}`;

  await fetch(`${SHEETS_API}/${sheetId}/values/Roster!A1:${rangeEnd}?valueInputOption=RAW`, {
    method: "PUT", headers: auth,
    body: JSON.stringify({ values }),
  });

  return `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
}

// ─── Google Sheets — Ops Log Export ───────────────────────────────────────────

export async function exportOpsToSheets(ops: any[], groupName: string): Promise<string> {
  const token = await getSheetsToken();
  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const createRes = await fetch(SHEETS_API, {
    method: "POST", headers: auth,
    body: JSON.stringify({
      properties: { title: `${groupName} — Ops Log ${new Date().toLocaleDateString("en-GB")}` },
      sheets: [{ properties: { title: "Operations" } }],
    }),
  });
  if (!createRes.ok) throw new Error("Failed to create spreadsheet");
  const sheet = await createRes.json();
  const sheetId = sheet.spreadsheetId;

  const headers = ["Name", "Game", "Type", "Status", "Scheduled Date", "Description", "Participants"];
  const rows = ops.map(op => [
    op.name ?? "",
    op.game ?? "",
    op.event_type ?? "",
    op.status ?? "",
    op.scheduled_at ? new Date(op.scheduled_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "",
    op.description ?? "",
    Array.isArray(op.participants) ? op.participants.length : 0,
  ]);

  const values = [headers, ...rows];
  const rangeEnd = `${String.fromCharCode(64 + headers.length)}${values.length}`;

  await fetch(`${SHEETS_API}/${sheetId}/values/Operations!A1:${rangeEnd}?valueInputOption=RAW`, {
    method: "PUT", headers: auth,
    body: JSON.stringify({ values }),
  });

  return `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
}
