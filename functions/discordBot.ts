/**
 * TAG Discord Bot — Forum Scraper v5
 * FM-style cover, free-text classification, private signed URLs
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN') ?? '';
const DISCORD_PUBLIC_KEY = Deno.env.get('DISCORD_PUBLIC_KEY') ?? '';
const DISCORD_API = 'https://discord.com/api/v10';
const BASE44_APP_ID = '69bf52c997cae5d4cff87ae4';
const BASE44_SERVICE_TOKEN = Deno.env.get('BASE44_SERVICE_TOKEN') ?? '';

// ── Signature verification ────────────────────────────────────────────────
async function verifyDiscordSignature(req: Request, body: string): Promise<boolean> {
  if (!DISCORD_PUBLIC_KEY) return true;
  const signature = req.headers.get('x-signature-ed25519') ?? '';
  const timestamp = req.headers.get('x-signature-timestamp') ?? '';
  if (!signature || !timestamp) return false;
  try {
    const key = await crypto.subtle.importKey('raw', hexToBytes(DISCORD_PUBLIC_KEY), { name: 'Ed25519' }, false, ['verify']);
    const msg = new TextEncoder().encode(timestamp + body);
    return await crypto.subtle.verify('Ed25519', key, hexToBytes(signature), msg);
  } catch { return false; }
}

function hexToBytes(hex: string): Uint8Array {
  const b = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) b[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return b;
}

// ── Discord API ───────────────────────────────────────────────────────────
async function discordGet(path: string) {
  const r = await fetch(`${DISCORD_API}${path}`, { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } });
  if (!r.ok) throw new Error(`Discord GET ${path} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function ackCallback(interactionId: string, token: string, body: unknown) {
  const r = await fetch(`${DISCORD_API}/interactions/${interactionId}/${token}/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`ack failed: ${r.status} ${await r.text()}`);
}

async function patchFollowup(appId: string, token: string, content: string) {
  await fetch(`${DISCORD_API}/webhooks/${appId}/${token}/messages/@original`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

async function postMessage(channelId: string, content: string) {
  await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

// ── Storage helpers ───────────────────────────────────────────────────────
async function uploadPrivateFile(bytes: Uint8Array, filename: string, mime: string): Promise<string> {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mime }), filename);
  form.append('private', 'true');
  const r = await fetch(`https://api.base44.com/api/apps/${BASE44_APP_ID}/files/upload`, {
    method: 'POST',
    headers: { 'x-api-key': BASE44_SERVICE_TOKEN },
    body: form,
  });
  if (!r.ok) throw new Error(`Upload failed: ${r.status} ${await r.text()}`);
  const data = await r.json();
  // Returns file_uri for private files
  return data.file_uri ?? data.uri ?? data.file_url ?? data.url;
}

async function uploadPublicFile(bytes: Uint8Array, filename: string, mime: string): Promise<string> {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mime }), filename);
  const r = await fetch(`https://api.base44.com/api/apps/${BASE44_APP_ID}/files/upload`, {
    method: 'POST',
    headers: { 'x-api-key': BASE44_SERVICE_TOKEN },
    body: form,
  });
  if (!r.ok) throw new Error(`Upload failed: ${r.status} ${await r.text()}`);
  const data = await r.json();
  return data.file_url ?? data.url ?? data.uri;
}

async function getSignedUrl(fileUri: string): Promise<string> {
  const r = await fetch(`https://api.base44.com/api/apps/${BASE44_APP_ID}/files/signed-url`, {
    method: 'POST',
    headers: { 'x-api-key': BASE44_SERVICE_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_uri: fileUri, expires_in: 3600 }),
  });
  if (!r.ok) throw new Error(`Signed URL failed: ${r.status} ${await r.text()}`);
  const data = await r.json();
  return data.signed_url ?? data.url;
}

async function uploadContentJson(sections: StoredSection[], label: string): Promise<string> {
  const json = JSON.stringify(sections);
  const bytes = new TextEncoder().encode(json);
  return uploadPublicFile(bytes, `${label}_content.json`, 'application/json');
}

async function fetchContentJson(url: string): Promise<StoredSection[]> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to fetch content JSON: ${r.status}`);
  return r.json();
}

// ── Scraping ──────────────────────────────────────────────────────────────
async function getForumThreads(channelId: string): Promise<any[]> {
  const channel = await discordGet(`/channels/${channelId}`);
  const guildId = channel.guild_id;
  const activeRes = await discordGet(`/guilds/${guildId}/threads/active`);
  const active: any[] = (activeRes.threads ?? []).filter((t: any) => t.parent_id === channelId);
  let archived: any[] = [];
  let before: string | null = null;
  while (true) {
    const q = before ? `?before=${before}&limit=100` : '?limit=100';
    const res = await discordGet(`/channels/${channelId}/threads/archived/public${q}`);
    const threads: any[] = res.threads ?? [];
    archived = archived.concat(threads);
    if (!res.has_more || threads.length === 0) break;
    before = threads[threads.length - 1].id;
  }
  return [...active, ...archived];
}

async function getThreadMessages(threadId: string): Promise<any[]> {
  let all: any[] = [];
  let before: string | null = null;
  while (true) {
    const q = before ? `?before=${before}&limit=100` : '?limit=100';
    const msgs: any[] = await discordGet(`/channels/${threadId}/messages${q}`);
    if (!msgs || msgs.length === 0) break;
    all = all.concat(msgs);
    if (msgs.length < 100) break;
    before = msgs[msgs.length - 1].id;
  }
  return all.reverse();
}

async function scrapeChannel(channelId: string): Promise<{ channelName: string; sections: StoredSection[] }> {
  const channel = await discordGet(`/channels/${channelId}`);
  const channelName = channel.name ?? channelId;
  const channelType = channel.type;
  const sections: StoredSection[] = [];

  if (channelType === 15) {
    const threads = await getForumThreads(channelId);
    for (const thread of threads) {
      const msgs = await getThreadMessages(thread.id);
      const filtered = msgs
        .filter((m: any) => (m.content ?? '').trim().length > 0)
        .map((m: any) => ({ author: m.author?.global_name ?? m.author?.username ?? 'Unknown', timestamp: m.timestamp, content: m.content }));
      if (filtered.length > 0) sections.push({ heading: thread.name, messages: filtered });
    }
  } else {
    const msgs = await getThreadMessages(channelId);
    const filtered = msgs
      .filter((m: any) => (m.content ?? '').trim().length > 0)
      .map((m: any) => ({ author: m.author?.global_name ?? m.author?.username ?? 'Unknown', timestamp: m.timestamp, content: m.content }));
    if (filtered.length > 0) sections.push({ heading: channelName, messages: filtered });
  }

  return { channelName, sections };
}

// ── Types ─────────────────────────────────────────────────────────────────
interface StoredMessage { author: string; timestamp: string; content: string; }
interface StoredSection { heading: string; messages: StoredMessage[]; sourceChannel?: string; }

// ── Classification color ──────────────────────────────────────────────────
function classColor(c: string): [number, number, number] {
  const u = c.toUpperCase();
  if (u.includes('TOP SECRET')) return [128, 0, 128];
  if (u.includes('SECRET'))     return [200, 0, 0];
  if (u.includes('CONFIDENTIAL')) return [180, 0, 0];
  if (u.includes('RESTRICTED')) return [200, 100, 0];
  return [0, 100, 0]; // UNCLASSIFIED
}

// ── PDF generation — FM Field Manual style ───────────────────────────────
async function buildPdf(title: string, author: string, classification: string, sections: StoredSection[]): Promise<Uint8Array> {
  const PDFDocument = (await import('npm:pdfkit')).default;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    const chunks: Uint8Array[] = [];
    doc.on('data', (c: Uint8Array) => chunks.push(c));
    doc.on('end', () => {
      const total = chunks.reduce((s, c) => s + c.length, 0);
      const out = new Uint8Array(total); let pos = 0;
      for (const c of chunks) { out.set(c, pos); pos += c.length; }
      resolve(out);
    });
    doc.on('error', reject);

    const cc = classColor(classification);
    const W = doc.page.width;
    const M = 60;

    // ════════════════════════════════════════
    // COVER PAGE
    // ════════════════════════════════════════

    // Classification banner — top
    doc.rect(0, 0, W, 32).fill(cc);
    doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
      .text(classification.toUpperCase(), 0, 9, { align: 'center', characterSpacing: 2 });

    // Top rule
    doc.moveDown(2);
    doc.moveTo(M, doc.y).lineTo(W - M, doc.y).lineWidth(3).strokeColor('#000').stroke();
    doc.moveDown(0.3);

    // FM number top-right style
    const docNumber = `TAG-FM-${new Date().getFullYear()}`;
    doc.fillColor('#000').fontSize(28).font('Helvetica-Bold')
      .text(docNumber, M, doc.y, { align: 'right', characterSpacing: 1 });
    doc.moveDown(0.2);

    // Org header
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000')
      .text('T A C T I C A L   A D A P T A T I O N   G R O U P   F I E L D   M A N U A L', M, doc.y, { align: 'center', characterSpacing: 1 });
    doc.moveDown(0.3);

    // Second rule
    doc.moveTo(M, doc.y).lineTo(W - M, doc.y).lineWidth(2).strokeColor('#000').stroke();
    doc.moveDown(2.5);

    // Big bold title — centered, all caps, FM style
    const titleLines = title.toUpperCase().split(' ');
    // Group into lines of ~3 words for dramatic effect
    const grouped: string[] = [];
    for (let i = 0; i < titleLines.length; i += 3) grouped.push(titleLines.slice(i, i + 3).join(' '));
    doc.fillColor('#000').fontSize(36).font('Helvetica-Bold');
    for (const line of grouped) {
      doc.text(line, M, doc.y, { align: 'center', characterSpacing: 2 });
      doc.moveDown(0.2);
    }
    doc.moveDown(1.5);

    // Distribution box (mimics FM stamp)
    const boxY = doc.y;
    doc.rect(M, boxY, 220, 52).lineWidth(1.5).stroke('#000');
    doc.fillColor('#000').fontSize(8).font('Helvetica-Bold')
      .text('DISTRIBUTION STATEMENT', M + 8, boxY + 6, { width: 204 });
    doc.fontSize(7).font('Helvetica')
      .text(`Approved for use within Tactical Adaptation Group.\nAuthorised personnel only. Classification: ${classification}.`, M + 8, boxY + 18, { width: 204 });
    doc.moveDown(0.5);

    // Doc date bottom right
    doc.fillColor('#000').fontSize(10).font('Helvetica-Bold')
      .text(new Date().toISOString().slice(0, 10).replace(/-/g, ''), M, boxY, { align: 'right', width: W - M * 2 });

    doc.moveDown(4);

    // Third rule
    doc.moveTo(M, doc.y).lineTo(W - M, doc.y).lineWidth(2).strokeColor('#000').stroke();
    doc.moveDown(0.6);

    // HQ line
    doc.fillColor('#000').fontSize(10).font('Helvetica-Bold')
      .text('H E A D Q U A R T E R S ,   T A C T I C A L   A D A P T A T I O N   G R O U P', M, doc.y, { align: 'center', characterSpacing: 1 });
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica')
      .text(`Author: ${author}     ·     ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}`, M, doc.y, { align: 'center' });
    doc.moveDown(0.5);

    // Bottom rule
    doc.moveTo(M, doc.y).lineTo(W - M, doc.y).lineWidth(2).strokeColor('#000').stroke();
    doc.moveDown(0.5);

    // Classification banner — bottom of cover
    const footerY = doc.page.height - 32;
    doc.rect(0, footerY, W, 32).fill(cc);
    doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
      .text(classification.toUpperCase(), 0, footerY + 9, { align: 'center', characterSpacing: 2 });

    // ════════════════════════════════════════
    // TABLE OF CONTENTS PAGE
    // ════════════════════════════════════════
    doc.addPage();

    // Classification banner
    doc.rect(0, 0, W, 32).fill(cc);
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
      .text(classification.toUpperCase(), 0, 10, { align: 'center', characterSpacing: 2 });
    doc.moveDown(2);

    doc.moveTo(M, doc.y).lineTo(W - M, doc.y).lineWidth(2).strokeColor('#000').stroke();
    doc.moveDown(0.5);
    doc.fillColor('#000').fontSize(14).font('Helvetica-Bold')
      .text('C O N T E N T S', M, doc.y, { align: 'center', characterSpacing: 3 });
    doc.moveDown(0.5);
    doc.moveTo(M, doc.y).lineTo(W - M, doc.y).lineWidth(1).strokeColor('#000').stroke();
    doc.moveDown(0.8);

    sections.forEach((s, i) => {
      doc.fillColor('#000').fontSize(9).font('Helvetica')
        .text(`${String(i + 1).padStart(3, '0')}   ${s.heading.toUpperCase()}${s.sourceChannel ? `   [${s.sourceChannel.toUpperCase()}]` : ''}`, M + 10, doc.y);
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);
    doc.moveTo(M, doc.y).lineTo(W - M, doc.y).lineWidth(1).strokeColor('#000').stroke();

    // Classification banner bottom
    const tocFooterY = doc.page.height - 32;
    doc.rect(0, tocFooterY, W, 32).fill(cc);
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
      .text(classification.toUpperCase(), 0, tocFooterY + 10, { align: 'center', characterSpacing: 2 });

    // ════════════════════════════════════════
    // CONTENT PAGES
    // ════════════════════════════════════════
    doc.addPage();

    // Page header/footer helper
    const addPageBanners = () => {
      doc.rect(0, 0, W, 32).fill(cc);
      doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
        .text(classification.toUpperCase(), 0, 10, { align: 'center', characterSpacing: 2 });
      const pf = doc.page.height - 32;
      doc.rect(0, pf, W, 32).fill(cc);
      doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
        .text(classification.toUpperCase(), 0, pf + 10, { align: 'center', characterSpacing: 2 });
    };

    addPageBanners();
    doc.moveDown(2);

    let currentChannel = '';
    for (const section of sections) {
      // Channel divider
      if (section.sourceChannel && section.sourceChannel !== currentChannel) {
        currentChannel = section.sourceChannel;
        if (doc.y > doc.page.height - 140) {
          doc.addPage();
          addPageBanners();
          doc.moveDown(2);
        }
        doc.moveTo(M, doc.y).lineTo(W - M, doc.y).lineWidth(2).strokeColor('#000').stroke();
        doc.moveDown(0.4);
        doc.fillColor('#000').fontSize(9).font('Helvetica-Bold')
          .text(`C H A P T E R   S O U R C E :   ${currentChannel.toUpperCase()}`, M, doc.y, { align: 'center', characterSpacing: 2 });
        doc.moveDown(0.4);
        doc.moveTo(M, doc.y).lineTo(W - M, doc.y).lineWidth(2).strokeColor('#000').stroke();
        doc.moveDown(1);
      }

      if (doc.y > doc.page.height - 120) {
        doc.addPage();
        addPageBanners();
        doc.moveDown(2);
      }

      // Section heading — FM style ruled
      doc.moveTo(M, doc.y).lineTo(W - M, doc.y).lineWidth(1.5).strokeColor('#000').stroke();
      doc.moveDown(0.3);
      doc.fillColor('#000').fontSize(12).font('Helvetica-Bold')
        .text(section.heading.toUpperCase(), M, doc.y, { characterSpacing: 1 });
      doc.moveDown(0.3);
      doc.moveTo(M, doc.y).lineTo(W - M, doc.y).lineWidth(1).strokeColor('#000').stroke();
      doc.moveDown(0.8);

      for (const msg of section.messages) {
        if (doc.y > doc.page.height - 90) {
          doc.addPage();
          addPageBanners();
          doc.moveDown(2);
        }

        // Author/timestamp in small caps style
        doc.fillColor('#555').fontSize(7).font('Helvetica-Bold')
          .text(`${msg.author.toUpperCase()}   ·   ${new Date(msg.timestamp).toISOString().replace('T', ' ').slice(0, 16)}`, M, doc.y, { characterSpacing: 1 });
        doc.moveDown(0.3);

        const clean = msg.content
          .replace(/\*\*(.*?)\*\*/gs, '$1')
          .replace(/\*(.*?)\*/gs, '$1')
          .replace(/`{1,3}(.*?)`{1,3}/gs, '$1')
          .replace(/^#{1,6}\s/gm, '')
          .replace(/^>\s/gm, '    ');

        doc.fillColor('#000').fontSize(10).font('Helvetica')
          .text(clean, M, doc.y, { width: W - M * 2, lineGap: 3, paragraphGap: 2 });
        doc.moveDown(0.8);
      }

      doc.moveDown(0.5);
    }

    doc.end();
  });
}

