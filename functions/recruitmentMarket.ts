// recruitmentMarket — Unit Vacancy Board + Operator Listings — build:20260510a
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';

const ROLE_TAGS = [
  "Section Commander","Platoon Commander","Company Commander",
  "Rifleman","Automatic Rifleman","Grenadier","Designated Marksman","Sniper",
  "JTAC","Mortar Operator","Machine Gunner","Anti-Tank",
  "Medic","Combat Engineer","Breacher","EOD",
  "Pilot","Co-Pilot","Crew Chief","Door Gunner",
  "Vehicle Commander","Driver","Gunner",
  "Intelligence Officer","Signals","Logistics","Staff Officer"
];

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Authorization,Content-Type",
    },
  });
}

async function getUser(base44: any, req: Request) {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    return await base44.asServiceRole.entities.AppUser.get(payload.sub) ?? null;
  } catch { return null; }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return json(null, 204);

  const url = new URL(req.url);
  const path = url.searchParams.get("path") ?? "";
  const method = req.method;
  const base44 = createClientFromRequest(req);
  const db = base44.asServiceRole;

  // ── role tags ────────────────────────────────────────────────────────────
  if (method === "GET" && path === "/role-tags") return json(ROLE_TAGS);

  // ══════════════════════════════════════════════════════════════════════════
  // UNIT VACANCIES
  // ══════════════════════════════════════════════════════════════════════════

  // GET /vacancies — public list
  if (method === "GET" && path === "/vacancies") {
    const game = url.searchParams.get("game");
    const role = url.searchParams.get("role");
    let v = await db.entities.UnitVacancy.filter({ status: "open" });
    if (game) v = v.filter((x: any) => Array.isArray(x.games) && x.games.includes(game));
    if (role) v = v.filter((x: any) => x.role_tag === role);
    v.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
    return json(v);
  }

  // GET /vacancies/group/:groupId — HQ view
  if (method === "GET" && path.startsWith("/vacancies/group/")) {
    const groupId = path.replace("/vacancies/group/", "");
    const v = await db.entities.UnitVacancy.filter({ group_id: groupId });
    v.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
    return json(v);
  }

  // POST /vacancies — create
  if (method === "POST" && path === "/vacancies") {
    const me = await getUser(base44, req);
    if (!me) return json({ error: "Unauthorized" }, 401);
    const body = await req.json();
    if (!body.group_id || !body.title || !body.role_tag) return json({ error: "group_id, title, role_tag required" }, 400);
    const roster = await db.entities.MilsimRoster.filter({ group_id: body.group_id, user_id: me.id, status: "active" });
    if (!roster.length) return json({ error: "Not a member of this group" }, 403);
    const hqPerms = roster[0].hq_permissions ?? [];
    if (!hqPerms.includes("manage_recruitment") && !hqPerms.includes("admin") && me.role !== "admin")
      return json({ error: "Insufficient permissions" }, 403);
    const groups = await db.entities.MilsimGroup.filter({ id: body.group_id });
    const group = groups[0];
    const vacancy = await db.entities.UnitVacancy.create({
      group_id: body.group_id, group_name: group?.name ?? "", group_tag: group?.slug ?? "",
      group_logo_url: group?.logo_url ?? "", role_tag: body.role_tag, title: body.title,
      description: body.description ?? "", games: body.games ?? [],
      min_ops: body.min_ops ?? null, min_months_on_platform: body.min_months_on_platform ?? null,
      min_reputation_score: body.min_reputation_score ?? null,
      require_no_blacklist: body.require_no_blacklist ?? true,
      required_qualifications: body.required_qualifications ?? [],
      preferred_timezone: body.preferred_timezone ?? "", preferred_availability: body.preferred_availability ?? "",
      preferred_doctrine: body.preferred_doctrine ?? "", comms_standard: body.comms_standard ?? "",
      require_prior_leadership: body.require_prior_leadership ?? false,
      our_standard: body.our_standard ?? "", selection_process: body.selection_process ?? "",
      probation_detail: body.probation_detail ?? "", status: "open",
      expires_at: body.expires_at ?? null, applicant_count: 0,
    });
    return json(vacancy, 201);
  }

  // PATCH /vacancies/:id
  if (method === "PATCH" && path.startsWith("/vacancies/") && !path.includes("/group/") && !path.includes("/applications") && !path.includes("/apply")) {
    const me = await getUser(base44, req);
    if (!me) return json({ error: "Unauthorized" }, 401);
    const id = path.replace("/vacancies/", "");
    const body = await req.json();
    return json(await db.entities.UnitVacancy.update(id, body));
  }

  // DELETE /vacancies/:id
  if (method === "DELETE" && path.startsWith("/vacancies/") && !path.includes("/applications") && !path.includes("/apply")) {
    const me = await getUser(base44, req);
    if (!me) return json({ error: "Unauthorized" }, 401);
    const id = path.replace("/vacancies/", "");
    await db.entities.UnitVacancy.delete(id);
    return json({ ok: true });
  }

  // GET /vacancies/:id/applications — HQ view
  if (method === "GET" && path.match(/^\/vacancies\/[^/]+\/applications$/)) {
    const vacancyId = path.split("/")[2];
    return json(await db.entities.VacancyApplication.filter({ vacancy_id: vacancyId }));
  }

  // POST /vacancies/:id/apply
  if (method === "POST" && path.match(/^\/vacancies\/[^/]+\/apply$/)) {
    const me = await getUser(base44, req);
    if (!me) return json({ error: "Unauthorized" }, 401);
    const vacancyId = path.split("/")[2];
    const vacancies = await db.entities.UnitVacancy.filter({ id: vacancyId });
    if (!vacancies.length) return json({ error: "Vacancy not found" }, 404);
    const vacancy = vacancies[0];
    if (vacancy.status !== "open") return json({ error: "Vacancy is no longer open" }, 400);
    const body = await req.json();
    // Hard filter: ops count
    if (vacancy.min_ops) {
      const rr = await db.entities.MilsimRoster.filter({ user_id: me.id });
      const totalOps = rr.reduce((s: number, r: any) => s + (r.ops_count ?? 0), 0);
      if (totalOps < vacancy.min_ops) return json({ error: `Minimum ${vacancy.min_ops} ops required. You have ${totalOps}.` }, 400);
    }
    // Hard filter: blacklist
    if (vacancy.require_no_blacklist) {
      const rep = await db.entities.OperatorReputation.filter({ subject_id: me.id });
      if (rep.some((r: any) => r.blacklisted === true)) return json({ error: "You do not meet the eligibility requirements." }, 400);
    }
    // Hard filter: reputation score
    if (vacancy.min_reputation_score) {
      const rep = await db.entities.OperatorReputation.filter({ subject_id: me.id });
      if (rep.length > 0) {
        const avg = rep.reduce((s: number, r: any) => s + (((r.activity??5)+(r.attitude??5)+(r.experience??5)+(r.discipline??5))/4), 0) / rep.length;
        if (avg < vacancy.min_reputation_score) return json({ error: `Minimum reputation score of ${vacancy.min_reputation_score} required.` }, 400);
      }
    }
    const existing = await db.entities.VacancyApplication.filter({ vacancy_id: vacancyId, applicant_id: me.id });
    if (existing.length) return json({ error: "You have already applied." }, 409);
    const application = await db.entities.VacancyApplication.create({
      vacancy_id: vacancyId, group_id: vacancy.group_id,
      applicant_id: me.id, applicant_username: me.username,
      cover_note: body.cover_note ?? "", status: "pending", review_note: "",
    });
    await db.entities.UnitVacancy.update(vacancyId, { applicant_count: (vacancy.applicant_count ?? 0) + 1 });
    return json(application, 201);
  }

  // PATCH /vacancies/applications/:id — HQ review
  if (method === "PATCH" && path.startsWith("/vacancies/applications/")) {
    const me = await getUser(base44, req);
    if (!me) return json({ error: "Unauthorized" }, 401);
    const appId = path.replace("/vacancies/applications/", "");
    const body = await req.json();
    return json(await db.entities.VacancyApplication.update(appId, body));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // OPERATOR LISTINGS
  // ══════════════════════════════════════════════════════════════════════════

  // GET /operators — public list
  if (method === "GET" && path === "/operators") {
    const game = url.searchParams.get("game");
    const role = url.searchParams.get("role");
    let listings = await db.entities.OperatorListing.filter({ status: "active" });
    if (game) listings = listings.filter((l: any) => Array.isArray(l.games) && l.games.includes(game));
    if (role) listings = listings.filter((l: any) => Array.isArray(l.role_tags) && l.role_tags.includes(role));
    listings.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
    const enriched = await Promise.all(listings.map(async (l: any) => {
      const rep = await db.entities.OperatorReputation.filter({ subject_id: l.user_id });
      let grade = "UNRATED"; let score = null;
      if (rep.length > 0) {
        const avg = rep.reduce((s: number, r: any) => s + (((r.activity??5)+(r.attitude??5)+(r.experience??5)+(r.discipline??5))/4), 0) / rep.length;
        score = parseFloat(avg.toFixed(1));
        grade = avg >= 9 ? "ELITE" : avg >= 7 ? "TRUSTED" : avg >= 5 ? "STANDARD" : avg >= 3 ? "CAUTION" : "HIGH RISK";
      }
      const rr = await db.entities.MilsimRoster.filter({ user_id: l.user_id });
      const totalOps = rr.reduce((s: number, r: any) => s + (r.ops_count ?? 0), 0);
      return { ...l, rep_grade: grade, rep_score: score, total_ops: totalOps };
    }));
    return json(enriched);
  }

  // GET /operators/mine
  if (method === "GET" && path === "/operators/mine") {
    const me = await getUser(base44, req);
    if (!me) return json({ error: "Unauthorized" }, 401);
    const listings = await db.entities.OperatorListing.filter({ user_id: me.id });
    return json(listings[0] ?? null);
  }

  // POST /operators — create or update listing
  if (method === "POST" && path === "/operators") {
    const me = await getUser(base44, req);
    if (!me) return json({ error: "Unauthorized" }, 401);
    const body = await req.json();
    const existing = await db.entities.OperatorListing.filter({ user_id: me.id });
    const payload = {
      user_id: me.id, username: me.username, nationality: me.nationality ?? "",
      role_tags: body.role_tags ?? [], games: body.games ?? [],
      timezone: body.timezone ?? "", availability: body.availability ?? "",
      doctrine_style: body.doctrine_style ?? "", prior_leadership: body.prior_leadership ?? false,
      notes: body.notes ?? "", status: "active", expires_at: body.expires_at ?? null,
    };
    if (existing.length) return json(await db.entities.OperatorListing.update(existing[0].id, payload));
    return json(await db.entities.OperatorListing.create(payload), 201);
  }

  // PATCH /operators/mine/status — toggle active/inactive
  if (method === "PATCH" && path === "/operators/mine/status") {
    const me = await getUser(base44, req);
    if (!me) return json({ error: "Unauthorized" }, 401);
    const body = await req.json();
    const existing = await db.entities.OperatorListing.filter({ user_id: me.id });
    if (!existing.length) return json({ error: "No listing found" }, 404);
    return json(await db.entities.OperatorListing.update(existing[0].id, { status: body.status }));
  }

  // DELETE /operators/mine
  if (method === "DELETE" && path === "/operators/mine") {
    const me = await getUser(base44, req);
    if (!me) return json({ error: "Unauthorized" }, 401);
    const existing = await db.entities.OperatorListing.filter({ user_id: me.id });
    if (!existing.length) return json({ error: "No listing found" }, 404);
    await db.entities.OperatorListing.delete(existing[0].id);
    return json({ ok: true });
  }

  return json({ error: "Not found" }, 404);
});
