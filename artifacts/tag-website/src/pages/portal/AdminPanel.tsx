import { useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { useListUsers, useUpdateUserRole } from "@workspace/api-client-react";
import { Settings, Shield, Radio, Send, Loader2, KeyRound, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";

interface ResetToken {
  id: number; token: string; username: string; email: string;
  expires_at: string; created_at: string;
}

export default function AdminPanel() {
  const { data: users, refetch } = useListUsers();
  const updateRole = useUpdateUserRole();
  const { toast } = useToast();
  const [tab, setTab] = useState<"roster" | "broadcast" | "resets">("roster");

  const [bSubject, setBSubject] = useState("");
  const [bBody, setBBody] = useState("");

  const broadcastMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: bSubject, body: bBody }),
      }).then(r => r.json()),
    onSuccess: (data) => {
      toast({ title: "Broadcast Sent", description: `Message delivered to ${data.sent} member(s).` });
      setBSubject(""); setBBody("");
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const { data: resetTokens = [] } = useQuery<ResetToken[]>({
    queryKey: ["reset-tokens"],
    queryFn: () => apiFetch("/api/admin/reset-tokens").then(r => r.json()),
    enabled: tab === "resets",
  });

  const handleRoleChange = (id: number, newRole: string) => {
    updateRole.mutate({ id, data: { role: newRole } }, {
      onSuccess: () => {
        toast({ title: "Role Updated", description: `Role changed to ${newRole}.` });
        refetch();
      },
      onError: (err: any) => {
        toast({ title: "Update Failed", description: err.data?.error || "Error.", variant: "destructive" });
      }
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

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {[
            { key: "roster", label: "Personnel", icon: <Shield className="w-4 h-4" /> },
            { key: "broadcast", label: "Broadcast", icon: <Radio className="w-4 h-4" /> },
            { key: "resets", label: "Password Resets", icon: <KeyRound className="w-4 h-4" /> },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-5 py-3 font-display font-bold uppercase tracking-widest text-sm transition-colors border-b-2 ${
                tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Roster Tab */}
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
                  {users?.map(u => (
                    <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 text-muted-foreground">#{u.id}</td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        {u.status === "suspended" && <span className="w-2 h-2 rounded-full bg-destructive inline-block mr-2" title="Suspended" />}
                        {u.username}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                      <td className="px-6 py-4 text-muted-foreground">{format(new Date(u.createdAt), "MMM dd, yyyy")}</td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={updateRole.isPending}
                          className={`bg-background border rounded px-3 py-1.5 text-xs font-display font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 ${
                            u.role === "admin" ? "border-destructive text-destructive" :
                            u.role === "moderator" ? "border-accent text-accent" :
                            u.role === "staff" ? "border-blue-400 text-blue-400" :
                            "border-border text-muted-foreground"
                          }`}
                        >
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

        {/* Broadcast Tab */}
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
                <input
                  value={bSubject}
                  onChange={e => setBSubject(e.target.value)}
                  maxLength={200}
                  className="mf-input w-full"
                  placeholder="System-wide announcement..."
                />
              </div>
              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Body</label>
                <textarea
                  value={bBody}
                  onChange={e => setBBody(e.target.value)}
                  rows={6}
                  maxLength={5000}
                  className="mf-input w-full resize-none"
                  placeholder="Compose your announcement here..."
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{bBody.length}/5000</p>
              </div>
              <div className="bg-destructive/10 border border-destructive/30 rounded p-3 text-sm text-muted-foreground">
                ⚠ This will send a message to <strong>all active members</strong>. Confirm before sending.
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => broadcastMutation.mutate()}
                  disabled={!bSubject.trim() || !bBody.trim() || broadcastMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm rounded disabled:opacity-50 transition-all"
                >
                  {broadcastMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Broadcast
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Resets Tab */}
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
                  {resetTokens.map(token => (
                    <div key={token.id} className="flex items-center justify-between gap-4 p-4 bg-secondary/40 border border-border rounded-lg">
                      <div>
                        <p className="font-display font-bold text-foreground">{token.username}</p>
                        <p className="text-xs text-muted-foreground">{token.email} · Expires {format(new Date(token.expires_at), "HH:mm, MMM d")}</p>
                      </div>
                      <button
                        onClick={() => copyResetLink(token.token)}
                        className="flex items-center gap-2 px-3 py-2 border border-border rounded text-sm font-display uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                      >
                        <LinkIcon className="w-4 h-4" /> Copy Link
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </PortalLayout>
  );
}
