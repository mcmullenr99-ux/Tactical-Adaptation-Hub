import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET    = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';

// ─── ANTI-GAMING CONSTANTS ────────────────────────────────────────────────────
const AI_LEGITIMACY_THRESHOLD = 40;   // docs scoring below this are rejected as gibberish/spam
const MIN_CONTENT_CHARS       = 80;   // raw text must have at least this many non-whitespace chars

async function getCallerUser(base44: any, req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    return await base44.asServiceRole.entities.User.get(payload.sub) ?? null;
  } catch { return null; }
}

// ─── DEPTH SCORE (structural heuristic — used alongside AI check) ─────────────
function estimateDepthScore(pageCount: number, fileSizeBytes: number, docType: string): number {
  const pageFactor =
    pageCount >= 15 ? 1.0 :
    pageCount >= 8  ? 0.8 :
    pageCount >= 4  ? 0.6 :
    pageCount >= 2  ? 0.4 : 0.2;

  const bpp = pageCount > 0 ? fileSizeBytes / pageCount : fileSizeBytes;
  const densityFactor =
    bpp >= 150_000 ? 1.0 :
    bpp >= 80_000  ? 0.85 :
    bpp >= 40_000  ? 0.7  :
    bpp >= 15_000  ? 0.55 : 0.4;

  const typeBonus =
    docType === 'SOP'                 ? 10 :
    docType === 'TTP'                 ? 10 :
    docType === 'Field Manual'        ? 9  :
    docType === 'OPORD'               ? 8  :
    docType === 'WARNO'               ? 7  :
    docType === 'FRAGO'               ? 7  :
    docType === 'Rules of Engagement' ? 8  :
    docType === 'Drill'               ? 6  : 0;

  const raw = Math.round(pageFactor * 45 + densityFactor * 45 + typeBonus);
  return Math.min(100, Math.max(10, raw));
}

