import { Router, type IRouter } from "express";
import { db, messagesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/notifications/counts", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;

  const [unreadMsgs] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messagesTable)
    .where(and(
      eq(messagesTable.recipientId, userId),
      eq(messagesTable.isRead, false),
      eq(messagesTable.deletedByRecipient, false),
    ));

  const pendingFriends = await db.execute(
    sql`SELECT COUNT(*)::int AS count FROM friendships WHERE addressee_id = ${userId} AND status = 'pending'`
  );

  res.json({
    unreadMessages: unreadMsgs?.count ?? 0,
    pendingFriendRequests: (pendingFriends.rows[0] as any)?.count ?? 0,
  });
});

export default router;
