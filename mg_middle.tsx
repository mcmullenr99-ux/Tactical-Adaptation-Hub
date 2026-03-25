
// ─── Live Ops ─────────────────────────────────────────────────────────────────
function OpsTab({ group, showMsg }: any) {
  const { user } = useAuth();
  const [ops, setOps] = useState<any[]>([]);
  const [aars, setAars] = useState<any[]>([]);
  const [briefings, setBriefings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOp, setExpandedOp] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [linkTarget, setLinkTarget] = useState<{ opId: string; type: "aar" | "briefing" } | null>(null);
  const emptyForm = { name: "", description: "", game: "", event_type: "Op" as const, scheduled_at: "", end_date: "", status: "Planned" as const };
  const [form, setForm] = useState<any>(emptyForm);
  const [editOpId, setEditOpId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [opsData, aarsData, briefsData] = await Promise.all([
        apiFetch(`/activityCalendar?path=list&group_id=${group.id}`),
        apiFetch(`/milsimAars?path=list&group_id=${group.id}`),
        apiFetch(`/milsimBriefings?path=list&group_id=${group.id}`),
      ]);
      setOps(opsData.events ?? []);
      setAars(aarsData.aars ?? []);
      setBriefings(briefsData.briefings ?? []);
    } catch { }
    setLoading(false);
  }, [group.id]);

  useEffect(() => { load(); }, [load]);

  const saveOp = async () => {
    if (!form.name) { showMsg("Op name required", "error"); return; }
    setSaving(true);
    try {
      if (editOpId) {
        await apiFetch("/activityCalendar?path=update", { method: "POST", body: JSON.stringify({ id: editOpId, title: form.name, ...form }) });
        showMsg("Op updated", "success");
      } else {
        await apiFetch("/activityCalendar?path=create", { method: "POST", body: JSON.stringify({ group_id: group.id, title: form.name, created_by: user?.username, ...form }) });
        showMsg("Op created", "success");
      }
      setShowCreateForm(false); setEditOpId(null); setForm(emptyForm); load();
    } catch (e: any) { showMsg(e.message, "error"); }
    setSaving(false);
  };

  const deleteOp = async (id: string) => {
    if (!confirm("Delete this op?")) return;
    await apiFetch("/activityCalendar?path=delete", { method: "POST", body: JSON.stringify({ id }) });
    showMsg("Deleted", "success"); load();
  };

  const setOpStatus = async (id: string, status: string) => {
    await apiFetch("/activityCalendar?path=update", { method: "POST", body: JSON.stringify({ id, status }) });
    load();
  };

  const linkDoc = async (docId: string) => {
    if (!linkTarget) return;
    try {
      if (linkTarget.type === "aar") {
        await apiFetch("/milsimAars?path=link-op", { method: "POST", body: JSON.stringify({ aar_id: docId, op_id: linkTarget.opId }) });
      } else {
        await apiFetch("/milsimBriefings?path=link-op", { method: "POST", body: JSON.stringify({ briefing_id: docId, op_id: linkTarget.opId }) });
      }
      showMsg("Linked", "success"); setLinkTarget(null); load();
    } catch (e: any) { showMsg(e.message, "error"); }
  };

  const unlinkDoc = async (docId: string, type: "aar" | "briefing") => {
    try {
      if (type === "aar") await apiFetch("/milsimAars?path=link-op", { method: "POST", body: JSON.stringify({ aar_id: docId, op_id: null }) });
      else await apiFetch("/milsimBriefings?path=link-op", { method: "POST", body: JSON.stringify({ briefing_id: docId, op_id: null }) });
      load();
    } catch {}
  };

  const STATUS_COLOR: Record<string, string> = {
    Active: "text-red-400 bg-red-500/10 border-red-500/30",
    Planned: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    Confirmed: "text-green-400 bg-green-500/10 border-green-500/30",
    Completed: "text-muted-foreground bg-secondary border-border",
    Cancelled: "text-muted-foreground bg-secondary/40 border-border",
  };
  const TYPE_COLOR: Record<string, string> = { Op:"text-red-400", Training:"text-blue-400", Meeting:"text-purple-400", Social:"text-green-400", Admin:"text-muted-foreground", Other:"text-muted-foreground" };
  const CL: Record<string, string> = { unclassified:"text-green-400 border-green-500/30", confidential:"text-blue-400 border-blue-500/30", classified:"text-yellow-400 border-yellow-500/30", "top-secret":"text-red-400 border-red-500/30" };

  const opAars = (opId: string) => aars.filter((a: any) => a.op_id === opId);
  const opBriefings = (opId: string) => briefings.filter((b: any) => b.op_id === opId);
  const unlinkedAars = aars.filter((a: any) => !a.op_id);
  const unlinkedBriefings = briefings.filter((b: any) => !b.op_id);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {linkTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-display font-bold text-sm uppercase tracking-widest">Attach {linkTarget.type === "aar" ? "AAR" : "Briefing"}</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(linkTarget.type === "aar" ? unlinkedAars : unlinkedBriefings).length === 0 ? (
                <p className="text-xs text-muted-foreground font-sans">No unlinked {linkTarget.type === "aar" ? "AARs" : "briefings"} available.</p>
              ) : (
                (linkTarget.type === "aar" ? unlinkedAars : unlinkedBriefings).map((doc: any) => (
                  <button key={doc.id} onClick={() => linkDoc(doc.id)} className="w-full text-left px-4 py-3 border border-border rounded-lg hover:bg-secondary/40 transition-colors">
                    <p className="font-display font-bold text-sm">{doc.title ?? doc.op_name}</p>
                    <p className="text-xs text-muted-foreground font-sans mt-0.5">{doc.author_username ?? doc.created_by ?? ""}</p>
                  </button>
                ))
              )}
            </div>
            <button onClick={() => setLinkTarget(null)} className="px-4 py-1.5 border border-border rounded font-display text-xs uppercase tracking-widest">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display font-bold text-lg uppercase tracking-widest">Live Ops</h2>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Plan, run, and debrief operations. Attach briefings pre-op and AARs post-op.</p>
        </div>
        <button onClick={() => { setShowCreateForm(v => !v); setEditOpId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/40 text-primary rounded font-display text-xs uppercase tracking-widest hover:bg-primary/30 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Op
        </button>
      </div>

      {(showCreateForm || editOpId) && (
        <div className="border border-primary/30 rounded-lg p-4 bg-primary/5 space-y-4">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-primary">{editOpId ? "Edit Op" : "New Op"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MField label="Op Name *"><input value={form.name} onChange={e => setForm((f:any) => ({...f, name:e.target.value}))} placeholder="Operation Iron Fist" className="mf-input w-full" /></MField>
            <MField label="Type"><select value={form.event_type} onChange={e => setForm((f:any) => ({...f, event_type:e.target.value}))} className="mf-input w-full">{["Op","Training","Meeting","Social","Admin","Other"].map(t => <option key={t} value={t}>{t}</option>)}</select></MField>
            <MField label="Scheduled Date / Time"><input type="datetime-local" value={form.scheduled_at} onChange={e => setForm((f:any) => ({...f, scheduled_at:e.target.value}))} className="mf-input w-full" /></MField>
            <MField label="End Date"><input type="date" value={form.end_date} onChange={e => setForm((f:any) => ({...f, end_date:e.target.value}))} className="mf-input w-full" /></MField>
            <MField label="Game"><input value={form.game} onChange={e => setForm((f:any) => ({...f, game:e.target.value}))} placeholder="e.g. Arma 3" className="mf-input w-full" /></MField>
            <MField label="Status"><select value={form.status} onChange={e => setForm((f:any) => ({...f, status:e.target.value}))} className="mf-input w-full">{["Planned","Confirmed","Active","Completed","Cancelled"].map(s => <option key={s} value={s}>{s}</option>)}</select></MField>
            <div className="md:col-span-2"><MField label="Description"><textarea value={form.description} onChange={e => setForm((f:any) => ({...f, description:e.target.value}))} rows={2} className="mf-input w-full resize-none" /></MField></div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveOp} disabled={saving} className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded font-display text-xs uppercase tracking-widest hover:bg-primary/90">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {editOpId ? "Save" : "Create"}</button>
            <button onClick={() => { setShowCreateForm(false); setEditOpId(null); setForm(emptyForm); }} className="px-4 py-1.5 border border-border rounded font-display text-xs uppercase tracking-widest">Cancel</button>
          </div>
        </div>
      )}

      {ops.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground font-sans text-sm border border-dashed border-border rounded-lg"><Siren className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No ops scheduled yet.</p></div>
      ) : (
        <div className="space-y-3">
          {[...ops].sort((a,b) => new Date(b.scheduled_at ?? b.created_date).getTime() - new Date(a.scheduled_at ?? a.created_date).getTime()).map((op: any) => {
            const linkedAars = opAars(op.id);
            const linkedBriefs = opBriefings(op.id);
            const isExpanded = expandedOp === op.id;
            const isActive = op.status === "Active";
            return (
              <div key={op.id} className={`border rounded-lg overflow-hidden ${isActive ? "border-red-500/40 bg-red-500/5" : "border-border"}`}>
                <button onClick={() => setExpandedOp(isExpanded ? null : op.id)} className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/10 transition-colors text-left">
                  <div className="flex items-center gap-3 flex-wrap min-w-0">
                    {isActive && <span className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest text-red-400 px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded animate-pulse"><span className="w-1.5 h-1.5 bg-red-400 rounded-full" />LIVE</span>}
                    <span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${STATUS_COLOR[op.status] ?? "text-muted-foreground border-border"}`}>{op.status}</span>
                    <span className={`text-[10px] font-display font-bold uppercase tracking-widest ${TYPE_COLOR[op.event_type] ?? ""}`}>[{op.event_type ?? "Op"}]</span>
                    <span className="font-display font-bold text-sm">{op.name ?? op.title}</span>
                    {op.game && <span className="text-xs text-muted-foreground font-sans hidden md:block">{op.game}</span>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground font-sans">
                    {linkedBriefs.length > 0 && <span className="flex items-center gap-1 text-blue-400"><MapPin className="w-3 h-3" />{linkedBriefs.length}</span>}
                    {linkedAars.length > 0 && <span className="flex items-center gap-1 text-green-400"><ClipboardList className="w-3 h-3" />{linkedAars.length}</span>}
                    {op.scheduled_at && <span>{new Date(op.scheduled_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</span>}
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-border p-5 space-y-5 bg-secondary/10">
                    {op.description && <p className="text-sm text-muted-foreground font-sans">{op.description}</p>}
                    <div className="flex flex-wrap gap-2">
                      {["Planned","Confirmed","Active","Completed","Cancelled"].filter(s => s !== op.status).map(s => (
                        <button key={s} onClick={() => setOpStatus(op.id, s)} className="text-[10px] font-display font-bold uppercase tracking-widest px-2 py-1 border border-border rounded hover:bg-secondary transition-colors">→ {s}</button>
                      ))}
                      <button onClick={() => { setEditOpId(op.id); setForm({ name:op.name??op.title??"", description:op.description??"", game:op.game??"", event_type:op.event_type??"Op", scheduled_at:op.scheduled_at?op.scheduled_at.slice(0,16):"", end_date:op.end_date??"", status:op.status??"Planned" }); setShowCreateForm(false); }}
                        className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest px-2 py-1 border border-border text-muted-foreground rounded hover:text-primary transition-colors"><Pencil className="w-3 h-3" /> Edit</button>
                      <button onClick={() => deleteOp(op.id)} className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest px-2 py-1 border border-red-500/30 text-red-400 rounded hover:bg-red-500/10 transition-colors"><Trash2 className="w-3 h-3" /> Delete</button>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-display font-bold uppercase tracking-widest text-blue-400 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Briefings</p>
                        <button onClick={() => setLinkTarget({ opId: op.id, type: "briefing" })} className="flex items-center gap-1 text-[10px] font-display font-bold uppercase text-muted-foreground border border-border rounded px-2 py-0.5 hover:text-primary transition-colors"><Plus className="w-3 h-3" /> Attach</button>
                      </div>
                      {linkedBriefs.length === 0 ? <p className="text-xs text-muted-foreground font-sans italic">No briefings attached.</p> : (
                        <div className="space-y-1.5">
                          {linkedBriefs.map((b: any) => (
                            <div key={b.id} className="flex items-center justify-between px-3 py-2 bg-blue-500/5 border border-blue-500/20 rounded">
                              <div><span className="text-xs font-display font-bold">{b.title}</span><span className={`ml-2 text-[10px] font-display uppercase tracking-wide px-1.5 py-0.5 rounded border ${CL[b.classification] ?? ""}`}>{b.classification ?? "unclassified"}</span></div>
                              <button onClick={() => unlinkDoc(b.id, "briefing")} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-display font-bold uppercase tracking-widest text-green-400 flex items-center gap-1.5"><ClipboardList className="w-3 h-3" /> After Action Reports</p>
                        <button onClick={() => setLinkTarget({ opId: op.id, type: "aar" })} className="flex items-center gap-1 text-[10px] font-display font-bold uppercase text-muted-foreground border border-border rounded px-2 py-0.5 hover:text-primary transition-colors"><Plus className="w-3 h-3" /> Attach</button>
                      </div>
                      {linkedAars.length === 0 ? <p className="text-xs text-muted-foreground font-sans italic">No AARs filed yet.</p> : (
                        <div className="space-y-1.5">
                          {linkedAars.map((a: any) => (
                            <div key={a.id} className="flex items-center justify-between px-3 py-2 bg-green-500/5 border border-green-500/20 rounded">
                              <div><span className="text-xs font-display font-bold">{a.title ?? a.op_name}</span>{a.outcome && <span className="ml-2 text-[10px] text-muted-foreground font-sans">{a.outcome}</span>}</div>
                              <button onClick={() => unlinkDoc(a.id, "aar")} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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

// ─── AARs ─────────────────────────────────────────────────────────────────────
function AARField({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p><p className="text-sm text-foreground font-sans whitespace-pre-wrap">{value}</p></div>;
}

function AARsTab({ group, showMsg }: any) {
  const { user } = useAuth();
  const [aars, setAars] = useState<any[]>([]);
  const [ops, setOps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const emptyForm = { title: "", op_name: "", op_id: "", outcome: "", lessons_learned: "", content: "", participants: [] as string[] };
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aarsData, opsData] = await Promise.all([
        apiFetch(`/milsimAars?path=list&group_id=${group.id}`),
        apiFetch(`/activityCalendar?path=list&group_id=${group.id}`),
      ]);
      setAars(aarsData.aars ?? []);
      setOps(opsData.events ?? []);
    } catch { }
    setLoading(false);
  }, [group.id]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.title?.trim()) { showMsg("Title required", "error"); return; }
    setSaving(true);
    try {
      if (editId) {
        await apiFetch("/milsimAars?path=update", { method: "POST", body: JSON.stringify({ id: editId, ...form }) });
        showMsg("AAR updated", "success");
      } else {
        await apiFetch("/milsimAars?path=create", { method: "POST", body: JSON.stringify({ group_id: group.id, author_id: user?.id, author_username: user?.username, ...form }) });
        showMsg("AAR filed", "success");
      }
      setCreating(false); setEditId(null); setForm(emptyForm); load();
    } catch (e: any) { showMsg(e.message, "error"); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this AAR?")) return;
    try { await apiFetch("/milsimAars?path=delete", { method: "POST", body: JSON.stringify({ id }) }); showMsg("Deleted", "success"); load(); }
    catch (e: any) { showMsg(e.message, "error"); }
  };

  const setF = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-sans">After Action Reports — link to ops from the Live Ops tab or here.</p>
        {!creating && !editId && <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-4 py-2 rounded transition-all"><Plus className="w-3.5 h-3.5" /> File AAR</button>}
      </div>
      {(creating || editId !== null) && (
        <div className="bg-card border border-primary/30 rounded-lg p-6 space-y-4">
          <h3 className="font-display font-bold uppercase tracking-widest text-sm">{editId ? "Edit AAR" : "New AAR"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="mf-label">Title *</label><input value={form.title} onChange={setF("title")} className="mf-input w-full" placeholder="AAR — Operation Iron Fist" /></div>
            <div><label className="mf-label">Op Name (reference)</label><input value={form.op_name} onChange={setF("op_name")} className="mf-input w-full" placeholder="Operation name..." /></div>
            <div><label className="mf-label">Link to Scheduled Op</label><select value={form.op_id ?? ""} onChange={setF("op_id")} className="mf-input w-full"><option value="">— None —</option>{ops.map((o: any) => <option key={o.id} value={o.id}>{o.name ?? o.title}</option>)}</select></div>
          </div>
          <div><label className="mf-label">Outcome</label><input value={form.outcome} onChange={setF("outcome")} className="mf-input w-full" placeholder="Success / Partial / Failure..." /></div>
          <div><label className="mf-label">Report Content</label><textarea rows={5} value={form.content} onChange={setF("content")} className="mf-input resize-none w-full" placeholder="Full AAR narrative..." /></div>
          <div><label className="mf-label">Lessons Learned</label><textarea rows={3} value={form.lessons_learned} onChange={setF("lessons_learned")} className="mf-input resize-none w-full" /></div>
          <div>
            <label className="mf-label">Participants</label>
            {group.roster?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1 max-h-40 overflow-y-auto p-2 bg-secondary/20 border border-border rounded">
                {group.roster.map((r: any) => {
                  const checked = (form.participants ?? []).includes(r.id);
                  return (<label key={r.id} className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${checked ? "bg-primary/15 border border-primary/30" : "hover:bg-secondary/60"}`}><input type="checkbox" className="accent-primary" checked={checked} onChange={e => setForm((f: any) => ({ ...f, participants: e.target.checked ? [...(f.participants ?? []), r.id] : (f.participants ?? []).filter((id: string) => id !== r.id) }))} /><span className="text-xs font-display font-bold uppercase tracking-wider">{r.callsign}</span></label>);
                })}
              </div>
            ) : <p className="text-xs text-muted-foreground mt-1 font-sans">No roster members yet.</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={submit} disabled={saving || !form.title?.trim()} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded transition-all disabled:opacity-50">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {editId ? "Update" : "File AAR"}</button>
            <button onClick={() => { setCreating(false); setEditId(null); setForm(emptyForm); }} className="px-4 py-2 border border-border text-muted-foreground rounded text-xs font-display uppercase hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}
      {aars.length === 0 && !creating ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground"><ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-display text-sm uppercase tracking-widest">No AARs filed</p></div>
      ) : (
        <div className="space-y-3">
          {aars.map((a: any) => {
            const linkedOp = ops.find((o: any) => o.id === a.op_id);
            return (
              <div key={a.id} className="bg-card border border-border rounded-lg overflow-hidden">
                <button onClick={() => setExpandedId(expandedId === a.id ? null : a.id)} className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/20 transition-colors text-left">
                  <div className="flex items-center gap-3 flex-wrap">
                    {linkedOp && <span className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest text-primary border border-primary/30 bg-primary/10 px-2 py-0.5 rounded"><Siren className="w-2.5 h-2.5" />{linkedOp.name ?? linkedOp.title}</span>}
                    <span className="font-display font-bold text-sm text-foreground">{a.title ?? a.op_name}</span>
                    {a.outcome && <span className="text-xs text-muted-foreground font-sans">{a.outcome}</span>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={e => { e.stopPropagation(); setEditId(a.id); setForm({ title:a.title??"", op_name:a.op_name??"", op_id:a.op_id??"", outcome:a.outcome??"", lessons_learned:a.lessons_learned??"", content:a.content??"", participants:a.participants??[] }); }} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={e => { e.stopPropagation(); remove(a.id); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    {expandedId === a.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>
                {expandedId === a.id && (
                  <div className="border-t border-border p-5 space-y-4 bg-secondary/10">
                    {a.content && <AARField label="Report" value={a.content} />}
                    {a.lessons_learned && <AARField label="Lessons Learned" value={a.lessons_learned} />}
                    {a.participants?.length > 0 && (
                      <div><p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Attendees</p><div className="flex flex-wrap gap-1.5">{a.participants.map((pid: string) => { const m = group.roster?.find((r: any) => r.id === pid); return m ? <span key={pid} className="text-[10px] font-display font-bold uppercase px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded">{m.callsign}</span> : null; })}</div></div>
                    )}
                    <p className="text-xs text-muted-foreground font-sans">By {a.author_username ?? a.created_by} · {formatDistanceToNow(new Date(a.created_date ?? a.created_at ?? Date.now()), { addSuffix: true })}</p>
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

// ─── Briefings ────────────────────────────────────────────────────────────────
function BriefingsTab({ group, showMsg }: any) {
  const { user } = useAuth();
  const [briefings, setBriefings] = useState<any[]>([]);
  const [ops, setOps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const emptyForm = { title: "", op_id: "", content: "", classification: "unclassified" as const };
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [briefs, opsData] = await Promise.all([
        apiFetch(`/milsimBriefings?path=list&group_id=${group.id}`),
        apiFetch(`/activityCalendar?path=list&group_id=${group.id}`),
      ]);
      setBriefings(briefs.briefings ?? []);
      setOps(opsData.events ?? []);
    } catch { }
    setLoading(false);
  }, [group.id]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.title?.trim()) { showMsg("Title required", "error"); return; }
    setSaving(true);
    try {
      if (editId) {
        await apiFetch("/milsimBriefings?path=update", { method: "POST", body: JSON.stringify({ id: editId, ...form }) });
        showMsg("Briefing updated", "success");
      } else {
        await apiFetch("/milsimBriefings?path=create", { method: "POST", body: JSON.stringify({ group_id: group.id, created_by: user?.username, ...form }) });
        showMsg("Briefing created", "success");
      }
      setCreating(false); setEditId(null); setForm(emptyForm); load();
    } catch (e: any) { showMsg(e.message, "error"); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this briefing?")) return;
    try { await apiFetch("/milsimBriefings?path=delete", { method: "POST", body: JSON.stringify({ id }) }); showMsg("Deleted", "success"); load(); }
    catch (e: any) { showMsg(e.message, "error"); }
  };

  const setF = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const CL: Record<string, string> = { unclassified:"text-green-400 bg-green-500/10 border-green-500/30", confidential:"text-blue-400 bg-blue-500/10 border-blue-500/30", classified:"text-yellow-400 bg-yellow-500/10 border-yellow-500/30", "top-secret":"text-red-400 bg-red-500/10 border-red-500/30" };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-sans">Op briefings — attach to ops from the Live Ops tab or link here.</p>
        {!creating && !editId && <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-4 py-2 rounded transition-all"><Plus className="w-3.5 h-3.5" /> New Briefing</button>}
      </div>
      {(creating || editId !== null) && (
        <div className="bg-card border border-primary/30 rounded-lg p-6 space-y-4">
          <h3 className="font-display font-bold uppercase tracking-widest text-sm">{editId ? "Edit Briefing" : "New Briefing"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="mf-label">Title *</label><input value={form.title} onChange={setF("title")} className="mf-input w-full" placeholder="Operation Iron Fist — OPORD" /></div>
            <div><label className="mf-label">Link to Op</label><select value={form.op_id ?? ""} onChange={setF("op_id")} className="mf-input w-full"><option value="">— None —</option>{ops.map((o: any) => <option key={o.id} value={o.id}>{o.name ?? o.title}</option>)}</select></div>
            <div><label className="mf-label">Classification</label><select value={form.classification} onChange={setF("classification")} className="mf-input w-full">{["unclassified","confidential","classified","top-secret"].map(c => <option key={c} value={c}>{c.replace("-"," ").toUpperCase()}</option>)}</select></div>
          </div>
          <div><label className="mf-label">Content</label><textarea rows={8} value={form.content} onChange={setF("content")} className="mf-input resize-none w-full" placeholder="Full briefing content — objectives, AO, comms plan, ROE..." /></div>
          <div className="flex gap-2">
            <button onClick={submit} disabled={saving || !form.title?.trim()} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded transition-all disabled:opacity-50">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {editId ? "Update" : "Create"}</button>
            <button onClick={() => { setCreating(false); setEditId(null); setForm(emptyForm); }} className="px-4 py-2 border border-border text-muted-foreground rounded text-xs font-display uppercase hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}
      {briefings.length === 0 && !creating ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground"><MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-display text-sm uppercase tracking-widest">No briefings created</p></div>
      ) : (
        <div className="space-y-3">
          {briefings.map((b: any) => {
            const linkedOp = ops.find((o: any) => o.id === b.op_id);
            return (
              <div key={b.id} className="bg-card border border-border rounded-lg overflow-hidden">
                <button onClick={() => setExpandedId(expandedId === b.id ? null : b.id)} className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/20 transition-colors text-left">
                  <div className="flex items-center gap-3 flex-wrap">
                    {linkedOp && <span className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest text-primary border border-primary/30 bg-primary/10 px-2 py-0.5 rounded"><Siren className="w-2.5 h-2.5" />{linkedOp.name ?? linkedOp.title}</span>}
                    <span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${CL[b.classification] ?? ""}`}>{(b.classification ?? "unclassified").replace("-"," ")}</span>
                    <span className="font-display font-bold text-sm text-foreground">{b.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={e => { e.stopPropagation(); setEditId(b.id); setForm({ title:b.title, op_id:b.op_id??"", content:b.content??"", classification:b.classification??"unclassified" }); }} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={e => { e.stopPropagation(); remove(b.id); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    {expandedId === b.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>
                {expandedId === b.id && (
                  <div className="border-t border-border p-5 space-y-4 bg-secondary/10">
                    {b.content && <AARField label="Content" value={b.content} />}
                    <p className="text-xs text-muted-foreground font-sans">By {b.created_by} · {formatDistanceToNow(new Date(b.created_date ?? b.created_at ?? Date.now()), { addSuffix: true })}</p>
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

