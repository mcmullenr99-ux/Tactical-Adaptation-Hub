/**
 * TAG Discord Bot — Forum Scraper with Interactive Flow
 *
 * /scrape flow:
 *   1. Bot asks: New PDF or Append to existing?
 *   2a. New → Modal: Title, Author, Classification
 *   2b. Append → Select menu of existing PDFs for this channel
 *   3. Scrape all threads → build PDF → post back + save to DB
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN') ?? '';
const DISCORD_PUBLIC_KEY = Deno.env.get('DISCORD_PUBLIC_KEY') ?? '';
const DISCORD_API = 'https://discord.com/api/v10';

// ── Signature verification ─────────────────────────────────────────────────
async function verifyDiscordSignature(req: Request, body: string): Promise<boolean> {
  if (!DISCORD_PUBLIC_KEY) return true;
  const signature = req.headers.get('x-signature-ed25519') ?? '';
  const timestamp  = req.headers.get('x-signature-timestamp') ?? '';
  if (!signature || !timestamp) return false;
  try {
    const key = await crypto.subtle.importKey('raw', hexToBytes(DISCORD_PUBLIC_KEY), { name: 'Ed25519' }, false, ['verify']);
    const msg = new TextEncoder().encode(timestamp + body);
    return await crypto.subtle.verify('Ed25519', key, hexToBytes(signature), msg);
  } catch { return false; }
}

function hexToBytes(hex: string): Uint8Array {
  const b = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) b[i/2] = parseInt(hex.slice(i, i+2), 16);
  return b;
}

// ── Discord API ────────────────────────────────────────────────────────────
async function discordGet(path: string) {
  const r = await fetch(`${DISCORD_API}${path}`, { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } });
  if (!r.ok) throw new Error(`Discord GET ${path} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function discordPost(path: string, body: unknown) {
  const r = await fetch(`${DISCORD_API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Discord POST ${path} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function ackCallback(interactionId: string, token: string, body: unknown) {
  const r = await fetch(`${DISCORD_API}/interactions/${interactionId}/${token}/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`ack failed: ${r.status} ${t}`);
  }
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
  const guild = await discordGet(`/channels/${channelId}`);
  const guildId = guild.guild_id;
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

// ── PDF builder ────────────────────────────────────────────────────────────
function buildPdfLines(
  title: string,
  author: string,
  classification: string,
  sections: { heading: string; messages: any[] }[],
  appendMode = false,
  existingTitle = ''
): string[] {
  const lines: string[] = [];
  const banner = `[${classification}]`;

  if (!appendMode) {
    lines.push(banner);
    lines.push('');
    lines.push('TACTICAL ADAPTATION GROUP');
    lines.push('Training Document Export');
    lines.push('');
    lines.push(`TITLE: ${title}`);
    lines.push(`AUTHOR: ${author}`);
    lines.push(`CLASSIFICATION: ${classification}`);
    lines.push(`GENERATED: ${new Date().toUTCString()}`);
    lines.push('═'.repeat(60));
    lines.push('');
  } else {
    lines.push('');
    lines.push('─'.repeat(60));
    lines.push(`APPENDED: ${new Date().toUTCString()}`);
    lines.push('─'.repeat(60));
    lines.push('');
  }

  for (const section of sections) {
    lines.push(`■ ${section.heading.toUpperCase()}`);
    lines.push('─'.repeat(50));
    for (const msg of section.messages) {
      const content = (msg.content ?? '').trim();
      if (!content) continue;
      const author2 = msg.author?.username ?? 'Unknown';
      const ts = new Date(msg.timestamp).toISOString().replace('T', ' ').slice(0, 16);
      lines.push(`[${ts}] ${author2}:`);
      const words = content.split(' ');
      let line = '';
      for (const word of words) {
        if ((line + ' ' + word).length > 80) { lines.push(`  ${line.trim()}`); line = word; }
        else line += (line ? ' ' : '') + word;
      }
      if (line) lines.push(`  ${line.trim()}`);
      lines.push('');
    }
    lines.push('');
  }

  lines.push('');
  lines.push(banner);
  return lines;
}

function encodePdf(title: string, bodyLines: string[]): Uint8Array {
  const enc = new TextEncoder();

  let stream = 'BT\n/F1 10 Tf\n40 800 Td\n14 TL\n';
  const safeTitle = title.replace(/[()\\]/g, '\\$&');
  stream += `/F1 13 Tf\n(${safeTitle}) Tj\n/F1 10 Tf\nT*\nT*\n`;
  for (const rawLine of bodyLines) {
    const safe = rawLine.replace(/[()\\]/g, '\\$&');
    stream += `(${safe}) Tj T*\n`;
  }
  stream += 'ET\n';

  const streamBytes = enc.encode(stream);
  const streamLen = streamBytes.length;

  const catalog  = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const pages    = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const font     = `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n`;
  const page     = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >>\nendobj\n`;
  const contentH = `5 0 obj\n<< /Length ${streamLen} >>\nstream\n`;
  const contentF = `\nendstream\nendobj\n`;
  const header   = '%PDF-1.4\n';
  const headerB  = enc.encode(header);

  const parts: Uint8Array[] = [headerB, enc.encode(catalog), enc.encode(pages), enc.encode(font), enc.encode(page), enc.encode(contentH), streamBytes, enc.encode(contentF)];
  let xrefOffset = parts.reduce((s, p) => s + p.length, 0);

  const xref: string[] = ['xref\n', '0 6\n', '0000000000 65535 f \n'];
  let off = headerB.length;
  xref.push(off.toString().padStart(10,'0') + ' 00000 n \n'); off += enc.encode(catalog).length;
  xref.push(off.toString().padStart(10,'0') + ' 00000 n \n'); off += enc.encode(pages).length;
  xref.push(off.toString().padStart(10,'0') + ' 00000 n \n'); off += enc.encode(font).length;
  xref.push(off.toString().padStart(10,'0') + ' 00000 n \n'); off += enc.encode(page).length;
  xref.push(off.toString().padStart(10,'0') + ' 00000 n \n');

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  parts.push(enc.encode(xref.join('') + trailer));

  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) { out.set(p, pos); pos += p.length; }
  return out;
}

// ── Scrape + build + send ──────────────────────────────────────────────────
async function scrapeAndBuild(
  channelId: string,
  appId: string,
  token: string,
  title: string,
  author: string,
  classification: string,
  req: Request
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

  const lines = buildPdfLines(title, author, classification, sections);
  const pdfBytes = encodePdf(title, lines);
  return { pdfBytes, sections: sections.length, messages: totalMsgs, channelName };
}

// ── Custom ID parsers ──────────────────────────────────────────────────────
// Format: scrape_new:<channelId>  |  scrape_append:<channelId>  |  scrape_modal_submit:<channelId>
// Modal custom_id: scrape_modal:<channelId>
// Select custom_id: scrape_select:<channelId>

// ── Main interaction handler ───────────────────────────────────────────────
async function handleInteraction(interaction: any, req: Request): Promise<Response> {
  const type = interaction.type;

  // PING
  if (type === 1) return Response.json({ type: 1 });

  // SLASH COMMAND — /scrape
  if (type === 2 && interaction.data?.name === 'scrape') {
    const channelId = interaction.channel_id;
    // Ask: New or Append?
    await ackCallback(interaction.id, interaction.token, {
      type: 4,
      data: {
        flags: 64, // ephemeral
        content: '📄 **What would you like to do?**',
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

  // BUTTON / SELECT COMPONENT
  if (type === 3) {
    const customId: string = interaction.data?.custom_id ?? '';

    // "Create New PDF" button → show modal
    if (customId.startsWith('scrape_new:')) {
      const channelId = customId.split(':')[1];
      await ackCallback(interaction.id, interaction.token, {
        type: 9, // MODAL
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

    // "Append to Existing PDF" button → show select menu of existing PDFs
    if (customId.startsWith('scrape_append:')) {
      const channelId = customId.split(':')[1];
      const base44 = createClientFromRequest(req);
      let existingPdfs: any[] = [];
      try {
        existingPdfs = await base44.asServiceRole.entities.BotExportedPdf.list({ channel_id: channelId });
      } catch (e) {
        // fallback: list all
        try { existingPdfs = await base44.asServiceRole.entities.BotExportedPdf.list(); } catch {}
      }

      if (!existingPdfs || existingPdfs.length === 0) {
        await ackCallback(interaction.id, interaction.token, {
          type: 4,
          data: { flags: 64, content: '❌ No existing PDFs found for this channel. Use **Create New PDF** instead.' }
        });
        return Response.json({ type: 1 });
      }

      const options = existingPdfs.slice(0, 25).map((pdf: any) => ({
        label: pdf.title ?? pdf.id,
        description: `${pdf.classification ?? ''} · ${pdf.section_count ?? 0} sections · ${new Date(pdf.created_date).toLocaleDateString()}`,
        value: pdf.id,
      }));

      await ackCallback(interaction.id, interaction.token, {
        type: 4,
        data: {
          flags: 64,
          content: '📎 **Which PDF would you like to append to?**',
          components: [{
            type: 1,
            components: [{
              type: 3, // SELECT_MENU
              custom_id: `scrape_select:${channelId}`,
              options,
              placeholder: 'Choose a PDF...',
            }]
          }]
        }
      });
      return Response.json({ type: 1 });
    }

    // Select menu — user picked an existing PDF to append to
    if (customId.startsWith('scrape_select:')) {
      const channelId = customId.split(':')[1];
      const selectedPdfId = interaction.data?.values?.[0];
      if (!selectedPdfId) {
        await ackCallback(interaction.id, interaction.token, { type: 4, data: { flags: 64, content: '❌ No PDF selected.' } });
        return Response.json({ type: 1 });
      }

      // Store selection in modal via custom_id, ask for append confirmation
      await ackCallback(interaction.id, interaction.token, {
        type: 4,
        data: {
          flags: 64,
          content: `✅ Got it — I'll append new content to that PDF. Click below to start the scrape.`,
          components: [{
            type: 1,
            components: [
              { type: 2, style: 1, label: '🚀 Start Scrape & Append', custom_id: `scrape_do_append:${channelId}:${selectedPdfId}` },
            ]
          }]
        }
      });
      return Response.json({ type: 1 });
    }

    // Do append — fire scrape
    if (customId.startsWith('scrape_do_append:')) {
      const parts = customId.split(':');
      const channelId = parts[1];
      const pdfId = parts[2];
      const appId = interaction.application_id;
      const token = interaction.token;

      // Defer
      await ackCallback(interaction.id, token, { type: 7, data: { flags: 64, content: '⏳ Scraping channel...' } });

      (async () => {
        try {
          const base44 = createClientFromRequest(req);
          const existingPdf = await base44.asServiceRole.entities.BotExportedPdf.get(pdfId);
          if (!existingPdf) throw new Error('Could not find existing PDF record.');

          const { pdfBytes, sections, messages, channelName } = await scrapeAndBuild(
            channelId, appId, token,
            existingPdf.title, existingPdf.author, existingPdf.classification ?? 'UNCLASSIFIED',
            req
          );

          const filename = `TAG_${channelName.replace(/[^a-z0-9]/gi, '_')}_v${Date.now()}.pdf`;
          await sendPdfToChannel(channelId, filename, pdfBytes, `📎 **APPEND** to "${existingPdf.title}" — ${sections} sections, ${messages} messages added.`);

          // Update record
          await base44.asServiceRole.entities.BotExportedPdf.update(pdfId, {
            section_count: (existingPdf.section_count ?? 0) + sections,
            message_count: (existingPdf.message_count ?? 0) + messages,
          });

          await patchFollowup(appId, token, `✅ Done! Appended **${sections} sections** (${messages} messages) to "${existingPdf.title}". PDF posted above.`);
        } catch (err: any) {
          await patchFollowup(appId, token, `❌ Failed: ${err.message}`);
        }
      })();

      return Response.json({ type: 1 });
    }
  }

  // MODAL SUBMIT
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
      const classification = ['UNCLASSIFIED','RESTRICTED','CONFIDENTIAL'].includes(rawClass) ? rawClass : 'UNCLASSIFIED';

      // Defer
      await ackCallback(interaction.id, token, {
        type: 5,
        data: { flags: 64 }
      });

      (async () => {
        try {
          const { pdfBytes, sections, messages, channelName } = await scrapeAndBuild(
            channelId, appId, token, title, author, classification, req
          );

          const filename = `TAG_${channelName.replace(/[^a-z0-9]/gi, '_')}_export.pdf`;
          await sendPdfToChannel(channelId, filename, pdfBytes, `✅ **${title}** [${classification}] — ${sections} sections, ${messages} messages exported.`);

          // Save record to DB
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

// ── Entry point ────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'GET') return Response.json({ ok: true, service: 'TAG Discord Bot v2' });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const body = await req.text();
  const valid = await verifyDiscordSignature(req, body);
  if (!valid) return new Response('Invalid signature', { status: 401 });

  const interaction = JSON.parse(body);
  return handleInteraction(interaction, req);
});
