import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { apiFetch } from "@/lib/apiFetch";
import {
  Shield, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle,
  Upload, Loader2, FileCheck, Clock, X, Eye, EyeOff, Info
} from "lucide-react";

// ── Question definitions ───────────────────────────────────────────────────────

const UK_BRANCHES = [
  "British Army", "Royal Navy", "Royal Marines", "Royal Air Force",
  "Royal Fleet Auxiliary", "Other UK / Commonwealth"
];
const US_BRANCHES = [
  "US Army", "US Navy", "US Marine Corps", "US Air Force",
  "US Coast Guard", "US Space Force", "National Guard", "US Army Reserve"
];
const OTHER_BRANCHES = ["Other NATO / Allied", "Other"];

const ID_TYPES: Record<string, { label: string; description: string }> = {
  va_card:         { label: "US Veterans Affairs (VA) ID Card",            description: "Issued by the US Department of Veterans Affairs to eligible veterans." },
  uk_veteran_card: { label: "UK HM Armed Forces Veteran Card",             description: "UK Government–issued card confirming former armed forces service." },
  mod90:           { label: "UK MOD Form 90 (Military ID)",                description: "Standard MOD identity card issued to serving and recent personnel." },
  f214:            { label: "UK F214 Discharge / Testimonial Document",    description: "Certificate issued upon discharge from HM Armed Forces." },
  other:           { label: "Other Official Military Document",             description: "Any other government–issued document confirming military service." },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExistingApp {
  id: number;
  status: string;
  id_verification_status: string;
  ai_confidence_score: number | null;
  review_note: string | null;
  created_at: string;
  country: string;
  branch: string;
  rank: string;
  service_start: string;
  service_end: string | null;
  id_type: string | null;
}

type Step = "intro" | "service" | "advisory" | "id_upload" | "review" | "submitted";

interface FormData {
  country: string;
  branch: string;
  rank: string;
  isCurrentlyServing: boolean;
  serviceStart: string;
  serviceEnd: string;
  mosRole: string;
  unitOrFormation: string;
  deploymentHistory: string;
  reasonForJoining: string;
  tacticalExperience: string;
  additionalInfo: string;
  idType: string;
  idUploadData: string;
  idFileName: string;
}

const EMPTY: FormData = {
  country: "", branch: "", rank: "", isCurrentlyServing: false,
  serviceStart: "", serviceEnd: "", mosRole: "", unitOrFormation: "",
  deploymentHistory: "", reasonForJoining: "", tacticalExperience: "",
  additionalInfo: "", idType: "", idUploadData: "", idFileName: "",
};

// ── Status display ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const MAP: Record<string, { label: string; color: string }> = {
    pending:        { label: "Pending Review",  color: "text-amber-400 border-amber-400/40 bg-amber-400/10" },
    under_review:   { label: "Under Review",    color: "text-blue-400 border-blue-400/40 bg-blue-400/10" },
    approved:       { label: "Approved",        color: "text-primary border-primary/40 bg-primary/10" },
    rejected:       { label: "Rejected",        color: "text-destructive border-destructive/40 bg-destructive/10" },
  };
  const s = MAP[status] ?? { label: status, color: "text-muted-foreground border-border bg-secondary" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded border font-display font-bold uppercase tracking-widest ${s.color}`}>
      {s.label}
    </span>
  );
}

function IDVerificationBadge({ status, score }: { status: string; score: number | null }) {
  const MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    not_submitted:    { label: "No ID Submitted",  color: "text-muted-foreground border-border bg-secondary",        icon: Info },
    pending:          { label: "Pending AI Check", color: "text-amber-400 border-amber-400/40 bg-amber-400/10",      icon: Clock },
    ai_verified:      { label: "AI Verified",      color: "text-primary border-primary/40 bg-primary/10",            icon: CheckCircle2 },
    ai_flagged:       { label: "AI Flagged",       color: "text-amber-400 border-amber-400/40 bg-amber-400/10",      icon: AlertCircle },
    manually_verified:{ label: "Manually Verified",color: "text-primary border-primary/40 bg-primary/10",            icon: CheckCircle2 },
    rejected:         { label: "ID Rejected",      color: "text-destructive border-destructive/40 bg-destructive/10",icon: X },
  };
  const s = MAP[status] ?? MAP.not_submitted;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded border font-display font-bold uppercase tracking-widest ${s.color}`}>
      <Icon className="w-3 h-3" />
      {s.label}
      {score !== null && score !== undefined && <span className="opacity-70">({score}%)</span>}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function VeteranAdvisoryApp() {
  const [existing, setExisting] = useState<ExistingApp | null | undefined>(undefined);
  const [step, setStep] = useState<Step>("intro");
  const [form, setForm] = useState<FormData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [showIdPreview, setShowIdPreview] = useState(false);

  useEffect(() => {
    apiFetch<ExistingApp | null>("/api/veteran-app/mine")
      .then(setExisting)
      .catch(() => setExisting(null));
  }, []);

  const set = (key: keyof FormData, value: any) => setForm(f => ({ ...f, [key]: value }));

  const handleFileUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { setError("File must be under 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      set("idUploadData", e.target?.result as string);
      set("idFileName", file.name);
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/api/veteran-app", {
        method: "POST",
        body: JSON.stringify({
          country: form.country,
          branch: form.branch,
          rank: form.rank,
          isCurrentlyServing: form.isCurrentlyServing,
          serviceStart: form.serviceStart,
          serviceEnd: form.serviceEnd || undefined,
          mosRole: form.mosRole,
          unitOrFormation: form.unitOrFormation || undefined,
          deploymentHistory: form.deploymentHistory || undefined,
          reasonForJoining: form.reasonForJoining,
          tacticalExperience: form.tacticalExperience,
          additionalInfo: form.additionalInfo || undefined,
          idType: form.idType || undefined,
          idUploadData: form.idUploadData || undefined,
        }),
      });
      const updated = await apiFetch<ExistingApp>("/api/veteran-app/mine");
      setExisting(updated);
      setStep("submitted");
    } catch (e: any) {
      setError(e.message ?? "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (existing === undefined) return (
    <PortalLayout>
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    </PortalLayout>
  );

  // Already submitted (and not rejected)
  if (existing && existing.status !== "rejected") return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl uppercase tracking-wider">Veteran Advisory Application</h1>
            <p className="text-muted-foreground text-sm">Your application has been received.</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-display font-bold uppercase tracking-widest text-xs text-muted-foreground mb-1">Application Status</p>
              <StatusBadge status={existing.status} />
            </div>
            <div>
              <p className="font-display font-bold uppercase tracking-widest text-xs text-muted-foreground mb-1">ID Verification</p>
              <IDVerificationBadge status={existing.id_verification_status} score={existing.ai_confidence_score} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Country:</span> <strong>{existing.country}</strong></div>
            <div><span className="text-muted-foreground">Branch:</span> <strong>{existing.branch}</strong></div>
            <div><span className="text-muted-foreground">Rank:</span> <strong>{existing.rank}</strong></div>
            <div><span className="text-muted-foreground">Service Start:</span> <strong>{existing.service_start}</strong></div>
          </div>

          {existing.review_note && (
            <div className="bg-secondary/40 border border-border rounded p-4">
              <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Staff Note</p>
              <p className="text-sm font-sans">{existing.review_note}</p>
            </div>
          )}

          {existing.status === "approved" && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-display font-bold uppercase tracking-wider text-primary text-sm">Service Verified</p>
                <p className="text-sm text-muted-foreground mt-1">Your military service has been confirmed. Your Veteran status is now active on your profile. Welcome, operator.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );

  // Step content
  const branches = form.country === "UK" ? UK_BRANCHES : form.country === "US" ? US_BRANCHES : OTHER_BRANCHES;

  const STEPS: Step[] = ["intro", "service", "advisory", "id_upload", "review"];
  const stepIndex = STEPS.indexOf(step);
  const progress = step === "submitted" ? 100 : Math.round((stepIndex / (STEPS.length - 1)) * 100);

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-display font-black text-2xl uppercase tracking-wider">Veteran Advisory Application</h1>
            <p className="text-muted-foreground text-sm mt-0.5">For current and former military personnel seeking advisory status within TAG.</p>
          </div>
        </div>

        {/* Progress bar */}
        {step !== "intro" && step !== "submitted" && (
          <div>
            <div className="flex justify-between text-xs font-display uppercase tracking-widest text-muted-foreground mb-2">
              {["Service Details", "Advisory Qs", "ID Verification", "Review & Submit"].map((s, i) => (
                <span key={s} className={stepIndex > i + 1 ? "text-primary" : stepIndex === i + 1 ? "text-foreground" : ""}>{s}</span>
              ))}
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-3 rounded bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

            {/* INTRO ──────────────────────────────────────────── */}
            {step === "intro" && (
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <h2 className="font-display font-black text-xl uppercase tracking-wider">About This Application</h2>
                  <p className="font-sans text-muted-foreground leading-relaxed">
                    TAG's Military Advisory Programme recognises current and former service personnel across all branches.
                    Approved applicants receive a verified <strong className="text-foreground">Veteran</strong> designation on their profile
                    and access to advisory channels where your real-world experience directly informs the community.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Service Details", desc: "Branch, rank, and service history" },
                      { label: "Advisory Questions", desc: "Your background and motivation" },
                      { label: "ID Verification", desc: "Optional — VA card or UK Veteran card" },
                    ].map(s => (
                      <div key={s.label} className="bg-secondary/30 border border-border rounded p-4">
                        <p className="font-display font-bold uppercase tracking-wider text-sm text-foreground mb-1">{s.label}</p>
                        <p className="text-xs text-muted-foreground">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded p-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">Privacy:</strong> Your ID images are used only for verification and are never shared publicly.
                    Submitted data is reviewed by TAG staff only.
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setStep("service")}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider px-8 py-3 rounded clip-angled-sm transition-all">
                    Begin Application <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* SERVICE DETAILS ────────────────────────────────── */}
            {step === "service" && (
              <div className="space-y-6">
                <h2 className="font-display font-bold text-lg uppercase tracking-wider">Service Details</h2>
                <div className="bg-card border border-border rounded-lg p-6 space-y-5">

                  <div>
                    <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Country of Service *</label>
                    <div className="flex gap-3 flex-wrap">
                      {["UK", "US", "Other"].map(c => (
                        <button key={c} onClick={() => { set("country", c); set("branch", ""); }}
                          className={`px-6 py-2.5 rounded border font-display font-bold uppercase tracking-widest text-sm transition-all ${form.country === c ? "bg-primary border-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                          {c === "UK" ? "🇬🇧 UK" : c === "US" ? "🇺🇸 US" : "🌐 Other"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.country && (
                    <>
                      <div>
                        <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Branch of Service *</label>
                        <select value={form.branch} onChange={e => set("branch", e.target.value)} className="mf-input w-full">
                          <option value="">Select branch...</option>
                          {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Rank at Discharge / Current Rank *</label>
                          <input value={form.rank} onChange={e => set("rank", e.target.value)} className="mf-input w-full" placeholder="e.g. Corporal, Sergeant, Lance Corporal" />
                        </div>
                        <div>
                          <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Trade / MOS / Specialisation *</label>
                          <input value={form.mosRole} onChange={e => set("mosRole", e.target.value)} className="mf-input w-full" placeholder="e.g. Infantry, Combat Medic, RMP, 11B" />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 cursor-pointer mb-4">
                          <input type="checkbox" checked={form.isCurrentlyServing} onChange={e => set("isCurrentlyServing", e.target.checked)} className="w-4 h-4 accent-primary" />
                          <span className="text-sm font-sans text-muted-foreground">I am currently serving</span>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Service Start Year *</label>
                            <input value={form.serviceStart} onChange={e => set("serviceStart", e.target.value)} className="mf-input w-full" placeholder="e.g. 2010" maxLength={7} />
                          </div>
                          {!form.isCurrentlyServing && (
                            <div>
                              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Discharge Year</label>
                              <input value={form.serviceEnd} onChange={e => set("serviceEnd", e.target.value)} className="mf-input w-full" placeholder="e.g. 2018" maxLength={7} />
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Unit / Formation (optional)</label>
                        <input value={form.unitOrFormation} onChange={e => set("unitOrFormation", e.target.value)} className="mf-input w-full" placeholder="e.g. 1 RIFLES, 82nd Airborne, 2 PARA" />
                      </div>

                      <div>
                        <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Deployment History (optional)</label>
                        <textarea value={form.deploymentHistory} onChange={e => set("deploymentHistory", e.target.value)} rows={3} className="mf-input w-full resize-none"
                          placeholder="e.g. Afghanistan (Op Herrick), Iraq (Op Telic), Exercise deployments..." />
                        <p className="text-xs text-muted-foreground mt-1">Do not include classified information. General theatre / exercise names only.</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-between">
                  <button onClick={() => setStep("intro")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-display uppercase tracking-wider text-sm transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={() => setStep("advisory")}
                    disabled={!form.country || !form.branch || !form.rank || !form.mosRole || !form.serviceStart}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider px-6 py-2.5 rounded clip-angled-sm transition-all disabled:opacity-50">
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ADVISORY QUESTIONS ─────────────────────────────── */}
            {step === "advisory" && (
              <div className="space-y-6">
                <h2 className="font-display font-bold text-lg uppercase tracking-wider">Advisory Questions</h2>
                <div className="bg-card border border-border rounded-lg p-6 space-y-6">

                  <div>
                    <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                      Why do you want to join TAG as a Veteran Advisor? *
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">What do you hope to contribute and gain from the community?</p>
                    <textarea value={form.reasonForJoining} onChange={e => set("reasonForJoining", e.target.value)} rows={4} className="mf-input w-full resize-none"
                      placeholder="I want to share real-world TTPs with the community and help members understand..." />
                  </div>

                  <div>
                    <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                      Describe your tactical / operational experience *
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">What specific skills and knowledge from your service are most relevant to tactical gaming?</p>
                    <textarea value={form.tacticalExperience} onChange={e => set("tacticalExperience", e.target.value)} rows={4} className="mf-input w-full resize-none"
                      placeholder="e.g. Section command, close recce, patrol medic, JTAC qualified — I can bring..." />
                  </div>

                  <div>
                    <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                      How does your military background influence your approach to gaming?
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">Optional — tell us how you play and what you value.</p>
                    <textarea value={form.additionalInfo} onChange={e => set("additionalInfo", e.target.value)} rows={3} className="mf-input w-full resize-none"
                      placeholder="Service taught me to communicate clearly under pressure. In Squad I gravitate toward..." />
                  </div>
                </div>
                <div className="flex justify-between">
                  <button onClick={() => setStep("service")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-display uppercase tracking-wider text-sm transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={() => setStep("id_upload")}
                    disabled={!form.reasonForJoining.trim() || !form.tacticalExperience.trim()}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider px-6 py-2.5 rounded clip-angled-sm transition-all disabled:opacity-50">
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ID UPLOAD ──────────────────────────────────────── */}
            {step === "id_upload" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-bold text-lg uppercase tracking-wider">Identity Verification</h2>
                  <p className="text-sm text-muted-foreground mt-1">Optional but recommended. Uploading your service ID enables automated AI pre-screening and speeds up manual review.</p>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 space-y-5">
                  <div>
                    <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-3">Document Type</label>
                    <div className="space-y-2">
                      {Object.entries(ID_TYPES).map(([key, val]) => (
                        <label key={key} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${form.idType === key ? "bg-primary/5 border-primary/40" : "border-border hover:border-border/60"}`}>
                          <input type="radio" name="idType" value={key} checked={form.idType === key} onChange={() => set("idType", key)} className="mt-0.5 accent-primary" />
                          <div>
                            <p className="font-display font-bold uppercase tracking-wider text-sm text-foreground">{val.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{val.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {form.idType && (
                    <div>
                      <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-3">Upload Document Image</label>

                      {!form.idUploadData ? (
                        <div
                          onClick={() => fileRef.current?.click()}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
                          className="border-2 border-dashed border-border hover:border-primary/50 rounded-lg p-10 text-center cursor-pointer transition-colors group"
                        >
                          <Upload className="w-10 h-10 text-muted-foreground group-hover:text-primary mx-auto mb-3 transition-colors" />
                          <p className="font-display font-bold uppercase tracking-wider text-sm text-foreground">Click or drag to upload</p>
                          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF · Max 5 MB</p>
                          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                        </div>
                      ) : (
                        <div className="border border-primary/30 bg-primary/5 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-5 h-5 text-primary" />
                              <span className="text-sm font-display font-bold text-foreground">{form.idFileName}</span>
                            </div>
                            <div className="flex gap-2">
                              {form.idUploadData.startsWith("data:image") && (
                                <button onClick={() => setShowIdPreview(!showIdPreview)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                                  {showIdPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              )}
                              <button onClick={() => { set("idUploadData", ""); set("idFileName", ""); }}
                                className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {showIdPreview && form.idUploadData.startsWith("data:image") && (
                            <img src={form.idUploadData} alt="ID preview" className="max-h-48 rounded object-contain mx-auto border border-border" />
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Info className="w-3.5 h-3.5 shrink-0" />
                            Our AI will pre-screen this document. Your image is stored securely and reviewed by staff only.
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!form.idType && (
                    <div className="flex items-start gap-3 bg-secondary/30 border border-border rounded p-4 text-sm text-muted-foreground">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>You can skip ID upload and proceed. Applications without ID verification will be reviewed manually and may take longer.</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep("advisory")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-display uppercase tracking-wider text-sm transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={() => setStep("review")}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider px-6 py-2.5 rounded clip-angled-sm transition-all">
                    {form.idType && form.idUploadData ? "Continue with ID" : "Skip & Continue"} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* REVIEW ─────────────────────────────────────────── */}
            {step === "review" && (
              <div className="space-y-6">
                <h2 className="font-display font-bold text-lg uppercase tracking-wider">Review & Submit</h2>
                <div className="bg-card border border-border rounded-lg divide-y divide-border">
                  {[
                    { label: "Country", value: form.country },
                    { label: "Branch", value: form.branch },
                    { label: "Rank", value: form.rank },
                    { label: "Trade / MOS", value: form.mosRole },
                    { label: "Service Period", value: `${form.serviceStart}${form.serviceEnd ? ` – ${form.serviceEnd}` : form.isCurrentlyServing ? " – Present" : ""}` },
                    { label: "Unit", value: form.unitOrFormation || "Not provided" },
                    { label: "Deployments", value: form.deploymentHistory || "Not provided" },
                    { label: "ID Type", value: form.idType ? ID_TYPES[form.idType]?.label : "Not submitted" },
                    { label: "ID Uploaded", value: form.idUploadData ? "Yes" : "No" },
                  ].map(row => (
                    <div key={row.label} className="flex items-start justify-between px-5 py-3 gap-4">
                      <span className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground shrink-0">{row.label}</span>
                      <span className="text-sm text-right text-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-secondary/30 border border-border rounded p-4 text-xs text-muted-foreground leading-relaxed">
                  By submitting, you confirm that all information is accurate to the best of your knowledge and that any uploaded document is genuine.
                  Submitting false information or fraudulent documents will result in permanent removal from TAG.
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep("id_upload")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-display uppercase tracking-wider text-sm transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={submit} disabled={submitting}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider px-8 py-3 rounded clip-angled-sm transition-all disabled:opacity-60 shadow-[0_0_20px_hsla(var(--primary),0.3)]">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Shield className="w-4 h-4" /> Submit Application</>}
                  </button>
                </div>
              </div>
            )}

            {/* SUBMITTED ──────────────────────────────────────── */}
            {step === "submitted" && (
              <div className="text-center py-16 space-y-6">
                <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-black text-3xl uppercase tracking-wider text-foreground mb-3">Application Submitted</h2>
                  <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Your application is now in the queue. Our staff will review it and contact you via Discord.
                    {existing?.id_verification_status === "ai_verified" && " Your ID has been pre-verified by our AI system."}
                    {existing?.id_verification_status === "ai_flagged" && " Your ID has been flagged for manual review."}
                  </p>
                </div>
                {existing && (
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <StatusBadge status={existing.status} />
                    <IDVerificationBadge status={existing.id_verification_status} score={existing.ai_confidence_score} />
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </PortalLayout>
  );
}
