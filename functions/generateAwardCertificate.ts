// Award Certificate Generator — Commander Pro feature
// Generates a branded PDF certificate for an issued award
import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";

function sanitize(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, "--")
    .replace(/\u2013/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\xFF]/g, "?");
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { award_id, group_id } = body;

    if (!award_id || !group_id) {
      return new Response(JSON.stringify({ error: "award_id and group_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify Pro status
    const proRecords = await base44.asServiceRole.entities.CommanderPro.filter({ group_id, status: "active" });
    const isPro = proRecords.length > 0;
    if (!isPro) {
      return new Response(JSON.stringify({ error: "Commander Pro subscription required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch award record
    const awards = await base44.asServiceRole.entities.MilsimAward.filter({ id: award_id, group_id });
    if (!awards.length) {
      return new Response(JSON.stringify({ error: "Award not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const award = awards[0];

    // Fetch group info
    const groups = await base44.asServiceRole.entities.MilsimGroup.filter({ id: group_id });
    const group = groups[0] ?? { name: "Unknown Unit" };

    // ─── Build PDF ────────────────────────────────────────────────────────────
    const doc = await PDFDocument.create();
    const page = doc.addPage([842, 595]); // A4 landscape
    const { width, height } = page.getSize();

    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await doc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

    // Background — dark slate
    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.07, 0.09, 0.13) });

    // Gold border — outer
    page.drawRectangle({ x: 18, y: 18, width: width - 36, height: height - 36, borderColor: rgb(0.85, 0.65, 0.13), borderWidth: 2, color: rgb(0,0,0,0) });
    // Gold border — inner
    page.drawRectangle({ x: 26, y: 26, width: width - 52, height: height - 52, borderColor: rgb(0.85, 0.65, 0.13), borderWidth: 0.5, color: rgb(0,0,0,0) });

    // Header band
    page.drawRectangle({ x: 26, y: height - 100, width: width - 52, height: 74, color: rgb(0.1, 0.13, 0.18) });

    // "TACTICAL ADAPTATION GROUP" header
    const headerText = sanitize("TACTICAL ADAPTATION GROUP");
    const headerSize = 13;
    const headerW = fontBold.widthOfTextAtSize(headerText, headerSize);
    page.drawText(headerText, {
      x: (width - headerW) / 2, y: height - 58,
      size: headerSize, font: fontBold, color: rgb(0.85, 0.65, 0.13),
    });

    // "CERTIFICATE OF AWARD"
    const certTitle = "CERTIFICATE OF AWARD";
    const ctSize = 9;
    const ctW = fontReg.widthOfTextAtSize(certTitle, ctSize);
    page.drawText(certTitle, {
      x: (width - ctW) / 2, y: height - 78,
      size: ctSize, font: fontReg, color: rgb(0.55, 0.60, 0.68),
    });

    // Award name — large centred
    const awardName = sanitize(award.award_name ?? "Distinguished Service Award");
    const anSize = 30;
    const anW = fontBold.widthOfTextAtSize(awardName, anSize);
    page.drawText(awardName, {
      x: (width - anW) / 2, y: height - 180,
      size: anSize, font: fontBold, color: rgb(0.93, 0.93, 0.97),
    });

    // Gold divider line
    page.drawLine({ start: { x: 120, y: height - 200 }, end: { x: width - 120, y: height - 200 }, thickness: 1, color: rgb(0.85, 0.65, 0.13) });

    // "This certificate is presented to"
    const presText = "This certificate is presented to";
    const presSize = 11;
    const presW = fontOblique.widthOfTextAtSize(presText, presSize);
    page.drawText(presText, {
      x: (width - presW) / 2, y: height - 235,
      size: presSize, font: fontOblique, color: rgb(0.55, 0.60, 0.68),
    });

    // Recipient callsign — large
    const callsign = sanitize(award.recipient_callsign ?? "UNKNOWN");
    const csSize = 36;
    const csW = fontBold.widthOfTextAtSize(callsign, csSize);
    page.drawText(callsign, {
      x: (width - csW) / 2, y: height - 290,
      size: csSize, font: fontBold, color: rgb(0.85, 0.65, 0.13),
    });

    // Unit name
    const unitText = sanitize(`of ${group.name}`);
    const utSize = 12;
    const utW = fontReg.widthOfTextAtSize(unitText, utSize);
    page.drawText(unitText, {
      x: (width - utW) / 2, y: height - 318,
      size: utSize, font: fontReg, color: rgb(0.55, 0.60, 0.68),
    });

    // Citation if present
    if (award.reason) {
      const citation = sanitize(award.reason);
      const lines = wrapText(citation, 90);
      const citSize = 10;
      let cy = height - 360;
      for (const line of lines.slice(0, 3)) {
        const lw = fontOblique.widthOfTextAtSize(`"${line}"`, citSize);
        page.drawText(`"${line}"`, {
          x: (width - lw) / 2, y: cy,
          size: citSize, font: fontOblique, color: rgb(0.65, 0.70, 0.78),
        });
        cy -= 16;
      }
    }

    // Gold divider line 2
    page.drawLine({ start: { x: 120, y: 120 }, end: { x: width - 120, y: 120 }, thickness: 0.5, color: rgb(0.85, 0.65, 0.13) });

    // Award date bottom left
    const awardDate = award.created_date
      ? new Date(award.created_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    page.drawText(sanitize(awardDate), {
      x: 80, y: 95,
      size: 9, font: fontReg, color: rgb(0.45, 0.50, 0.58),
    });
    page.drawText("DATE AWARDED", {
      x: 80, y: 81,
      size: 7, font: fontBold, color: rgb(0.35, 0.40, 0.48),
    });

    // Awarded by bottom right
    if (award.awarded_by) {
      const byText = sanitize(award.awarded_by);
      const byW = fontReg.widthOfTextAtSize(byText, 9);
      page.drawText(byText, {
        x: width - 80 - byW, y: 95,
        size: 9, font: fontReg, color: rgb(0.45, 0.50, 0.58),
      });
      const lblW = fontBold.widthOfTextAtSize("AWARDED BY", 7);
      page.drawText("AWARDED BY", {
        x: width - 80 - lblW, y: 81,
        size: 7, font: fontBold, color: rgb(0.35, 0.40, 0.48),
      });
    }

    // Award description bottom center
    if (award.award_description) {
      const desc = sanitize(award.award_description);
      const lines = wrapText(desc, 80);
      const dSize = 8;
      let dy = 100;
      for (const line of lines.slice(0, 2)) {
        const lw = fontReg.widthOfTextAtSize(line, dSize);
        page.drawText(line, {
          x: (width - lw) / 2, y: dy,
          size: dSize, font: fontReg, color: rgb(0.40, 0.45, 0.53),
        });
        dy -= 12;
      }
    }

    // Corner decorators
    const corners = [
      { x: 36, y: height - 36 }, { x: width - 46, y: height - 36 },
      { x: 36, y: 46 }, { x: width - 46, y: 46 },
    ];
    for (const { x, y } of corners) {
      page.drawCircle({ x, y, size: 4, color: rgb(0.85, 0.65, 0.13) });
    }

    const pdfBytes = await doc.save();
    const filename = `certificate_${sanitize(award.recipient_callsign ?? "award").replace(/\s+/g, "_")}_${award_id}.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (err: any) {
    console.error("Certificate generation error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { corsHeaders, "Content-Type": "application/json" },
    });
  }
});
