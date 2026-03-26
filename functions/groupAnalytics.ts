import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const group_id = url.searchParams.get('group_id');

    if (!group_id) {
      return new Response(JSON.stringify({ error: 'group_id required' }), { status: 400 });
    }

    // Check Pro status
    const proRecords = await base44.asServiceRole.entities.CommanderPro.filter({ group_id });
    const isPro = proRecords.some((r: any) => r.status === 'active' || r.status === 'trialing');
    if (!isPro) {
      return new Response(JSON.stringify({ error: 'Commander Pro required', code: 'NOT_PRO' }), { status: 403 });
    }

    // Fetch all data in parallel
    const [roster, ops, aars, loas, awards] = await Promise.all([
      base44.asServiceRole.entities.MilsimRoster.filter({ group_id }),
      base44.asServiceRole.entities.MilsimOp.filter({ group_id }),
      base44.asServiceRole.entities.MilsimAAR.filter({ group_id }),
      base44.asServiceRole.entities.MilsimLOA.filter({ group_id }),
      base44.asServiceRole.entities.MilsimAward.filter({ group_id }),
    ]);

    const now = new Date();
    const msPerDay = 86400000;

    // ── Roster stats ──
    const activeRoster = roster.filter((m: any) => m.status !== 'inactive' && m.status !== 'discharged');
    const rosterByStatus = roster.reduce((acc: any, m: any) => {
      const s = m.status || 'active';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    // ── Ops stats ──
    const completedOps = ops.filter((o: any) => o.status === 'completed');
    const scheduledOps = ops.filter((o: any) => o.status === 'scheduled' || o.status === 'active');

    // Ops per month (last 6 months)
    const opsPerMonth: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      opsPerMonth[key] = 0;
    }
    completedOps.forEach((o: any) => {
      const d = new Date(o.scheduled_at || o.created_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key in opsPerMonth) opsPerMonth[key]++;
    });

    // ── Attendance (AAR participants) ──
    const attendancePerOp: Record<string, number> = {};
    aars.forEach((a: any) => {
      if (a.op_id && Array.isArray(a.participants)) {
        attendancePerOp[a.op_id] = (attendancePerOp[a.op_id] || 0) + (a.participants.length || 0);
      }
    });
    const attendanceValues = Object.values(attendancePerOp) as number[];
    const avgAttendance = attendanceValues.length
      ? Math.round(attendanceValues.reduce((a, b) => a + b, 0) / attendanceValues.length)
      : 0;

    // ── Attendance per month ──
    const attendancePerMonth: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      attendancePerMonth[key] = 0;
    }
    aars.forEach((a: any) => {
      const d = new Date(a.created_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key in attendancePerMonth && Array.isArray(a.participants)) {
        attendancePerMonth[key] += a.participants.length || 0;
      }
    });

    // ── Roster growth (join dates, last 6 months) ──
    const joinPerMonth: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      joinPerMonth[key] = 0;
    }
    roster.forEach((m: any) => {
      const d = new Date(m.join_date || m.created_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key in joinPerMonth) joinPerMonth[key]++;
    });

    // ── Active LOAs ──
    const activeLoas = loas.filter((l: any) => l.status === 'Active' || l.status === 'Extension Requested');

    // ── Awards breakdown ──
    const awardsByType: Record<string, number> = {};
    awards.forEach((a: any) => {
      const name = a.award_name || 'Unknown';
      awardsByType[name] = (awardsByType[name] || 0) + 1;
    });
    const topAwards = Object.entries(awardsByType)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // ── Top operators (by ops_count) ──
    const topOperators = [...activeRoster]
      .sort((a: any, b: any) => (b.ops_count || 0) - (a.ops_count || 0))
      .slice(0, 5)
      .map((m: any) => ({ callsign: m.callsign, ops_count: m.ops_count || 0 }));

    // ── Duty status breakdown ──
    const dutyBreakdown: Record<string, number> = { active: 0, 'on-leave': 0, deployed: 0, mia: 0, other: 0 };
    activeRoster.forEach((m: any) => {
      const s = m.duty_status || 'active';
      if (s in dutyBreakdown) dutyBreakdown[s]++;
      else dutyBreakdown['other']++;
    });

    // ── AAR outcomes ──
    const outcomes: Record<string, number> = { victory: 0, defeat: 0, draw: 0, incomplete: 0 };
    aars.forEach((a: any) => {
      const o = (a.outcome || 'incomplete').toLowerCase();
      if (o in outcomes) outcomes[o]++;
      else outcomes['incomplete']++;
    });

    return new Response(JSON.stringify({
      summary: {
        total_roster: roster.length,
        active_roster: activeRoster.length,
        total_ops: ops.length,
        completed_ops: completedOps.length,
        scheduled_ops: scheduledOps.length,
        total_aars: aars.length,
        avg_attendance: avgAttendance,
        active_loas: activeLoas.length,
        total_awards: awards.length,
        op_win_rate: aars.length ? Math.round((outcomes.victory / aars.length) * 100) : 0,
      },
      charts: {
        ops_per_month: opsPerMonth,
        attendance_per_month: attendancePerMonth,
        join_per_month: joinPerMonth,
        roster_by_status: rosterByStatus,
        duty_breakdown: dutyBreakdown,
        aar_outcomes: outcomes,
      },
      top_operators: topOperators,
      top_awards: topAwards,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
