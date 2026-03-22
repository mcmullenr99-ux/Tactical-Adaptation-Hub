import { Router, type IRouter } from "express";
import { db, messagesTable, usersTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import { SendMessageBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { alias } from "drizzle-orm/pg-core";
import { moderateText } from "../lib/moderation";

const router: IRouter = Router();

const senderAlias = alias(usersTable, "sender");
const recipientAlias = alias(usersTable, "recipient");

function formatMessage(
  msg: typeof messagesTable.$inferSelect,
  senderUsername: string,
  recipientUsername: string
) {
  return {
    id: msg.id,
    senderId: msg.senderId,
    recipientId: msg.recipientId,
    senderUsername,
    recipientUsername,
    subject: msg.subject,
    body: msg.body,
    isRead: msg.isRead,
    createdAt: msg.createdAt.toISOString(),
  };
}

router.get("/messages/inbox", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const rows = await db
    .select({
      msg: messagesTable,
      senderUsername: senderAlias.username,
      recipientUsername: recipientAlias.username,
    })
    .from(messagesTable)
    .innerJoin(senderAlias, eq(messagesTable.senderId, senderAlias.id))
    .innerJoin(recipientAlias, eq(messagesTable.recipientId, recipientAlias.id))
    .where(
      and(
        eq(messagesTable.recipientId, userId),
        eq(messagesTable.deletedByRecipient, false)
      )
    )
    .orderBy(messagesTable.createdAt);

  res.json(
    rows.map((r) => formatMessage(r.msg, r.senderUsername, r.recipientUsername)).reverse()
  );
});

router.get("/messages/sent", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const rows = await db
    .select({
      msg: messagesTable,
      senderUsername: senderAlias.username,
      recipientUsername: recipientAlias.username,
    })
    .from(messagesTable)
    .innerJoin(senderAlias, eq(messagesTable.senderId, senderAlias.id))
    .innerJoin(recipientAlias, eq(messagesTable.recipientId, recipientAlias.id))
    .where(
      and(
        eq(messagesTable.senderId, userId),
        eq(messagesTable.deletedBySender, false)
      )
    )
    .orderBy(messagesTable.createdAt);

  res.json(
    rows.map((r) => formatMessage(r.msg, r.senderUsername, r.recipientUsername)).reverse()
  );
});

router.patch("/messages/read-all", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  await db
    .update(messagesTable)
    .set({ isRead: true })
    .where(and(eq(messagesTable.recipientId, userId), eq(messagesTable.isRead, false)));
  res.json({ success: true });
});

router.post("/messages", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { recipientId, subject, body } = parsed.data;
  if (body.length > 5000) { res.status(400).json({ error: "Message body too long (max 5000 characters)" }); return; }
  if (subject.length > 200) { res.status(400).json({ error: "Subject too long (max 200 characters)" }); return; }

  const msgCheck = await moderateText(`${subject}\n\n${body}`);
  if (msgCheck.flagged) {
    res.status(422).json({ error: `Message blocked by content moderation: ${msgCheck.reason}`, moderation: true });
    return;
  }

  const [recipient] = await db.select().from(usersTable).where(eq(usersTable.id, recipientId));
  if (!recipient) {
    res.status(400).json({ error: "Recipient not found" });
    return;
  }

  const [msg] = await db
    .insert(messagesTable)
    .values({ senderId: userId, recipientId, subject, body })
    .returning();

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  res.status(201).json(formatMessage(msg, sender.username, recipient.username));
});

router.patch("/messages/:id/read", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [existing] = await db
    .select()
    .from(messagesTable)
    .where(and(eq(messagesTable.id, id), eq(messagesTable.recipientId, userId)));

  if (!existing) {
    res.status(404).json({ error: "Message not found" });
    return;
  }

  const [msg] = await db
    .update(messagesTable)
    .set({ isRead: true })
    .where(eq(messagesTable.id, id))
    .returning();

  const rows = await db
    .select({
      msg: messagesTable,
      senderUsername: senderAlias.username,
      recipientUsername: recipientAlias.username,
    })
    .from(messagesTable)
    .innerJoin(senderAlias, eq(messagesTable.senderId, senderAlias.id))
    .innerJoin(recipientAlias, eq(messagesTable.recipientId, recipientAlias.id))
    .where(eq(messagesTable.id, msg.id));

  res.json(formatMessage(rows[0].msg, rows[0].senderUsername, rows[0].recipientUsername));
});

router.delete("/messages/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [msg] = await db.select().from(messagesTable).where(eq(messagesTable.id, id));
  if (!msg) {
    res.status(404).json({ error: "Message not found" });
    return;
  }

  if (msg.senderId === userId) {
    await db.update(messagesTable).set({ deletedBySender: true }).where(eq(messagesTable.id, id));
  } else if (msg.recipientId === userId) {
    await db.update(messagesTable).set({ deletedByRecipient: true }).where(eq(messagesTable.id, id));
  } else {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.sendStatus(204);
});

export default router;
