/**
 * TAG Discord Bot Worker — does the heavy lifting (scrape + PDF + upload)
 * Called by discordBot function via HTTP after immediately acking Discord
 */

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN') ?? '';
const DISCORD_API = 'https://discord.com/api/v10';
const BASE44_APP_ID = '69bf52c997cae5d4cff87ae4';
const BASE44_BASE = 'https://app.base44.com';

function serviceHeaders(extra?: Record<string, string>) {
  const token = Deno.env.get('BASE44_SERVICE_TOKEN') ?? '';
  return { 'Authorization': `Bearer ${token}`, ...(extra ?? {}) };
}

// ── Discord ───────────────────────────────────────────────────────────────
async function discordGet(path: string) {
  const r = await fetch(`${DISCORD_API}${path}`, { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } });
  if (!r.ok) throw new Error(`Discord GET ${path} -> ${r.status}: ${await r.text()}`);
  return r.json();
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
    method: 'POST', headers: serviceHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`Entity create failed ${r.status}: ${await r.text()}`);
  return r.json();
}

async function entityUpdate(entityName: string, id: string, data: Record<string, unknown>): Promise<any> {
  const r = await fetch(`${BASE44_BASE}/api/apps/${BASE44_APP_ID}/entities/${entityName}/${id}`, {
    method: 'PUT', headers: serviceHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(data),
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

// ── WinAnsi sanitizer ─────────────────────────────────────────────────────
function sanitize(text: string): string {
  return text
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '*')
    .replace(/[^\u0009\u000A\u000D\u0020-\u007E\u00A0-\u00FF]/g, '?');
}

// ── PDF ───────────────────────────────────────────────────────────────────
async function buildPdf(title: string, author: string, classification: string, sections: StoredSection[]): Promise<Uint8Array> {
  const { PDFDocument, rgb, StandardFonts, PageSizes } = await import('npm:pdf-lib@1.17.1');

  const doc = await PDFDocument.create();
  const font     = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const classUpper = sanitize(classification.toUpperCase());
  const cc = (() => {
    if (classUpper.includes('TOP SECRET'))  return rgb(0.5,  0,   0.5);
    if (classUpper.includes('SECRET'))      return rgb(0.78, 0,   0);
    if (classUpper.includes('RESTRICTED'))  return rgb(0.78, 0.4, 0);
    return rgb(0, 0.39, 0);
  })();
  const black = rgb(0, 0, 0);
  const white = rgb(1, 1, 1);
  const grey  = rgb(0.33, 0.33, 0.33);

  const W = PageSizes.A4[0];
  const H = PageSizes.A4[1];
  const M = 50;
  const BANNER = 26;
  const LINE_H = 13;

  function addPage() {
    const p = doc.addPage(PageSizes.A4);
    p.drawRectangle({ x: 0, y: H - BANNER, width: W, height: BANNER, color: cc });
    const cw = fontBold.widthOfTextAtSize(classUpper, 10);
    p.drawText(classUpper, { x: (W - cw) / 2, y: H - BANNER + 8, size: 10, font: fontBold, color: white });
    p.drawRectangle({ x: 0, y: 0, width: W, height: BANNER, color: cc });
    p.drawText(classUpper, { x: (W - cw) / 2, y: 8, size: 10, font: fontBold, color: white });
    return p;
  }

  const cover = addPage();
  let cy = H - BANNER - 50;
  cover.drawText('TACTICAL ADAPTATION GROUP', { x: M, y: cy, size: 8, font: fontBold, color: black });
  cy -= 16;
  cover.drawLine({ start: { x: M, y: cy }, end: { x: W - M, y: cy }, thickness: 2, color: black });
  cy -= 40;

  const titleSanitized = sanitize(title.toUpperCase());
  const titleWords = titleSanitized.split(' ');
  const titleLines: string[] = [];
  let tl = '';
  for (const w of titleWords) {
    const test = tl ? `${tl} ${w}` : w;
    if (fontBold.widthOfTextAtSize(test, 22) > W - M * 2) { titleLines.push(tl); tl = w; }
    else tl = test;
  }
  if (tl) titleLines.push(tl);

  for (const line of titleLines) {
    const tw = fontBold.widthOfTextAtSize(line, 22);
    cover.drawText(line, { x: (W - tw) / 2, y: cy, size: 22, font: fontBold, color: black });
    cy -= 30;
  }
  cy -= 20;
  cover.drawLine({ start: { x: M, y: cy }, end: { x: W - M, y: cy }, thickness: 1, color: black });
  cy -= 20;
  cover.drawText(sanitize(`Author: ${author}`), { x: M, y: cy, size: 10, font, color: black }); cy -= 16;
  cover.drawText(`Classification: ${classUpper}`, { x: M, y: cy, size: 10, font, color: black }); cy -= 16;
  cover.drawText(`Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}`, { x: M, y: cy, size: 10, font, color: black }); cy -= 16;
  cover.drawText(`Sections: ${sections.length}`, { x: M, y: cy, size: 10, font, color: black });

  const maxY = H - BANNER - 18;
  const minY = BANNER + 18;
  let page = addPage();
  let y = maxY;

  function ensureSpace(needed: number) {
    if (y - needed < minY) { page = addPage(); y = maxY; }
  }

  function drawWrapped(text: string, x: number, size: number, f: any, color: any, maxW: number) {
    const wds = text.replace(/\t/g, '  ').split(' ');
    let cur = '';
    for (const w of wds) {
      const test = cur ? `${cur} ${w}` : w;
      if (f.widthOfTextAtSize(test, size) > maxW) {
        if (cur) { ensureSpace(LINE_H + 2); page.drawText(cur, { x, y, size, font: f, color }); y -= LINE_H; }
        cur = w;
      } else cur = test;
    }
    if (cur) { ensureSpace(LINE_H + 2); page.drawText(cur, { x, y, size, font: f, color }); y -= LINE_H; }
  }

  for (const section of sections) {
    ensureSpace(LINE_H * 4);
    page.drawLine({ start: { x: M, y: y + 4 }, end: { x: W - M, y: y + 4 }, thickness: 1.5, color: black });
    y -= 8;
    drawWrapped(sanitize(section.heading.toUpperCase()), M, 11, fontBold, black, W - M * 2);
    page.drawLine({ start: { x: M, y: y + 2 }, end: { x: W - M, y: y + 2 }, thickness: 0.5, color: black });
    y -= 12;

    for (const msg of section.messages) {
      ensureSpace(LINE_H * 2);
      const ts = new Date(msg.timestamp).toISOString().replace('T', ' ').slice(0, 16);
      page.drawText(sanitize(`${msg.author.toUpperCase()}  .  ${ts}`), { x: M, y, size: 7, font: fontBold, color: grey });
      y -= 11;

      const clean = sanitize(
        msg.content
          .replace(/\*\*(.*?)\*\*/gs, '$1').replace(/\*(.*?)\*/gs, '$1')
          .replace(/`{1,3}(.*?)`{1,3}/gs, '$1').replace(/^#{1,6}\s/gm, '').replace(/^>\s/gm, '  ')
      );

      for (const para of clean.split(/\n+/)) {
        const trimmed = para.trim();
        if (!trimmed) { y -= 5; continue; }
        drawWrapped(trimmed, M, 9, font, black, W - M * 2);
      }
      y -= 8;
    }
    y -= 8;
  }

  const bytes = await doc.save();
  return new Uint8Array(bytes);
}

// ── Main handler ──────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'GET') return Response.json({ ok: true, service: 'TAG Bot Worker v1' });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let job: any;
  try {
    job = await req.json();
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  const { action, appId, token, channelId, title, author, classification, existingRecordId } = job;

  // Respond immediately — worker runs to completion independently
  const response = Response.json({ ok: true, started: true });

  // Do the work after responding
  (async () => {
    try {
      if (action === 'create') {
        await patchFollowup(appId, token, `Scraping channel...`);
        const { channelName, sections } = await scrapeChannel(channelId);
        if (sections.length === 0) throw new Error('No text content found in this channel.');
        const taggedSections = sections.map((s) => ({ ...s, sourceChannel: channelName }));

        await patchFollowup(appId, token, `Building PDF (${taggedSections.length} sections)...`);
        const pdfBytes = await buildPdf(title, author, classification, taggedSections);
        const pdfUrl = await uploadFile(pdfBytes, `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`, 'application/pdf');

        await postMessage(channelId,
          `**${title}** [${classification}] -- ${taggedSections.length} sections from **${channelName}**.\nDownload: ${pdfUrl}\n\nUse /scrape -> Add Channel to Existing Doc to keep building.`
        );

        const contentUrl = await uploadContentJson(taggedSections, title.replace(/[^a-z0-9]/gi, '_'));
        await entityCreate('BotExportedPdf', {
          title, author, classification,
          channel_id: channelId, channel_name: channelName,
          section_count: taggedSections.length,
          message_count: taggedSections.reduce((s, sec) => s + sec.messages.length, 0),
          content_json: contentUrl, file_url: pdfUrl,
        });

        await patchFollowup(appId, token, `Done! Download link posted in the channel.`);

      } else if (action === 'append') {
        const existingRecord = await entityGet('BotExportedPdf', existingRecordId);
        if (!existingRecord) throw new Error('Could not find the selected document.');

        let existingSections: StoredSection[] = [];
        if (existingRecord.content_json) {
          try { existingSections = await fetchContentJson(existingRecord.content_json); } catch {}
        }

        await patchFollowup(appId, token, `Scraping channel...`);
        const { channelName, sections: newSections } = await scrapeChannel(channelId);
        if (newSections.length === 0) throw new Error('No text content found in this channel.');

        if (existingSections.some((s) => s.sourceChannel === channelName)) {
          await patchFollowup(appId, token, `**${channelName}** is already in this document. Skipping.`);
          return;
        }

        const taggedSections = newSections.map((s) => ({ ...s, sourceChannel: channelName }));
        const mergedSections = [...existingSections, ...taggedSections];

        await patchFollowup(appId, token, `Building combined PDF (${mergedSections.length} total sections)...`);
        const pdfBytes = await buildPdf(existingRecord.title, existingRecord.author, existingRecord.classification ?? 'UNCLASSIFIED', mergedSections);
        const pdfUrl = await uploadFile(pdfBytes, `${existingRecord.title.replace(/[^a-z0-9]/gi, '_')}.pdf`, 'application/pdf');

        const newMsgCount = taggedSections.reduce((s, sec) => s + sec.messages.length, 0);
        await postMessage(channelId,
          `**${existingRecord.title}** updated -- added **${channelName}** (+${taggedSections.length} sections, +${newMsgCount} messages). Total: **${mergedSections.length} sections**.\nDownload: ${pdfUrl}`
        );

        const contentUrl = await uploadContentJson(mergedSections, existingRecord.title.replace(/[^a-z0-9]/gi, '_'));
        await entityUpdate('BotExportedPdf', existingRecordId, {
          content_json: contentUrl, file_url: pdfUrl,
          section_count: mergedSections.length,
          message_count: mergedSections.reduce((s, sec) => s + sec.messages.length, 0),
        });

        await patchFollowup(appId, token, `Done! **${mergedSections.length} sections** total. Download link posted in the channel.`);
      }

    } catch (err: any) {
      try { await patchFollowup(appId, token, `Failed: ${err.message}`); } catch {}
    }
  })();

  return response;
});
