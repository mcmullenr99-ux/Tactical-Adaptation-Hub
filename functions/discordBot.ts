/**
 * TAG Discord Bot — Forum Scraper with Interactive Flow
 * Uses jsPDF via CDN for proper PDF generation
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN') ?? '';
const DISCORD_PUBLIC_KEY = Deno.env.get('DISCORD_PUBLIC_KEY') ?? '';
const DISCORD_API = 'https://discord.com/api/v10';

// ── Signature verification ─────────────────────────────────────────────────
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

// ── Discord API ────────────────────────────────────────────────────────────
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

async function sendPdfToChannel(channelId: string, filename: string, pdfBytes: Uint8Array, message: string) {
  const form = new FormData();
  form.append('payload_json', JSON.stringify({ content: message }));
  form.append('files[0]', new Blob([pdfBytes], { type: 'application/pdf' }), filename);
  const r = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
    body: form,
  });
  if (!r.ok) throw new Error(`sendPdf failed: ${r.status} ${await r.text()}`);
}

// ── Scraping ───────────────────────────────────────────────────────────────
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

// ── PDF generation using pdfkit via npm ───────────────────────────────────
async function buildPdf(
  title: string,
  author: string,
  classification: string,
  sections: { heading: string; messages: any[] }[]
): Promise<Uint8Array> {
  // Use PDFKit via npm
  const PDFDocument = (await import('npm:pdfkit')).default;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Uint8Array[] = [];

    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    doc.on('end', () => {
      const total = chunks.reduce((s, c) => s + c.length, 0);
      const out = new Uint8Array(total);
      let pos = 0;
      for (const c of chunks) { out.set(c, pos); pos += c.length; }
      resolve(out);
    });
    doc.on('error', reject);

    const classColor: [number, number, number] =
      classification === 'CONFIDENTIAL' ? [180, 0, 0] :
      classification === 'RESTRICTED'   ? [200, 100, 0] :
                                          [0, 100, 0];

    // ── Classification banner ──
    doc.rect(0, 0, doc.page.width, 28).fill(classColor);
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
      .text(`⬛ ${classification} ⬛`, 0, 7, { align: 'center' });
    doc.moveDown(1.5);

    // ── Header ──
    doc.fillColor('#1a1a2e').fontSize(20).font('Helvetica-Bold')
      .text('TACTICAL ADAPTATION GROUP', { align: 'center' });
    doc.fillColor('#444').fontSize(12).font('Helvetica')
      .text('Training Document Export', { align: 'center' });
    doc.moveDown(0.5);

    // ── Meta box ──
    doc.rect(50, doc.y, doc.page.width - 100, 70).fillAndStroke('#f0f0f0', '#cccccc');
    const metaY = doc.y + 8;
    doc.fillColor('#222').fontSize(10).font('Helvetica-Bold')
      .text(`TITLE:`, 65, metaY)
      .font('Helvetica').text(title, 115, metaY);
    doc.font('Helvetica-Bold').text(`AUTHOR:`, 65, metaY + 18)
      .font('Helvetica').text(author, 115, metaY + 18);
    doc.font('Helvetica-Bold').text(`GENERATED:`, 65, metaY + 36)
      .font('Helvetica').text(new Date().toUTCString(), 145, metaY + 36);
    doc.moveDown(4.5);

    // ── Divider ──
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#cccccc');
    doc.moveDown(1);

    // ── Sections ──
    for (const section of sections) {
      // Section heading
      doc.rect(50, doc.y, doc.page.width - 100, 24).fill('#1a1a2e');
      doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
        .text(`  ${section.heading.toUpperCase()}`, 55, doc.y - 20, { width: doc.page.width - 110 });
      doc.moveDown(1.2);

      for (const msg of section.messages) {
        const content = (msg.content ?? '').trim();
        if (!content) continue;

        const msgAuthor = msg.author?.global_name ?? msg.author?.username ?? 'Unknown';
        const ts = new Date(msg.timestamp).toISOString().replace('T', ' ').slice(0, 16);

        // Author + timestamp line
        doc.fillColor('#666').fontSize(8).font('Helvetica-Oblique')
          .text(`${msgAuthor}  ·  ${ts}`, 55, doc.y, { width: doc.page.width - 110 });
        doc.moveDown(0.3);

        // Content — strip Discord markdown symbols for readability
        const clean = content
          .replace(/\*\*(.*?)\*\*/g, '$1')  // bold
          .replace(/\*(.*?)\*/g, '$1')       // italic
          .replace(/`(.*?)`/g, '$1')         // code
          .replace(/#{1,6} /g, '')           // headings
          .replace(/> /g, '  ');             // blockquotes

        doc.fillColor('#111').fontSize(10).font('Helvetica')
          .text(clean, 55, doc.y, { width: doc.page.width - 110, lineGap: 2 });
        doc.moveDown(0.8);
      }

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#eeeeee');
      doc.moveDown(1);
    }

    // ── Footer classification banner ──
    const footerY = doc.page.height - 28;
    doc.rect(0, footerY, doc.page.width, 28).fill(classColor);
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
      .text(`⬛ ${classification} ⬛`, 0, footerY + 7, { align: 'center' });

    doc.end();
  });
}

