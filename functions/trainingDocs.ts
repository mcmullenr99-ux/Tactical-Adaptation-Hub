import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET     = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const MIN_CONTENT_CHARS = 80;

// ─── AUTH ─────────────────────────────────────────────────────────────────────
async function getCallerUser(base44: any, req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    return await base44.asServiceRole.entities.AppUser.get(payload.sub) ?? null;
  } catch { return null; }
}

// ─── DOCX ZIP WALKER ─────────────────────────────────────────────────────────
// Walks the DOCX ZIP central directory and decompresses a named entry.
// Uses central directory (not local header) so compressedSize is always correct.
async function readDocxEntry(buf: ArrayBuffer, entryName: string): Promise<string | null> {
  try {
    const bytes = new Uint8Array(buf);
    // Find EOCD signature from end
    let eocdPos = -1;
    for (let k = bytes.length - 22; k >= Math.max(0, bytes.length - 65558); k--) {
      if (bytes[k]===0x50&&bytes[k+1]===0x4B&&bytes[k+2]===0x05&&bytes[k+3]===0x06) { eocdPos=k; break; }
    }
    if (eocdPos === -1) return null;
    const cdOffset = bytes[eocdPos+16]|(bytes[eocdPos+17]<<8)|(bytes[eocdPos+18]<<16)|(bytes[eocdPos+19]<<24);
    const cdCount  = bytes[eocdPos+8]|(bytes[eocdPos+9]<<8);
    let cdPos = cdOffset;
    for (let e = 0; e < cdCount; e++) {
      if (bytes[cdPos]!==0x50||bytes[cdPos+1]!==0x4B||bytes[cdPos+2]!==0x01||bytes[cdPos+3]!==0x02) break;
      const compMethod  = bytes[cdPos+10]|(bytes[cdPos+11]<<8);
      const compSize    = bytes[cdPos+20]|(bytes[cdPos+21]<<8)|(bytes[cdPos+22]<<16)|(bytes[cdPos+23]<<24);
      const fnLen       = bytes[cdPos+28]|(bytes[cdPos+29]<<8);
      const extraLen    = bytes[cdPos+30]|(bytes[cdPos+31]<<8);
      const commentLen  = bytes[cdPos+32]|(bytes[cdPos+33]<<8);
      const localOffset = bytes[cdPos+42]|(bytes[cdPos+43]<<8)|(bytes[cdPos+44]<<16)|(bytes[cdPos+45]<<24);
      const name = new TextDecoder('utf-8',{fatal:false}).decode(bytes.slice(cdPos+46, cdPos+46+fnLen));
      if (name === entryName) {
        const localFnLen    = bytes[localOffset+26]|(bytes[localOffset+27]<<8);
        const localExtraLen = bytes[localOffset+28]|(bytes[localOffset+29]<<8);
        const dataStart     = localOffset + 30 + localFnLen + localExtraLen;
        const compressed    = bytes.slice(dataStart, dataStart + compSize);
        if (compMethod === 8) {
          const ds = new DecompressionStream('deflate-raw');
          const dw = ds.writable.getWriter(); const dr = ds.readable.getReader();
          void dw.write(compressed).then(()=>dw.close()).catch(()=>{});
          const parts: Uint8Array[] = [];
          while (true) { let r: ReadableStreamReadResult<Uint8Array>; try { r = await dr.read(); } catch { break; } if (r.done) break; parts.push(r.value); }
          const total = parts.reduce((s,p)=>s+p.length,0);
          const merged = new Uint8Array(total); let off=0; for(const p of parts){merged.set(p,off);off+=p.length;}
          return new TextDecoder('utf-8',{fatal:false}).decode(merged);
        } else {
          return new TextDecoder('utf-8',{fatal:false}).decode(bytes.slice(dataStart, dataStart+compSize));
        }
      }
      cdPos += 46 + fnLen + extraLen + commentLen;
    }
    return null;
  } catch { return null; }
}

// ─── DOCX CONTENT METRICS ────────────────────────────────────────────────────
// Reads word/document.xml and counts actual content signals.
// These are exact measurements — immune to compression artefacts.
interface DocxMetrics {
  wordCount: number;
  paraCount: number;
  headingCount: number;
  tableCount: number;
  pageCount: number | null; // from docProps/app.xml — for display only
  textSample: string;       // for AI validation
}

