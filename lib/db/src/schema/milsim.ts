import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const milsimGroupsTable = pgTable("milsim_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  tagLine: text("tag_line"),
  description: text("description"),
  discordUrl: text("discord_url"),
  websiteUrl: text("website_url"),
  logoUrl: text("logo_url"),
  sops: text("sops"),
  orbat: text("orbat"),
  status: text("status").notNull().default("pending"), // pending | approved | featured
  ownerId: integer("owner_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // Discovery / filter fields
  country: text("country"),
  language: text("language"),
  unitType: text("unit_type"),
  games: text("games").array(),
  tags: text("tags").array(),
});

export const milsimRolesTable = pgTable("milsim_roles", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => milsimGroupsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const milsimRanksTable = pgTable("milsim_ranks", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => milsimGroupsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  abbreviation: text("abbreviation"),
  tier: integer("tier").notNull().default(0),
});

export const milsimRosterTable = pgTable("milsim_roster", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => milsimGroupsTable.id, { onDelete: "cascade" }),
  callsign: text("callsign").notNull(),
  rankId: integer("rank_id").references(() => milsimRanksTable.id, { onDelete: "set null" }),
  roleId: integer("role_id").references(() => milsimRolesTable.id, { onDelete: "set null" }),
  notes: text("notes"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const milsimAppQuestionsTable = pgTable("milsim_app_questions", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => milsimGroupsTable.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  required: boolean("required").notNull().default(true),
});

export type MilsimGroup = typeof milsimGroupsTable.$inferSelect;
export type MilsimRole = typeof milsimRolesTable.$inferSelect;
export type MilsimRank = typeof milsimRanksTable.$inferSelect;
export type MilsimRosterEntry = typeof milsimRosterTable.$inferSelect;
export type MilsimAppQuestion = typeof milsimAppQuestionsTable.$inferSelect;
