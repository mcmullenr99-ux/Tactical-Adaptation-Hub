/**
 * TAG Discord Bot — Forum Scraper
 * Handles Discord slash command interactions.
 * Commands:
 *   /scrape          — scrapes all threads in the current forum channel → PDF
 *   /scrape-thread   — scrapes only the current thread → PDF
 */

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN') ?? '';
const DISCORD_PUBLIC_KEY = Deno.env.get('DISCORD_PUBLIC_KEY') ?? '';
const DISCORD_API = 'https://discord.com/api/v10';

// ── Crypto: verify Ed25519 signature from Discord ──────────────────────────
async function verifyDiscordSignature(req: Request, body: string): Promise<boolean> {
  if (!DISCORD_PUBLIC_KEY) return true; // skip in dev if not set
  const signature = req.headers.get('x-signature-ed25519') ?? '';
  const timestamp  = req.headers.get('x-signature-timestamp') ?? '';
  if (!signature || !timestamp) return false;
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      hexToBytes(DISCORD_PUBLIC_KEY),
      { name: 'Ed25519' },
      false,
      ['verify']
    );
    const msg = new TextEncoder().encode(timestamp + body);
    return await crypto.subtle.verify('Ed25519', key, hexToBytes(signature), msg);
  } catch { return false; }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes;
}

