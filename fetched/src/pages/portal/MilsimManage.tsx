import { useEffect, useState, useCallback, useRef, type ElementType } from "react";
import { useUpload } from "@workspace/object-storage-web";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { apiFetch } from "@/lib/apiFetch";
import {
  Shield, Crosshair, Award, Users, FileText, BookOpen,
  Plus, Trash2, Loader2, Save, CheckCircle2, AlertCircle, ExternalLink,
  Pencil, Check, X, Radio, Star, Medal, Wifi, WifiOff,
  GraduationCap, Siren, ClipboardList, MapPin, GitBranch, Activity, Megaphone, ChevronDown, ChevronUp,
  BarChart3, Crown, TrendingUp, Trophy
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import OrbatBuilder from "@/components/OrbatBuilder";

interface Role { id: number; name: string; description: string | null; sortOrder: number }
interface Rank { id: number; name: string; abbreviation: string | null; tier: number }
interface RosterEntry { id: number; callsign: string; rankId: number | null; roleId: number | null; notes: string | null; status?: string; specialisations?: string[]; join_date?: string | null; ops_count?: number | null; }
interface AppQuestion { id: number; question: string; sortOrder: number; required: boolean }
interface MilsimAward { id: number; title: string; description: string | null; icon: string; awarded_by: string | null; awarded_at: string; roster_entry_id: number; callsign: string | null }

interface GroupDetail {
  id: number; name: string; slug: string; tagLine: string | null;
  description: string | null; discordUrl: string | null; websiteUrl: string | null;
  logoUrl: string | null; sops: string | null; orbat: string | null; status: string;
  stream_url: string | null; is_live: boolean;
  roles: Role[]; ranks: Rank[]; roster: RosterEntry[]; questions: AppQuestion[];
}

type Tab = "info" | "roles" | "ranks" | "roster" | "awards" | "stream" | "sops" | "questions" | "quals" | "ops" | "aars" | "briefings" | "orgchart" | "commendations" | "readiness" | "analytics";

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
    { id: "analytics", label: "⭐ Analytics", icon: BarChart3 },
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
          {tab === "awards" && <AwardsTab group={group} showMsg={showMsg} />}
          {tab === "commendations" && <CommendationsTab group={group} />}
          {tab === "quals" && <QualsTab group={group} showMsg={showMsg} />}
          {tab === "ops" && <OpsTab group={group} showMsg={showMsg} />}
          {tab === "aars" && <AARsTab group={group} showMsg={showMsg} />}
          {tab === "briefings" && <BriefingsTab group={group} showMsg={showMsg} />}
          {tab === "orgchart" && <OrgChartTab group={group} />}
          {tab === "readiness" && <ReadinessTab group={group} />}
          {tab === "analytics" && <AnalyticsTab group={group} />}
          {tab === "stream" && <StreamTab group={group} onUpdated={setGroup} showMsg={showMsg} />}
          {tab === "sops" && <SopsTab group={group} onSaved={setGroup} setSaving={setSaving} saving={saving} showMsg={showMsg} />}
          {tab === "questions" && <QuestionsTab group={group} onUpdated={setGroup} showMsg={showMsg} />}
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

function InfoTab({ group, onSaved, setSaving, saving, showMsg }: any) {
  const { register, handleSubmit } = useForm({ defaultValues: {
    name: group.name, tagLine: group.tagLine ?? "", description: group.description ?? "",
    discordUrl: group.discordUrl ?? "", websiteUrl: group.websiteUrl ?? "", logoUrl: group.logoUrl ?? "",
  }});
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
      <MField label="Discord URL"><input {...register("discordUrl")} className="mf-input" /></MField>
      <MField label="Website URL"><input {...register("websiteUrl")} className="mf-input" /></MField>
      <button type="submit" disabled={saving}
        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-3 rounded clip-angled-sm transition-all disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
      </button>
    </form>
  );
}