// ─── TEXT EXTRACTION ──────────────────────────────────────────────────────────
// Pulls readable text out of PDF byte streams and plain text files.
// Returns up to 1500 chars — enough for AI validation without burning tokens.
async function extractTextSample(arrayBuf: ArrayBuffer, mimeType: string, fileName: string): Promise<string> {
  try {
    // Plain text / markdown
    if (mimeType === 'text/plain' || mimeType === 'text/markdown' || fileName.endsWith('.md') || fileName.endsWith('.txt')) {
      return new TextDecoder('utf-8', { fatal: false }).decode(arrayBuf).replace(/\s+/g, ' ').trim().slice(0, 1500);
    }

    // PDF
    if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const raw = new TextDecoder('latin1', { fatal: false }).decode(arrayBuf);
      const chunks: string[] = [];

      // Helper: try to decompress a byte array with a given algorithm
      async function tryDeflate(bytes: Uint8Array, algo: string): Promise<string | null> {
        try {
          const ds = new DecompressionStream(algo as any);
          const writer = ds.writable.getWriter();
          const reader = ds.readable.getReader();
          // Write + close in background, don't await yet
          void writer.write(bytes).then(() => writer.close()).catch(() => {});
          const parts: Uint8Array[] = [];
          // eslint-disable-next-line no-constant-condition
          while (true) {
            let result: ReadableStreamReadResult<Uint8Array>;
            try { result = await reader.read(); } catch { break; }
            if (result.done) break;
            parts.push(result.value);
          }
          if (parts.length === 0) return null;
          const total = parts.reduce((s, p) => s + p.length, 0);
          const merged = new Uint8Array(total);
          let off = 0;
          for (const p of parts) { merged.set(p, off); off += p.length; }
          return new TextDecoder('latin1', { fatal: false }).decode(merged);
        } catch { return null; }
      }

      // Extract text tokens from a decompressed PDF text stream
      function extractTokens(text: string): string[] {
        const result: string[] = [];
        const btRegex = /BT[\s\S]*?ET/g;
        let bm: RegExpExecArray | null;
        while ((bm = btRegex.exec(text)) !== null) {
          const strRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)|<([0-9A-Fa-f\s]+)>/g;
          let tm: RegExpExecArray | null;
          while ((tm = strRegex.exec(bm[0])) !== null) {
            if (tm[1]) {
              const u = tm[1].replace(/\\n/g, ' ').replace(/\\r/g, ' ').replace(/\\t/g, ' ')
                .replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\\\/g, '\\')
                .replace(/\\[0-7]{1,3}/g, ' ');
              if (u.trim()) result.push(u);
            } else if (tm[2]) {
              const hex = tm[2].replace(/\s/g, '');
              let dec = '';
              for (let i = 0; i < hex.length - 1; i += 2) {
                const c = parseInt(hex.slice(i, i + 2), 16);
                if (c >= 32 && c < 127) dec += String.fromCharCode(c);
              }
              if (dec.trim()) result.push(dec);
            }
          }
        }
        // If no BT/ET tokens, try raw printable words
        if (result.length === 0) {
          const words = text.replace(/[^\x20-\x7E\n]/g, ' ').split(/\s+/).filter(w => w.length >= 3 && /[a-zA-Z]{2,}/.test(w));
          result.push(...words.slice(0, 200));
        }
        return result;
      }

      // Scan each PDF stream object and try to decompress it
      const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
      let sm: RegExpExecArray | null;
      while ((sm = streamRegex.exec(raw)) !== null) {
        const streamRaw = sm[1];
        const streamBytes = new Uint8Array(streamRaw.length);
        for (let i = 0; i < streamRaw.length; i++) streamBytes[i] = streamRaw.charCodeAt(i) & 0xff;

        // Try deflate-raw (most fpdf2/reportlab), then deflate (zlib wrapper)
        const decompressed = await tryDeflate(streamBytes, 'deflate-raw') ?? await tryDeflate(streamBytes, 'deflate');
        if (decompressed) {
          chunks.push(...extractTokens(decompressed));
        }
        if (chunks.join(' ').length > 1000) break;
      }

      const combined = chunks.join(' ').replace(/\s+/g, ' ').trim();
      if (combined.length > 60) return combined.slice(0, 1500);

      // Fallback: uncompressed BT/ET scan
      const btRegex = /BT[\s\S]*?ET/g;
      let match: RegExpExecArray | null;
      while ((match = btRegex.exec(raw)) !== null && chunks.join(' ').length < 2000) {
        const strRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)|<([0-9A-Fa-f\s]+)>/g;
        let fm: RegExpExecArray | null;
        while ((fm = strRegex.exec(match[0])) !== null) {
          if (fm[1]) chunks.push(fm[1].replace(/\\n/g, ' ').replace(/\\r/g, ' ').replace(/\\t/g, ' ').replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\\\/g, '\\').replace(/\\[0-7]{1,3}/g, ' '));
          else if (fm[2]) { const hex = fm[2].replace(/\s/g, ''); let d = ''; for (let i = 0; i < hex.length-1; i+=2) { const c=parseInt(hex.slice(i,i+2),16); if(c>=32&&c<127) d+=String.fromCharCode(c); } if(d.trim()) chunks.push(d); }
        }
      }
      const combined2 = chunks.join(' ').replace(/\s+/g, ' ').trim();
      if (combined2.length > 60) return combined2.slice(0, 1500);

      // Last resort: raw ASCII scan of entire file
      const printable = raw.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
      const words = printable.split(' ').filter(w => w.length >= 3 && /[a-zA-Z]{2,}/.test(w));
      return words.slice(0, 400).join(' ').slice(0, 1500);
    }

    // DOCX
    if (mimeType.includes('wordprocessingml') || mimeType.includes('msword') || fileName.endsWith('.docx')) {
      const raw = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuf);
      const words = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').split(' ').filter(w => /[a-zA-Z]{3,}/.test(w));
      return words.slice(0, 400).join(' ').slice(0, 1500);
    }

    return '';
  } catch { return ''; }
}

