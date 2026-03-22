import { useState, useEffect } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import {
  Settings, Shield, Radio, Send, Loader2, KeyRound, Link as LinkIcon, MessageSquare, Save, Trash2,
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
  const [tab, setTab] = useState<"roster" | "broadcast" | "resets" | "motd">("roster");
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
                        <p className="text-xs text-muted-foreground">{token.email} · Expires {format(new Date(token.expires_at), "HH:mm, MMM d")}</p>
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
