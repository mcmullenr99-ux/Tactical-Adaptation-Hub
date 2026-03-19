import { PortalLayout } from "@/components/layout/PortalLayout";
import { useAuth } from "@/components/auth/AuthContext";
import { useGetInbox } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Mail, Clock, ShieldCheck, PenTool } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: inbox } = useGetInbox();
  
  const unreadCount = inbox?.filter(m => !m.isRead).length || 0;
  
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
            Tactical Adaptation Group Command Center. Status: <span className="text-accent uppercase tracking-widest text-xs font-bold ml-1">{user.status}</span>
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

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-display font-bold uppercase tracking-widest mb-6 border-b border-border pb-2">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/portal/inbox" className="group bg-card border border-border p-6 rounded clip-angled-sm hover:border-primary/50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold uppercase tracking-wider">Access Comms</h3>
                  <p className="text-sm font-sans text-muted-foreground">Check your secure messages</p>
                </div>
              </div>
            </Link>

            {user.role === 'member' && (
              <Link href="/portal/apply" className="group bg-card border border-border p-6 rounded clip-angled-sm hover:border-primary/50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    <PenTool className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold uppercase tracking-wider">Staff Application</h3>
                    <p className="text-sm font-sans text-muted-foreground">Apply to join the TAG staff team</p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>

      </div>
    </PortalLayout>
  );
}
