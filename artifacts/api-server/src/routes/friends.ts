import { Router, type IRouter } from "express";
import { db, usersTable, friendshipsTable } from "@workspace/db";
import { eq, or, and, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

// Helper: get friendship record regardless of direction
async function getFriendship(userA: number, userB: number) {
  const [row] = await db
    .select()
    .from(friendshipsTable)
    .where(
      or(
        and(eq(friendshipsTable.requesterId, userA), eq(friendshipsTable.addresseeId, userB)),
        and(eq(friendshipsTable.requesterId, userB), eq(friendshipsTable.addresseeId, userA))
      )
    );
  return row ?? null;
}

// GET /api/friends — list accepted friends with their profile
router.get("/friends", requireAuth, async (req, res): Promise<void> => {
  const me = (req.session as any).userId as number;
  const rows = await db.execute(sql`
    SELECT
      f.id AS friendship_id,
      f.created_at AS friends_since,
      u.id, u.username, u.email, u.role, u.status, u.bio, u.discord_tag, u.created_at
    FROM friendships f
    JOIN users u ON (
      CASE WHEN f.requester_id = ${me} THEN f.addressee_id ELSE f.requester_id END = u.id
    )
    WHERE (f.requester_id = ${me} OR f.addressee_id = ${me})
      AND f.status = 'accepted'
    ORDER BY f.created_at DESC
  `);
  res.json(rows.rows);
});

// GET /api/friends/requests — pending incoming requests
router.get("/friends/requests", requireAuth, async (req, res): Promise<void> => {
  const me = (req.session as any).userId as number;
  const rows = await db.execute(sql`
    SELECT
      f.id AS friendship_id,
      f.created_at,
      u.id, u.username, u.email, u.role, u.bio, u.discord_tag
    FROM friendships f
    JOIN users u ON f.requester_id = u.id
    WHERE f.addressee_id = ${me} AND f.status = 'pending'
    ORDER BY f.created_at DESC
  `);
  res.json(rows.rows);
});

// GET /api/friends/status/:userId — check status with another user
router.get("/friends/status/:userId", requireAuth, async (req, res): Promise<void> => {
  const me = (req.session as any).userId as number;
  const other = parseInt(req.params.userId, 10);
  const row = await getFriendship(me, other);
  if (!row) { res.json({ status: "none" }); return; }
  res.json({ status: row.status, friendshipId: row.id, iAmRequester: row.requesterId === me });
});

// POST /api/friends/request/:userId — send a friend request
router.post("/friends/request/:userId", requireAuth, async (req, res): Promise<void> => {
  const me = (req.session as any).userId as number;
  const other = parseInt(req.params.userId, 10);

  if (me === other) { res.status(400).json({ error: "Cannot add yourself" }); return; }

  const existing = await getFriendship(me, other);
  if (existing) { res.status(409).json({ error: "Friendship already exists", status: existing.status }); return; }

  const [friendship] = await db
    .insert(friendshipsTable)
    .values({ requesterId: me, addresseeId: other })
    .returning();
  res.status(201).json(friendship);
});

// PATCH /api/friends/:id/accept — accept a request (addressee only)
router.patch("/friends/:id/accept", requireAuth, async (req, res): Promise<void> => {
  const me = (req.session as any).userId as number;
  const id = parseInt(req.params.id, 10);
  const [row] = await db.select().from(friendshipsTable).where(eq(friendshipsTable.id, id));
  if (!row || row.addresseeId !== me) { res.status(403).json({ error: "Not authorised" }); return; }
  const [updated] = await db.update(friendshipsTable).set({ status: "accepted" }).where(eq(friendshipsTable.id, id)).returning();
  res.json(updated);
});

// PATCH /api/friends/:id/decline — decline a request (addressee only)
router.patch("/friends/:id/decline", requireAuth, async (req, res): Promise<void> => {
  const me = (req.session as any).userId as number;
  const id = parseInt(req.params.id, 10);
  const [row] = await db.select().from(friendshipsTable).where(eq(friendshipsTable.id, id));
  if (!row || row.addresseeId !== me) { res.status(403).json({ error: "Not authorised" }); return; }
  await db.delete(friendshipsTable).where(eq(friendshipsTable.id, id));
  res.json({ success: true });
});

// DELETE /api/friends/:userId — remove a friend (either party)
router.delete("/friends/:userId", requireAuth, async (req, res): Promise<void> => {
  const me = (req.session as any).userId as number;
  const other = parseInt(req.params.userId, 10);
  await db
    .delete(friendshipsTable)
    .where(
      or(
        and(eq(friendshipsTable.requesterId, me), eq(friendshipsTable.addresseeId, other)),
        and(eq(friendshipsTable.requesterId, other), eq(friendshipsTable.addresseeId, me))
      )
    );
  res.json({ success: true });
});

// GET /api/users/search?q= — search members to add as friends
router.get("/users/search", requireAuth, async (req, res): Promise<void> => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  if (q.length < 2) { res.json([]); return; }
  const rows = await db.execute(sql`
    SELECT id, username, role, bio, discord_tag, created_at
    FROM users
    WHERE LOWER(username) LIKE ${'%' + q + '%'}
    LIMIT 20
  `);
  res.json(rows.rows);
});

export default router;