// ── Interaction handler ───────────────────────────────────────────────────
async function handleInteraction(interaction: any, req: Request): Promise<Response> {
  const type = interaction.type;
  if (type === 1) return Response.json({ type: 1 });

  if (type === 2 && interaction.data?.name === 'scrape') {
    const channelId = interaction.channel_id;
    await ackCallback(interaction.id, interaction.token, {
      type: 4,
      data: {
        flags: 64,
        content: '📄 **What would you like to do?**',
        components: [{ type: 1, components: [
          { type: 2, style: 1, label: '✨ Create New Document', custom_id: `scrape_new:${channelId}` },
          { type: 2, style: 2, label: '➕ Add Channel to Existing Doc', custom_id: `scrape_append:${channelId}` },
          { type: 2, style: 4, label: '🗑️ Delete a Document', custom_id: `scrape_delete:${channelId}` },
        ]}]
      }
    });
    return Response.json({ type: 1 });
  }

  if (type === 3) {
    const customId: string = interaction.data?.custom_id ?? '';

    if (customId.startsWith('scrape_new:')) {
      const channelId = customId.split(':')[1];
      await ackCallback(interaction.id, interaction.token, {
        type: 9,
        data: {
          custom_id: `scrape_modal:${channelId}`,
          title: 'New Training Document',
          components: [
            { type: 1, components: [{ type: 4, custom_id: 'doc_title', label: 'Document Title', style: 1, required: true, placeholder: 'e.g. Combat Infantryman Course' }] },
            { type: 1, components: [{ type: 4, custom_id: 'doc_author', label: 'Author / Unit', style: 1, required: true, placeholder: 'e.g. SunrayActual / E-Squadron TAG' }] },
            { type: 1, components: [{ type: 4, custom_id: 'doc_class', label: 'Classification Level', style: 1, required: true, value: 'UNCLASSIFIED' }] },
          ]
        }
      });
      return Response.json({ type: 1 });
    }

    if (customId.startsWith('scrape_append:')) {
      const channelId = customId.split(':')[1];
      const base44 = createClientFromRequest(req);
      let existingPdfs: any[] = [];
      try { existingPdfs = await base44.asServiceRole.entities.BotExportedPdf.list(); } catch {}
      if (!existingPdfs || existingPdfs.length === 0) {
        await ackCallback(interaction.id, interaction.token, { type: 4, data: { flags: 64, content: '❌ No existing documents found. Use **Create New Document** first.' } });
        return Response.json({ type: 1 });
      }
      const options = existingPdfs.slice(0, 25).map((pdf: any) => ({
        label: (pdf.title ?? pdf.id).slice(0, 100),
        description: `${pdf.section_count ?? 0} sections · ${pdf.classification ?? 'UNCLASSIFIED'}`,
        value: pdf.id,
      }));
      await ackCallback(interaction.id, interaction.token, {
        type: 4,
        data: {
          flags: 64,
          content: '➕ **Which document should this channel be added to?**',
          components: [{ type: 1, components: [{ type: 3, custom_id: `scrape_select:${channelId}`, options, placeholder: 'Choose a document...' }] }]
        }
      });
      return Response.json({ type: 1 });
    }

    if (customId.startsWith('scrape_delete:')) {
      const base44 = createClientFromRequest(req);
      let existingPdfs: any[] = [];
      try { existingPdfs = await base44.asServiceRole.entities.BotExportedPdf.list(); } catch {}
      if (!existingPdfs || existingPdfs.length === 0) {
        await ackCallback(interaction.id, interaction.token, { type: 4, data: { flags: 64, content: '❌ No documents found to delete.' } });
        return Response.json({ type: 1 });
      }
      const options = existingPdfs.slice(0, 25).map((pdf: any) => ({
        label: (pdf.title ?? pdf.id).slice(0, 100),
        description: `${pdf.section_count ?? 0} sections · ${pdf.classification ?? 'UNCLASSIFIED'}`,
        value: pdf.id,
      }));
      await ackCallback(interaction.id, interaction.token, {
        type: 4,
        data: {
          flags: 64,
          content: '🗑️ **Which document do you want to delete?**',
          components: [{ type: 1, components: [{ type: 3, custom_id: `scrape_delete_select`, options, placeholder: 'Choose a document to delete...' }] }]
        }
      });
      return Response.json({ type: 1 });
    }

    if (customId === 'scrape_delete_select') {
      const selectedPdfId = interaction.data?.values?.[0];
      if (!selectedPdfId) {
        await ackCallback(interaction.id, interaction.token, { type: 4, data: { flags: 64, content: '❌ No document selected.' } });
        return Response.json({ type: 1 });
      }
      await ackCallback(interaction.id, interaction.token, {
        type: 4,
        data: {
          flags: 64,
          content: `⚠️ **Are you sure?** This will permanently delete this document.`,
          components: [{ type: 1, components: [
            { type: 2, style: 4, label: '🗑️ Yes, Delete It', custom_id: `scrape_delete_confirm:${selectedPdfId}` },
            { type: 2, style: 2, label: '✖ Cancel', custom_id: `scrape_delete_cancel` },
          ]}]
        }
      });
      return Response.json({ type: 1 });
    }

    if (customId === 'scrape_delete_cancel') {
      await ackCallback(interaction.id, interaction.token, { type: 7, data: { flags: 64, content: '✅ Cancelled.' } });
      return Response.json({ type: 1 });
    }

    if (customId.startsWith('scrape_delete_confirm:')) {
      const pdfId = customId.split(':')[1];
      const appId = interaction.application_id;
      const token = interaction.token;
      await ackCallback(interaction.id, token, { type: 7, data: { flags: 64, content: '⏳ Deleting...' } });
      (async () => {
        try {
          const base44 = createClientFromRequest(req);
          const record = await base44.asServiceRole.entities.BotExportedPdf.get(pdfId);
          await base44.asServiceRole.entities.BotExportedPdf.delete(pdfId);
          await patchFollowup(appId, token, `🗑️ Deleted **${record?.title ?? pdfId}** successfully.`);
        } catch (err: any) {
          await patchFollowup(appId, token, `❌ Delete failed: ${err.message}`);
        }
      })();
      return Response.json({ type: 1 });
    }

    if (customId.startsWith('scrape_select:')) {
      const channelId = customId.split(':')[1];
      const selectedPdfId = interaction.data?.values?.[0];
      if (!selectedPdfId) {
        await ackCallback(interaction.id, interaction.token, { type: 4, data: { flags: 64, content: '❌ No document selected.' } });
        return Response.json({ type: 1 });
      }
      const appId = interaction.application_id;
      const token = interaction.token;
      await ackCallback(interaction.id, token, { type: 7, data: { flags: 64, content: '⏳ Scraping channel...' } });
      (async () => {
        try {
          const base44 = createClientFromRequest(req);
          const existingRecord = await base44.asServiceRole.entities.BotExportedPdf.get(selectedPdfId);
          if (!existingRecord) throw new Error('Could not find the selected document.');

          let existingSections: StoredSection[] = [];
          if (existingRecord.content_json) {
            try { existingSections = await fetchContentJson(existingRecord.content_json); } catch {}
          }

          const { channelName, sections: newSections } = await scrapeChannel(channelId);
          if (newSections.length === 0) throw new Error('No text content found in this channel.');

          const alreadyImported = existingSections.some(s => s.sourceChannel === channelName);
          if (alreadyImported) {
            await patchFollowup(appId, token, `⚠️ **${channelName}** is already in this document. Skipping to avoid duplicates.`);
            return;
          }

          const taggedSections = newSections.map(s => ({ ...s, sourceChannel: channelName }));
          const mergedSections = [...existingSections, ...taggedSections];

          await patchFollowup(appId, token, `⏳ Building combined document (${mergedSections.length} total sections)...`);
          const pdfBytes = await buildPdf(
            existingRecord.title, existingRecord.author,
            existingRecord.classification ?? 'UNCLASSIFIED',
            mergedSections
          );

          // Upload PDF as private file and get signed URL
          const pdfUri = await uploadPrivateFile(pdfBytes, `${existingRecord.title.replace(/[^a-z0-9]/gi, '_')}.pdf`, 'application/pdf');
          const signedUrl = await getSignedUrl(pdfUri);

          const newMsgCount = taggedSections.reduce((s, sec) => s + sec.messages.length, 0);
          await postMessage(channelId,
            `✅ **${existingRecord.title}** updated — added **${channelName}** (+${taggedSections.length} sections, +${newMsgCount} messages). Total: **${mergedSections.length} sections**.\n📥 **Download (expires 1hr):** ${signedUrl}`
          );

          const contentUrl = await uploadContentJson(mergedSections, existingRecord.title.replace(/[^a-z0-9]/gi, '_'));
          const totalMessages = mergedSections.reduce((s, sec) => s + sec.messages.length, 0);
          await base44.asServiceRole.entities.BotExportedPdf.update(selectedPdfId, {
            content_json: contentUrl,
            file_uri: pdfUri,
            section_count: mergedSections.length,
            message_count: totalMessages,
          });

          await patchFollowup(appId, token, `✅ Done! **${mergedSections.length} sections** total. Download link posted above (valid 1 hour).`);
        } catch (err: any) {
          await patchFollowup(appId, token, `❌ Failed: ${err.message}`);
        }
      })();
      return Response.json({ type: 1 });
    }
  }

  if (type === 5) {
    const customId: string = interaction.data?.custom_id ?? '';
    if (customId.startsWith('scrape_modal:')) {
      const channelId = customId.split(':')[1];
      const appId = interaction.application_id;
      const token = interaction.token;

      const components = interaction.data?.components ?? [];
      const getValue = (id: string) => components.flatMap((r: any) => r.components).find((c: any) => c.custom_id === id)?.value ?? '';

      const title = getValue('doc_title').trim();
      const author = getValue('doc_author').trim();
      const classification = getValue('doc_class').trim().toUpperCase() || 'UNCLASSIFIED';

      await ackCallback(interaction.id, token, { type: 5, data: { flags: 64 } });

      (async () => {
        try {
          await patchFollowup(appId, token, `⏳ Scraping channel...`);
          const { channelName, sections } = await scrapeChannel(channelId);
          if (sections.length === 0) throw new Error('No text content found in this channel.');

          const taggedSections = sections.map(s => ({ ...s, sourceChannel: channelName }));

          await patchFollowup(appId, token, `⏳ Building document (${taggedSections.length} sections)...`);
          const pdfBytes = await buildPdf(title, author, classification, taggedSections);

          // Upload as private file and generate signed URL
          const pdfUri = await uploadPrivateFile(pdfBytes, `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`, 'application/pdf');
          const signedUrl = await getSignedUrl(pdfUri);

          await postMessage(channelId,
            `✅ **${title}** [${classification}] — ${taggedSections.length} sections from **${channelName}**.\n📥 **Download (expires 1hr):** ${signedUrl}\n\nGo to your next channel and use \`/scrape\` → **Add Channel to Existing Doc** to keep building.`
          );

          const contentUrl = await uploadContentJson(taggedSections, title.replace(/[^a-z0-9]/gi, '_'));

          const base44 = createClientFromRequest(req);
          await base44.asServiceRole.entities.BotExportedPdf.create({
            title, author, classification,
            channel_id: channelId,
            channel_name: channelName,
            section_count: taggedSections.length,
            message_count: taggedSections.reduce((s, sec) => s + sec.messages.length, 0),
            content_json: contentUrl,
            file_uri: pdfUri,
          });

          await patchFollowup(appId, token, `✅ Done! Download link posted above (valid 1 hour). Head to your next channel and use \`/scrape\` → **Add Channel to Existing Doc** to keep building.`);
        } catch (err: any) {
          await patchFollowup(appId, token, `❌ Scrape failed: ${err.message}`);
        }
      })();

      return Response.json({ type: 1 });
    }
  }

  return Response.json({ type: 1 });
}

Deno.serve(async (req) => {
  if (req.method === 'GET') return Response.json({ ok: true, service: 'TAG Discord Bot v5' });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const body = await req.text();
  const valid = await verifyDiscordSignature(req, body);
  if (!valid) return new Response('Invalid signature', { status: 401 });
  const interaction = JSON.parse(body);
  return handleInteraction(interaction, req);
});
