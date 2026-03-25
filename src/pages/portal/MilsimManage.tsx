import { useEffect, useState, useCallback, useRef, type ElementType } from "react";
import { useUpload } from "@/stubs/object-storage-web";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { apiFetch } from "@/lib/apiFetch";
import {
  BRANCHES, UNIT_TYPES_BY_BRANCH, GAMES_LIST as MC_GAMES, type Branch,
} from "@/lib/milsimConstants";
import {
  Shield, Crosshair, Award, Users, FileText, BookOpen,
  Plus, Trash2, Loader2, Save, CheckCircle2, AlertCircle, ExternalLink,
  Pencil, Check, X, Radio, Star, Medal, Wifi, WifiOff,
  GraduationCap, Siren, ClipboardList, MapPin, GitBranch, Activity, Megaphone, ChevronDown, ChevronUp, Upload, FileCheck, Brain, AlertTriangle, Eye,
  CalendarDays, PlaneTakeoff, Clock, RefreshCw, Ban
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import OrbatBuilder from "@/components/OrbatBuilder";
import { useAuth } from "@/components/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Role { id: number; name: string; description: string | null; sortOrder: number }
interface Rank { id: number; name: string; abbreviation: string | null; tier: number }
interface RosterEntry { id: number; callsign: string; rankId: number | null; roleId: number | null; notes: string | null }
interface AppQuestion { id: number; question: string; sortOrder: number; required: boolean }
interface MilsimAward { id: number; title: string; description: string | null; icon: string; awarded_by: string | null; awarded_at: string; roster_entry_id: number; callsign: string | null }

interface GroupDetail {
  id: number; name: string; slug: string; tagLine: string | null;
  description: string | null; discordUrl: string | null; websiteUrl: string | null;
  steamGroupUrl: string | null;
  logoUrl: string | null; sops: string | null; orbat: string | null; status: string;
  stream_url: string | null; is_live: boolean;
  roles: Role[]; ranks: Rank[]; roster: RosterEntry[]; questions: AppQuestion[];
}

type Tab = "info" | "roles" | "ranks" | "roster" | "reputation" | "awards" | "stream" | "sops" | "questions" | "quals" | "ops" | "aars" | "briefings" | "orgchart" | "commendations" | "readiness" | "training" | "loa" | "calendar";

export default function MilsimManage() {
  const [, setLocation] = useLocation();
  const [group, setGroup] = useState<GroupDetail | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("info");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    apiFetch<GroupDetail | null>("/api/milsim-groups/mine/own")
      .then(setGroup)
      .catch(() => setGroup(null));
  }, []);

  if (group === undefined) return (
    <PortalLayout>
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    </PortalLayout>
  );

  if (group === null) return (
    <PortalLayout>
      <div className="text-center py-24 border border-dashed border-border rounded-lg">
        <Shield className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-30" />
        <h2 className="font-display font-black text-xl uppercase tracking-wider text-foreground mb-3">No Group Registered</h2>
        <p className="text-muted-foreground font-sans mb-6">You haven't registered a MilSim group yet.</p>
        <button onClick={() => setLocation("/milsim/register")}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-widest text-sm px-6 py-3 rounded clip-angled-sm transition-all">
          <Plus className="w-4 h-4" /> Register Your Unit
        </button>
      </div>
    </PortalLayout>
  );

  const showMsg = (ok: boolean, text: string) => {
    setSaveMsg({ ok, text });
    setTimeout(() => setSaveMsg(null), 3500);
  };

  const TABS: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: "info", label: "Info", icon: Shield },
    { id: "roles", label: "Roles", icon: Crosshair },
    { id: "ranks", label: "Ranks", icon: Award },
    { id: "roster", label: "Roster", icon: Users },
    { id: "awards", label: "Awards", icon: Medal },
    { id: "reputation", label: "Service Files", icon: Star },
    { id: "commendations", label: "Commendations", icon: Megaphone },
    { id: "quals", label: "Qualifications", icon: GraduationCap },
    { id: "ops", label: "Live Ops", icon: Siren },
    { id: "aars", label: "AARs", icon: ClipboardList },
    { id: "briefings", label: "Briefings", icon: MapPin },
    { id: "orgchart", label: "Org Chart", icon: GitBranch },
    { id: "readiness", label: "Readiness", icon: Activity },
    { id: "stream", label: "Stream", icon: Radio },
    { id: "sops", label: "SOPs / ORBAT", icon: BookOpen },
    { id: "questions", label: "App Questions", icon: FileText },
    { id: "training", label: "Training Docs", icon: Brain },
    { id: "loa", label: "LOA Manager", icon: PlaneTakeoff },
    { id: "calendar", label: "Activity Calendar", icon: CalendarDays },
  ];

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display font-black text-2xl uppercase tracking-wider text-foreground">{group.name}</h1>
              <span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                group.status === "featured" ? "bg-accent/20 text-accent border-accent/40"
                : group.status === "approved" ? "bg-primary/20 text-primary border-primary/40"
                : "bg-secondary text-muted-foreground border-border"
              }`}>{group.status}</span>
              {group.is_live && (
                <span className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border bg-red-500/20 text-red-400 border-red-500/40 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full" /> LIVE
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-sans">{group.tagLine ?? "No tag line set"}</p>
          </div>
          <a href={`/milsim/${group.slug}`}
            className="inline-flex items-center gap-2 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground font-display font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded clip-angled-sm transition-all">
            View Public Page <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {saveMsg && (
          <div className={`flex items-center gap-3 p-3 rounded-lg border text-sm font-sans ${saveMsg.ok ? "bg-primary/10 border-primary/30 text-primary" : "bg-destructive/10 border-destructive/30 text-destructive"}`}>
            {saveMsg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {saveMsg.text}
          </div>
        )}

        <div className="flex flex-wrap gap-1 border-b border-border">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 font-display font-bold uppercase tracking-wider text-xs rounded-t border-b-2 transition-all ${
                tab === t.id ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
          {tab === "info" && <InfoTab group={group} onSaved={setGroup} setSaving={setSaving} saving={saving} showMsg={showMsg} />}
          {tab === "roles" && <RolesTab group={group} onUpdated={setGroup} showMsg={showMsg} />}
          {tab === "ranks" && <RanksTab group={group} onUpdated={setGroup} showMsg={showMsg} />}
          {tab === "roster" && <RosterTab group={group} onUpdated={setGroup} showMsg={showMsg} />}
          {tab === "reputation" && <ReputationTab group={group} />}
          {tab === "awards" && <AwardsTab group={group} showMsg={showMsg} />}
          {tab === "commendations" && <CommendationsTab group={group} />}
          {tab === "quals" && <QualsTab group={group} showMsg={showMsg} />}
          {tab === "ops" && <OpsTab group={group} showMsg={showMsg} />}
          {tab === "aars" && <AARsTab group={group} showMsg={showMsg} />}
          {tab === "briefings" && <BriefingsTab group={group} showMsg={showMsg} />}
          {tab === "orgchart" && <OrgChartTab group={group} />}
          {tab === "readiness" && <ReadinessTab group={group} />}
          {tab === "stream" && <StreamTab group={group} onUpdated={setGroup} showMsg={showMsg} />}
          {tab === "sops" && <SopsTab group={group} roster={group.roster} onSaved={setGroup} setSaving={setSaving} saving={saving} showMsg={showMsg} />}
          {tab === "training" && <TrainingDocsTab group={group} showMsg={showMsg} />}
          {tab === "questions" && <QuestionsTab group={group} onUpdated={setGroup} showMsg={showMsg} />}
          {tab === "loa" && <LOATab group={group} showMsg={showMsg} />}
          {tab === "calendar" && <ActivityCalendarTab group={group} showMsg={showMsg} />}
        </motion.div>
      </div>
    </PortalLayout>
  );
}

function MField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}


const MC_COUNTRIES = [
  "🇬🇧 United Kingdom", "🇺🇸 United States", "🇨🇦 Canada",
  "🇦🇺 Australia", "🇳🇿 New Zealand", "🇩🇪 Germany", "🇫🇷 France",
  "🇮🇹 Italy", "🇵🇱 Poland", "🇳🇱 Netherlands", "🇳🇴 Norway",
  "🇸🇪 Sweden", "🇩🇰 Denmark", "🇧🇪 Belgium", "🇪🇸 Spain",
  "🇵🇹 Portugal", "🇹🇷 Turkey", "🇯🇵 Japan", "🇰🇷 South Korea",
  "🇧🇷 Brazil", "International", "Other",
];
const MC_LANGS = [
  "English", "German", "French", "Spanish", "Italian", "Polish",
  "Dutch", "Portuguese", "Norwegian", "Swedish", "Danish", "Turkish",
  "Japanese", "Korean", "Other",
];

function InfoTab({ group, onSaved, setSaving, saving, showMsg }: any) {
  const { register, handleSubmit, watch, setValue } = useForm({ defaultValues: {
    name: group.name, tagLine: group.tagLine ?? "", description: group.description ?? "",
    discordUrl: group.discordUrl ?? "", websiteUrl: group.websiteUrl ?? "", steamGroupUrl: group.steamGroupUrl ?? "", logoUrl: group.logoUrl ?? "",
    country: group.country ?? "", language: group.language ?? "",
    branch: group.branch ?? "", unitType: group.unitType ?? "",
    games: (group.games ?? []) as string[],
  }});
  const gamesValue: string[] = watch("games") ?? [];
  const branchValue: string = watch("branch") ?? "";
  const unitTypeOptions = branchValue ? (UNIT_TYPES_BY_BRANCH[branchValue as Branch] ?? []) : [];
  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const updated = await apiFetch(`/api/milsim-groups/${group.id}/info`, { method: "PATCH", body: JSON.stringify(data) });
      onSaved(updated);
      showMsg(true, "Group info saved.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setSaving(false); }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <MField label="Unit Name"><input {...register("name")} className="mf-input" /></MField>
      <MField label="Tag Line"><input {...register("tagLine")} className="mf-input" /></MField>
      <MField label="Description"><textarea {...register("description")} rows={5} className="mf-input resize-none" /></MField>
      <MField label="Logo URL"><input {...register("logoUrl")} className="mf-input" placeholder="https://i.imgur.com/..." /></MField>
      <MField label="Discord URL"><input {...register("discordUrl")} className="mf-input" placeholder="https://discord.gg/invite" /></MField>
      <MField label="Website URL"><input {...register("websiteUrl")} className="mf-input" placeholder="https://yourunit.com" /></MField>
      <MField label="Steam Group URL"><input {...register("steamGroupUrl")} className="mf-input" placeholder="https://steamcommunity.com/groups/..." /></MField>

      <div className="border-t border-border pt-5">
        <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-4">Discovery & Filtering</p>
        <div className="space-y-4">
          {/* Branch selector */}
          <MField label="Military Branch">
            <div className="flex flex-wrap gap-2 mt-1">
              {BRANCHES.map(b => {
                const sel = branchValue === b;
                return (
                  <button key={b} type="button"
                    onClick={() => { setValue("branch", b); setValue("unitType", ""); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${
                      sel ? "bg-primary/15 border-primary/50 text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}>
                    <span className="w-2 h-2 rounded-full bg-current opacity-60 shrink-0" />{b}
                  </button>
                );
              })}
              {branchValue && (
                <button type="button" onClick={() => { setValue("branch", ""); setValue("unitType", ""); }}
                  className="px-2 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-destructive transition-colors">
                  ✕ Clear
                </button>
              )}
            </div>
          </MField>
          {/* Unit type — context-aware */}
          <MField label="Unit Type">
            <select {...register("unitType")} className="mf-input" disabled={!branchValue}>
              <option value="">{branchValue ? "Select unit type..." : "Select a branch first"}</option>
              {unitTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </MField>
          <MField label="Country / Nationality">
            <select {...register("country")} className="mf-input">
              <option value="">Select...</option>
              {MC_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </MField>
          <MField label="Primary Language">
            <select {...register("language")} className="mf-input">
              <option value="">Select...</option>
              {MC_LANGS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </MField>
          <MField label="Games You Play">
            <div className="flex flex-wrap gap-2 mt-1">
              {MC_GAMES.map(game => {
                const selected = gamesValue.includes(game);
                return (
                  <button key={game} type="button"
                    onClick={() => {
                      const next = selected ? gamesValue.filter(g => g !== game) : [...gamesValue, game];
                      setValue("games", next);
                    }}
                    className={`px-3 py-1.5 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${
                      selected ? "bg-primary/15 border-primary/50 text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {game}
                  </button>
                );
              })}
            </div>
          </MField>
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-3 rounded clip-angled-sm transition-all disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
      </button>
    </form>
  );
}

