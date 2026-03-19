import { useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { apiFetch } from "@/lib/apiFetch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldAlert, AlertTriangle, Zap, RotateCcw, FileText, Eye,
  Clock, User, Globe, Terminal, CheckCircle, XCircle, Search,
  Download, Loader2, ChevronDown, ChevronUp, Info,
} from "lucide-react";

interface AuditLog {
  id: number;
  user_id: number | null;
  username: string | null;
  ip_address: string | null;
  user_agent: string | null;
  method: string;
  path: string;
  action_type: string;
  target_table: string | null;
  target_id: string | null;
  description: string | null;
  old_snapshot: object | null;
  new_snapshot: object | null;
  created_at: string;
}

interface SecurityIncident {
  id: number;
  triggered_by_username: string | null;
  description: string;
  affected_username: string | null;
  status: string;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "text-green-400",
  REGISTER: "text-blue-400",
  FAILED_LOGIN: "text-red-400",
  BAN: "text-orange-400",
  UNBAN: "text-yellow-400",
  ROLE_CHANGE: "text-purple-400",
  DELETE: "text-red-500",
  CREATE: "text-green-500",
  UPDATE: "text-blue-500",
  EMERGENCY_PROTOCOL: "text-red-600",
  LOCKDOWN_ON: "text-orange-500",
  LOCKDOWN_OFF: "text-green-500",
  ROLLBACK: "text-yellow-500",
};

function ActionBadge({ type }: { type: string }) {
  const color = ACTION_COLORS[type] ?? "text-muted-foreground";
  return (
    <span className={`font-display font-bold text-xs uppercase tracking-widest px-2 py-0.5 border border-current rounded ${color}`}>
      {type.replace(/_/g, " ")}
    </span>
  );
}

function LogRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-secondary/50 transition-colors"
      >
        <div className="shrink-0 mt-0.5">
          <ActionBadge type={log.action_type} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground truncate">{log.description ?? `${log.method} ${log.path}`}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
            {log.username && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {log.username}
              </span>
            )}
            {log.ip_address && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span className="font-mono">{log.ip_address}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {new Date(log.created_at).toLocaleString()}
            </span>
          </div>
        </div>
        <span className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border bg-secondary/20 space-y-3 text-xs font-mono">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-muted-foreground">IP:</span> {log.ip_address ?? "—"}</div>
            <div><span className="text-muted-foreground">Method:</span> {log.method} {log.path}</div>
            {log.target_table && <div><span className="text-muted-foreground">Table:</span> {log.target_table} #{log.target_id}</div>}
          </div>
          {log.user_agent && (
            <div><span className="text-muted-foreground">User-Agent:</span> <span className="break-all text-foreground/70">{log.user_agent}</span></div>
          )}
          {log.old_snapshot && (
            <details className="mt-2">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Before snapshot</summary>
              <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">{JSON.stringify(log.old_snapshot, null, 2)}</pre>
            </details>
          )}
          {log.new_snapshot && (
            <details>
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">After snapshot</summary>
              <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">{JSON.stringify(log.new_snapshot, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default function SecurityProtocol() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [filterUserId, setFilterUserId] = useState("");
  const [filterUserIdApplied, setFilterUserIdApplied] = useState<number | null>(null);
  const [emergencyReason, setEmergencyReason] = useState("");
  const [emergencyTarget, setEmergencyTarget] = useState("");
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState("");
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);

  const logsUrl = filterUserIdApplied
    ? `/api/security/audit-logs?userId=${filterUserIdApplied}&limit=200`
    : `/api/security/audit-logs?limit=200`;

  const { data: logs = [], isLoading: logsLoading } = useQuery<AuditLog[]>({
    queryKey: ["audit-logs", filterUserIdApplied],
    queryFn: () => apiFetch(logsUrl),
  });

  const { data: incidents = [] } = useQuery<SecurityIncident[]>({
    queryKey: ["security-incidents"],
    queryFn: () => apiFetch("/api/security/incidents"),
  });

  const emergencyMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/security/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: emergencyReason || "Emergency protocol triggered",
          affectedUserId: emergencyTarget ? parseInt(emergencyTarget) : undefined,
        }),
      }),
    onSuccess: (data) => {
      toast({
        title: "⚠️ Emergency Protocol Activated",
        description: data.message,
        variant: "destructive",
      });
      setShowEmergencyConfirm(false);
      setEmergencyReason("");
      qc.invalidateQueries({ queryKey: ["audit-logs"] });
      qc.invalidateQueries({ queryKey: ["security-incidents"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to activate emergency protocol.", variant: "destructive" }),
  });

  const rollbackMutation = useMutation({
    mutationFn: (userId: number) =>
      apiFetch(`/api/security/rollback/${userId}`, { method: "POST" }),
    onSuccess: (data) => {
      toast({
        title: "Rollback Complete",
        description: `Processed ${data.actionsProcessed} actions for ${data.targetUser?.username}.`,
      });
      setShowRollbackConfirm(false);
      setRollbackTarget("");
      qc.invalidateQueries({ queryKey: ["audit-logs"] });
    },
    onError: (err: any) => toast({ title: "Rollback Failed", description: err.message, variant: "destructive" }),
  });

  const downloadEvidence = async (userId: number) => {
    try {
      const data = await apiFetch(`/api/security/evidence/${userId}`);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TAG-EVIDENCE-USER${userId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Evidence Package Downloaded", description: `Report for user #${userId} saved.` });
    } catch {
      toast({ title: "Error", description: "Could not generate evidence package.", variant: "destructive" });
    }
  };

  const resolveIncident = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/security/incidents/${id}/resolve`, { method: "PATCH" }),
    onSuccess: () => {
      toast({ title: "Incident Resolved" });
      qc.invalidateQueries({ queryKey: ["security-incidents"] });
    },
  });

  return (
    <PortalLayout requireRole={["admin"]}>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-7 h-7 text-destructive" />
            <h1 className="font-display font-bold text-2xl uppercase tracking-widest text-destructive">
              Security Protocol
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Full audit trail, emergency lockdown controls, evidence packages, and change rollback. Admin access only.
          </p>
        </div>

        {/* Legal Notice Banner */}
        <div className="flex gap-3 p-4 bg-yellow-500/10 border border-yellow-500/40 rounded-lg">
          <Info className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-200/80">
            <strong className="text-yellow-300">Computer Misuse Act 1990 (UK):</strong> Unauthorised access to computer systems
            is a criminal offence under sections 1–3. Evidence packages generated here are suitable for submission to
            <strong className="text-yellow-300"> Action Fraud</strong> (actionfraud.police.uk) or your local police force.
            IP addresses can be used by law enforcement to compel ISP subscriber disclosure.
          </div>
        </div>

        {/* ── Emergency Protocol ─────────────────────────────────────────── */}
        <section className="bg-card border border-destructive/50 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-destructive/10 border-b border-destructive/30 flex items-center gap-3">
            <Zap className="w-5 h-5 text-destructive" />
            <h2 className="font-display font-bold uppercase tracking-widest text-destructive">Emergency Protocol</h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Immediately activates lockdown mode and terminates <strong>all non-admin sessions</strong> across the network.
              Use when a breach is detected or a bad actor is actively in the system.
            </p>
            {!showEmergencyConfirm ? (
              <button
                onClick={() => setShowEmergencyConfirm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-destructive hover:bg-destructive/90 text-white font-display font-bold uppercase tracking-widest text-sm rounded transition-all active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              >
                <ShieldAlert className="w-5 h-5" />
                Activate Emergency Protocol
              </button>
            ) : (
              <div className="space-y-4 p-4 bg-destructive/10 border border-destructive/40 rounded-lg">
                <div className="flex items-center gap-2 text-destructive font-display font-bold uppercase tracking-wider text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Confirm Emergency Activation
                </div>
                <p className="text-xs text-muted-foreground">
                  This will lock the site and kick everyone except admins. Provide a brief reason for the incident log.
                </p>
                <input
                  value={emergencyReason}
                  onChange={e => setEmergencyReason(e.target.value)}
                  placeholder="Reason (e.g. suspected account hijack, raid in progress...)"
                  className="mf-input w-full text-sm"
                />
                <input
                  value={emergencyTarget}
                  onChange={e => setEmergencyTarget(e.target.value)}
                  placeholder="Suspect user ID (optional)"
                  className="mf-input w-full text-sm"
                  type="number"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => emergencyMutation.mutate()}
                    disabled={emergencyMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2 bg-destructive hover:bg-destructive/90 text-white font-display font-bold uppercase tracking-wider text-sm rounded transition-all disabled:opacity-50"
                  >
                    {emergencyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Confirm — Execute Now
                  </button>
                  <button
                    onClick={() => setShowEmergencyConfirm(false)}
                    className="px-5 py-2 border border-border rounded text-sm font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Incidents ──────────────────────────────────────────────────── */}
        {incidents.length > 0 && (
          <section className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <h2 className="font-display font-bold uppercase tracking-widest">Security Incidents</h2>
            </div>
            <div className="divide-y divide-border">
              {incidents.map(inc => (
                <div key={inc.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{inc.description}</p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span>By: {inc.triggered_by_username ?? "—"}</span>
                      {inc.affected_username && <span>Target: {inc.affected_username}</span>}
                      <span>{new Date(inc.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-display font-bold uppercase px-2 py-0.5 rounded border ${
                      inc.status === "active"
                        ? "text-red-400 border-red-400/50 bg-red-400/10"
                        : "text-green-400 border-green-400/50 bg-green-400/10"
                    }`}>{inc.status}</span>
                    {inc.status === "active" && (
                      <button
                        onClick={() => resolveIncident.mutate(inc.id)}
                        className="text-xs px-3 py-1.5 border border-border rounded font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Evidence & Rollback Tools ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Evidence Package */}
          <section className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-3">
              <FileText className="w-5 h-5 text-accent" />
              <h2 className="font-display font-bold uppercase tracking-widest">Evidence Package</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate a full evidence report for a user — includes all IP addresses, browser fingerprints,
                timestamps, and action history. Formatted for law enforcement submission.
              </p>
              <div className="flex gap-2">
                <input
                  value={filterUserId}
                  onChange={e => setFilterUserId(e.target.value)}
                  placeholder="User ID"
                  className="mf-input flex-1 text-sm"
                  type="number"
                />
                <button
                  onClick={() => {
                    if (filterUserId) downloadEvidence(parseInt(filterUserId));
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-black font-display font-bold uppercase tracking-wider text-sm rounded transition-all"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                IP ≠ physical address. Law enforcement can obtain subscriber details from the ISP using the IP + timestamp under the Computer Misuse Act.
              </p>
            </div>
          </section>

          {/* Rollback Changes */}
          <section className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-3">
              <RotateCcw className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold uppercase tracking-widest">Rollback Changes</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Automatically undo all recorded changes made by a specific user — restores bans, role changes,
                MilSim group edits, and profile modifications to their previous state.
              </p>
              {!showRollbackConfirm ? (
                <div className="flex gap-2">
                  <input
                    value={rollbackTarget}
                    onChange={e => setRollbackTarget(e.target.value)}
                    placeholder="User ID to rollback"
                    className="mf-input flex-1 text-sm"
                    type="number"
                  />
                  <button
                    onClick={() => { if (rollbackTarget) setShowRollbackConfirm(true); }}
                    disabled={!rollbackTarget}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm rounded transition-all disabled:opacity-40"
                  >
                    <RotateCcw className="w-4 h-4" /> Rollback
                  </button>
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-primary/10 border border-primary/40 rounded-lg">
                  <p className="text-xs text-foreground">
                    Rollback <strong>all logged changes</strong> by user <code className="bg-background px-1 rounded">#{rollbackTarget}</code>?
                    This is irreversible.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => rollbackMutation.mutate(parseInt(rollbackTarget))}
                      disabled={rollbackMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-display font-bold uppercase text-xs rounded"
                    >
                      {rollbackMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                      Confirm Rollback
                    </button>
                    <button onClick={() => setShowRollbackConfirm(false)} className="px-4 py-2 border border-border rounded text-xs font-display uppercase text-muted-foreground hover:text-foreground">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── Audit Log Viewer ───────────────────────────────────────────── */}
        <section className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Terminal className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold uppercase tracking-widest">Audit Log</h2>
              <span className="text-xs text-muted-foreground ml-1">({logs.length} entries)</span>
            </div>
            <div className="flex gap-2">
              <input
                value={filterUserId}
                onChange={e => setFilterUserId(e.target.value)}
                placeholder="Filter by user ID..."
                className="mf-input text-sm w-40"
                type="number"
              />
              <button
                onClick={() => setFilterUserIdApplied(filterUserId ? parseInt(filterUserId) : null)}
                className="flex items-center gap-1 px-3 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded text-xs font-display font-bold uppercase tracking-wider text-primary transition-colors"
              >
                <Search className="w-3 h-3" /> Filter
              </button>
              {filterUserIdApplied && (
                <button
                  onClick={() => { setFilterUserIdApplied(null); setFilterUserId(""); }}
                  className="px-3 py-2 border border-border rounded text-xs text-muted-foreground hover:text-foreground font-display uppercase"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
            {logsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No logs found.</div>
            ) : (
              logs.map(log => <LogRow key={log.id} log={log} />)
            )}
          </div>
        </section>

      </div>
    </PortalLayout>
  );
}
