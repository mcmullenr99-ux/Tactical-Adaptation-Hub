import { useState, useEffect } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import {
  Settings, Shield, Radio, Send, Loader2, KeyRound, Link as LinkIcon, MessageSquare, Save, Trash2,
  Users, CheckCircle2, XCircle, Globe, AlertTriangle, Ban, Flag, RotateCcw, Eye, FileText,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";

interface ResetToken {
  id: number; token: string; username: string; email: string;
  expires_at: string; created_at: string;
}

export default function AdminPanel() {
  const { data: users, refetch } = useQuery<any[]>({
    queryKey: ["all-users-admin"],
    queryFn: () => apiFetch("/api/users"),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      apiFetch(`/api/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  });

  const { toast } = useToast();
  const [tab, setTab] = useState<"roster" | "broadcast" | "resets" | "motd" | "groups" | "aar_flags">("roster");
  const [bSubject, setBSubject] = useState("");
  const [bBody, setBBody] = useState("");

  const broadcastMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/admin/broadcast", { method: "POST", body: JSON.stringify({ subject: bSubject, body: bBody }) }),
    onSuccess: (data: any) => {
      toast({ title: "Broadcast Sent", description: `Message delivered to ${data.sent} member(s).` });
      setBSubject(""); setBBody("");
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const { data: resetTokens = [] } = useQuery<ResetToken[]>({
    queryKey: ["reset-tokens"],
    queryFn: () => apiFetch<ResetToken[]>("/api/admin/reset-tokens"),
    enabled: tab === "resets",
  });

  const handleRoleChange = (id: number, newRole: string) => {
    updateRole.mutate({ id, role: newRole }, {
      onSuccess: () => { toast({ title: "Role Updated" }); refetch(); },
      onError: (err: any) => toast({ title: "Update Failed", description: err.message || "Error.", variant: "destructive" }),
    });
  };

  const copyResetLink = (token: string) => {
    const url = `${window.location.origin}/portal/reset-password?token=${token}`;
    navigator.clipboard.writeText(url).then(() => toast({ title: "Reset link copied to clipboard." }));
  };

  return (
    <PortalLayout requireRole={["admin"]}>
      <div className="space-y-8">
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 bg-destructive/20 text-destructive rounded flex items-center justify-center clip-angled-sm">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-foreground">Command Console</h1>
            <p className="text-muted-foreground font-sans">Full administrative override privileges.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-border">
          {[
            { key: "roster",    label: "Personnel",       icon: <Shield className="w-4 h-4" /> },
            { key: "broadcast", label: "Broadcast",       icon: <Radio className="w-4 h-4" /> },
            { key: "resets",    label: "Password Resets", icon: <KeyRound className="w-4 h-4" /> },
            { key: "motd",      label: "MOTD / SITRAP",   icon: <MessageSquare className="w-4 h-4" /> },
            { key: "groups",    label: "MilSim Groups",    icon: <Globe className="w-4 h-4" /> },
            { key: "aar_flags", label: "AAR Flags",        icon: <Flag className="w-4 h-4" /> },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-5 py-3 font-display font-bold uppercase tracking-widest text-sm transition-colors border-b-2 ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === "roster" && (
          <div className="bg-card border border-border rounded overflow-hidden shadow-lg">
            <div className="p-6 border-b border-border bg-secondary/30 flex items-center gap-3">
              <Shield className="w-5 h-5 text-destructive" />
              <h2 className="font-display font-bold uppercase tracking-wider text-lg">Global Personnel Registry</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-sm">
                <thead className="bg-secondary/50 font-display font-bold uppercase tracking-wider text-muted-foreground text-xs">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Clearance (Role)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users?.map((u: any) => (
                    <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 text-muted-foreground">#{u.id}</td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        {u.status === "suspended" && <span className="w-2 h-2 rounded-full bg-destructive inline-block mr-2" title="Suspended" />}
                        {u.username}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                      <td className="px-6 py-4 text-muted-foreground">{u.createdAt ? format(new Date(u.createdAt), "MMM dd, yyyy") : "—"}</td>
                      <td className="px-6 py-4 text-right">
                        <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                          disabled={updateRole.isPending}
                          className={`bg-background border rounded px-3 py-1.5 text-xs font-display font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 ${u.role === "admin" ? "border-destructive text-destructive" : u.role === "moderator" ? "border-accent text-accent" : u.role === "staff" ? "border-blue-400 text-blue-400" : "border-border text-muted-foreground"}`}>
                          <option value="member">Member</option>
                          <option value="staff">Staff</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "broadcast" && (
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
            <div className="p-6 border-b border-border bg-secondary/30 flex items-center gap-3">
              <Radio className="w-5 h-5 text-primary" />
              <div>
                <h2 className="font-display font-bold uppercase tracking-wider text-lg">Broadcast Transmission</h2>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">Send a message to all active members' inboxes.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Subject</label>
                <input value={bSubject} onChange={e => setBSubject(e.target.value)} maxLength={200} className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary transition-all" placeholder="System-wide announcement..." />
              </div>
              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Body</label>
                <textarea value={bBody} onChange={e => setBBody(e.target.value)} rows={6} maxLength={5000} className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary transition-all resize-none" placeholder="Compose your announcement here..." />
                <p className="text-xs text-muted-foreground mt-1 text-right">{bBody.length}/5000</p>
              </div>
              <div className="bg-destructive/10 border border-destructive/30 rounded p-3 text-sm text-muted-foreground">
                ⚠ This will send a message to <strong>all active members</strong>. Confirm before sending.
              </div>
              <div className="flex justify-end">
                <button onClick={() => broadcastMutation.mutate()} disabled={!bSubject.trim() || !bBody.trim() || broadcastMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm rounded disabled:opacity-50 transition-all">
                  {broadcastMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Broadcast
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "resets" && (
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
            <div className="p-6 border-b border-border bg-secondary/30 flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="font-display font-bold uppercase tracking-wider text-lg">Pending Password Resets</h2>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">Copy the reset link and send to the user via Discord DM.</p>
              </div>
            </div>
            <div className="p-6">
              {resetTokens.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <KeyRound className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-display uppercase tracking-widest">No pending resets</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resetTokens.map((token: ResetToken) => (
                    <div key={token.id} className="flex items-center justify-between gap-4 p-4 bg-secondary/40 border border-border rounded-lg">
                      <div>
                        <p className="font-display font-bold text-foreground">{token.username}</p>
                        <p className="text-xs text-muted-foreground">{token.email} · Expires {token.expires_at && !isNaN(new Date(token.expires_at).getTime()) ? format(new Date(token.expires_at), "HH:mm, MMM d") : "—"}</p>
                      </div>
                      <button onClick={() => copyResetLink(token.token)}
                        className="flex items-center gap-2 px-3 py-2 border border-border rounded text-sm font-display uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
                        <LinkIcon className="w-4 h-4" /> Copy Link
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "motd" && <MotdTab toast={toast} />}
        {tab === "groups" && <GroupsTab toast={toast} />}
        {tab === "aar_flags" && <AarFlagsTab toast={toast} />}
      </div>
    </PortalLayout>
  );
}

function MotdTab({ toast }: { toast: any }) {
  const [motds, setMotds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", content: "", type: "info", expires_at: "" });
  const [saving, setSaving] = useState(false);

  const TYPE_COLORS: Record<string, string> = {
    info: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    warning: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    success: "text-green-400 bg-green-500/10 border-green-500/30",
    critical: "text-red-400 bg-red-500/10 border-red-500/30",
  };

  const load = () => {
    apiFetch<any[]>("/api/motd").then(setMotds).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/api/motd", { method: "POST", body: JSON.stringify({ ...form, expires_at: form.expires_at || null }) });
      toast({ title: "MOTD Posted" });
      setForm({ title: "", content: "", type: "info", expires_at: "" });
      load();
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    try {
      await apiFetch(`/api/motd/${id}`, { method: "DELETE" });
      toast({ title: "MOTD deleted" }); load();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold uppercase tracking-widest text-lg">Post MOTD / SITRAP</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary transition-all" placeholder="Weekly SITRAP" />
          </div>
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary transition-all">
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Content *</label>
          <textarea rows={5} value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary transition-all resize-none" placeholder="This week's situation report..." />
        </div>
        <div>
          <label className="block text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Expires At (optional)</label>
          <input type="datetime-local" value={form.expires_at} onChange={e => setForm(f => ({...f, expires_at: e.target.value}))} className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary transition-all" />
        </div>
        <button onClick={submit} disabled={saving || !form.title.trim() || !form.content.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm rounded disabled:opacity-50 transition-all">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Post MOTD
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="font-display font-bold uppercase tracking-widest text-xs text-muted-foreground">Active MOTDs</h3>
        {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> :
          motds.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-lg text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="font-display text-sm uppercase tracking-widest">No MOTDs posted</p>
            </div>
          ) : (
            motds.map((m: any) => (
              <div key={m.id} className={`flex items-start justify-between gap-4 p-4 border rounded-lg ${TYPE_COLORS[m.type] ?? "text-foreground bg-card border-border"}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold uppercase tracking-wider text-sm">{m.title}</p>
                  <p className="text-xs mt-1 opacity-80 font-sans">{m.content.slice(0, 120)}{m.content.length > 120 ? "..." : ""}</p>
                  <p className="text-xs opacity-60 mt-1 font-mono">{m.type.toUpperCase()} · {format(new Date(m.created_at), "MMM dd HH:mm")}{m.expires_at ? ` · Expires ${format(new Date(m.expires_at), "MMM dd HH:mm")}` : ""}</p>
                </div>
                <button onClick={() => remove(m.id)} className="p-1.5 opacity-60 hover:opacity-100 transition-opacity shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))
          )
        }
      </div>
    </div>
  );
}

function GroupsTab({ toast }: { toast: any }) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "suspended">("pending");
  const [working, setWorking] = useState<string | null>(null);

  const STATUS_STYLES: Record<string, string> = {
    pending:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    active:    "bg-green-500/10 text-green-400 border-green-500/30",
    suspended: "bg-red-500/10 text-red-400 border-red-500/30",
    rejected:  "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  };

  const load = () => {
    setLoading(true);
    apiFetch<any[]>("/api/admin/milsim-groups")
      .then(setGroups)
      .catch(() => toast({ title: "Failed to load groups", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    setWorking(id);
    try {
      await apiFetch(`/api/admin/milsim-groups/${id}/status`, {
        method: "PATCH", body: JSON.stringify({ status }),
      });
      setGroups(prev => prev.map(g => g.id === id ? { ...g, status } : g));
      toast({ title: `Group ${status}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setWorking(null); }
  };

  const deleteGroup = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    setWorking(id);
    try {
      await apiFetch(`/api/admin/milsim-groups/${id}`, { method: "DELETE" });
      setGroups(prev => prev.filter(g => g.id !== id));
      toast({ title: "Group deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setWorking(null); }
  };

  const toggleVerifyOverride = async (group: any) => {
    const newVal = !group.verify_override;
    setWorking(group.id);
    try {
      await apiFetch(`/api/admin/milsim-groups/${group.id}`, {
        method: "PATCH",
        body: JSON.stringify({ verify_override: newVal, is_verified: newVal, verified_at: newVal ? new Date().toISOString() : null }),
      });
      setGroups(prev => prev.map(g => g.id === group.id ? { ...g, verify_override: newVal, is_verified: newVal } : g));
      toast({ title: newVal ? "✅ Verification Granted" : "Verification Removed", description: group.name });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setWorking(null); }
  };

  const runAutoVerify = async () => {
    setWorking("__running__");
    try {
      const token = localStorage.getItem("tag_auth_token") ?? "";
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ""}/functions/autoVerifyGroups`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      toast({ title: `Auto-Verify Complete`, description: `${data.newly_verified ?? 0} newly verified, ${data.newly_unverified ?? 0} removed. ${data.processed ?? 0} checked.` });
      // Reload groups
      apiFetch<any[]>("/api/admin/milsim-groups").then(d => setGroups(Array.isArray(d) ? d : []));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setWorking(null); }
  };

  const filtered = groups.filter(g => filter === "all" || g.status === filter);
  const pendingCount = groups.filter(g => g.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
        <div className="p-5 border-b border-border bg-secondary/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-display font-bold uppercase tracking-wider text-lg">MilSim Groups</h2>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">{groups.length} total · {pendingCount} pending approval</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={runAutoVerify} disabled={working === "__running__"}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded text-xs font-display font-bold uppercase tracking-wider transition-colors disabled:opacity-50">
              {working === "__running__" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Run Auto-Verify
            </button>
            <div className="flex gap-1">
            {(["pending","active","suspended","all"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-display font-bold uppercase tracking-widest rounded transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {f}{f === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
              </button>
            ))}
          </div></div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-display uppercase tracking-widest text-sm">No groups in this category</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(g => (
              <div key={g.id} className="flex items-start gap-4 p-5 hover:bg-secondary/10 transition-colors">
                {/* Logo */}
                <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                  {g.logo_url ? <img src={g.logo_url} alt="" className="w-full h-full object-cover" /> : <Shield className="w-6 h-6 text-muted-foreground" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-display font-bold text-foreground">{g.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_STYLES[g.status] ?? "bg-card border-border text-muted-foreground"}`}>{g.status}</span>
                    {g.slug && <span className="text-xs text-muted-foreground font-mono">/{g.slug}</span>}
                  </div>
                  {g.tag_line && <p className="text-sm text-muted-foreground truncate">{g.tag_line}</p>}
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span>Owner: {g.owner_username ?? g.owner_id}</span>
                    {g.discord_url && <a href={g.discord_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Discord ↗</a>}
                    {g.website_url && <a href={g.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Website ↗</a>}
                    {g.is_verified && <span className="text-[10px] text-cyan-400 border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">✓ Verified{g.verify_override ? " (override)" : ""}</span>}
                    {!g.is_verified && g.verification_score !== undefined && <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded">Score: {g.verification_score}/100</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => toggleVerifyOverride(g)} disabled={working === g.id}
                    title={g.verify_override ? "Remove verification override" : "Force verify this group"}
                    className={`p-1.5 rounded transition-colors disabled:opacity-50 ${g.verify_override ? "text-cyan-400 hover:text-cyan-300" : "text-muted-foreground hover:text-cyan-400"}`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  {g.status !== "active" && (
                    <button onClick={() => setStatus(g.id, "active")} disabled={working === g.id}
                      title="Approve" className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/40 hover:bg-green-700/40 text-green-400 border border-green-700/40 rounded text-xs font-display font-bold uppercase tracking-wider transition-colors disabled:opacity-50">
                      {working === g.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
                    </button>
                  )}
                  {g.status !== "suspended" && (
                    <button onClick={() => setStatus(g.id, "suspended")} disabled={working === g.id}
                      title="Suspend" className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 hover:bg-red-800/40 text-red-400 border border-red-700/40 rounded text-xs font-display font-bold uppercase tracking-wider transition-colors disabled:opacity-50">
                      {working === g.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />} Suspend
                    </button>
                  )}
                  <button onClick={() => deleteGroup(g.id, g.name)} disabled={working === g.id}
                    title="Delete" className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AarFlagsTab({ toast }: { toast: any }) {
  const [aars, setAars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [filter, setFilter] = useState<"flagged" | "all">("flagged");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    apiFetch<any[]>("/api/milsim-aars?admin=1")
      .then(data => setAars(Array.isArray(data) ? data : []))
      .catch(() => setAars([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const clearFlag = async (aar: any) => {
    setWorking(aar.id);
    try {
      await apiFetch(`/api/milsim-aars/${aar.id}/unflag`, { method: "PATCH" });
      toast({ title: "Flag Cleared", description: `AAR "${aar.title}" cleared and will now count toward leaderboard.` });
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setWorking(null);
    }
  };

  const confirmFlag = async (aar: any) => {
    setWorking(aar.id);
    try {
      await apiFetch(`/api/milsim-aars/${aar.id}/flag`, {
        method: "PATCH",
        body: JSON.stringify({ reason: "Manually confirmed by admin" }),
      });
      toast({ title: "Flag Confirmed", description: `AAR "${aar.title}" confirmed as invalid.` });
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setWorking(null);
    }
  };

  const displayed = filter === "flagged" ? aars.filter(a => a.lb_flagged) : aars;
  const flaggedCount = aars.filter(a => a.lb_flagged).length;

  const outcomeColor: Record<string, string> = {
    victory: "text-green-400 border-green-500/30 bg-green-500/10",
    defeat: "text-red-400 border-red-500/30 bg-red-500/10",
    draw: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    incomplete: "text-muted-foreground border-border bg-secondary",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded overflow-hidden shadow-lg">
        <div className="p-6 border-b border-border bg-secondary/30 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Flag className="w-5 h-5 text-destructive" />
            <div>
              <h2 className="font-display font-bold uppercase tracking-wider text-lg">AAR Integrity Review</h2>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">AARs auto-flagged by the anti-cheat system. Review and override below.</p>
            </div>
          </div>
          {flaggedCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-destructive bg-destructive/10 border border-destructive/30 px-3 py-1.5 rounded">
              <AlertTriangle className="w-3.5 h-3.5" /> {flaggedCount} Pending Review
            </span>
          )}
        </div>

        {/* Anti-cheat rules reference */}
        <div className="px-6 py-4 border-b border-border bg-secondary/10">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Anti-Cheat Rules Active</p>
          <div className="flex flex-wrap gap-3">
            {[
              { icon: <Users className="w-3 h-3" />, label: "Min 3 participants per AAR" },
              { icon: <AlertTriangle className="w-3 h-3" />, label: "Max 1 scoring AAR per group per day" },
              { icon: <Flag className="w-3 h-3" />, label: "Max 3 victories per 7-day window" },
              { icon: <CheckCircle2 className="w-3 h-3" />, label: "Op Success LB: Verified groups only" },
            ].map((rule, i) => (
              <span key={i} className="flex items-center gap-1.5 text-[10px] font-sans text-muted-foreground bg-secondary border border-border px-2.5 py-1 rounded">
                {rule.icon} {rule.label}
              </span>
            ))}
          </div>
        </div>

        {/* Filter toggle */}
        <div className="px-6 py-3 border-b border-border flex items-center gap-3">
          <span className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Show:</span>
          {(["flagged", "all"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-display font-bold uppercase tracking-wider transition-colors border ${
                filter === f ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}>
              {f === "flagged" ? `Flagged (${flaggedCount})` : `All AARs (${aars.length})`}
            </button>
          ))}
          <button onClick={load} className="ml-auto p-1.5 border border-border rounded text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3 opacity-60" />
            <p className="font-display font-bold uppercase tracking-wider text-muted-foreground">
              {filter === "flagged" ? "No flagged AARs — system is clean" : "No AARs filed yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayed.map(aar => (
              <div key={aar.id} className={`px-6 py-4 transition-colors ${aar.lb_flagged ? "bg-destructive/5" : ""}`}>
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Status indicator */}
                  <div className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${aar.lb_flagged ? "bg-destructive" : "bg-green-400"}`} />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-display font-bold text-sm text-foreground">{aar.title || "Untitled AAR"}</span>
                      {aar.outcome && (
                        <span className={`text-[9px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${outcomeColor[aar.outcome] ?? outcomeColor.incomplete}`}>
                          {aar.outcome}
                        </span>
                      )}
                      {aar.lb_flagged && (
                        <span className="flex items-center gap-1 text-[9px] font-display font-bold uppercase tracking-widest text-destructive bg-destructive/10 border border-destructive/30 px-1.5 py-0.5 rounded">
                          <Flag className="w-2.5 h-2.5" /> LB Excluded
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-[10px] font-sans text-muted-foreground">
                      <span>By <strong className="text-foreground">{aar.author_username ?? "Unknown"}</strong></span>
                      {aar.op_name && <span>Op: <strong className="text-foreground">{aar.op_name}</strong></span>}
                      <span>{Array.isArray(aar.participants) ? aar.participants.length : 0} participants</span>
                      {aar.created_date && <span>{format(new Date(aar.created_date), "dd MMM yyyy HH:mm")}</span>}
                    </div>
                    {aar.lb_flagged && aar.lb_flag_reason && (
                      <div className="mt-2 flex items-start gap-1.5 text-[10px] font-sans text-destructive bg-destructive/10 border border-destructive/20 rounded px-2.5 py-1.5">
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                        <span><strong>Flag reason:</strong> {aar.lb_flag_reason}</span>
                      </div>
                    )}

                    {/* Expanded content */}
                    {expandedId === aar.id && (
                      <div className="mt-3 space-y-2 text-xs font-sans text-muted-foreground bg-secondary/50 rounded p-3 border border-border">
                        {aar.content && (
                          <div>
                            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-foreground mb-1">AAR Content</p>
                            <p className="leading-relaxed line-clamp-6">{aar.content}</p>
                          </div>
                        )}
                        {Array.isArray(aar.participants) && aar.participants.length > 0 && (
                          <div>
                            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-foreground mb-1">Participants ({aar.participants.length})</p>
                            <p>{aar.participants.join(", ")}</p>
                          </div>
                        )}
                        {aar.lessons_learned && (
                          <div>
                            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-foreground mb-1">Lessons Learned</p>
                            <p className="leading-relaxed">{aar.lessons_learned}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setExpandedId(expandedId === aar.id ? null : aar.id)}
                      className="flex items-center gap-1 text-xs font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 px-2.5 py-1.5 rounded transition-all">
                      <Eye className="w-3 h-3" /> {expandedId === aar.id ? "Hide" : "View"}
                    </button>
                    {aar.lb_flagged ? (
                      <button onClick={() => clearFlag(aar)} disabled={working === aar.id}
                        className="flex items-center gap-1 text-xs font-display font-bold uppercase tracking-wider text-green-400 bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 px-2.5 py-1.5 rounded transition-all disabled:opacity-50">
                        {working === aar.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        Clear Flag
                      </button>
                    ) : (
                      <button onClick={() => confirmFlag(aar)} disabled={working === aar.id}
                        className="flex items-center gap-1 text-xs font-display font-bold uppercase tracking-wider text-destructive bg-destructive/10 border border-destructive/30 hover:bg-destructive/20 px-2.5 py-1.5 rounded transition-all disabled:opacity-50">
                        {working === aar.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flag className="w-3 h-3" />}
                        Flag
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
