// ─── Org Chart ────────────────────────────────────────────────────────────────
function OrgChartTab({ group }: any) {
  const rankById = Object.fromEntries((group.ranks as Rank[]).map((r: Rank) => [r.id, r]));
  const roleById = Object.fromEntries((group.roles as Role[]).map((r: Role) => [r.id, r]));
  const sorted = [...(group.roster as RosterEntry[])].sort((a, b) => {
    const ra = a.rankId ? (rankById[a.rankId]?.tier ?? 0) : 0;
    const rb = b.rankId ? (rankById[b.rankId]?.tier ?? 0) : 0;
    return rb - ra;
  });
  const byTier = sorted.reduce<Record<number, RosterEntry[]>>((acc, entry) => {
    const tier = entry.rankId ? (rankById[entry.rankId]?.tier ?? -1) : -1;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(entry);
    return acc;
  }, {});
  const tiers = Object.keys(byTier).map(Number).sort((a, b) => b - a);
  if (sorted.length === 0) return (
    <div className="text-center py-16 border border-dashed border-border rounded-lg text-muted-foreground"><GitBranch className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-display text-sm uppercase tracking-widest">Roster is empty</p></div>
  );
  return (
    <div className="max-w-4xl space-y-6">
      <p className="text-xs text-muted-foreground font-sans">Chain of command — organized by rank tier (highest first).</p>
      <div className="space-y-6">
        {tiers.map(tier => (
          <div key={tier} className="space-y-2">
            <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1">{tier >= 0 ? `Tier ${tier} — ${rankById[byTier[tier][0]?.rankId ?? -1]?.name ?? ""}` : "No Rank"}</p>
            <div className="flex flex-wrap gap-3">
              {byTier[tier].map(entry => (
                <div key={entry.id} className="bg-card border border-border rounded-lg px-4 py-3 min-w-[120px] text-center">
                  <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-2"><span className="text-primary font-display font-black text-sm">{entry.callsign.charAt(0)}</span></div>
                  <p className="font-display font-bold uppercase tracking-widest text-xs text-foreground">{entry.callsign}</p>
                  {entry.rankId && <p className="text-xs text-primary mt-0.5">{rankById[entry.rankId]?.abbreviation ?? rankById[entry.rankId]?.name}</p>}
                  {entry.roleId && <p className="text-xs text-muted-foreground">{roleById[entry.roleId]?.name}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Readiness ────────────────────────────────────────────────────────────────
function ReadinessTab({ group }: any) {
  const [readiness, setReadiness] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch<any>(`/api/stats/readiness/${group.id}`)
      .then(data => { setReadiness(data); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [group.id]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error || !readiness) return (
    <div className="text-center py-16 border border-dashed border-border rounded-lg text-muted-foreground">
      <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="font-display text-sm uppercase tracking-widest">Readiness data unavailable</p>
      <p className="text-xs mt-2">Add roster members and log operations to generate readiness data.</p>
    </div>
  );

  const sc = readiness.status === "green" ? "text-green-400" : readiness.status === "amber" ? "text-yellow-400" : "text-red-400";
  const bc = readiness.status === "green" ? "bg-green-500" : readiness.status === "amber" ? "bg-yellow-500" : "bg-red-500";

  // Colour scheme: TIER I=green, TIER II=yellow, TIER III=amber, TIER IV=red, TIER V=dark red
  const TIER_META: Record<string, { label: string; colour: string; bg: string; border: string; badge: string; desc: string }> = {
    "TIER I":   { label: "Elite",              colour: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/40",  badge: "bg-green-500/20 text-green-300 border-green-400/50",    desc: "Extensive op record, high troop experience, strong AAR discipline, and comprehensive training documentation." },
    "TIER II":  { label: "Operational",        colour: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/40", badge: "bg-yellow-400/20 text-yellow-300 border-yellow-400/50", desc: "Active unit with solid reputation, consistent operational output, and documented training resources." },
    "TIER III": { label: "Capable",            colour: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/40",  badge: "bg-amber-500/20 text-amber-400 border-amber-500/40",    desc: "Building op history and troop experience. Some training doctrine in place." },
    "TIER IV":  { label: "Limited Capability", colour: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/40",    badge: "bg-red-500/20 text-red-400 border-red-500/40",          desc: "New or low-activity unit with minimal documented record and few training resources." },
    "TIER V":   { label: "Under Developed",    colour: "text-red-700",    bg: "bg-red-900/10",    border: "border-red-900/40",    badge: "bg-red-900/20 text-red-600 border-red-900/50",          desc: "No established operational record. Unit has not yet demonstrated capability." },
  };

  const tier = readiness.op_capability_tier ?? "TIER V";
  const tm = TIER_META[tier] ?? TIER_META["TIER V"];

  // Score breakdown for transparency
  const scoreBreakdown = [
    { label: "Manpower",            max: 20, note: `${readiness.total} roster members` },
    { label: "Member Activity",     max: 15, note: `${readiness.active_this_month}/${readiness.total} active (30d)` },
    { label: "Operations History",  max: 20, note: `${readiness.total_ops ?? 0} ops logged` },
    { label: "Op Recency",          max: 10, note: readiness.days_since_last_op != null ? `Last op ${readiness.days_since_last_op}d ago` : "No ops" },
    { label: "AAR Discipline",      max: 10, note: `${readiness.completed_ops ?? 0} AARs for ${readiness.total_ops ?? 0} ops` },
    { label: "Training Doctrine",   max: 15, note: `Knowledge factor ${readiness.training?.knowledge_factor ?? 0}/100` },
    { label: "Discord Linked",      max: 5,  note: readiness.has_discord ? "Linked" : "Not linked" },
    { label: "Page Maintenance",    max: 5,  note: readiness.days_since_page_update != null ? `Updated ${readiness.days_since_page_update}d ago` : "Never updated" },
    { label: "Reputation / Reviews",max: 5,  note: `${readiness.review_count} review${readiness.review_count !== 1 ? "s" : ""}, avg ${readiness.avg_rep_score || "—"}` },
  ];

  return (
    <div className="max-w-2xl space-y-5">

      {/* ── Readiness header ──────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-display font-bold uppercase tracking-widest">Unit Readiness</h3>
          <div className="flex items-center gap-3">
            <span className={`font-display font-black text-xl uppercase ${sc}`}>{readiness.status.toUpperCase()}</span>
            <span className={`text-xs font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded border ${tm.badge}`}>
              ⊕ {tier}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
            <span>Composite Readiness Score</span><span>{readiness.readiness_pct} / 100</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${bc}`} style={{ width: `${readiness.readiness_pct}%` }} />
          </div>
          <p className={`text-right text-xs font-display font-bold ${sc}`}>{readiness.readiness_pct}% COMPOSITE</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border text-center">
          {[
            { label: "Total", value: readiness.total, col: "" },
            { label: "Active 7d", value: readiness.active_this_week, col: "text-green-400" },
            { label: "Active 30d", value: readiness.active_this_month, col: "text-blue-400" },
            { label: "Ops Logged", value: readiness.total_ops ?? 0, col: "text-primary" },
          ].map(s => (
            <div key={s.label}>
              <p className={`text-xl font-display font-bold ${s.col || "text-foreground"}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-display uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Readiness Flags ───────────────────────────────────────────────── */}
      {readiness.flags && readiness.flags.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Readiness Flags</p>
          {readiness.flags.map((flag: any) => (
            <div key={flag.code} className={`rounded-lg border px-4 py-3 flex gap-3 ${
              flag.severity === "red" ? "border-red-500/40 bg-red-500/5" : "border-yellow-500/30 bg-yellow-500/5"
            }`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${flag.severity === "red" ? "bg-red-500" : "bg-yellow-400"}`} />
              <div>
                <p className={`font-display font-bold uppercase tracking-widest text-xs ${flag.severity === "red" ? "text-red-400" : "text-yellow-400"}`}>
                  {flag.label}
                </p>
                <p className="text-xs text-muted-foreground font-sans mt-0.5 leading-relaxed">{flag.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Score Breakdown ───────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Score Breakdown — How Your {readiness.readiness_pct}pts Were Calculated</p>
        <div className="space-y-2">
          {scoreBreakdown.map(row => (
            <div key={row.label} className="flex items-center gap-3 text-xs">
              <span className="w-40 shrink-0 font-display font-bold uppercase tracking-widest text-muted-foreground text-[10px]">{row.label}</span>
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary/40 rounded-full" style={{ width: `${Math.min(100, (row.max / 100) * 100)}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground font-display shrink-0 w-8 text-right">/{row.max}</span>
              <span className="text-[10px] text-muted-foreground font-sans shrink-0 hidden sm:block">{row.note}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground font-sans pt-1 border-t border-border/50">
          Max score = 100pts. Green ≥75 · Amber 45–74 · Red &lt;45. Units below squad strength (9 members) are forced Red regardless of score.
        </p>
      </div>

      {/* ── Operational Capability Tier ───────────────────────────────────── */}
      <div className={`rounded-lg border p-5 space-y-3 ${tm.bg} ${tm.border}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Operational Capability Tier</p>
          <span className={`text-xs font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded border ${tm.badge}`}>
            ⊕ {tier} — {tm.label}
          </span>
        </div>
        <p className={`text-sm font-sans leading-relaxed ${tm.colour}`}>{tm.desc}</p>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-display uppercase tracking-widest text-muted-foreground">
            <span>Op Capability Score</span><span>{readiness.op_cap_score ?? 0} / 100</span>
          </div>
          <div className="h-2 bg-secondary/60 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${tm.badge.includes("blue") ? "bg-blue-500" : tm.badge.includes("yellow") ? "bg-yellow-400" : tm.badge.includes("slate") ? "bg-slate-400" : tm.badge.includes("orange") ? "bg-orange-500" : "bg-muted-foreground"}`}
              style={{ width: `${Math.min(100, readiness.op_cap_score ?? 0)}%` }} />
          </div>
        </div>
        {/* Tier ladder */}
        <div className="grid grid-cols-5 gap-1 pt-2 border-t border-border/40">
          {(["TIER V","TIER IV","TIER III","TIER II","TIER I"] as const).map(t => {
            const m = TIER_META[t];
            const active = t === tier;
            return (
              <div key={t} className={`rounded p-1.5 text-center transition-all ${active ? `${m.bg} ${m.border} border` : "opacity-30"}`}>
                <p className={`text-[9px] font-display font-bold uppercase tracking-widest ${active ? m.colour : "text-muted-foreground"}`}>{t}</p>
                <p className={`text-[8px] font-sans mt-0.5 ${active ? m.colour : "text-muted-foreground"} hidden sm:block`}>{m.label}</p>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground font-sans">
          Tier is calculated from: ops logged (30pts) · troop experience (25pts) · roster size (15pts) · AAR culture (10pts) · training doctrine (20pts).
          <br/>Blue = Platinum (Tier I) · Gold (Tier II) · Silver (Tier III) · Bronze (Tier IV) · Forming.
        </p>
      </div>

      {/* ── Rep stats ─────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg p-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Avg Rep Score</p>
          <p className="text-2xl font-display font-bold text-foreground">{readiness.avg_rep_score || "—"}</p>
          <p className="text-[10px] text-muted-foreground">{readiness.review_count} review{readiness.review_count !== 1 ? "s" : ""}</p>
        </div>
        <div>
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Avg Experience</p>
          <p className="text-2xl font-display font-bold text-foreground">{readiness.avg_experience > 0 ? `${readiness.avg_experience}/10` : "—"}</p>
          <p className="text-[10px] text-muted-foreground">from troop ratings</p>
        </div>
      </div>

      {/* ── Training Knowledge Assessment ─────────────────────────────────── */}
      {readiness.training && readiness.training.knowledge_grade !== 'none' && (
        <div className={`border rounded-lg p-5 space-y-2 ${
          readiness.training.knowledge_grade === 'expert'     ? 'border-blue-400/40 bg-blue-400/5' :
          readiness.training.knowledge_grade === 'proficient' ? 'border-yellow-500/40 bg-yellow-500/5' :
          readiness.training.knowledge_grade === 'developing' ? 'border-slate-400/40 bg-slate-400/5' :
          'border-orange-500/30 bg-orange-500/5'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-display font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <Brain className="w-4 h-4" /> Training Knowledge
            </span>
            <span className={`text-xs font-display font-bold px-2 py-0.5 rounded border ${
              readiness.training.knowledge_grade === 'expert'     ? 'text-blue-300 border-blue-400/40' :
              readiness.training.knowledge_grade === 'proficient' ? 'text-yellow-400 border-yellow-500/40' :
              readiness.training.knowledge_grade === 'developing' ? 'text-slate-300 border-slate-400/40' :
              'text-orange-500 border-orange-600/40'
            }`}>{readiness.training.knowledge_label}</span>
          </div>
          <p className="text-xs text-muted-foreground font-sans leading-relaxed">{readiness.training.knowledge_detail}</p>
          <div className="flex gap-3 text-xs text-muted-foreground font-sans pt-1 border-t border-border/50">
            <span>{readiness.training.doc_count} docs · {readiness.training.total_pages} pages · Knowledge factor: {readiness.training.knowledge_factor}/100</span>
          </div>
        </div>
      )}
      {readiness.training && readiness.training.knowledge_grade === 'none' && (
        <div className="border border-dashed border-orange-500/30 bg-orange-500/5 rounded-lg p-4 text-xs text-orange-400 font-sans flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>No training documents filed. Upload SOPs, TTPs, and drills in the <strong>Training Docs</strong> tab to improve your capability tier score.</span>
        </div>
      )}

    </div>
  );
}

// ─── Reputation / Service Files Tab ──────────────────────────────────────────
function ReputationTab({ group }: any) {
  const [roster, setRoster] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [repData, setRepData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ activity: 7, attitude: 7, experience: 5, discipline: 7, overall_vote: "commend", blacklisted: false, blacklist_reason: "", notes: "" });
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    apiFetch<any>(`/api/milsim-groups/${group.id}/full`)
      .then(g => setRoster(g.roster ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [group.id]);

  const loadRep = async (member: any) => {
    setSelected(member);
    if (repData[member.userId]) return;
    try {
      const data = await apiFetch<any>(`/api/reputation/${member.userId}`);
      setRepData(prev => ({ ...prev, [member.userId]: data }));
    } catch {}
  };

  const submitReview = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/reputation/${selected.userId}`, {
        method: "POST",
        body: JSON.stringify({
          ...form,
          group_id: group.id,
          group_name: group.name,
          blacklist_reason: form.blacklisted ? form.blacklist_reason : undefined,
        }),
      });
      // Refresh rep
      const updated = await apiFetch<any>(`/api/reputation/${selected.userId}`);
      setRepData(prev => ({ ...prev, [selected.userId]: updated }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: "Review submitted", description: `Service file for ${selected.callsign} updated.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const GRADE_COLORS: Record<string, string> = {
    ELITE: "#fbbf24", TRUSTED: "#4ade80", STANDARD: "#60a5fa",
    CAUTION: "#fb923c", "HIGH RISK": "#f87171", BLACKLISTED: "#ef4444", UNRATED: "#6b7280",
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h3 className="font-display font-bold text-lg uppercase tracking-widest">Member Service Files</h3>
        <p className="text-sm text-muted-foreground font-sans mt-1">
          As a unit commander, you can rate your members' performance. These scores are <strong>public</strong> and visible to all commanders across the registry — they help filter out unit hoppers and inactive operators.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member list */}
        <div className="space-y-2">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-3">Roster ({roster.length})</p>
          {roster.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground">
              <p className="text-sm font-display uppercase tracking-widest">No roster members</p>
            </div>
          ) : (
            roster.map((m: any) => {
              const rep = repData[m.userId]?.score ?? null;
              const isSelected = selected?.id === m.id;
              return (
                <button key={m.id} onClick={() => loadRep(m)}
                  className={`w-full text-left flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isSelected ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30 bg-card"
                  }`}>
                  <div>
                    <p className="font-display font-bold uppercase tracking-wider text-sm text-foreground">{m.callsign}</p>
                    {m.rankName && <p className="text-xs text-muted-foreground">{m.rankName}</p>}
                  </div>
                  {rep ? (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black" style={{ color: GRADE_COLORS[rep.grade] ?? "#6b7280" }}>{rep.overall}</span>
                      <span className="text-[9px] font-bold uppercase" style={{ color: GRADE_COLORS[rep.grade] ?? "#6b7280" }}>{rep.grade}</span>
                    </div>
                  ) : (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Unrated</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Rating panel */}
        <div>
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-lg text-muted-foreground text-sm text-center px-6">
              <Star className="w-8 h-8 mb-3 opacity-30" />
              <p className="font-display font-bold uppercase tracking-widest">Select a member to view or submit their service assessment</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-black uppercase tracking-widest text-lg">{selected.callsign}</p>
                  {repData[selected.userId]?.score && (
                    <p className="text-xs font-bold uppercase" style={{ color: GRADE_COLORS[repData[selected.userId].score.grade] }}>
                      {repData[selected.userId].score.grade} · {repData[selected.userId].score.overall}/100
                    </p>
                  )}
                </div>
                {repData[selected.userId]?.score?.blacklisted && (
                  <div className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/30 px-2 py-1 rounded">
                    ⚠ BLACKLISTED
                  </div>
                )}
              </div>

              {/* Existing reviews summary */}
              {repData[selected.userId] && (
                <div className="text-xs text-muted-foreground font-sans">
                  {repData[selected.userId].reviews?.length ?? 0} review(s) on record —{" "}
                  {repData[selected.userId].score?.commends ?? 0} commend(s),{" "}
                  {repData[selected.userId].score?.flags ?? 0} flag(s)
                </div>
              )}

              <div className="border-t border-border pt-4 space-y-3">
                <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Your Assessment</p>

                {/* Score sliders */}
                {[
                  { key: "activity", label: "Activity", hint: "How active are they in ops and events?" },
                  { key: "attitude", label: "Attitude", hint: "Conduct, teamwork, professionalism." },
                  { key: "experience", label: "Experience", hint: "Tactical knowledge and skill level." },
                  { key: "discipline", label: "Discipline", hint: "Follows orders, SOP compliance." },
                ].map(({ key, label, hint }) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-display font-bold uppercase tracking-widest">{label}</label>
                        <p className="text-[9px] text-muted-foreground">{hint}</p>
                      </div>
                      <span className="text-sm font-bold font-mono text-foreground w-6 text-right">
                        {(form as any)[key]}
                      </span>
                    </div>
                    <input type="range" min={1} max={10} value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) }))}
                      className="w-full accent-primary" />
                    <div className="flex justify-between text-[8px] text-muted-foreground"><span>1</span><span>10</span></div>
                  </div>
                ))}

                {/* Overall vote */}
                <div>
                  <label className="text-xs font-display font-bold uppercase tracking-widest mb-2 block">Overall Vote</label>
                  <div className="flex gap-2">
                    {[
                      { v: "commend", label: "✓ Commend", cls: "text-green-400 border-green-500/40 bg-green-500/10" },
                      { v: "neutral", label: "— Neutral", cls: "text-slate-400 border-border bg-secondary" },
                      { v: "flag",    label: "⚑ Flag",    cls: "text-red-400 border-red-500/40 bg-red-500/10" },
                    ].map(({ v, label, cls }) => (
                      <button key={v} type="button" onClick={() => setForm(f => ({ ...f, overall_vote: v }))}
                        className={`flex-1 py-2 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${
                          form.overall_vote === v ? cls : "border-border text-muted-foreground"
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-display font-bold uppercase tracking-widest mb-1 block">Notes (optional)</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Additional context or observations..."
                    className="mf-input resize-none text-xs" />
                </div>

                {/* Blacklist toggle */}
                <div className="border border-red-500/20 rounded-lg p-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.blacklisted} onChange={e => setForm(f => ({ ...f, blacklisted: e.target.checked }))}
                      className="accent-red-500" />
                    <span className="text-xs font-display font-bold uppercase tracking-widest text-red-400">Blacklist this operator</span>
                  </label>
                  {form.blacklisted && (
                    <input value={form.blacklist_reason} onChange={e => setForm(f => ({ ...f, blacklist_reason: e.target.value }))}
                      placeholder="Reason for blacklist (visible publicly)..."
                      className="mf-input text-xs" />
                  )}
                </div>

                <button onClick={submitReview} disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm py-2.5 rounded clip-angled-sm transition-all disabled:opacity-60">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? "✓ Saved" : <><Star className="w-4 h-4" /> Submit Assessment</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Training Docs Tab ────────────────────────────────────────────────────────
const DOC_TYPES = ["SOP", "TTP", "Field Manual", "Drill", "Reference", "Rules of Engagement", "WARNO", "OPORD", "FRAGO", "Other"] as const;

function TrainingDocsTab({ group, showMsg }: any) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [assessment, setAssessment] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "", description: "", doc_type: "SOP" as typeof DOC_TYPES[number],
    last_reviewed_at: new Date().toISOString().split("T")[0],
  });

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any[]>(`/api/training-docs/${group.id}`);
      setDocs(data ?? []);
    } catch { setDocs([]); } finally { setLoading(false); }
  }, [group.id]);

  const loadAssessment = useCallback(async () => {
    try {
      const r = await apiFetch<any>(`/api/stats/readiness/${group.id}`);
      if (r?.training) setAssessment(r.training);
    } catch {}
  }, [group.id]);

  useEffect(() => { loadDocs(); loadAssessment(); }, [loadDocs, loadAssessment]);

  const uploadDoc = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !form.title.trim()) {
      showMsg(false, "Title and file are required."); return;
    }
    const allowed = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain", "text/markdown"];
    if (!allowed.includes(file.type)) {
      showMsg(false, "Only PDF, DOCX, DOC, TXT, or MD files are supported."); return;
    }
    if (file.size > 20 * 1024 * 1024) {
      showMsg(false, "File must be under 20MB."); return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("group_id", group.id);
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("doc_type", form.doc_type);
      fd.append("last_reviewed_at", form.last_reviewed_at ? new Date(form.last_reviewed_at).toISOString() : new Date().toISOString());
      fd.append("uploaded_by", user?.id ?? "");
      fd.append("uploaded_by_username", (user as any)?.username ?? "");
      const result = await apiFetch<any>("/api/training-docs/upload", { method: "POST", body: fd, isFormData: true });
      if (result?.id) {
        setDocs(prev => [result, ...prev]);
        setForm({ title: "", description: "", doc_type: "SOP", last_reviewed_at: new Date().toISOString().split("T")[0] });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setShowForm(false);
        showMsg(true, "Training document uploaded.");
        loadAssessment();
      } else { showMsg(false, "Upload failed — try again."); }
    } catch (e: any) { showMsg(false, e.message ?? "Upload failed."); } finally { setUploading(false); }
  };

  const deleteDoc = async (id: string) => {
    if (!confirm("Remove this training document?")) return;
    try {
      await apiFetch(`/api/training-docs/${group.id}/${id}`, { method: "DELETE" });
      setDocs(prev => prev.filter(d => d.id !== id));
      showMsg(true, "Document removed.");
      loadAssessment();
    } catch { showMsg(false, "Failed to remove document."); }
  };

  const markReviewed = async (doc: any) => {
    try {
      const updated = await apiFetch<any>(`/api/training-docs/${group.id}/${doc.id}`, {
        method: "PATCH", body: JSON.stringify({ last_reviewed_at: new Date().toISOString() }),
      });
      setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, ...updated } : d));
      showMsg(true, "Marked as reviewed.");
      loadAssessment();
    } catch { showMsg(false, "Failed to update."); }
  };

  const gradeColor: Record<string, string> = {
    expert:     "text-slate-200 border-slate-300/60 bg-slate-200/10",
    proficient: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
    developing: "text-blue-300 border-blue-300/40 bg-blue-300/10",
    minimal:    "text-orange-500 border-orange-600/40 bg-orange-500/10",
    none:       "text-muted-foreground border-border bg-secondary/40",
  };
  const gradeIcon: Record<string, string> = {
    expert: "⬡", proficient: "★", developing: "◆", minimal: "▲", none: "●",
  };

  const nowMs = Date.now();
  const isStale = (doc: any) => {
    const ref = doc.last_reviewed_at ?? doc.updated_date ?? doc.created_date;
    if (!ref) return true;
    return (nowMs - new Date(ref).getTime()) > 180 * 86_400_000;
  };

  const docTypeColor: Record<string, string> = {
    "SOP":                  "text-green-400 border-green-500/30 bg-green-500/10",
    "TTP":                  "text-blue-400 border-blue-500/30 bg-blue-500/10",
    "Field Manual":         "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    "Drill":                "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    "WARNO":                "text-orange-400 border-orange-500/30 bg-orange-500/10",
    "OPORD":                "text-orange-400 border-orange-500/30 bg-orange-500/10",
    "FRAGO":                "text-orange-300 border-orange-400/30 bg-orange-400/10",
    "Reference": "text-purple-400 border-purple-500/30 bg-purple-500/10",
    "Rules of Engagement": "text-red-400 border-red-500/30 bg-red-500/10",
    "Other": "text-muted-foreground border-border bg-secondary/40",
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Assessment Banner */}
      {assessment && (
        <div className={`border rounded-lg p-5 space-y-2 ${gradeColor[assessment.knowledge_grade] ?? gradeColor.none}`}>
          <div className="flex items-center gap-3 flex-wrap">
            <Brain className="w-5 h-5 shrink-0" />
            <span className="font-display font-black uppercase tracking-widest text-sm">
              {gradeIcon[assessment.knowledge_grade]} {assessment.knowledge_label}
            </span>
            <span className="ml-auto font-display font-bold text-xs opacity-70">
              Knowledge Factor: {assessment.knowledge_factor}/100
            </span>
          </div>
          <p className="text-xs font-sans leading-relaxed opacity-85">{assessment.knowledge_detail}</p>
          <div className="flex flex-wrap gap-3 pt-1 text-xs font-sans opacity-70">
            <span>{assessment.doc_count} document{assessment.doc_count !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span>{assessment.total_pages} page{assessment.total_pages !== 1 ? "s" : ""} total</span>
            <span>·</span>
            <span>Avg depth: {assessment.avg_depth_score}/100</span>
            {assessment.outdated_count > 0 && <><span>·</span><span className="text-orange-400">{assessment.outdated_count} outdated</span></>}
          </div>
          {/* Coverage badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { label: "SOPs", has: assessment.has_sop },
              { label: "TTPs", has: assessment.has_ttp },
              { label: "Field Manuals", has: assessment.has_fm },
              { label: "Drills", has: assessment.has_drill },
            ].map(b => (
              <span key={b.label} className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${b.has ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-border text-muted-foreground bg-secondary/30 opacity-50"}`}>
                {b.has ? "✓" : "✗"} {b.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display font-bold uppercase tracking-widest">Training Documents</h3>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Upload SOPs, TTPs, drills, and references. Depth and recency directly influence your unit's capability tier.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs rounded clip-angled-sm transition-all">
          <Plus className="w-3.5 h-3.5" /> Upload Doc
        </button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/30 rounded-lg p-5 space-y-4">
          <h4 className="font-display font-bold uppercase tracking-widest text-sm text-primary">New Training Document</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Document Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Section Attack Procedure SOP" className="mf-input w-full" />
            </div>
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Document Type</label>
              <select value={form.doc_type} onChange={e => setForm(f => ({ ...f, doc_type: e.target.value as any }))} className="mf-input w-full">
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Effective / Reviewed Date</label>
              <input type="date" value={form.last_reviewed_at} onChange={e => setForm(f => ({ ...f, last_reviewed_at: e.target.value }))} className="mf-input w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Description (optional)</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="Brief summary of what this document covers..." className="mf-input w-full resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">File * (PDF, DOCX, DOC, TXT, MD — max 20MB)</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground font-display font-bold uppercase tracking-wider text-xs rounded transition-all">
                  <Upload className="w-3.5 h-3.5" /> Choose File
                </button>
                <span className="text-xs text-muted-foreground font-sans" id="file-label">No file selected</span>
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.md"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { const lbl = document.getElementById('file-label'); if (lbl) lbl.textContent = f.name; } }} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-border hover:border-destructive/50 text-muted-foreground hover:text-destructive font-display font-bold uppercase tracking-wider text-xs rounded transition-all">
              Cancel
            </button>
            <button onClick={uploadDoc} disabled={uploading}
              className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs rounded clip-angled-sm transition-all disabled:opacity-50">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Docs List */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
      ) : docs.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-border rounded-lg text-muted-foreground">
          <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-display text-sm uppercase tracking-widest">No Training Documents</p>
          <p className="text-xs mt-2 font-sans">Upload your SOPs, TTPs, and drill references to build your knowledge baseline.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => {
            const stale = isStale(doc);
            return (
              <div key={doc.id} className={`bg-card border rounded-lg p-4 flex items-start gap-4 transition-colors ${stale ? "border-orange-500/30" : "border-border"}`}>
                <div className="shrink-0 mt-0.5">
                  <FileCheck className={`w-5 h-5 ${stale ? "text-orange-400" : "text-primary"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-display font-bold text-sm">{doc.title}</span>
                    <span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${docTypeColor[doc.doc_type] ?? docTypeColor.Other}`}>
                      {doc.doc_type}
                    </span>
                    {stale && (
                      <span className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-orange-500/40 text-orange-400 bg-orange-500/10">
                        <AlertTriangle className="w-2.5 h-2.5" /> Outdated
                      </span>
                    )}
                  </div>
                  {doc.description && <p className="text-xs text-muted-foreground font-sans mb-2 line-clamp-2">{doc.description}</p>}
                  <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground font-sans">
                    {doc.page_count && <span>{doc.page_count} pages</span>}
                    {doc.file_name && <span>{doc.file_name}</span>}
                    {doc.file_size_bytes && <span>{(doc.file_size_bytes / 1024).toFixed(0)} KB</span>}
                    {doc.depth_score && <span>Depth: {doc.depth_score}/100</span>}
                    <span>Reviewed: {doc.last_reviewed_at ? format(new Date(doc.last_reviewed_at), "dd MMM yyyy") : "—"}</span>
                    <span>By: {doc.uploaded_by_username ?? "—"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="View document">
                      <Eye className="w-4 h-4" />
                    </a>
                  )}
                  {stale && (
                    <button onClick={() => markReviewed(doc)}
                      className="p-1.5 text-muted-foreground hover:text-green-400 transition-colors" title="Mark as reviewed today">
                      <FileCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => deleteDoc(doc.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOA MANAGER TAB
// ─────────────────────────────────────────────────────────────────────────────
const LOA_REASONS = [
  "Personal", "Medical", "Work / Career", "Family", "Travel",
  "Education", "Mental Health", "Technical Issues", "Military Service", "Other"
] as const;

function LOATab({ group, showMsg }: { group: any; showMsg: (m: string, t?: "success"|"error") => void }) {
  const { user } = useAuth();
  const [loas, setLoas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [extTarget, setExtTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    roster_id: "", callsign: "", reason_category: "Personal" as typeof LOA_REASONS[number],
    reason_detail: "", start_date: new Date().toISOString().split("T")[0],
    end_date: "", notes: ""
  });
  const [extForm, setExtForm] = useState({ extension_requested_until: "", extension_reason: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/loa?path=list&group_id=${group.id}`);
      setLoas(data.loas ?? []);
    } catch { setLoas([]); }
    setLoading(false);
  }, [group.id]);

  useEffect(() => { load(); }, [load]);

  const isCommander = group.roster?.some((r: any) =>
    r.user_id === user?.id && (r.role === "commander" || r.notes?.includes("commander") || group.owner_id === user?.id)
  ) || group.owner_id === user?.id;

  const rosterOptions = group.roster ?? [];

  const grantLOA = async () => {
    if (!form.roster_id || !form.end_date) { showMsg("Select member and end date", "error"); return; }
    setSaving(true);
    try {
      await apiFetch("/loa?path=grant", { method: "POST", body: JSON.stringify({
        group_id: group.id, ...form,
        granted_by: user?.id, granted_by_username: user?.username
      }) });
      showMsg("LOA granted ✓", "success");
      setShowForm(false);
      setForm({ roster_id: "", callsign: "", reason_category: "Personal", reason_detail: "", start_date: new Date().toISOString().split("T")[0], end_date: "", notes: "" });
      load();
    } catch (e: any) { showMsg(e.message, "error"); }
    setSaving(false);
  };

  const revoke = async (id: string) => {
    if (!confirm("Revoke this LOA?")) return;
    try {
      await apiFetch("/loa?path=revoke", { method: "POST", body: JSON.stringify({ loa_id: id }) });
      showMsg("LOA revoked", "success"); load();
    } catch (e: any) { showMsg(e.message, "error"); }
  };

  const approveExt = async (loa: any, approve: boolean) => {
    try {
      await apiFetch("/loa?path=review-extension", { method: "POST", body: JSON.stringify({
        loa_id: loa.id, approve, reviewed_by: user?.username
      }) });
      showMsg(approve ? "Extension approved ✓" : "Extension denied", "success"); load();
    } catch (e: any) { showMsg(e.message, "error"); }
  };

  const requestExt = async () => {
    if (!extForm.extension_requested_until || !extForm.extension_reason) { showMsg("Fill all fields", "error"); return; }
    try {
      await apiFetch("/loa?path=request-extension", { method: "POST", body: JSON.stringify({
        loa_id: extTarget.id, ...extForm
      }) });
      showMsg("Extension request submitted", "success"); setExtTarget(null); load();
    } catch (e: any) { showMsg(e.message, "error"); }
  };

  const statusColor: Record<string, string> = {
    Active: "text-green-400 border-green-500/30 bg-green-500/10",
    Expired: "text-muted-foreground border-border bg-secondary/30",
    Revoked: "text-red-400 border-red-500/30 bg-red-500/10",
    "Extension Requested": "text-amber-400 border-amber-500/30 bg-amber-500/10",
  };

  const myLOA = loas.find(l => l.user_id === user?.id && l.status === "Active");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg uppercase tracking-widest">Leave of Absence Manager</h2>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Active LOAs freeze reputation decay and activity tracking for the duration.</p>
        </div>
        {isCommander && (
          <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/40 text-primary rounded font-display text-xs uppercase tracking-widest hover:bg-primary/30 transition-colors">
            <PlaneTakeoff className="w-3.5 h-3.5" /> Grant LOA
          </button>
        )}
      </div>

      {/* Grant Form */}
      {showForm && isCommander && (
        <div className="border border-primary/30 rounded-lg p-4 bg-primary/5 space-y-4">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-primary">New LOA</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MField label="Member">
              <select value={form.roster_id} onChange={e => {
                const r = rosterOptions.find((x: any) => x.id === e.target.value);
                setForm(f => ({ ...f, roster_id: e.target.value, callsign: r?.callsign ?? "" }));
              }} className="mf-input w-full">
                <option value="">— Select member —</option>
                {rosterOptions.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.callsign}</option>
                ))}
              </select>
            </MField>
            <MField label="Reason Category">
              <select value={form.reason_category} onChange={e => setForm(f => ({ ...f, reason_category: e.target.value as any }))} className="mf-input w-full">
                {LOA_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </MField>
            <MField label="Start Date">
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="mf-input w-full" />
            </MField>
            <MField label="End Date">
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="mf-input w-full" />
            </MField>
            <MField label="Details (optional)">
              <input type="text" value={form.reason_detail} onChange={e => setForm(f => ({ ...f, reason_detail: e.target.value }))} placeholder="Brief context..." className="mf-input w-full" />
            </MField>
            <MField label="Commander Notes (internal)">
              <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Internal notes..." className="mf-input w-full" />
            </MField>
          </div>
          <div className="flex gap-2">
            <button onClick={grantLOA} disabled={saving} className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded font-display text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Confirm LOA
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 border border-border text-muted-foreground rounded font-display text-xs uppercase tracking-widest hover:bg-secondary transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Extension request modal for member */}
      {extTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-display font-bold text-sm uppercase tracking-widest">Request LOA Extension</h3>
            <p className="text-xs text-muted-foreground font-sans">Current end: <span className="text-foreground font-bold">{extTarget.end_date}</span></p>
            <MField label="New End Date">
              <input type="date" value={extForm.extension_requested_until} onChange={e => setExtForm(f => ({ ...f, extension_requested_until: e.target.value }))} className="mf-input w-full" />
            </MField>
            <MField label="Reason for Extension">
              <textarea value={extForm.extension_reason} onChange={e => setExtForm(f => ({ ...f, extension_reason: e.target.value }))} rows={3} placeholder="Explain why you need more time..." className="mf-input w-full resize-none" />
            </MField>
            <div className="flex gap-2">
              <button onClick={requestExt} className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded font-display text-xs uppercase tracking-widest hover:bg-primary/90">
                <RefreshCw className="w-3.5 h-3.5" /> Submit Request
              </button>
              <button onClick={() => setExtTarget(null)} className="px-4 py-1.5 border border-border rounded font-display text-xs uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* My active LOA banner */}
      {myLOA && (
        <div className="border border-blue-500/30 bg-blue-500/10 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-display font-bold text-sm text-blue-400 uppercase tracking-widest">You are currently on LOA</p>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">Until {myLOA.end_date} · {myLOA.reason_category} · Granted by {myLOA.granted_by_username}</p>
          </div>
          {myLOA.extension_status !== "Pending" && (
            <button onClick={() => { setExtTarget(myLOA); setExtForm({ extension_requested_until: "", extension_reason: "" }); }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-500/40 text-blue-400 rounded font-display text-xs uppercase tracking-widest hover:bg-blue-500/20 transition-colors">
              <RefreshCw className="w-3 h-3" /> Request Extension
            </button>
          )}
          {myLOA.extension_status === "Pending" && (
            <span className="text-xs font-display font-bold text-amber-400 uppercase tracking-widest border border-amber-500/30 bg-amber-500/10 px-2 py-1 rounded">Extension Pending</span>
          )}
        </div>
      )}

      {/* LOA list */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-sans"><Loader2 className="w-4 h-4 animate-spin" /> Loading LOAs...</div>
      ) : loas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground font-sans text-sm border border-dashed border-border rounded-lg">
          <PlaneTakeoff className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>No active or historical LOAs.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {loas.map(loa => {
            const isPending = loa.extension_status === "Pending";
            const daysLeft = Math.ceil((new Date(loa.end_date).getTime() - Date.now()) / 86400000);
            return (
              <div key={loa.id} className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-sm">{loa.callsign}</span>
                    <span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${statusColor[loa.status] ?? "text-muted-foreground border-border"}`}>{loa.status}</span>
                    <span className="text-xs text-muted-foreground font-sans">{loa.reason_category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {loa.status === "Active" && (
                      <span className={`text-xs font-sans ${daysLeft <= 3 ? "text-red-400" : "text-muted-foreground"}`}>
                        {daysLeft > 0 ? `${daysLeft}d remaining` : "Expires today"}
                      </span>
                    )}
                    {isPending && isCommander && (
                      <>
                        <button onClick={() => approveExt(loa, true)} className="flex items-center gap-1 px-2 py-1 text-xs font-display font-bold uppercase bg-green-500/10 border border-green-500/30 text-green-400 rounded hover:bg-green-500/20 transition-colors">
                          <Check className="w-3 h-3" /> Approve Ext.
                        </button>
                        <button onClick={() => approveExt(loa, false)} className="flex items-center gap-1 px-2 py-1 text-xs font-display font-bold uppercase bg-red-500/10 border border-red-500/30 text-red-400 rounded hover:bg-red-500/20 transition-colors">
                          <X className="w-3 h-3" /> Deny
                        </button>
                      </>
                    )}
                    {isCommander && loa.status === "Active" && (
                      <button onClick={() => revoke(loa.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Revoke LOA">
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-sans flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {loa.start_date} → {loa.end_date}</span>
                  <span>Granted by <span className="text-foreground">{loa.granted_by_username}</span></span>
                  {loa.reason_detail && <span>"{loa.reason_detail}"</span>}
                </div>
                {isPending && (
                  <div className="text-xs font-sans bg-amber-500/10 border border-amber-500/20 rounded p-2 flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span><span className="text-amber-400 font-bold">Extension requested</span> until {loa.extension_requested_until} — "{loa.extension_reason}"</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY CALENDAR TAB
// ─────────────────────────────────────────────────────────────────────────────
const EVENT_TYPES = ["Op", "Training", "Meeting", "Social", "Admin", "Other"] as const;
const EVENT_TYPE_COLOR: Record<string, string> = {
  Op:       "bg-red-500/10 border-red-500/30 text-red-400",
  Training: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  Meeting:  "bg-purple-500/10 border-purple-500/30 text-purple-400",
  Social:   "bg-green-500/10 border-green-500/30 text-green-400",
  Admin:    "bg-muted/40 border-border text-muted-foreground",
  Other:    "bg-secondary border-border text-muted-foreground",
};

function ActivityCalendarTab({ group, showMsg }: { group: any; showMsg: (m: string, t?: "success"|"error") => void }) {
  const { user } = useAuth();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", event_type: "Op" as typeof EVENT_TYPES[number],
    scheduled_at: "", end_date: "", description: "", game: "", status: "Planned"
  });

  const isCommander = group.owner_id === user?.id || group.roster?.some((r: any) =>
    r.user_id === user?.id && group.owner_id === user?.id
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/activityCalendar?path=list&group_id=${group.id}`);
      setEvents(data.events ?? []);
    } catch { setEvents([]); }
    setLoading(false);
  }, [group.id]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title || !form.scheduled_at) { showMsg("Title and date required", "error"); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await apiFetch("/activityCalendar?path=update", { method: "POST", body: JSON.stringify({ id: editTarget.id, ...form }) });
        showMsg("Event updated ✓", "success");
      } else {
        await apiFetch("/activityCalendar?path=create", { method: "POST", body: JSON.stringify({
          group_id: group.id, created_by: user?.username, ...form
        }) });
        showMsg("Event scheduled ✓", "success");
      }
      setShowForm(false); setEditTarget(null);
      setForm({ title: "", event_type: "Op", scheduled_at: "", end_date: "", description: "", game: "", status: "Planned" });
      load();
    } catch (e: any) { showMsg(e.message, "error"); }
    setSaving(false);
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      await apiFetch("/activityCalendar?path=delete", { method: "POST", body: JSON.stringify({ id }) });
      showMsg("Deleted", "success"); load();
    } catch (e: any) { showMsg(e.message, "error"); }
  };

  const openEdit = (ev: any) => {
    setEditTarget(ev);
    setForm({ title: ev.title, event_type: ev.event_type, scheduled_at: ev.scheduled_at?.split("T")[0] ?? "", end_date: ev.end_date ?? "", description: ev.description ?? "", game: ev.game ?? "", status: ev.status ?? "Planned" });
    setShowForm(true);
  };

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startOffset = firstDay.getDay(); // 0=Sun
  const monthEvents = events.filter(e => {
    const d = new Date(e.scheduled_at);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });
  const getEventsForDay = (day: number) => monthEvents.filter(e => new Date(e.scheduled_at).getDate() === day);
  // normalise name→title for display
  const evTitle = (ev: any) => ev.title ?? ev.name ?? '(untitled)';

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const upcomingAll = events.filter(e => new Date(e.scheduled_at) >= now).sort((a,b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display font-bold text-lg uppercase tracking-widest">Activity Calendar</h2>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Pre-plan ops, training, and meetings. Members can see all scheduled activity.</p>
        </div>
        <button onClick={() => { setShowForm(v => !v); setEditTarget(null); setForm({ title: "", event_type: "Op", scheduled_at: "", end_date: "", description: "", game: "", status: "Planned" }); }}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/40 text-primary rounded font-display text-xs uppercase tracking-widest hover:bg-primary/30 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Schedule Event
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="border border-primary/30 rounded-lg p-4 bg-primary/5 space-y-4">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-primary">{editTarget ? "Edit Event" : "New Event"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MField label="Title">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Sunday Op — Grid 742" className="mf-input w-full" />
            </MField>
            <MField label="Type">
              <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value as any }))} className="mf-input w-full">
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </MField>
            <MField label="Date / Time">
              <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} className="mf-input w-full" />
            </MField>
            <MField label="End Date (optional)">
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="mf-input w-full" />
            </MField>
            <MField label="Game">
              <input value={form.game} onChange={e => setForm(f => ({ ...f, game: e.target.value }))} placeholder="e.g. Arma 3, Ground Branch..." className="mf-input w-full" />
            </MField>
            <MField label="Status">
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="mf-input w-full">
                {["Planned","Confirmed","Cancelled","Completed"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </MField>
            <div className="md:col-span-2">
              <MField label="Description">
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Brief notes..." className="mf-input w-full resize-none" />
              </MField>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded font-display text-xs uppercase tracking-widest hover:bg-primary/90">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {editTarget ? "Save Changes" : "Schedule"}
            </button>
            <button onClick={() => { setShowForm(false); setEditTarget(null); }} className="px-4 py-1.5 border border-border rounded font-display text-xs uppercase tracking-widest">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-sans"><Loader2 className="w-4 h-4 animate-spin" /> Loading calendar...</div>
      ) : (
        <div className="space-y-6">
          {/* Month navigation */}
          <div className="flex items-center gap-4 justify-between">
            <button onClick={() => { const d = new Date(viewYear, viewMonth - 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }}
              className="p-1.5 border border-border rounded hover:bg-secondary transition-colors"><ChevronDown className="w-4 h-4 rotate-90" /></button>
            <span className="font-display font-bold text-sm uppercase tracking-widest">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button onClick={() => { const d = new Date(viewYear, viewMonth + 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }}
              className="p-1.5 border border-border rounded hover:bg-secondary transition-colors"><ChevronDown className="w-4 h-4 -rotate-90" /></button>
          </div>

          {/* Calendar grid */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border">
              {DAY_NAMES.map(d => (
                <div key={d} className="text-center text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`pad-${i}`} className="border-b border-r border-border/40 min-h-[60px] bg-secondary/20" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDay(day);
                const isToday = viewYear === now.getFullYear() && viewMonth === now.getMonth() && day === now.getDate();
                return (
                  <div key={day} className={`border-b border-r border-border/40 min-h-[60px] p-1.5 ${isToday ? "bg-primary/5" : ""}`}>
                    <div className={`text-xs font-display font-bold mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>{day}</div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map(ev => (
                        <div key={ev.id} onClick={() => openEdit(ev)}
                          className={`text-[9px] font-display font-bold uppercase tracking-wide px-1 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 transition-opacity ${EVENT_TYPE_COLOR[ev.event_type] ?? EVENT_TYPE_COLOR.Other}`}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && <div className="text-[9px] text-muted-foreground font-sans">+{dayEvents.length - 2} more</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming list */}
          {upcomingAll.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground">Upcoming</h3>
              {upcomingAll.map(ev => (
                <div key={ev.id} className="flex items-center justify-between gap-4 border border-border rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border flex-shrink-0 ${EVENT_TYPE_COLOR[ev.event_type] ?? EVENT_TYPE_COLOR.Other}`}>{ev.event_type}</span>
                    <span className="font-display font-bold text-sm truncate">{evTitle(ev)}</span>
                    {ev.game && <span className="text-xs text-muted-foreground font-sans hidden md:block">{ev.game}</span>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-muted-foreground font-sans">{new Date(ev.scheduled_at).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}</span>
                    <button onClick={() => openEdit(ev)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteEvent(ev.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