// ── Core scrape + build ────────────────────────────────────────────────────
async function scrapeAndBuild(
  channelId: string,
  appId: string,
  token: string,
  title: string,
  author: string,
  classification: string
): Promise<{ pdfBytes: Uint8Array; sections: number; messages: number; channelName: string }> {
  const channel = await discordGet(`/channels/${channelId}`);
  const channelName = channel.name ?? channelId;
  const channelType = channel.type;

  let sections: { heading: string; messages: any[] }[] = [];

  if (channelType === 15) {
    const threads = await getForumThreads(channelId);
    if (threads.length === 0) throw new Error('No threads found in this forum channel.');
    await patchFollowup(appId, token, `⏳ Found **${threads.length} threads** — scraping now...`);
    for (const thread of threads) {
      const msgs = await getThreadMessages(thread.id);
      if (msgs.length > 0) sections.push({ heading: thread.name, messages: msgs });
    }
  } else {
    const msgs = await getThreadMessages(channelId);
    sections = [{ heading: channelName, messages: msgs }];
  }

  const totalMsgs = sections.reduce((s, sec) => s + sec.messages.length, 0);
  if (totalMsgs === 0) throw new Error('No messages found to export.');

  const pdfBytes = await buildPdf(title, author, classification, sections);
  return { pdfBytes, sections: sections.length, messages: totalMsgs, channelName };
}

