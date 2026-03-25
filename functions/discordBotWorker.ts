/**
 * TAG Discord Bot Worker v4 — scrapes ONE channel/thread only, no bulk loops
 * Fast enough to complete within any reasonable timeout
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
  }).catch(() => {});
}

async function postMessage(channelId: string, content: string) {
  await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  }).catch(() => {});
}

async function uploadFile(bytes: Uint8Array, filename: string): Promise<string> {
  const serviceToken = Deno.env.get('BASE44_SERVICE_TOKEN') ?? '';
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: 'text/plain' }), filename);
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

async function entityCreate(entityName: string, data: Record<string, unknown>) {
  const r = await fetch(`${BASE44_BASE}/api/apps/${BASE44_APP_ID}/entities/${entityName}`, {
    method: 'POST', headers: serviceHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`Entity create failed ${r.status}: ${await r.text()}`);
  return r.json();
}

async function entityGet(entityName: string, id: string) {
  const r = await fetch(`${BASE44_BASE}/api/apps/${BASE44_APP_ID}/entities/${entityName}/${id}`, {
    headers: serviceHeaders(),
  });
  if (!r.ok) throw new Error(`Entity get failed ${r.status}: ${await r.text()}`);
  return r.json();
}

async function entityUpdate(entityName: string, id: string, data: Record<string, unknown>) {
  const r = await fetch(`${BASE44_BASE}/api/apps/${BASE44_APP_ID}/entities/${entityName}/${id}`, {
    method: 'PUT', headers: serviceHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`Entity update failed ${r.status}: ${await r.text()}`);
  return r.json();
}

// Grab at most 100 messages from a channel — single API call, no loop
async function scrapeMessages(channelId: string): Promise<{ channelName: string; lines: string[]; count: number }> {
  const channel = await discordGet(`/channels/${channelId}`);
  const channelName: string = channel.name ?? channelId;
  const msgs: any[] = await discordGet(`/channels/${channelId}/messages?limit=100`);
  const filtered = (msgs ?? []).filter((m: any) => (m.content ?? '').trim().length > 0).reverse();
  const lines: string[] = [];
  for (const m of filtered) {
    const author = m.author?.global_name ?? m.author?.username ?? 'Unknown';
    const ts = new Date(m.timestamp).toISOString().replace('T', ' ').slice(0, 16);
    lines.push(`[${author} | ${ts}]`);
    lines.push(m.content);
    lines.push('');
  }
  return { channelName, lines, count: filtered.length };
}

Deno.serve(async (req) => {
  if (req.method === 'GET') return Response.json({ ok: true, service: 'TAG Bot Worker v4' });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let job: any;
  try { job = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }

  const { action, appId, token, channelId, title, author, classification, existingRecordId } = job;

  try {
    const { channelName, lines, count } = await scrapeMessages(channelId);

    if (count === 0) {
      await patchFollowup(appId, token, `No messages found in this channel.`);
      return Response.json({ ok: true });
    }

    const sectionBlock = [
      `========================================`,
      `CHANNEL: ${channelName}`,
      `========================================`,
      ...lines,
    ].join('\n');

    if (action === 'create') {
      const header = [
        `TACTICAL ADAPTATION GROUP`,
        `DOCUMENT: ${title}`,
        `AUTHOR: ${author}`,
        `CLASSIFICATION: ${classification}`,
        `DATE: ${new Date().toISOString().slice(0, 10)}`,
        ``,
      ].join('\n');

      const fullText = header + sectionBlock;
      const fileUrl = await uploadFile(new TextEncoder().encode(fullText), `${title.replace(/[^a-z0-9]/gi, '_')}.txt`);

      await postMessage(channelId, `**${title}** [${classification}] — ${count} messages captured.\nDownload: ${fileUrl}`);
      await entityCreate('BotExportedPdf', {
        title, author, classification,
        channel_id: channelId, channel_name: channelName,
        section_count: 1, message_count: count,
        file_url: fileUrl, content_json: fileUrl,
      });
      await patchFollowup(appId, token, `Done! ${count} messages captured. Download link posted in channel.`);

    } else if (action === 'append') {
      const existing = await entityGet('BotExportedPdf', existingRecordId);
      if (!existing) throw new Error('Document not found.');

      let existingText = '';
      try {
        const r = await fetch(existing.content_json ?? existing.file_url);
        if (r.ok) existingText = await r.text();
      } catch {}

      const fullText = existingText + `\n\n` + sectionBlock;
      const fileUrl = await uploadFile(new TextEncoder().encode(fullText), `${existing.title.replace(/[^a-z0-9]/gi, '_')}.txt`);

      const totalMessages = (existing.message_count ?? 0) + count;
      const totalSections = (existing.section_count ?? 0) + 1;

      await postMessage(channelId, `**${existing.title}** updated — added **${channelName}** (+${count} messages). Total: ${totalSections} sections, ${totalMessages} messages.\nDownload: ${fileUrl}`);
      await entityUpdate('BotExportedPdf', existingRecordId, {
        file_url: fileUrl, content_json: fileUrl,
        section_count: totalSections, message_count: totalMessages,
      });
      await patchFollowup(appId, token, `Done! Added ${count} messages from ${channelName}. Download link posted in channel.`);
    }

  } catch (err: any) {
    await patchFollowup(appId, token, `Failed: ${err.message}`).catch(() => {});
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }

  return Response.json({ ok: true });
});
