import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import {
  Search, Briefcase, Users, Plus, X, ChevronDown, ChevronUp,
  Shield, Star, AlertTriangle, CheckCircle2, Clock, Trash2, Film, Newspaper, ExternalLink,
  Edit3, Send, Filter, Globe, Crosshair, Crown, ExternalLink, ArrowLeft
} from "lucide-react";
import { Link, useLocation } from "wouter";

const MARKET_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/recruitmentMarket";

const GAMES = [
  "Arma 3","Arma Reforger","Squad","Hell Let Loose","Ready Or Not",
  "EFT","Ground Branch","DayZ","GZW","Body Cam","Operator","Exfil"
];

const ROLE_TAGS = [
  "Section Commander","Platoon Commander","Company Commander",
  "Rifleman","Automatic Rifleman","Grenadier","Designated Marksman","Sniper",
  "JTAC","Mortar Operator","Machine Gunner","Anti-Tank",
  "Medic","Combat Engineer","Breacher","EOD",
  "Pilot","Co-Pilot","Crew Chief","Door Gunner",
  "Vehicle Commander","Driver","Gunner",
  "Intelligence Officer","Signals","Logistics","Staff Officer"
];

const GRADE_STYLE: Record<string, string> = {
  ELITE:    "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  TRUSTED:  "bg-green-500/20 text-green-400 border-green-500/40",
  STANDARD: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  CAUTION:  "bg-orange-500/20 text-orange-400 border-orange-500/40",
  "HIGH RISK": "bg-red-500/20 text-red-400 border-red-500/40",
  UNRATED:  "bg-secondary text-muted-foreground border-border",
};

function authHeaders() {
  const token = sessionStorage.getItem("tag_token") || localStorage.getItem("tag_token") || "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

/* ─── Vacancy Card ──────────────────────────────────────────────────────── */
function VacancyCard({ v, onApply }: { v: any; onApply: (v: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors">
      <div className="p-4">
        <div className="flex items-start gap-3">
          {v.group_logo_url
            ? <img src={v.group_logo_url} className="w-10 h-10 rounded object-cover shrink-0 border border-border" />
            : <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center shrink-0"><Shield className="w-5 h-5 text-muted-foreground" /></div>
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-bold text-sm text-foreground uppercase tracking-wide">{v.title}</span>
              <span className="text-xs border border-primary/30 text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">{v.role_tag}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{v.group_name}{v.group_tag ? ` · [${v.group_tag}]` : ""}</div>
          </div>
          <button onClick={() => onApply(v)} className="shrink-0 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded font-display font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors">
            Apply
          </button>
        </div>

        {/* Games */}
        {Array.isArray(v.games) && v.games.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {v.games.map((g: string) => (
              <span key={g} className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border">{g}</span>
            ))}
          </div>
        )}

        {/* Hard requirements */}
        <div className="flex flex-wrap gap-2 mt-3">
          {v.min_ops && <span className="text-xs flex items-center gap-1 text-amber-400"><Crosshair className="w-3 h-3" />{v.min_ops}+ ops</span>}
          {v.require_no_blacklist && <span className="text-xs flex items-center gap-1 text-green-400"><CheckCircle2 className="w-3 h-3" />No blacklist</span>}
          {v.min_reputation_score && <span className="text-xs flex items-center gap-1 text-blue-400"><Star className="w-3 h-3" />Rep {v.min_reputation_score}+</span>}
          {v.require_prior_leadership && <span className="text-xs flex items-center gap-1 text-purple-400"><Crown className="w-3 h-3" />Leadership exp.</span>}
        </div>

        {/* Expand */}
        <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-1 text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors">
          {expanded ? <><ChevronUp className="w-3 h-3" />Less</> : <><ChevronDown className="w-3 h-3" />More details</>}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border bg-secondary/20 p-4 space-y-3 text-xs text-muted-foreground">
          {v.description && <p className="text-foreground/80">{v.description}</p>}
          {v.our_standard && <div><span className="text-foreground font-semibold">Our standard: </span>{v.our_standard}</div>}
          {v.selection_process && <div><span className="text-foreground font-semibold">Selection: </span>{v.selection_process}</div>}
          {v.probation_detail && <div><span className="text-foreground font-semibold">Probation: </span>{v.probation_detail}</div>}
          {v.preferred_timezone && <div><span className="text-foreground font-semibold">Timezone: </span>{v.preferred_timezone}</div>}
          {v.preferred_availability && <div><span className="text-foreground font-semibold">Availability: </span>{v.preferred_availability}</div>}
          {v.comms_standard && <div><span className="text-foreground font-semibold">Comms: </span>{v.comms_standard}</div>}
          {v.applicant_count > 0 && <div className="text-muted-foreground">{v.applicant_count} applicant{v.applicant_count !== 1 ? "s" : ""}</div>}
        </div>
      )}
    </div>
  );
}