function SopsTab({ group, onSaved, setSaving, saving, showMsg, roster }: any) {
  const { register, handleSubmit, setValue, watch } = useForm({ defaultValues: { sops: group.sops ?? "", orbat: group.orbat ?? "" } });
  const orbatValue = watch("orbat");

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const updated = await apiFetch(`/api/milsim-groups/${group.id}/info`, { method: "PATCH", body: JSON.stringify(data) });
      onSaved(updated);
      showMsg(true, "Doctrine saved.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setSaving(false); }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <MField label="Standard Operating Procedures (SOPs)">
        <textarea {...register("sops")} rows={10} className="mf-input resize-y font-mono text-sm max-w-3xl"
          placeholder="1. Comms discipline — PTT only when necessary&#10;2. Movement protocols..." />
      </MField>

      <div>
        <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
          Order of Battle (ORBAT) — Visual Builder
        </label>
        <p className="text-xs text-muted-foreground font-sans mb-3">
          Build your unit structure using NATO APP-6 standard symbology. Hover over a unit and click <strong>+</strong> to add subordinate units. Click the unit to edit its type, echelon, and slot count.
        </p>
        <OrbatBuilder
          value={orbatValue}
          onChange={(json) => setValue("orbat", json)}
          groupName={group.name}
          roster={(roster ?? []).map((r: any) => ({
            id: r.id,
            callsign: r.callsign,
            rank: group.ranks?.find((rk: any) => rk.id === r.rankId)?.name ?? undefined,
            role: group.roles?.find((ro: any) => ro.id === r.roleId)?.name ?? undefined,
          }))}
        />
      </div>

      <button type="submit" disabled={saving}
        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-3 rounded clip-angled-sm transition-all disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Doctrine
      </button>
    </form>
  );
}

