import { useRef, useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { useAuth } from "@/components/auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";
import { differenceInDays, format } from "date-fns";
import {
  Shield, Share2, Loader2, Camera, Upload, Star,
  ThumbsUp, ThumbsDown, AlertTriangle, CheckCircle2,
  Activity, Heart, Zap, Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getServiceTier(createdAt: string) {
  const days = differenceInDays(new Date(), new Date(createdAt));
  if (days >= 730) return { label: "ELITE", color: "#fbbf24" };
  if (days >= 365) return { label: "VETERAN", color: "#a78bfa" };
  if (days >= 180) return { label: "OPERATOR", color: "#60a5fa" };
  if (days >= 30)  return { label: "OPERATOR", color: "#60a5fa" };
  return { label: "RECRUIT", color: "#94a3b8" };
}

const DUTY_LABELS: Record<string, string> = {
  available: "AVAILABLE", deployed: "DEPLOYED",
  "on-leave": "ON LEAVE", mia: "MIA",
  away: "AWAY", "in-op": "IN-OP", offline: "OFFLINE",
};
const DUTY_COLORS: Record<string, string> = {
  available: "#4ade80", deployed: "#facc15",
  "on-leave": "#60a5fa", mia: "#f87171",
  away: "#fb923c", "in-op": "#f43f5e", offline: "#64748b",
};

const GRADE_COLORS: Record<string, string> = {
  ELITE: "#fbbf24", TRUSTED: "#4ade80", STANDARD: "#60a5fa",
  CAUTION: "#fb923c", "HIGH RISK": "#f43f5e", BLACKLISTED: "#7f1d1d", UNRATED: "#64748b",
};

function ScoreBar({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  const pct = Math.round((value / 10) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
          <Icon className="w-3 h-3" /> {label}
        </div>
        <span className="text-[10px] font-mono text-slate-300">{value > 0 ? value.toFixed(1) : "—"}</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: value >= 8 ? "#4ade80" : value >= 6 ? "#60a5fa" : value >= 4 ? "#fb923c" : "#f87171" }}
        />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ServiceCard() {
  const { user, token } = useAuth() as any;
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>((user as any)?.avatar_url ?? null);

  // Milsim memberships
  const { data: milsimRosters } = useQuery<any[]>({
    queryKey: ["my-milsim-rosters"],
    queryFn: () => apiFetch("/api/milsim-groups/mine/all").catch(() => []),
    staleTime: 60_000,
  });

  // Reputation
  const { data: repData } = useQuery<any>({
    queryKey: ["my-reputation", user?.id],
    queryFn: () => user?.id ? apiFetch(`/api/reputation/${user.id}`).catch(() => null) : null,
    staleTime: 60_000,
    enabled: !!user?.id,
  });

  if (!user) return null;

  const tier = getServiceTier(user.createdAt);
  const daysIn = differenceInDays(new Date(), new Date(user.createdAt));
  const dutyStatus = (user as any).on_duty_status ?? "available";
  const dutyColor = DUTY_COLORS[dutyStatus] ?? DUTY_COLORS.available;

  // Unit display — primary milsim group or "Freelancer"
  const primaryUnit = milsimRosters?.[0] ?? null;
  const unitDisplay = primaryUnit?.name ?? "FREELANCER";
  const unitSub = primaryUnit ? "ACTIVE UNIT" : "INDEPENDENT OPERATOR";

  const rep = repData?.score ?? null;
  const gradeColor = rep ? (GRADE_COLORS[rep.grade] ?? "#64748b") : "#64748b";

  // Photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch<{ avatar_url: string }>("/api/auth/upload-avatar", {
        method: "POST",
        body: formData,
      });
      setAvatarUrl(res.avatar_url);
      toast({ title: "Photo updated", description: "Your service card photo has been saved." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const shareCard = async () => {
    const url = `${window.location.origin}/operator/${user.id}`;
    if (navigator.share) {
      await navigator.share({ title: `${user.username} — TAG Service Record`, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Share your service record with commanders." });
    }
  };

  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto space-y-8">

        <div>
          <h1 className="font-display font-bold text-2xl uppercase tracking-widest">Operator Service Card</h1>
          <p className="text-muted-foreground text-sm mt-1">Your official TAG service record. Publicly visible to unit commanders.</p>
        </div>

        {/* ── THE CARD ── */}
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-lg"
          style={{
            background: "linear-gradient(135deg, #0f1117 0%, #141820 50%, #0d1018 100%)",
            border: "1px solid #2a3040",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.6)",
            fontFamily: "'Rajdhani', 'Arial Narrow', sans-serif",
          }}
        >
          {/* Top colour bar — UK military green/tan */}
          <div className="h-1" style={{ background: "linear-gradient(90deg, #4a5a3a, #8a9a6a, #6b7c52, #4a5a3a)" }} />

          {/* Security pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
            backgroundSize: "8px 8px",
          }} />

          <div className="relative z-10 p-6 sm:p-8">

            {/* ── HEADER ROW ── */}
            <div className="flex items-start gap-5 mb-6">

              {/* Photo slot */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-24 h-28 sm:w-28 sm:h-32 rounded border-2 overflow-hidden flex items-center justify-center cursor-pointer group"
                  style={{ borderColor: "#3a4a5a", background: "#0a0d12" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Operator" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-600">
                      <Camera className="w-6 h-6" />
                      <span className="text-[9px] uppercase tracking-widest text-center leading-tight px-1">Add Photo</span>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingPhoto
                      ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                      : <Upload className="w-5 h-5 text-white" />
                    }
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-slate-500" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-500" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-slate-500" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-slate-500" />
              </div>

              {/* Identity block */}
              <div className="flex-1 min-w-0">
                {/* Issuer */}
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#8a9a6a" }} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "#8a9a6a" }}>
                    TACTICAL ADAPTATION GROUP
                  </span>
                </div>

                {/* Callsign */}
                <h2
                  className="text-3xl sm:text-4xl font-black uppercase leading-none mb-1 truncate"
                  style={{ color: "#e8eaed", letterSpacing: "0.08em", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
                >
                  {user.username}
                </h2>

                {/* Unit */}
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: tier.color }}>{unitDisplay}</p>
                  <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500">{unitSub}</p>
                </div>

                {/* Tier + Duty inline */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm"
                    style={{ background: `${tier.color}18`, border: `1px solid ${tier.color}40`, color: tier.color }}
                  >
                    {tier.label}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm"
                    style={{ background: `${dutyColor}18`, border: `1px solid ${dutyColor}40`, color: dutyColor }}
                  >
                    ● {DUTY_LABELS[dutyStatus] ?? dutyStatus}
                  </span>
                </div>
              </div>

              {/* Reputation grade badge — top right */}
              {rep && (
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center font-black text-lg border-2"
                    style={{ borderColor: gradeColor, background: `${gradeColor}18`, color: gradeColor }}
                  >
                    {rep.overall}
                  </div>
                  <p className="text-[8px] uppercase tracking-widest text-center" style={{ color: gradeColor }}>
                    {rep.grade}
                  </p>
                </div>
              )}
            </div>

            {/* ── DIVIDER ── */}
            <div className="h-px mb-5" style={{ background: "linear-gradient(90deg, transparent, #2a3040, #3a4a5a, #2a3040, transparent)" }} />

            {/* ── STATS ROW ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 mb-5">
              {[
                { label: "SERVICE NO.", value: `TAG-${String(user.id).slice(0, 8).toUpperCase()}` },
                { label: "ENLISTED", value: format(new Date(user.createdAt), "dd MMM yyyy").toUpperCase() },
                { label: "DAYS ACTIVE", value: daysIn.toString() },
                { label: "CLEARANCE", value: (user.role ?? "OPERATOR").toUpperCase() },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-0.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
                  <p className="text-sm font-bold text-slate-200 font-mono">{value}</p>
                </div>
              ))}
            </div>

            {/* ── REPUTATION BARS ── */}
            {rep && rep.grade !== "UNRATED" && (
              <>
                <div className="h-px mb-4" style={{ background: "#1e2530" }} />
                <div className="mb-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500 mb-3">OPERATOR ASSESSMENT</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <ScoreBar label="Activity" value={rep.activity} icon={Activity} />
                    <ScoreBar label="Attitude" value={rep.attitude} icon={Heart} />
                    <ScoreBar label="Experience" value={rep.experience} icon={Zap} />
                    <ScoreBar label="Discipline" value={rep.discipline} icon={Award} />
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-green-400">
                      <ThumbsUp className="w-3 h-3" /> <span className="font-bold">{rep.commends}</span>
                      <span className="text-slate-500">commend{rep.commends !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-red-400">
                      <ThumbsDown className="w-3 h-3" /> <span className="font-bold">{rep.flags}</span>
                      <span className="text-slate-500">flag{rep.flags !== 1 ? "s" : ""}</span>
                    </div>
                    {rep.blacklisted && (
                      <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-bold ml-auto">
                        <AlertTriangle className="w-3 h-3" /> BLACKLISTED
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* No reputation yet */}
            {(!rep || rep.grade === "UNRATED") && (
              <div className="flex items-center gap-2 text-[10px] text-slate-500 italic mb-4">
                <Star className="w-3 h-3" /> No commander assessments yet. Serve with distinction.
              </div>
            )}

            {/* ── BIO ── */}
            {user.bio && (
              <>
                <div className="h-px mb-4" style={{ background: "#1e2530" }} />
                <div className="mb-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1.5">OPERATOR NOTES</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{user.bio}</p>
                </div>
              </>
            )}

            {/* ── FOOTER ── */}
            <div className="h-px mb-4" style={{ background: "#1e2530" }} />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" style={{ color: "#8a9a6a" }} />
                <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500">VERIFIED TAG OPERATOR</span>
              </div>
              <span className="text-[9px] font-mono text-slate-600">
                {format(new Date(user.createdAt), "MM/yy").toUpperCase()} · {(user as any).nationality ?? "INT"}
              </span>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="h-0.5" style={{ background: "linear-gradient(90deg, #4a5a3a, #8a9a6a, #6b7c52, #4a5a3a)" }} />
        </div>

        {/* ── ACTIONS ── */}
        <div className="flex gap-3 items-center">
          <button
            onClick={shareCard}
            className="flex items-center gap-2 px-5 py-2.5 font-display font-bold uppercase tracking-wider text-sm rounded transition-all"
            style={{ background: "#1e2a1e", border: "1px solid #3a5a3a", color: "#4ade80" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#253525")}
            onMouseLeave={e => (e.currentTarget.style.background = "#1e2a1e")}
          >
            <Share2 className="w-4 h-4" /> Share Service File
          </button>
          <p className="text-xs text-muted-foreground">Commanders can view your public service file before enlisting you.</p>
        </div>

        {/* ── COMMANDER REVIEWS ── */}
        {repData?.reviews?.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm uppercase tracking-widest text-slate-400">Commander Assessments</h3>
            {repData.reviews.map((r: any) => (
              <div
                key={r.id}
                className="rounded-lg p-4 space-y-2"
                style={{ background: "#0f1117", border: "1px solid #1e2530" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-slate-200">{r.reviewer_username}</span>
                    {r.group_name && <span className="text-xs text-slate-500 ml-2">· {r.group_name}</span>}
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                    style={{
                      color: r.overall_vote === "commend" ? "#4ade80" : r.overall_vote === "flag" ? "#f87171" : "#94a3b8",
                      background: r.overall_vote === "commend" ? "#4ade8018" : r.overall_vote === "flag" ? "#f8717118" : "#94a3b818",
                    }}
                  >
                    {r.overall_vote === "commend" ? "✓ COMMEND" : r.overall_vote === "flag" ? "⚑ FLAG" : "— NEUTRAL"}
                  </span>
                </div>
                {r.notes && <p className="text-xs text-slate-400 italic">"{r.notes}"</p>}
                {r.blacklisted && (
                  <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold">
                    <AlertTriangle className="w-3 h-3" /> BLACKLISTED: {r.blacklist_reason ?? "No reason given"}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </PortalLayout>
  );
}
