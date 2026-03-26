import { useState, useEffect, useCallback } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { useAuth } from "@/components/auth/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { format, formatDistanceToNow, differenceInCalendarDays } from "date-fns";
import {
  Shield, Loader2, AlertTriangle, Siren, ClipboardList, MapPin, Calendar,
  Star, FileText, UserCheck, ChevronDown, ChevronUp, CheckCircle2, XCircle,
  Award, PlusCircle, Clock, ThumbsUp, ThumbsDown, ExternalLink, Send, TrendingUp
} from "lucide-react";
import { Link } from "wouter";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const CL: Record<string, string> = {
  unclassified: "text-green-400 border-green-500/30 bg-green-500/10",
  confidential: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  classified:   "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  "top-secret": "text-red-400 border-red-500/30 bg-red-500/10",
};
const SC: Record<string, string> = {
  draft:     "text-muted-foreground border-border",
  published: "text-primary border-primary/30 bg-primary/10",
  archived:  "text-muted-foreground border-border",
};
const STATUS_OP: Record<string, string> = {
  Planned:   "text-amber-400 bg-amber-500/10 border-amber-500/30",
  Confirmed: "text-green-400 bg-green-500/10 border-green-500/30",
  Active:    "text-red-400 bg-red-500/10 border-red-500/30",
  Completed: "text-muted-foreground bg-secondary border-border",
  Cancelled: "text-muted-foreground bg-secondary/30 border-border",
};

