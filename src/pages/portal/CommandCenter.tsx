import { useState, useMemo } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthContext";
import { format } from "date-fns";
import {
  Terminal, Users, Shield, Search, Trash2, Ban, CheckCircle2,
  ChevronDown, AlertTriangle, ExternalLink, RefreshCw, X,
  Lock, LockOpen, ShieldAlert, Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: number; username: string; email: string;
  role: string; status: string;
  banReason: string | null; bannedAt: string | null;
  bio: string | null; discordTag: string | null; createdAt: string;
}

interface AdminGroup {
  id: number; name: string; slug: string; status: string;
  tag_line: string | null; description: string | null;
  discord_url: string | null; website_url: string | null;
  logo_url: string | null; created_at: string;
  owner_id: number | null; owner_username: string | null; owner_email: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  member:    "text-muted-foreground border-border",
  staff:     "text-blue-400 border-blue-400/50",
  moderator: "text-amber-400 border-amber-400/50",
  admin:     "text-destructive border-destructive/50",
};

const STATUS_COLORS: Record<string, string> = {
  active:    "bg-green-500/20 text-green-400 border border-green-500/30",
  suspended: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  banned:    "bg-destructive/20 text-destructive border border-destructive/30",
};

const GROUP_STATUS_COLORS: Record<string, string> = {
  pending:  "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  approved: "bg-green-500/20 text-green-400 border border-green-500/30",
  featured: "bg-primary/20 text-primary border border-primary/30",
  rejected: "bg-destructive/20 text-destructive border border-destructive/30",
};

// ─── Ban Modal ─────────────────────────────────────────────────────────────────

