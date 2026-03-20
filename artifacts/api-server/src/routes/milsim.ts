import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { db, milsimGroupsTable, milsimRolesTable, milsimRanksTable, milsimRosterTable, milsimAppQuestionsTable } from "@workspace/db";
import { eq, and, or, asc, sql as rawSql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { moderateText } from "../lib/moderation";

const router: IRouter = Router();

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function groupFullDetail(groupId: number) {
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, groupId));
  if (!group) return null;
  const roles = await db.select().from(milsimRolesTable).where(eq(milsimRolesTable.groupId, groupId)).orderBy(asc(milsimRolesTable.sortOrder));
  const ranks = await db.select().from(milsimRanksTable).where(eq(milsimRanksTable.groupId, groupId)).orderBy(asc(milsimRanksTable.tier));
  const roster = await db.select().from(milsimRosterTable).where(eq(milsimRosterTable.groupId, groupId)).orderBy(asc(milsimRosterTable.joinedAt));
  const questions = await db.select().from(milsimAppQuestionsTable).where(eq(milsimAppQuestionsTable.groupId, groupId)).orderBy(asc(milsimAppQuestionsTable.sortOrder));
  return { ...group, roles, ranks, roster, questions };
}

const CreateGroupBody = z.object({
  name: z.string().min(2).max(100),
  tagLine: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  discordUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  sops: z.string().max(10000).optional(),
  orbat: z.string().max(10000).optional(),
});

const RoleBody = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().default(0),
});

const RankBody = z.object({
  name: z.string().min(1).max(100),
  abbreviation: z.string().max(20).optional(),
  tier: z.number().int().default(0),
});

const RosterBody = z.object({
  callsign: z.string().min(1).max(100),
  rankId: z.number().int().nullable().optional(),
  roleId: z.number().int().nullable().optional(),
  notes: z.string().max(500).optional(),
});

const QuestionBody = z.object({
  question: z.string().min(1).max(500),
  sortOrder: z.number().int().default(0),
  required: z.boolean().default(true),
});

// ── Public routes ──────────────────────────────────────────────────────────────

router.get("/milsim-groups", async (req, res): Promise<void> => {
  const groups = await db.select().from(milsimGroupsTable)
    .where(or(eq(milsimGroupsTable.status, "approved"), eq(milsimGroupsTable.status, "featured")))
    .orderBy(asc(milsimGroupsTable.createdAt));
  res.json(groups);
});

router.get("/milsim-groups/:slug", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.slug, raw));
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }
  if (group.status === "pending" && (req as any).user?.id !== group.ownerId && (req as any).user?.role !== "admin") {
    res.status(404).json({ error: "Group not found" }); return;
  }
  const detail = await groupFullDetail(group.id);
  res.json(detail);
});

// ── Auth routes ────────────────────────────────────────────────────────────────

router.get("/milsim-groups/mine/own", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const groups = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.ownerId, userId));
  if (groups.length === 0) { res.json(null); return; }
  const detail = await groupFullDetail(groups[0].id);
  res.json(detail);
});

router.get("/milsim-groups/mine/memberships", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const result = await db.execute(rawSql`
    SELECT mg.id, mg.name, mg.slug
    FROM milsim_group_members mgm
    JOIN milsim_groups mg ON mg.id = mgm.milsim_group_id
    WHERE mgm.user_id = ${userId}
    ORDER BY mg.name ASC
  `);
  res.json(result.rows);
});

router.post("/milsim-groups", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const parsed = CreateGroupBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const existing = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.ownerId, userId));
  if (existing.length > 0) { res.status(409).json({ error: "You already have a registered group" }); return; }

  const groupTextFields = [parsed.data.name, parsed.data.tagLine, parsed.data.description, parsed.data.sops, parsed.data.orbat].filter(Boolean).join("\n\n");
  const groupCheck = await moderateText(groupTextFields);
  if (groupCheck.flagged) {
    res.status(422).json({ error: `Group details rejected by content moderation: ${groupCheck.reason}`, moderation: true });
    return;
  }

  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug;
  let attempt = 0;
  while (true) {
    const [clash] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.slug, slug));
    if (!clash) break;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const [group] = await db.insert(milsimGroupsTable).values({
    ...parsed.data,
    slug,
    ownerId: userId,
    discordUrl: parsed.data.discordUrl || null,
    websiteUrl: parsed.data.websiteUrl || null,
    logoUrl: parsed.data.logoUrl || null,
  }).returning();

  res.status(201).json(await groupFullDetail(group.id));
});

