import { useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { useListUsers, useUpdateUserRole } from "@workspace/api-client-react";
import {
  Settings, Shield, Radio, Send, Loader2, KeyRound, Link as LinkIcon,
  Award, CheckCircle2, XCircle, AlertCircle, Eye, RefreshCw, Clock, Info
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";

interface ResetToken {
  id: number; token: string; username: string; email: string;
  expires_at: string; created_at: string;
}

interface VetApp {
  id: number; username: string; email: string;
  country: string; branch: string; rank: string; mos_role: string;
  service_start: string; service_end: string | null;
  is_currently_serving: boolean;
  unit_or_formation: string | null;
  deployment_history: string | null;
  reason_for_joining: string;
  tactical_experience: string;
  additional_info: string | null;
  id_type: string | null;
  has_id_upload: boolean;
  id_verification_status: string;
  ai_verification_result: string | null;
  ai_confidence_score: number | null;
  status: string;
  review_note: string | null;
  created_at: string;
}

interface VetAppDetail extends VetApp {
  id_upload_data: string | null;
}

const ID_TYPE_LABELS: Record<string, string> = {
  va_card:          "US VA Card",
  uk_veteran_card:  "UK Veteran Card",
  mod90:            "UK MOD Form 90",
  f214:             "UK F214 Discharge",
  other:            "Other Military Doc",
};

const STATUS_COLORS: Record<string, string> = {
  pending:          "text-amber-400 border-amber-400/30 bg-amber-400/10",
  under_review:     "text-blue-400 border-blue-400/30 bg-blue-400/10",
  approved:         "text-primary border-primary/30 bg-primary/10",
  rejected:         "text-destructive border-destructive/30 bg-destructive/10",
};

const ID_STATUS_COLORS: Record<string, string> = {
  not_submitted:    "text-muted-foreground border-border bg-secondary",
  pending:          "text-amber-400 border-amber-400/30 bg-amber-400/10",
  ai_verified:      "text-primary border-primary/30 bg-primary/10",
  ai_flagged:       "text-amber-400 border-amber-400/30 bg-amber-400/10",
  manually_verified:"text-primary border-primary/30 bg-primary/10",
  rejected:         "text-destructive border-destructive/30 bg-destructive/10",
};

export default function AdminPanel() {
  const { data: users, refetch } = useListUsers();
  const updateRole = useUpdateUserRole();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"roster" | "broadcast" | "resets" | "veteran">("roster");

  const [bSubject, setBSubject] = useState("");
  const [bBody, setBBody] = useState("");
  const [selectedVetApp, setSelectedVetApp] = useState<VetAppDetail | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [vetFilter, setVetFilter] = useState<string>("all");

  const broadcastMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: bSubject, body: bBody }),
      }),
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

  const { data: vetApps = [], isLoading: vetLoading } = useQuery<VetApp[]>({
    queryKey: ["veteran-apps"],
    queryFn: () => apiFetch<VetApp[]>("/api/admin/veteran-apps"),
    enabled: tab === "veteran",
  });

  const handleRoleChange = (id: number, newRole: string) => {
    updateRole.mutate({ id, data: { role: newRole } }, {
      onSuccess: () => { toast({ title: "Role Updated" }); refetch(); },
      onError: (err: any) => toast({ title: "Update Failed", description: err.data?.error || "Error.", variant: "destructive" }),
    });
  };

  const copyResetLink = (token: string) => {
    const url = `${window.location.origin}/portal/reset-password?token=${token}`;
    navigator.clipboard.writeText(url).then(() => toast({ title: "Reset link copied to clipboard." }));
  };

  const openVetApp = async (id: number) => {
    try {
      const detail = await apiFetch<VetAppDetail>(`/api/admin/veteran-apps/${id}`);
      setSelectedVetApp(detail);
      setReviewNote(detail.review_note ?? "");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const reviewVetApp = async (status: string) => {
    if (!selectedVetApp) return;
    try {
      await apiFetch(`/api/admin/veteran-apps/${selectedVetApp.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, reviewNote: reviewNote || undefined }),
      });
      toast({ title: status === "approved" ? "Application Approved" : status === "rejected" ? "Application Rejected" : "Status Updated" });
      qc.invalidateQueries({ queryKey: ["veteran-apps"] });
      setSelectedVetApp(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const rerunAI = async (id: number) => {
    try {
      const result = await apiFetch<any>(`/api/admin/veteran-apps/${id}/verify-id`, { method: "POST" });
      toast({ title: "AI Re-verification Complete", description: `${result.verdict} (${result.confidence}% confidence) — ${result.summary}` });
      qc.invalidateQueries({ queryKey: ["veteran-apps"] });
      if (selectedVetApp?.id === id) {
        const updated = await apiFetch<VetAppDetail>(`/api/admin/veteran-apps/${id}`);
        setSelectedVetApp(updated);
      }
    } catch (e: any) {
      toast({ title: "AI Error", description: e.message, variant: "destructive" });
    }
  };

  const filteredVetApps = vetFilter === "all" ? vetApps : vetApps.filter(a => a.status === vetFilter);

  const aiResult = selectedVetApp?.ai_verification_result
    ? (() => { try { return JSON.parse(selectedVetApp.ai_verification_result); } catch { return null; } })()
    : null;

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
        <div className="flex flex-wrap gap-1 border-b border-border">
          {[
            { key: "roster",    label: "Personnel",          icon: <Shield className="w-4 h-4" /> },
            { key: "veteran",   label: "Veteran Apps",       icon: <Award className="w-4 h-4" /> },
            { key: "broadcast", label: "Broadcast",          icon: <Radio className="w-4 h-4" /> },
            { key: "resets",    label: "Password Resets",    icon: <KeyRound className="w-4 h-4" /> },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-5 py-3 font-display font-bold uppercase tracking-widest text-sm transition-colors border-b-2 ${
                tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t.icon} {t.label}
              {t.key === "veteran" && vetApps.filter(a => a.status === "pending").length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-display font-bold">
                  {vetApps.filter(a => a.status === "pending").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Roster Tab ─────────────────────────────────────────────── */}
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
                        <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                          disabled={updateRole.isPending}
                          className={`bg-background border rounded px-3 py-1.5 text-xs font-display font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 ${
                            u.role === "admin" ? "border-destructive text-destructive" :
                            u.role === "moderator" ? "border-accent text-accent" :
                            u.role === "staff" ? "border-blue-400 text-blue-400" :
                            "border-border text-muted-foreground"
                          }`}>
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

        {/* ── Veteran Apps Tab ───────────────────────────────────────── */}
        {tab === "veteran" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-display font-bold uppercase tracking-wider text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" /> Veteran Advisory Applications
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Review and verify military service applications.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {["all", "pending", "under_review", "approved", "rejected"].map(f => (
                  <button key={f} onClick={() => setVetFilter(f)}
                    className={`px-3 py-1.5 rounded text-xs font-display font-bold uppercase tracking-widest transition-all ${
                      vetFilter === f ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"
                    }`}>
                    {f === "all" ? "All" : f.replace("_", " ")}
                    {f !== "all" && <span className="ml-1.5 opacity-70">({vetApps.filter(a => a.status === f).length})</span>}
                  </button>
                ))}
              </div>
            </div>

            {vetLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : filteredVetApps.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-lg text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-display uppercase tracking-widest text-sm">No applications found</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/40 border-b border-border">
                    <tr>
                      {["Applicant", "Country / Branch", "ID Verification", "App Status", "Submitted", "Actions"].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredVetApps.map(app => (
                      <tr key={app.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-display font-bold text-sm text-foreground">{app.username}</p>
                          <p className="text-xs text-muted-foreground">{app.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-sans">{app.branch}</p>
                          <p className="text-xs text-muted-foreground">{app.rank} · {app.mos_role}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-display font-bold uppercase tracking-widest ${ID_STATUS_COLORS[app.id_verification_status] ?? ID_STATUS_COLORS.not_submitted}`}>
                            {app.id_verification_status.replace(/_/g, " ")}
                          </span>
                          {app.ai_confidence_score !== null && (
                            <p className="text-xs text-muted-foreground mt-0.5">{app.ai_confidence_score}% confidence</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-display font-bold uppercase tracking-widest ${STATUS_COLORS[app.status] ?? ""}`}>
                            {app.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {format(new Date(app.created_at), "d MMM yyyy")}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => openVetApp(app.id)}
                            className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors">
                            <Eye className="w-3.5 h-3.5" /> Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Detail Modal */}
            {selectedVetApp && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
                <div className="bg-background border border-border rounded-xl w-full max-w-3xl my-8 shadow-2xl">
                  <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                      <h3 className="font-display font-black text-xl uppercase tracking-wider">{selectedVetApp.username}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedVetApp.email} · Submitted {format(new Date(selectedVetApp.created_at), "d MMM yyyy HH:mm")}</p>
                    </div>
                    <button onClick={() => setSelectedVetApp(null)} className="p-2 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">

                    {/* Service Details */}
                    <div>
                      <h4 className="font-display font-bold uppercase tracking-widest text-xs text-muted-foreground mb-3">Service Details</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { label: "Country", value: selectedVetApp.country },
                          { label: "Branch", value: selectedVetApp.branch },
                          { label: "Rank", value: selectedVetApp.rank },
                          { label: "Trade / MOS", value: selectedVetApp.mos_role },
                          { label: "Service Period", value: `${selectedVetApp.service_start}${selectedVetApp.service_end ? ` – ${selectedVetApp.service_end}` : selectedVetApp.is_currently_serving ? " – Present" : ""}` },
                          { label: "Unit", value: selectedVetApp.unit_or_formation ?? "Not provided" },
                        ].map(r => (
                          <div key={r.label} className="bg-secondary/30 rounded p-3">
                            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{r.label}</p>
                            <p className="text-sm font-sans text-foreground">{r.value}</p>
                          </div>
                        ))}
                      </div>
                      {selectedVetApp.deployment_history && (
                        <div className="mt-3 bg-secondary/30 rounded p-3">
                          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Deployment History</p>
                          <p className="text-sm font-sans text-foreground">{selectedVetApp.deployment_history}</p>
                        </div>
                      )}
                    </div>

                    {/* Advisory Answers */}
                    <div>
                      <h4 className="font-display font-bold uppercase tracking-widest text-xs text-muted-foreground mb-3">Advisory Answers</h4>
                      <div className="space-y-3">
                        <div className="bg-card border border-border rounded p-4">
                          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Why TAG?</p>
                          <p className="text-sm font-sans text-foreground leading-relaxed">{selectedVetApp.reason_for_joining}</p>
                        </div>
                        <div className="bg-card border border-border rounded p-4">
                          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Tactical Experience</p>
                          <p className="text-sm font-sans text-foreground leading-relaxed">{selectedVetApp.tactical_experience}</p>
                        </div>
                        {selectedVetApp.additional_info && (
                          <div className="bg-card border border-border rounded p-4">
                            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Additional Info</p>
                            <p className="text-sm font-sans text-foreground leading-relaxed">{selectedVetApp.additional_info}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ID Verification */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-display font-bold uppercase tracking-widest text-xs text-muted-foreground">ID Verification</h4>
                        {selectedVetApp.has_id_upload && (
                          <button onClick={() => rerunAI(selectedVetApp.id)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary font-display uppercase tracking-wider transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" /> Re-run AI
                          </button>
                        )}
                      </div>

                      <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Document Type</p>
                            <p className="text-sm">{selectedVetApp.id_type ? ID_TYPE_LABELS[selectedVetApp.id_type] ?? selectedVetApp.id_type : "Not submitted"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-0.5">AI Status</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded border font-display font-bold uppercase tracking-widest ${ID_STATUS_COLORS[selectedVetApp.id_verification_status] ?? ""}`}>
                              {selectedVetApp.id_verification_status.replace(/_/g, " ")}
                              {selectedVetApp.ai_confidence_score !== null && ` · ${selectedVetApp.ai_confidence_score}%`}
                            </span>
                          </div>
                        </div>

                        {aiResult && (
                          <div className="border border-border rounded p-3 space-y-1.5 text-xs">
                            <p className="font-display font-bold uppercase tracking-widest text-muted-foreground">AI Analysis</p>
                            {aiResult.summary && <p className="text-foreground">{aiResult.summary}</p>}
                            {aiResult.documentType && <p><span className="text-muted-foreground">Document:</span> {aiResult.documentType}</p>}
                            {aiResult.name && <p><span className="text-muted-foreground">Name:</span> {aiResult.name}</p>}
                            {aiResult.serviceInfo && <p><span className="text-muted-foreground">Service:</span> {aiResult.serviceInfo}</p>}
                            {aiResult.date && <p><span className="text-muted-foreground">Date:</span> {aiResult.date}</p>}
                            {aiResult.flags && <p className="text-amber-400"><span className="text-muted-foreground">Flags:</span> {aiResult.flags}</p>}
                          </div>
                        )}

                        {selectedVetApp.id_upload_data?.startsWith("data:image") && (
                          <div>
                            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Uploaded Document</p>
                            <img src={selectedVetApp.id_upload_data} alt="Submitted ID" className="max-h-64 rounded border border-border object-contain" />
                          </div>
                        )}

                        {!selectedVetApp.has_id_upload && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Info className="w-3.5 h-3.5 shrink-0" />
                            No ID document was submitted with this application. Manual verification only.
                          </div>
                        )}

                        {/* Manual ID override */}
                        <div className="flex gap-2 pt-1">
                          {["manually_verified", "rejected"].map(s => (
                            <button key={s} onClick={async () => {
                              await apiFetch(`/api/admin/veteran-apps/${selectedVetApp.id}`, {
                                method: "PATCH", body: JSON.stringify({ idVerificationStatus: s })
                              });
                              const updated = await apiFetch<VetAppDetail>(`/api/admin/veteran-apps/${selectedVetApp.id}`);
                              setSelectedVetApp(updated);
                              toast({ title: `ID marked as ${s.replace(/_/g, " ")}` });
                              qc.invalidateQueries({ queryKey: ["veteran-apps"] });
                            }}
                              className={`text-[10px] px-3 py-1.5 rounded border font-display font-bold uppercase tracking-widest transition-all ${
                                s === "manually_verified" ? "border-primary/40 text-primary hover:bg-primary/10" : "border-destructive/40 text-destructive hover:bg-destructive/10"
                              }`}>
                              {s === "manually_verified" ? "✓ Mark Verified" : "✗ Reject ID"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Review Decision */}
                    <div>
                      <h4 className="font-display font-bold uppercase tracking-widest text-xs text-muted-foreground mb-3">Review Decision</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Staff Note (visible to applicant)</label>
                          <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={3}
                            className="mf-input w-full resize-none text-sm" placeholder="Welcome to TAG, your service has been verified..." />
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          <button onClick={() => reviewVetApp("under_review")}
                            className="flex items-center gap-2 px-4 py-2 border border-blue-400/40 text-blue-400 hover:bg-blue-400/10 font-display font-bold uppercase tracking-wider text-xs rounded transition-all">
                            <Clock className="w-3.5 h-3.5" /> Mark Under Review
                          </button>
                          <button onClick={() => reviewVetApp("approved")}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs rounded transition-all">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button onClick={() => reviewVetApp("rejected")}
                            className="flex items-center gap-2 px-4 py-2 border border-destructive/40 text-destructive hover:bg-destructive/10 font-display font-bold uppercase tracking-wider text-xs rounded transition-all">
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Broadcast Tab ──────────────────────────────────────────── */}
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
                <input value={bSubject} onChange={e => setBSubject(e.target.value)} maxLength={200} className="mf-input w-full" placeholder="System-wide announcement..." />
              </div>
              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Body</label>
                <textarea value={bBody} onChange={e => setBBody(e.target.value)} rows={6} maxLength={5000} className="mf-input w-full resize-none" placeholder="Compose your announcement here..." />
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

        {/* ── Password Resets Tab ────────────────────────────────────── */}
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

      </div>
    </PortalLayout>
  );
}