function BanModal({ user, onClose, onConfirm }: { user: AdminUser; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("TOS Violation");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-destructive/50 rounded-lg w-full max-w-md mx-4 shadow-2xl">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3"><Ban className="w-5 h-5 text-destructive" /><h2 className="font-display font-bold uppercase tracking-wider text-lg">Issue Ban</h2></div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-destructive/10 border border-destructive/30 rounded p-4">
            <p className="font-sans text-sm text-muted-foreground">Banning <span className="font-bold text-foreground">{user.username}</span> ({user.email}) will immediately block their access.</p>
          </div>
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Ban Reason</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Describe the TOS violation..."
              className="w-full bg-background border border-border rounded px-4 py-2 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-destructive" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded text-sm font-display font-bold uppercase tracking-wider hover:bg-secondary transition-colors">Cancel</button>
            <button onClick={() => onConfirm(reason.trim() || "TOS Violation")} disabled={!reason.trim()}
              className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded text-sm font-display font-bold uppercase tracking-wider hover:bg-destructive/90 transition-colors disabled:opacity-50">
              Confirm Ban
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({ name, type, onClose, onConfirm }: { name: string; type: "account" | "group"; onClose: () => void; onConfirm: () => void }) {
  const [typed, setTyped] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-destructive/50 rounded-lg w-full max-w-md mx-4 shadow-2xl">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-destructive" /><h2 className="font-display font-bold uppercase tracking-wider text-lg">Confirm Deletion</h2></div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-destructive/10 border border-destructive/30 rounded p-4">
            <p className="font-sans text-sm text-muted-foreground">Permanently deletes {type} <span className="font-bold text-foreground">{name}</span>. Cannot be undone.</p>
          </div>
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Type the name to confirm</label>
            <input type="text" value={typed} onChange={e => setTyped(e.target.value)} placeholder={name}
              className="w-full bg-background border border-border rounded px-4 py-2 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-destructive" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded text-sm font-display font-bold uppercase tracking-wider hover:bg-secondary transition-colors">Cancel</button>
            <button onClick={onConfirm} disabled={typed !== name}
              className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded text-sm font-display font-bold uppercase tracking-wider hover:bg-destructive/90 transition-colors disabled:opacity-50">
              Delete Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Accounts Tab ─────────────────────────────────────────────────────────────

function AccountsTab({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: users = [], isLoading, refetch } = useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: () => apiFetch("/admin?path=users"),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || String(u.id).includes(q));
  }, [users, search]);

  const banMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      apiFetch(`/admin?path=users/${id}/ban`, { method: "PATCH", body: JSON.stringify({ reason }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); toast({ title: "Ban Issued" }); setBanTarget(null); },
    onError: (err: any) => toast({ title: "Failed", description: err?.error || "Could not ban user.", variant: "destructive" }),
  });

  const unbanMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/admin?path=users/${id}/unban`, { method: "PATCH" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); toast({ title: "Ban Lifted" }); },
    onError: (err: any) => toast({ title: "Failed", description: err?.error || "Could not unban.", variant: "destructive" }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      apiFetch(`/admin?path=users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); toast({ title: "Role Updated" }); },
    onError: () => toast({ title: "Failed", description: "Could not update role.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/admin?path=users/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); toast({ title: "Account Deleted" }); setDeleteTarget(null); },
    onError: (err: any) => toast({ title: "Failed", description: err?.error || "Could not delete.", variant: "destructive" }),
  });

  // Whether a mod can act on this user (can't touch admins or other mods)
  const canActOn = (u: AdminUser) => isAdmin || (u.role !== "admin" && u.role !== "moderator");

  return (
    <div className="space-y-4">
      {banTarget && <BanModal user={banTarget} onClose={() => setBanTarget(null)} onConfirm={reason => banMutation.mutate({ id: banTarget.id, reason })} />}
      {deleteTarget && <DeleteModal name={deleteTarget.username} type="account" onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMutation.mutate(deleteTarget.id)} />}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by username, email, or ID..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded pl-10 pr-4 py-2 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <button onClick={() => refetch()} className="px-3 py-2 border border-border rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs font-sans text-muted-foreground">{filtered.length} account{filtered.length !== 1 ? "s" : ""} found</p>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground font-sans text-sm">Loading roster...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => (
            <div key={user.id} className={`bg-card border rounded overflow-hidden ${user.status === "banned" ? "border-destructive/40" : user.status === "suspended" ? "border-amber-500/40" : "border-border"}`}>
              <div className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-secondary/30 transition-colors select-none" onClick={() => setExpanded(expanded === user.id ? null : user.id)}>
                <span className="text-xs font-display text-muted-foreground w-10 shrink-0">#{user.id}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-foreground text-sm uppercase tracking-wider truncate">{user.username}</p>
                  <p className="text-xs font-sans text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${ROLE_COLORS[user.role] || ROLE_COLORS.member}`}>{user.role}</span>
                  <span className={`text-xs font-sans font-medium px-2 py-0.5 rounded ${STATUS_COLORS[user.status] || STATUS_COLORS.active}`}>{user.status}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expanded === user.id ? "rotate-180" : ""}`} />
                </div>
              </div>

              {expanded === user.id && (
                <div className="border-t border-border bg-secondary/10 px-4 py-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
                    <div><p className="text-muted-foreground mb-1 font-display font-bold uppercase tracking-wider">Joined</p><p className="text-foreground">{user.createdAt && !isNaN(new Date(user.createdAt).getTime()) ? format(new Date(user.createdAt), "MMM dd, yyyy") : "—"}</p></div>
                    <div><p className="text-muted-foreground mb-1 font-display font-bold uppercase tracking-wider">Discord</p><p className="text-foreground">{user.discordTag || "—"}</p></div>
                    <div><p className="text-muted-foreground mb-1 font-display font-bold uppercase tracking-wider">Bio</p><p className="text-foreground truncate">{user.bio || "—"}</p></div>
                    {user.status === "banned" && <div><p className="text-muted-foreground mb-1 font-display font-bold uppercase tracking-wider">Ban Reason</p><p className="text-destructive">{user.banReason || "—"}</p></div>}
                  </div>

                  {!canActOn(user) && (
                    <div className="flex items-center gap-2 text-xs font-sans text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      Moderators cannot act on admin or moderator accounts.
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {/* Role — admin only */}
                    {isAdmin && (
                      <select value={user.role} onChange={e => roleMutation.mutate({ id: user.id, role: e.target.value })} disabled={roleMutation.isPending}
                        className="bg-background border border-border rounded px-3 py-1.5 text-xs font-display font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-primary disabled:opacity-50">
                        <option value="member">Member</option>
                        <option value="staff">Staff</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}

                    {/* Ban / Unban — available if canActOn */}
                    {canActOn(user) && (user.status !== "banned" ? (
                      <button onClick={() => setBanTarget(user)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive border border-destructive/30 rounded text-xs font-display font-bold uppercase tracking-wider hover:bg-destructive/20 transition-colors">
                        <Ban className="w-3.5 h-3.5" /> Issue Ban
                      </button>
                    ) : (
                      <button onClick={() => unbanMutation.mutate(user.id)} disabled={unbanMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded text-xs font-display font-bold uppercase tracking-wider hover:bg-green-500/20 transition-colors disabled:opacity-50">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Lift Ban
                      </button>
                    ))}

                    {/* Delete — admin only */}
                    {isAdmin && (
                      <button onClick={() => setDeleteTarget(user)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive border border-destructive/30 rounded text-xs font-display font-bold uppercase tracking-wider hover:bg-destructive/20 transition-colors ml-auto">
                        <Trash2 className="w-3.5 h-3.5" /> Delete Account
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center py-16 text-muted-foreground font-sans text-sm">No accounts match your search.</div>}
        </div>
      )}
    </div>
  );
}

// ─── MilSim Groups Tab ────────────────────────────────────────────────────────

function GroupsTab({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminGroup | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: groups = [], isLoading, refetch } = useQuery<AdminGroup[]>({
    queryKey: ["admin", "milsim-groups"],
    queryFn: () => apiFetch("/admin?path=milsim-groups"),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return groups.filter(g => g.name.toLowerCase().includes(q) || g.slug.toLowerCase().includes(q) || (g.owner_username || "").toLowerCase().includes(q));
  }, [groups, search]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiFetch(`/admin?path=milsim-groups/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "milsim-groups"] }); toast({ title: "Status Updated" }); },
    onError: () => toast({ title: "Failed", description: "Could not update group status.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/admin?path=milsim-groups/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "milsim-groups"] }); toast({ title: "Group Deleted" }); setDeleteTarget(null); },
    onError: () => toast({ title: "Failed", description: "Could not delete group.", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      {deleteTarget && <DeleteModal name={deleteTarget.name} type="group" onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMutation.mutate(deleteTarget.id)} />}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by name, slug, or owner..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded pl-10 pr-4 py-2 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <button onClick={() => refetch()} className="px-3 py-2 border border-border rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs font-sans text-muted-foreground">{filtered.length} group{filtered.length !== 1 ? "s" : ""} registered</p>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground font-sans text-sm">Loading groups...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(group => (
            <div key={group.id} className={`bg-card border rounded overflow-hidden ${group.status === "rejected" ? "border-destructive/40" : group.status === "pending" ? "border-amber-500/40" : "border-border"}`}>
              <div className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-secondary/30 transition-colors select-none" onClick={() => setExpanded(expanded === group.id ? null : group.id)}>
                <span className="text-xs font-display text-muted-foreground w-10 shrink-0">#{group.id}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-foreground text-sm uppercase tracking-wider truncate">{group.name}</p>
                  <p className="text-xs font-sans text-muted-foreground truncate">/{group.slug} · Owner: {group.owner_username || "unknown"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-sans font-medium px-2 py-0.5 rounded ${GROUP_STATUS_COLORS[group.status] || GROUP_STATUS_COLORS.pending}`}>{group.status}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expanded === group.id ? "rotate-180" : ""}`} />
                </div>
              </div>

              {expanded === group.id && (
                <div className="border-t border-border bg-secondary/10 px-4 py-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-sans">
                    <div><p className="text-muted-foreground mb-1 font-display font-bold uppercase tracking-wider">Registered</p><p className="text-foreground">{group.created_at ? format(new Date(group.created_at), "MMM dd, yyyy") : "—"}</p></div>
                    <div><p className="text-muted-foreground mb-1 font-display font-bold uppercase tracking-wider">Owner Email</p><p className="text-foreground">{group.owner_email || "—"}</p></div>
                    <div><p className="text-muted-foreground mb-1 font-display font-bold uppercase tracking-wider">Discord</p><p className="text-foreground">{group.discord_url || "—"}</p></div>
                    {group.tag_line && <div className="col-span-2 md:col-span-3"><p className="text-muted-foreground mb-1 font-display font-bold uppercase tracking-wider">Tagline</p><p className="text-foreground">{group.tag_line}</p></div>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select value={group.status} onChange={e => statusMutation.mutate({ id: group.id, status: e.target.value })} disabled={statusMutation.isPending}
                      className="bg-background border border-border rounded px-3 py-1.5 text-xs font-display font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-primary disabled:opacity-50">
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="featured">Featured</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <Link href={`/milsim/${group.slug}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-xs font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> View Page
                    </Link>
                    {isAdmin && (
                      <button onClick={() => setDeleteTarget(group)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive border border-destructive/30 rounded text-xs font-display font-bold uppercase tracking-wider hover:bg-destructive/20 transition-colors ml-auto">
                        <Trash2 className="w-3.5 h-3.5" /> Delete Group
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center py-16 text-muted-foreground font-sans text-sm">No groups match your search.</div>}
        </div>
      )}
    </div>
  );
}

// ─── Lockdown Toggle (Admin Only) ─────────────────────────────────────────────

function LockdownToggle() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data } = useQuery<{ active: boolean }>({
    queryKey: ["admin", "lockdown"],
    queryFn: () => apiFetch("/admin?path=lockdown"),
    refetchInterval: 30_000,
  });

  const toggle = useMutation({
    mutationFn: (active: boolean) =>
      apiFetch("/admin?path=lockdown", { method: "PATCH", body: JSON.stringify({ active }) }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["admin", "lockdown"] });
      toast({
        title: res.active ? "Lockdown Activated" : "Lockdown Lifted",
        description: res.active
          ? "New registrations are now blocked."
          : "Registrations are open again.",
        variant: res.active ? "destructive" : "default",
      });
    },
  });

  const active = data?.active ?? false;

  return (
    <div className={`flex items-center justify-between gap-4 p-4 rounded border ${active ? "bg-destructive/10 border-destructive/40" : "bg-secondary/30 border-border"}`}>
      <div className="flex items-center gap-3">
        {active ? <Lock className="w-5 h-5 text-destructive shrink-0" /> : <LockOpen className="w-5 h-5 text-muted-foreground shrink-0" />}
        <div>
          <p className={`text-sm font-display font-bold uppercase tracking-wider ${active ? "text-destructive" : "text-foreground"}`}>
            {active ? "Lockdown Active" : "Registration Open"}
          </p>
          <p className="text-xs font-sans text-muted-foreground">
            {active ? "New account registrations are currently blocked (anti-raid mode)." : "New members can register normally."}
          </p>
        </div>
      </div>
      <button
        onClick={() => toggle.mutate(!active)}
        disabled={toggle.isPending}
        className={`px-4 py-2 rounded text-xs font-display font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${
          active
            ? "bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20"
            : "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20"
        }`}
      >
        {active ? "Lift Lockdown" : "Activate Lockdown"}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "accounts" | "groups";

export default function CommandCenter() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("accounts");
  const isAdmin = user?.role === "admin";

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "accounts", label: "Accounts",     icon: <Users className="w-4 h-4" /> },
    { id: "groups",   label: "MilSim Groups", icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <PortalLayout requireRole={["admin", "moderator"]}>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 bg-destructive/20 text-destructive rounded flex items-center justify-center clip-angled-sm shrink-0">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-foreground">Command Center</h1>
            <p className="text-muted-foreground font-sans text-sm">Platform enforcement — accounts, groups, and access control.</p>
          </div>
        </div>

        {/* Moderator restrictions notice */}
        {!isAdmin && (
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded p-4">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-display font-bold uppercase tracking-wider text-amber-400 mb-1">Moderator Access</p>
              <p className="text-sm font-sans text-muted-foreground">
                You can ban/unban members and approve or reject MilSim groups. You cannot act on admin or moderator accounts, delete records, or change roles. Only admins have full access.
              </p>
            </div>
          </div>
        )}

        {/* Warning banner */}
        <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded p-4">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm font-sans text-muted-foreground">
            Actions here are <span className="text-foreground font-semibold">permanent and irreversible</span>. Bans are logged with reason and timestamp. Deletions cannot be undone.
          </p>
        </div>

        {/* Lockdown toggle — admin only */}
        {isAdmin && <LockdownToggle />}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-display font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors ${
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === "accounts" && <AccountsTab isAdmin={isAdmin} />}
        {tab === "groups"   && <GroupsTab   isAdmin={isAdmin} />}

      </div>
    </PortalLayout>
  );
}