router.patch("/milsim-groups/:id/info", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, id));
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }
  if (group.ownerId !== userId && (req as any).user.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }

  const parsed = CreateGroupBody.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const updateTextFields = [parsed.data.name, parsed.data.tagLine, parsed.data.description, parsed.data.sops, parsed.data.orbat].filter(Boolean).join("\n\n");
  if (updateTextFields.trim()) {
    const updateCheck = await moderateText(updateTextFields);
    if (updateCheck.flagged) {
      res.status(422).json({ error: `Update rejected by content moderation: ${updateCheck.reason}`, moderation: true });
      return;
    }
  }

  await db.update(milsimGroupsTable).set({
    ...parsed.data,
    discordUrl: parsed.data.discordUrl ?? undefined,
    websiteUrl: parsed.data.websiteUrl ?? undefined,
    logoUrl: parsed.data.logoUrl ?? undefined,
  }).where(eq(milsimGroupsTable.id, id));

  res.json(await groupFullDetail(id));
});

router.patch("/milsim-groups/:id/status", requireAuth, requireRole("moderator", "admin"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = z.object({ status: z.enum(["pending", "approved", "featured"]) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid status" }); return; }
  const [group] = await db.update(milsimGroupsTable).set({ status: parsed.data.status }).where(eq(milsimGroupsTable.id, id)).returning();
  if (!group) { res.status(404).json({ error: "Not found" }); return; }
  res.json(group);
});

router.delete("/milsim-groups/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, id));
  if (!group) { res.status(404).json({ error: "Not found" }); return; }
  if (group.ownerId !== userId && (req as any).user.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(milsimGroupsTable).where(eq(milsimGroupsTable.id, id));
  res.sendStatus(204);
});

// ── Roles ──────────────────────────────────────────────────────────────────────

router.post("/milsim-groups/:id/roles", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, id));
  if (!group || group.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  const parsed = RoleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const roleCheck = await moderateText([parsed.data.name, parsed.data.description].filter(Boolean).join(" "));
  if (roleCheck.flagged) {
    res.status(422).json({ error: `Role name/description rejected: ${roleCheck.reason}`, moderation: true });
    return;
  }
  const [role] = await db.insert(milsimRolesTable).values({ groupId: id, ...parsed.data }).returning();
  res.status(201).json(role);
});

router.delete("/milsim-groups/:id/roles/:roleId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const roleId = parseInt(Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId, 10);
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, id));
  if (!group || group.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(milsimRolesTable).where(and(eq(milsimRolesTable.id, roleId), eq(milsimRolesTable.groupId, id)));
  res.sendStatus(204);
});

// ── Ranks ──────────────────────────────────────────────────────────────────────

router.post("/milsim-groups/:id/ranks", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, id));
  if (!group || group.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  const parsed = RankBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const rankCheck = await moderateText([parsed.data.name, parsed.data.abbreviation].filter(Boolean).join(" "));
  if (rankCheck.flagged) {
    res.status(422).json({ error: `Rank name rejected: ${rankCheck.reason}`, moderation: true });
    return;
  }
  const [rank] = await db.insert(milsimRanksTable).values({ groupId: id, ...parsed.data }).returning();
  res.status(201).json(rank);
});

router.delete("/milsim-groups/:id/ranks/:rankId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const rankId = parseInt(Array.isArray(req.params.rankId) ? req.params.rankId[0] : req.params.rankId, 10);
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, id));
  if (!group || group.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(milsimRanksTable).where(and(eq(milsimRanksTable.id, rankId), eq(milsimRanksTable.groupId, id)));
  res.sendStatus(204);
});

// ── Roster ─────────────────────────────────────────────────────────────────────

