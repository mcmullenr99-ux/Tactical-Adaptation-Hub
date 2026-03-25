import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

async function getCallerUser(base44: any, req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    return await base44.asServiceRole.entities.User.get(payload.sub) ?? null;
  } catch { return null; }
}

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
    docType === 'Standard Operating Procedure'       ? 10 :
    docType === 'Tactics Techniques and Procedures'  ? 10 :
    docType === 'Field Manual'                        ? 8  :
    docType === 'Drill'                              ? 6  : 0;

  const raw = Math.round(pageFactor * 45 + densityFactor * 45 + typeBonus);
  return Math.min(100, Math.max(10, raw));
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
        const groupId   = formData.get('group_id') as string ?? '';
        const title     = formData.get('title') as string ?? '';
        const docType   = formData.get('doc_type') as string ?? 'Other';
        const desc      = formData.get('description') as string ?? '';
        const reviewedAt = formData.get('last_reviewed_at') as string ?? new Date().toISOString();
        const uploadedBy = formData.get('uploaded_by') as string ?? caller.id;
        const uploadedByUsername = formData.get('uploaded_by_username') as string ?? caller.username ?? caller.email;
        const sourceType = formData.get('source_type') as string ?? 'upload';

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

        const depthScore = estimateDepthScore(estimatedPages, file.size, docType);

        record = await base44.asServiceRole.entities.TrainingDoc.create({
          group_id: groupId, title: title.trim(), description: desc.trim() || null,
          doc_type: docType, source_type: sourceType || 'upload',
          file_url: fileUrl, file_name: file.name, file_size_bytes: file.size,
          mime_type: file.type, page_count: estimatedPages, depth_score: depthScore,
          uploaded_by: uploadedBy, uploaded_by_username: uploadedByUsername,
          last_reviewed_at: reviewedAt, is_current: true,
        });

      } else {
        // ── URL / LINK BASED (Google Doc, Apple Pages, Link) ─────────────────
        const body = await req.json().catch(() => ({}));
        const { group_id, title, doc_type, description, source_type, source_url, last_reviewed_at, uploaded_by, uploaded_by_username } = body;

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
          doc_type: doc_type ?? 'Other', source_type: source_type ?? 'link',
          source_url: source_url.trim(), file_url: null, is_current: true,
          depth_score: 40, // Default depth for linked docs
          uploaded_by: uploaded_by ?? caller.id,
          uploaded_by_username: uploaded_by_username ?? caller.username ?? caller.email,
          last_reviewed_at: last_reviewed_at ?? new Date().toISOString(),
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

    // PATCH /:groupId/:docId
    if (method === 'PATCH' && parts.length === 2) {
      const caller = await getCallerUser(base44, req);
      if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const [, docId] = parts;
      const body = await req.json().catch(() => ({}));
      const allowed = ['last_reviewed_at', 'description', 'title', 'doc_type', 'is_current', 'source_url'];
      const update: any = {};
      for (const k of allowed) { if (body[k] !== undefined) update[k] = body[k]; }
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
