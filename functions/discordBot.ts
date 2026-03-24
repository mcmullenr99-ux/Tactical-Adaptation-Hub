/**
 * TAG Discord Bot — Forum Scraper v5
 * Fully self-contained — no SDK, direct REST API calls only
 */

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN') ?? '';
const DISCORD_PUBLIC_KEY = Deno.env.get('DISCORD_PUBLIC_KEY') ?? '';
const DISCORD_API = 'https://discord.com/api/v10';
const BASE44_APP_ID = '69bf52c997cae5d4cff87ae4';
const BASE44_BASE = 'https://app.base44.com';

function serviceHeaders(extra?: Record<string, string>) {
  const token = Deno.env.get('BASE44_SERVICE_TOKEN') ?? '';
  return { 'Authorization': `Bearer ${token}`, ...(extra ?? {}) };
}

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
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`ack failed: ${r.status} ${await r.text()}`);
}

async function patchFollowup(appId: string, token: string, content: string) {
  await fetch(`${DISCORD_API}/webhooks/${appId}/${token}/messages/@original`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }),
  });
}

async function postMessage(channelId: string, content: string) {
  await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

// ── Storage ───────────────────────────────────────────────────────────────
async function uploadFile(bytes: Uint8Array, filename: string, mime: string): Promise<string> {
  const serviceToken = Deno.env.get('BASE44_SERVICE_TOKEN') ?? '';
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mime }), filename);
  const r = await fetch(`https://api.base44.com/api/apps/${BASE44_APP_ID}/files/upload`, {
    method: 'POST',
    headers: { 'x-api-key': serviceToken },
    body: form,
  });
  if (!r.ok) throw new Error(`Upload failed ${r.status}: ${await r.text()}`);
  const data = await r.json();
  const url = data.file_url ?? data.url;
  if (!url) throw new Error(`No URL in upload response: ${JSON.stringify(data)}`);
  return url;
}

async function uploadContentJson(sections: StoredSection[], label: string): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(sections));
  return uploadFile(bytes, `${label}_content.json`, 'application/json');
}

async function fetchContentJson(url: string): Promise<StoredSection[]> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to fetch content JSON: ${r.status}`);
  return r.json();
}

// ── Entities ──────────────────────────────────────────────────────────────
async function entityCreate(entityName: string, data: Record<string, unknown>): Promise<any> {
  const r = await fetch(`${BASE44_BASE}/api/apps/${BASE44_APP_ID}/entities/${entityName}`, {
    method: 'POST',
    headers: serviceHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`Entity create failed ${r.status}: ${await r.text()}`);
  return r.json();
}

async function entityUpdate(entityName: string, id: string, data: Record<string, unknown>): Promise<any> {
  const r = await fetch(`${BASE44_BASE}/api/apps/${BASE44_APP_ID}/entities/${entityName}/${id}`, {
    method: 'PUT',
    headers: serviceHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`Entity update failed ${r.status}: ${await r.text()}`);
  return r.json();
}

async function entityGet(entityName: string, id: string): Promise<any> {
  const r = await fetch(`${BASE44_BASE}/api/apps/${BASE44_APP_ID}/entities/${entityName}/${id}`, {
    headers: serviceHeaders(),
  });
  if (!r.ok) throw new Error(`Entity get failed ${r.status}: ${await r.text()}`);
  return r.json();
}

async function entityList(entityName: string): Promise<any[]> {
  const r = await fetch(`${BASE44_BASE}/api/apps/${BASE44_APP_ID}/entities/${entityName}`, {
    headers: serviceHeaders(),
  });
  if (!r.ok) throw new Error(`Entity list failed ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return Array.isArray(data) ? data : (data.items ?? data.results ?? []);
}

