import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const veteranApplicationsTable = pgTable("veteran_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  username: text("username").notNull(),

  // Service details
  country: text("country").notNull(),                   // "UK" | "US" | "Other"
  branch: text("branch").notNull(),                     // e.g. "British Army", "US Army"
  rank: text("rank").notNull(),
  isCurrentlyServing: boolean("is_currently_serving").notNull().default(false),
  serviceStart: text("service_start").notNull(),        // Year or YYYY-MM
  serviceEnd: text("service_end"),                      // null if still serving
  mosRole: text("mos_role").notNull(),                  // Trade / MOS / Specialisation
  unitOrFormation: text("unit_or_formation"),
  deploymentHistory: text("deployment_history"),

  // Advisory questions
  reasonForJoining: text("reason_for_joining").notNull(),
  tacticalExperience: text("tactical_experience").notNull(),
  additionalInfo: text("additional_info"),

  // ID verification
  idType: text("id_type"),                              // "va_card" | "uk_veteran_card" | "mod90" | "f214" | "other"
  idUploadData: text("id_upload_data"),                 // base64 data URL of the uploaded image
  idVerificationStatus: text("id_verification_status").default("not_submitted"),
  // not_submitted | pending | ai_verified | ai_flagged | manually_verified | rejected
  aiVerificationResult: text("ai_verification_result"), // JSON string of AI analysis
  aiConfidenceScore: integer("ai_confidence_score"),    // 0–100

  // Review
  status: text("status").notNull().default("pending"),  // pending | under_review | approved | rejected
  reviewNote: text("review_note"),
  reviewedBy: integer("reviewed_by").references(() => usersTable.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type VeteranApplication = typeof veteranApplicationsTable.$inferSelect;