async function validateDocContent(
  textSample: string,
  docType: string,
  title: string
): Promise<{ score: number; reason: string; passed: boolean }> {
  if (!OPENAI_API_KEY) {
    // No key configured — pass through (fail open)
    return { score: 75, reason: 'AI validation not configured', passed: true };
  }

  const nonWhitespace = textSample.replace(/\s/g, '');
  if (nonWhitespace.length < MIN_CONTENT_CHARS) {
    // Not enough extractable text to validate — could be image-only PDF
    // Give benefit of the doubt but flag as low depth
    return { score: 45, reason: 'Insufficient extractable text — document may be image-based', passed: true };
  }

  // Check for obvious gibberish before even calling AI — saves tokens
  // Repetition ratio: if >40% of chars are the same character, it's garbage
  const charFreq: Record<string, number> = {};
  for (const c of nonWhitespace) charFreq[c] = (charFreq[c] ?? 0) + 1;
  const maxFreq = Math.max(...Object.values(charFreq));
  const repetitionRatio = maxFreq / nonWhitespace.length;
  if (repetitionRatio > 0.4) {
    return {
      score: 0,
      reason: `Document content is repetitive garbage (${Math.round(repetitionRatio * 100)}% single character). This is not valid doctrine.`,
      passed: false,
    };
  }

  // Check unique word ratio — lorem ipsum / random strings fail this
  const words = textSample.toLowerCase().match(/[a-z]{3,}/g) ?? [];
  if (words.length > 0) {
    const uniqueRatio = new Set(words).size / words.length;
    if (words.length > 30 && uniqueRatio < 0.15) {
      return {
        score: 5,
        reason: 'Document contains highly repetitive text with very few unique words. This is not valid doctrine.',
        passed: false,
      };
    }
  }

  try {
    const prompt = `You are a military document validator for a milsim (military simulation) group management platform.

Your job is to determine whether the following document excerpt represents LEGITIMATE military doctrine — i.e. actual standard operating procedures, tactics, drills, rules of engagement, field manuals, briefings, or similar military/milsim training material.

Document title: "${title}"
Document type claimed: "${docType}"
Extracted text sample:
---
${textSample.slice(0, 800)}
---

Rate this document on a scale of 0–100 for DOCTRINE LEGITIMACY:
- 0–20: Complete garbage, gibberish, random characters, lorem ipsum, copy-pasted nonsense, or clearly fake
- 21–40: Very thin, barely relevant, padding, or a single sentence/paragraph with no real procedural content
- 41–60: Some relevant content but shallow, incomplete, or only loosely related to military procedures
- 61–80: Solid doctrine — clear procedures, tactics, or standards relevant to the claimed doc type
- 81–100: Excellent — comprehensive, detailed, professionally structured military/milsim doctrine

Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{"score": <number 0-100>, "reason": "<one sentence explanation>"}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 120,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      console.error('[trainingDocs/AI] OpenAI error', res.status, await res.text());
      // Fail open — don't block upload if AI is down
      return { score: 70, reason: 'AI validation service unavailable', passed: true };
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content?.trim() ?? '';

    // Strip markdown code fences if present
    const cleaned = content.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/,'').trim();
    const parsed = JSON.parse(cleaned);
    const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
    const reason = String(parsed.reason || 'No reason provided');

    return {
      score,
      reason,
      passed: score >= AI_LEGITIMACY_THRESHOLD,
    };
  } catch (err) {
    console.error('[trainingDocs/AI] Validation error:', err);
    // Fail open
    return { score: 70, reason: 'AI validation error — proceeding', passed: true };
  }
}

// ─── SIMPLE HASH for dedup ────────────────────────────────────────────────────
function simpleHash(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let h = 0x811c9dc5;
  for (const b of bytes) { h ^= b; h = (h * 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const rawPath = pathOverride ?? url.pathname.replace(/^\/functions\/trainingDocs/, '');
    const parts = rawPath.split('/').filter(Boolean);
    const method = req.method;

    // POST /upload — file upload OR URL-based link
    if (method === 'POST' && parts[0] === 'upload') {
      const caller = await getCallerUser(base44, req);
      if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const contentType = req.headers.get('content-type') ?? '';
      let record: any;

      if (contentType.includes('multipart/form-data')) {
        // ── FILE UPLOAD ──────────────────────────────────────────────────────
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const groupId            = formData.get('group_id') as string ?? '';
        const title              = formData.get('title') as string ?? '';
        const docType            = formData.get('doc_type') as string ?? 'Other';
        const desc               = formData.get('description') as string ?? '';
        const uploadedBy         = formData.get('uploaded_by') as string ?? caller.id;
        const uploadedByUsername = formData.get('uploaded_by_username') as string ?? caller.username ?? caller.email;
        const sourceType         = formData.get('source_type') as string ?? 'upload';
        // NOTE: last_reviewed_at is intentionally NOT accepted from client on upload — set server-side only

        if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });
        if (!groupId) return Response.json({ error: 'group_id required' }, { status: 400 });
        if (!title.trim()) return Response.json({ error: 'Title required' }, { status: 400 });

        // Auth: admin/mod OR roster member/owner
        if (caller.role !== 'admin' && caller.role !== 'mod') {
          const roster = await base44.asServiceRole.entities.MilsimRoster.filter({ group_id: groupId, user_id: caller.id });
          if (!roster || roster.length === 0) {
            const grp = await base44.asServiceRole.entities.MilsimGroup.get(groupId);
            if (!grp || grp.owner_id !== caller.id) return Response.json({ error: 'Not authorised' }, { status: 403 });
          }
        }

        const ALLOWED_TYPES = [
          'application/pdf', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain', 'text/markdown', 'application/vnd.apple.pages',
          'application/octet-stream',
        ];
        const isPages = file.name.endsWith('.pages');
        if (!ALLOWED_TYPES.includes(file.type) && !isPages) {
          return Response.json({ error: 'Unsupported file type' }, { status: 400 });
        }
        if (file.size > 20 * 1024 * 1024) return Response.json({ error: 'File too large (max 20MB)' }, { status: 400 });

        const arrayBuf = await file.arrayBuffer();

        // ── FIX 5: DUPLICATE DETECTION ──────────────────────────────────────
        const fileHash = simpleHash(arrayBuf);
        const existingDocs = await base44.asServiceRole.entities.TrainingDoc.filter({ group_id: groupId });
        const isDuplicate = (existingDocs ?? []).some((d: any) =>
          d.file_size_bytes === file.size && d.file_name === file.name
        );
        if (isDuplicate) {
          return Response.json({
            error: 'Duplicate document detected. A file with the same name and size already exists for this group. Rename or modify the document if this is genuinely a new version.',
          }, { status: 409 });
        }

        // ── FIX 1: AI CONTENT VALIDATION ────────────────────────────────────
        const textSample = await extractTextSample(arrayBuf, file.type, file.name);
        const aiResult = await validateDocContent(textSample, docType, title.trim());

        if (!aiResult.passed) {
          return Response.json({
            error: `Document failed content validation. ${aiResult.reason} Score: ${aiResult.score}/100 (minimum required: ${AI_LEGITIMACY_THRESHOLD}/100). Upload genuine doctrine — SOPs, TTPs, drills, field manuals, or operational orders.`,
            ai_score: aiResult.score,
            ai_reason: aiResult.reason,
          }, { status: 422 });
        }

        // Upload to storage
        const appId = Deno.env.get('BASE44_APP_ID') ?? '';
        const serviceToken = Deno.env.get('BASE44_SERVICE_TOKEN') ?? '';
        const uploadForm = new FormData();
        uploadForm.append('file', new Blob([arrayBuf], { type: file.type }), file.name);
        const uploadRes = await fetch(`https://api.base44.com/api/apps/${appId}/files/upload`, {
          method: 'POST', headers: { 'x-api-key': serviceToken }, body: uploadForm,
        });
        const uploadJson = uploadRes.ok ? await uploadRes.json().catch(() => ({})) : {};
        const fileUrl: string | null = uploadJson?.file_url ?? uploadJson?.url ?? null;

        const estimatedPages = file.type === 'application/pdf'
          ? Math.max(1, Math.round(file.size / 50_000))
          : file.type.includes('word') ? Math.max(1, Math.round(file.size / 30_000))
          : Math.max(1, Math.round(file.size / 3_000));

        // Blend structural depth score with AI legitimacy score
        const structuralScore = estimateDepthScore(estimatedPages, file.size, docType);
        // AI score is weighted 40%, structural 60% — AI penalises gibberish, structure rewards real docs
        const blendedDepthScore = Math.round((structuralScore * 0.6) + (aiResult.score * 0.4));
        const depthScore = Math.min(100, Math.max(10, blendedDepthScore));

        record = await base44.asServiceRole.entities.TrainingDoc.create({
          group_id: groupId, title: title.trim(), description: desc.trim() || null,
          doc_type: docType, source_type: sourceType || 'upload',
          file_url: fileUrl, file_name: file.name, file_size_bytes: file.size,
          mime_type: file.type, page_count: estimatedPages, depth_score: depthScore,
          uploaded_by: uploadedBy, uploaded_by_username: uploadedByUsername,
          last_reviewed_at: new Date().toISOString(), // FIX 4: always server-side
          is_current: true,
          ai_summary: aiResult.reason, // store AI verdict for audit trail
        });

      } else {
        // ── URL / LINK BASED (Google Doc, Apple Pages, Link) ─────────────────
        // FIX 3: Links do NOT count toward volume score — capped at 25 depth
        // and marked source_type='link' so stats engine can exclude from volPts
        const body = await req.json().catch(() => ({}));
        const { group_id, title, doc_type, description, source_type, source_url, uploaded_by, uploaded_by_username } = body;
        // NOTE: last_reviewed_at intentionally NOT accepted from client

        if (!group_id) return Response.json({ error: 'group_id required' }, { status: 400 });
        if (!title?.trim()) return Response.json({ error: 'Title required' }, { status: 400 });
        if (!source_url?.trim()) return Response.json({ error: 'URL required for linked documents' }, { status: 400 });

        if (caller.role !== 'admin' && caller.role !== 'mod') {
          const roster = await base44.asServiceRole.entities.MilsimRoster.filter({ group_id, user_id: caller.id });
          if (!roster || roster.length === 0) {
            const grp = await base44.asServiceRole.entities.MilsimGroup.get(group_id);
            if (!grp || grp.owner_id !== caller.id) return Response.json({ error: 'Not authorised' }, { status: 403 });
          }
        }

        record = await base44.asServiceRole.entities.TrainingDoc.create({
          group_id, title: title.trim(), description: description?.trim() || null,
          doc_type: doc_type ?? 'Other', source_type: 'link', // always 'link' — no spoofing
          source_url: source_url.trim(), file_url: null, is_current: true,
          depth_score: 25, // FIX 3: links get 25 max, NOT 40 — can't verify content
          uploaded_by: uploaded_by ?? caller.id,
          uploaded_by_username: uploaded_by_username ?? caller.username ?? caller.email,
          last_reviewed_at: new Date().toISOString(), // FIX 4: server-side only
        });
      }

      return Response.json(record, { status: 201 });
    }

    // GET /:groupId — list docs
    if (method === 'GET' && parts.length === 1) {
      const docs = await base44.asServiceRole.entities.TrainingDoc.filter({ group_id: parts[0] });
      return Response.json((docs ?? []).sort((a: any, b: any) =>
        new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
      ));
    }

    // PATCH /:groupId/:docId — mark reviewed (server stamps the date) or update metadata
    if (method === 'PATCH' && parts.length === 2) {
      const caller = await getCallerUser(base44, req);
      if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const [, docId] = parts;
      const body = await req.json().catch(() => ({}));

      // FIX 4: last_reviewed_at is NEVER accepted from client — always server-stamped
      // Allowed editable fields: description, title, doc_type, is_current, source_url
      const allowed = ['description', 'title', 'doc_type', 'is_current', 'source_url'];
      const update: any = {};
      for (const k of allowed) { if (body[k] !== undefined) update[k] = body[k]; }

      // If the client requested a review (e.g. "mark as reviewed" button), stamp now
      if (body.mark_reviewed === true) {
        update.last_reviewed_at = new Date().toISOString();
      }

      return Response.json(await base44.asServiceRole.entities.TrainingDoc.update(docId, update));
    }

    // DELETE /:groupId/:docId
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
