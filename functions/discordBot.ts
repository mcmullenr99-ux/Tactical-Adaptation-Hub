/**
 * TAG Discord Bot — Interaction Handler ONLY
 * Acks Discord instantly, delegates all heavy work to discordBotWorker
 */

const DISCORD_PUBLIC_KEY = Deno.env.get('DISCORD_PUBLIC_KEY') ?? '';
const DISCORD_API = 'https://discord.com/api/v10';
const BASE44_APP_ID = '69bf52c997cae5d4cff87ae4';
const BASE44_BASE = 'https://app.base44.com';
const WORKER_URL = `https://agent-tag-lead-developer-cff87ae4.base44.app/functions/discordBotWorker`;

function serviceHeaders(extra?: Record<string, string>) {
  const token = Deno.env.get('BASE44_SERVICE_TOKEN') ?? '';
  return { 'Authorization': `Bearer ${token}`, ...(extra ?? {}) };
}

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

async function ackCallback(interactionId: string, token: string, body: unknown) {
  await fetch(`${DISCORD_API}/interactions/${interactionId}/${token}/callback`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

async function patchFollowup(appId: string, token: string, content: string) {
  await fetch(`${DISCORD_API}/webhooks/${appId}/${token}/messages/@original`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }),
  });
}

async function entityList(entityName: string): Promise<any[]> {
  const r = await fetch(`${BASE44_BASE}/api/apps/${BASE44_APP_ID}/entities/${entityName}`, {
    headers: serviceHeaders(),
  });
  if (!r.ok) return [];
  const data = await r.json();
  return Array.isArray(data) ? data : (data.items ?? data.results ?? []);
}

async function entityGet(entityName: string, id: string): Promise<any> {
  const r = await fetch(`${BASE44_BASE}/api/apps/${BASE44_APP_ID}/entities/${entityName}/${id}`, {
    headers: serviceHeaders(),
  });
  if (!r.ok) return null;
  return r.json();
}

async function entityDelete(entityName: string, id: string): Promise<void> {
  await fetch(`${BASE44_BASE}/api/apps/${BASE44_APP_ID}/entities/${entityName}/${id}`, {
    method: 'DELETE', headers: serviceHeaders(),
  });
}

// Fire-and-forget worker call
function fireWorker(job: Record<string, unknown>) {
  fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  }).catch(() => {});
}

async function handleInteraction(interaction: any): Promise<Response> {
  const type = interaction.type;
  if (type === 1) return Response.json({ type: 1 });

  // /scrape slash command
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

  // Button interactions
  if (type === 3) {
    const customId: string = interaction.data?.custom_id ?? '';

    // Open modal for new doc
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

    // Show doc picker for append
    if (customId.startsWith('scrape_append:')) {
      const channelId = customId.split(':')[1];
      const existingPdfs = await entityList('BotExportedPdf');
      if (!existingPdfs.length) {
        await ackCallback(interaction.id, interaction.token, { type: 4, data: { flags: 64, content: '❌ No existing documents found. Create one first.' } });
        return Response.json({ type: 1 });
      }
      const options = existingPdfs.slice(0, 25).map((pdf: any) => ({
        label: (pdf.title ?? pdf.id).slice(0, 100),
        description: `${pdf.section_count ?? 0} sections`,
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

    // Show doc picker for delete
    if (customId.startsWith('scrape_delete:')) {
      const existingPdfs = await entityList('BotExportedPdf');
      if (!existingPdfs.length) {
        await ackCallback(interaction.id, interaction.token, { type: 4, data: { flags: 64, content: '❌ No documents found.' } });
        return Response.json({ type: 1 });
      }
      const options = existingPdfs.slice(0, 25).map((pdf: any) => ({
        label: (pdf.title ?? pdf.id).slice(0, 100),
        description: `${pdf.section_count ?? 0} sections`,
        value: pdf.id,
      }));
      await ackCallback(interaction.id, interaction.token, {
        type: 4,
        data: {
          flags: 64,
          content: '🗑️ **Which document do you want to delete?**',
          components: [{ type: 1, components: [{ type: 3, custom_id: `scrape_delete_select`, options, placeholder: 'Choose...' }] }],
        },
      });
      return Response.json({ type: 1 });
    }

    // Delete confirm prompt
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

    // Delete confirmed
    if (customId.startsWith('scrape_delete_confirm:')) {
      const pdfId = customId.split(':')[1];
      await ackCallback(interaction.id, interaction.token, { type: 7, data: { flags: 64, content: '⏳ Deleting...' } });
      try {
        const record = await entityGet('BotExportedPdf', pdfId);
        await entityDelete('BotExportedPdf', pdfId);
        await patchFollowup(interaction.application_id, interaction.token, `🗑️ Deleted **${record?.title ?? pdfId}** successfully.`);
      } catch (err: any) {
        await patchFollowup(interaction.application_id, interaction.token, `❌ Delete failed: ${err.message}`);
      }
      return Response.json({ type: 1 });
    }

    // Append: doc selected → fire worker
    if (customId.startsWith('scrape_select:')) {
      const channelId = customId.split(':')[1];
      const selectedPdfId = interaction.data?.values?.[0];
      if (!selectedPdfId) {
        await ackCallback(interaction.id, interaction.token, { type: 4, data: { flags: 64, content: '❌ No document selected.' } });
        return Response.json({ type: 1 });
      }
      await ackCallback(interaction.id, interaction.token, { type: 7, data: { flags: 64, content: '⏳ Working on it... download link will be posted in the channel.' } });
      fireWorker({ action: 'append', appId: interaction.application_id, token: interaction.token, channelId, existingRecordId: selectedPdfId });
      return Response.json({ type: 1 });
    }
  }

  // Modal submit → fire worker
  if (type === 5) {
    const customId: string = interaction.data?.custom_id ?? '';
    if (customId.startsWith('scrape_modal:')) {
      const channelId = customId.split(':')[1];
      const components = interaction.data?.components ?? [];
      const getValue = (id: string) =>
        components.flatMap((r: any) => r.components).find((c: any) => c.custom_id === id)?.value ?? '';

      const title = getValue('doc_title').trim();
      const author = getValue('doc_author').trim();
      const classification = getValue('doc_class').trim().toUpperCase() || 'UNCLASSIFIED';

      await ackCallback(interaction.id, interaction.token, { type: 5, data: { flags: 64 } });
      await patchFollowup(interaction.application_id, interaction.token, '⏳ Working on it... download link will be posted in the channel when ready.');

      fireWorker({ action: 'create', appId: interaction.application_id, token: interaction.token, channelId, title, author, classification });
      return Response.json({ type: 1 });
    }
  }

  return Response.json({ type: 1 });
}

Deno.serve(async (req) => {
  if (req.method === 'GET') return Response.json({ ok: true, service: 'TAG Discord Bot v7' });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const body = await req.text();
  const valid = await verifyDiscordSignature(req, body);
  if (!valid) return new Response('Invalid signature', { status: 401 });
  const interaction = JSON.parse(body);
  return handleInteraction(interaction);
});
