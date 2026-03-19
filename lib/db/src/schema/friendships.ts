import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const friendshipsTable = pgTable("friendships", {
  id:          serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  addresseeId: integer("addressee_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  status:      text("status").notNull().default("pending"), // pending | accepted | declined
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Friendship = typeof friendshipsTable.$inferSelect;
