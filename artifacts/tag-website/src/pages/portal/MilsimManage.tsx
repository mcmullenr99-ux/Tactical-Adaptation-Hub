import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { apiFetch } from "@/lib/apiFetch";
import {
  Shield, Crosshair, Award, Users, FileText, BookOpen,
  Plus, Trash2, Loader2, Save, CheckCircle2, AlertCircle, ExternalLink,
  Pencil, Check, X, Radio, Star, Medal, Wifi, WifiOff
} from "lucide-react";

interface Role { id: number; name: string; description: string | null; sortOrder: number }
interface Rank { id: number; name: string; abbreviation: string | null; tier: number }
interface RosterEntry { id: number; callsign: string; rankId: number | null; roleId: number | null; notes: string | null }
interface AppQuestion { id: number; question: string; sortOrder: number; required: boolean }
interface MilsimAward { id: number; title: string; description: string | null; icon: string; awarded_by: string | null; awarded_at: string; roster_entry_id: number; callsign: string | null }

interface GroupDetail {
  id: number; name: string; slug: string; tagLine: string | null;
  description: string | null; discordUrl: string | null; websiteUrl: string | null;
  logoUrl: string | null; sops: string | null; orbat: string | null; status: string;
  stream_url: string | null; is_live: boolean;
  roles: Role[]; ranks: Rank[]; roster: RosterEntry[]; questions: AppQuestion[];
}

type Tab = "info" | "roles" | "ranks" | "roster" | "awards" | "stream" | "sops" | "questions";

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
    { id: "stream", label: "Stream", icon: Radio },
    { id: "sops", label: "SOPs / ORBAT", icon: BookOpen },
    { id: "questions", label: "App Questions", icon: FileText },
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
  const { register, handleSubmit } = useForm({ defaultValues: { sops: group.sops ?? "", orbat: group.orbat ?? "" } });
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      <MField label="Standard Operating Procedures (SOPs)">
        <textarea {...register("sops")} rows={12} className="mf-input resize-y font-mono text-sm"
          placeholder="1. Comms discipline — PTT only when necessary&#10;2. Movement protocols..." />
      </MField>
      <MField label="Order of Battle (ORBAT)">
        <textarea {...register("orbat")} rows={12} className="mf-input resize-y font-mono text-sm"
          placeholder="HQ Element&#10;  CO: Commander&#10;  XO: Executive Officer&#10;&#10;Alpha Squad..." />
      </MField>
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

function AwardsTab({ group, showMsg }: any) {
  const [awards, setAwards] = useState<MilsimAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [rosterEntryId, setRosterEntryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("medal");
  const [adding, setAdding] = useState(false);

  const loadAwards = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<MilsimAward[]>(`/api/milsim-groups/${group.id}/awards`);
      setAwards(data);
    } catch { showMsg(false, "Failed to load awards."); }
    finally { setLoading(false); }
  }, [group.id]);

  useEffect(() => { loadAwards(); }, [loadAwards]);

  const add = async () => {
    if (!rosterEntryId || !title.trim()) return;
    setAdding(true);
    try {
      await apiFetch(`/api/milsim-groups/${group.id}/awards`, {
        method: "POST",
        body: JSON.stringify({ rosterEntryId: parseInt(rosterEntryId), title, description: description || undefined, icon }),
      });
      setRosterEntryId(""); setTitle(""); setDescription(""); setIcon("medal");
      showMsg(true, "Award bestowed.");
      await loadAwards();
    } catch (e: any) { showMsg(false, e.message); }
    finally { setAdding(false); }
  };

  const remove = async (awardId: number) => {
    try {
      await apiFetch(`/api/milsim-groups/${group.id}/awards/${awardId}`, { method: "DELETE" });
      setAwards(a => a.filter(x => x.id !== awardId));
      showMsg(true, "Award revoked.");
    } catch (e: any) { showMsg(false, e.message); }
  };

  const ICONS: Record<string, typeof Medal> = { medal: Medal, star: Star, award: Award, shield: Shield };

  return (
    <div className="max-w-3xl space-y-6">
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : awards.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground">
          <Medal className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-display text-sm uppercase tracking-widest">No awards issued yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {awards.map((a) => {
            const IconComp = ICONS[a.icon] ?? Medal;
            return (
              <div key={a.id} className="flex items-center justify-between gap-4 bg-card border border-border rounded-lg px-5 py-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-display font-bold uppercase tracking-wider text-sm text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.callsign ?? `Entry #${a.roster_entry_id}`}
                      {a.awarded_by && <> · Issued by <strong className="text-foreground">{a.awarded_by}</strong></>}
                    </p>
                    {a.description && <p className="text-xs text-muted-foreground mt-0.5 italic">{a.description}</p>}
                  </div>
                </div>
                <button onClick={() => remove(a.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h3 className="font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">Issue Award</h3>
        <select value={rosterEntryId} onChange={e => setRosterEntryId(e.target.value)} className="mf-input">
          <option value="">Select member...</option>
          {group.roster.map((e: RosterEntry) => <option key={e.id} value={e.id}>{e.callsign}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input value={title} onChange={e => setTitle(e.target.value)} className="mf-input" placeholder="Award title (e.g. Marksman Medal)" />
          <select value={icon} onChange={e => setIcon(e.target.value)} className="mf-input">
            <option value="medal">Medal</option>
            <option value="star">Star</option>
            <option value="award">Award</option>
            <option value="shield">Shield</option>
          </select>
        </div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="mf-input resize-none" placeholder="Citation / reason (optional)" />
        <button onClick={add} disabled={adding || !rosterEntryId || !title.trim()}
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-background font-display font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded clip-angled-sm transition-all disabled:opacity-50">
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />} Issue Award
        </button>
      </div>
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
