import { Router, type IRouter } from "express";
import { db, pool } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();
const adminGuard = [requireAuth, requireRole("staff", "moderator", "admin")];

// ── List posts ─────────────────────────────────────────────────────────────────
// GET /api/posts?category=&milsim_group_id=&limit=&offset=

router.get("/posts", async (req, res): Promise<void> => {
  const { category, milsim_group_id, limit = "20", offset = "0" } = req.query as Record<string, string>;
  const viewerId: number | null = (req as any).user?.id ?? null;
  const lim = Math.min(parseInt(limit, 10) || 20, 50);
  const off = parseInt(offset, 10) || 0;

  // Build WHERE clauses dynamically to avoid drizzle null-param issues
  const whereClauses: string[] = [];
  const filterParams: any[] = [];
  let pIdx = 1;

  if (category) { whereClauses.push(`p.category = $${pIdx++}`); filterParams.push(category); }
  if (milsim_group_id) { whereClauses.push(`p.milsim_group_id = $${pIdx++}`); filterParams.push(parseInt(milsim_group_id, 10)); }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // Viewer id param comes after filter params
  const viewerIdx = pIdx++;
  const postsSQL = `
    SELECT p.*,
      CASE WHEN pr.user_id IS NOT NULL THEN true ELSE false END AS viewer_reacted
    FROM posts p
    LEFT JOIN post_reactions pr ON pr.post_id = p.id AND pr.user_id = $${viewerIdx}
    ${whereSQL}
    ORDER BY p.pinned DESC, p.created_at DESC
    LIMIT $${pIdx} OFFSET $${pIdx + 1}
  `;
  const postsParams = [...filterParams, viewerId, lim, off];

  // Count query
  const countClauses: string[] = [];
  const countParams: any[] = [];
  let cIdx = 1;
  if (category) { countClauses.push(`category = $${cIdx++}`); countParams.push(category); }
  if (milsim_group_id) { countClauses.push(`milsim_group_id = $${cIdx++}`); countParams.push(parseInt(milsim_group_id, 10)); }
  const countWhere = countClauses.length > 0 ? `WHERE ${countClauses.join(" AND ")}` : "";
  const countSQL = `SELECT COUNT(*) AS total FROM posts ${countWhere}`;

  const [pRes, cRes] = await Promise.all([
    pool.query(postsSQL, postsParams),
    pool.query(countSQL, countParams),
  ]);

  res.json({ posts: pRes.rows, total: parseInt(cRes.rows[0].total, 10) });
});

// ── Get single post with comments ──────────────────────────────────────────────

router.get("/posts/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  const postResult = await db.execute(sql`
    SELECT p.*,
      CASE WHEN pr.user_id IS NOT NULL THEN true ELSE false END AS viewer_reacted
    FROM posts p
    LEFT JOIN post_reactions pr ON pr.post_id = p.id AND pr.user_id = ${(req as any).user?.id ?? null}
    WHERE p.id = ${id}
  `);
  if (!postResult.rows[0]) { res.status(404).json({ error: "Post not found." }); return; }

  const commentsResult = await db.execute(sql`
    SELECT * FROM post_comments WHERE post_id = ${id} ORDER BY created_at ASC
  `);

  res.json({ post: postResult.rows[0], comments: commentsResult.rows });
});

// ── Create post ────────────────────────────────────────────────────────────────

router.post("/posts", requireAuth, async (req, res): Promise<void> => {
  const actor = (req as any).user;
  const { title, content, category, milsim_group_id, image_url } = req.body as Record<string, any>;

  if (!title?.trim() || !content?.trim()) {
    res.status(400).json({ error: "Title and content are required." });
    return;
  }

  const validCategories = ["gaming", "unit", "recruitment", "general"];
  const cat = validCategories.includes(category) ? category : "general";

  // If attaching to a milsim group, verify they belong to it
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

  const result = await db.execute(sql`
    INSERT INTO posts (user_id, username, milsim_group_id, milsim_group_name, category, title, content, image_url)
    VALUES (${actor.id}, ${actor.username}, ${groupId}, ${groupName}, ${cat}, ${title.trim()}, ${content.trim()}, ${image_url ?? null})
    RETURNING *
  `);

  res.status(201).json(result.rows[0]);
});

// ── Edit post (own or admin) ───────────────────────────────────────────────────

router.patch("/posts/:id", requireAuth, async (req, res): Promise<void> => {
  const actor = (req as any).user;
  const id = parseInt(req.params.id, 10);
  const { title, content, category, image_url } = req.body as Record<string, any>;

  const existing = await db.execute(sql`SELECT * FROM posts WHERE id = ${id}`);
  const post = existing.rows[0] as any;
  if (!post) { res.status(404).json({ error: "Not found." }); return; }
  if (post.user_id !== actor.id && !["moderator", "admin"].includes(actor.role)) {
    res.status(403).json({ error: "Not authorised." }); return;
  }

  const validCategories = ["gaming", "unit", "recruitment", "general"];
  const cat = validCategories.includes(category) ? category : post.category;

  const updated = await db.execute(sql`
    UPDATE posts SET
      title = ${title?.trim() ?? post.title},
      content = ${content?.trim() ?? post.content},
      category = ${cat},
      image_url = ${image_url !== undefined ? (image_url || null) : post.image_url},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `);

  res.json(updated.rows[0]);
});

// ── Delete post (own or admin) ─────────────────────────────────────────────────

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

// ── Pin / unpin post (staff+) ──────────────────────────────────────────────────

router.post("/posts/:id/pin", ...adminGuard, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const result = await db.execute(sql`
    UPDATE posts SET pinned = NOT pinned WHERE id = ${id} RETURNING pinned
  `);
  res.json({ pinned: (result.rows[0] as any)?.pinned ?? false });
});

// ── Toggle reaction ────────────────────────────────────────────────────────────

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

// ── Add comment ────────────────────────────────────────────────────────────────

router.post("/posts/:id/comments", requireAuth, async (req, res): Promise<void> => {
  const actor = (req as any).user;
  const id = parseInt(req.params.id, 10);
  const { content } = req.body as { content: string };

  if (!content?.trim()) { res.status(400).json({ error: "Comment cannot be empty." }); return; }
  if (content.length > 2000) { res.status(400).json({ error: "Comment too long." }); return; }

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

// ── Delete comment (own or admin) ─────────────────────────────────────────────

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
