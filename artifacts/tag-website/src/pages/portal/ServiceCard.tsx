import { useRef } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { useAuth } from "@/components/auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";
import { differenceInDays, format } from "date-fns";
import { Shield, Download, Share2, Loader2 } from "lucide-react";

function getServiceBadge(createdAt: string) {
  const days = differenceInDays(new Date(), new Date(createdAt));
  if (days >= 730) return { label: "2-Year Elite", icon: "★★", tier: "ELITE" };
  if (days >= 365) return { label: "1-Year Veteran", icon: "★", tier: "VETERAN" };
  if (days >= 180) return { label: "6-Month Operator", icon: "◆", tier: "OPERATOR" };
  if (days >= 30) return { label: "30-Day Operator", icon: "▲", tier: "OPERATOR" };
  return { label: "Recruit", icon: "●", tier: "RECRUIT" };
}

const DUTY_LABELS: Record<string, string> = {
  available: "AVAILABLE",
  deployed: "DEPLOYED",
  "on-leave": "ON LEAVE",
  mia: "MIA",
};

const DUTY_COLORS: Record<string, string> = {
  available: "#4ade80",
  deployed: "#facc15",
  "on-leave": "#60a5fa",
  mia: "#f87171",
};

export default function ServiceCard() {
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);

  const { data: milsimGroups } = useQuery<any[]>({
    queryKey: ["my-milsim-groups"],
    queryFn: () => apiFetch("/api/milsim-groups/mine/all").catch(() => []),
    staleTime: 60_000,
  });

  const { data: awards } = useQuery<any[]>({
    queryKey: ["my-awards-count"],
    queryFn: () => apiFetch("/api/milsim-groups/mine/awards-summary").catch(() => []),
    staleTime: 60_000,
  });

  if (!user) return null;

  const badge = getServiceBadge(user.createdAt);
  const daysIn = differenceInDays(new Date(), new Date(user.createdAt));
  const dutyStatus = (user as any).on_duty_status ?? "available";
  const dutyColor = DUTY_COLORS[dutyStatus] ?? DUTY_COLORS.available;

  const shareCard = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${user.username} — TAG Service Record`,
        text: `${user.username} has served ${daysIn} days in the Tactical Adaptation Group.`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto space-y-8">

        <div>
          <h1 className="font-display font-bold text-2xl uppercase tracking-widest">Operator Service Card</h1>
          <p className="text-muted-foreground text-sm mt-1">Your official TAG service record. Share it with pride.</p>
        </div>

        {/* The Card */}
        <div ref={cardRef} className="relative overflow-hidden bg-[#0a0e0d] border-2 border-primary/60 rounded-xl" style={{ fontFamily: "'Rajdhani', monospace" }}>
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary w-full" />

          {/* Corner decorations */}
          <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-primary/40 rounded-tr-lg" />
          <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-primary/40 rounded-bl-lg" />

          {/* Background texture */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(45deg, #00ff41 0, #00ff41 1px, transparent 0, transparent 50%)", backgroundSize: "12px 12px" }} />

          <div className="relative z-10 p-8 space-y-6">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/70 mb-1">TACTICAL ADAPTATION GROUP</p>
                <h2 className="text-3xl font-black uppercase tracking-widest text-white leading-none">{user.username}</h2>
                <p className="text-sm text-primary/80 uppercase tracking-widest mt-1 font-bold">{user.role}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <p className="text-[10px] text-primary/60 uppercase tracking-widest">TAG OPERATOR</p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-[0.25em] text-primary/60 font-bold">Enlisted</p>
                <p className="text-sm font-bold text-white">{format(new Date(user.createdAt), "dd MMM yyyy").toUpperCase()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-[0.25em] text-primary/60 font-bold">Days Active</p>
                <p className="text-sm font-bold text-white">{daysIn}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-[0.25em] text-primary/60 font-bold">Service Tier</p>
                <p className="text-sm font-bold text-primary">{badge.tier}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-[0.25em] text-primary/60 font-bold">Duty Status</p>
                <p className="text-sm font-bold" style={{ color: dutyColor }}>{DUTY_LABELS[dutyStatus]}</p>
              </div>
            </div>

            {/* Badge Row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded text-xs font-bold text-primary uppercase tracking-widest">
                <span className="text-base">{badge.icon}</span> {badge.label}
              </div>
              {(user as any).nationality && (
                <div className="px-3 py-1.5 bg-secondary/40 border border-white/10 rounded text-xs font-bold text-white/70 uppercase tracking-widest">
                  {(user as any).nationality}
                </div>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-bold mb-1">Operator Bio</p>
                <p className="text-xs text-white/80 font-sans leading-relaxed">{user.bio}</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">Verified TAG Member</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-mono">TAG-{String(user.id).padStart(6, "0")}</p>
            </div>
          </div>

          {/* Bottom accent */}
          <div className="h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={shareCard}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm rounded transition-all"
          >
            <Share2 className="w-4 h-4" /> Share Card
          </button>
          <p className="text-xs text-muted-foreground font-sans self-center">Your card automatically reflects your latest stats and status.</p>
        </div>

      </div>
    </PortalLayout>
  );
}