router.post("/milsim-groups/:id/roster", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, id));
  if (!group || group.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  const parsed = RosterBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const rosterCheck = await moderateText([parsed.data.callsign, parsed.data.notes].filter(Boolean).join(" "));
  if (rosterCheck.flagged) {
    res.status(422).json({ error: `Roster entry rejected: ${rosterCheck.reason}`, moderation: true });
    return;
  }
  const [entry] = await db.insert(milsimRosterTable).values({
    groupId: id,
    callsign: parsed.data.callsign,
    rankId: parsed.data.rankId ?? null,
    roleId: parsed.data.roleId ?? null,
    notes: parsed.data.notes ?? null,
  }).returning();
  res.status(201).json(entry);
});

router.patch("/milsim-groups/:id/roster/:entryId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const entryId = parseInt(Array.isArray(req.params.entryId) ? req.params.entryId[0] : req.params.entryId, 10);
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, id));
  if (!group || group.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  const parsed = RosterBody.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [entry] = await db.update(milsimRosterTable)
    .set({ ...parsed.data, rankId: parsed.data.rankId ?? null, roleId: parsed.data.roleId ?? null })
    .where(and(eq(milsimRosterTable.id, entryId), eq(milsimRosterTable.groupId, id)))
    .returning();
  if (!entry) { res.status(404).json({ error: "Roster entry not found" }); return; }
  res.json(entry);
});

router.delete("/milsim-groups/:id/roster/:entryId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const entryId = parseInt(Array.isArray(req.params.entryId) ? req.params.entryId[0] : req.params.entryId, 10);
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, id));
  if (!group || group.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(milsimRosterTable).where(and(eq(milsimRosterTable.id, entryId), eq(milsimRosterTable.groupId, id)));
  res.sendStatus(204);
});

// ── Award Definitions ──────────────────────────────────────────────────────────