// ── Discord API helpers ────────────────────────────────────────────────────
async function discordGet(path: string) {
  const r = await fetch(`${DISCORD_API}${path}`, {
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
  });
  if (!r.ok) throw new Error(`Discord GET ${path} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function getForumThreads(channelId: string): Promise<any[]> {
  // Get active threads
  const guild = await discordGet(`/channels/${channelId}`);
  const guildId = guild.guild_id;

  // Active threads in guild
  const activeRes = await discordGet(`/guilds/${guildId}/threads/active`);
  const active: any[] = (activeRes.threads ?? []).filter((t: any) => t.parent_id === channelId);

  // Archived threads (public)
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
  // Return chronological order
  return all.reverse();
}

// ── PDF builder (pure text-based, no external deps) ───────────────────────
function buildPdf(title: string, sections: { heading: string; messages: any[] }[]): Uint8Array {
  const lines: string[] = [];
  const addLine = (text: string) => lines.push(text);

  addLine(`TACTICAL ADAPTATION GROUP`);
  addLine(`Training Document Export`);
  addLine(`Channel: ${title}`);
  addLine(`Generated: ${new Date().toUTCString()}`);
  addLine(`${'─'.repeat(60)}`);
  addLine('');

  for (const section of sections) {
    addLine(`■ ${section.heading.toUpperCase()}`);
    addLine('─'.repeat(50));
    for (const msg of section.messages) {
      const author = msg.author?.username ?? 'Unknown';
      const ts = new Date(msg.timestamp).toISOString().replace('T', ' ').slice(0, 16);
      const content = (msg.content ?? '').trim();
      if (!content) continue;
      addLine(`[${ts}] ${author}:`);
      // Wrap long lines at 80 chars
      const words = content.split(' ');
      let line = '';
      for (const word of words) {
        if ((line + ' ' + word).length > 80) {
          addLine(`  ${line.trim()}`);
          line = word;
        } else {
          line += (line ? ' ' : '') + word;
        }
      }
      if (line) addLine(`  ${line.trim()}`);
      addLine('');
    }
    addLine('');
  }

  // Encode as a minimal valid PDF with embedded text
  const bodyText = lines.join('\n');
  return encodePdf(title, bodyText);
}

function encodePdf(title: string, body: string): Uint8Array {
  // Minimal PDF 1.4 — plain text content stream
  const safeTitle = title.replace(/[()\\]/g, '\\$&');
  const safeBody  = body.replace(/[()\\]/g, '\\$&').replace(/\r?\n/g, '\\n');

  // We'll use a simple text stream with Courier 10pt, auto line breaks via \n
  // Split body into lines for proper PDF rendering
  const bodyLines = body.split('\n');

  let streamContent = '';
  streamContent += 'BT\n';
  streamContent += '/F1 10 Tf\n';
  streamContent += '40 800 Td\n';
  streamContent += '14 TL\n'; // line height

  // Title line
  const safeTitleLine = title.replace(/[()\\]/g, '\\$&');
  streamContent += `/F1 14 Tf\n(${safeTitleLine}) Tj\n`;
  streamContent += '/F1 10 Tf\n';
  streamContent += 'T*\n';
  streamContent += 'T*\n';

  for (const rawLine of bodyLines) {
    const safe = rawLine.replace(/[()\\]/g, '\\$&');
    streamContent += `(${safe}) Tj T*\n`;
  }
  streamContent += 'ET\n';

  const streamBytes = new TextEncoder().encode(streamContent);
  const streamLen = streamBytes.length;

  const catalogId = 1;
  const pagesId   = 2;
  const pageId    = 3;
  const fontId    = 4;
  const contentId = 5;

  const header = '%PDF-1.4\n';

  // Objects
  const obj = (id: number, dict: string, stream?: Uint8Array): string => {
    let s = `${id} 0 obj\n${dict}\n`;
    if (stream) {
      s += `stream\n`;
      return s; // caller appends stream bytes + endstream
    }
    s += `endobj\n`;
    return s;
  };

  const catalog  = `${catalogId} 0 obj\n<< /Type /Catalog /Pages ${pagesId} 0 R >>\nendobj\n`;
  const pages    = `${pagesId} 0 obj\n<< /Type /Pages /Kids [${pageId} 0 R] /Count 1 >>\nendobj\n`;
  const font     = `${fontId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n`;
  const page     = `${pageId} 0 obj\n<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 842] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>\nendobj\n`;
  const contentHeader = `${contentId} 0 obj\n<< /Length ${streamLen} >>\nstream\n`;
  const contentFooter = `\nendstream\nendobj\n`;

  // Assemble bytes
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [
    enc.encode(header),
    enc.encode(catalog),
    enc.encode(pages),
    enc.encode(font),
    enc.encode(page),
    enc.encode(contentHeader),
    streamBytes,
    enc.encode(contentFooter),
  ];

  // xref table
  let offset = 0;
  const offsets: number[] = [];
  const headerBytes = enc.encode(header);
  offset += headerBytes.length;
  offsets.push(offset); // obj 1
  offset += enc.encode(catalog).length;
  offsets.push(offset); // obj 2
  offset += enc.encode(pages).length;
  offsets.push(offset); // obj 3 (font)
  offset += enc.encode(font).length;
  offsets.push(offset); // obj 4 (page)
  offset += enc.encode(page).length;
  offsets.push(offset); // obj 5 (content)
  offset += enc.encode(contentHeader).length + streamLen + enc.encode(contentFooter).length;

  // Recalculate with correct order: catalog=1, pages=2, page=3, font=4, content=5
  // Simpler: just build xref after assembling all parts
  let xrefOffset = 0;
  for (const p of parts) xrefOffset += p.length;

  const xref = [
    'xref\n',
    `0 6\n`,
    `0000000000 65535 f \n`,
  ];
  let off = headerBytes.length;
  xref.push(off.toString().padStart(10,'0') + ' 00000 n \n'); off += enc.encode(catalog).length;
  xref.push(off.toString().padStart(10,'0') + ' 00000 n \n'); off += enc.encode(pages).length;
  xref.push(off.toString().padStart(10,'0') + ' 00000 n \n'); off += enc.encode(font).length;
  xref.push(off.toString().padStart(10,'0') + ' 00000 n \n'); off += enc.encode(page).length;
  xref.push(off.toString().padStart(10,'0') + ' 00000 n \n');

  const trailer = `trailer\n<< /Size 6 /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  parts.push(enc.encode(xref.join('') + trailer));

  // Merge all parts
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) { out.set(p, pos); pos += p.length; }
  return out;
}