/* ─── Operator Card ─────────────────────────────────────────────────────── */
function OperatorCard({ op }: { op: any }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display font-bold text-sm text-foreground uppercase tracking-wide">{op.username}</div>
          {op.nationality && <div className="text-xs text-muted-foreground mt-0.5">{op.nationality}</div>}
        </div>
        <div className="flex flex-col items-end gap-1">
          {op.rep_grade && op.rep_grade !== "UNRATED" && (
            <span className={`text-xs px-2 py-0.5 rounded border font-mono font-bold ${GRADE_STYLE[op.rep_grade] ?? GRADE_STYLE.UNRATED}`}>
              {op.rep_grade}
            </span>
          )}
          {op.total_ops > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Crosshair className="w-3 h-3" />{op.total_ops} ops</span>
          )}
        </div>
      </div>

      {Array.isArray(op.role_tags) && op.role_tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {op.role_tags.map((r: string) => (
            <span key={r} className="text-xs bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded">{r}</span>
          ))}
        </div>
      )}

      {Array.isArray(op.games) && op.games.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {op.games.map((g: string) => (
            <span key={g} className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border">{g}</span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
        {op.timezone && <span><Globe className="w-3 h-3 inline mr-1" />{op.timezone}</span>}
        {op.availability && <span><Clock className="w-3 h-3 inline mr-1" />{op.availability}</span>}
        {op.prior_leadership && <span className="text-purple-400"><Crown className="w-3 h-3 inline mr-1" />Leadership exp.</span>}
      </div>

      {op.notes && <p className="text-xs text-muted-foreground mt-3 border-t border-border pt-3">{op.notes}</p>}

      <Link href={`/u/${op.username}`} className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline">
        <ExternalLink className="w-3 h-3" />View profile
      </Link>
    </div>
  );
}

/* ─── Apply Modal ───────────────────────────────────────────────────────── */
function ApplyModal({ vacancy, onClose, onSuccess }: { vacancy: any; onClose: () => void; onSuccess: () => void }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setSaving(true); setErr(null);
    try {
      const res = await fetch(`${MARKET_URL}?path=/vacancies/${vacancy.id}/apply`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify({ cover_note: note }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Failed to apply"); setSaving(false); return; }
      onSuccess();
    } catch (e: any) { setErr(e.message); setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold uppercase tracking-widest text-sm">Apply — {vacancy.title}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{vacancy.group_name} · {vacancy.role_tag}</p>
        {err && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2 mb-3">{err}</div>}
        <textarea
          className="w-full bg-secondary border border-border rounded p-3 text-sm resize-none h-32 focus:outline-none focus:border-primary"
          placeholder="Cover note (optional) — tell them why you're a good fit..."
          value={note} onChange={e => setNote(e.target.value)}
        />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 text-xs py-2 rounded border border-border text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 text-xs py-2 rounded bg-primary text-primary-foreground font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-3 h-3 border border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> : <Send className="w-3 h-3" />}
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Operator Listing Form ─────────────────────────────────────────────── */
function MyListingPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [listing, setListing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [form, setForm] = useState({
    role_tags: [] as string[], games: [] as string[],
    timezone: "", availability: "", doctrine_style: "",
    prior_leadership: false, notes: "",
  });

  useEffect(() => {
    fetch(`${MARKET_URL}?path=/operators/mine`, { headers: authHeaders() })
      .then(r => r.json()).then(d => {
        if (d && d.id) {
          setListing(d);
          setForm({ role_tags: d.role_tags ?? [], games: d.games ?? [], timezone: d.timezone ?? "", availability: d.availability ?? "", doctrine_style: d.doctrine_style ?? "", prior_leadership: !!d.prior_leadership, notes: d.notes ?? "" });
        }
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  function toggleArr(key: "role_tags" | "games", val: string) {
    setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val] }));
  }

  async function save() {
    setSaving(true); setErr(null); setOk(false);
    try {
      const res = await fetch(`${MARKET_URL}?path=/operators`, { method: "POST", headers: authHeaders(), body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) { setErr(d.error ?? "Failed to save"); setSaving(false); return; }
      setListing(d); setOk(true); setSaving(false);
    } catch (e: any) { setErr(e.message); setSaving(false); }
  }

  async function remove() {
    if (!confirm("Remove your availability listing?")) return;
    setSaving(true);
    await fetch(`${MARKET_URL}?path=/operators/mine`, { method: "DELETE", headers: authHeaders() });
    setListing(null); setSaving(false); setForm({ role_tags: [], games: [], timezone: "", availability: "", doctrine_style: "", prior_leadership: false, notes: "" });
  }

  async function toggleStatus() {
    const newStatus = listing?.status === "active" ? "inactive" : "active";
    const res = await fetch(`${MARKET_URL}?path=/operators/mine/status`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ status: newStatus }) });
    const d = await res.json();
    setListing(d);
  }

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-5 h-5 border border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="bg-card border border-border rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-bold uppercase tracking-widest text-sm">My Availability Listing</h3>
        <div className="flex gap-2">
          {listing && (
            <>
              <button onClick={toggleStatus} className={`text-xs px-3 py-1.5 rounded border font-bold uppercase tracking-wide transition-colors ${listing.status === "active" ? "border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {listing.status === "active" ? "Active" : "Inactive"}
              </button>
              <button onClick={remove} disabled={saving} className="text-xs px-3 py-1.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3 h-3" /></button>
            </>
          )}
          <button onClick={onClose} className="text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"><X className="w-3 h-3" /></button>
        </div>
      </div>

      {err && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2 mb-4">{err}</div>}
      {ok && <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded p-2 mb-4">Listing saved ✓</div>}

      <div className="space-y-5">
        {/* Role Tags */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Roles I can fill</label>
          <div className="flex flex-wrap gap-1.5">
            {ROLE_TAGS.map(r => (
              <button key={r} onClick={() => toggleArr("role_tags", r)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${form.role_tags.includes(r) ? "bg-primary/20 text-primary border-primary/40" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Games */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Games</label>
          <div className="flex flex-wrap gap-1.5">
            {GAMES.map(g => (
              <button key={g} onClick={() => toggleArr("games", g)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${form.games.includes(g) ? "bg-primary/20 text-primary border-primary/40" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 block">Timezone</label>
            <input className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="e.g. GMT, EST, AEST" value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 block">Availability</label>
            <input className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="e.g. Weekends, Evenings" value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 block">Doctrine Style</label>
          <input className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="e.g. British Army doctrine, NATO, casual milsim" value={form.doctrine_style} onChange={e => setForm(f => ({ ...f, doctrine_style: e.target.value }))} />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 block">Additional notes</label>
          <textarea className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:border-primary" placeholder="Anything else units should know..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.prior_leadership} onChange={e => setForm(f => ({ ...f, prior_leadership: e.target.checked }))} className="accent-primary" />
          <span className="text-sm text-foreground">I have prior leadership experience</span>
        </label>

        <button onClick={save} disabled={saving} className="w-full py-2.5 bg-primary text-primary-foreground font-display font-bold uppercase tracking-widest text-xs rounded hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <div className="w-3 h-3 border border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> : null}
          {listing ? "Update Listing" : "Post Listing"}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function RecruitmentMarketplace() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"vacancies" | "operators" | "unit_news" | "unit_media">("vacancies");
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGame, setFilterGame] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [search, setSearch] = useState("");
  const [applyTarget, setApplyTarget] = useState<any | null>(null);
  const [showMyListing, setShowMyListing] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${MARKET_URL}?path=/vacancies`).then(r => r.json()).catch(() => []),
      fetch(`${MARKET_URL}?path=/operators`).then(r => r.json()).catch(() => []),
    ]).then(([v, o]) => {
      setVacancies(Array.isArray(v) ? v : []);
      setOperators(Array.isArray(o) ? o : []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (tab !== "unit_news" && tab !== "unit_media") return;
    setPostsLoading(true);
    const jwt = sessionStorage.getItem("tag_auth_token") ?? localStorage.getItem("tag_auth_token") ?? "";
    const category = tab === "unit_news" ? "unit" : "media";
    fetch(`https://agent-tag-lead-developer-cff87ae4.base44.app/functions/posts?category=${category}&limit=50`, {
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setForumPosts(Array.isArray(data) ? data : data.posts ?? []))
      .catch(() => setForumPosts([]))
      .finally(() => setPostsLoading(false));
  }, [tab]);

  const filteredVacancies = vacancies.filter(v => {
    if (filterGame && !(v.games ?? []).includes(filterGame)) return false;
    if (filterRole && v.role_tag !== filterRole) return false;
    if (search && !v.title.toLowerCase().includes(search.toLowerCase()) && !v.group_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredOperators = operators.filter(o => {
    if (filterGame && !(o.games ?? []).includes(filterGame)) return false;
    if (filterRole && !(o.role_tags ?? []).includes(filterRole)) return false;
    if (search && !o.username.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-4">
            <Link href="/forum" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit">
              <ArrowLeft className="w-3.5 h-3.5" />Back to Forum
            </Link>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display font-black uppercase tracking-widest text-2xl text-foreground">Recruitment Marketplace</h1>
              <p className="text-muted-foreground text-sm mt-1">Units looking for operators. Operators looking for units.</p>
            </div>
            {user && (
              <button onClick={() => setShowMyListing(s => !s)}
                className="flex items-center gap-2 text-xs bg-primary text-primary-foreground px-4 py-2 rounded font-display font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors shrink-0">
                {showMyListing ? <X className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                {showMyListing ? "Close" : "My Listing"}
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 mt-6">
            {([
              ["vacancies",   "Unit Vacancies",    Briefcase,  vacancies.length],
              ["operators",   "Available Operators", Users,    operators.length],
              ["unit_news",   "Unit News",         Newspaper,  null],
              ["unit_media",  "Unit Media",        Film,       null],
            ] as [string, string, any, number|null][]).map(([id, label, Icon, count]) => (
              <button key={id} onClick={() => { setTab(id as any); setSearch(""); }}
                className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-display font-bold uppercase tracking-wide transition-colors ${tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground border border-border"}`}>
                <Icon className="w-3 h-3" />{label}
                {count !== null && <span className="ml-1 opacity-60">{count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* My Listing Panel */}
        {showMyListing && <MyListingPanel onClose={() => setShowMyListing(false)} />}

        {/* Apply success message */}
        {applySuccess && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3 text-sm text-green-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Application submitted! The unit will be in touch via your profile or messaging.
            <button onClick={() => setApplySuccess(false)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              className="w-full bg-card border border-border rounded pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary"
              placeholder={tab === "vacancies" ? "Search vacancies or units..." : "Search operators..."}
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select value={filterGame} onChange={e => setFilterGame(e.target.value)}
            className="bg-card border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
            <option value="">All games</option>
            {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="bg-card border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
            <option value="">All roles</option>
            {ROLE_TAGS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {(filterGame || filterRole || search) && (
            <button onClick={() => { setFilterGame(""); setFilterRole(""); setSearch(""); }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <X className="w-3 h-3" />Clear
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : tab === "vacancies" ? (
          filteredVacancies.length === 0 ? (
            <div className="text-center py-20">
              <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No vacancies found.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Units can post vacancies from their HQ → Recruitment tab.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVacancies.map(v => <VacancyCard key={v.id} v={v} onApply={setApplyTarget} />)}
            </div>
          )
        ) : tab === "operators" ? (
          filteredOperators.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No operators currently listed.</p>
              {user && <p className="text-xs text-muted-foreground/60 mt-1">Click "My Listing" above to post your availability.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOperators.map(o => <OperatorCard key={o.id} op={o} />)}
            </div>
          )
        ) : postsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : forumPosts.length === 0 ? (
          <div className="text-center py-20">
            {tab === "unit_news"
              ? <Newspaper className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              : <Film className="w-8 h-8 text-muted-foreground mx-auto mb-3" />}
            <p className="text-muted-foreground text-sm">No {tab === "unit_news" ? "unit news" : "unit media"} posts yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Post from the Community Board → {tab === "unit_news" ? "Unit News" : "Unit Media"} category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forumPosts.map((p: any) => (
              <div key={p.id} className="bg-card border border-border rounded-lg p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-display uppercase tracking-wide">{p.username ?? p.user_id}</p>
                    <h3 className="text-sm font-bold font-display text-foreground mt-0.5 line-clamp-2">{p.title}</h3>
                  </div>
                  <Link href="/forum" className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {p.image_url && (
                  <img src={p.image_url} alt={p.title} className="w-full rounded object-cover max-h-48" />
                )}
                {p.body && !p.image_url && (
                  <p className="text-xs text-muted-foreground line-clamp-3">{p.body}</p>
                )}
                <p className="text-xs text-muted-foreground/50 mt-auto">{p.created_date ? new Date(p.created_date).toLocaleDateString("en-GB") : ""}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {applyTarget && (
        <ApplyModal
          vacancy={applyTarget}
          onClose={() => setApplyTarget(null)}
          onSuccess={() => { setApplyTarget(null); setApplySuccess(true); }}
        />
      )}
    </div>
  );
}