export async function ensureAwardDefsTable() {
  await db.execute(rawSql`
    CREATE TABLE IF NOT EXISTS milsim_award_defs (
      id SERIAL PRIMARY KEY,
      group_id INT NOT NULL,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      type VARCHAR(50) NOT NULL DEFAULT 'medal',
      image_path TEXT,
      qualifiers JSONB NOT NULL DEFAULT '[]',
      created_by VARCHAR(100),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(rawSql`ALTER TABLE milsim_awards ADD COLUMN IF NOT EXISTS award_def_id INT`);
  await db.execute(rawSql`ALTER TABLE milsim_awards ADD COLUMN IF NOT EXISTS citation TEXT`);
}

router.get("/milsim-groups/:id/award-defs", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const result = await db.execute(rawSql`
    SELECT * FROM milsim_award_defs WHERE group_id = ${id} ORDER BY created_at DESC
  `);
  res.json(result.rows);
});

router.post("/milsim-groups/:id/award-defs", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, id));
  if (!group || group.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  const { name, description, type = "medal", image_path, qualifiers = [] } = req.body as any;
  if (!name?.trim()) { res.status(400).json({ error: "name required" }); return; }
  const check = await moderateText([name, description].filter(Boolean).join(" "));
  if (check.flagged) { res.status(422).json({ error: `Rejected: ${check.reason}`, moderation: true }); return; }
  const result = await db.execute(rawSql`
    INSERT INTO milsim_award_defs (group_id, name, description, type, image_path, qualifiers, created_by)
    VALUES (${id}, ${name.trim()}, ${description ?? null}, ${type}, ${image_path ?? null}, ${JSON.stringify(qualifiers)}, ${(req as any).user.username})
    RETURNING *
  `);
  res.status(201).json(result.rows[0]);
});

router.patch("/milsim-groups/:id/award-defs/:defId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const defId = parseInt(Array.isArray(req.params.defId) ? req.params.defId[0] : req.params.defId, 10);
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, id));
  if (!group || group.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  const { name, description, type, image_path, qualifiers } = req.body as any;
  await db.execute(rawSql`
    UPDATE milsim_award_defs SET
      name = COALESCE(${name ?? null}, name),
      description = COALESCE(${description ?? null}, description),
      type = COALESCE(${type ?? null}, type),
      image_path = COALESCE(${image_path ?? null}, image_path),
      qualifiers = COALESCE(${qualifiers ? JSON.stringify(qualifiers) : null}, qualifiers)
    WHERE id = ${defId} AND group_id = ${id}
  `);
  res.sendStatus(204);
});

router.delete("/milsim-groups/:id/award-defs/:defId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const defId = parseInt(Array.isArray(req.params.defId) ? req.params.defId[0] : req.params.defId, 10);
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, id));
  if (!group || group.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.execute(rawSql`DELETE FROM milsim_award_defs WHERE id = ${defId} AND group_id = ${id}`);
  res.sendStatus(204);
});

// ── Awards (issued instances) ───────────────────────────────────────────────────

router.get("/milsim-groups/:id/awards", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const result = await db.execute(rawSql`
    SELECT a.*, r.callsign, d.name as def_name, d.type as def_type, d.image_path as def_image, d.qualifiers as def_qualifiers
    FROM milsim_awards a
    LEFT JOIN milsim_roster r ON r.id = a.roster_entry_id
    LEFT JOIN milsim_award_defs d ON d.id = a.award_def_id
    WHERE a.group_id = ${id} ORDER BY a.awarded_at DESC
  `);
  res.json(result.rows);
});

router.post("/milsim-groups/:id/awards", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, id));
  if (!group || group.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  const { rosterEntryId, awardDefId, citation, title, description, icon } = req.body as any;
  if (!rosterEntryId) { res.status(400).json({ error: "rosterEntryId required" }); return; }
  // Support both new (awardDefId) and legacy (title) flows
  const effectiveTitle = title ?? "Award";
  if (citation) {
    const check = await moderateText(citation);
    if (check.flagged) { res.status(422).json({ error: `Citation rejected: ${check.reason}`, moderation: true }); return; }
  }
  const result = await db.execute(rawSql`
    INSERT INTO milsim_awards (group_id, roster_entry_id, award_def_id, title, description, icon, citation, awarded_by)
    VALUES (${id}, ${rosterEntryId}, ${awardDefId ?? null}, ${effectiveTitle}, ${description ?? null}, ${icon ?? "medal"}, ${citation ?? null}, ${(req as any).user.username})
    RETURNING *
  `);
  res.status(201).json(result.rows[0]);
});

router.delete("/milsim-groups/:id/awards/:awardId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const awardId = parseInt(Array.isArray(req.params.awardId) ? req.params.awardId[0] : req.params.awardId, 10);
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, id));
  if (!group || group.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.execute(rawSql`DELETE FROM milsim_awards WHERE id = ${awardId} AND group_id = ${id}`);
  res.sendStatus(204);
});

// ── Stream ─────────────────────────────────────────────────────────────────────

router.patch("/milsim-groups/:id/stream", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, id));
  if (!group || group.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  const { streamUrl, isLive } = req.body as { streamUrl?: string; isLive?: boolean };
  const updates: Record<string, any> = {};
  if (streamUrl !== undefined) updates.streamUrl = streamUrl || null;
  if (isLive !== undefined) updates.isLive = isLive;
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
  await db.execute(rawSql`
    UPDATE milsim_groups SET
      stream_url = ${updates.streamUrl !== undefined ? updates.streamUrl : rawSql`stream_url`},
      is_live = ${updates.isLive !== undefined ? updates.isLive : rawSql`is_live`}
    WHERE id = ${id}
  `);
  const result = await db.execute(rawSql`SELECT * FROM milsim_groups WHERE id = ${id}`);
  res.json(result.rows[0]);
});

// ── Application Questions ──────────────────────────────────────────────────────

router.post("/milsim-groups/:id/questions", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, id));
  if (!group || group.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  const parsed = QuestionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [q] = await db.insert(milsimAppQuestionsTable).values({ groupId: id, ...parsed.data }).returning();
  res.status(201).json(q);
});

router.delete("/milsim-groups/:id/questions/:qId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const qId = parseInt(Array.isArray(req.params.qId) ? req.params.qId[0] : req.params.qId, 10);
  const [group] = await db.select().from(milsimGroupsTable).where(eq(milsimGroupsTable.id, id));
  if (!group || group.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(milsimAppQuestionsTable).where(and(eq(milsimAppQuestionsTable.id, qId), eq(milsimAppQuestionsTable.groupId, id)));
  res.sendStatus(204);
});

export default router;
