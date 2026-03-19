import { Router, type IRouter } from "express";
import { db, pool } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { moderateText, moderateImage } from "../lib/moderation";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const adminGuard = [requireAuth, requireRole("staff", "moderator", "admin")];
const storageService = new ObjectStorageService();

// ── List posts ─────────────────────────────────────────────────────────────────

router.get("/posts", async (req, res): Promise<void> => {
  const { category, milsim_group_id, limit = "20", offset = "0" } = req.query as Record<string, string>;
  const viewerId: number | null = (req as any).user?.id ?? null;
  const lim = Math.min(parseInt(limit, 10) || 20, 50);
  const off = parseInt(offset, 10) || 0;

  const whereClauses: string[] = [];
  const filterParams: any[] = [];
  let pIdx = 1;

  if (category) { whereClauses.push(`p.category = $${pIdx++}`); filterParams.push(category); }
  if (milsim_group_id) { whereClauses.push(`p.milsim_group_id = $${pIdx++}`); filterParams.push(parseInt(milsim_group_id, 10)); }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const viewerIdx = pIdx++;
  const postsSQL = `
    SELECT p.*,
      CASE WHEN pr.user_id IS NOT NULL THEN true ELSE false END AS viewer_reacted,
      u.nationality AS user_nationality
    FROM posts p
    LEFT JOIN post_reactions pr ON pr.post_id = p.id AND pr.user_id = $${viewerIdx}
    LEFT JOIN users u ON u.id = p.user_id
    ${whereSQL}
    ORDER BY p.pinned DESC, p.created_at DESC
    LIMIT $${pIdx} OFFSET $${pIdx + 1}
  `;
  const postsParams = [...filterParams, viewerId, lim, off];

  const countClauses: string[] = [];
  const countParams: any[] = [];
  let cIdx = 1;
  if (category) { countClauses.push(`category = $${cIdx++}`); countParams.push(category); }
  if (milsim_group_id) { countClauses.push(`milsim_group_id = $${cIdx++}`); countParams.push(parseInt(milsim_group_id, 10)); }
  const countWhere = countClauses.length > 0 ? `WHERE ${countClauses.join(" AND ")}` : "";

  const [pRes, cRes] = await Promise.all([
    pool.query(postsSQL, postsParams),
    pool.query(`SELECT COUNT(*) AS total FROM posts ${countWhere}`, countParams),
  ]);

  res.json({ posts: pRes.rows, total: parseInt(cRes.rows[0].total, 10) });
});

// ── Get single post with comments ──────────────────────────────────────────────

router.get("/posts/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const viewerId = (req as any).user?.id ?? null;

  const postResult = await pool.query(`
    SELECT p.*,
      CASE WHEN pr.user_id IS NOT NULL THEN true ELSE false END AS viewer_reacted,
      u.nationality AS user_nationality
    FROM posts p
    LEFT JOIN post_reactions pr ON pr.post_id = p.id AND pr.user_id = $1
    LEFT JOIN users u ON u.id = p.user_id
    WHERE p.id = $2
  `, [viewerId, id]);
  if (!postResult.rows[0]) { res.status(404).json({ error: "Post not found." }); return; }

  const commentsResult = await pool.query(`
    SELECT pc.*, u.nationality AS user_nationality
    FROM post_comments pc
    LEFT JOIN users u ON u.id = pc.user_id
    WHERE pc.post_id = $1 ORDER BY pc.created_at ASC
  `, [id]);

  res.json({ post: postResult.rows[0], comments: commentsResult.rows });
});

// ── Create post (with moderation) ─────────────────────────────────────────────

