/**
 * TAG Discord Bot — Forum Scraper
 * Scrape any channel into a PDF. Append multiple channels into one growing master document.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN') ?? '';
const DISCORD_PUBLIC_KEY = Deno.env.get('DISCORD_PUBLIC_KEY') ?? '';
const DISCORD_API = 'https://discord.com/api/v10';

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

// Scrape a channel and return structured sections
async function scrapeChannel(channelId: string): Promise<{ channelName: string; sections: StoredSection[] }> {
  const channel = await discordGet(`/channels/${channelId}`);
  const channelName = channel.name ?? channelId;
  const channelType = channel.type;

  const sections: StoredSection[] = [];

  if (channelType === 15) {
    // Forum channel — each thread is a section
    const threads = await getForumThreads(channelId);
    for (const thread of threads) {
      const msgs = await getThreadMessages(thread.id);
      const filtered = msgs
        .filter((m: any) => (m.content ?? '').trim().length > 0)
        .map((m: any) => ({
          author: m.author?.global_name ?? m.author?.username ?? 'Unknown',
          timestamp: m.timestamp,
          content: m.content,
        }));
      if (filtered.length > 0) {
        sections.push({ heading: thread.name, messages: filtered });
      }
    }
  } else {
    // Regular channel — one section
    const msgs = await getThreadMessages(channelId);
    const filtered = msgs
      .filter((m: any) => (m.content ?? '').trim().length > 0)
      .map((m: any) => ({
        author: m.author?.global_name ?? m.author?.username ?? 'Unknown',
        timestamp: m.timestamp,
        content: m.content,
      }));
    if (filtered.length > 0) {
      sections.push({ heading: channelName, messages: filtered });
    }
  }

  return { channelName, sections };
}

// ── Types ─────────────────────────────────────────────────────────────────
interface StoredMessage {
  author: string;
  timestamp: string;
  content: string;
}

interface StoredSection {
  heading: string;
  messages: StoredMessage[];
  sourceChannel?: string;
}

// ── PDF generation ────────────────────────────────────────────────────────
async function buildPdf(
  title: string,
  author: string,
  classification: string,
  sections: StoredSection[]
): Promise<Uint8Array> {
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

    // Top classification banner
    doc.rect(0, 0, doc.page.width, 28).fill(classColor);
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
      .text(`[ ${classification} ]`, 0, 8, { align: 'center' });
    doc.moveDown(1.5);

    // Title block
    doc.fillColor('#1a1a2e').fontSize(20).font('Helvetica-Bold')
      .text('TACTICAL ADAPTATION GROUP', { align: 'center' });
    doc.fillColor('#444').fontSize(12).font('Helvetica')
      .text('Training Document Export', { align: 'center' });
    doc.moveDown(0.8);

    // Meta
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#222').text(`Title: `, { continued: true })
      .font('Helvetica').text(title);
    doc.font('Helvetica-Bold').text(`Author: `, { continued: true })
      .font('Helvetica').text(author);
    doc.font('Helvetica-Bold').text(`Classification: `, { continued: true })
      .font('Helvetica').text(classification);
    doc.font('Helvetica-Bold').text(`Generated: `, { continued: true })
      .font('Helvetica').text(new Date().toUTCString());
    doc.font('Helvetica-Bold').text(`Total Sections: `, { continued: true })
      .font('Helvetica').text(String(sections.length));
    doc.moveDown(0.5);

    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(1);

    // Table of contents
    doc.fillColor('#1a1a2e').fontSize(13).font('Helvetica-Bold').text('TABLE OF CONTENTS');
    doc.moveDown(0.5);
    sections.forEach((s, i) => {
      doc.fillColor('#333').fontSize(9).font('Helvetica')
        .text(`${String(i + 1).padStart(2, '0')}.  ${s.heading}${s.sourceChannel ? `  (${s.sourceChannel})` : ''}`, 55, doc.y);
    });
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#cccccc').stroke();
    doc.addPage();

    // Sections
    let currentChannel = '';
    for (const section of sections) {
      // Channel separator if source changed
      if (section.sourceChannel && section.sourceChannel !== currentChannel) {
        currentChannel = section.sourceChannel;
        if (doc.y > doc.page.height - 120) doc.addPage();
        doc.rect(50, doc.y, doc.page.width - 100, 18).fill('#2c3e50');
        doc.fillColor('#aabbcc').fontSize(9).font('Helvetica-Bold')
          .text(`  CHANNEL: ${currentChannel.toUpperCase()}`, 55, doc.y - 14);
        doc.moveDown(1.2);
      }

      if (doc.y > doc.page.height - 100) doc.addPage();

      // Section heading
      const headY = doc.y;
      doc.rect(50, headY, doc.page.width - 100, 22).fill('#1a1a2e');
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
        .text(section.heading.toUpperCase(), 60, headY + 6, { width: doc.page.width - 120 });
      doc.moveDown(1.5);

      for (const msg of section.messages) {
        if (doc.y > doc.page.height - 80) doc.addPage();

        doc.fillColor('#888').fontSize(8).font('Helvetica-Oblique')
          .text(`${msg.author}  ·  ${new Date(msg.timestamp).toISOString().replace('T', ' ').slice(0, 16)}`, 55, doc.y);
        doc.moveDown(0.3);

        const clean = msg.content
          .replace(/\*\*(.*?)\*\*/gs, '$1')
          .replace(/\*(.*?)\*/gs, '$1')
          .replace(/`{1,3}(.*?)`{1,3}/gs, '$1')
          .replace(/^#{1,6}\s/gm, '')
          .replace(/^>\s/gm, '  ');

        doc.fillColor('#111').fontSize(10).font('Helvetica')
          .text(clean, 55, doc.y, { width: doc.page.width - 110, lineGap: 2 });
        doc.moveDown(0.8);
      }

      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#eeeeee').stroke();
      doc.moveDown(1);
    }

    doc.end();
  });
}

