import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const staffApplicationsTable = pgTable("staff_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  gamertag: text("gamertag").notNull(),
  games: text("games").array().notNull(),
  experience: text("experience").notNull(),
  motivation: text("motivation").notNull(),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  reviewNote: text("review_note"),
  reviewedBy: integer("reviewed_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStaffApplicationSchema = createInsertSchema(staffApplicationsTable).omit({
  id: true,
  status: true,
  reviewNote: true,
  reviewedBy: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStaffApplication = z.infer<typeof insertStaffApplicationSchema>;
export type StaffApplication = typeof staffApplicationsTable.$inferSelect;