// ── Send file to Discord channel ───────────────────────────────────────────
async function sendPdfToChannel(channelId: string, filename: string, pdfBytes: Uint8Array, message: string) {
  const form = new FormData();
  form.append('payload_json', JSON.stringify({ content: message }));
  form.append('files[0]', new Blob([pdfBytes], { type: 'application/pdf' }), filename);

  const r = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
    body: form,
  });
  if (!r.ok) throw new Error(`Failed to send PDF: ${r.status} ${await r.text()}`);
}

// ── Deferred response handler ──────────────────────────────────────────────
async function handleScrapeCommand(interaction: any) {
  const channelId  = interaction.channel_id;
  const interToken = interaction.token;
  const appId      = interaction.application_id;
  const options    = interaction.data?.options ?? [];
  const modeOpt    = options.find((o: any) => o.name === 'mode')?.value ?? 'full';

  // ACK immediately so Discord doesn't time out (we have 15 min to follow up)
  await fetch(`${DISCORD_API}/interactions/${interaction.id}/${interToken}/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 5, data: { flags: 64 } }), // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, ephemeral
  });

  // Do the heavy work async — Discord gives us 15 min via webhook
  try {
    const channel = await discordGet(`/channels/${channelId}`);
    const channelName = channel.name ?? channelId;
    const channelType = channel.type; // 15 = GUILD_FORUM

    let sections: { heading: string; messages: any[] }[] = [];

    if (channelType === 15) {
      // Forum channel — scrape all threads
      const threads = await getForumThreads(channelId);
      if (threads.length === 0) {
        await patchFollowup(appId, interToken, '❌ No threads found in this forum channel.');
        return;
      }
      await patchFollowup(appId, interToken, `⏳ Found **${threads.length} threads** — scraping now. This may take a minute...`);

      for (const thread of threads) {
        const msgs = await getThreadMessages(thread.id);
        if (msgs.length > 0) sections.push({ heading: thread.name, messages: msgs });
      }
    } else {
      // Regular text channel — scrape messages directly
      const msgs = await getThreadMessages(channelId);
      sections = [{ heading: channelName, messages: msgs }];
    }

    const totalMsgs = sections.reduce((s, sec) => s + sec.messages.length, 0);
    if (totalMsgs === 0) {
      await patchFollowup(appId, interToken, '❌ No messages found to export.');
      return;
    }

    const pdfBytes = buildPdf(channelName, sections);
    const filename  = `TAG_${channelName.replace(/[^a-z0-9]/gi, '_')}_export.pdf`;
    await sendPdfToChannel(channelId, filename, pdfBytes, `✅ **${channelName}** — ${sections.length} sections, ${totalMsgs} messages exported.`);
    await patchFollowup(appId, interToken, `✅ PDF sent to channel — **${filename}** (${sections.length} sections, ${totalMsgs} messages)`);

  } catch (err: any) {
    console.error('[scrape error]', err);
    await patchFollowup(appId, interToken, `❌ Scrape failed: ${err.message}`);
  }
}

async function patchFollowup(appId: string, token: string, content: string) {
  await fetch(`${DISCORD_API}/webhooks/${appId}/${token}/messages/@original`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

// ── Main handler ───────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'GET') {
    return Response.json({ ok: true, service: 'TAG Discord Bot' });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const body = await req.text();

  // Verify Discord signature
  const valid = await verifyDiscordSignature(req, body);
  if (!valid) return new Response('Invalid signature', { status: 401 });

  const interaction = JSON.parse(body);

  // PING — Discord health check
  if (interaction.type === 1) {
    return Response.json({ type: 1 });
  }

  // APPLICATION_COMMAND
  if (interaction.type === 2) {
    const name = interaction.data?.name;

    if (name === 'scrape') {
      // Fire and forget — handleScrapeCommand ACKs immediately then does work
      handleScrapeCommand(interaction);
      return Response.json({ type: 5, data: { flags: 64 } }); // deferred ephemeral
    }
  }

  return Response.json({ type: 1 });
});