async function analyseDocx(buf: ArrayBuffer): Promise<DocxMetrics> {
  const defaults: DocxMetrics = { wordCount: 0, paraCount: 0, headingCount: 0, tableCount: 0, pageCount: null, textSample: '' };

  // 1. Get real page count from docProps/app.xml
  const appXml = await readDocxEntry(buf, 'docProps/app.xml');
  let rawPageCount: number | null = null;
  if (appXml) {
    const m = appXml.match(/<Pages>(\d+)<\/Pages>/i);
    if (m) { const n = parseInt(m[1], 10); if (n > 0) rawPageCount = n; }
  }
  // Word often stores Pages=1 when the doc hasn't been re-paginated after editing.
  // If app.xml says 1 but word count implies more content, estimate from words instead.
  // This is set AFTER wordCount is calculated — resolved below in return statement.

  // 2. Get word/document.xml — the full document content
  const docXml = await readDocxEntry(buf, 'word/document.xml');
  if (!docXml || docXml.length < 50) return { ...defaults, pageCount };

  // Count paragraphs: <w:p> elements
  const paraCount = (docXml.match(/<w:p[ >]/g) ?? []).length;

  // Count headings: <w:pStyle w:val="Heading..."> or similar
  const headingCount = (docXml.match(/w:val="Heading\d"/gi) ?? []).length +
                       (docXml.match(/w:val="Title"/gi) ?? []).length;

  // Count tables: <w:tbl> elements
  const tableCount = (docXml.match(/<w:tbl[ >]/g) ?? []).length;

  // Extract plain text — strip all XML tags
  const plainText = docXml
    .replace(/<w:br[^>]*\/>/g, ' ')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
    .replace(/&#[0-9]+;/g,' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Word count from actual full content — exact, not sampled
  const wordCount = plainText.split(/\s+/).filter((w: string) => w.length >= 2).length;

  // Text sample for AI: beginning + middle + end
  const sampleMaxChars = 8000;
  let textSample = plainText;
  if (plainText.length > sampleMaxChars) {
    const begin = Math.floor(sampleMaxChars * 0.4);
    const mid   = Math.floor(sampleMaxChars * 0.3);
    const end   = Math.floor(sampleMaxChars * 0.3);
    const midStart = Math.floor((plainText.length - mid) / 2);
    textSample = [plainText.slice(0, begin), '...', plainText.slice(midStart, midStart+mid), '...', plainText.slice(plainText.length - end)].join(' ');
  }

  // Resolve page count: if app.xml says 1 but word count implies more, use estimate.
  // Military docs have headers, bullet points, spacing — ~200 words/page is realistic.
  const estPages = (wc: number) => Math.max(1, Math.round(wc / 200));
  const pageCount = (rawPageCount === 1 && wordCount > 400)
    ? Math.max(2, estPages(wordCount))
    : rawPageCount ?? (wordCount > 100 ? estPages(wordCount) : null);

  return { wordCount, paraCount, headingCount, tableCount, pageCount, textSample };
}

// ─── CONTENT-BASED STRUCTURAL SCORE ──────────────────────────────────────────
// Scores entirely from measured content signals. No file size. No page estimation.
// Word count is the primary axis — it's exact and cannot be compressed away.
function contentStructuralScore(wordCount: number, paraCount: number, headingCount: number, tableCount: number, docType: string): number {
  // SHORT-FORM types: intentionally concise — score on structure, not word count.
  // Drill cards, WARNOs, FRAGOs, OPORDs are supposed to be brief. Brevity = correct doctrine.
  const SHORT_FORM_TYPES = ['Drill', 'WARNO', 'FRAGO', 'OPORD'];
  if (SHORT_FORM_TYPES.includes(docType)) {
    const structureScore = Math.min(85, (headingCount * 10) + (paraCount * 2));
    const floor = wordCount >= 50 ? 60 : wordCount >= 20 ? 35 : 10;
    return Math.max(floor, Math.min(100, structureScore));
  }

  // LONG-FORM types: SOPs, TTPs, Field Manuals, ROE — word count is the primary axis.
  const wordScore =
    wordCount >= 15000 ? 100 :
    wordCount >= 8000  ? 90  :
    wordCount >= 4000  ? 80  :
    wordCount >= 2000  ? 65  :
    wordCount >= 800   ? 45  :
    wordCount >= 200   ? 25  : 10;

  const structureBonus = Math.min(20, (headingCount * 2) + (tableCount * 3));
  const paraBonus = Math.min(5, Math.floor(paraCount / 20));
  const typeBonus =
    docType === 'SOP'                 ? 5 :
    docType === 'TTP'                 ? 5 :
    docType === 'Field Manual'        ? 5 :
    docType === 'Rules of Engagement' ? 4 : 0;

  return Math.min(100, wordScore + structureBonus + paraBonus + typeBonus);
}

// ─── PDF / PLAIN TEXT EXTRACTION ─────────────────────────────────────────────
function sampleFromText(text: string, maxChars: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= maxChars) return t;
  const begin = Math.floor(maxChars * 0.4);
  const mid   = Math.floor(maxChars * 0.3);
  const end   = Math.floor(maxChars * 0.3);
  const midStart = Math.floor((t.length - mid) / 2);
  return [t.slice(0, begin), '...', t.slice(midStart, midStart+mid), '...', t.slice(t.length - end)].join(' ');
}