// ── Interaction handler ───────────────────────────────────────────────────
async function handleInteraction(interaction: any, req: Request): Promise<Response> {
  const type = interaction.type;

  if (type === 1) return Response.json({ type: 1 });

  // Slash command /scrape
  if (type === 2 && interaction.data?.name === 'scrape') {
    const channelId = interaction.channel_id;
    await ackCallback(interaction.id, interaction.token, {
      type: 4,
      data: {
        flags: 64,
        content: '📄 **What would you like to do?**',
        components: [{
          type: 1,
          components: [
            { type: 2, style: 1, label: '✨ Create New Document', custom_id: `scrape_new:${channelId}` },
            { type: 2, style: 2, label: '➕ Add Channel to Existing Doc', custom_id: `scrape_append:${channelId}` },
          ]
        }]
      }
    });
    return Response.json({ type: 1 });
  }

  // Button clicks
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
        await ackCallback(interaction.id, interaction.token, {
          type: 4,
          data: { flags: 64, content: '❌ No existing documents found. Use **Create New Document** first.' }
        });
        return Response.json({ type: 1 });
      }

      const options = existingPdfs.slice(0, 25).map((pdf: any) => ({
        label: (pdf.title ?? pdf.id).slice(0, 100),
        description: `${pdf.section_count ?? 0} sections · ${pdf.classification ?? 'UNCLASSIFIED'} · ${new Date(pdf.created_date).toLocaleDateString()}`,
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

    if (customId.startsWith('scrape_select:')) {
      const channelId = customId.split(':')[1];
      const selectedPdfId = interaction.data?.values?.[0];
      if (!selectedPdfId) {
        await ackCallback(interaction.id, interaction.token, { type: 4, data: { flags: 64, content: '❌ No document selected.' } });
        return Response.json({ type: 1 });
      }

      const appId = interaction.application_id;
      const token = interaction.token;

      await ackCallback(interaction.id, token, { type: 7, data: { flags: 64, content: '⏳ Scraping channel and merging into document...' } });

      (async () => {
        try {
          const base44 = createClientFromRequest(req);
          const existingRecord = await base44.asServiceRole.entities.BotExportedPdf.get(selectedPdfId);
          if (!existingRecord) throw new Error('Could not find the selected document.');

          // Load existing stored sections
          let existingSections: StoredSection[] = [];
          if (existingRecord.content_json) {
            try { existingSections = JSON.parse(existingRecord.content_json); } catch {}
          }

          // Scrape new channel
          await patchFollowup(appId, token, `⏳ Scraping channel...`);
          const { channelName, sections: newSections } = await scrapeChannel(channelId);

          if (newSections.length === 0) throw new Error('No content found in this channel.');

          // Tag new sections with their source channel
          const taggedSections = newSections.map(s => ({ ...s, sourceChannel: channelName }));

          // Merge — avoid duplicate channel imports
          const alreadyImported = existingSections.some(s => s.sourceChannel === channelName);
          if (alreadyImported) {
            await patchFollowup(appId, token, `⚠️ Channel **${channelName}** is already in this document. Skipping to avoid duplicates.`);
            return;
          }

          const mergedSections = [...existingSections, ...taggedSections];

          // Rebuild the full PDF with all sections combined
          await patchFollowup(appId, token, `⏳ Building combined PDF (${mergedSections.length} sections total)...`);
          const pdfBytes = await buildPdf(
            existingRecord.title,
            existingRecord.author,
            existingRecord.classification ?? 'UNCLASSIFIED',
            mergedSections
          );

          // Send to channel
          const filename = `${existingRecord.title.replace(/[^a-z0-9]/gi, '_')}_v${Date.now()}.pdf`;
          await sendPdfToChannel(channelId, filename, pdfBytes, `✅ **${existingRecord.title}** updated — added **${channelName}** (${taggedSections.length} sections, ${taggedSections.reduce((s, sec) => s + sec.messages.length, 0)} messages). Total: **${mergedSections.length} sections**.`);

          // Save merged content back to DB
          const totalMessages = mergedSections.reduce((s, sec) => s + sec.messages.length, 0);
          await base44.asServiceRole.entities.BotExportedPdf.update(selectedPdfId, {
            content_json: JSON.stringify(mergedSections),
            section_count: mergedSections.length,
            message_count: totalMessages,
          });

          await patchFollowup(appId, token, `✅ Done! **${existingRecord.title}** now has **${mergedSections.length} sections** across all channels. PDF posted above.`);
        } catch (err: any) {
          await patchFollowup(appId, token, `❌ Failed: ${err.message}`);
        }
      })();

      return Response.json({ type: 1 });
    }
  }

  // Modal submit — Create New
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
          await patchFollowup(appId, token, `⏳ Scraping channel...`);
          const { channelName, sections } = await scrapeChannel(channelId);

          if (sections.length === 0) throw new Error('No content found in this channel.');

          // Tag sections with source
          const taggedSections = sections.map(s => ({ ...s, sourceChannel: channelName }));

          await patchFollowup(appId, token, `⏳ Building PDF (${taggedSections.length} sections)...`);
          const pdfBytes = await buildPdf(title, author, classification, taggedSections);

          const filename = `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
          await sendPdfToChannel(channelId, filename, pdfBytes, `✅ **${title}** [${classification}] created — ${taggedSections.length} sections from **${channelName}**. Use \`/scrape\` → **Add Channel to Existing Doc** in other channels to keep building this document.`);

          // Save to DB with full content
          const base44 = createClientFromRequest(req);
          await base44.asServiceRole.entities.BotExportedPdf.create({
            title, author, classification,
            channel_id: channelId,
            channel_name: channelName,
            section_count: taggedSections.length,
            message_count: taggedSections.reduce((s, sec) => s + sec.messages.length, 0),
            content_json: JSON.stringify(taggedSections),
          });

          await patchFollowup(appId, token, `✅ Done! **${filename}** posted above (${taggedSections.length} sections). Go to your next channel and use \`/scrape\` → **Add Channel to Existing Doc** to keep adding to it.`);
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
  if (req.method === 'GET') return Response.json({ ok: true, service: 'TAG Discord Bot v3' });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const body = await req.text();
  const valid = await verifyDiscordSignature(req, body);
  if (!valid) return new Response('Invalid signature', { status: 401 });

  const interaction = JSON.parse(body);
  return handleInteraction(interaction, req);
});