async function entityDelete(entityName: string, id: string): Promise<void> {
  const r = await fetch(`${BASE44_BASE}/api/apps/${BASE44_APP_ID}/entities/${entityName}/${id}`, {
    method: 'DELETE',
    headers: serviceHeaders(),
  });
  if (!r.ok) throw new Error(`Entity delete failed ${r.status}: ${await r.text()}`);
}

// ── Scraping ──────────────────────────────────────────────────────────────
interface StoredMessage { author: string; timestamp: string; content: string; }
interface StoredSection { heading: string; messages: StoredMessage[]; sourceChannel?: string; }

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
  const sections: StoredSection[] = [];
  if (channel.type === 15) {
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

// ── Classification colour ─────────────────────────────────────────────────
function classColor(c: string): [number, number, number] {
  const u = c.toUpperCase();
  if (u.includes('TOP SECRET')) return [128, 0, 128];
  if (u.includes('SECRET'))     return [200, 0, 0];
  if (u.includes('CONFIDENTIAL')) return [180, 0, 0];
  if (u.includes('RESTRICTED')) return [200, 100, 0];
  return [0, 100, 0];
}

// ── Sanitise text for WinAnsi (pdf-lib standard fonts are Latin-only) ────
function sanitize(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/—/g, '--')
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .replace(/[^	
 -~ -ÿ]/g, '?');
}

