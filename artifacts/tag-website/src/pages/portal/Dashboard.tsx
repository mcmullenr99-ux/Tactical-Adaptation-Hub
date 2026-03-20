import { useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { useAuth } from "@/components/auth/AuthContext";
import { useGetInbox } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Clock, ShieldCheck, PenTool, CalendarDays, User, ChevronRight,
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

function getServiceBadge(createdAt: string) {
  const days = differenceInDays(new Date(), new Date(createdAt));
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
  const { data: inbox } = useGetInbox();
  const qc = useQueryClient();
  const [dutyStatus, setDutyStatus] = useState((user as any)?.on_duty_status ?? "available");
  const [showDutyMenu, setShowDutyMenu] = useState(false);

  const { data: motd } = useQuery<Motd | null>({
    queryKey: ["motd-active"],
    queryFn: () => apiFetch("/api/motd/active"),
    staleTime: 60_000,
  });

  const { data: upcomingOps = [] } = useQuery<OpsEvent[]>({
    queryKey: ["ops-upcoming"],
    queryFn: () =>
      apiFetch("/api/events").then((evs: OpsEvent[]) =>
        evs.filter(e => new Date(e.event_date) >= new Date()).slice(0, 3)),
    staleTime: 60_000,
  });

  const updateDuty = useMutation({
    mutationFn: (status: string) =>
      apiFetch("/api/duty-status", { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: (_, status) => {
      setDutyStatus(status);
      setShowDutyMenu(false);
    },
  });

  const unreadCount = inbox?.filter((m: Message) => !m.isRead).length || 0;
  const recentMessages = (inbox as Message[] | undefined)?.slice(0, 3) || [];

  if (!user) return null;

  const badge = getServiceBadge(user.createdAt);
  const anniversary = isAnniversary(user.createdAt);
  const daysIn = differenceInDays(new Date(), new Date(user.createdAt));
  const yearsIn = Math.floor(daysIn / 365);
  const dutyOption = DUTY_OPTIONS.find(d => d.value === dutyStatus) ?? DUTY_OPTIONS[0];

  return (
    <PortalLayout>
      <div className="space-y-6">

        {/* Anniversary Banner */}
        <AnimatePresence>
          {anniversary && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-4 p-4 bg-accent/10 border border-accent/40 rounded-lg"
            >
              <Star className="w-6 h-6 text-accent shrink-0" />
              <div>
                <p className="font-display font-bold uppercase tracking-widest text-accent text-sm">
                  {yearsIn > 0 ? `${yearsIn}-Year Anniversary` : "Enlistment Anniversary"}
                </p>
                <p className="text-xs text-muted-foreground font-sans">
                  Today marks {yearsIn > 0 ? `${yearsIn} year${yearsIn > 1 ? "s" : ""}` : "another year"} since you joined TAG. Thank you for your service.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MOTD / SITRAP Banner */}
        <AnimatePresence>
          {motd && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-4 p-4 bg-primary/5 border border-primary/30 rounded-lg"
            >
              <Megaphone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold uppercase tracking-widest text-primary text-xs mb-1">SITRAP — {motd.author}</p>
                <p className="text-sm text-foreground font-sans leading-relaxed whitespace-pre-wrap">{motd.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(motd.created_at), { addSuffix: true })}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border p-8 rounded-lg clip-angled relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
          <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider mb-2">
                Welcome, <span className="text-primary">{user.username}</span>
              </h1>
              <p className="text-muted-foreground font-sans">
                Tactical Adaptation Group Command Center. Status:{" "}
                <span className="text-accent uppercase tracking-widest text-xs font-bold ml-1">{user.status}</span>
              </p>
              {/* Service Badge */}
              <div className={`inline-flex items-center gap-1.5 mt-3 text-xs font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded border ${badge.color}`}>
                <span>{badge.icon}</span> {badge.label}
                <span className="font-sans font-normal text-muted-foreground ml-1">· Day {daysIn}</span>
              </div>
            </div>
            {/* On Duty Status Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowDutyMenu(v => !v)}
                className={`flex items-center gap-2 text-xs font-display font-bold uppercase tracking-widest px-3 py-2 rounded border transition-all ${dutyOption.color}`}
              >
                <Activity className="w-3.5 h-3.5" />
                {dutyOption.label}
                <ChevronRight className={`w-3 h-3 transition-transform ${showDutyMenu ? "rotate-90" : ""}`} />
              </button>
              <AnimatePresence>
                {showDutyMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden min-w-[140px]"
                  >
                    {DUTY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updateDuty.mutate(opt.value)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-display font-bold uppercase tracking-widest hover:bg-secondary/60 transition-colors ${dutyStatus === opt.value ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {dutyStatus === opt.value && <CheckCircle2 className="w-3 h-3 text-primary" />}
                        {dutyStatus !== opt.value && <span className="w-3 h-3" />}
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-secondary/40 border border-border p-6 rounded clip-angled-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-background rounded flex items-center justify-center text-primary border border-border">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold uppercase tracking-widest text-sm text-muted-foreground">Clearance</h3>
            </div>
            <p className="text-2xl font-display font-bold uppercase">{user.role}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-secondary/40 border border-border p-6 rounded clip-angled-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-background rounded flex items-center justify-center text-primary border border-border">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold uppercase tracking-widest text-sm text-muted-foreground">Comms</h3>
            </div>
            <p className="text-2xl font-display font-bold uppercase flex items-center gap-3">
              {unreadCount} <span className="text-sm text-muted-foreground tracking-normal lowercase">unread</span>
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }} className="bg-secondary/40 border border-border p-6 rounded clip-angled-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-background rounded flex items-center justify-center text-primary border border-border">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold uppercase tracking-widest text-sm text-muted-foreground">Service Rank</h3>
            </div>
            <p className="text-lg font-display font-bold uppercase">{badge.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{daysIn} days enlisted</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-secondary/40 border border-border p-6 rounded clip-angled-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-background rounded flex items-center justify-center text-primary border border-border">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold uppercase tracking-widest text-sm text-muted-foreground">Enlistment</h3>
            </div>
            <p className="text-xl font-display font-bold uppercase">
              {format(new Date(user.createdAt), "MMM dd, yyyy")}
            </p>
          </motion.div>
        </div>

        {/* Activity Feed — two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Messages */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card border border-border rounded overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <h2 className="font-display font-bold uppercase tracking-widest text-sm">Recent Comms</h2>
              </div>
              <Link href="/portal/inbox" className="text-xs text-primary hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentMessages.length === 0 ? (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">No messages yet.</div>
              ) : (
                recentMessages.map(msg => (
                  <Link key={msg.id} href={`/portal/inbox/${msg.id}`} className="flex items-start gap-3 px-6 py-4 hover:bg-secondary/30 transition-colors">
                    <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-display font-bold text-sm truncate ${!msg.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                          {!msg.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block mr-1.5 mb-0.5" />}
                          {msg.subject}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">from {msg.senderUsername}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>

          {/* Upcoming Ops */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                <h2 className="font-display font-bold uppercase tracking-widest text-sm">Upcoming Ops</h2>
              </div>
              <Link href="/ops" className="text-xs text-primary hover:underline flex items-center gap-1">
                Full Calendar <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {upcomingOps.length === 0 ? (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">No upcoming operations scheduled.</div>
              ) : (
                upcomingOps.map(op => (
                  <div key={op.id} className="flex items-start gap-3 px-6 py-4">
                    <div className="flex-shrink-0 text-center">
                      <div className="bg-primary/20 text-primary rounded px-2 py-1 min-w-[48px]">
                        <p className="text-xs font-bold font-display uppercase">{format(new Date(op.event_date), "MMM")}</p>
                        <p className="text-xl font-display font-bold leading-tight">{format(new Date(op.event_date), "d")}</p>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-sm text-foreground truncate">{op.title}</p>
                      <p className="text-xs text-muted-foreground">{op.game ?? "General"}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(op.event_date), "HH:mm")} UTC</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-display font-bold uppercase tracking-widest mb-6 border-b border-border pb-2">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/portal/inbox" className="group bg-card border border-border p-5 rounded clip-angled-sm hover:border-primary/50 transition-colors flex items-center gap-4">
              <div className="w-11 h-11 bg-secondary flex items-center justify-center rounded group-hover:bg-primary/20 group-hover:text-primary transition-colors shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold uppercase tracking-wider text-sm">Comms</h3>
                <p className="text-xs font-sans text-muted-foreground">Messages</p>
              </div>
            </Link>

            <Link href="/portal/profile" className="group bg-card border border-border p-5 rounded clip-angled-sm hover:border-primary/50 transition-colors flex items-center gap-4">
              <div className="w-11 h-11 bg-secondary flex items-center justify-center rounded group-hover:bg-primary/20 group-hover:text-primary transition-colors shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold uppercase tracking-wider text-sm">Profile</h3>
                <p className="text-xs font-sans text-muted-foreground">Edit your record</p>
              </div>
            </Link>

            <Link href="/portal/service-card" className="group bg-card border border-border p-5 rounded clip-angled-sm hover:border-primary/50 transition-colors flex items-center gap-4">
              <div className="w-11 h-11 bg-secondary flex items-center justify-center rounded group-hover:bg-primary/20 group-hover:text-primary transition-colors shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold uppercase tracking-wider text-sm">Service Card</h3>
                <p className="text-xs font-sans text-muted-foreground">Shareable record</p>
              </div>
            </Link>

            {user.role === "member" ? (
              <Link href="/portal/apply" className="group bg-card border border-border p-5 rounded clip-angled-sm hover:border-primary/50 transition-colors flex items-center gap-4">
                <div className="w-11 h-11 bg-secondary flex items-center justify-center rounded group-hover:bg-primary/20 group-hover:text-primary transition-colors shrink-0">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold uppercase tracking-wider text-sm">Apply</h3>
                  <p className="text-xs font-sans text-muted-foreground">Staff application</p>
                </div>
              </Link>
            ) : (
              <Link href="/portal/milsim" className="group bg-card border border-border p-5 rounded clip-angled-sm hover:border-primary/50 transition-colors flex items-center gap-4">
                <div className="w-11 h-11 bg-secondary flex items-center justify-center rounded group-hover:bg-primary/20 group-hover:text-primary transition-colors shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold uppercase tracking-wider text-sm">MilSim</h3>
                  <p className="text-xs font-sans text-muted-foreground">Manage your unit</p>
                </div>
              </Link>
            )}
          </div>
        </div>

      </div>
    </PortalLayout>
  );
}