async function extractPdfText(arrayBuf: ArrayBuffer): Promise<{ text: string; wordCount: number }> {
  const raw = new TextDecoder('latin1', { fatal: false }).decode(arrayBuf);
  const chunks: string[] = [];

  async function tryDeflate(bytes: Uint8Array, algo: string): Promise<string | null> {
    try {
      const ds = new DecompressionStream(algo as any);
      const writer = ds.writable.getWriter(); const reader = ds.readable.getReader();
      void writer.write(bytes).then(() => writer.close()).catch(() => {});
      const parts: Uint8Array[] = [];
      while (true) { let r: ReadableStreamReadResult<Uint8Array>; try { r = await reader.read(); } catch { break; } if (r.done) break; parts.push(r.value); }
      if (parts.length === 0) return null;
      const total = parts.reduce((s,p)=>s+p.length,0); const merged = new Uint8Array(total); let off=0; for(const p of parts){merged.set(p,off);off+=p.length;}
      return new TextDecoder('latin1', { fatal: false }).decode(merged);
    } catch { return null; }
  }

  function extractTokens(text: string): string[] {
    const result: string[] = [];
    const btRegex = /BT[\s\S]*?ET/g; let bm: RegExpExecArray | null;
    while ((bm = btRegex.exec(text)) !== null) {
      const strRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)|<([0-9A-Fa-f\s]+)>/g; let tm: RegExpExecArray | null;
      while ((tm = strRegex.exec(bm[0])) !== null) {
        if (tm[1]) { const u = tm[1].replace(/\\n/g,' ').replace(/\\r/g,' ').replace(/\\t/g,' ').replace(/\\\(/g,'(').replace(/\\\)/g,')').replace(/\\\\/g,'\\').replace(/\\[0-7]{1,3}/g,' '); if (u.trim()) result.push(u); }
        else if (tm[2]) { const hex=tm[2].replace(/\s/g,''); let d=''; for(let i=0;i<hex.length-1;i+=2){const c=parseInt(hex.slice(i,i+2),16);if(c>=32&&c<127)d+=String.fromCharCode(c);}if(d.trim())result.push(d); }
      }
    }
    if (result.length === 0) result.push(...text.replace(/[^\x20-\x7E\n]/g,' ').split(/\s+/).filter(w=>w.length>=3&&/[a-zA-Z]{2,}/.test(w)).slice(0,400));
    return result;
  }

  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g; let sm: RegExpExecArray | null;
  while ((sm = streamRegex.exec(raw)) !== null) {
    const sb = new Uint8Array(sm[1].length); for(let i=0;i<sm[1].length;i++) sb[i]=sm[1].charCodeAt(i)&0xff;
    const dec = await tryDeflate(sb,'deflate-raw') ?? await tryDeflate(sb,'deflate');
    if (dec) chunks.push(...extractTokens(dec));
    if (chunks.join(' ').length > 6000) break;
  }

  let combined = chunks.join(' ').replace(/\s+/g,' ').trim();
  if (combined.length < 60) {
    const btRegex2 = /BT[\s\S]*?ET/g; let m2: RegExpExecArray|null;
    while ((m2=btRegex2.exec(raw))!==null&&chunks.join(' ').length<6000) {
      const sr=/\(([^)\\]*(?:\\.[^)\\]*)*)\)|<([0-9A-Fa-f\s]+)>/g; let fm:RegExpExecArray|null;
      while((fm=sr.exec(m2[0]))!==null){
        if(fm[1])chunks.push(fm[1].replace(/\\n/g,' ').replace(/\\r/g,' ').replace(/\\t/g,' ').replace(/\\\(/g,'(').replace(/\\\)/g,')').replace(/\\\\/g,'\\').replace(/\\[0-7]{1,3}/g,' '));
        else if(fm[2]){const hex=fm[2].replace(/\s/g,'');let d='';for(let i=0;i<hex.length-1;i+=2){const c=parseInt(hex.slice(i,i+2),16);if(c>=32&&c<127)d+=String.fromCharCode(c);}if(d.trim())chunks.push(d);}
      }
    }
    combined = chunks.join(' ').replace(/\s+/g,' ').trim();
  }
  if (combined.length < 60) {
    combined = raw.replace(/[^\x20-\x7E\n]/g,' ').split(' ').filter(w=>w.length>=3&&/[a-zA-Z]{2,}/.test(w)).join(' ');
  }

  const wordCount = combined.split(/\s+/).filter((w:string)=>w.length>=2).length;
  return { text: sampleFromText(combined, 8000), wordCount };
}

