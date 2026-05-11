/**
 * TAG Discord Bot — Interaction Handler
 * Handles slash commands: /op /lace /sitrep /loa /aar — v2 2026-04-02
 */

const DISCORD_PUBLIC_KEY = Deno.env.get('DISCORD_PUBLIC_KEY') ?? '42448c21f0f59339c03d39244becf4d9aa7f806dd1791af7408ddbc8f762b1e9';
const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN') ?? '';
const DISCORD_API = 'https://discord.com/api/v10';
const BASE44_APP_ID = '69bf52c997cae5d4cff87ae4';
const BASE44_BASE = 'https://app.base44.com';

function serviceHeaders(extra?: Record<string, string>) {
  const token = Deno.env.get('BASE44_SERVICE_TOKEN') ?? '';
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(extra ?? {}) };
}

function hexToBytes(hex: string): Uint8Array {
  const b = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) b[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return b;
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

async function ackModal(interactionId: string, token: string, modal: unknown) {
  await fetch(`${DISCORD_API}/interactions/${interactionId}/${token}/callback`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 9, data: modal }),
  });
}

async function ackMessage(interactionId: string, token: string, content: string, ephemeral = true) {
  await fetch(`${DISCORD_API}/interactions/${interactionId}/${token}/callback`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 4, data: { content, flags: ephemeral ? 64 : 0 } }),
  });
}

