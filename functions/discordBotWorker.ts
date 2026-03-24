/**
 * TAG Discord Bot Worker — scrape + plain text upload
 */

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN') ?? '';
const DISCORD_API = 'https://discord.com/api/v10';
const BASE44_APP_ID = '69bf52c997cae5d4cff87ae4';
const BASE44_BASE = 'https://app.base44.com';

function serviceHeaders(extra?: Record<string, string>) {
  const token = Deno.env.get('BASE44_SERVICE_TOKEN') ?? '';
  return { 'Authorization': `Bearer ${token}`, ...(extra ?? {}) };
}

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

async function entityCreate(entityName: string, data: Record<string, unknown>): Promise<any> {
  const r = await fetch(`${BASE44_BASE}/api/apps/${BASE44_APP_ID}/entities/${entityName}`, {
    method: 'POST', headers: serviceHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`Entity create failed ${r.status}: ${await r.text()}`);
  return r.json();
}

async function entityGet(entityName: string, id: string): Promise<any> {
  const r = await fetch(`${BASE44_BASE}/api/apps/${BASE44_APP_ID}/entities/${entityName}/${id}`, {
    headers: serviceHeaders(),
  });
  if (!r.ok) throw new Error(`Entity get failed ${r.status}: ${await r.text()}`);
  return r.json();
}

async function entityUpdate(entityName: string, id: string, data: Record<string, unknown>): Promise<any> {
  const r = await fetch(`${BASE44_BASE}/api/apps/${BASE44_APP_ID}/entities/${entityName}/${id}`, {
    method: 'PUT', headers: serviceHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`Entity update failed ${r.status}: ${await r.text()}`);
  return r.json();
}

// ── Scraping ──────────────────────────────────────────────────────────────
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

async function scrapeChannel(channelId: string): Promise<{ channelName: string; text: string; sectionCount: number; messageCount: number }> {
  const channel = await discordGet(`/channels/${channelId}`);
  const channelName: string = channel.name ?? channelId;
  const lines: string[] = [];
  let sectionCount = 0;
  let messageCount = 0;

  if (channel.type === 15) {
    // Forum channel — scrape threads
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
    const threads = [...active, ...archived];

    for (const thread of threads) {
      const msgs = await getThreadMessages(thread.id);
      const filtered = msgs.filter((m: any) => (m.content ?? '').trim().length > 0);
      if (filtered.length === 0) continue;
      sectionCount++;
      lines.push(`\n========================================`);
      lines.push(`SECTION: ${thread.name}`);
      lines.push(`========================================`);
      for (const m of filtered) {
        const author = m.author?.global_name ?? m.author?.username ?? 'Unknown';
        const ts = new Date(m.timestamp).toISOString().replace('T', ' ').slice(0, 16);
        lines.push(`\n[${author} | ${ts}]`);
        lines.push(m.content);
        messageCount++;
      }
    }
  } else {
    // Regular channel
    const msgs = await getThreadMessages(channelId);
    const filtered = msgs.filter((m: any) => (m.content ?? '').trim().length > 0);
    sectionCount = 1;
    lines.push(`\n========================================`);
    lines.push(`CHANNEL: ${channelName}`);
    lines.push(`========================================`);
    for (const m of filtered) {
      const author = m.author?.global_name ?? m.author?.username ?? 'Unknown';
      const ts = new Date(m.timestamp).toISOString().replace('T', ' ').slice(0, 16);
      lines.push(`\n[${author} | ${ts}]`);
      lines.push(m.content);
      messageCount++;
    }
  }

  return { channelName, text: lines.join('\n'), sectionCount, messageCount };
}

// ── Main ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'GET') return Response.json({ ok: true, service: 'TAG Bot Worker v2 (plaintext)' });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let job: any;
  try { job = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }

  const { action, appId, token, channelId, title, author, classification, existingRecordId } = job;

  try {
    if (action === 'create') {
      await patchFollowup(appId, token, `Scraping channel...`);
      const { channelName, text, sectionCount, messageCount } = await scrapeChannel(channelId);
      if (!text.trim()) throw new Error('No text content found in this channel.');

      const header = [
        `TACTICAL ADAPTATION GROUP`,
        `DOCUMENT: ${title}`,
        `AUTHOR: ${author}`,
        `CLASSIFICATION: ${classification}`,
        `SOURCE CHANNEL: ${channelName}`,
        `DATE: ${new Date().toISOString().slice(0, 10)}`,
        `SECTIONS: ${sectionCount} | MESSAGES: ${messageCount}`,
        `========================================\n`,
      ].join('\n');

      const fullText = header + text;
      const bytes = new TextEncoder().encode(fullText);
      const filename = `${title.replace(/[^a-z0-9]/gi, '_')}.txt`;

      await patchFollowup(appId, token, `Uploading document...`);
      const fileUrl = await uploadFile(bytes, filename, 'text/plain');

      await postMessage(channelId, `**${title}** [${classification}] -- ${sectionCount} sections, ${messageCount} messages from **${channelName}**.\nDownload: ${fileUrl}`);

      await entityCreate('BotExportedPdf', {
        title, author, classification,
        channel_id: channelId, channel_name: channelName,
        section_count: sectionCount, message_count: messageCount,
        file_url: fileUrl, content_json: fileUrl,
      });

      await patchFollowup(appId, token, `Done! Download link posted in the channel.`);

    } else if (action === 'append') {
      const existingRecord = await entityGet('BotExportedPdf', existingRecordId);
      if (!existingRecord) throw new Error('Could not find the selected document.');

      await patchFollowup(appId, token, `Scraping channel...`);
      const { channelName, text, sectionCount, messageCount } = await scrapeChannel(channelId);
      if (!text.trim()) throw new Error('No text content found in this channel.');

      // Fetch existing text
      let existingText = '';
      if (existingRecord.content_json) {
        try {
          const r = await fetch(existingRecord.content_json);
          if (r.ok) existingText = await r.text();
        } catch {}
      }

      if (existingText.includes(`CHANNEL: ${channelName}`) || existingText.includes(`SOURCE CHANNEL: ${channelName}`)) {
        await patchFollowup(appId, token, `**${channelName}** is already in this document. Skipping.`);
        return Response.json({ ok: true });
      }

      const appendHeader = `\n\n========================================\nAPPENDED CHANNEL: ${channelName}\nDATE: ${new Date().toISOString().slice(0, 10)}\n========================================`;
      const fullText = existingText + appendHeader + text;
      const bytes = new TextEncoder().encode(fullText);
      const filename = `${existingRecord.title.replace(/[^a-z0-9]/gi, '_')}.txt`;

      await patchFollowup(appId, token, `Uploading updated document...`);
      const fileUrl = await uploadFile(bytes, filename, 'text/plain');

      const totalSections = (existingRecord.section_count ?? 0) + sectionCount;
      const totalMessages = (existingRecord.message_count ?? 0) + messageCount;

      await postMessage(channelId, `**${existingRecord.title}** updated -- added **${channelName}** (+${sectionCount} sections, +${messageCount} messages). Total: ${totalSections} sections, ${totalMessages} messages.\nDownload: ${fileUrl}`);

      await entityUpdate('BotExportedPdf', existingRecordId, {
        file_url: fileUrl, content_json: fileUrl,
        section_count: totalSections, message_count: totalMessages,
      });

      await patchFollowup(appId, token, `Done! Download link posted in the channel.`);
    }

  } catch (err: any) {
    try { await patchFollowup(appId, token, `Failed: ${err.message}`); } catch {}
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }

  return Response.json({ ok: true });
});