// ── PDF ───────────────────────────────────────────────────────────────────
async function buildPdf(title: string, author: string, classification: string, sections: StoredSection[]): Promise<Uint8Array> {
  const { PDFDocument, rgb, StandardFonts, PageSizes } = await import('npm:pdf-lib@1.17.1');

  const doc = await PDFDocument.create();
  const font      = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold  = await doc.embedFont(StandardFonts.HelveticaBold);

  const classUpper = classification.toUpperCase();
  const cc = (() => {
    if (classUpper.includes('TOP SECRET'))    return rgb(0.5,  0,   0.5);
    if (classUpper.includes('SECRET'))        return rgb(0.78, 0,   0);
    if (classUpper.includes('RESTRICTED'))    return rgb(0.78, 0.4, 0);
    return rgb(0, 0.39, 0);
  })();
  const black = rgb(0, 0, 0);
  const white = rgb(1, 1, 1);
  const grey  = rgb(0.33, 0.33, 0.33);

  const W = PageSizes.A4[0];
  const H = PageSizes.A4[1];
  const M = 60;
  const BANNER = 28;
  const LINE_H = 14;

  function addPage() {
    const p = doc.addPage(PageSizes.A4);
    // top banner
    p.drawRectangle({ x: 0, y: H - BANNER, width: W, height: BANNER, color: cc });
    p.drawText(classUpper, { x: 0, y: H - BANNER + 8, size: 10, font: fontBold, color: white, maxWidth: W });
    // bottom banner
    p.drawRectangle({ x: 0, y: 0, width: W, height: BANNER, color: cc });
    p.drawText(classUpper, { x: 0, y: 8, size: 10, font: fontBold, color: white, maxWidth: W });
    return p;
  }

  // ── COVER PAGE ──
  const cover = addPage();
  let cy = H - BANNER - 40;

  cover.drawText('TACTICAL ADAPTATION GROUP', { x: M, y: cy, size: 8, font: fontBold, color: black });
  cy -= 20;
  cover.drawLine({ start: { x: M, y: cy }, end: { x: W - M, y: cy }, thickness: 2, color: black });
  cy -= 30;

  // Title — break into lines
  const words = title.toUpperCase().split(' ');
  const titleLines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (fontBold.widthOfTextAtSize(test, 24) > W - M * 2) { titleLines.push(line); line = w; }
    else line = test;
  }
  if (line) titleLines.push(line);

  for (const tl of titleLines) {
    const tw = fontBold.widthOfTextAtSize(tl, 24);
    cover.drawText(tl, { x: (W - tw) / 2, y: cy, size: 24, font: fontBold, color: black });
    cy -= 32;
  }
  cy -= 10;
  cover.drawLine({ start: { x: M, y: cy }, end: { x: W - M, y: cy }, thickness: 1, color: black });
  cy -= 20;

  cover.drawText(`Author: ${author}`, { x: M, y: cy, size: 10, font, color: black });
  cy -= 16;
  cover.drawText(`Classification: ${classUpper}`, { x: M, y: cy, size: 10, font, color: black });
  cy -= 16;
  cover.drawText(`Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}`, { x: M, y: cy, size: 10, font, color: black });
  cy -= 16;
  cover.drawText(`Sections: ${sections.length}`, { x: M, y: cy, size: 10, font, color: black });

  // ── CONTENT PAGES ──
  const maxY = H - BANNER - 20;
  const minY = BANNER + 20;

  let page = addPage();
  let y = maxY;

  function ensureSpace(needed: number) {
    if (y - needed < minY) {
      page = addPage();
      y = maxY;
    }
  }

  function drawWrapped(text: string, x: number, size: number, f: any, color: any, maxW: number): number {
    // Simple word-wrap
    const wds = text.split(' ');
    let cur = '';
    let linesDrawn = 0;
    for (const w of wds) {
      const test = cur ? `${cur} ${w}` : w;
      if (f.widthOfTextAtSize(test, size) > maxW) {
        ensureSpace(LINE_H + 4);
        page.drawText(cur, { x, y, size, font: f, color });
        y -= LINE_H;
        linesDrawn++;
        cur = w;
      } else cur = test;
    }
    if (cur) {
      ensureSpace(LINE_H + 4);
      page.drawText(cur, { x, y, size, font: f, color });
      y -= LINE_H;
      linesDrawn++;
    }
    return linesDrawn;
  }

  for (const section of sections) {
    // Section heading
    ensureSpace(LINE_H * 3);
    page.drawLine({ start: { x: M, y: y + 4 }, end: { x: W - M, y: y + 4 }, thickness: 1, color: black });
    y -= 6;
    drawWrapped(sanitize(section.heading.toUpperCase()), M, 11, fontBold, black, W - M * 2);
    page.drawLine({ start: { x: M, y: y + 2 }, end: { x: W - M, y: y + 2 }, thickness: 0.5, color: black });
    y -= 10;

    for (const msg of section.messages) {
      ensureSpace(LINE_H * 3);
      const ts = new Date(msg.timestamp).toISOString().replace('T', ' ').slice(0, 16);
      page.drawText(sanitize(`${msg.author.toUpperCase()}  ·  ${ts}`), { x: M, y, size: 7, font: fontBold, color: grey });
      y -= 12;

      const clean = msg.content
        .replace(/\*\*(.*?)\*\*/gs, '$1').replace(/\*(.*?)\*/gs, '$1')
        .replace(/`{1,3}(.*?)`{1,3}/gs, '$1').replace(/^#{1,6}\s/gm, '').replace(/^>\s/gm, '  ');

      // Split on newlines first, then word-wrap each line
      for (const para of clean.split(/
+/)) {
        const trimmed = para.trim();
        if (!trimmed) { y -= 6; continue; }
        drawWrapped(trimmed, M, 9, font, black, W - M * 2);
      }
      y -= 8;
    }
    y -= 6;
  }

  const bytes = await doc.save();
  return new Uint8Array(bytes);
}