async function entityCreate(entityName: string, data: Record<string, unknown>) {
  const r = await fetch(`${BASE44_BASE}/api/apps/${BASE44_APP_ID}/entities/${entityName}`, {
    method: 'POST', headers: serviceHeaders(), body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`Entity create failed: ${await r.text()}`);
  return r.json();
}

async function entityFilter(entityName: string, query: Record<string, unknown>) {
  const r = await fetch(`${BASE44_BASE}/api/apps/${BASE44_APP_ID}/entities/${entityName}/filter`, {
    method: 'POST', headers: serviceHeaders(), body: JSON.stringify(query),
  });
  if (!r.ok) return [];
  const data = await r.json();
  return Array.isArray(data) ? data : (data.items ?? data.results ?? []);
}

function getModalValue(components: any[], id: string): string {
  return components.flatMap((r: any) => r.components ?? []).find((c: any) => c.custom_id === id)?.value ?? '';
}

// ── Modals ────────────────────────────────────────────────────────────────────

const OP_MODAL = {
  custom_id: 'modal_op',
  title: 'Create New Operation',
  components: [
    { type: 1, components: [{ type: 4, custom_id: 'op_name', label: 'Operation Name', style: 1, required: true, placeholder: 'e.g. Operation Iron Dawn' }] },
    { type: 1, components: [{ type: 4, custom_id: 'op_game', label: 'Game', style: 1, required: true, placeholder: 'e.g. Arma Reforger' }] },
    { type: 1, components: [{ type: 4, custom_id: 'op_date', label: 'Scheduled Date & Time (DD/MM/YYYY HH:MM)', style: 1, required: true, placeholder: 'e.g. 15/04/2026 20:00' }] },
    { type: 1, components: [{ type: 4, custom_id: 'op_type', label: 'Type (op / training / joint)', style: 1, required: true, placeholder: 'op' }] },
    { type: 1, components: [{ type: 4, custom_id: 'op_desc', label: 'Description', style: 2, required: false, placeholder: 'Brief overview...' }] },
  ],
};

const LACE_MODAL = {
  custom_id: 'modal_lace',
  title: 'LACE Report',
  components: [
    { type: 1, components: [{ type: 4, custom_id: 'lace_callsign', label: 'Your Callsign', style: 1, required: true }] },
    { type: 1, components: [{ type: 4, custom_id: 'lace_op', label: 'Operation Name', style: 1, required: true }] },
    { type: 1, components: [{ type: 4, custom_id: 'lace_liquid', label: 'Liquid (Full / Partial / Empty)', style: 1, required: true, placeholder: 'Full' }] },
    { type: 1, components: [{ type: 4, custom_id: 'lace_ammo', label: 'Ammo (Full / Partial / Empty)', style: 1, required: true, placeholder: 'Partial' }] },
    { type: 1, components: [{ type: 4, custom_id: 'lace_casualties', label: 'Casualties (none / number + notes)', style: 2, required: true, placeholder: 'None' }] },
  ],
};

const SITREP_MODAL = {
  custom_id: 'modal_sitrep',
  title: 'SITREP',
  components: [
    { type: 1, components: [{ type: 4, custom_id: 'sitrep_callsign', label: 'Your Callsign', style: 1, required: true }] },
    { type: 1, components: [{ type: 4, custom_id: 'sitrep_op', label: 'Operation Name', style: 1, required: true }] },
    { type: 1, components: [{ type: 4, custom_id: 'sitrep_position', label: 'Current Position / Grid', style: 1, required: true }] },
    { type: 1, components: [{ type: 4, custom_id: 'sitrep_activity', label: 'Current Activity', style: 1, required: true, placeholder: 'Holding, advancing, in contact...' }] },
    { type: 1, components: [{ type: 4, custom_id: 'sitrep_enemy', label: 'Enemy Contact / Notes', style: 2, required: false, placeholder: 'None' }] },
  ],
};

const LOA_MODAL = {
  custom_id: 'modal_loa',
  title: 'Leave of Absence Request',
  components: [
    { type: 1, components: [{ type: 4, custom_id: 'loa_callsign', label: 'Your Callsign', style: 1, required: true }] },
    { type: 1, components: [{ type: 4, custom_id: 'loa_start', label: 'Start Date (DD/MM/YYYY)', style: 1, required: true }] },
    { type: 1, components: [{ type: 4, custom_id: 'loa_end', label: 'End Date (DD/MM/YYYY)', style: 1, required: true }] },
    { type: 1, components: [{ type: 4, custom_id: 'loa_reason', label: 'Reason Category', style: 1, required: true, placeholder: 'Personal / Work / Medical / Holiday / Other' }] },
    { type: 1, components: [{ type: 4, custom_id: 'loa_detail', label: 'Additional Detail (optional)', style: 2, required: false }] },
  ],
};

const AAR_MODAL = {
  custom_id: 'modal_aar',
  title: 'After Action Review',
  components: [
    { type: 1, components: [{ type: 4, custom_id: 'aar_op', label: 'Operation Name', style: 1, required: true }] },
    { type: 1, components: [{ type: 4, custom_id: 'aar_outcome', label: 'Outcome (success / partial / failure)', style: 1, required: true }] },
    { type: 1, components: [{ type: 4, custom_id: 'aar_title', label: 'AAR Title', style: 1, required: true }] },
    { type: 1, components: [{ type: 4, custom_id: 'aar_content', label: 'Full AAR Content', style: 2, required: true, placeholder: 'What happened, key moments, execution...' }] },
    { type: 1, components: [{ type: 4, custom_id: 'aar_lessons', label: 'Lessons Learned', style: 2, required: false }] },
  ],
};

// ── Modal submit handlers ─────────────────────────────────────────────────────

async function handleOpModal(interaction: any): Promise<string> {
  const c = interaction.data?.components ?? [];
  const name = getModalValue(c, 'op_name');
  const game = getModalValue(c, 'op_game');
  const dateStr = getModalValue(c, 'op_date');
  const type = getModalValue(c, 'op_type').toLowerCase() || 'op';
  const desc = getModalValue(c, 'op_desc');

  // Parse DD/MM/YYYY HH:MM
  const [datePart, timePart] = dateStr.split(' ');
  const [dd, mm, yyyy] = (datePart ?? '').split('/');
  const scheduled_at = yyyy && mm && dd ? `${yyyy}-${mm}-${dd}T${timePart ?? '20:00'}:00.000Z` : new Date().toISOString();

  const discordUser = interaction.member?.user ?? interaction.user;
  const username = discordUser?.username ?? 'Discord User';

  await entityCreate('MilsimOp', {
    name,
    game,
    description: desc,
    scheduled_at,
    event_type: type,
    status: 'scheduled',
    created_by: username,
    participants: [],
  });

  return `✅ **${name}** created successfully! It will appear in the HQ Ops Calendar shortly.`;
}

async function handleLaceModal(interaction: any): Promise<string> {
  const c = interaction.data?.components ?? [];
  const callsign = getModalValue(c, 'lace_callsign');
  const opName = getModalValue(c, 'lace_op');
  const liquid = getModalValue(c, 'lace_liquid');
  const ammo = getModalValue(c, 'lace_ammo');
  const casualties = getModalValue(c, 'lace_casualties');

  const discordUser = interaction.member?.user ?? interaction.user;
  const username = discordUser?.username ?? 'Discord User';

  await entityCreate('MilsimLace', {
    op_name: opName,
    callsign,
    reported_by: username,
    report_time: new Date().toISOString(),
    liquid: liquid.toLowerCase().includes('full') ? 'Full' : liquid.toLowerCase().includes('empty') ? 'Empty' : 'Partial',
    ammo: ammo.toLowerCase().includes('full') ? 'Full' : ammo.toLowerCase().includes('empty') ? 'Empty' : 'Partial',
    casualty: casualties.toLowerCase() === 'none' ? 'None' : 'Has Casualties',
    casualty_note: casualties,
    eyewitness_confirmations: [],
    eyewitness_count: 0,
  });

  return `✅ LACE report from **${callsign}** submitted for **${opName}**.`;
}

async function handleSitrepModal(interaction: any): Promise<string> {
  const c = interaction.data?.components ?? [];
  const callsign = getModalValue(c, 'sitrep_callsign');
  const opName = getModalValue(c, 'sitrep_op');
  const position = getModalValue(c, 'sitrep_position');
  const activity = getModalValue(c, 'sitrep_activity');
  const enemy = getModalValue(c, 'sitrep_enemy');

  const discordUser = interaction.member?.user ?? interaction.user;
  const username = discordUser?.username ?? 'Discord User';

  await entityCreate('MilsimSitrep', {
    op_name: opName,
    callsign,
    reported_by: username,
    report_time: new Date().toISOString(),
    position,
    activity,
    enemy_contact: enemy ? 'Yes' : 'No',
    enemy_notes: enemy,
    mission_status: 'Ongoing',
    eyewitness_confirmations: [],
    eyewitness_count: 0,
  });

  return `✅ SITREP from **${callsign}** submitted for **${opName}**.`;
}

async function handleLoaModal(interaction: any): Promise<string> {
  const c = interaction.data?.components ?? [];
  const callsign = getModalValue(c, 'loa_callsign');
  const startRaw = getModalValue(c, 'loa_start');
  const endRaw = getModalValue(c, 'loa_end');
  const reasonCat = getModalValue(c, 'loa_reason');
  const detail = getModalValue(c, 'loa_detail');

  const parseDate = (s: string) => {
    const [dd, mm, yyyy] = s.split('/');
    return yyyy && mm && dd ? `${yyyy}-${mm}-${dd}` : s;
  };

  const discordUser = interaction.member?.user ?? interaction.user;
  const userId = discordUser?.id ?? '';

  await entityCreate('MilsimLOA', {
    callsign,
    user_id: userId,
    start_date: parseDate(startRaw),
    end_date: parseDate(endRaw),
    reason_category: reasonCat,
    reason_detail: detail,
    status: 'pending',
  });

  return `✅ LOA request from **${callsign}** submitted (${startRaw} → ${endRaw}). Awaiting commander approval in HQ.`;
}

async function handleAarModal(interaction: any): Promise<string> {
  const c = interaction.data?.components ?? [];
  const opName = getModalValue(c, 'aar_op');
  const outcome = getModalValue(c, 'aar_outcome').toLowerCase();
  const title = getModalValue(c, 'aar_title');
  const content = getModalValue(c, 'aar_content');
  const lessons = getModalValue(c, 'aar_lessons');

  const discordUser = interaction.member?.user ?? interaction.user;
  const username = discordUser?.username ?? 'Discord User';

  await entityCreate('MilsimAAR', {
    op_name: opName,
    author_username: username,
    title,
    content,
    outcome: outcome.includes('success') ? 'success' : outcome.includes('partial') ? 'partial_success' : 'failure',
    lessons_learned: lessons,
    participants: [],
    eyewitness_confirmations: [],
    eyewitness_count: 0,
  });

  return `✅ AAR **"${title}"** submitted for **${opName}**. Now visible in HQ portal.`;
}

// ── Main handler ──────────────────────────────────────────────────────────────

async function handleInteraction(interaction: any): Promise<Response> {
  const type = interaction.type;

  // Ping
  if (type === 1) return Response.json({ type: 1 });

  // Slash commands — open modals
  if (type === 2) {
    const name = interaction.data?.name;
    const modalMap: Record<string, unknown> = {
      op: OP_MODAL,
      lace: LACE_MODAL,
      sitrep: SITREP_MODAL,
      loa: LOA_MODAL,
      aar: AAR_MODAL,
    };
    if (modalMap[name]) {
      await ackModal(interaction.id, interaction.token, modalMap[name]);
      return Response.json({ type: 1 });
    }
    await ackMessage(interaction.id, interaction.token, '❌ Unknown command.');
    return Response.json({ type: 1 });
  }

  // Modal submissions
  if (type === 5) {
    const customId: string = interaction.data?.custom_id ?? '';
    try {
      let reply = '✅ Submitted.';
      if (customId === 'modal_op') reply = await handleOpModal(interaction);
      else if (customId === 'modal_lace') reply = await handleLaceModal(interaction);
      else if (customId === 'modal_sitrep') reply = await handleSitrepModal(interaction);
      else if (customId === 'modal_loa') reply = await handleLoaModal(interaction);
      else if (customId === 'modal_aar') reply = await handleAarModal(interaction);
      await ackMessage(interaction.id, interaction.token, reply, true);
    } catch (err: any) {
      await ackMessage(interaction.id, interaction.token, `❌ Error: ${err.message}`, true);
    }
    return Response.json({ type: 1 });
  }

  return Response.json({ type: 1 });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'GET') return new Response('TAG Discord Bot OK', { status: 200 });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const body = await req.text();
  const valid = await verifyDiscordSignature(req, body);
  if (!valid) return new Response('Unauthorized', { status: 401 });
  try {
    const interaction = JSON.parse(body);
    return await handleInteraction(interaction);
  } catch {
    return new Response('Bad request', { status: 400 });
  }
});