function RolesTab({ group, onUpdated, showMsg }: any) {
  const [roles, setRoles] = useState<Role[]>(group.roles);
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");
  const [adding, setAdding] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setAdding(true);
    try {
      const role = await apiFetch<Role>(`/api/milsim-groups/${group.id}/roles`, { method: "POST", body: JSON.stringify({ name, description: desc || undefined, sortOrder: roles.length }) });
      const updated = [...roles, role]; setRoles(updated); onUpdated({ ...group, roles: updated });
      setName(""); setDesc(""); showMsg(true, "Role added.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setAdding(false); }
  };

  const remove = async (id: number) => {
    try {
      await apiFetch(`/api/milsim-groups/${group.id}/roles/${id}`, { method: "DELETE" });
      const updated = roles.filter((r) => r.id !== id); setRoles(updated); onUpdated({ ...group, roles: updated });
    } catch (e: any) { showMsg(false, e.message); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-2">
        {roles.length === 0 && <p className="text-muted-foreground font-sans text-sm">No roles added yet.</p>}
        {roles.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 bg-card border border-border rounded-lg px-4 py-3">
            <div>
              <p className="font-display font-bold uppercase tracking-wider text-sm text-foreground">{r.name}</p>
              {r.description && <p className="text-xs text-muted-foreground font-sans">{r.description}</p>}
            </div>
            <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h3 className="font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">Add Role</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mf-input" placeholder="Infantry, Medic, Engineer, Logistics..." />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} className="mf-input" placeholder="Description (optional)" />
        <button onClick={add} disabled={adding || !name.trim()}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded clip-angled-sm transition-all disabled:opacity-50">
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add Role
        </button>
      </div>
    </div>
  );
}

function RanksTab({ group, onUpdated, showMsg }: any) {
  const [ranks, setRanks] = useState<Rank[]>(group.ranks);
  const [name, setName] = useState(""); const [abbr, setAbbr] = useState(""); const [tier, setTier] = useState("0");
  const [adding, setAdding] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setAdding(true);
    try {
      const rank = await apiFetch<Rank>(`/api/milsim-groups/${group.id}/ranks`, { method: "POST", body: JSON.stringify({ name, abbreviation: abbr || undefined, tier: parseInt(tier) || 0 }) });
      const updated = [...ranks, rank].sort((a, b) => b.tier - a.tier);
      setRanks(updated); onUpdated({ ...group, ranks: updated });
      setName(""); setAbbr(""); setTier("0"); showMsg(true, "Rank added.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setAdding(false); }
  };

  const remove = async (id: number) => {
    try {
      await apiFetch(`/api/milsim-groups/${group.id}/ranks/${id}`, { method: "DELETE" });
      const updated = ranks.filter((r) => r.id !== id); setRanks(updated); onUpdated({ ...group, ranks: updated });
    } catch (e: any) { showMsg(false, e.message); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-2">
        {ranks.length === 0 && <p className="text-muted-foreground font-sans text-sm">No ranks added yet.</p>}
        {ranks.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 bg-card border border-border rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded bg-secondary border border-border flex items-center justify-center font-display font-black text-xs text-primary">{r.tier}</span>
              <div>
                <p className="font-display font-bold uppercase tracking-wider text-sm text-foreground">{r.name}</p>
                {r.abbreviation && <p className="text-xs text-muted-foreground font-mono">{r.abbreviation}</p>}
              </div>
            </div>
            <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h3 className="font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">Add Rank</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mf-input" placeholder="Private, Corporal, Sergeant..." />
        <div className="grid grid-cols-2 gap-3">
          <input value={abbr} onChange={(e) => setAbbr(e.target.value)} className="mf-input" placeholder="Abbreviation (e.g. SGT)" />
          <input value={tier} onChange={(e) => setTier(e.target.value)} type="number" className="mf-input" placeholder="Tier (higher = senior)" />
        </div>
        <button onClick={add} disabled={adding || !name.trim()}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded clip-angled-sm transition-all disabled:opacity-50">
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add Rank
        </button>
      </div>
    </div>
  );
}

function RosterTab({ group, onUpdated, showMsg }: any) {
  const [roster, setRoster] = useState<RosterEntry[]>(group.roster);
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<RosterEntry>>({});
  const [callsign, setCallsign] = useState(""); const [rankId, setRankId] = useState(""); const [roleId, setRoleId] = useState(""); const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);

  const rankById = Object.fromEntries(group.ranks.map((r: Rank) => [r.id, r]));
  const roleById = Object.fromEntries(group.roles.map((r: Role) => [r.id, r]));

  const startEdit = (e: RosterEntry) => {
    setEditId(e.id);
    setEditData({ callsign: e.callsign, rankId: e.rankId ?? undefined, roleId: e.roleId ?? undefined, notes: e.notes ?? "" });
  };

  const saveEdit = async (entryId: number) => {
    try {
      const updated = await apiFetch<RosterEntry>(`/api/milsim-groups/${group.id}/roster/${entryId}`, {
        method: "PATCH",
        body: JSON.stringify({
          callsign: editData.callsign,
          rankId: editData.rankId ? Number(editData.rankId) : null,
          roleId: editData.roleId ? Number(editData.roleId) : null,
          notes: editData.notes || undefined,
        }),
      });
      const newRoster = roster.map(r => r.id === entryId ? updated : r);
      setRoster(newRoster); onUpdated({ ...group, roster: newRoster });
      setEditId(null); showMsg(true, "Member updated.");
    } catch (e: any) { showMsg(false, e.message); }
  };

  const add = async () => {
    if (!callsign.trim()) return;
    setAdding(true);
    try {
      const entry = await apiFetch<RosterEntry>(`/api/milsim-groups/${group.id}/roster`, { method: "POST", body: JSON.stringify({ callsign, rankId: rankId ? parseInt(rankId) : null, roleId: roleId ? parseInt(roleId) : null, notes: notes || undefined }) });
      const updated = [...roster, entry]; setRoster(updated); onUpdated({ ...group, roster: updated });
      setCallsign(""); setRankId(""); setRoleId(""); setNotes(""); showMsg(true, "Member added.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setAdding(false); }
  };

  const remove = async (id: number) => {
    try {
      await apiFetch(`/api/milsim-groups/${group.id}/roster/${id}`, { method: "DELETE" });
      const updated = roster.filter((r) => r.id !== id); setRoster(updated); onUpdated({ ...group, roster: updated });
      showMsg(true, "Member removed.");
    } catch (e: any) { showMsg(false, e.message); }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="overflow-x-auto rounded-lg border border-border">
        {roster.length === 0 ? <p className="text-muted-foreground font-sans text-sm p-6">Roster is empty.</p> : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/40">
              <tr>{["Callsign","Rank","Role","Notes","Actions"].map((h) => <th key={h} className="text-left py-3 px-4 font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {roster.map((e) => editId === e.id ? (
                <tr key={e.id} className="bg-primary/5">
                  <td className="px-3 py-2"><input value={editData.callsign ?? ""} onChange={ev => setEditData(d => ({...d, callsign: ev.target.value}))} className="mf-input text-xs py-1.5 w-32" /></td>
                  <td className="px-3 py-2">
                    <select value={editData.rankId ?? ""} onChange={ev => setEditData(d => ({...d, rankId: ev.target.value ? Number(ev.target.value) : undefined}))} className="mf-input text-xs py-1.5">
                      <option value="">—</option>
                      {group.ranks.map((r: Rank) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select value={editData.roleId ?? ""} onChange={ev => setEditData(d => ({...d, roleId: ev.target.value ? Number(ev.target.value) : undefined}))} className="mf-input text-xs py-1.5">
                      <option value="">—</option>
                      {group.roles.map((r: Role) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2"><input value={editData.notes ?? ""} onChange={ev => setEditData(d => ({...d, notes: ev.target.value}))} className="mf-input text-xs py-1.5 w-32" placeholder="Notes..." /></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => saveEdit(e.id)} className="p-1.5 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditId(null)} className="p-1.5 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={e.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="py-3 px-4 font-display font-bold uppercase tracking-wider text-sm text-foreground">{e.callsign}</td>
                  <td className="py-3 px-4 text-muted-foreground">{e.rankId ? rankById[e.rankId]?.name ?? "—" : "—"}</td>
                  <td className="py-3 px-4 text-muted-foreground">{e.roleId ? roleById[e.roleId]?.name ?? "—" : "—"}</td>
                  <td className="py-3 px-4 text-muted-foreground">{e.notes ?? "—"}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(e)} className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(e.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h3 className="font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">Enlist Member</h3>
        <input value={callsign} onChange={(e) => setCallsign(e.target.value)} className="mf-input" placeholder="Callsign" />
        <div className="grid grid-cols-2 gap-3">
          <select value={rankId} onChange={(e) => setRankId(e.target.value)} className="mf-input">
            <option value="">No Rank</option>
            {group.ranks.map((r: Rank) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="mf-input">
            <option value="">No Role</option>
            {group.roles.map((r: Role) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className="mf-input" placeholder="Notes (optional)" />
        <button onClick={add} disabled={adding || !callsign.trim()}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded clip-angled-sm transition-all disabled:opacity-50">
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Enlist
        </button>
      </div>
    </div>
  );
}

const TYPE_DEFS = [
  { id: "medal", label: "Medal", Icon: Medal, desc: "Worn on uniform" },
  { id: "ribbon", label: "Ribbon", Icon: Star, desc: "Service ribbon bar" },
  { id: "qualification-patch", label: "Qual. Patch", Icon: GraduationCap, desc: "Skill or unit patch" },
] as const;

function AwardImage({ path, fallbackIcon: FIcon }: { path: string | null | undefined; fallbackIcon: ElementType }) {
  const cleanPath = path ? path.replace(/^\/objects\//, "") : null;
  return (
    <div className="w-14 h-14 rounded-lg bg-secondary border border-border shrink-0 overflow-hidden flex items-center justify-center">
      {cleanPath ? (
        <img src={`/api/storage/objects/${cleanPath}`} alt="" className="w-full h-full object-contain" />
      ) : (
        <FIcon className="w-7 h-7 text-primary opacity-40" />
      )}
    </div>
  );
}

function AwardsTab({ group, showMsg }: any) {
  const [subView, setSubView] = useState<"library" | "issued">("library");
  const [defs, setDefs] = useState<any[]>([]);
  const [issued, setIssued] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [issuingDefId, setIssuingDefId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [awardType, setAwardType] = useState<"medal" | "ribbon" | "qualification-patch">("medal");
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [qualifiers, setQualifiers] = useState<string[]>([]);
  const [qualInput, setQualInput] = useState("");
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [issueRosterId, setIssueRosterId] = useState("");
  const [issueCitation, setIssueCitation] = useState("");
  const [issuing, setIssuing] = useState(false);

  const { uploadFile, isUploading } = useUpload({
    onError: (e) => showMsg(false, `Upload failed: ${e.message}`),
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, a] = await Promise.all([
        apiFetch<any[]>(`/api/milsim-groups/${group.id}/award-defs`),
        apiFetch<any[]>(`/api/milsim-groups/${group.id}/awards`),
      ]);
      setDefs(d);
      setIssued(a);
    } catch { showMsg(false, "Failed to load awards."); }
    finally { setLoading(false); }
  }, [group.id]);

  useEffect(() => { load(); }, [load]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      showMsg(false, "PNG, JPEG, or WebP only."); return;
    }
    if (file.size > 5 * 1024 * 1024) { showMsg(false, "Max 5 MB."); return; }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    setImagePath(null);
    const res = await uploadFile(file);
    if (res) setImagePath(res.objectPath);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addQualifier = () => {
    const q = qualInput.trim();
    if (!q || qualifiers.includes(q)) return;
    setQualifiers(qs => [...qs, q]);
    setQualInput("");
  };

  const resetCreateForm = () => {
    setName(""); setDesc(""); setAwardType("medal");
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePath(null); setImagePreview(null); setQualifiers([]); setQualInput("");
    setShowCreate(false);
  };

  const createDef = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await apiFetch(`/api/milsim-groups/${group.id}/award-defs`, {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), description: desc || undefined, type: awardType, image_path: imagePath || undefined, qualifiers }),
      });
      resetCreateForm();
      showMsg(true, "Award created.");
      load();
    } catch (e: any) { showMsg(false, e.message); }
    finally { setCreating(false); }
  };

  const deleteDef = async (defId: number) => {
    try {
      await apiFetch(`/api/milsim-groups/${group.id}/award-defs/${defId}`, { method: "DELETE" });
      showMsg(true, "Award deleted.");
      load();
    } catch (e: any) { showMsg(false, e.message); }
  };

  const issueAward = async (defId: number) => {
    if (!issueRosterId) return;
    setIssuing(true);
    try {
      await apiFetch(`/api/milsim-groups/${group.id}/awards`, {
        method: "POST",
        body: JSON.stringify({ rosterEntryId: parseInt(issueRosterId), awardDefId: defId, citation: issueCitation || undefined }),
      });
      showMsg(true, "Award issued.");
      setIssuingDefId(null); setIssueRosterId(""); setIssueCitation("");
      load();
    } catch (e: any) { showMsg(false, e.message); }
    finally { setIssuing(false); }
  };

  const revokeAward = async (id: number) => {
    try {
      await apiFetch(`/api/milsim-groups/${group.id}/awards/${id}`, { method: "DELETE" });
      showMsg(true, "Award revoked."); load();
    } catch (e: any) { showMsg(false, e.message); }
  };

  const parseQuals = (raw: any): string[] => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return []; } }
    return [];
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex gap-1 border-b border-border">
        {([
          { id: "library", label: "Award Library" },
          { id: "issued", label: `Issued (${issued.length})` },
        ] as const).map(v => (
          <button key={v.id} onClick={() => setSubView(v.id)}
            className={`px-4 py-2.5 font-display font-bold uppercase tracking-wider text-xs border-b-2 transition-colors ${subView === v.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {v.label}
          </button>
        ))}
      </div>

      {subView === "library" && (
        <div className="space-y-4">
          {defs.length === 0 && !showCreate ? (
            <div className="text-center py-14 border border-dashed border-border rounded-lg text-muted-foreground">
              <Medal className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-display text-sm uppercase tracking-widest mb-4">No awards defined yet</p>
              <button onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded transition-all">
                <Plus className="w-3.5 h-3.5" /> Create First Award
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {defs.map((d: any) => {
                const typeDef = TYPE_DEFS.find(t => t.id === d.type) ?? TYPE_DEFS[0];
                const { Icon: TypeIcon } = typeDef;
                const isIssuing = issuingDefId === d.id;
                const quals = parseQuals(d.qualifiers);
                return (
                  <div key={d.id} className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="flex items-center gap-4 p-4">
                      <AwardImage path={d.image_path} fallbackIcon={TypeIcon} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-display font-bold uppercase tracking-wider text-sm text-foreground">{d.name}</p>
                          <span className="text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            {typeDef.label}
                          </span>
                        </div>
                        {d.description && <p className="text-xs text-muted-foreground font-sans mt-0.5">{d.description}</p>}
                        {quals.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {quals.map((q: string) => (
                              <span key={q} className="text-[10px] px-1.5 py-0.5 bg-secondary border border-border rounded text-muted-foreground font-display uppercase tracking-wider">{q}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => { setIssuingDefId(isIssuing ? null : d.id); setIssueRosterId(""); setIssueCitation(""); }}
                          className="text-xs font-display font-bold uppercase tracking-widest px-3 py-1.5 bg-accent/10 text-accent border border-accent/30 rounded hover:bg-accent/20 transition-colors">
                          Issue
                        </button>
                        <button onClick={() => deleteDef(d.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {isIssuing && (
                      <div className="border-t border-border bg-secondary/20 px-4 py-3 space-y-3">
                        <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">Issue to Member</p>
                        <select value={issueRosterId} onChange={e => setIssueRosterId(e.target.value)} className="mf-input">
                          <option value="">Select recipient...</option>
                          {group.roster.map((r: RosterEntry) => <option key={r.id} value={r.id}>{r.callsign}</option>)}
                        </select>
                        <input value={issueCitation} onChange={e => setIssueCitation(e.target.value)} className="mf-input" placeholder="Citation / reason (optional)" />
                        <div className="flex gap-2">
                          <button onClick={() => issueAward(d.id)} disabled={issuing || !issueRosterId}
                            className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-background font-display font-bold uppercase tracking-wider text-xs px-4 py-2 rounded transition-all disabled:opacity-50">
                            {issuing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />} Issue Award
                          </button>
                          <button onClick={() => setIssuingDefId(null)} className="px-3 py-2 text-xs font-display uppercase text-muted-foreground hover:text-foreground border border-border rounded transition-colors">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {defs.length > 0 && !showCreate && (
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 text-xs font-display font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Create New Award
            </button>
          )}

          {showCreate && (
            <div className="bg-card border border-primary/30 rounded-lg p-6 space-y-5">
              <h3 className="font-display font-bold uppercase tracking-widest text-sm">Create Award</h3>

              <div>
                <label className="mf-label">Award Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} className="mf-input" placeholder="e.g. Combat Action Badge, Leadership Medal..." />
              </div>

              <div>
                <label className="mf-label">Award Type *</label>
                <div className="grid grid-cols-3 gap-3 mt-1">
                  {TYPE_DEFS.map(t => {
                    const { Icon: TIcon } = t;
                    const selected = awardType === t.id;
                    return (
                      <button key={t.id} onClick={() => setAwardType(t.id as any)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/20 text-muted-foreground hover:border-primary/40"}`}>
                        <TIcon className="w-6 h-6" />
                        <div className="text-center">
                          <p className="font-display font-bold uppercase tracking-wider text-xs">{t.label}</p>
                          <p className="text-[10px] opacity-70 font-sans">{t.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mf-label">Description</label>
                <textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} className="mf-input resize-none" placeholder="Criteria or description for this award..." />
              </div>

              <div>
                <label className="mf-label">Award Image <span className="font-normal normal-case text-muted-foreground">(PNG/JPG/WebP · max 600×600px · 5 MB)</span></label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative mt-1 flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors h-36 ${isUploading ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/40 bg-secondary/20"}`}>
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageSelect} />
                  {imagePreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={imagePreview} alt="Preview" className="h-20 w-20 object-contain rounded" />
                      {isUploading && <p className="text-xs text-primary font-display uppercase tracking-wider animate-pulse">Uploading...</p>}
                      {imagePath && <p className="text-xs text-green-400 font-display uppercase tracking-wider">✓ Uploaded</p>}
                    </div>
                  ) : (
                    <div className="text-center px-4">
                      <p className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground">Drop image here or click to browse</p>
                      <p className="text-[10px] text-muted-foreground font-sans mt-1">Displayed on award card and issued awards log</p>
                    </div>
                  )}
                </div>
                {imagePreview && (
                  <button onClick={() => { if (imagePreview) URL.revokeObjectURL(imagePreview); setImagePreview(null); setImagePath(null); }}
                    className="text-xs text-muted-foreground hover:text-destructive mt-1 transition-colors">Remove image</button>
                )}
              </div>

              <div>
                <label className="mf-label">
                  Qualifiers / Upgrades <span className="font-normal normal-case text-muted-foreground">— optional device attachments (e.g. "V Device", "Gold Star", "Oak Leaf")</span>
                </label>
                <div className="flex gap-2 mt-1">
                  <input
                    value={qualInput}
                    onChange={e => setQualInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addQualifier(); } }}
                    className="mf-input"
                    placeholder="Type qualifier and press Enter..."
                  />
                  <button onClick={addQualifier} disabled={!qualInput.trim()}
                    className="px-3 py-2 bg-secondary border border-border rounded text-xs font-display font-bold uppercase tracking-wider hover:border-primary/40 transition-colors disabled:opacity-40">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {qualifiers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {qualifiers.map(q => (
                      <span key={q} className="flex items-center gap-1 text-xs px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded font-display font-bold uppercase tracking-wider">
                        {q}
                        <button onClick={() => setQualifiers(qs => qs.filter(x => x !== q))} className="hover:text-destructive transition-colors ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={createDef} disabled={creating || !name.trim() || isUploading}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded transition-all disabled:opacity-50">
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Create Award
                </button>
                <button onClick={resetCreateForm}
                  className="px-4 py-2.5 border border-border text-muted-foreground rounded text-xs font-display uppercase hover:text-foreground transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {subView === "issued" && (
        <div className="space-y-3">
          {issued.length === 0 ? (
            <div className="text-center py-14 border border-dashed border-border rounded-lg text-muted-foreground">
              <Award className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-display text-sm uppercase tracking-widest">No awards issued yet</p>
              <p className="text-xs mt-2 font-sans">Go to Award Library to issue awards to roster members</p>
            </div>
          ) : (
            issued.map((a: any) => {
              const typeDef = TYPE_DEFS.find(t => t.id === (a.def_type ?? a.icon)) ?? TYPE_DEFS[0];
              const quals = parseQuals(a.def_qualifiers);
              return (
                <div key={a.id} className="flex items-center gap-4 bg-card border border-border rounded-lg px-5 py-3">
                  <AwardImage path={a.def_image} fallbackIcon={typeDef.Icon} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-bold uppercase tracking-wider text-sm text-foreground">{a.def_name ?? a.title}</p>
                      {a.def_type && (
                        <span className="text-[10px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {typeDef.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-accent font-display font-bold mt-0.5">→ {a.callsign ?? "Unknown"}</p>
                    {a.citation && <p className="text-xs text-muted-foreground font-sans mt-0.5 italic">"{a.citation}"</p>}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {quals.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {quals.map((q: string) => (
                            <span key={q} className="text-[9px] px-1.5 py-0.5 bg-secondary border border-border rounded text-muted-foreground font-display uppercase">{q}</span>
                          ))}
                        </div>
                      )}
                      {a.awarded_by && <p className="text-[10px] text-muted-foreground">by {a.awarded_by}</p>}
                      {a.awarded_at && <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(a.awarded_at), { addSuffix: true })}</p>}
                    </div>
                  </div>
                  <button onClick={() => revokeAward(a.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function StreamTab({ group, onUpdated, showMsg }: any) {
  const [streamUrl, setStreamUrl] = useState(group.stream_url ?? "");
  const [isLive, setIsLive] = useState(group.is_live ?? false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/milsim-groups/${group.id}/stream`, {
        method: "PATCH",
        body: JSON.stringify({ streamUrl: streamUrl || null, isLive }),
      });
      onUpdated({ ...group, stream_url: streamUrl || null, is_live: isLive });
      showMsg(true, isLive ? "Stream is now LIVE!" : "Stream settings saved.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setSaving(false); }
  };

  const getEmbedUrl = (url: string): string | null => {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
        const vid = u.searchParams.get("v") || u.pathname.split("/").pop();
        return vid ? `https://www.youtube.com/embed/${vid}?autoplay=0` : null;
      }
      if (u.hostname.includes("twitch.tv")) {
        const channel = u.pathname.split("/").filter(Boolean)[0];
        return channel ? `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}` : null;
      }
    } catch { /* invalid url */ }
    return null;
  };

  const embedUrl = streamUrl ? getEmbedUrl(streamUrl) : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Radio className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold uppercase tracking-wider">Broadcast Control</h3>
        </div>

        <div>
          <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Stream URL</label>
          <input
            value={streamUrl}
            onChange={e => setStreamUrl(e.target.value)}
            className="mf-input w-full"
            placeholder="https://twitch.tv/yourchannel  or  https://youtube.com/watch?v=..."
          />
          <p className="text-xs text-muted-foreground mt-1">Supports YouTube and Twitch. Visible to anyone viewing your unit page.</p>
        </div>

        <div className="flex items-center justify-between bg-secondary/40 border border-border rounded-lg px-4 py-3">
          <div className="flex items-center gap-3">
            {isLive ? <Wifi className="w-5 h-5 text-red-400" /> : <WifiOff className="w-5 h-5 text-muted-foreground" />}
            <div>
              <p className="font-display font-bold uppercase tracking-wider text-sm">{isLive ? "Broadcasting LIVE" : "Off Air"}</p>
              <p className="text-xs text-muted-foreground">{isLive ? "Visitors can see your live stream" : "Toggle to go live"}</p>
            </div>
          </div>
          <button
            onClick={() => setIsLive(!isLive)}
            className={`relative w-12 h-6 rounded-full transition-colors ${isLive ? "bg-red-500" : "bg-secondary border border-border"}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isLive ? "left-7" : "left-1"}`} />
          </button>
        </div>

        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-2.5 rounded clip-angled-sm transition-all disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Stream Settings
        </button>
      </div>

      {embedUrl && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="font-display font-bold uppercase tracking-wider text-xs">Preview</span>
          </div>
          <div className="aspect-video w-full">
            <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="Stream Preview" />
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionsTab({ group, onUpdated, showMsg }: any) {
  const [questions, setQuestions] = useState<AppQuestion[]>(group.questions);
  const [question, setQuestion] = useState(""); const [required, setRequired] = useState(true);
  const [adding, setAdding] = useState(false);

  const add = async () => {
    if (!question.trim()) return;
    setAdding(true);
    try {
      const q = await apiFetch<AppQuestion>(`/api/milsim-groups/${group.id}/questions`, { method: "POST", body: JSON.stringify({ question, sortOrder: questions.length, required }) });
      const updated = [...questions, q]; setQuestions(updated); onUpdated({ ...group, questions: updated });
      setQuestion(""); setRequired(true); showMsg(true, "Question added.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setAdding(false); }
  };

  const remove = async (id: number) => {
    try {
      await apiFetch(`/api/milsim-groups/${group.id}/questions/${id}`, { method: "DELETE" });
      const updated = questions.filter((q) => q.id !== id); setQuestions(updated); onUpdated({ ...group, questions: updated });
    } catch (e: any) { showMsg(false, e.message); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-sm text-muted-foreground font-sans">These questions are shown publicly on your group profile so prospective applicants know what to prepare.</p>
      <div className="space-y-2">
        {questions.length === 0 && <p className="text-muted-foreground font-sans text-sm">No questions added yet.</p>}
        {questions.map((q, i) => (
          <div key={q.id} className="flex items-start justify-between gap-3 bg-card border border-border rounded-lg px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 shrink-0 rounded bg-primary/10 border border-primary/30 flex items-center justify-center font-display font-bold text-xs text-primary mt-0.5">{i + 1}</span>
              <div>
                <p className="font-sans text-sm text-foreground">{q.question}</p>
                {q.required && <span className="text-[10px] font-display font-bold uppercase text-accent">Required</span>}
              </div>
            </div>
            <button onClick={() => remove(q.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h3 className="font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">Add Question</h3>
        <input value={question} onChange={e => setQuestion(e.target.value)} className="mf-input" placeholder="e.g. How long have you played Squad?" />
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} className="accent-primary w-4 h-4" />
          Required question
        </label>
        <button onClick={add} disabled={adding || !question.trim()}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded clip-angled-sm transition-all disabled:opacity-50">
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add Question
        </button>
      </div>
    </div>
  );
}

// ─── Commendation Wall ────────────────────────────────────────────────────────
function CommendationsTab({ group }: any) {
  const [awards, setAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const ICONS: Record<string, typeof Medal> = { medal: Medal, star: Star, award: Award, shield: Shield };
  useEffect(() => {
    apiFetch<any[]>(`/api/milsim-groups/${group.id}/awards`)
      .then(setAwards).catch(() => {}).finally(() => setLoading(false));
  }, [group.id]);
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-xs text-muted-foreground font-sans">A public record of all commendations bestowed within this unit.</p>
      {awards.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg text-muted-foreground">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-display text-sm uppercase tracking-widest">No commendations on record</p>
        </div>
      ) : (
        <div className="space-y-3">
          {awards.map((a: any) => {
            const IconComp = ICONS[a.icon] ?? Medal;
            return (
              <div key={a.id} className="flex items-center gap-4 bg-card border border-border rounded-lg px-5 py-4">
                <div className="w-11 h-11 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0"><IconComp className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-display font-bold uppercase tracking-wider text-sm text-foreground">{a.title}</p>
                    <span className="text-xs text-muted-foreground">{a.awarded_at ? formatDistanceToNow(new Date(a.awarded_at), { addSuffix: true }) : ""}</span>
                  </div>
                  {a.callsign && <p className="text-xs text-primary font-display font-bold mt-0.5">Awarded to {a.callsign}</p>}
                  {a.description && <p className="text-xs text-muted-foreground font-sans mt-1">{a.description}</p>}
                  {a.awarded_by && <p className="text-xs text-muted-foreground">By {a.awarded_by}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Qualifications ───────────────────────────────────────────────────────────
function QualsTab({ group, showMsg }: any) {
  const [quals, setQuals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(""); const [desc, setDesc] = useState(""); const [adding, setAdding] = useState(false);
  const [grantModal, setGrantModal] = useState<any | null>(null); const [grantRosterId, setGrantRosterId] = useState("");
  const load = () => { apiFetch<any[]>(`/api/milsim-groups/${group.id}/qualifications`).then(setQuals).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [group.id]);
  const add = async () => {
    if (!name.trim()) return; setAdding(true);
    try { await apiFetch(`/api/milsim-groups/${group.id}/qualifications`, { method: "POST", body: JSON.stringify({ name, description: desc || undefined }) }); setName(""); setDesc(""); showMsg(true, "Qualification added."); load(); }
    catch (e: any) { showMsg(false, e.message); } finally { setAdding(false); }
  };
  const remove = async (qid: number) => {
    try { await apiFetch(`/api/milsim-groups/${group.id}/qualifications/${qid}`, { method: "DELETE" }); showMsg(true, "Removed."); load(); }
    catch (e: any) { showMsg(false, e.message); }
  };
  const grant = async (qid: number) => {
    if (!grantRosterId) return;
    try { await apiFetch(`/api/milsim-groups/${group.id}/qualifications/${qid}/grant`, { method: "POST", body: JSON.stringify({ rosterEntryId: parseInt(grantRosterId) }) }); showMsg(true, "Granted."); setGrantModal(null); setGrantRosterId(""); load(); }
    catch (e: any) { showMsg(false, e.message); }
  };
  const revokeGrant = async (qid: number, grantId: number) => {
    try { await apiFetch(`/api/milsim-groups/${group.id}/qualifications/${qid}/grant/${grantId}`, { method: "DELETE" }); showMsg(true, "Revoked."); load(); }
    catch (e: any) { showMsg(false, e.message); }
  };
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  return (
    <div className="max-w-3xl space-y-6">
      {quals.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-lg text-muted-foreground">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-display text-sm uppercase tracking-widest">No qualifications defined</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quals.map((q: any) => (
            <div key={q.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-3"><GraduationCap className="w-4 h-4 text-primary shrink-0" /><div><p className="font-display font-bold uppercase tracking-wider text-sm text-foreground">{q.name}</p>{q.description && <p className="text-xs text-muted-foreground">{q.description}</p>}<p className="text-xs text-muted-foreground">{q.grants?.length ?? 0} qualified</p></div></div>
                <div className="flex gap-2 shrink-0"><button onClick={() => setGrantModal(q)} className="text-xs font-display font-bold uppercase tracking-widest px-3 py-1.5 bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20 transition-colors">Grant</button><button onClick={() => remove(q.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button></div>
              </div>
              {q.grants?.length > 0 && (
                <div className="border-t border-border px-5 py-3 bg-secondary/20">
                  <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Qualified Personnel</p>
                  <div className="flex flex-wrap gap-2">
                    {q.grants.map((g: any) => (<div key={g.id} className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded border border-primary/20">{g.callsign}<button onClick={() => revokeGrant(q.id, g.id)} className="ml-1 hover:text-destructive transition-colors"><X className="w-3 h-3" /></button></div>))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {grantModal && (
        <div className="bg-card border border-primary/30 rounded-lg p-5 space-y-3">
          <h3 className="font-display font-bold uppercase tracking-wider text-sm">Grant: {grantModal.name}</h3>
          <select value={grantRosterId} onChange={e => setGrantRosterId(e.target.value)} className="mf-input"><option value="">Select member...</option>{group.roster.map((r: RosterEntry) => <option key={r.id} value={r.id}>{r.callsign}</option>)}</select>
          <div className="flex gap-2"><button onClick={() => grant(grantModal.id)} disabled={!grantRosterId} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2 rounded transition-all disabled:opacity-50"><Check className="w-3.5 h-3.5" /> Grant</button><button onClick={() => { setGrantModal(null); setGrantRosterId(""); }} className="px-4 py-2 border border-border text-muted-foreground rounded text-xs font-display uppercase hover:text-foreground">Cancel</button></div>
        </div>
      )}
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h3 className="font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">Add Qualification Type</h3>
        <input value={name} onChange={e => setName(e.target.value)} className="mf-input" placeholder="CQB Certified, Medic Qualified, JTAC..." />
        <input value={desc} onChange={e => setDesc(e.target.value)} className="mf-input" placeholder="Description (optional)" />
        <button onClick={add} disabled={adding || !name.trim()} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded clip-angled-sm transition-all disabled:opacity-50">{adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add</button>
      </div>
    </div>
  );
}


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
  const TYPE_COLOR: Record<string, string> = { Op:"text-red-400", Training:"text-yellow-400", Meeting:"text-purple-400", Social:"text-green-400", Admin:"text-muted-foreground", Other:"text-muted-foreground" };
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

  const TIER_META: Record<string, { label: string; colour: string; bg: string; border: string; badge: string; desc: string }> = {
    "ELITE":       { label: "Elite SOF / Special Operations Capable", colour: "text-green-400",      bg: "bg-green-500/10",    border: "border-green-500/40",    badge: "bg-green-500/20 text-green-300 border-green-400/50",       desc: "Extensive op record, elite AAR discipline, and comprehensive multi-type training doctrine. Operates at special operations force standard." },
    "STRATEGIC":   { label: "Strategically Capable",                  colour: "text-emerald-500",   bg: "bg-emerald-600/10",  border: "border-emerald-600/40",  badge: "bg-emerald-600/20 text-emerald-400 border-emerald-500/40", desc: "Proven unit with strong operational output, solid reputation, and well-documented training resources across multiple doctrine types." },
    "OPERATIONAL": { label: "Operationally Capable",                  colour: "text-yellow-400",    bg: "bg-yellow-400/10",   border: "border-yellow-400/40",   badge: "bg-yellow-400/20 text-yellow-300 border-yellow-400/50",    desc: "Active unit with a consistent operational record and growing doctrine framework. Capable of executing standard mission types." },
    "TACTICAL":    { label: "Tactically Capable",                     colour: "text-orange-400",    bg: "bg-orange-500/10",   border: "border-orange-500/40",   badge: "bg-orange-500/20 text-orange-300 border-orange-500/40",    desc: "Building op history and operator experience. Some training doctrine in place. Unit is progressing toward operational readiness." },
    "LIMITED":     { label: "Limited Capability",                        colour: "text-red-400",       bg: "bg-red-500/10",      border: "border-red-500/40",      badge: "bg-red-500/20 text-red-400 border-red-500/40",             desc: "Minimal operational record and insufficient training documentation to meet baseline capability standards." },
    "POOR":        { label: "Poor Capability",                            colour: "text-red-700",       bg: "bg-red-950/20",      border: "border-red-900/50",      badge: "bg-red-950/30 text-red-700 border-red-900/60",             desc: "No established operational record, no doctrine, and no verified activity. Unit has not demonstrated any measurable capability." },
  };

  const tier = readiness.op_capability_tier ?? "POOR";
  const tm = TIER_META[tier] ?? TIER_META["POOR"];

  // Score breakdown for transparency
  const sb = readiness.score_breakdown ?? {};
  const scoreBreakdown = [
    { label: "Manpower",            max: 20, earned: sb.manpower ?? 0,         note: `${readiness.verified_total ?? readiness.total} verified members` },
    { label: "Member Activity",     max: 15, earned: sb.activity ?? 0,         note: `${readiness.active_this_month}/${readiness.total} active (30d)` },
    { label: "Operations History",  max: 20, earned: sb.ops_history ?? 0,      note: `${readiness.valid_ops ?? readiness.total_ops ?? 0} verified ops` },
    { label: "Op Recency",          max: 10, earned: sb.op_recency ?? 0,       note: readiness.days_since_last_op != null ? `Last op ${readiness.days_since_last_op}d ago` : "No ops" },
    { label: "AAR Discipline",      max: 10, earned: sb.aar_discipline ?? 0,   note: `${readiness.completed_ops ?? 0} AARs for ${readiness.valid_ops ?? readiness.total_ops ?? 0} ops` },
    { label: "Training Doctrine",   max: 15, earned: sb.training_doctrine ?? 0,note: `Knowledge factor ${readiness.training?.knowledge_factor ?? 0}/100` },
    { label: "Discord Linked",      max: 5,  earned: sb.discord ?? 0,          note: readiness.has_discord ? "Linked" : "Not linked" },
    { label: "Page Maintenance",    max: 5,  earned: sb.page_maintenance ?? 0, note: readiness.days_since_page_update != null ? `Updated ${readiness.days_since_page_update}d ago` : "Never updated" },
    { label: "Reputation / Reviews",max: 5,  earned: sb.reputation ?? 0,       note: `${readiness.review_count} review${readiness.review_count !== 1 ? "s" : ""}, avg ${readiness.avg_rep_score || "—"}` },
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
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (row.earned / row.max) * 100)}%`,
                    background: row.earned === 0 ? '#ef4444' : row.earned >= row.max * 0.75 ? '#22c55e' : row.earned >= row.max * 0.4 ? '#eab308' : '#f97316' }} />
              </div>
              <span className="text-[10px] font-display shrink-0 w-14 text-right" style={{ color: row.earned === 0 ? '#ef4444' : row.earned >= row.max * 0.75 ? '#22c55e' : row.earned >= row.max * 0.4 ? '#eab308' : '#f97316' }}>{row.earned}/{row.max}</span>
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
          {(["POOR","LIMITED","TACTICAL","OPERATIONAL","STRATEGIC","ELITE"] as const).map(t => {
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
                    {doc.quality_flag === 'amber' && (
                      <span className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-yellow-500/40 text-yellow-400 bg-yellow-500/10" title={doc.ai_summary ?? 'Thin content — review recommended'}>
                        <AlertTriangle className="w-2.5 h-2.5" /> Thin Content
                      </span>
                    )}
                    {doc.quality_flag === 'red' && (
                      <span className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-red-500/40 text-red-400 bg-red-500/10" title={doc.ai_summary ?? 'Suspected low-quality or invalid content'}>
                        <AlertTriangle className="w-2.5 h-2.5" /> Flagged
                      </span>
                    )}
                    {stale && (
                      <span className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-orange-500/40 text-orange-400 bg-orange-500/10">
                        <AlertTriangle className="w-2.5 h-2.5" /> Outdated
                      </span>
                    )}
                  </div>
                  {(doc.quality_flag === 'amber' || doc.quality_flag === 'red') && doc.ai_summary && (
                    <p className="text-[10px] font-sans mt-1 mb-1 italic text-muted-foreground opacity-70">⚠ {doc.ai_summary}</p>
                  )}
                  {doc.description && <p className="text-xs text-muted-foreground font-sans mb-2 line-clamp-2">{doc.description}</p>}
                  <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground font-sans">
                    {doc.page_count && <span>{doc.page_count} pages</span>}
                    {doc.file_name && <span>{doc.file_name}</span>}
                    {doc.file_size_bytes && <span>{(doc.file_size_bytes / 1024).toFixed(0)} KB</span>}
                    {doc.depth_score && <span>Depth: {doc.depth_score}/100</span>}
                    {doc.ai_score != null && <span>AI Score: {doc.ai_score}/100</span>}
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
// ─── Activity Calendar ────────────────────────────────────────────────────────
const EVENT_TYPES = ["Op", "Training", "Meeting", "Social", "Admin", "Other"] as const;

const EV_STYLE: Record<string, string> = {
  Op:       "bg-red-500/15 border-red-500/40 text-red-300",
  Training: "bg-yellow-500/15 border-yellow-500/40 text-yellow-300",
  Meeting:  "bg-purple-500/15 border-purple-500/40 text-purple-300",
  Social:   "bg-green-500/15 border-green-500/40 text-green-300",
  Admin:    "bg-secondary border-border text-muted-foreground",
  Other:    "bg-secondary border-border text-muted-foreground",
  LOA:      "bg-blue-500/10 border-blue-500/30 text-blue-400",
  AAR:      "bg-green-500/10 border-green-500/30 text-green-400",
};

function ActivityCalendarTab({ group, showMsg }: { group: any; showMsg: (m: string, t?: "success"|"error") => void }) {
  const { user } = useAuth();
  const now = new Date();
  const [viewYear, setViewYear]   = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [events, setEvents]   = useState<any[]>([]);
  const [loas, setLoas]       = useState<any[]>([]);
  const [aars, setAars]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", event_type: "Op" as typeof EVENT_TYPES[number],
    scheduled_at: "", end_date: "", description: "", game: "", status: "Planned"
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [opsData, loaData, aarData] = await Promise.all([
        apiFetch(`/activityCalendar?path=list&group_id=${group.id}`),
        apiFetch(`/loa?path=list&group_id=${group.id}`),
        apiFetch(`/milsimAars?path=list&group_id=${group.id}`),
      ]);
      setEvents(opsData.events ?? []);
      setLoas(loaData.loas ?? []);
      setAars(aarData.aars ?? []);
    } catch { setEvents([]); setLoas([]); setAars([]); }
    setLoading(false);
  }, [group.id]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title || !form.scheduled_at) { showMsg("Title and date required", "error"); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await apiFetch("/activityCalendar?path=update", { method: "POST", body: JSON.stringify({ id: editTarget.id, ...form }) });
        showMsg("Event updated", "success");
      } else {
        await apiFetch("/activityCalendar?path=create", { method: "POST", body: JSON.stringify({ group_id: group.id, created_by: user?.username, ...form }) });
        showMsg("Event scheduled", "success");
      }
      setShowForm(false); setEditTarget(null); load();
    } catch (e: any) { showMsg(e.message, "error"); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await apiFetch("/activityCalendar?path=delete", { method: "POST", body: JSON.stringify({ id }) });
    showMsg("Deleted", "success"); load();
  };

  const openEdit = (ev: any) => {
    setEditTarget(ev);
    setForm({ title: ev.title ?? ev.name ?? "", event_type: ev.event_type ?? "Op", scheduled_at: ev.scheduled_at ? ev.scheduled_at.slice(0,16) : "", end_date: ev.end_date ?? "", description: ev.description ?? "", game: ev.game ?? "", status: ev.status ?? "Planned" });
    setShowForm(true);
    setSelectedDay(null);
  };

  const firstDay    = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  // ── helpers ──────────────────────────────────────────────────────────────────
  const dayDate = (day: number) => new Date(viewYear, viewMonth, day);

  const opsForDay = (day: number) => events.filter(e => {
    if (!e.scheduled_at) return false;
    const d = new Date(e.scheduled_at);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day;
  });

  const loasForDay = (day: number) => {
    const date = dayDate(day);
    return loas.filter(l => {
      if (!l.start_date || !l.end_date) return false;
      const start = new Date(l.start_date); const end = new Date(l.end_date);
      // include all statuses so even pending LOAs show
      return date >= start && date <= end;
    });
  };

  // AARs land on the op's scheduled_at date OR their own created_date
  const aarsForDay = (day: number) => aars.filter(a => {
    // try to match to a linked op's date first
    if (a.op_id) {
      const linkedOp = events.find(e => e.id === a.op_id);
      if (linkedOp?.scheduled_at) {
        const d = new Date(linkedOp.scheduled_at);
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day;
      }
    }
    // fallback: use created_date
    const d = new Date(a.created_date ?? a.created_at ?? "");
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day;
  });

  const allItemsForDay = (day: number) => [
    ...opsForDay(day).map(e => ({ kind: e.event_type ?? "Op", label: e.title ?? e.name, raw: e })),
    ...loasForDay(day).map(l => ({ kind: "LOA", label: `LOA: ${l.callsign}`, raw: l })),
    ...aarsForDay(day).map(a => ({ kind: "AAR", label: `AAR: ${a.title ?? a.op_name}`, raw: a })),
  ];

  const upcomingOps = events
    .filter(e => new Date(e.scheduled_at) >= now)
    .sort((a,b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 8);

  // ── day detail panel ─────────────────────────────────────────────────────────
  const renderDayDetail = () => {
    if (selectedDay === null) return null;
    const items = allItemsForDay(selectedDay);
    const dayOps = opsForDay(selectedDay);
    const dayLoas = loasForDay(selectedDay);
    const dayAars = aarsForDay(selectedDay);
    return (
      <div className="border border-border rounded-lg bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest">
            {selectedDay} {MONTH_NAMES[viewMonth]} {viewYear}
          </h3>
          <button onClick={() => setSelectedDay(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        {items.length === 0 && <p className="text-xs text-muted-foreground font-sans">Nothing logged for this day.</p>}
        {dayOps.length > 0 && (
          <div>
            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Operations / Events</p>
            <div className="space-y-2">
              {dayOps.map(ev => {
                const aarCount = aars.filter(a => a.op_id === ev.id).length;
                return (
                  <div key={ev.id} className={`rounded-lg border p-3 ${EV_STYLE[ev.event_type] ?? EV_STYLE.Other}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display font-bold text-sm">{ev.title ?? ev.name}</p>
                        {ev.game && <p className="text-[10px] font-sans opacity-70 mt-0.5">{ev.game}</p>}
                        {ev.description && <p className="text-xs font-sans mt-1 opacity-80">{ev.description}</p>}
                        {aarCount > 0 && <p className="text-[10px] font-display font-bold uppercase tracking-widest text-green-400 mt-1">✓ {aarCount} AAR{aarCount > 1 ? "s" : ""} filed</p>}
                        {aarCount === 0 && ev.status === "Completed" && <p className="text-[10px] font-display font-bold uppercase tracking-widest text-amber-400 mt-1">⚠ No AAR filed</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openEdit(ev)} className="p-1 opacity-60 hover:opacity-100 transition-opacity"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => remove(ev.id)} className="p-1 opacity-60 hover:opacity-100 text-red-400 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-[9px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                        ev.status === "Active" ? "border-red-500/40 text-red-400" :
                        ev.status === "Completed" ? "border-border text-muted-foreground" :
                        ev.status === "Confirmed" ? "border-green-500/40 text-green-400" :
                        "border-amber-500/40 text-amber-400"}`}>{ev.status}</span>
                      {ev.scheduled_at && <span className="text-[9px] font-sans opacity-60">{new Date(ev.scheduled_at).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {dayAars.length > 0 && (
          <div>
            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-green-400 mb-2">After Action Reports</p>
            <div className="space-y-1.5">
              {dayAars.map(a => (
                <div key={a.id} className="rounded border border-green-500/20 bg-green-500/5 p-2.5">
                  <p className="font-display font-bold text-xs text-green-300">{a.title ?? a.op_name}</p>
                  {a.outcome && <p className="text-[10px] font-sans text-muted-foreground mt-0.5">{a.outcome}</p>}
                  {a.lessons_learned && <p className="text-[10px] font-sans text-muted-foreground mt-0.5 line-clamp-2">Lessons: {a.lessons_learned}</p>}
                  <p className="text-[9px] text-muted-foreground font-sans mt-1">by {a.author_username ?? "—"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {dayLoas.length > 0 && (
          <div>
            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-blue-400 mb-2">Leave of Absence</p>
            <div className="space-y-1.5">
              {dayLoas.map(l => (
                <div key={l.id} className="rounded border border-blue-500/20 bg-blue-500/5 p-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-xs text-blue-300">{l.callsign}</p>
                    <p className="text-[10px] font-sans text-muted-foreground">{l.reason_category}{l.reason_detail ? ` — ${l.reason_detail}` : ""}</p>
                  </div>
                  <span className={`text-[9px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                    l.status === "Active" ? "border-green-500/40 text-green-400" :
                    l.status === "Extension Requested" ? "border-amber-500/40 text-amber-400" :
                    "border-border text-muted-foreground"}`}>{l.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display font-bold text-lg uppercase tracking-widest">Activity Calendar</h2>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Full ops timeline — ops, training, LOAs, and AARs on their correct dates. Click any day to review.</p>
        </div>
        <button onClick={() => { setShowForm(v => !v); setEditTarget(null); setSelectedDay(null); setForm({ title:"", event_type:"Op", scheduled_at:"", end_date:"", description:"", game:"", status:"Planned" }); }}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/40 text-primary rounded font-display text-xs uppercase tracking-widest hover:bg-primary/30 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Schedule Event
        </button>
      </div>

      {showForm && (
        <div className="border border-primary/30 rounded-lg p-4 bg-primary/5 space-y-4">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-primary">{editTarget ? "Edit Event" : "New Event"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MField label="Title"><input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Sunday Op — Grid 742" className="mf-input w-full" /></MField>
            <MField label="Type"><select value={form.event_type} onChange={e => setForm(f=>({...f,event_type:e.target.value as any}))} className="mf-input w-full">{EVENT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></MField>
            <MField label="Date / Time"><input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f=>({...f,scheduled_at:e.target.value}))} className="mf-input w-full" /></MField>
            <MField label="End Date (optional)"><input type="date" value={form.end_date} onChange={e => setForm(f=>({...f,end_date:e.target.value}))} className="mf-input w-full" /></MField>
            <MField label="Game"><input value={form.game} onChange={e => setForm(f=>({...f,game:e.target.value}))} placeholder="e.g. Arma 3" className="mf-input w-full" /></MField>
            <MField label="Status"><select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))} className="mf-input w-full">{["Planned","Confirmed","Active","Completed","Cancelled"].map(s=><option key={s} value={s}>{s}</option>)}</select></MField>
            <div className="md:col-span-2"><MField label="Description"><textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={2} className="mf-input w-full resize-none" /></MField></div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded font-display text-xs uppercase tracking-widest hover:bg-primary/90">{saving?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Save className="w-3.5 h-3.5"/>} {editTarget?"Save Changes":"Schedule"}</button>
            <button onClick={() => { setShowForm(false); setEditTarget(null); }} className="px-4 py-1.5 border border-border rounded font-display text-xs uppercase tracking-widest">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-sans"><Loader2 className="w-4 h-4 animate-spin" /> Loading calendar...</div>
      ) : (
        <div className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center gap-4 justify-between">
            <button onClick={() => { const d=new Date(viewYear,viewMonth-1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setSelectedDay(null); }} className="p-1.5 border border-border rounded hover:bg-secondary transition-colors"><ChevronDown className="w-4 h-4 rotate-90" /></button>
            <span className="font-display font-bold text-sm uppercase tracking-widest">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button onClick={() => { const d=new Date(viewYear,viewMonth+1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setSelectedDay(null); }} className="p-1.5 border border-border rounded hover:bg-secondary transition-colors"><ChevronDown className="w-4 h-4 -rotate-90" /></button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-[9px] font-display font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-400/60" />Op</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-400/60" />Training</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-400/60" />AAR</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-300/60 border border-blue-400/40" />LOA</span>
            <span className="flex items-center gap-1 text-muted-foreground">Click any day for full review</span>
          </div>

          {/* Calendar grid */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border">
              {DAY_NAMES.map(d => <div key={d} className="text-center text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: startOffset }).map((_,i) => <div key={`pad-${i}`} className="border-b border-r border-border/40 min-h-[72px] bg-secondary/20" />)}
              {Array.from({ length: daysInMonth }).map((_,i) => {
                const day = i + 1;
                const items = allItemsForDay(day);
                const isToday = viewYear === now.getFullYear() && viewMonth === now.getMonth() && day === now.getDate();
                const isSelected = selectedDay === day;
                const hasMissedAAR = opsForDay(day).some(e => e.status === "Completed" && !aars.find(a => a.op_id === e.id));
                return (
                  <div key={day} onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`border-b border-r border-border/40 min-h-[72px] p-1.5 cursor-pointer transition-colors
                      ${isToday ? "bg-primary/5" : ""}
                      ${isSelected ? "ring-1 ring-inset ring-primary/60 bg-primary/10" : "hover:bg-secondary/20"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-display font-bold ${isToday ? "text-primary" : "text-muted-foreground"}`}>{day}</span>
                      {hasMissedAAR && <span title="Completed op with no AAR" className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    </div>
                    <div className="space-y-0.5">
                      {items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className={`text-[8px] font-display font-bold uppercase tracking-wide px-1 py-0.5 rounded border truncate ${EV_STYLE[item.kind] ?? EV_STYLE.Other}`}>
                          {item.label}
                        </div>
                      ))}
                      {items.length > 3 && <div className="text-[8px] text-muted-foreground font-sans pl-0.5">+{items.length - 3}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day detail panel */}
          {renderDayDetail()}

          {/* Upcoming */}
          {upcomingOps.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground">Upcoming</h3>
              {upcomingOps.map(ev => (
                <div key={ev.id} className="flex items-center justify-between gap-4 border border-border rounded-lg px-4 py-3 hover:bg-secondary/10 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border flex-shrink-0 ${EV_STYLE[ev.event_type] ?? EV_STYLE.Other}`}>{ev.event_type}</span>
                    <span className="font-display font-bold text-sm truncate">{ev.title ?? ev.name}</span>
                    {ev.game && <span className="text-xs text-muted-foreground font-sans hidden md:block">{ev.game}</span>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-muted-foreground font-sans">{new Date(ev.scheduled_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</span>
                    <button onClick={() => openEdit(ev)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(ev.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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
