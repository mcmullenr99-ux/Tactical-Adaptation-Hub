import { PortalLayout } from "@/components/layout/PortalLayout";
import { useAuth } from "@/components/auth/AuthContext";
import { useGetInbox } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Mail, Clock, ShieldCheck, PenTool, CalendarDays, User, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
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

export default function Dashboard() {
  const { user } = useAuth();
  const { data: inbox } = useGetInbox();

  const { data: upcomingOps = [] } = useQuery<OpsEvent[]>({
    queryKey: ["ops-upcoming"],
    queryFn: () =>
      apiFetch("/api/events").then(r => r.json()).then((evs: OpsEvent[]) =>
        evs.filter(e => new Date(e.event_date) >= new Date()).slice(0, 3)),
    staleTime: 60_000,
  });

  const unreadCount = inbox?.filter((m: Message) => !m.isRead).length || 0;
  const recentMessages = (inbox as Message[] | undefined)?.slice(0, 3) || [];

  if (!user) return null;

  return (
    <PortalLayout>
      <div className="space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border p-8 rounded-lg clip-angled relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
          <h1 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider mb-2 relative z-10">
            Welcome, <span className="text-primary">{user.username}</span>
          </h1>
          <p className="text-muted-foreground font-sans relative z-10">
            Tactical Adaptation Group Command Center. Status:{" "}
            <span className="text-accent uppercase tracking-widest text-xs font-bold ml-1">{user.status}</span>
          </p>
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

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-secondary/40 border border-border p-6 rounded clip-angled-sm sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-background rounded flex items-center justify-center text-primary border border-border">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold uppercase tracking-widest text-sm text-muted-foreground">Enlistment Date</h3>
            </div>
            <p className="text-2xl font-display font-bold uppercase">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/portal/inbox" className="group bg-card border border-border p-6 rounded clip-angled-sm hover:border-primary/50 transition-colors flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold uppercase tracking-wider">Access Comms</h3>
                <p className="text-sm font-sans text-muted-foreground">Check your secure messages</p>
              </div>
            </Link>

            <Link href="/portal/profile" className="group bg-card border border-border p-6 rounded clip-angled-sm hover:border-primary/50 transition-colors flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold uppercase tracking-wider">My Profile</h3>
                <p className="text-sm font-sans text-muted-foreground">Edit bio and settings</p>
              </div>
            </Link>

            {user.role === "member" && (
              <Link href="/portal/apply" className="group bg-card border border-border p-6 rounded clip-angled-sm hover:border-primary/50 transition-colors flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <PenTool className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold uppercase tracking-wider">Staff Application</h3>
                  <p className="text-sm font-sans text-muted-foreground">Apply to join the TAG staff team</p>
                </div>
              </Link>
            )}
          </div>
        </div>

      </div>
    </PortalLayout>
  );
}
