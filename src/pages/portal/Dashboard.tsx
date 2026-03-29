import { useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { useAuth } from "@/components/auth/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Clock, ShieldCheck, Shield, PenTool, CalendarDays, User, Users, ChevronRight, MailWarning, RefreshCw,
  Megaphone, Star, Activity, AlertTriangle, CheckCircle2, CreditCard
} from "lucide-react";
import { Link } from "wouter";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";

interface OpsEvent {
  id: number; title: string; game: string | null;
  event_date: string; end_date: string | null;
  description: string | null; status: string;
}
interface Message {
  id: number; subject: string; senderUsername: string;
  isRead: boolean; createdAt: string;
}
interface Motd {
  id: number; content: string; author: string; created_at: string;
}

const DUTY_OPTIONS = [
  { value: "available", label: "Available", color: "text-green-400 border-green-500/40 bg-green-500/10" },
  { value: "deployed", label: "Deployed", color: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10" },
  { value: "on-leave", label: "On Leave", color: "text-blue-400 border-blue-500/40 bg-blue-500/10" },
  { value: "mia", label: "MIA", color: "text-red-400 border-red-500/40 bg-red-500/10" },
];

function getServiceBadge(createdAt: string | null | undefined) {
  if (!createdAt) return { label: "Recruit", icon: "●", color: "text-muted-foreground" };
  const _d = new Date(createdAt);
  if (isNaN(_d.getTime())) return { label: "Recruit", icon: "●", color: "text-muted-foreground" };
  const days = differenceInDays(new Date(), _d);
  if (days >= 730) return { label: "2-Year Elite", icon: "★★", color: "text-accent border-accent/40 bg-accent/10" };
  if (days >= 365) return { label: "1-Year Veteran", icon: "★", color: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10" };
  if (days >= 180) return { label: "6-Month Operator", icon: "◆", color: "text-blue-400 border-blue-500/40 bg-blue-500/10" };
  if (days >= 30) return { label: "30-Day Operator", icon: "▲", color: "text-primary border-primary/40 bg-primary/10" };
  return { label: "Recruit", icon: "●", color: "text-muted-foreground border-border bg-secondary/40" };
}

function isAnniversary(createdAt: string) {
  const joined = new Date(createdAt);
  const now = new Date();
  return (
    joined.getMonth() === now.getMonth() &&
    joined.getDate() === now.getDate() &&
    joined.getFullYear() < now.getFullYear()
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: inbox } = useQuery<Message[]>({
    queryKey: ["inbox"],
    queryFn: () => apiFetch("/api/messages/inbox"),
  });
  const qc = useQueryClient();
  const dutyStatus = (user as any)?.on_duty_status ?? "available";

  const { data: upcomingOps } = useQuery<OpsEvent[]>({
    queryKey: ["ops-upcoming"],
    queryFn: () => apiFetch("/api/ops?status=upcoming&limit=3"),
  });

  const { data: motd } = useQuery<Motd>({
    queryKey: ["motd-latest"],
    queryFn: () => apiFetch("/api/motd/latest"),
  });


  const unread = inbox?.filter(m => !m.isRead).length ?? 0;
  const badge = user?.created_at ? getServiceBadge(user.created_at) : null;
  const anniversary = user?.created_at ? isAnniversary(user.created_at) : false;
  const currentDuty = DUTY_OPTIONS.find(d => d.value === dutyStatus) ?? DUTY_OPTIONS[0];

  // Email verification banner state
  const isUnverified = user && (user as any).email_verified === false;
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const { token } = useAuth() as any;

  const handleResendVerification = async () => {
    setResendState("sending");
    try {
      await apiFetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      setResendState("sent");
    } catch {
      setResendState("error");
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-foreground">
              Operator Dashboard
            </h1>
            <p className="text-muted-foreground font-sans mt-1">
              Welcome back, <span className="text-primary font-bold">{user?.username}</span>
            </p>
          </div>
          {badge && (
            <div className={`px-3 py-1.5 border rounded text-xs font-display font-bold uppercase tracking-widest ${badge.color}`}>
              {badge.icon} {badge.label}
            </div>
          )}
        </div>

        {/* Email Verification Banner */}
        {isUnverified && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <MailWarning className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-display font-bold uppercase tracking-widest text-yellow-300 text-xs mb-0.5">Email Not Verified</p>
              <p className="text-yellow-200/70 font-sans text-xs">Please verify your email address to unlock full access including roster applications. Check your inbox for a verification link.</p>
            </div>
            <div className="flex-shrink-0">
              {resendState === "idle" && (
                <button onClick={handleResendVerification} className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 font-display font-bold uppercase tracking-widest text-xs rounded hover:bg-yellow-500/30 transition-colors flex items-center gap-2">
                  <RefreshCw className="w-3 h-3" /> Resend Link
                </button>
              )}
              {resendState === "sending" && <span className="text-yellow-300 text-xs font-display uppercase tracking-widest">Sending...</span>}
              {resendState === "sent" && <span className="text-green-400 text-xs font-display uppercase tracking-widest">✓ Email sent</span>}
              {resendState === "error" && <span className="text-destructive text-xs font-sans">Failed — try again later</span>}
            </div>
          </div>
        )}

        {/* Anniversary Banner */}
        {anniversary && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center gap-3">
            <Star className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="font-display font-bold uppercase tracking-widest text-primary text-sm">
              Happy Anniversary, {user?.username}! Another year of service.
            </p>
          </div>
        )}

        {/* MOTD */}
        {motd && (
          <div className="bg-secondary/50 border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="w-4 h-4 text-primary" />
              <span className="font-display font-bold uppercase tracking-widest text-xs text-muted-foreground">
                SITREP / MOTD
              </span>
            </div>
            <p className="font-sans text-foreground whitespace-pre-wrap text-sm leading-relaxed">{motd.content}</p>
            <p className="text-xs text-muted-foreground mt-3 font-display uppercase tracking-widest">
              — {motd.author} · {motd.created_at && !isNaN(new Date(motd.created_at).getTime()) ? format(new Date(motd.created_at), "MMM dd, yyyy") : "—"}
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Unread Comms", value: unread, icon: <Mail className="w-5 h-5" />, color: unread > 0 ? "text-primary" : "text-muted-foreground", href: "/portal/comms" },
            { label: "Role", value: user?.role ?? "—", icon: <ShieldCheck className="w-5 h-5" />, color: "text-accent", href: "/portal/profile" },
            { label: "Upcoming Ops", value: upcomingOps?.length ?? 0, icon: <CalendarDays className="w-5 h-5" />, color: "text-blue-400", href: "/ops" },
            { label: "Member Since", value: user?.created_at ? format(new Date(user.created_at), "MMM yyyy") : "—", icon: <Clock className="w-5 h-5" />, color: "text-muted-foreground", href: "/portal/profile" },
          ].map(stat => (
            <Link key={stat.label} href={stat.href}>
              <div className="bg-card border border-border rounded clip-angled-sm p-4 hover:border-primary/40 transition-colors cursor-pointer">
                <div className={`mb-2 ${stat.color}`}>{stat.icon}</div>
                <p className="text-xl font-display font-bold text-foreground capitalize">{stat.value}</p>
                <p className="text-xs font-display uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Duty Status — auto-computed from activity */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold uppercase tracking-widest text-sm text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" /> Duty Status
            </h2>
          </div>
          <div className={`flex items-center gap-3 px-4 py-3 border rounded font-display font-bold uppercase tracking-widest text-sm ${currentDuty.color}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            {currentDuty.label}
          </div>
          <p className="text-xs text-muted-foreground font-sans mt-2">Auto-updated based on your activity.</p>
        </div>

        {/* Upcoming Ops */}
        {upcomingOps && upcomingOps.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="font-display font-bold uppercase tracking-widest text-sm text-muted-foreground flex items-center gap-2 mb-4">
              <CalendarDays className="w-4 h-4" /> Upcoming Operations
            </h2>
            <div className="space-y-3">
              {upcomingOps.map(op => (
                <div key={op.id} className="flex items-center gap-4 p-3 bg-secondary/40 border border-border rounded hover:border-primary/30 transition-colors">
                  <div className="text-center min-w-[48px]">
                    <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
                      {op.event_date && !isNaN(new Date(op.event_date).getTime()) ? format(new Date(op.event_date), "MMM") : "—"}
                    </p>
                    <p className="text-2xl font-display font-bold text-primary leading-none">
                      {op.event_date && !isNaN(new Date(op.event_date).getTime()) ? format(new Date(op.event_date), "dd") : "—"}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold uppercase tracking-wide text-sm text-foreground truncate">{op.title}</p>
                    {op.game && <p className="text-xs text-muted-foreground font-sans truncate">{op.game}</p>}
                  </div>
                  <p className="text-xs text-muted-foreground font-sans flex-shrink-0">
                    {op.event_date && !isNaN(new Date(op.event_date).getTime()) ? formatDistanceToNow(new Date(op.event_date), { addSuffix: true }) : "—"}
                  </p>
                </div>
              ))}
            </div>
            <Link href="/ops" className="flex items-center gap-1 mt-4 text-xs font-display font-bold uppercase tracking-widest text-primary hover:text-accent transition-colors">
              View All Operations <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="font-display font-bold uppercase tracking-widest text-sm text-muted-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/portal/comms?section=compose", icon: <PenTool className="w-5 h-5" />, label: "New Dispatch" },
              { href: "/portal/profile", icon: <User className="w-5 h-5" />, label: "Edit Profile" },
              { href: "/portal/service-card", icon: <CreditCard className="w-5 h-5" />, label: "Service Card" },
              { href: "/portal/comms", icon: <Mail className="w-5 h-5" />, label: "Comms & Connections" },
              { href: "/portal/comms?section=connections", icon: <Users className="w-5 h-5" />, label: "Connections" },
            ].map(action => (
              <Link key={action.href} href={action.href}>
                <div className="flex flex-col items-center gap-2 p-4 bg-secondary/40 border border-border rounded hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer text-center">
                  <span className="text-primary">{action.icon}</span>
                  <span className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </PortalLayout>
  );
}