router.post("/posts", requireAuth, async (req, res): Promise<void> => {
  const actor = (req as any).user;
  const { title, content, category, milsim_group_id, mediaPath } = req.body as Record<string, any>;

  if (!title?.trim() || !content?.trim()) {
    res.status(400).json({ error: "Title and content are required." });
    return;
  }

  // ── Text moderation ──────────────────────────────────────────────────────
  const textCheck = await moderateText(`${title}\n\n${content}`);
  if (textCheck.flagged) {
    res.status(422).json({
      error: "Post blocked by content moderation.",
      reason: textCheck.reason,
      categories: textCheck.categories,
      moderation: true,
    });
    return;
  }

  // ── Image/media moderation ───────────────────────────────────────────────
  let mediaBase64: string | null = null;
  if (mediaPath) {
    try {
      const file = await storageService.getObjectEntityFile(mediaPath);
      const [fileContents] = await file.download();
      const contentType = (await file.getMetadata())[0].contentType ?? "image/jpeg";

      // Only scan images (skip video — frame extraction not supported)
      if (contentType.startsWith("image/")) {
        mediaBase64 = `data:${contentType};base64,${fileContents.toString("base64")}`;
        const imageCheck = await moderateImage(mediaBase64);
        if (imageCheck.flagged) {
          // Delete the uploaded file from storage
          try { await file.delete(); } catch {}
          res.status(422).json({
            error: "Image blocked by content moderation.",
            reason: imageCheck.reason,
            categories: imageCheck.categories,
            moderation: true,
          });
          return;
        }
      }
    } catch (err) {
      console.error("Media moderation fetch error:", err);
      // If we can't read the file, reject to be safe
      res.status(422).json({ error: "Could not process uploaded media. Please try again." });
      return;
    }
  }

  // ── All clear — create the post ──────────────────────────────────────────
  const validCategories = ["gaming", "unit", "recruitment", "general"];
  const cat = validCategories.includes(category) ? category : "general";

  let groupName: string | null = null;
  let groupId: number | null = null;
  if (milsim_group_id) {
    const groupResult = await db.execute(sql`
      SELECT mg.id, mg.name FROM milsim_group_members mgm
      JOIN milsim_groups mg ON mg.id = mgm.milsim_group_id
      WHERE mgm.user_id = ${actor.id} AND mgm.milsim_group_id = ${milsim_group_id}
      LIMIT 1
    `);
    if (groupResult.rows[0]) {
      groupId = (groupResult.rows[0] as any).id;
      groupName = (groupResult.rows[0] as any).name;
    }
  }

  // Construct the serving URL from objectPath
  const mediaUrl = mediaPath ? `/api/storage${mediaPath}` : null;

  const result = await db.execute(sql`
    INSERT INTO posts (user_id, username, milsim_group_id, milsim_group_name, category, title, content, image_url)
    VALUES (${actor.id}, ${actor.username}, ${groupId}, ${groupName}, ${cat}, ${title.trim()}, ${content.trim()}, ${mediaUrl})
    RETURNING *
  `);

  res.status(201).json(result.rows[0]);
});

// ── Edit post ─────────────────────────────────────────────────────────────────

router.patch("/posts/:id", requireAuth, async (req, res): Promise<void> => {
  const actor = (req as any).user;
  const id = parseInt(req.params.id, 10);
  const { title, content, category } = req.body as Record<string, any>;

  const existing = await db.execute(sql`SELECT * FROM posts WHERE id = ${id}`);
  const post = existing.rows[0] as any;
  if (!post) { res.status(404).json({ error: "Not found." }); return; }
  if (post.user_id !== actor.id && !["moderator", "admin"].includes(actor.role)) {
    res.status(403).json({ error: "Not authorised." }); return;
  }

  if (title || content) {
    const textCheck = await moderateText(`${title ?? post.title}\n\n${content ?? post.content}`);
    if (textCheck.flagged) {
      res.status(422).json({ error: "Edit blocked by content moderation.", reason: textCheck.reason, moderation: true });
      return;
    }
  }

  const validCategories = ["gaming", "unit", "recruitment", "general"];
  const cat = validCategories.includes(category) ? category : post.category;

  const updated = await db.execute(sql`
    UPDATE posts SET
      title = ${title?.trim() ?? post.title},
      content = ${content?.trim() ?? post.content},
      category = ${cat},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `);

  res.json(updated.rows[0]);
});

// ── Delete post ───────────────────────────────────────────────────────────────

