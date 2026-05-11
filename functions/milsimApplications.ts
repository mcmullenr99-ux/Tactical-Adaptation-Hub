import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { verify } from 'npm:jsonwebtoken@9.0.2';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'tag-secret-fallback-change-in-production';
const WEBHOOKS_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/webhooks";
const NOTIFICATIONS_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/notifications";

async function fireEvent(groupId: string, event: string, payload: object) {
  try {
    await fetch(`${WEBHOOKS_URL}?path=%2Ffire`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: groupId, event, payload }),
    });
  } catch (_) {}
}

async function sendNotification(userId: string, type: string, title: string, body: string, link?: string) {
  try {
    await fetch(`${NOTIFICATIONS_URL}?path=%2Fsend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, type, title, body, link }),
    });
  } catch (_) {}
}

async function getCallerUser(base44: any, req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verify(token, JWT_SECRET) as { sub: string };
    return await base44.asServiceRole.entities.AppUser.get(payload.sub) ?? null;
  } catch { return null; }
}

// ─── Compute reputation score from OperatorReputation records ────────────────
function computeRepScore(repReviews: any[]): number {
  if (!repReviews.length) return 0;
  const perReview = repReviews.map((r: any) => {
    const vals = ['activity','attitude','experience','discipline']
      .map((f: string) => r[f])
      .filter((v: any) => typeof v === 'number');
    return vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null;
  }).filter((v: any) => v !== null) as number[];
  return perReview.length
    ? Math.round((perReview.reduce((a: number, b: number) => a + b, 0) / perReview.length) * 10) / 10
    : 0;
}

// ─── DOSSIER ASSEMBLY ────────────────────────────────────────────────────────
async function buildServiceDossier(base44: any, user: any): Promise<object> {
  const userId   = user.id;
  const username = user.username;

  const [
    allRoster, allDischarges, allLOAs, _unused,
    allQualGrants, allAARs, allRepReviews, allOps,
  ] = await Promise.all([
    base44.asServiceRole.entities.MilsimRoster.filter({ user_id: userId }).catch(() => []),
    base44.asServiceRole.entities.MilsimDischarge.filter({ user_id: userId }).catch(() => []),
    base44.asServiceRole.entities.MilsimLOA.filter({ user_id: userId }).catch(() => []),
    Promise.resolve([]),
    base44.asServiceRole.entities.QualificationGrant.filter({ callsign: username }).catch(() => []),
    base44.asServiceRole.entities.MilsimAAR.filter({ author_id: userId }).catch(() => []),
    base44.asServiceRole.entities.OperatorReputation.filter({ subject_id: userId }).catch(() => []),
    base44.asServiceRole.entities.MilsimOp.filter({ created_by: userId }).catch(() => []),
  ]);

  const rosterIds = (allRoster as any[]).map((r: any) => r.id);
  const awardsPerRoster: Record<string, any[]> = {};
  const qualsPerRoster: Record<string, any[]> = {};

  await Promise.all(
    rosterIds.map(async (rid: string) => {
      const [awards, quals] = await Promise.all([
        base44.asServiceRole.entities.MilsimAward.filter({ recipient_roster_id: rid }).catch(() => []),
        base44.asServiceRole.entities.QualificationGrant.filter({ roster_id: rid }).catch(() => []),
      ]);
      awardsPerRoster[rid] = awards;
      qualsPerRoster[rid] = quals;
    })
  );

  const groupIds = [...new Set((allRoster as any[]).map((r: any) => r.group_id).filter(Boolean))];
  const groupMap: Record<string, any> = {};
  await Promise.all(
    groupIds.map(async (gid: string) => {
      const [group, ranks, roles] = await Promise.all([
        base44.asServiceRole.entities.MilsimGroup.get(gid).catch(() => null),
        base44.asServiceRole.entities.MilsimRank.filter({ group_id: gid }).catch(() => []),
        base44.asServiceRole.entities.MilsimRole.filter({ group_id: gid }).catch(() => []),
      ]);
      groupMap[gid] = { group, ranks, roles };
    })
  );

  const unitRecords = (allRoster as any[]).map((entry: any) => {
    const gdata = groupMap[entry.group_id] ?? {};
    const group = gdata.group ?? {};
    const ranks: any[] = gdata.ranks ?? [];
    const roles: any[] = gdata.roles ?? [];
    const rank = ranks.find((r: any) => r.id === (entry.rank_id ?? entry.rankId));
    const role = roles.find((r: any) => r.id === (entry.role_id ?? entry.roleId));
    const unitAwards = awardsPerRoster[entry.id] ?? [];
    const unitQuals  = qualsPerRoster[entry.id] ?? [];
    const unitLOAs = (allLOAs as any[]).filter((l: any) => l.group_id === entry.group_id);
    const unitDischarges = (allDischarges as any[]).filter((d: any) => d.group_id === entry.group_id);
    const discharge = unitDischarges.sort((a: any, b: any) =>
      new Date(b.created_date ?? 0).getTime() - new Date(a.created_date ?? 0).getTime())[0] ?? null;
    const unitAARs = (allAARs as any[]).filter((a: any) => a.group_id === entry.group_id);
    const unitOps  = (allOps as any[]).filter((o: any) => o.group_id === entry.group_id);

    return {
      unit: {
        id: group.id ?? entry.group_id, name: group.name ?? 'Unknown Unit',
        slug: group.slug ?? null, branch: group.branch ?? null,
        country: group.country ?? null, is_verified: group.is_verified ?? false,
      },
      service: {
        callsign: entry.callsign ?? username,
        rank_name: rank?.name ?? null, rank_abbr: rank?.abbreviation ?? null,
        role_name: role?.name ?? null, status: entry.status ?? 'active',
        join_date: entry.join_date ?? entry.created_date ?? null,
        ops_count: entry.ops_count ?? unitOps.length,
        specialisations: entry.specialisations ?? [],
        notes_on_file: entry.notes ?? null,
      },
      discharge: discharge ? {
        type: discharge.discharge_type ?? 'Unknown', reason: discharge.reason ?? null,
        effective_date: discharge.effective_date ?? discharge.created_date ?? null,
        final_rank: discharge.final_rank ?? null, final_role: discharge.final_role ?? null,
        ops_served: discharge.ops_served ?? null,
        reinstatement_eligible: discharge.reinstatement_eligible ?? null,
        conducted_by: discharge.conducted_by_username ?? null, notes: discharge.notes ?? null,
      } : null,
      loas: unitLOAs.map((l: any) => ({
        reason_category: l.reason_category ?? null, reason_detail: l.reason_detail ?? null,
        start_date: l.start_date ?? null, end_date: l.end_date ?? null,
        status: l.status ?? null, granted_by: l.granted_by_username ?? null, notes: l.notes ?? null,
      })),
      awards: unitAwards.map((a: any) => ({
        name: a.award_name ?? null, description: a.award_description ?? null,
        image_url: a.award_image_url ?? null, reason: a.reason ?? null,
        awarded_by: a.awarded_by ?? null, date: a.created_date ?? null,
      })),
      qualifications: unitQuals.map((q: any) => ({
        name: q.qualification_name ?? null, notes: q.notes ?? null,
        granted_by: q.granted_by ?? null, date: q.created_date ?? null,
      })),
      aars_authored: unitAARs.map((a: any) => ({
        op_name: a.op_name ?? null, title: a.title ?? null,
        outcome: a.outcome ?? null, lessons_learned: a.lessons_learned ?? null,
        op_date: a.op_date ?? a.created_date ?? null, classification: a.classification ?? null,
      })),
    };
  });

  const repReviews = allRepReviews as any[];
  const repSummary = repReviews.length > 0 ? (() => {
    const avg = (field: string) => {
      const vals = repReviews.map((r: any) => r[field]).filter((v: any) => typeof v === 'number');
      return vals.length ? Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10 : null;
    };
    const overall = computeRepScore(repReviews);
    const grade = overall >= 9 ? 'ELITE' : overall >= 7 ? 'TRUSTED' : overall >= 5 ? 'STANDARD' :
      overall >= 3 ? 'CAUTION' : overall > 0 ? 'HIGH RISK' : 'UNRATED';
    return {
      review_count: repReviews.length, overall_score: overall, grade,
      activity: avg('activity'), attitude: avg('attitude'),
      experience: avg('experience'), discipline: avg('discipline'),
      commends: repReviews.filter((r: any) => r.overall_vote === 'commend').length,
      cautions: repReviews.filter((r: any) => r.overall_vote === 'caution').length,
      blacklisted: repReviews.some((r: any) => r.blacklisted === true),
      reviews_from_units: repReviews.map((r: any) => ({
        group_name: r.group_name ?? null, overall_vote: r.overall_vote ?? null,
        notes: r.notes ?? null, date: r.created_date ?? null, reviewer_username: r.reviewer_username ?? null,
      })),
    };
  })() : null;

  return {
    compiled_at: new Date().toISOString(),
    operator: {
      id: userId, username, nationality: user.nationality ?? null,
      bio: user.bio ?? null, discord_tag: user.discord_tag ?? null,
      is_verified: user.is_verified ?? false, verified_at: user.verified_at ?? null,
    },
    total_units_served: unitRecords.length,
    total_ops: unitRecords.reduce((sum: number, u: any) => sum + (u.service.ops_count ?? 0), 0),
    total_awards: unitRecords.reduce((sum: number, u: any) => sum + u.awards.length, 0),
    total_qualifications: unitRecords.reduce((sum: number, u: any) => sum + u.qualifications.length, 0),
    total_loas: unitRecords.reduce((sum: number, u: any) => sum + u.loas.length, 0),
    reputation: repSummary,
    unit_records: unitRecords,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathOverride = url.searchParams.get('path');
    const parts = pathOverride
      ? pathOverride.split('/').filter(Boolean)
      : url.pathname.replace(/^\/functions\/milsimApplications/, '').split('/').filter(Boolean);
    const method = req.method;

    // GET /milsimApplications/mine
    if (method === 'GET' && parts[0] === 'mine') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const apps = await base44.asServiceRole.entities.MilsimApplication.filter({ applicant_id: full.id });
      return Response.json(apps);
    }

    // GET /milsimApplications/:groupId/applications
    if (method === 'GET' && parts.length === 2 && parts[1] === 'applications') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const apps = await base44.asServiceRole.entities.MilsimApplication.filter({ group_id: parts[0] });
      return Response.json(apps);
    }

    // GET /milsimApplications/:groupId/policy — fetch group app policy
    if (method === 'GET' && parts.length === 2 && parts[1] === 'policy') {
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group) return Response.json({ error: 'Group not found' }, { status: 404 });
      let ap = group.app_policy ?? {};
      if (typeof ap === "string") { try { ap = JSON.parse(ap); } catch { ap = {}; } }
      return Response.json(ap);
    }

    // PATCH /milsimApplications/:groupId/policy — save app policy (owner only)
    if (method === 'PATCH' && parts.length === 2 && parts[1] === 'policy') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const body = await req.json().catch(() => ({}));
      const policy = {
        min_reputation_score:          body.min_reputation_score ?? null,
        auto_reject_below_threshold:   body.auto_reject_below_threshold ?? false,
        rejection_cooldown_days:       body.rejection_cooldown_days ?? 0,
        notify_owner_on_cooldown_expire:   body.notify_owner_on_cooldown_expire ?? false,
        notify_owner_on_score_threshold:   body.notify_owner_on_score_threshold ?? false,
      };
      await base44.asServiceRole.entities.MilsimGroup.update(parts[0], { app_policy: JSON.stringify(policy) });
      return Response.json({ ok: true, policy });
    }

    // POST /milsimApplications/:groupId/apply
    if (method === 'POST' && parts.length === 2 && parts[1] === 'apply') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const existing = await base44.asServiceRole.entities.MilsimApplication.filter({ group_id: parts[0], applicant_id: full.id });

      // Block if active application already open
      const activeApp = existing.find((a: any) => a.status === 'pending' || a.status === 'reviewing' || a.status === 'interview' || a.status === 'approved');
      if (activeApp) return Response.json({ error: 'Already applied' }, { status: 409 });

      // Block if still in rejection cooldown
      const rejectedApps = existing.filter((a: any) => a.status === 'rejected' && a.rejection_cooldown_until);
      for (const rApp of rejectedApps) {
        const cooldownUntil = new Date(rApp.rejection_cooldown_until);
        if (cooldownUntil > new Date()) {
          return Response.json({
            error: 'reapplication_blocked',
            message: `You are not eligible to reapply until ${cooldownUntil.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
            cooldown_until: rApp.rejection_cooldown_until,
          }, { status: 403 });
        }
      }

      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group) return Response.json({ error: 'Group not found' }, { status: 404 });

      const body = await req.json().catch(() => ({}));

      // Build dossier first so we can score-check
      let dossier: any = null;
      try { dossier = await buildServiceDossier(base44, full); } catch (e: any) {
        console.warn('[milsimApplications] dossier build failed:', e.message);
      }

      let rawPol = group.app_policy ?? {}; if (typeof rawPol === "string") { try { rawPol = JSON.parse(rawPol); } catch { rawPol = {}; } } const policy = rawPol;
      const minScore: number | null = policy.min_reputation_score ?? null;
      const autoReject: boolean = policy.auto_reject_below_threshold ?? false;
      const cooldownDays: number = policy.rejection_cooldown_days ?? 0;

      // Score gate
      if (minScore !== null) {
        const repReviews = await base44.asServiceRole.entities.OperatorReputation.filter({ subject_id: full.id }).catch(() => []);
        const score = computeRepScore(repReviews);
        if (score < minScore) {
          if (autoReject) {
            // Auto-reject immediately with cooldown if configured
            const cooldownUntil = cooldownDays > 0
              ? new Date(Date.now() + cooldownDays * 86400000).toISOString()
              : null;
            const app = await base44.asServiceRole.entities.MilsimApplication.create({
              group_id: parts[0], group_name: group.name,
              applicant_id: full.id, applicant_username: full.username,
              answers: body.answers ?? [], status: 'rejected',
              review_note: `Auto-rejected: reputation score ${score.toFixed(1)} is below the minimum required score of ${minScore.toFixed(1)}.`,
              reviewed_by: 'system',
              service_dossier: dossier,
              ...(cooldownUntil ? { rejection_cooldown_until: cooldownUntil, rejection_cooldown_days: cooldownDays } : {}),
            });
            await fireEvent(parts[0], "application.auto_rejected", {
              applicant_username: full.username, group_id: parts[0],
              score, min_score: minScore, application_id: app.id,
            });
            // Notify applicant of auto-rejection
            {
              const autoRejBody = cooldownUntil
                ? `Your application to ${group.name} was automatically declined. Your reputation score (${score.toFixed(1)}) does not meet the minimum required score of ${minScore.toFixed(1)}. You may reapply after ${new Date(cooldownUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`
                : `Your application to ${group.name} was automatically declined. Your reputation score (${score.toFixed(1)}) does not meet the minimum required score of ${minScore.toFixed(1)}.`;
              await sendNotification(full.id, 'application_rejected', `Application to ${group.name} — Not Successful`, autoRejBody, `/portal/member-hq`);
            }
            return Response.json({
              error: 'score_threshold_not_met',
              message: `Your reputation score (${score.toFixed(1)}) does not meet the minimum required score of ${minScore.toFixed(1)} for this unit.`,
              ...(cooldownUntil ? { cooldown_until: cooldownUntil } : {}),
            }, { status: 403 });
          }
          // Not auto-rejecting, just warn (application still goes through)
        }
      }

      const app = await base44.asServiceRole.entities.MilsimApplication.create({
        group_id: parts[0], group_name: group.name,
        applicant_id: full.id, applicant_username: full.username,
        answers: body.answers ?? [], status: 'pending',
        service_dossier: dossier,
      });
      return Response.json(app, { status: 201 });
    }

    // PATCH /milsimApplications/:groupId/applications/:appId
    if (method === 'PATCH' && parts.length === 3 && parts[1] === 'applications') {
      const full = await getCallerUser(base44, req);
      if (!full) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const group = await base44.asServiceRole.entities.MilsimGroup.get(parts[0]);
      if (!group || group.owner_id !== full.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = { reviewed_by: full.id };
      if (body.status) updates.status = body.status;
      if (body.reviewNote !== undefined) updates.review_note = body.reviewNote;

      // On rejection: apply cooldown from group policy or override
      if (body.status === 'rejected') {
        let rawPol = group.app_policy ?? {}; if (typeof rawPol === "string") { try { rawPol = JSON.parse(rawPol); } catch { rawPol = {}; } } const policy = rawPol;
        const policyDays: number = policy.rejection_cooldown_days ?? 0;
        // Allow commander to override cooldown duration per-rejection
        const cooldownDays: number = typeof body.cooldown_days === 'number' ? body.cooldown_days : policyDays;
        if (cooldownDays > 0) {
          const cooldownUntil = new Date(Date.now() + cooldownDays * 86400000).toISOString();
          updates.rejection_cooldown_until = cooldownUntil;
          updates.rejection_cooldown_days = cooldownDays;
        }
      }

      const updated = await base44.asServiceRole.entities.MilsimApplication.update(parts[2], updates);

      if (body.status === 'approved') {
        const app = await base44.asServiceRole.entities.MilsimApplication.get(parts[2]);
        if (app) {
          const applicantUser = await base44.asServiceRole.entities.AppUser.get(app.applicant_id).catch(() => null);
          if (!applicantUser) return Response.json({ error: 'Applicant account not found.' }, { status: 404 });
          if (!applicantUser.email_verified) {
            return Response.json({ error: 'This applicant has not verified their email address. They must verify their email before being added to a roster.' }, { status: 403 });
          }
          await base44.asServiceRole.entities.MilsimRoster.create({
            group_id: parts[0], user_id: app.applicant_id, callsign: app.applicant_username,
          });
          await fireEvent(parts[0], "application.approved", {
            applicant_username: app.applicant_username, group_id: parts[0], application_id: parts[2],
          });
          await fireEvent(parts[0], "roster.member_joined", {
            callsign: app.applicant_username, user_id: app.applicant_id, group_id: parts[0],
          });
          // Notify applicant of acceptance — always send, include note if provided
          const reviewNote = body.reviewNote?.trim() ?? app.review_note?.trim() ?? '';
          const acceptBody = reviewNote
            ? `Congratulations — your application to ${group.name} has been accepted. You have been added to the roster.\n\nMessage from command: "${reviewNote}"`
            : `Congratulations — your application to ${group.name} has been accepted. You have been added to the roster.`;
          await sendNotification(
            app.applicant_id, 'application_accepted',
            `Application to ${group.name} — Accepted ✓`,
            acceptBody,
            `/portal/member-hq`
          );
        }
      } else if (body.status === 'rejected') {
        const app2 = await base44.asServiceRole.entities.MilsimApplication.get(parts[2]);
        if (app2) {
          await fireEvent(parts[0], "application.rejected", {
            applicant_username: app2.applicant_username, group_id: parts[0], application_id: parts[2],
          });
          // Notify applicant — always send rejection notification, with reason if commander provided one
          const rejNote = body.reviewNote?.trim() ?? app2.review_note?.trim() ?? '';
          let rejBody: string;
          if (rejNote && app2.rejection_cooldown_until) {
            const until = new Date(app2.rejection_cooldown_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            rejBody = `Your application to ${group.name} has been reviewed and was unsuccessful.\n\nReason from command: "${rejNote}"\n\nYou may reapply after ${until}.`;
          } else if (rejNote) {
            rejBody = `Your application to ${group.name} has been reviewed and was unsuccessful.\n\nReason from command: "${rejNote}"`;
          } else if (app2.rejection_cooldown_until) {
            const until = new Date(app2.rejection_cooldown_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            rejBody = `Your application to ${group.name} has been reviewed and was unsuccessful. You may reapply after ${until}.`;
          } else {
            rejBody = `Your application to ${group.name} has been reviewed and was unsuccessful. Please check the unit's selection criteria and consider reapplying in the future.`;
          }
          await sendNotification(
            app2.applicant_id, 'application_rejected',
            `Application to ${group.name} — Not Successful`,
            rejBody,
            `/portal/member-hq`
          );
        }
      }

      // Notify applicant of pipeline stage changes (reviewing / interview)
      if (body.status === 'reviewing') {
        const app3 = await base44.asServiceRole.entities.MilsimApplication.get(parts[2]);
        if (app3) {
          await sendNotification(
            app3.applicant_id, 'application_update',
            `Application to ${group.name} — Under Review`,
            `Your application to ${group.name} is now being reviewed by the command team. You will be notified of any further updates.`,
            `/portal/member-hq`
          );
        }
      } else if (body.status === 'interview') {
        const app4 = await base44.asServiceRole.entities.MilsimApplication.get(parts[2]);
        if (app4) {
          await sendNotification(
            app4.applicant_id, 'application_update',
            `Application to ${group.name} — Interview Stage`,
            `You have progressed to the interview stage for ${group.name}. A member of command will be in touch shortly. Check your messages in Comms.`,
            `/portal/member-hq`
          );
        }
      }

      return Response.json(updated);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error: any) {
    console.error('[milsimApplications]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