function SopsTab({ group, onSaved, setSaving, saving, showMsg }: any) {
  const [subTab, setSubTab] = useState<"sops" | "orbat">("sops");
  const [sopsText, setSopsText] = useState(group.sops ?? "");
  const [orbatJson, setOrbatJson] = useState(group.orbat ?? "");

  const saveSops = async () => {
    setSaving(true);
    try {
      const updated = await apiFetch(`/api/milsim-groups/${group.id}/info`, { method: "PATCH", body: JSON.stringify({ sops: sopsText, orbat: group.orbat }) });
      onSaved(updated);
      showMsg(true, "SOPs saved.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setSaving(false); }
  };

  const saveOrbat = async () => {
    setSaving(true);
    try {
      const updated = await apiFetch(`/api/milsim-groups/${group.id}/info`, { method: "PATCH", body: JSON.stringify({ sops: group.sops, orbat: orbatJson }) });
      onSaved(updated);
      showMsg(true, "ORBAT saved.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {/* Sub-tab switcher */}
      <div className="flex gap-1 border-b border-border">
        {(["sops", "orbat"] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-4 py-2 text-xs font-display font-bold uppercase tracking-widest transition-colors border-b-2 -mb-px ${subTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "sops" ? "SOPs" : "ORBAT Builder"}
          </button>
        ))}
      </div>

      {subTab === "sops" && (
        <div className="space-y-4 max-w-3xl">
          <MField label="Standard Operating Procedures (SOPs)">
            <textarea value={sopsText} onChange={e => setSopsText(e.target.value)} rows={16}
              className="mf-input resize-y font-mono text-sm"
              placeholder="1. Comms discipline — PTT only when necessary&#10;2. Movement protocols..." />
          </MField>
          <button onClick={saveSops} disabled={saving}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-3 rounded clip-angled-sm transition-all disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save SOPs
          </button>
        </div>
      )}

      {subTab === "orbat" && (
        <div className="space-y-4">
          <OrbatBuilder value={orbatJson} onChange={setOrbatJson} groupName={group.name} />
          <div className="flex justify-end pt-2">
            <button onClick={saveOrbat} disabled={saving}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-3 rounded clip-angled-sm transition-all disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save ORBAT
            </button>
          </div>
        </div>
      )}
    </div>
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
  const [editEntry, setEditEntry] = useState<RosterEntry | null>(null);
  const [editData, setEditData] = useState<Partial<RosterEntry & { specInput: string }>>({});
  const [adding, setAdding] = useState(false);
  const [newCallsign, setNewCallsign] = useState("");
  const [saving, setSaving] = useState(false);

  const STATUSES = ["Active", "Reserve", "AWOL", "MIA", "KIA", "Discharged"];

  const openEdit = (e: RosterEntry) => {
    setEditEntry(e);
    setEditData({ ...e, specInput: "" });
  };

  const saveEdit = async () => {
    if (!editEntry) return;
    setSaving(true);
    try {
      const updated = await apiFetch<RosterEntry>(`/api/milsim-groups/${group.id}/roster/${editEntry.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          callsign: editData.callsign,
          rankId: editData.rankId ? Number(editData.rankId) : null,
          roleId: editData.roleId ? Number(editData.roleId) : null,
          notes: editData.notes || null,
          status: editData.status || "Active",
          specialisations: editData.specialisations ?? [],
          join_date: editData.join_date || null,
          ops_count: editData.ops_count ?? null,
        }),
      });
      const newRoster = roster.map(r => r.id === editEntry.id ? { ...updated, qualifications: (editEntry as any).qualifications ?? [], awards: (editEntry as any).awards ?? [] } : r);
      setRoster(newRoster); onUpdated({ ...group, roster: newRoster });
      setEditEntry(null); showMsg(true, "Operator record updated.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setSaving(false); }
  };

  const enlist = async () => {
    if (!newCallsign.trim()) return;
    setAdding(true);
    try {
      const entry = await apiFetch<RosterEntry>(`/api/milsim-groups/${group.id}/roster`, {
        method: "POST",
        body: JSON.stringify({ callsign: newCallsign, status: "Active" }),
      });
      const updated = [...roster, { ...entry, qualifications: [], awards: [] }];
      setRoster(updated); onUpdated({ ...group, roster: updated });
      setNewCallsign(""); showMsg(true, "Operator enlisted.");
    } catch (e: any) { showMsg(false, e.message); }
    finally { setAdding(false); }
  };

  const remove = async (id: number) => {
    try {
      await apiFetch(`/api/milsim-groups/${group.id}/roster/${id}`, { method: "DELETE" });
      const updated = roster.filter((r) => r.id !== id); setRoster(updated); onUpdated({ ...group, roster: updated });
      showMsg(true, "Operator removed.");
    } catch (e: any) { showMsg(false, e.message); }
  };

  const addSpec = () => {
    const val = (editData.specInput ?? "").trim().toUpperCase();
    if (!val) return;
    setEditData(d => ({ ...d, specialisations: [...(d.specialisations ?? []), val], specInput: "" }));
  };

  const statusColour = (s: string) =>
    s === "Active"     ? "bg-green-500/15 text-green-400 border-green-500/30" :
    s === "Reserve"    ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
    s === "AWOL"       ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" :
    s === "MIA"        ? "bg-orange-500/15 text-orange-400 border-orange-500/30" :
    s === "KIA"        ? "bg-red-500/15 text-red-400 border-red-500/30" :
    s === "Discharged" ? "bg-secondary text-muted-foreground border-border" :
    "bg-green-500/15 text-green-400 border-green-500/30";

  return (
    <div className="max-w-4xl space-y-6">
      {/* Roster list */}
      <div className="space-y-2">
        {roster.length === 0 && <p className="text-muted-foreground font-sans text-sm p-4 bg-card border border-border rounded-lg">Roster is empty. Enlist your first operator below.</p>}
        {roster.map((e) => {
          const rank = e.rankId ? group.ranks.find((r: any) => r.id === e.rankId) : null;
          const role = e.roleId ? group.roles.find((r: any) => r.id === e.roleId) : null;
          return (
            <div key={e.id} className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/20 transition-colors">
              <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="font-display font-black text-[10px] text-primary">{e.callsign.slice(0,2).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-bold uppercase tracking-wider text-sm text-foreground">{e.callsign}</span>
                  <span className={`text-[9px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${statusColour(e.status ?? "Active")}`}>
                    {e.status ?? "Active"}
                  </span>
                  {rank && <span className="text-[9px] text-primary font-display font-bold uppercase tracking-widest">{rank.name}</span>}
                  {role && <span className="text-[9px] text-muted-foreground font-display uppercase tracking-widest bg-secondary border border-border px-1.5 py-0.5 rounded">{role.name}</span>}
                </div>
                {(e.specialisations ?? []).length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {(e.specialisations ?? []).map((s, i) => (
                      <span key={i} className="text-[8px] font-display font-bold uppercase tracking-widest bg-accent/10 border border-accent/25 text-accent px-1 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(e)} className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit Operator Record">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(e.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Remove">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enlist form */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h3 className="font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">Enlist Operator</h3>
        <div className="flex gap-3">
          <input value={newCallsign} onChange={(e) => setNewCallsign(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") enlist(); }}
            className="mf-input flex-1" placeholder="Callsign" />
          <button onClick={enlist} disabled={adding || !newCallsign.trim()}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded clip-angled-sm transition-all disabled:opacity-50">
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Enlist
          </button>
        </div>
        <p className="text-xs text-muted-foreground font-sans">Use the edit button to set rank, role, status, specialisations, and more.</p>
      </div>

      {/* Edit Modal */}
      {editEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditEntry(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-display font-black uppercase tracking-widest text-sm text-foreground">Operator Record — {editEntry.callsign}</h2>
              <button onClick={() => setEditEntry(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">

              {/* Callsign */}
              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Callsign</label>
                <input value={editData.callsign ?? ""} onChange={e => setEditData(d => ({...d, callsign: e.target.value}))} className="mf-input w-full" />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Duty Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => setEditData(d => ({...d, status: s}))}
                      className={`text-[10px] font-display font-bold uppercase tracking-widest px-3 py-1.5 rounded border transition-colors ${editData.status === s ? statusColour(s) : "bg-secondary border-border text-muted-foreground hover:border-primary/30"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rank + Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Rank</label>
                  <select value={editData.rankId ?? ""} onChange={e => setEditData(d => ({...d, rankId: e.target.value ? Number(e.target.value) : null}))} className="mf-input w-full">
                    <option value="">No Rank</option>
                    {group.ranks.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Role</label>
                  <select value={editData.roleId ?? ""} onChange={e => setEditData(d => ({...d, roleId: e.target.value ? Number(e.target.value) : null}))} className="mf-input w-full">
                    <option value="">No Role</option>
                    {group.roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Specialisations */}
              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Specialisations / MOS Tags</label>
                <div className="flex gap-2 mb-2">
                  <input value={editData.specInput ?? ""} onChange={e => setEditData(d => ({...d, specInput: e.target.value}))}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSpec(); } }}
                    className="mf-input flex-1" placeholder="e.g. CQB, JTAC, Medic, Sniper, EOD..." />
                  <button onClick={addSpec} className="px-3 py-2 bg-secondary border border-border rounded text-xs font-display font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(editData.specialisations ?? []).map((s, i) => (
                    <span key={i} className="text-[10px] font-display font-bold uppercase tracking-widest bg-accent/10 border border-accent/25 text-accent px-2 py-0.5 rounded flex items-center gap-1">
                      {s}
                      <button onClick={() => setEditData(d => ({...d, specialisations: (d.specialisations ?? []).filter((_, j) => j !== i)}))} className="hover:text-destructive ml-0.5">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Join date + Ops count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Date Enlisted</label>
                  <input type="date" value={editData.join_date ?? ""} onChange={e => setEditData(d => ({...d, join_date: e.target.value || null}))} className="mf-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Ops Participated</label>
                  <input type="number" min={0} value={editData.ops_count ?? ""} onChange={e => setEditData(d => ({...d, ops_count: e.target.value ? parseInt(e.target.value) : null}))} className="mf-input w-full" placeholder="0" />
                </div>
              </div>

              {/* Notes / biog */}
              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Commander Notes / Bio</label>
                <textarea value={editData.notes ?? ""} onChange={e => setEditData(d => ({...d, notes: e.target.value}))}
                  className="mf-input w-full min-h-[80px] resize-y" placeholder="Conduct record, background, notable service..." />
              </div>

              <button onClick={saveEdit} disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-3 rounded clip-angled-sm transition-all disabled:opacity-50">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save Operator Record
              </button>
            </div>
          </div>
        </div>
      )}
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

// ─── Live Ops / Check-In ──────────────────────────────────────────────────────
function OpsTab({ group, showMsg }: any) {
  const [activeOp, setActiveOp] = useState<any | null>(undefined);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [opName, setOpName] = useState(""); const [opDesc, setOpDesc] = useState(""); const [starting, setStarting] = useState(false);
  const [expandedOp, setExpandedOp] = useState<number | null>(null);
  const load = () => {
    setLoading(true);
    Promise.all([apiFetch<any>(`/api/milsim-groups/${group.id}/ops/active`), apiFetch<any[]>(`/api/milsim-groups/${group.id}/ops`)])
      .then(([active, all]) => { setActiveOp(active ?? null); setHistory(all.filter((o: any) => o.status !== "active")); }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [group.id]);
  const startOp = async () => {
    if (!opName.trim()) return; setStarting(true);
    try { await apiFetch(`/api/milsim-groups/${group.id}/ops`, { method: "POST", body: JSON.stringify({ name: opName, description: opDesc || undefined }) }); setOpName(""); setOpDesc(""); showMsg(true, "Op started."); load(); }
    catch (e: any) { showMsg(false, e.message); } finally { setStarting(false); }
  };
  const endOp = async (opId: number) => {
    try { await apiFetch(`/api/milsim-groups/${group.id}/ops/${opId}/end`, { method: "PATCH" }); showMsg(true, "Op ended."); load(); }
    catch (e: any) { showMsg(false, e.message); }
  };
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  return (
    <div className="max-w-3xl space-y-6">
      {activeOp ? (
        <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3"><span className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-widest text-red-400 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded animate-pulse"><span className="w-1.5 h-1.5 bg-red-400 rounded-full" /> ACTIVE</span><h3 className="font-display font-bold text-foreground">{activeOp.name}</h3></div>
            <button onClick={() => endOp(activeOp.id)} className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-white font-display font-bold uppercase tracking-widest text-xs rounded transition-all">End Op</button>
          </div>
          {activeOp.description && <p className="text-sm text-muted-foreground">{activeOp.description}</p>}
          <div>
            <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-3">Checked In ({activeOp.checkins?.length ?? 0})</p>
            {activeOp.checkins?.length === 0 ? <p className="text-sm text-muted-foreground">No check-ins yet.</p> : (
              <div className="flex flex-wrap gap-2">{activeOp.checkins?.map((c: any) => (<span key={c.id} className="text-xs font-display font-bold uppercase tracking-widest px-2.5 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded">{c.callsign}</span>))}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 className="font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">Start New Op</h3>
          <input value={opName} onChange={e => setOpName(e.target.value)} className="mf-input" placeholder="Op name (e.g. Operation Iron Fist)" />
          <input value={opDesc} onChange={e => setOpDesc(e.target.value)} className="mf-input" placeholder="Brief description (optional)" />
          <button onClick={startOp} disabled={starting || !opName.trim()} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded clip-angled-sm transition-all disabled:opacity-50">{starting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Siren className="w-3.5 h-3.5" />} Start Op</button>
        </div>
      )}
      {history.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display font-bold uppercase tracking-widest text-xs text-muted-foreground">Op History</h3>
          {history.map((op: any) => (
            <div key={op.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <button onClick={() => setExpandedOp(expandedOp === op.id ? null : op.id)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-3"><span className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground px-2 py-0.5 bg-secondary border border-border rounded">Ended</span><span className="font-display font-bold text-sm text-foreground">{op.name}</span></div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground"><span>{op.checkin_count} checked in</span>{expandedOp === op.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</div>
              </button>
              {expandedOp === op.id && <div className="border-t border-border px-5 py-3 bg-secondary/10 text-xs text-muted-foreground">Started: {format(new Date(op.started_at), "PPpp")}{op.ended_at && <> · Ended: {format(new Date(op.ended_at), "PPpp")}</>}</div>}
            </div>
          ))}
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
  const [aars, setAars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const emptyForm = { op_name: "", op_date: "", summary: "", objectives_hit: "", objectives_missed: "", casualties: "", commendations: "", recommendations: "", classification: "unclassified" };
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const load = () => { apiFetch<any[]>(`/api/milsim-groups/${group.id}/aars`).then(setAars).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [group.id]);
  const submit = async () => {
    if (!form.op_name.trim()) return; setSaving(true);
    try {
      if (editId) { await apiFetch(`/api/milsim-groups/${group.id}/aars/${editId}`, { method: "PATCH", body: JSON.stringify(form) }); showMsg(true, "AAR updated."); }
      else { await apiFetch(`/api/milsim-groups/${group.id}/aars`, { method: "POST", body: JSON.stringify(form) }); showMsg(true, "AAR filed."); }
      setCreating(false); setEditId(null); setForm(emptyForm); load();
    } catch (e: any) { showMsg(false, e.message); } finally { setSaving(false); }
  };
  const remove = async (id: number) => {
    try { await apiFetch(`/api/milsim-groups/${group.id}/aars/${id}`, { method: "DELETE" }); showMsg(true, "AAR deleted."); load(); }
    catch (e: any) { showMsg(false, e.message); }
  };
  const CL: Record<string, string> = { "unclassified": "text-green-400 bg-green-500/10 border-green-500/30", "confidential": "text-blue-400 bg-blue-500/10 border-blue-500/30", "classified": "text-yellow-400 bg-yellow-500/10 border-yellow-500/30", "top-secret": "text-red-400 bg-red-500/10 border-red-500/30" };
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  const setF = (k: string) => (e: any) => setForm((f: any) => ({...f, [k]: e.target.value}));
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-sans">After Action Reports — filed post-op.</p>
        {!creating && !editId && <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-4 py-2 rounded transition-all"><Plus className="w-3.5 h-3.5" /> File AAR</button>}
      </div>
      {(creating || editId !== null) && (
        <div className="bg-card border border-primary/30 rounded-lg p-6 space-y-4">
          <h3 className="font-display font-bold uppercase tracking-widest text-sm">{editId ? "Edit AAR" : "New AAR"}</h3>
          <div className="grid grid-cols-2 gap-3"><div><label className="mf-label">Op Name *</label><input value={form.op_name} onChange={setF("op_name")} className="mf-input" placeholder="Operation Iron Fist" /></div><div><label className="mf-label">Op Date</label><input type="date" value={form.op_date} onChange={setF("op_date")} className="mf-input" /></div></div>
          <div><label className="mf-label">Classification</label><select value={form.classification} onChange={setF("classification")} className="mf-input">{["unclassified","confidential","classified","top-secret"].map(c => <option key={c} value={c}>{c.replace("-"," ").toUpperCase()}</option>)}</select></div>
          <div><label className="mf-label">Summary</label><textarea rows={3} value={form.summary} onChange={setF("summary")} className="mf-input resize-none" placeholder="Overall mission summary..." /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="mf-label">Objectives Hit</label><textarea rows={3} value={form.objectives_hit} onChange={setF("objectives_hit")} className="mf-input resize-none" /></div><div><label className="mf-label">Objectives Missed</label><textarea rows={3} value={form.objectives_missed} onChange={setF("objectives_missed")} className="mf-input resize-none" /></div></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="mf-label">Casualties</label><textarea rows={2} value={form.casualties} onChange={setF("casualties")} className="mf-input resize-none" /></div><div><label className="mf-label">Commendations</label><textarea rows={2} value={form.commendations} onChange={setF("commendations")} className="mf-input resize-none" /></div></div>
          <div><label className="mf-label">Recommendations</label><textarea rows={3} value={form.recommendations} onChange={setF("recommendations")} className="mf-input resize-none" /></div>
          <div className="flex gap-2">
            <button onClick={submit} disabled={saving || !form.op_name.trim()} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded transition-all disabled:opacity-50">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {editId ? "Update" : "File AAR"}</button>
            <button onClick={() => { setCreating(false); setEditId(null); setForm(emptyForm); }} className="px-4 py-2 border border-border text-muted-foreground rounded text-xs font-display uppercase hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}
      {aars.length === 0 && !creating ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground"><ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-display text-sm uppercase tracking-widest">No AARs filed</p></div>
      ) : (
        <div className="space-y-3">
          {aars.map((a: any) => (
            <div key={a.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <button onClick={() => setExpandedId(expandedId === a.id ? null : a.id)} className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/20 transition-colors text-left">
                <div className="flex items-center gap-3 flex-wrap"><span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${CL[a.classification] ?? ""}`}>{a.classification.replace("-"," ")}</span><span className="font-display font-bold text-sm text-foreground">{a.op_name}</span>{a.op_date && <span className="text-xs text-muted-foreground">{format(new Date(a.op_date + "T00:00:00"), "MMM dd, yyyy")}</span>}</div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={e => { e.stopPropagation(); setEditId(a.id); setForm({ op_name: a.op_name, op_date: a.op_date?.split("T")[0] ?? "", summary: a.summary ?? "", objectives_hit: a.objectives_hit ?? "", objectives_missed: a.objectives_missed ?? "", casualties: a.casualties ?? "", commendations: a.commendations ?? "", recommendations: a.recommendations ?? "", classification: a.classification }); }} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={e => { e.stopPropagation(); remove(a.id); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  {expandedId === a.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>
              {expandedId === a.id && (
                <div className="border-t border-border p-5 space-y-4 bg-secondary/10">
                  {a.summary && <AARField label="Summary" value={a.summary} />}
                  {a.objectives_hit && <AARField label="Objectives Hit" value={a.objectives_hit} />}
                  {a.objectives_missed && <AARField label="Objectives Missed" value={a.objectives_missed} />}
                  {a.casualties && <AARField label="Casualties" value={a.casualties} />}
                  {a.commendations && <AARField label="Commendations" value={a.commendations} />}
                  {a.recommendations && <AARField label="Recommendations" value={a.recommendations} />}
                  <p className="text-xs text-muted-foreground">Filed by {a.created_by} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Briefings ────────────────────────────────────────────────────────────────
function BriefingsTab({ group, showMsg }: any) {
  const [briefings, setBriefings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const emptyForm = { title: "", op_date: "", ao: "", objectives: "", comms_plan: "", roe: "", additional_notes: "", status: "draft" };
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const load = () => { apiFetch<any[]>(`/api/milsim-groups/${group.id}/briefings`).then(setBriefings).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [group.id]);
  const submit = async () => {
    if (!form.title.trim()) return; setSaving(true);
    try {
      if (editId) { await apiFetch(`/api/milsim-groups/${group.id}/briefings/${editId}`, { method: "PATCH", body: JSON.stringify(form) }); showMsg(true, "Briefing updated."); }
      else { await apiFetch(`/api/milsim-groups/${group.id}/briefings`, { method: "POST", body: JSON.stringify(form) }); showMsg(true, "Briefing created."); }
      setCreating(false); setEditId(null); setForm(emptyForm); load();
    } catch (e: any) { showMsg(false, e.message); } finally { setSaving(false); }
  };
  const remove = async (id: number) => {
    try { await apiFetch(`/api/milsim-groups/${group.id}/briefings/${id}`, { method: "DELETE" }); showMsg(true, "Deleted."); load(); }
    catch (e: any) { showMsg(false, e.message); }
  };
  const SC: Record<string, string> = { draft: "text-muted-foreground bg-secondary border-border", published: "text-primary bg-primary/10 border-primary/30", archived: "text-muted-foreground bg-secondary/40 border-border" };
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  const setF = (k: string) => (e: any) => setForm((f: any) => ({...f, [k]: e.target.value}));
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-sans">Op briefings — distributed to members before an operation.</p>
        {!creating && !editId && <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-4 py-2 rounded transition-all"><Plus className="w-3.5 h-3.5" /> New Briefing</button>}
      </div>
      {(creating || editId !== null) && (
        <div className="bg-card border border-primary/30 rounded-lg p-6 space-y-4">
          <h3 className="font-display font-bold uppercase tracking-widest text-sm">{editId ? "Edit Briefing" : "New Briefing"}</h3>
          <div className="grid grid-cols-2 gap-3"><div><label className="mf-label">Title *</label><input value={form.title} onChange={setF("title")} className="mf-input" placeholder="Operation Iron Fist — OPORD" /></div><div><label className="mf-label">Op Date / Time</label><input type="datetime-local" value={form.op_date} onChange={setF("op_date")} className="mf-input" /></div></div>
          <div><label className="mf-label">Status</label><select value={form.status} onChange={setF("status")} className="mf-input"><option value="draft">Draft</option><option value="published">Published (visible to all members)</option><option value="archived">Archived</option></select></div>
          <div><label className="mf-label">Area of Operations (AO)</label><input value={form.ao} onChange={setF("ao")} className="mf-input" placeholder="Grid reference, map name..." /></div>
          <div><label className="mf-label">Objectives</label><textarea rows={4} value={form.objectives} onChange={setF("objectives")} className="mf-input resize-none" placeholder="1. Secure FOB Alpha&#10;2. Eliminate HVT Bravo..." /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="mf-label">Comms Plan</label><textarea rows={3} value={form.comms_plan} onChange={setF("comms_plan")} className="mf-input resize-none" placeholder="Primary: CH1&#10;Secondary: CH2..." /></div><div><label className="mf-label">ROE</label><textarea rows={3} value={form.roe} onChange={setF("roe")} className="mf-input resize-none" placeholder="Weapons free in AO..." /></div></div>
          <div><label className="mf-label">Additional Notes</label><textarea rows={3} value={form.additional_notes} onChange={setF("additional_notes")} className="mf-input resize-none" /></div>
          <div className="flex gap-2">
            <button onClick={submit} disabled={saving || !form.title.trim()} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded transition-all disabled:opacity-50">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {editId ? "Update" : "Create"}</button>
            <button onClick={() => { setCreating(false); setEditId(null); setForm(emptyForm); }} className="px-4 py-2 border border-border text-muted-foreground rounded text-xs font-display uppercase hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}
      {briefings.length === 0 && !creating ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground"><MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-display text-sm uppercase tracking-widest">No briefings created</p></div>
      ) : (
        <div className="space-y-3">
          {briefings.map((b: any) => (
            <div key={b.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <button onClick={() => setExpandedId(expandedId === b.id ? null : b.id)} className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/20 transition-colors text-left">
                <div className="flex items-center gap-3 flex-wrap"><span className={`text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${SC[b.status] ?? ""}`}>{b.status}</span><span className="font-display font-bold text-sm text-foreground">{b.title}</span>{b.op_date && <span className="text-xs text-muted-foreground">{format(new Date(b.op_date), "MMM dd, yyyy HH:mm")}</span>}</div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={e => { e.stopPropagation(); setEditId(b.id); setForm({ title: b.title, op_date: b.op_date ? b.op_date.slice(0,16) : "", ao: b.ao ?? "", objectives: b.objectives ?? "", comms_plan: b.comms_plan ?? "", roe: b.roe ?? "", additional_notes: b.additional_notes ?? "", status: b.status }); }} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={e => { e.stopPropagation(); remove(b.id); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  {expandedId === b.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>
              {expandedId === b.id && (
                <div className="border-t border-border p-5 space-y-4 bg-secondary/10">
                  {b.ao && <AARField label="Area of Operations" value={b.ao} />}
                  {b.objectives && <AARField label="Objectives" value={b.objectives} />}
                  {b.comms_plan && <AARField label="Comms Plan" value={b.comms_plan} />}
                  {b.roe && <AARField label="ROE" value={b.roe} />}
                  {b.additional_notes && <AARField label="Additional Notes" value={b.additional_notes} />}
                  <p className="text-xs text-muted-foreground font-sans">By {b.created_by} · {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}</p>
                </div>
              )}
            </div>
          ))}
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
  useEffect(() => { apiFetch<any>(`/api/stats/readiness/${group.id}`).then(setReadiness).catch(() => {}).finally(() => setLoading(false)); }, [group.id]);
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!readiness) return null;
  const sc = readiness.status === "green" ? "text-green-400" : readiness.status === "amber" ? "text-yellow-400" : "text-red-400";
  const bc = readiness.status === "green" ? "bg-green-500" : readiness.status === "amber" ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="max-w-xl space-y-6">
      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        <div className="flex items-center justify-between"><h3 className="font-display font-bold uppercase tracking-widest">Unit Readiness</h3><span className={`font-display font-black text-2xl uppercase ${sc}`}>{readiness.status.toUpperCase()}</span></div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-display font-bold uppercase tracking-widest text-muted-foreground"><span>Active (7d) / Total</span><span>{readiness.active_this_week} / {readiness.total}</span></div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${bc}`} style={{ width: `${readiness.readiness_pct}%` }} /></div>
          <p className={`text-right text-sm font-display font-bold ${sc}`}>{readiness.readiness_pct}% READY</p>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border">
          <div className="text-center"><p className="text-2xl font-display font-bold text-foreground">{readiness.total}</p><p className="text-xs text-muted-foreground font-display uppercase tracking-widest">Total</p></div>
          <div className="text-center"><p className="text-2xl font-display font-bold text-green-400">{readiness.active_this_week}</p><p className="text-xs text-muted-foreground font-display uppercase tracking-widest">Active 7d</p></div>
          <div className="text-center"><p className="text-2xl font-display font-bold text-blue-400">{readiness.active_this_month}</p><p className="text-xs text-muted-foreground font-display uppercase tracking-widest">Active 30d</p></div>
        </div>
        <p className="text-xs text-muted-foreground font-sans">Readiness based on portal logins in the last 7 days. 70%+ = Green, 40–69% = Amber, &lt;40% = Red.</p>
      </div>
    </div>
  );
}


// ─── Analytics (Pro) ──────────────────────────────────────────────────────────
const ANALYTICS_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/groupAnalytics";
const PRO_STATUS_URL_MANAGE = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/getProStatus";

function MiniBar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-display font-bold text-muted-foreground w-6 text-right">{value}</span>
    </div>
  );
}

function SparkLine({ data, color = "#22d3ee" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 120, h = 40, pad = 4;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2);
    const y = h - pad - ((v / max) * (h - pad * 2));
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => {
        const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2);
        const y = h - pad - ((v / max) * (h - pad * 2));
        return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />;
      })}
    </svg>
  );
}

function StatCard({ label, value, sub, trend, sparkData, color }: { label: string; value: string | number; sub?: string; trend?: string; sparkData?: number[]; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-2">
      <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <p className={`font-display font-black text-3xl ${color || "text-foreground"}`}>{value}</p>
        {sparkData && <SparkLine data={sparkData} color={color === "text-yellow-400" ? "#facc15" : color === "text-green-400" ? "#4ade80" : "#22d3ee"} />}
      </div>
      {sub && <p className="text-xs font-sans text-muted-foreground">{sub}</p>}
      {trend && <p className="text-xs font-sans text-primary">{trend}</p>}
    </div>
  );
}

function AnalyticsTab({ group }: any) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState<boolean | null>(null);

  useEffect(() => {
    // Check pro first
    fetch(`${PRO_STATUS_URL_MANAGE}?group_id=${group.id}`)
      .then(r => r.json())
      .then(s => {
        setIsPro(s.is_pro);
        if (s.is_pro) {
          return fetch(`${ANALYTICS_URL}?group_id=${group.id}`)
            .then(r => r.json())
            .then(setData)
            .catch(() => {});
        }
      })
      .catch(() => setIsPro(false))
      .finally(() => setLoading(false));
  }, [group.id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground font-sans">Loading analytics...</p>
    </div>
  );

  // Pro gate
  if (!isPro) return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto gap-6">
      <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-center">
        <Crown className="w-8 h-8 text-yellow-400" />
      </div>
      <div>
        <h3 className="font-display font-black text-2xl uppercase tracking-wider text-foreground mb-2">Commander Pro Required</h3>
        <p className="text-muted-foreground font-sans leading-relaxed">
          Analytics is a Pro feature. Upgrade your unit to unlock full attendance tracking, ops frequency charts, roster growth, duty status breakdown, and more.
        </p>
      </div>
      <a href="/commander-pro"
        className="inline-flex items-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-black font-display font-black uppercase tracking-widest text-sm px-8 py-3 rounded transition-all shadow-[0_0_20px_hsla(48,96%,53%,0.3)]"
      >
        <Crown className="w-4 h-4" /> Upgrade to Pro — £10/mo
      </a>
      <p className="text-xs text-muted-foreground font-sans">Cancel anytime. Instant activation.</p>
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <AlertCircle className="w-8 h-8 text-destructive" />
      <p className="text-muted-foreground font-sans">Failed to load analytics data.</p>
    </div>
  );

  const { summary, charts, top_operators, top_awards } = data;

  // Format month labels
  const monthLabels = Object.keys(charts.ops_per_month).map(k => {
    const [y, m] = k.split("-");
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleString("default", { month: "short" });
  });
  const opsData = Object.values(charts.ops_per_month) as number[];
  const attendData = Object.values(charts.attendance_per_month) as number[];
  const joinData = Object.values(charts.join_per_month) as number[];

  // Outcome colors
  const outcomeColor: Record<string, string> = { victory: "bg-green-500", defeat: "bg-red-500", draw: "bg-yellow-500", incomplete: "bg-secondary" };
  const totalOutcomes = Object.values(charts.aar_outcomes).reduce((a: any, b: any) => a + b, 0) as number;

  return (
    <div className="space-y-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/30 rounded flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-yellow-400" />
        </div>
        <div>
          <h2 className="font-display font-bold uppercase tracking-wider text-foreground">Unit Analytics</h2>
          <p className="text-xs font-sans text-muted-foreground">Live data — all time unless noted</p>
        </div>
        <span className="ml-auto text-[10px] font-display font-bold uppercase tracking-widest px-2 py-1 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
          <Crown className="w-3 h-3" /> Pro
        </span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Roster" value={summary.active_roster} sub={`${summary.total_roster} total enrolled`} sparkData={joinData} color="text-foreground" />
        <StatCard label="Ops Completed" value={summary.completed_ops} sub={`${summary.scheduled_ops} upcoming`} sparkData={opsData} color="text-primary" />
        <StatCard label="Avg Attendance" value={summary.avg_attendance} sub="per op (from AARs)" color="text-yellow-400" />
        <StatCard label="Op Win Rate" value={`${summary.op_win_rate}%`} sub={`${summary.total_aars} AARs filed`} color={summary.op_win_rate >= 60 ? "text-green-400" : summary.op_win_rate >= 40 ? "text-yellow-400" : "text-red-400"} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Awards" value={summary.total_awards} color="text-yellow-400" />
        <StatCard label="Active LOAs" value={summary.active_loas} color={summary.active_loas > 3 ? "text-yellow-400" : "text-muted-foreground"} />
        <StatCard label="Briefings Filed" value={summary.total_aars} color="text-foreground" />
        <StatCard label="Scheduled Ops" value={summary.scheduled_ops} color="text-primary" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Ops per month */}
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-4">Ops Completed — Last 6 Months</p>
          <div className="flex items-end gap-2 h-24">
            {opsData.map((v, i) => {
              const maxV = Math.max(...opsData, 1);
              const pct = (v / maxV) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-display font-bold">{v}</span>
                  <div className="w-full bg-primary/80 rounded-t transition-all" style={{ height: `${Math.max(pct * 0.7, v > 0 ? 4 : 2)}px` }} />
                  <span className="text-[9px] text-muted-foreground">{monthLabels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Roster growth */}
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-4">New Recruits — Last 6 Months</p>
          <div className="flex items-end gap-2 h-24">
            {joinData.map((v, i) => {
              const maxV = Math.max(...joinData, 1);
              const pct = (v / maxV) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-display font-bold">{v}</span>
                  <div className="w-full bg-green-500/70 rounded-t transition-all" style={{ height: `${Math.max(pct * 0.7, v > 0 ? 4 : 2)}px` }} />
                  <span className="text-[9px] text-muted-foreground">{monthLabels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Roster status */}
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-4">Roster by Status</p>
          <div className="space-y-2.5">
            {Object.entries(charts.roster_by_status).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-xs font-sans mb-1">
                  <span className="text-foreground capitalize">{status}</span>
                  <span className="text-muted-foreground">{count as number}</span>
                </div>
                <MiniBar value={count as number} max={summary.total_roster} color="bg-primary" />
              </div>
            ))}
          </div>
        </div>

        {/* AAR outcomes */}
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-4">Op Outcomes</p>
          {totalOutcomes === 0 ? (
            <p className="text-sm text-muted-foreground font-sans py-4 text-center">No AARs filed yet</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(charts.aar_outcomes).map(([outcome, count]) => (
                count as number > 0 ? (
                  <div key={outcome}>
                    <div className="flex justify-between text-xs font-sans mb-1">
                      <span className="text-foreground capitalize">{outcome}</span>
                      <span className="text-muted-foreground">{count as number} ({Math.round(((count as number) / totalOutcomes) * 100)}%)</span>
                    </div>
                    <MiniBar value={count as number} max={totalOutcomes} color={outcomeColor[outcome] || "bg-secondary"} />
                  </div>
                ) : null
              ))}
            </div>
          )}
        </div>

        {/* Top operators */}
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-yellow-400" /> Top Operators
          </p>
          {top_operators.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans py-4 text-center">No op data yet</p>
          ) : (
            <div className="space-y-2">
              {top_operators.map((op: any, i: number) => (
                <div key={op.callsign} className="flex items-center gap-3">
                  <span className={`text-xs font-display font-black w-4 ${i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-400" : i === 2 ? "text-orange-500" : "text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-sans text-foreground truncate">{op.callsign}</span>
                  <span className="text-xs font-display font-bold text-muted-foreground">{op.ops_count} ops</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top awards */}
      {top_awards.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-4">Most Issued Awards</p>
          <div className="flex flex-wrap gap-3">
            {top_awards.map((a: any) => (
              <div key={a.name} className="flex items-center gap-2 bg-secondary/50 border border-border rounded px-3 py-2">
                <Star className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-sm font-sans text-foreground">{a.name}</span>
                <span className="text-xs font-display font-bold text-muted-foreground">×{a.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