// ─── AI VALIDATION ────────────────────────────────────────────────────────────
async function validateDocContent(textSample: string, docType: string, title: string): Promise<{ score: number; reason: string }> {
  if (!OPENAI_API_KEY) return { score: 75, reason: 'AI validation not configured' };
  const nonWhitespace = textSample.replace(/\s/g, '');
  if (nonWhitespace.length < MIN_CONTENT_CHARS) return { score: 45, reason: 'Insufficient extractable text — document may be image-based or empty' };
  const charFreq: Record<string,number> = {};
  for (const c of nonWhitespace) charFreq[c]=(charFreq[c]??0)+1;
  if (Math.max(...Object.values(charFreq)) / nonWhitespace.length > 0.4) return { score: 0, reason: 'Document content appears to be repetitive garbage' };
  const words = textSample.toLowerCase().match(/[a-z]{3,}/g) ?? [];
  if (words.length > 30 && new Set(words).size / words.length < 0.15) return { score: 5, reason: 'Highly repetitive text — very few unique words' };

  try {
    const prompt = `You are a military document validator for a milsim platform. Rate this document excerpt for DOCTRINE LEGITIMACY (0-100).

Title: "${title}" | Type: "${docType}"
---
${textSample.slice(0, 4000)}
---

Scale:
0-20: Garbage/gibberish/lorem ipsum
21-40: Very thin, barely relevant
41-60: Some relevant content but shallow
61-80: Solid doctrine — clear procedures, tactics, or standards
81-100: Excellent, comprehensive, professional

NOTE: This is a sampled excerpt from a potentially large document. Do NOT penalise for lack of context between sections — judge quality of what's present.

Respond ONLY with valid JSON (no markdown fences): {"score": <0-100>, "reason": "<one sentence>"}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 120, temperature: 0.1 }),
    });
    if (!res.ok) return { score: 70, reason: 'AI validation service unavailable' };
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content?.trim() ?? '';
    const cleaned = content.replace(/^```[a-z]*\n?/i,'').replace(/\n?```$/,'').trim();
    const parsed = JSON.parse(cleaned);
    const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
    return { score, reason: String(parsed.reason || '') };
  } catch { return { score: 70, reason: 'AI validation error — proceeding' }; }
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const rawPath = pathOverride ?? url.pathname.replace(/^\/functions\/trainingDocs/, '');
    const parts = rawPath.split('/').filter(Boolean);
    const method = req.method;

    // ── POST /upload ──────────────────────────────────────────────────────────
    if (method === 'POST' && parts[0] === 'upload') {
      const caller = await getCallerUser(base44, req);
      if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const contentType = req.headers.get('content-type') ?? '';
      let record: any;

      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const groupId            = formData.get('group_id') as string ?? '';
        const title              = formData.get('title') as string ?? '';
        const docType            = formData.get('doc_type') as string ?? 'Other';
        const desc               = formData.get('description') as string ?? '';
        const uploadedBy         = formData.get('uploaded_by') as string ?? caller.id;
        const uploadedByUsername = formData.get('uploaded_by_username') as string ?? caller.username ?? caller.email;
        const sourceType         = formData.get('source_type') as string ?? 'upload';

        if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });
        if (!groupId) return Response.json({ error: 'group_id required' }, { status: 400 });
        if (!title.trim()) return Response.json({ error: 'Title required' }, { status: 400 });

        if (caller.role !== 'admin' && caller.role !== 'mod') {
          const roster = await base44.asServiceRole.entities.MilsimRoster.filter({ group_id: groupId, user_id: caller.id });
          if (!roster || roster.length === 0) {
            const grp = await base44.asServiceRole.entities.MilsimGroup.get(groupId);
            if (!grp || grp.owner_id !== caller.id) return Response.json({ error: 'Not authorised' }, { status: 403 });
          }
        }

        const ALLOWED_TYPES = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','text/markdown','application/vnd.apple.pages','application/octet-stream'];
        if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith('.pages')) return Response.json({ error: 'Unsupported file type' }, { status: 400 });
        if (file.size > 20 * 1024 * 1024) return Response.json({ error: 'File too large (max 20MB)' }, { status: 400 });

        const arrayBuf = await file.arrayBuffer();

        // Duplicate check
        const existingDocs = await base44.asServiceRole.entities.TrainingDoc.filter({ group_id: groupId });
        if ((existingDocs ?? []).some((d: any) => d.file_size_bytes === file.size && d.file_name === file.name)) {
          return Response.json({ error: 'Duplicate document detected.' }, { status: 409 });
        }

        // Pro gate
        const proRecords = await base44.asServiceRole.entities.CommanderPro.filter({ group_id: groupId });
        const isPro = (proRecords ?? []).some((p: any) => p.status === 'active' || p.status === 'trialing' || p.status === 'manual_override' || p.stripe_customer_id === 'manual_override' || p.stripe_subscription_id === 'manual_override');
        if (!isPro && (existingDocs ?? []).length >= 5) return Response.json({ error: 'Free units are limited to 5 training documents. Upgrade to Commander Pro.', pro_required: true }, { status: 403 });

        const isDocx = file.type.includes('wordprocessingml') || file.type.includes('msword') || file.name.toLowerCase().endsWith('.docx');
        const isPdf  = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

        // ── SCORING PIPELINE ─────────────────────────────────────────────────
        let wordCount = 0;
        let paraCount = 0;
        let headingCount = 0;
        let tableCount = 0;
        let pageCount: number | null = null;
        let textSample = '';

        if (isDocx) {
          // DOCX: extract exact content metrics from word/document.xml
          // These are real measurements — not estimates, not affected by compression
          const metrics = await analyseDocx(arrayBuf);
          wordCount    = metrics.wordCount;
          paraCount    = metrics.paraCount;
          headingCount = metrics.headingCount;
          tableCount   = metrics.tableCount;
          pageCount    = metrics.pageCount;  // from docProps/app.xml — display only
          textSample   = metrics.textSample;
        } else if (isPdf) {
          const result = await extractPdfText(arrayBuf);
          textSample = result.text;
          wordCount  = result.wordCount;
          // PDF: estimate page count from file size (no embedded metadata standard)
          pageCount = Math.max(1, Math.round(file.size / 45_000));
        } else {
          // Plain text / markdown
          const plain = new TextDecoder('utf-8',{fatal:false}).decode(arrayBuf).replace(/\s+/g,' ').trim();
          wordCount = plain.split(/\s+/).filter((w:string)=>w.length>=2).length;
          textSample = plain.slice(0, 8000);
          pageCount = wordCount > 100 ? Math.max(1, Math.round(wordCount / 200)) : 1;
        }

        // AI legitimacy score
        const aiResult = await validateDocContent(textSample, docType, title.trim());

        // Structural score — content-based, no file size
        const structuralScore = isDocx
          ? contentStructuralScore(wordCount, paraCount, headingCount, tableCount, docType)
          : Math.min(100, Math.max(10, (
              wordCount >= 15000 ? 100 : wordCount >= 8000 ? 90 : wordCount >= 4000 ? 80 :
              wordCount >= 2000  ? 65  : wordCount >= 800  ? 45 : wordCount >= 200  ? 25 : 10
            )));

        // Blend: structural (60%) + AI (40%)
        const depthScore = Math.min(100, Math.max(10, Math.round(structuralScore * 0.6 + aiResult.score * 0.4)));

        // Quality flag — based on depth score, not raw AI score
        const qualityFlag: 'green' | 'amber' | 'red' =
          depthScore >= 65 ? 'green' :
          depthScore >= 40 ? 'amber' : 'red';

        // Upload file to storage
        const appId = Deno.env.get('BASE44_APP_ID') ?? '';
        const serviceToken = Deno.env.get('BASE44_SERVICE_TOKEN') ?? '';
        const uploadForm = new FormData();
        uploadForm.append('file', new Blob([arrayBuf], { type: file.type }), file.name);
        const uploadRes = await fetch(`https://base44.app/api/apps/${appId}/integration-endpoints/Core/UploadFile`, { method: 'POST', headers: { 'Authorization': `Bearer ${serviceToken}` }, body: uploadForm });
        const uploadJson = uploadRes.ok ? await uploadRes.json().catch(() => ({})) : {};
        const fileUrl: string | null = uploadJson?.file_url ?? uploadJson?.url ?? null;

        record = await base44.asServiceRole.entities.TrainingDoc.create({
          group_id: groupId, title: title.trim(), description: desc.trim() || null,
          doc_type: docType, source_type: sourceType || 'upload',
          file_url: fileUrl, file_name: file.name, file_size_bytes: file.size,
          mime_type: file.type,
          page_count: pageCount,
          word_count: wordCount,
          depth_score: depthScore,
          uploaded_by: uploadedBy, uploaded_by_username: uploadedByUsername,
          last_reviewed_at: new Date().toISOString(),
          is_current: true,
          ai_summary: aiResult.reason,
          ai_score: aiResult.score,
          quality_flag: qualityFlag,
        });

      } else {
        // URL-based link
        const body = await req.json().catch(() => ({}));
        const { group_id, title, doc_type, description, source_url, uploaded_by, uploaded_by_username } = body;
        if (!group_id) return Response.json({ error: 'group_id required' }, { status: 400 });
        if (!title?.trim()) return Response.json({ error: 'Title required' }, { status: 400 });
        if (!source_url?.trim()) return Response.json({ error: 'URL required' }, { status: 400 });

        if (caller.role !== 'admin' && caller.role !== 'mod') {
          const roster = await base44.asServiceRole.entities.MilsimRoster.filter({ group_id, user_id: caller.id });
          if (!roster || roster.length === 0) {
            const grp = await base44.asServiceRole.entities.MilsimGroup.get(group_id);
            if (!grp || grp.owner_id !== caller.id) return Response.json({ error: 'Not authorised' }, { status: 403 });
          }
        }

        record = await base44.asServiceRole.entities.TrainingDoc.create({
          group_id, title: title.trim(), description: description?.trim() || null,
          doc_type: doc_type ?? 'Other', source_type: 'link', source_url: source_url.trim(),
          file_url: null, is_current: true, depth_score: 25,
          uploaded_by: uploaded_by ?? caller.id,
          uploaded_by_username: uploaded_by_username ?? caller.username ?? caller.email,
          last_reviewed_at: new Date().toISOString(),
        });
      }

      return Response.json(record, { status: 201 });
    }

    // ── GET /:groupId ──────────────────────────────────────────────────────────
    if (method === 'GET' && parts.length === 1) {
      const docs = await base44.asServiceRole.entities.TrainingDoc.filter({ group_id: parts[0] });
      return Response.json((docs ?? []).sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
    }

    // ── PATCH /:groupId/:docId ─────────────────────────────────────────────────
    if (method === 'PATCH' && parts.length === 2) {
      const caller = await getCallerUser(base44, req);
      if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const body = await req.json().catch(() => ({}));
      const allowed = ['description', 'title', 'doc_type', 'is_current', 'source_url'];
      const update: any = {};
      for (const k of allowed) { if (body[k] !== undefined) update[k] = body[k]; }
      if (body.mark_reviewed === true) update.last_reviewed_at = new Date().toISOString();
      return Response.json(await base44.asServiceRole.entities.TrainingDoc.update(parts[1], update));
    }

    // ── DELETE /:groupId/:docId ────────────────────────────────────────────────
    if (method === 'DELETE' && parts.length === 2) {
      const caller = await getCallerUser(base44, req);
      if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      await base44.asServiceRole.entities.TrainingDoc.delete(parts[1]);
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[trainingDocs]', error);
    return Response.json({ error: error?.message ?? 'Unknown error' }, { status: 500 });
  }
});