// ── Main interaction handler ───────────────────────────────────────────────
async function handleInteraction(interaction: any, req: Request): Promise<Response> {
  const type = interaction.type;

  if (type === 1) return Response.json({ type: 1 });

  if (type === 2 && interaction.data?.name === 'scrape') {
    const channelId = interaction.channel_id;
    await ackCallback(interaction.id, interaction.token, {
      type: 4,
      data: {
        flags: 64,
        content: '📄 **What would you like to do with this channel?**',
        components: [{
          type: 1,
          components: [
            { type: 2, style: 1, label: '✨ Create New PDF', custom_id: `scrape_new:${channelId}` },
            { type: 2, style: 2, label: '📎 Append to Existing PDF', custom_id: `scrape_append:${channelId}` },
          ]
        }]
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
            { type: 1, components: [{ type: 4, custom_id: 'doc_title', label: 'Document Title', style: 1, required: true, placeholder: 'e.g. Leadership Cadre Manual' }] },
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
        await ackCallback(interaction.id, interaction.token, {
          type: 4,
          data: { flags: 64, content: '❌ No existing PDFs found. Use **Create New PDF** instead.' }
        });
        return Response.json({ type: 1 });
      }

      const options = existingPdfs.slice(0, 25).map((pdf: any) => ({
        label: (pdf.title ?? pdf.id).slice(0, 100),
        description: `${pdf.classification ?? 'UNCLASSIFIED'} · ${pdf.channel_name ?? ''} · ${new Date(pdf.created_date).toLocaleDateString()}`,
        value: pdf.id,
      }));

      await ackCallback(interaction.id, interaction.token, {
        type: 4,
        data: {
          flags: 64,
          content: '📎 **Which PDF would you like to append to?**',
          components: [{ type: 1, components: [{ type: 3, custom_id: `scrape_select:${channelId}`, options, placeholder: 'Choose a PDF...' }] }]
        }
      });
      return Response.json({ type: 1 });
    }

    if (customId.startsWith('scrape_select:')) {
      const channelId = customId.split(':')[1];
      const selectedPdfId = interaction.data?.values?.[0];
      if (!selectedPdfId) {
        await ackCallback(interaction.id, interaction.token, { type: 4, data: { flags: 64, content: '❌ No PDF selected.' } });
        return Response.json({ type: 1 });
      }
      await ackCallback(interaction.id, interaction.token, {
        type: 4,
        data: {
          flags: 64,
          content: `✅ Got it — ready to append. Click below to start.`,
          components: [{ type: 1, components: [{ type: 2, style: 1, label: '🚀 Start Scrape & Append', custom_id: `scrape_do_append:${channelId}:${selectedPdfId}` }] }]
        }
      });
      return Response.json({ type: 1 });
    }

    if (customId.startsWith('scrape_do_append:')) {
      const parts = customId.split(':');
      const channelId = parts[1];
      const pdfId = parts[2];
      const appId = interaction.application_id;
      const token = interaction.token;

      await ackCallback(interaction.id, token, { type: 7, data: { flags: 64, content: '⏳ Starting scrape...' } });

      (async () => {
        try {
          const base44 = createClientFromRequest(req);
          const existingPdf = await base44.asServiceRole.entities.BotExportedPdf.get(pdfId);
          if (!existingPdf) throw new Error('Could not find existing PDF record.');

          const { pdfBytes, sections, messages, channelName } = await scrapeAndBuild(
            channelId, appId, token, existingPdf.title, existingPdf.author, existingPdf.classification ?? 'UNCLASSIFIED'
          );

          const filename = `TAG_${channelName.replace(/[^a-z0-9]/gi, '_')}_appended_${Date.now()}.pdf`;
          await sendPdfToChannel(channelId, filename, pdfBytes, `📎 **APPEND** — "${existingPdf.title}" [${existingPdf.classification}] — ${sections} sections, ${messages} messages.`);

          await base44.asServiceRole.entities.BotExportedPdf.update(pdfId, {
            section_count: (existingPdf.section_count ?? 0) + sections,
            message_count: (existingPdf.message_count ?? 0) + messages,
          });

          await patchFollowup(appId, token, `✅ Done! Appended **${sections} sections** (${messages} messages). PDF posted above.`);
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
      const rawClass = getValue('doc_class').trim().toUpperCase();
      const classification = ['UNCLASSIFIED', 'RESTRICTED', 'CONFIDENTIAL'].includes(rawClass) ? rawClass : 'UNCLASSIFIED';

      await ackCallback(interaction.id, token, { type: 5, data: { flags: 64 } });

      (async () => {
        try {
          const { pdfBytes, sections, messages, channelName } = await scrapeAndBuild(
            channelId, appId, token, title, author, classification
          );

          const filename = `TAG_${channelName.replace(/[^a-z0-9]/gi, '_')}_export.pdf`;
          await sendPdfToChannel(channelId, filename, pdfBytes, `✅ **${title}** [${classification}] — ${sections} sections, ${messages} messages exported.`);

          const base44 = createClientFromRequest(req);
          await base44.asServiceRole.entities.BotExportedPdf.create({
            title, author, classification,
            channel_id: channelId,
            channel_name: channelName,
            section_count: sections,
            message_count: messages,
          });

          await patchFollowup(appId, token, `✅ Done! PDF posted above — **${filename}** (${sections} sections, ${messages} messages).`);
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
  if (req.method === 'GET') return Response.json({ ok: true, service: 'TAG Discord Bot v2' });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const body = await req.text();
  const valid = await verifyDiscordSignature(req, body);
  if (!valid) return new Response('Invalid signature', { status: 401 });

  const interaction = JSON.parse(body);
  return handleInteraction(interaction, req);
});