// ── Interaction handler ───────────────────────────────────────────────────
async function handleInteraction(interaction: any): Promise<Response> {
  const type = interaction.type;
  if (type === 1) return Response.json({ type: 1 });

  // Slash command: /scrape
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
        ]}],
      },
    });
    return Response.json({ type: 1 });
  }

  // Button / select interactions
  if (type === 3) {
    const customId: string = interaction.data?.custom_id ?? '';

    // ── Create New → open modal
    if (customId.startsWith('scrape_new:')) {
      const channelId = customId.split(':')[1];
      await ackCallback(interaction.id, interaction.token, {
        type: 9,
        data: {
          custom_id: `scrape_modal:${channelId}`,
          title: 'New Training Document',
          components: [
            { type: 1, components: [{ type: 4, custom_id: 'doc_title', label: 'Document Title', style: 1, required: true, placeholder: 'e.g. Combat Infantryman Course' }] },
            { type: 1, components: [{ type: 4, custom_id: 'doc_author', label: 'Author / Unit', style: 1, required: true, placeholder: 'e.g. SunrayActual / TAG' }] },
            { type: 1, components: [{ type: 4, custom_id: 'doc_class', label: 'Classification Level', style: 1, required: true, value: 'UNCLASSIFIED' }] },
          ],
        },
      });
      return Response.json({ type: 1 });
    }

    // ── Append → show doc picker
    if (customId.startsWith('scrape_append:')) {
      const channelId = customId.split(':')[1];
      let existingPdfs: any[] = [];
      try { existingPdfs = await entityList('BotExportedPdf'); } catch {}
      if (!existingPdfs.length) {
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
          components: [{ type: 1, components: [{ type: 3, custom_id: `scrape_select:${channelId}`, options, placeholder: 'Choose a document...' }] }],
        },
      });
      return Response.json({ type: 1 });
    }

    // ── Delete → show doc picker
    if (customId.startsWith('scrape_delete:')) {
      let existingPdfs: any[] = [];
      try { existingPdfs = await entityList('BotExportedPdf'); } catch {}
      if (!existingPdfs.length) {
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
          components: [{ type: 1, components: [{ type: 3, custom_id: `scrape_delete_select`, options, placeholder: 'Choose a document to delete...' }] }],
        },
      });
      return Response.json({ type: 1 });
    }

    // ── Delete confirm picker
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
          content: '⚠️ **Are you sure?** This will permanently delete this document.',
          components: [{ type: 1, components: [
            { type: 2, style: 4, label: '🗑️ Yes, Delete It', custom_id: `scrape_delete_confirm:${selectedPdfId}` },
            { type: 2, style: 2, label: '✖ Cancel', custom_id: `scrape_delete_cancel` },
          ]}],
        },
      });
      return Response.json({ type: 1 });
    }

    if (customId === 'scrape_delete_cancel') {
      await ackCallback(interaction.id, interaction.token, { type: 7, data: { flags: 64, content: '✅ Cancelled.' } });
      return Response.json({ type: 1 });
    }

    // ── Delete confirmed
    if (customId.startsWith('scrape_delete_confirm:')) {
      const pdfId = customId.split(':')[1];
      const appId = interaction.application_id;
      const token = interaction.token;
      await ackCallback(interaction.id, token, { type: 7, data: { flags: 64, content: '⏳ Deleting...' } });
      (async () => {
        try {
          const record = await entityGet('BotExportedPdf', pdfId);
          await entityDelete('BotExportedPdf', pdfId);
          await patchFollowup(appId, token, `🗑️ Deleted **${record?.title ?? pdfId}** successfully.`);
        } catch (err: any) {
          await patchFollowup(appId, token, `❌ Delete failed: ${err.message}`);
        }
      })();
      return Response.json({ type: 1 });
    }

    // ── Append: doc selected → scrape + merge
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
          const existingRecord = await entityGet('BotExportedPdf', selectedPdfId);
          if (!existingRecord) throw new Error('Could not find the selected document.');

          let existingSections: StoredSection[] = [];
          if (existingRecord.content_json) {
            try { existingSections = await fetchContentJson(existingRecord.content_json); } catch {}
          }

          const { channelName, sections: newSections } = await scrapeChannel(channelId);
          if (newSections.length === 0) throw new Error('No text content found in this channel.');

          if (existingSections.some((s) => s.sourceChannel === channelName)) {
            await patchFollowup(appId, token, `⚠️ **${channelName}** is already in this document. Skipping.`);
            return;
          }

          const taggedSections = newSections.map((s) => ({ ...s, sourceChannel: channelName }));
          const mergedSections = [...existingSections, ...taggedSections];

          await patchFollowup(appId, token, `⏳ Building combined document (${mergedSections.length} total sections)...`);

          const pdfBytes = await buildPdf(
            existingRecord.title, existingRecord.author,
            existingRecord.classification ?? 'UNCLASSIFIED', mergedSections,
          );
          const pdfUrl = await uploadFile(pdfBytes, `${existingRecord.title.replace(/[^a-z0-9]/gi, '_')}.pdf`, 'application/pdf');

          const newMsgCount = taggedSections.reduce((s, sec) => s + sec.messages.length, 0);
          await postMessage(channelId,
            `✅ **${existingRecord.title}** updated — added **${channelName}** (+${taggedSections.length} sections, +${newMsgCount} messages). Total: **${mergedSections.length} sections**.\n📥 **Download:** ${pdfUrl}`,
          );

          const contentUrl = await uploadContentJson(mergedSections, existingRecord.title.replace(/[^a-z0-9]/gi, '_'));
          await entityUpdate('BotExportedPdf', selectedPdfId, {
            content_json: contentUrl,
            file_url: pdfUrl,
            section_count: mergedSections.length,
            message_count: mergedSections.reduce((s, sec) => s + sec.messages.length, 0),
          });

          await patchFollowup(appId, token, `✅ Done! **${mergedSections.length} sections** total. Download link posted above.`);
        } catch (err: any) {
          await patchFollowup(appId, token, `❌ Failed: ${err.message}`);
        }
      })();
      return Response.json({ type: 1 });
    }
  }

  // Modal submit
  if (type === 5) {
    const customId: string = interaction.data?.custom_id ?? '';
    if (customId.startsWith('scrape_modal:')) {
      const channelId = customId.split(':')[1];
      const appId = interaction.application_id;
      const token = interaction.token;

      const components = interaction.data?.components ?? [];
      const getValue = (id: string) =>
        components.flatMap((r: any) => r.components).find((c: any) => c.custom_id === id)?.value ?? '';

      const title = getValue('doc_title').trim();
      const author = getValue('doc_author').trim();
      const classification = getValue('doc_class').trim().toUpperCase() || 'UNCLASSIFIED';

      await ackCallback(interaction.id, token, { type: 5, data: { flags: 64 } });

      (async () => {
        try {
          await patchFollowup(appId, token, `⏳ Scraping channel...`);

          const { channelName, sections } = await scrapeChannel(channelId);
          if (sections.length === 0) throw new Error('No text content found in this channel.');

          const taggedSections = sections.map((s) => ({ ...s, sourceChannel: channelName }));

          await patchFollowup(appId, token, `⏳ Building document (${taggedSections.length} sections)...`);

          const pdfBytes = await buildPdf(title, author, classification, taggedSections);
          const pdfUrl = await uploadFile(pdfBytes, `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`, 'application/pdf');

          await postMessage(channelId,
            `✅ **${title}** [${classification}] — ${taggedSections.length} sections from **${channelName}**.\n📥 **Download:** ${pdfUrl}\n\nUse \`/scrape\` → **Add Channel to Existing Doc** in other channels to keep building.`,
          );

          const contentUrl = await uploadContentJson(taggedSections, title.replace(/[^a-z0-9]/gi, '_'));

          await entityCreate('BotExportedPdf', {
            title, author, classification,
            channel_id: channelId,
            channel_name: channelName,
            section_count: taggedSections.length,
            message_count: taggedSections.reduce((s, sec) => s + sec.messages.length, 0),
            content_json: contentUrl,
            file_url: pdfUrl,
          });

          await patchFollowup(appId, token, `✅ Done! Download link posted above.`);
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
  return handleInteraction(interaction);
});