router.delete("/posts/:id", requireAuth, async (req, res): Promise<void> => {
  const actor = (req as any).user;
  const id = parseInt(req.params.id, 10);

  const existing = await db.execute(sql`SELECT user_id FROM posts WHERE id = ${id}`);
  if (!existing.rows[0]) { res.status(404).json({ error: "Not found." }); return; }
  if ((existing.rows[0] as any).user_id !== actor.id && !["moderator", "admin"].includes(actor.role)) {
    res.status(403).json({ error: "Not authorised." }); return;
  }

  await db.execute(sql`DELETE FROM posts WHERE id = ${id}`);
  res.json({ ok: true });
});

// ── Pin / unpin ───────────────────────────────────────────────────────────────

router.post("/posts/:id/pin", ...adminGuard, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const result = await db.execute(sql`
    UPDATE posts SET pinned = NOT pinned WHERE id = ${id} RETURNING pinned
  `);
  res.json({ pinned: (result.rows[0] as any)?.pinned ?? false });
});

// ── Toggle reaction ───────────────────────────────────────────────────────────

router.post("/posts/:id/react", requireAuth, async (req, res): Promise<void> => {
  const actor = (req as any).user;
  const id = parseInt(req.params.id, 10);

  const existing = await db.execute(sql`
    SELECT id FROM post_reactions WHERE post_id = ${id} AND user_id = ${actor.id}
  `);

  if (existing.rows.length > 0) {
    await db.execute(sql`DELETE FROM post_reactions WHERE post_id = ${id} AND user_id = ${actor.id}`);
    await db.execute(sql`UPDATE posts SET reaction_count = GREATEST(0, reaction_count - 1) WHERE id = ${id}`);
    res.json({ reacted: false });
  } else {
    await db.execute(sql`INSERT INTO post_reactions (post_id, user_id) VALUES (${id}, ${actor.id})`);
    await db.execute(sql`UPDATE posts SET reaction_count = reaction_count + 1 WHERE id = ${id}`);
    res.json({ reacted: true });
  }
});

// ── Add comment (with text moderation) ───────────────────────────────────────

router.post("/posts/:id/comments", requireAuth, async (req, res): Promise<void> => {
  const actor = (req as any).user;
  const id = parseInt(req.params.id, 10);
  const { content } = req.body as { content: string };

  if (!content?.trim()) { res.status(400).json({ error: "Comment cannot be empty." }); return; }
  if (content.length > 2000) { res.status(400).json({ error: "Comment too long." }); return; }

  const textCheck = await moderateText(content);
  if (textCheck.flagged) {
    res.status(422).json({ error: "Comment blocked by content moderation.", reason: textCheck.reason, moderation: true });
    return;
  }

  const postCheck = await db.execute(sql`SELECT id FROM posts WHERE id = ${id}`);
  if (!postCheck.rows[0]) { res.status(404).json({ error: "Post not found." }); return; }

  const result = await db.execute(sql`
    INSERT INTO post_comments (post_id, user_id, username, content)
    VALUES (${id}, ${actor.id}, ${actor.username}, ${content.trim()})
    RETURNING *
  `);

  await db.execute(sql`UPDATE posts SET comment_count = comment_count + 1 WHERE id = ${id}`);
  res.status(201).json(result.rows[0]);
});

// ── Delete comment ────────────────────────────────────────────────────────────

router.delete("/posts/:postId/comments/:commentId", requireAuth, async (req, res): Promise<void> => {
  const actor = (req as any).user;
  const postId = parseInt(req.params.postId, 10);
  const commentId = parseInt(req.params.commentId, 10);

  const existing = await db.execute(sql`SELECT user_id FROM post_comments WHERE id = ${commentId} AND post_id = ${postId}`);
  if (!existing.rows[0]) { res.status(404).json({ error: "Not found." }); return; }
  if ((existing.rows[0] as any).user_id !== actor.id && !["moderator", "admin"].includes(actor.role)) {
    res.status(403).json({ error: "Not authorised." }); return;
  }

  await db.execute(sql`DELETE FROM post_comments WHERE id = ${commentId}`);
  await db.execute(sql`UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = ${postId}`);
  res.json({ ok: true });
});

export default router;
