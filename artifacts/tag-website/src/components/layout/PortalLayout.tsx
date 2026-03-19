import React, { useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { MainLayout } from "./MainLayout";
import { useLocation, Link } from "wouter";
import { Mail, PenTool, LayoutDashboard, ShieldCheck, Settings, LogOut, Loader2, User, Shield, Terminal } from "lucide-react";
import { useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function PortalLayout({ children, requireRole }: { children: React.ReactNode, requireRole?: string[] }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (requireRole && !requireRole.includes(user.role)) {
    return null;
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Disconnected", description: "Successfully logged out of the portal." });
        setLocation("/");
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to logout.", variant: "destructive" });
      }
    });
  };

  const roleColors: Record<string, string> = {
    member: "text-muted-foreground",
    staff: "text-blue-400",
    moderator: "text-accent",
    admin: "text-destructive",
  };

  return (
    <MainLayout>
      <div className="pt-24 pb-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Sidebar */}
            <aside className="w-full md:w-64 shrink-0">
              <div className="bg-card border border-border rounded-lg clip-angled overflow-hidden sticky top-28">
                
                {/* User Info Header */}
                <div className="p-6 border-b border-border bg-secondary/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-[30px]" />
                  <div className="relative z-10">
                    <h2 className="font-display font-bold text-lg uppercase tracking-widest mb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" /> HQ Uplink
                    </h2>
                    <p className="text-sm font-sans text-foreground font-medium truncate">{user.username}</p>
                    <p className="text-xs font-sans text-muted-foreground truncate mb-2">{user.email}</p>
                    <div className="inline-block px-2 py-1 bg-background border border-border rounded text-xs font-display font-bold uppercase tracking-widest mt-1">
                      <span className={roleColors[user.role] || "text-primary"}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Navigation */}
                <nav className="p-4 flex flex-col gap-1">
                  <Link href="/portal/dashboard" className="flex items-center gap-3 px-4 py-3 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground font-display font-semibold uppercase tracking-wider text-sm">
                    <LayoutDashboard className="w-4 h-4 text-primary" /> Dashboard
                  </Link>
                  <Link href="/portal/inbox" className="flex items-center gap-3 px-4 py-3 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground font-display font-semibold uppercase tracking-wider text-sm">
                    <Mail className="w-4 h-4 text-primary" /> Comms
                  </Link>
                  <Link href="/portal/milsim" className="flex items-center gap-3 px-4 py-3 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground font-display font-semibold uppercase tracking-wider text-sm">
                    <Shield className="w-4 h-4 text-primary" /> MilSim Group
                  </Link>
                  
                  {user.role === 'member' && (
                    <Link href="/portal/apply" className="flex items-center gap-3 px-4 py-3 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground font-display font-semibold uppercase tracking-wider text-sm">
                      <PenTool className="w-4 h-4 text-primary" /> Staff App
                    </Link>
                  )}
                  
                  {(user.role === 'moderator' || user.role === 'admin') && (
                    <>
                      <div className="my-2 border-t border-border" />
                      <Link href="/portal/mod" className="flex items-center gap-3 px-4 py-3 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground font-display font-semibold uppercase tracking-wider text-sm">
                        <ShieldCheck className="w-4 h-4 text-accent" /> Mod Panel
                      </Link>
                    </>
                  )}
                  
                  {user.role === 'admin' && (
                    <>
                      <Link href="/portal/admin" className="flex items-center gap-3 px-4 py-3 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground font-display font-semibold uppercase tracking-wider text-sm">
                        <Settings className="w-4 h-4 text-destructive" /> Admin Panel
                      </Link>
                      <Link href="/portal/command" className="flex items-center gap-3 px-4 py-3 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground font-display font-semibold uppercase tracking-wider text-sm">
                        <Terminal className="w-4 h-4 text-destructive" /> Command Center
                      </Link>
                    </>
                  )}
                </nav>

                <div className="p-4 border-t border-border bg-secondary/20">
                  <button 
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="flex items-center justify-center gap-3 px-4 py-3 w-full rounded hover:bg-destructive hover:text-destructive-foreground transition-colors text-muted-foreground font-display font-bold uppercase tracking-wider text-sm disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" /> 
                    {logoutMutation.isPending ? "Disconnecting..." : "Disconnect"}
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1">
              {children}
            </main>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
