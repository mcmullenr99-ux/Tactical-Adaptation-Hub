import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { MainLayout } from "./MainLayout";
import { useLocation, Link } from "wouter";
import {
  Mail, PenTool, LayoutDashboard, ShieldCheck, Settings,
  LogOut, Loader2, User, Shield, Terminal, Users, Menu, X, ChevronRight, ShieldAlert, Calendar, KeyRound, CreditCard,
} from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/apiFetch";

export function PortalLayout({ children, requireRole }: { children: React.ReactNode, requireRole?: string[] }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: notifCounts } = useQuery({
    queryKey: ["notification-counts"],
    queryFn: () => apiFetch("/api/notifications/counts"),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      setLocation("/portal/login");
      return;
    }
    if (requireRole && !requireRole.includes(user.role)) {
      setLocation("/portal/dashboard");
    }
  }, [isLoading, isAuthenticated, user, requireRole, setLocation]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated || !user) return null;
  if (requireRole && !requireRole.includes(user.role)) return null;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast({ title: "Disconnected", description: "Successfully logged out of the portal." });
      setLocation("/");
    } catch {
      toast({ title: "Error", description: "Failed to logout.", variant: "destructive" });
    } finally {
      setLoggingOut(false);
    }
  };

  const roleColors: Record<string, string> = {
    member: "text-muted-foreground",
    staff: "text-blue-400",
    moderator: "text-accent",
    admin: "text-destructive",
  };

  const unreadMsgs: number = (notifCounts as any)?.unreadMessages ?? 0;
  const pendingFriends: number = (notifCounts as any)?.pendingFriendRequests ?? 0;

  const navLinks = [
    { href: "/portal/dashboard", icon: <LayoutDashboard className="w-4 h-4 text-primary" />, label: "Dashboard" },
    { href: "/portal/inbox", icon: <Mail className="w-4 h-4 text-primary" />, label: "Comms", badge: unreadMsgs > 0 ? unreadMsgs : 0 },
    { href: "/portal/milsim", icon: <Shield className="w-4 h-4 text-primary" />, label: "MilSim Group" },
    { href: "/portal/friends", icon: <Users className="w-4 h-4 text-primary" />, label: "Connections", badge: pendingFriends > 0 ? pendingFriends : 0 },
    { href: "/portal/profile", icon: <User className="w-4 h-4 text-primary" />, label: "My Profile" },
    { href: "/portal/service-card", icon: <CreditCard className="w-4 h-4 text-primary" />, label: "Service Card" },
    { href: "/portal/2fa", icon: <KeyRound className="w-4 h-4 text-primary" />, label: "2FA Security" },
    { href: "/ops", icon: <Calendar className="w-4 h-4 text-primary" />, label: "Ops Calendar" },
    ...(user.role === "member"
      ? [{ href: "/portal/apply", icon: <PenTool className="w-4 h-4 text-primary" />, label: "Staff App" }]
      : []),
    ...(user.role === "moderator" || user.role === "admin"
      ? [
          { href: "/portal/mod", icon: <ShieldCheck className="w-4 h-4 text-accent" />, label: "Mod Panel", divider: true },
          { href: "/portal/command", icon: <Terminal className="w-4 h-4 text-destructive" />, label: "Command Center" },
        ]
      : []),
    ...(user.role === "admin"
      ? [
          { href: "/portal/admin", icon: <Settings className="w-4 h-4 text-destructive" />, label: "Admin Panel" },
          { href: "/portal/security", icon: <ShieldAlert className="w-4 h-4 text-red-500" />, label: "Security Protocol" },
        ]
      : []),
  ] as { href: string; icon: React.ReactNode; label: string; badge?: number; divider?: boolean }[];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-border bg-secondary/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-[30px]" />
        <div className="relative z-10">
          <h2 className="font-display font-bold text-lg uppercase tracking-widest mb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> HQ Uplink
          </h2>
          <p className="text-sm font-sans text-foreground font-medium truncate">{user.username}</p>
          <p className="text-xs font-sans text-muted-foreground truncate mb-2">{user.email}</p>
          <div className="inline-block px-2 py-1 bg-background border border-border rounded text-xs font-display font-bold uppercase tracking-widest mt-1">
            <span className={roleColors[user.role] || "text-primary"}>{user.role}</span>
          </div>
        </div>
      </div>

      <nav className="p-3 flex flex-col gap-1 flex-1 overflow-y-auto">
        {navLinks.map((link) => (
          <React.Fragment key={link.href}>
            {link.divider && <div className="my-2 border-t border-border" />}
            <Link
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded transition-colors font-display font-semibold uppercase tracking-wider text-sm ${
                location === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {link.icon}
              {link.label}
              {link.badge ? (
                <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {link.badge > 9 ? "9+" : link.badge}
                </span>
              ) : location === link.href ? (
                <ChevronRight className="w-3 h-3 ml-auto text-primary" />
              ) : null}
            </Link>
          </React.Fragment>
        ))}
      </nav>

      <div className="p-4 border-t border-border bg-secondary/20">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center justify-center gap-3 px-4 py-3 w-full rounded hover:bg-destructive hover:text-destructive-foreground transition-colors text-muted-foreground font-display font-bold uppercase tracking-wider text-sm disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          {loggingOut ? "Disconnecting..." : "Disconnect"}
        </button>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="pt-20 pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="md:hidden flex items-center justify-between py-4 mb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/20 border border-primary/50 rounded flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-display font-bold uppercase tracking-widest">{user.username}</p>
                <p className={`text-xs font-display uppercase tracking-widest ${roleColors[user.role] || "text-primary"}`}>{user.role}</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded text-sm font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="w-4 h-4" /> Menu
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <aside className="hidden md:block w-64 shrink-0">
              <div className="bg-card border border-border rounded-lg clip-angled overflow-hidden sticky top-28">
                <SidebarContent />
              </div>
            </aside>

            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border md:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-display font-bold uppercase tracking-widest text-sm">Navigation</span>
                <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-secondary rounded transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
