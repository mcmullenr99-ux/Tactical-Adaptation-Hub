import { useRef, useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { useAuth } from "@/components/auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";
import { differenceInDays, format } from "date-fns";
import {
  Shield, Share2, Loader2, Camera, Upload,
  ThumbsUp, ThumbsDown, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getServiceTier(createdAt: string | null | undefined) {
  if (!createdAt) return "RECRUIT";
  try {
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return "RECRUIT";
    const days = differenceInDays(new Date(), d);
    if (days >= 730) return "ELITE";
    if (days >= 365) return "VETERAN";
    if (days >= 180) return "OPERATOR";
    if (days >= 30)  return "OPERATOR";
    return "RECRUIT";
  } catch { return "RECRUIT"; }
}

const DUTY_LABELS: Record<string, string> = {
  available: "AVAILABLE", deployed: "DEPLOYED",
  "on-leave": "ON LEAVE", mia: "MIA",
  away: "AWAY", "in-op": "IN-OP", offline: "OFFLINE",
};

// Score bar — monochrome
function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = value > 0 ? Math.round((value / 10) * 100) : 0;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[8px] uppercase tracking-[0.2em] font-bold" style={{ color: "#6b7280" }}>{label}</span>
        <span className="text-[8px] font-mono" style={{ color: "#9ca3af" }}>{value > 0 ? value.toFixed(1) : "—"}</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "#1f2937" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #4b5563, #9ca3af)" }}
        />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ServiceCard() {
  const { user } = useAuth() as any;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>((user as any)?.avatar_url ?? null);

  const { data: primaryUnit } = useQuery<any>({
    queryKey: ["my-milsim-group"],
    queryFn: () => apiFetch("/milsimGroups?path=mine/all").catch(() => null),
    staleTime: 60_000,
  });

  const { data: repData } = useQuery<any>({
    queryKey: ["my-reputation", user?.id],
    queryFn: () => user?.id ? apiFetch(`/reputation?path=${user.id}`).catch(() => null) : null,
    staleTime: 60_000,
    enabled: !!user?.id,
  });

  if (!user) return null;

  const tier = getServiceTier(user.createdAt ?? user.created_at);
  const _createdAt = user.createdAt ?? user.created_at ?? null;
  const daysIn = _createdAt && !isNaN(new Date(_createdAt).getTime()) ? differenceInDays(new Date(), new Date(_createdAt)) : 0;
  const weeklyActiveDays: number = (user as any).weekly_active_days ?? 0;
  const dutyStatus = (user as any).on_duty_status ?? "available";

  const unitDisplay = primaryUnit?.name ?? (primaryUnit === null ? "FREELANCER" : "LOADING...");
  const unitSub = primaryUnit?.name ? "ACTIVE UNIT" : "INDEPENDENT OPERATOR";


  const rep = repData?.score ?? null;
  const hasRep = rep && rep.grade !== "UNRATED";

  // Grade → monochrome descriptor
  const gradeLabel = rep?.grade ?? "UNRATED";

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
      const res = await apiFetch<{ avatar_url: string }>("/authUpdateProfile?path=upload-avatar", {
        method: "POST",
        body: formData,
      });
      setAvatarUrl(res.avatar_url);
      toast({ title: "Photo updated" });
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
          className="relative overflow-hidden rounded select-none"
          style={{
            background: "linear-gradient(160deg, #111318 0%, #0d1014 60%, #0a0c10 100%)",
            border: "1px solid #2a2f3a",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 24px 64px rgba(0,0,0,0.7)",
            fontFamily: "'Rajdhani', 'Arial Narrow', sans-serif",
          }}
        >
          {/* Top stripe — olive drab monochrome */}
          <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #3a3f30, #6b7260, #8a9078, #6b7260, #3a3f30)" }} />

          {/* Security guilloche background */}
          <div className="absolute inset-0 pointer-events-none" style={{
            opacity: 0.025,
            backgroundImage: "repeating-linear-gradient(30deg, #fff 0, #fff 1px, transparent 0, transparent 8px), repeating-linear-gradient(-30deg, #fff 0, #fff 1px, transparent 0, transparent 8px)",
            backgroundSize: "16px 16px",
          }} />

          <div className="relative z-10 p-6 sm:p-7">

            {/* ── ROW 1: PHOTO + IDENTITY + REP SCORE ── */}
            <div className="flex gap-5 mb-5">

              {/* Photo */}
              <div
                className="relative flex-shrink-0 cursor-pointer group"
                style={{ width: 88, height: 108 }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div
                  className="w-full h-full overflow-hidden flex items-center justify-center"
                  style={{ background: "#0a0c10", border: "1px solid #2a2f3a" }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Operator" className="w-full h-full object-cover grayscale" />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5" style={{ color: "#374151" }}>
                      <Camera className="w-5 h-5" />
                      <span className="text-[8px] uppercase tracking-widest text-center leading-tight px-1">Photo</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingPhoto
                      ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                      : <Upload className="w-4 h-4 text-white" />
                    }
                  </div>
                </div>
                {/* Corner ticks */}
                {[["top-0 left-0", "border-t border-l"], ["top-0 right-0", "border-t border-r"],
                  ["bottom-0 left-0", "border-b border-l"], ["bottom-0 right-0", "border-b border-r"]].map(([pos, borders], i) => (
                  <div key={i} className={`absolute ${pos} w-2.5 h-2.5 ${borders}`} style={{ borderColor: "#4b5563" }} />
                ))}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">

                <div>
                  {/* Issuer line */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Shield className="w-2.5 h-2.5 flex-shrink-0" style={{ color: "#6b7260" }} />
                    <span className="text-[8px] font-bold uppercase tracking-[0.35em]" style={{ color: "#6b7260" }}>
                      TACTICAL ADAPTATION GROUP
                    </span>
                  </div>

                  {/* Callsign */}
                  <h2
                    className="font-black uppercase leading-none mb-1.5 truncate"
                    style={{
                      fontSize: "clamp(1.4rem, 5vw, 2.2rem)",
                      color: "#e5e7eb",
                      letterSpacing: "0.07em",
                      textShadow: "0 2px 12px rgba(0,0,0,0.6)",
                    }}
                  >
                    {user.username}
                  </h2>

                  {/* Unit */}
                  <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: "#9ca3af" }}>
                    {unitDisplay}
                  </p>
                  <p className="text-[8px] uppercase tracking-[0.2em]" style={{ color: "#4b5563" }}>{unitSub}</p>
                </div>

                {/* Tier + Duty pills */}
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  {[tier, DUTY_LABELS[dutyStatus] ?? dutyStatus].map((label) => (
                    <span
                      key={label}
                      className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5"
                      style={{
                        background: "#1a1f28",
                        border: "1px solid #2a2f3a",
                        color: "#9ca3af",
                        letterSpacing: "0.15em",
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rep Score badge — top right */}
              <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-1">
                <div
                  className="flex flex-col items-center justify-center"
                  style={{
                    width: 56, height: 56,
                    border: "1px solid #374151",
                    background: "#0d1014",
                  }}
                >
                  <span
                    className="font-black leading-none"
                    style={{ fontSize: "1.4rem", color: gradeLabel === "BLACKLISTED" ? "#ef4444" : "#e5e7eb" }}
                  >
                    {hasRep ? rep.overall : "—"}
                  </span>
                </div>
                <span
                  className="text-[7px] font-bold uppercase tracking-widest text-center"
                  style={{ color: gradeLabel === "BLACKLISTED" ? "#ef4444" : "#4b5563", maxWidth: 64 }}
                >
                  {gradeLabel}
                </span>
              </div>
            </div>

            {/* ── DIVIDER ── */}
            <div className="mb-5" style={{ borderTop: "1px solid #1f2937" }} />

            {/* ── ROW 2: STATS ── */}
            <div className="grid grid-cols-4 gap-4 mb-5">
              {[
                { label: "SERVICE NO.", value: user?.id ? `TAG-${String(user.id).replace(/-/g,"").slice(0, 8).toUpperCase()}` : "TAG-UNKNOWN" },
                { label: "ENLISTED",    value: _createdAt && !isNaN(new Date(_createdAt).getTime()) ? format(new Date(_createdAt), "dd MMM yyyy").toUpperCase() : "UNKNOWN" },
                { label: "DAYS/WK ACTIVE", value: `${weeklyActiveDays}/7` },
                { label: "CLEARANCE",   value: (user.role ?? "OPERATOR").toUpperCase() },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[8px] font-bold uppercase tracking-[0.2em] mb-0.5" style={{ color: "#4b5563" }}>{label}</p>
                  <p className="text-sm font-bold font-mono" style={{ color: "#d1d5db" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* ── ROW 3: REPUTATION ASSESSMENT (if rated) ── */}
            {hasRep && (
              <>
                <div className="mb-4" style={{ borderTop: "1px solid #1f2937" }} />
                <div className="mb-4">
                  <p className="text-[8px] font-bold uppercase tracking-[0.25em] mb-3" style={{ color: "#4b5563" }}>
                    COMMANDER ASSESSMENT
                  </p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
                    <ScoreBar label="Activity"   value={rep.activity} />
                    <ScoreBar label="Attitude"   value={rep.attitude} />
                    <ScoreBar label="Experience" value={rep.experience} />
                    <ScoreBar label="Discipline" value={rep.discipline} />
                  </div>
                  <div className="flex items-center gap-5 mt-3">
                    <div className="flex items-center gap-1.5" style={{ color: "#6b7280" }}>
                      <ThumbsUp className="w-2.5 h-2.5" />
                      <span className="text-[9px] font-bold">{rep.commends} COMMEND{rep.commends !== 1 ? "S" : ""}</span>
                    </div>
                    <div className="flex items-center gap-1.5" style={{ color: "#6b7280" }}>
                      <ThumbsDown className="w-2.5 h-2.5" />
                      <span className="text-[9px] font-bold">{rep.flags} FLAG{rep.flags !== 1 ? "S" : ""}</span>
                    </div>
                    {rep.blacklisted && (
                      <div className="flex items-center gap-1.5 ml-auto" style={{ color: "#ef4444" }}>
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">BLACKLISTED</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* No rep yet — inline, subdued */}
            {!hasRep && (
              <div className="mb-4 p-3" style={{ background: "#0d1014", border: "1px dashed #1f2937" }}>
                <p className="text-[9px] italic" style={{ color: "#374151" }}>
                  [ NO COMMANDER ASSESSMENTS ON FILE ]
                </p>
                <p className="text-[8px] mt-0.5" style={{ color: "#2d3748" }}>
                  Reputation data is submitted by unit commanders after serving together.
                </p>
              </div>
            )}

            {/* ── BIO ── */}
            <div className="mb-3" style={{ borderTop: "1px solid #1f2937" }} />
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "#4b5563" }}>OPERATOR NOTES</p>
            {user.bio
              ? <p className="text-xs leading-relaxed mb-3" style={{ color: "#6b7280" }}>{user.bio}</p>
              : <p className="text-[9px] italic mb-3" style={{ color: "#374151" }}>[ No operator notes on file. Update your profile to add a bio. ]</p>
            }

            {/* ── FOOTER ── */}
            <div className="mb-3" style={{ borderTop: "1px solid #1a1f28" }} />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-2.5 h-2.5" style={{ color: "#4b5563" }} />
                <span className="text-[8px] uppercase tracking-[0.25em] font-bold" style={{ color: "#374151" }}>
                  VERIFIED TAG OPERATOR
                </span>
              </div>
              <span className="text-[8px] font-mono" style={{ color: "#374151" }}>
                {_createdAt && !isNaN(new Date(_createdAt).getTime()) ? format(new Date(_createdAt), "MM/yy") : "—"} · {(user as any).nationality ?? "INT"}
              </span>
            </div>
          </div>

          {/* Bottom stripe */}
          <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #3a3f30, #6b7260, #8a9078, #6b7260, #3a3f30)" }} />
        </div>

        {/* ── SHARE ── */}
        <div className="flex gap-3 items-center">
          <button
            onClick={shareCard}
            className="flex items-center gap-2 px-5 py-2.5 font-display font-bold uppercase tracking-wider text-sm rounded-none transition-all"
            style={{ background: "#111318", border: "1px solid #374151", color: "#9ca3af" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#6b7280"; e.currentTarget.style.color = "#e5e7eb"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#374151"; e.currentTarget.style.color = "#9ca3af"; }}
          >
            <Share2 className="w-4 h-4" /> Share Service File
          </button>
          <p className="text-xs" style={{ color: "#4b5563" }}>
            Commanders can view your public service file before enlisting you.
          </p>
        </div>

        {/* ── COMMANDER REVIEWS LIST ── */}
        {(repData?.reviews?.length ?? 0) > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.25em]" style={{ color: "#4b5563" }}>
              FIELD ASSESSMENTS
            </p>
            {(repData?.reviews ?? []).map((r: any) => (
              <div
                key={r.id}
                className="p-3 space-y-1.5"
                style={{ background: "#0d1014", border: "1px solid #1f2937" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold" style={{ color: "#d1d5db" }}>{r.reviewer_username}</span>
                    {r.group_name && <span className="text-[10px] ml-2" style={{ color: "#4b5563" }}>· {r.group_name}</span>}
                  </div>
                  <span
                    className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5"
                    style={{
                      color: r.overall_vote === "commend" ? "#9ca3af" : r.overall_vote === "flag" ? "#9ca3af" : "#4b5563",
                      border: "1px solid #2a2f3a",
                      background: "#111318",
                    }}
                  >
                    {r.overall_vote === "commend" ? "✓ COMMEND" : r.overall_vote === "flag" ? "⚑ FLAG" : "— NEUTRAL"}
                  </span>
                </div>
                {r.notes && (
                  <p className="text-[10px] italic" style={{ color: "#4b5563" }}>"{r.notes}"</p>
                )}
                {r.blacklisted && (
                  <div className="flex items-center gap-1.5 text-[9px] font-bold" style={{ color: "#ef4444" }}>
                    <AlertTriangle className="w-2.5 h-2.5" /> BLACKLISTED — {r.blacklist_reason ?? "No reason given"}
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