/* ─── main component ──────────────────────────────────────────────────────── */
export default function MemberHQ() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"ops"|"briefings"|"aars"|"peer-review"|"unit-review"|"loa"|"service-file">("ops");
  const [upvoteCount, setUpvoteCount] = useState<number>(0);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [upvoting, setUpvoting] = useState(false);
  const [memberships, setMemberships] = useState<any[] | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [rosterEntry, setRosterEntry] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ok:boolean;text:string}|null>(null);

  const showMsg = (ok: boolean, text: string) => { setMsg({ok,text}); setTimeout(()=>setMsg(null),3500); };

  useEffect(() => {
    apiFetch<any[]>("/api/milsim-groups/mine/memberships")
      .then(async (groups) => {
        setMemberships(groups ?? []);
        if (groups && groups.length > 0) {
          setSelectedGroup(groups[0]);
        }
      })
      .catch(() => setMemberships([]))
      .finally(() => setLoading(false));
  }, []);

  // Load roster entry for selected group
  useEffect(() => {
    if (!selectedGroup || !user) return;
    apiFetch<any>(`/api/milsim-groups/${selectedGroup.id}/full`)
      .then((g: any) => {
        const entry = (g.roster ?? []).find((r: any) => r.userId === (user as any).id || r.user_id === (user as any).id);
        setRosterEntry(entry ?? null);
      })
      .catch(() => setRosterEntry(null));
  }, [selectedGroup, user]);

  useEffect(() => {
    if (!selectedGroup) return;
    apiFetch<{ count: number; voted: boolean }>(`/api/group-upvotes?path=/upvotes/${selectedGroup.id}`, { method: "GET" })
      .then(d => { setUpvoteCount(d.count ?? 0); setHasVoted(d.voted ?? false); })
      .catch(() => {});
  }, [selectedGroup]);

  const handleUpvote = async () => {
    if (!selectedGroup || upvoting) return;
    setUpvoting(true);
    try {
      const res = await apiFetch<{ count: number; voted: boolean }>(`/api/group-upvotes?path=/upvotes/${selectedGroup.id}`, { method: "POST" });
      setUpvoteCount(res.count ?? 0);
      setHasVoted(res.voted ?? false);
    } catch {}
    setUpvoting(false);
  };

  if (loading) return (
    <PortalLayout>
      <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    </PortalLayout>
  );

  if (!memberships || memberships.length === 0) return (
    <PortalLayout>
      <div className="text-center py-24 border border-dashed border-border rounded-lg max-w-xl mx-auto mt-12">
        <Shield className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-20" />
        <h2 className="font-display font-black text-xl uppercase tracking-wider mb-2">Not Enlisted</h2>
        <p className="text-muted-foreground font-sans text-sm mb-6">You're not on the roster of any MilSim unit. Find a unit and submit an application to join.</p>
        <Link href="/milsim">
          <a className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-widest text-sm px-6 py-3 rounded transition-all">
            Browse Units
          </a>
        </Link>
      </div>
    </PortalLayout>
  );

  const TABS = [
    { id: "ops",          label: "Live Ops",      icon: Siren },
    { id: "briefings",    label: "Briefings",     icon: MapPin },
    { id: "aars",         label: "AARs",          icon: ClipboardList },
    { id: "peer-review",  label: "Peer Review",   icon: Star },
    { id: "unit-review",   label: "Unit Review",   icon: Shield },
    { id: "loa",          label: "Request LOA",   icon: Calendar },
    { id: "service-file", label: "My Service File", icon: FileText },
  ] as const;

  return (
    <PortalLayout>
      {/* Header */}
      <div className="mb-6 pb-6 border-b border-border">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 text-primary rounded flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl uppercase tracking-widest">Member HQ</h1>
              <p className="text-xs text-muted-foreground font-sans">Your unit portal — everything from your commander's perspective</p>
            </div>
          </div>
          {/* Group selector if in multiple units */}
          {memberships.length > 1 && (
            <select
              value={selectedGroup?.id ?? ""}
              onChange={e => {
                const g = memberships.find(m => m.id === e.target.value);
                if (g) setSelectedGroup(g);
              }}
              className="bg-background border border-border rounded px-3 py-2 text-sm font-display uppercase tracking-widest"
            >
              {memberships.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
          {memberships.length === 1 && (
            <Link href={`/milsim/${selectedGroup?.slug}`}>
              <a className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary font-display uppercase tracking-widest transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> {selectedGroup?.name}
              </a>
            </Link>
          )}
          {/* Upvote button */}
          {selectedGroup && (
            <button
              onClick={handleUpvote}
              disabled={upvoting}
              title={hasVoted ? "Click to remove your upvote" : "Upvote your unit to boost its ranking on the registry"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${
                hasVoted
                  ? "bg-primary/15 border-primary/50 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}>
              {upvoting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
              <span>{upvoteCount}</span>
              <span>{hasVoted ? "Upvoted" : "Upvote Unit"}</span>
            </button>
          )}
        </div>

        {/* Roster badge */}
        {rosterEntry && (
          <div className="flex items-center gap-3 mt-4 p-3 bg-secondary/40 border border-border rounded-lg flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-display uppercase tracking-widest">Callsign</span>
              <span className="font-display font-black text-sm text-foreground">{rosterEntry.callsign}</span>
            </div>
            {rosterEntry.rankName && <span className="text-xs text-muted-foreground">· {rosterEntry.rankName}</span>}
            {rosterEntry.roleName && <span className="text-xs text-muted-foreground">· {rosterEntry.roleName}</span>}
            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ml-auto ${rosterEntry.status === 'active' ? 'text-green-400 bg-green-500/10 border-green-500/30' : 'text-amber-400 bg-amber-500/10 border-amber-500/30'}`}>
              {rosterEntry.status ?? "active"}
            </span>
          </div>
        )}
      </div>

      {/* Flash message */}
      {msg && (
        <div className={`flex items-center gap-3 p-3 rounded-lg border text-sm font-sans mb-4 ${msg.ok ? "bg-primary/10 border-primary/30 text-primary" : "bg-destructive/10 border-destructive/30 text-destructive"}`}>
          {msg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      {/* Tab nav */}
      <div className="flex flex-wrap gap-1 mb-6 border-b border-border pb-4">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded font-display font-bold uppercase tracking-widest text-[10px] transition-all ${
                tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {selectedGroup && tab === "ops"          && <MemberOpsTab         group={selectedGroup} showMsg={showMsg} />}
      {selectedGroup && tab === "briefings"    && <MemberBriefingsTab   group={selectedGroup} showMsg={showMsg} />}
      {selectedGroup && tab === "aars"         && <MemberAARsTab        group={selectedGroup} showMsg={showMsg} rosterEntry={rosterEntry} />}
      {selectedGroup && tab === "peer-review"  && <MemberPeerReviewTab  group={selectedGroup} showMsg={showMsg} user={user} />}
      {selectedGroup && tab === "loa"          && <MemberLOATab         group={selectedGroup} showMsg={showMsg} user={user} rosterEntry={rosterEntry} />}
      {selectedGroup && tab === "unit-review"   && <MemberUnitReviewTab  group={selectedGroup} showMsg={showMsg} user={user} />}
      {selectedGroup && tab === "service-file" && <MemberServiceFileTab user={user} />}
    </PortalLayout>
  );
}

/* ─── Ops tab ─────────────────────────────────────────────────────────────── */
function MemberOpsTab({ group, showMsg }: any) {
  const [ops, setOps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string|null>(null);

  useEffect(() => {
    apiFetch<any>(`/activityCalendar?path=list&group_id=${group.id}`)
      .then((r: any) => setOps((r.events ?? []).sort((a: any, b: any) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())))
      .catch(() => setOps([]))
      .finally(() => setLoading(false));
  }, [group.id]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (ops.length === 0) return (
    <div className="text-center py-16 border border-dashed border-border rounded-lg">
      <Siren className="w-10 h-10 mx-auto mb-3 opacity-20" />
      <p className="font-display text-sm uppercase tracking-widest text-muted-foreground">No operations on record</p>
      <p className="text-xs text-muted-foreground font-sans mt-1">Your commander will schedule ops here</p>
    </div>
  );

  return (
    <div className="space-y-3 max-w-3xl">
      <p className="text-xs text-muted-foreground font-sans">{ops.length} operation{ops.length !== 1 ? "s" : ""} on record</p>
      {ops.map((op: any) => (
        <div key={op.id} className="bg-card border border-border rounded-lg overflow-hidden">
          <button onClick={() => setExpanded(expanded === op.id ? null : op.id)}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/20 transition-colors text-left">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${STATUS_OP[op.status ?? "Planned"] ?? ""}`}>{op.status ?? "Planned"}</span>
              <span className="font-display font-bold text-sm">{op.name ?? op.title}</span>
              {op.game && <span className="text-xs text-muted-foreground">{op.game}</span>}
            </div>
            <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
              {op.scheduled_at && <span className="text-xs font-sans">{format(new Date(op.scheduled_at), "dd MMM yyyy")}</span>}
              {expanded === op.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
          {expanded === op.id && (
            <div className="border-t border-border p-5 bg-secondary/10 space-y-3">
              {op.description && <p className="text-sm text-muted-foreground font-sans leading-relaxed">{op.description}</p>}
              <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                {op.event_type && <div><span className="text-muted-foreground">Type: </span><span className="text-foreground">{op.event_type}</span></div>}
                {op.scheduled_at && <div><span className="text-muted-foreground">Scheduled: </span><span className="text-foreground">{format(new Date(op.scheduled_at), "dd MMM yyyy HH:mm")}</span></div>}
                {op.end_date && <div><span className="text-muted-foreground">End: </span><span className="text-foreground">{format(new Date(op.end_date), "dd MMM yyyy")}</span></div>}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Briefings tab ───────────────────────────────────────────────────────── */
function MemberBriefingsTab({ group, showMsg }: any) {
  const [briefings, setBriefings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string|null>(null);

  useEffect(() => {
    apiFetch<any>(`/milsimBriefings?path=list&group_id=${group.id}`)
      .then((r: any) => setBriefings((r.briefings ?? []).filter((b: any) => b.status === "published").sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())))
      .catch(() => setBriefings([]))
      .finally(() => setLoading(false));
  }, [group.id]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (briefings.length === 0) return (
    <div className="text-center py-16 border border-dashed border-border rounded-lg">
      <MapPin className="w-10 h-10 mx-auto mb-3 opacity-20" />
      <p className="font-display text-sm uppercase tracking-widest text-muted-foreground">No published briefings</p>
      <p className="text-xs text-muted-foreground font-sans mt-1">Your commander will publish op briefings here before operations</p>
    </div>
  );

  return (
    <div className="space-y-3 max-w-3xl">
      <p className="text-xs text-muted-foreground font-sans">{briefings.length} published briefing{briefings.length !== 1 ? "s" : ""}</p>
      {briefings.map((b: any) => (
        <div key={b.id} className="bg-card border border-border rounded-lg overflow-hidden">
          <button onClick={() => setExpanded(expanded === b.id ? null : b.id)}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/20 transition-colors text-left">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${CL[b.classification ?? "unclassified"] ?? ""}`}>
                {(b.classification ?? "unclassified").replace("-"," ")}
              </span>
              <span className="font-display font-bold text-sm">{b.title}</span>
              {b.op_date && <span className="text-xs text-muted-foreground">{format(new Date(b.op_date), "dd MMM yyyy")}</span>}
            </div>
            {expanded === b.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {expanded === b.id && (
            <div className="border-t border-border p-5 bg-secondary/10 space-y-4">
              {b.ao         && <BriefField label="Area of Operations" value={b.ao} />}
              {b.objectives && <BriefField label="Objectives"         value={b.objectives} />}
              {b.comms_plan && <BriefField label="Comms Plan"         value={b.comms_plan} />}
              {b.roe        && <BriefField label="Rules of Engagement"value={b.roe} />}
              {b.additional_notes && <BriefField label="Additional Notes" value={b.additional_notes} />}
              {b.content && !b.ao && !b.objectives && <BriefField label="Content" value={b.content} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
function BriefField({ label, value }: any) {
  return (
    <div>
      <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-sans whitespace-pre-wrap text-foreground">{value}</p>
    </div>
  );
}

/* ─── AARs tab (read + submit witness confirmation) ───────────────────────── */
function MemberAARsTab({ group, showMsg, rosterEntry }: any) {
  const [aars, setAars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string|null>(null);

  const load = useCallback(() => {
    apiFetch<any>(`/milsimAars?path=list&group_id=${group.id}`)
      .then((r: any) => setAars((r.aars ?? []).sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())))
      .catch(() => setAars([]))
      .finally(() => setLoading(false));
  }, [group.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (aars.length === 0) return (
    <div className="text-center py-16 border border-dashed border-border rounded-lg">
      <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
      <p className="font-display text-sm uppercase tracking-widest text-muted-foreground">No AARs filed yet</p>
      <p className="text-xs text-muted-foreground font-sans mt-1">Post-operation reports filed by your commander appear here</p>
    </div>
  );

  const myCallsign = rosterEntry?.callsign ?? "";

  return (
    <div className="space-y-3 max-w-3xl">
      <p className="text-xs text-muted-foreground font-sans">{aars.length} after-action report{aars.length !== 1 ? "s" : ""}</p>
      {aars.map((a: any) => {
        const participants: string[] = Array.isArray(a.participants) ? a.participants : [];
        const wasParticipant = myCallsign && participants.some((p: string) => p.toLowerCase() === myCallsign.toLowerCase());
        return (
          <div key={a.id} className="bg-card border border-border rounded-lg overflow-hidden">
            <button onClick={() => setExpanded(expanded === a.id ? null : a.id)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/20 transition-colors text-left">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${CL[a.classification ?? "unclassified"] ?? ""}`}>
                  {(a.classification ?? "unclassified").replace("-"," ")}
                </span>
                <span className="font-display font-bold text-sm">{a.op_name ?? a.title}</span>
                {wasParticipant && (
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border text-cyan-400 border-cyan-500/30 bg-cyan-500/10">
                    ✓ You Participated
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                {a.op_date && <span className="text-xs">{format(new Date(a.op_date + "T00:00:00"), "dd MMM yyyy")}</span>}
                {expanded === a.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>
            {expanded === a.id && (
              <div className="border-t border-border p-5 bg-secondary/10 space-y-3">
                {a.content   && <BriefField label="Summary"           value={a.content} />}
                {a.objectives_hit   && <BriefField label="Objectives Hit"   value={a.objectives_hit} />}
                {a.objectives_missed && <BriefField label="Objectives Missed" value={a.objectives_missed} />}
                {a.casualties       && <BriefField label="Casualties"        value={a.casualties} />}
                {a.commendations    && <BriefField label="Commendations"     value={a.commendations} />}
                {a.lessons_learned  && <BriefField label="Lessons Learned"   value={a.lessons_learned} />}
                {participants.length > 0 && (
                  <div>
                    <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Participants</p>
                    <div className="flex flex-wrap gap-1.5">
                      {participants.map((p: string, i: number) => (
                        <span key={i} className={`text-[10px] px-2 py-0.5 rounded border font-display ${p.toLowerCase() === myCallsign.toLowerCase() ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' : 'text-muted-foreground border-border bg-secondary/40'}`}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground font-sans pt-1">Filed by {a.author_username} · {formatDistanceToNow(new Date(a.created_date), { addSuffix: true })}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Peer Review tab ─────────────────────────────────────────────────────── */
function MemberPeerReviewTab({ group, showMsg, user }: any) {
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any|null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string[]>([]);
  const [form, setForm] = useState({ activity: 7, attitude: 7, experience: 5, discipline: 7, overall_vote: "commend", notes: "" });

  useEffect(() => {
    apiFetch<any>(`/api/milsim-groups/${group.id}/full`)
      .then((g: any) => {
        // Filter out self
        const others = (g.roster ?? []).filter((r: any) => r.userId !== (user as any)?.id && r.user_id !== (user as any)?.id);
        setRoster(others);
      })
      .catch(() => setRoster([]))
      .finally(() => setLoading(false));
  }, [group.id, user]);

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/reputation/${selected.userId}`, {
        method: "POST",
        body: JSON.stringify({ ...form, group_id: group.id, group_name: group.name }),
      });
      setSubmitted(prev => [...prev, selected.id]);
      setSelected(null);
      setForm({ activity: 7, attitude: 7, experience: 5, discipline: 7, overall_vote: "commend", notes: "" });
      showMsg(true, "Peer review submitted.");
    } catch (e: any) {
      showMsg(false, e.message);
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-secondary/30 border border-border rounded-lg p-4 text-sm font-sans text-muted-foreground leading-relaxed">
        <p className="font-display font-bold uppercase tracking-widest text-xs text-foreground mb-1">How Peer Reviews Work</p>
        <p>Rate your fellow operators after shared operations. Scores are aggregated across <strong className="text-foreground">all units they've served in</strong> and displayed on their public service file. This helps commanders across the registry gauge operator quality. One review per member — honest assessments only.</p>
      </div>

      {roster.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground">
          <p className="font-display text-sm uppercase tracking-widest">No other roster members to review</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Roster list */}
          <div className="space-y-2">
            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-3">Select Operator to Review</p>
            {roster.map((m: any) => {
              const done = submitted.includes(m.id);
              const isSelected = selected?.id === m.id;
              return (
                <button key={m.id} onClick={() => !done && setSelected(m)} disabled={done}
                  className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                    done ? "opacity-40 cursor-not-allowed border-border" :
                    isSelected ? "border-primary/50 bg-primary/5" :
                    "border-border hover:border-primary/30 bg-card"
                  }`}>
                  <div>
                    <p className="font-display font-bold uppercase tracking-wider text-sm">{m.callsign}</p>
                    {m.rankName && <p className="text-xs text-muted-foreground">{m.rankName}</p>}
                  </div>
                  {done && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                </button>
              );
            })}
          </div>

          {/* Review form */}
          <div>
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-lg text-muted-foreground text-sm text-center px-4">
                <UserCheck className="w-8 h-8 mb-3 opacity-20" />
                <p className="font-display text-xs uppercase tracking-widest">Select an operator to leave a review</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-5 space-y-4">
                <p className="font-display font-black uppercase tracking-widest text-base">{selected.callsign}</p>
                {(["activity","attitude","experience","discipline"] as const).map(field => (
                  <div key={field}>
                    <div className="flex justify-between mb-1">
                      <label className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground capitalize">{field}</label>
                      <span className="text-xs font-bold text-primary">{(form as any)[field]}/10</span>
                    </div>
                    <input type="range" min={1} max={10} value={(form as any)[field]}
                      onChange={e => setForm(f => ({...f, [field]: parseInt(e.target.value)}))}
                      className="w-full accent-primary" />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground block mb-2">Overall Assessment</label>
                  <div className="flex gap-2">
                    {[{v:"commend",label:"Commend",cls:"border-green-500/40 text-green-400"},{v:"neutral",label:"Neutral",cls:"border-border text-muted-foreground"},{v:"caution",label:"Caution",cls:"border-amber-500/40 text-amber-400"}].map(o => (
                      <button key={o.v} onClick={() => setForm(f => ({...f, overall_vote: o.v}))}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest border rounded transition-all ${form.overall_vote === o.v ? o.cls + ' bg-secondary/50' : 'border-border text-muted-foreground'}`}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground block mb-1">Notes (optional)</label>
                  <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                    className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                    placeholder="Brief note about your experience serving with this operator..." />
                </div>
                <div className="flex gap-2">
                  <button onClick={submit} disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-widest text-xs py-2.5 rounded transition-all disabled:opacity-50">
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Submit Review
                  </button>
                  <button onClick={() => setSelected(null)}
                    className="px-4 border border-border rounded text-xs font-display uppercase hover:bg-secondary transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── LOA Request tab ─────────────────────────────────────────────────────── */
function MemberLOATab({ group, showMsg, user, rosterEntry }: any) {
  const [myLoas, setMyLoas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const emptyForm = { reason_category: "Personal", reason_detail: "", start_date: "", end_date: "" };
  const [form, setForm] = useState<any>(emptyForm);

  const CATEGORIES = ["Personal", "Medical", "Work / School", "Travel", "Military Service", "Family", "Other"];

  const load = useCallback(() => {
    if (!rosterEntry) { setLoading(false); return; }
    apiFetch<any>(`/loa?path=list&group_id=${group.id}`)
      .then((r: any) => {
        const all = r.loas ?? [];
        const mine = all.filter((l: any) => l.roster_id === rosterEntry.id || l.user_id === (user as any)?.id);
        setMyLoas(mine.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
      })
      .catch(() => setMyLoas([]))
      .finally(() => setLoading(false));
  }, [group.id, rosterEntry, user]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.start_date || !form.end_date) { showMsg(false, "Start and end date required"); return; }
    if (!rosterEntry) { showMsg(false, "You must be on the roster to request LOA"); return; }
    setSubmitting(true);
    try {
      await apiFetch(`/loa?path=create`, {
        method: "POST",
        body: JSON.stringify({
          group_id: group.id,
          roster_id: rosterEntry.id,
          user_id: (user as any)?.id,
          callsign: rosterEntry.callsign,
          ...form,
        }),
      });
      showMsg(true, "LOA request submitted — awaiting commander approval");
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (e: any) { showMsg(false, e.message); }
    finally { setSubmitting(false); }
  };

  const LOA_STATUS_CLR: Record<string, string> = {
    Pending:  "text-amber-400 border-amber-500/30 bg-amber-500/10",
    Approved: "text-green-400 border-green-500/30 bg-green-500/10",
    Active:   "text-primary border-primary/30 bg-primary/10",
    Denied:   "text-destructive border-destructive/30 bg-destructive/10",
    Expired:  "text-muted-foreground border-border",
  };

  if (!rosterEntry) return (
    <div className="text-center py-16 border border-dashed border-border rounded-lg">
      <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-30" />
      <p className="text-sm font-display uppercase tracking-widest text-muted-foreground">Roster entry not found — contact your commander</p>
    </div>
  );

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-sans">Submit a Leave of Absence request. Your commander will approve or deny it.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-widest text-xs px-4 py-2 rounded transition-all">
            <PlusCircle className="w-3.5 h-3.5" /> Request LOA
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-card border border-primary/30 rounded-lg p-5 space-y-4">
          <h3 className="font-display font-bold uppercase tracking-widest text-sm">New LOA Request</h3>
          <div>
            <label className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground block mb-1">Category</label>
            <select value={form.reason_category} onChange={e => setForm((f: any) => ({...f, reason_category: e.target.value}))}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground block mb-1">Brief Reason</label>
            <textarea rows={3} value={form.reason_detail} onChange={e => setForm((f: any) => ({...f, reason_detail: e.target.value}))}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans resize-none"
              placeholder="Brief explanation (not shared publicly)..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground block mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm((f: any) => ({...f, start_date: e.target.value}))}
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans" />
            </div>
            <div>
              <label className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground block mb-1">End Date</label>
              <input type="date" value={form.end_date} onChange={e => setForm((f: any) => ({...f, end_date: e.target.value}))}
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans" />
            </div>
          </div>
          {form.start_date && form.end_date && (
            <p className="text-xs text-muted-foreground font-sans">
              Duration: {differenceInCalendarDays(new Date(form.end_date), new Date(form.start_date))} day(s)
            </p>
          )}
          <div className="flex gap-2">
            <button onClick={submit} disabled={submitting}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-widest text-xs px-5 py-2.5 rounded disabled:opacity-50">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Submit Request
            </button>
            <button onClick={() => { setShowForm(false); setForm(emptyForm); }}
              className="px-4 border border-border rounded text-xs font-display uppercase hover:bg-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {myLoas.length === 0 && !showForm ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-display uppercase tracking-widest">No LOA history</p>
        </div>
      ) : (
        <div className="space-y-2">
          {myLoas.map((l: any) => (
            <div key={l.id} className="bg-card border border-border rounded-lg p-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${LOA_STATUS_CLR[l.status] ?? ""}`}>{l.status}</span>
                  <span className="font-display font-bold text-sm">{l.reason_category}</span>
                </div>
                <p className="text-xs text-muted-foreground font-sans">
                  {l.start_date} → {l.end_date}
                  {l.reason_detail && <span> · {l.reason_detail}</span>}
                </p>
                {l.status === "Denied" && l.review_note && (
                  <p className="text-xs text-destructive mt-1 font-sans">Reason: {l.review_note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* ─── Unit Review tab ────────────────────────────────────────────────────── */
const REVIEWS_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/groupReviews";

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" disabled={readonly}
          onClick={() => !readonly && onChange?.(n)}
          className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}>
          <Star className={`w-5 h-5 ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
        </button>
      ))}
    </div>
  );
}

function SubScoreRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const colours = ["","bg-red-500","bg-orange-500","bg-yellow-500","bg-blue-500","bg-green-500"];
  const labels  = ["","Poor","Below Avg","Average","Good","Excellent"];
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`w-7 h-7 rounded text-xs font-bold border transition-all ${value === n ? `${colours[n]} text-white border-transparent` : "bg-secondary border-border text-muted-foreground hover:border-primary/40"}`}>
            {n}
          </button>
        ))}
      </div>
      <span className="text-[9px] text-muted-foreground">{labels[value] ?? ""}</span>
    </div>
  );
}

function MemberUnitReviewTab({ group, showMsg, user }: any) {
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting]     = useState<any | null>(null);
  const [editing, setEditing]       = useState(false);
  const [form, setForm] = useState({
    rating: 4,
    organisation: 3,
    communication: 3,
    gameplay: 3,
    community: 3,
    headline: "",
    body: "",
    served_months: "" as number | "",
    recommend: true,
  });

  // Load the user's existing review for this group
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("tag_token") ?? "";
      const res = await fetch(`${REVIEWS_URL}?path=%2Fmine&group_id=${group.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.id) {
        setExisting(data);
        setForm({
          rating:        data.rating ?? 4,
          organisation:  data.organisation ?? 3,
          communication: data.communication ?? 3,
          gameplay:      data.gameplay ?? 3,
          community:     data.community ?? 3,
          headline:      data.headline ?? "",
          body:          data.body ?? "",
          served_months: data.served_months ?? "",
          recommend:     data.recommend ?? true,
        });
      }
    } catch {}
    setLoading(false);
  }, [group.id]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.headline.trim()) { showMsg(false, "Please add a headline for your review"); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("tag_token") ?? "";
      const isEdit = !!existing;
      const url = isEdit
        ? `${REVIEWS_URL}?path=%2Fupdate&id=${existing.id}`
        : `${REVIEWS_URL}?path=%2Fcreate`;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, group_id: group.id, group_name: group.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit review");
      showMsg(true, isEdit ? "Review updated!" : "Review published!");
      setEditing(false);
      await load();
    } catch (e: any) {
      showMsg(false, e.message ?? "Failed to submit review");
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!existing || !confirm("Delete your review? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("tag_token") ?? "";
      await fetch(`${REVIEWS_URL}?path=%2Fdelete&id=${existing.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      showMsg(true, "Review deleted");
      setExisting(null);
      setEditing(false);
      setForm({ rating:4, organisation:3, communication:3, gameplay:3, community:3, headline:"", body:"", served_months:"", recommend:true });
    } catch { showMsg(false, "Failed to delete review"); }
  };

  const RATING_LABEL: Record<number,string> = { 1:"Terrible", 2:"Poor", 3:"Okay", 4:"Good", 5:"Outstanding" };
  const RATING_COLOR: Record<number,string> = { 1:"text-red-400", 2:"text-orange-400", 3:"text-yellow-400", 4:"text-blue-400", 5:"text-green-400" };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  // ── Existing review display ───────────────────────────────────────────────
  if (existing && !editing) return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-secondary/40 border border-border rounded-lg p-4 text-xs font-sans text-muted-foreground">
        <p className="font-display font-bold uppercase tracking-widest text-xs text-foreground mb-1">Your Review is Live</p>
        <p>This review is visible on <strong className="text-foreground">{group.name}</strong>'s public registry page. You can edit or delete it at any time.</p>
      </div>

      <div className="border border-border bg-card rounded-xl p-5 space-y-4">
        {/* Stars + headline */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <StarRating value={existing.rating} readonly />
            <p className={`text-sm font-display font-bold mt-1 ${RATING_COLOR[existing.rating] ?? "text-foreground"}`}>{RATING_LABEL[existing.rating]}</p>
          </div>
          {existing.recommend !== undefined && (
            <span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-1 rounded border flex items-center gap-1 ${existing.recommend ? "border-green-500/40 text-green-400 bg-green-500/5" : "border-red-500/40 text-red-400 bg-red-500/5"}`}>
              {existing.recommend ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
              {existing.recommend ? "Recommended" : "Not Recommended"}
            </span>
          )}
        </div>
        <div>
          <p className="font-display font-bold text-sm text-foreground">{existing.headline}</p>
          {existing.body && <p className="text-xs font-sans text-muted-foreground mt-1.5 leading-relaxed">{existing.body}</p>}
        </div>
        {/* Sub-scores */}
        {(existing.organisation || existing.communication || existing.gameplay || existing.community) && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 border-t border-border pt-3">
            {[["Organisation", existing.organisation],["Communication", existing.communication],["Gameplay",existing.gameplay],["Community",existing.community]].map(([l,v]) =>
              v ? (
                <div key={l} className="flex items-center justify-between">
                  <span className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">{l}</span>
                  <span className="text-xs font-display font-bold text-foreground">{v}/5</span>
                </div>
              ) : null
            )}
          </div>
        )}
        {existing.served_months && (
          <p className="text-[10px] font-sans text-muted-foreground border-t border-border pt-2">Served approx. {existing.served_months} month{existing.served_months !== 1 ? "s" : ""}</p>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-1.5 bg-primary/20 border border-primary/40 text-primary rounded font-display text-xs uppercase tracking-widest hover:bg-primary/30 transition-colors">
          Edit Review
        </button>
        <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded font-display text-xs uppercase tracking-widest hover:bg-red-500/20 transition-colors">
          Delete
        </button>
      </div>
    </div>
  );

  // ── Write / Edit form ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Info banner */}
      <div className="bg-secondary/40 border border-border rounded-lg p-4 text-xs font-sans text-muted-foreground leading-relaxed">
        <p className="font-display font-bold uppercase tracking-widest text-xs text-foreground mb-1">
          {editing ? "Edit Your Review" : "Write a Unit Review"}
        </p>
        <p>
          Your review of <strong className="text-foreground">{group.name}</strong> will be publicly visible on their registry listing page. Only current or former roster members can submit reviews. Be honest — this helps other operators make informed decisions.
        </p>
      </div>

      <div className="border border-border bg-card rounded-xl p-5 space-y-5">
        {/* Overall rating */}
        <div>
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Overall Rating *</p>
          <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
          <p className={`text-xs font-display font-bold mt-1 ${RATING_COLOR[form.rating] ?? "text-foreground"}`}>{RATING_LABEL[form.rating]}</p>
        </div>

        {/* Headline */}
        <div>
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Headline *</p>
          <input
            value={form.headline}
            onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
            placeholder='e.g. "Outstanding unit, highly professional command structure"'
            maxLength={120}
            className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Body */}
        <div>
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Full Review <span className="font-normal normal-case">(optional)</span></p>
          <textarea
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="Share your experience — ops quality, leadership, community atmosphere, training standards..."
            rows={4}
            className="w-full bg-secondary border border-border rounded px-3 py-2 text-xs font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
          />
        </div>

        {/* Sub-scores */}
        <div>
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-3">Category Scores <span className="font-normal normal-case">(optional)</span></p>
          <div className="space-y-2.5">
            <SubScoreRow label="Organisation" value={form.organisation} onChange={v => setForm(f => ({ ...f, organisation: v }))} />
            <SubScoreRow label="Communication" value={form.communication} onChange={v => setForm(f => ({ ...f, communication: v }))} />
            <SubScoreRow label="Gameplay" value={form.gameplay} onChange={v => setForm(f => ({ ...f, gameplay: v }))} />
            <SubScoreRow label="Community" value={form.community} onChange={v => setForm(f => ({ ...f, community: v }))} />
          </div>
        </div>

        {/* Time served + recommend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
          <div>
            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Time Served (months)</p>
            <input
              type="number" min="1" max="120"
              value={form.served_months}
              onChange={e => setForm(f => ({ ...f, served_months: e.target.value === "" ? "" : Number(e.target.value) }))}
              placeholder="e.g. 6"
              className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Would you recommend?</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm(f => ({ ...f, recommend: true }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-display font-bold uppercase tracking-widest transition-all ${form.recommend ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-secondary border-border text-muted-foreground hover:border-green-500/30"}`}>
                <ThumbsUp className="w-3.5 h-3.5" /> Yes
              </button>
              <button type="button" onClick={() => setForm(f => ({ ...f, recommend: false }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-display font-bold uppercase tracking-widest transition-all ${!form.recommend ? "bg-red-500/20 border-red-500/50 text-red-400" : "bg-secondary border-border text-muted-foreground hover:border-red-500/30"}`}>
                <ThumbsDown className="w-3.5 h-3.5" /> No
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button onClick={handleSubmit} disabled={submitting || !form.headline.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded font-display text-xs uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50">
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {editing ? "Save Changes" : "Publish Review"}
          </button>
          {editing && (
            <button onClick={() => setEditing(false)} className="px-4 py-2 border border-border rounded font-display text-xs uppercase tracking-widest text-muted-foreground hover:border-primary/40 transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground font-sans">
        Reviews are moderated. Abusive, misleading, or spam reviews will be removed. One review per unit.
      </p>
    </div>
  );
}

/* ─── Service File tab ────────────────────────────────────────────────────── */
function MemberServiceFileTab({ user }: any) {
  const [rep, setRep] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    apiFetch<any>(`/api/reputation/${user.id}`)
      .then(setRep)
      .catch(() => setRep(null))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const GRADE_COLORS: Record<string, string> = {
    ELITE: "#fbbf24", TRUSTED: "#4ade80", STANDARD: "#60a5fa",
    CAUTION: "#fb923c", "HIGH RISK": "#f87171", BLACKLISTED: "#ef4444", UNRATED: "#6b7280",
  };

  const score = rep?.score;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-secondary/30 border border-border rounded-lg p-4 text-sm font-sans text-muted-foreground">
        <p>This is your <strong className="text-foreground">public operator service file</strong> — what commanders see when they look you up. Scores are built from commander and peer reviews across all units you've served in.</p>
      </div>

      {!score || score.grade === "UNRATED" ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-display text-sm uppercase tracking-widest text-muted-foreground">No reviews yet</p>
          <p className="text-xs text-muted-foreground font-sans mt-1">Your service file will populate as commanders and peers submit reviews after operations</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overall */}
          <div className="bg-card border border-border rounded-lg p-6 flex items-center gap-6">
            <div className="text-center">
              <p className="text-6xl font-black" style={{ color: GRADE_COLORS[score.grade] ?? "#6b7280" }}>{score.overall}</p>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GRADE_COLORS[score.grade] ?? "#6b7280" }}>{score.grade}</p>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Activity",   value: score.activity },
                  { label: "Attitude",   value: score.attitude },
                  { label: "Experience", value: score.experience },
                  { label: "Discipline", value: score.discipline },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground font-display uppercase tracking-wider">{s.label}</span>
                      <span className="font-bold text-foreground">{s.value?.toFixed(1) ?? "—"}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${((s.value ?? 0) / 10) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground font-sans mt-3">{rep.review_count} review{rep.review_count !== 1 ? "s" : ""} submitted</p>
            </div>
          </div>
          {/* Reviews list */}
          {Array.isArray(rep.reviews) && rep.reviews.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Individual Reviews</p>
              {rep.reviews.map((r: any, i: number) => (
                <div key={i} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display font-bold text-xs uppercase tracking-widest text-foreground">{r.group_name ?? "Anonymous"}</p>
                      {r.notes && <p className="text-xs text-muted-foreground font-sans mt-1 leading-relaxed">{r.notes}</p>}
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border shrink-0 ${
                      r.overall_vote === "commend" ? "text-green-400 border-green-500/30" :
                      r.overall_vote === "caution" ? "text-amber-400 border-amber-500/30" :
                      "text-muted-foreground border-border"
                    }`}>{r.overall_vote}</span>
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
