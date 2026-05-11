import { useState, useEffect, useRef } from "react";
import { TagLogo } from "@/components/TagLogo";
import { Link, useLocation } from "wouter";
import { Menu, X, Sun, Moon, Bell, CheckCheck, Trash2, ExternalLink, CheckCircle2, XCircle, MessageSquare, Users, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const NOTIF_URL = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/notifications";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/milsim", label: "Community" },
  { href: "/join", label: "Join" },
  { href: "/donate", label: "Donate" },
  { href: "/commander-pro", label: "Pro", crown: true },
];
const VETERANS_LINK = { href: "/veterans", label: "Veterans" };

const NOTIF_ICONS: Record<string, any> = {
  application_accepted: CheckCircle2,
  application_rejected: XCircle,
  message: MessageSquare,
  friend_request: Users,
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NotificationDrawer({ token, onClose }: { token: string; onClose: () => void }) {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    fetch(`${NOTIF_URL}?path=%2Fmine`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setNotifs(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const markRead = async (id: string) => {
    await fetch(`${NOTIF_URL}?path=${encodeURIComponent(`/${id}/read`)}`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` }
    });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const deleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`${NOTIF_URL}?path=${encodeURIComponent(`/${id}`)}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` }
    });
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  const markAllRead = async () => {
    await fetch(`${NOTIF_URL}?path=%2Fread-all`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }
    });
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleClick = (n: any) => {
    if (!n.is_read) markRead(n.id);
    if (n.link) { navigate(n.link); onClose(); }
  };

  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-background border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="font-display font-black uppercase tracking-widest text-xs text-foreground">Notifications</span>
          {unread > 0 && (
            <span className="bg-primary text-primary-foreground text-[9px] font-display font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1 text-[10px] font-sans text-muted-foreground hover:text-primary transition-colors">
            <CheckCheck className="w-3 h-3" /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-border/50">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
            <Bell className="w-8 h-8 opacity-30" />
            <p className="text-xs font-sans">No notifications yet</p>
          </div>
        ) : (
          notifs.map(n => {
            const Icon = NOTIF_ICONS[n.type] ?? Bell;
            const isAccepted = n.type === 'application_accepted';
            const isRejected = n.type === 'application_rejected';
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer group hover:bg-secondary/40 ${!n.is_read ? "bg-primary/5" : ""}`}
              >
                {/* Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isAccepted ? "bg-green-500/15 text-green-400" :
                  isRejected ? "bg-red-500/15 text-red-400" :
                  "bg-primary/10 text-primary"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs font-display font-bold uppercase tracking-wider leading-tight ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      <button
                        onClick={(e) => deleteNotif(n.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] font-sans text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-sans text-muted-foreground/60">{timeAgo(n.created_date)}</span>
                    {n.link && <ExternalLink className="w-2.5 h-2.5 text-muted-foreground/40" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

export function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const drawerRef = useRef<HTMLDivElement>(null);
  const token = sessionStorage.getItem("tag_auth_token") ?? localStorage.getItem("tag_auth_token") ?? "";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); setDrawerOpen(false); }, [location]);

  // Poll notification count every 60s when authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const fetchCount = () => {
      fetch(`${NOTIF_URL}?path=%2Fcount`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setUnreadCount(d.notifications ?? 0))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, token]);

  // Close drawer on outside click
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) setDrawerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-lg"
          : "bg-background/80 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative flex items-center justify-center w-[68px] h-[68px] shrink-0 bg-transparent">
              <TagLogo size={68} />
            </div>
            <span className="font-display text-[10px] tracking-[0.2em] text-muted-foreground uppercase hidden sm:block group-hover:text-primary transition-colors">
              Tactical Adaptation Group
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}
                className={`font-display font-semibold tracking-wider uppercase text-sm transition-all duration-200 hover:text-accent relative group py-2 ${
                  location === link.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {(link as any).crown ? <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-yellow-400" />{link.label}</span> : link.label}
                {location === link.href && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-accent transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100" />
              </Link>
            ))}
            <Link href={VETERANS_LINK.href}
              className={`font-display font-semibold tracking-wider uppercase text-sm transition-all duration-200 relative group py-2 ${
                location === VETERANS_LINK.href ? "text-accent" : "text-accent/70 hover:text-accent"
              }`}
            >
              {VETERANS_LINK.label}
              {location === VETERANS_LINK.href && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-accent" />}
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-accent transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100" />
            </Link>

            <button onClick={toggleTheme} aria-label="Toggle theme"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Bell + drawer */}
            {isAuthenticated && (
              <div className="relative" ref={drawerRef}>
                <button
                  onClick={() => setDrawerOpen(o => !o)}
                  className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-primary text-primary-foreground text-[9px] font-display font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {drawerOpen && (
                    <NotificationDrawer token={token} onClose={() => setDrawerOpen(false)} />
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="flex items-center gap-3 ml-1 pl-4">
              {isAuthenticated ? (
                <Link href="/portal/dashboard"
                  className="font-display font-bold uppercase tracking-wider text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded clip-angled-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all active:scale-95">
                  HQ Portal
                </Link>
              ) : (
                <>
                  <Link href="/portal/login"
                    className="font-display font-bold uppercase tracking-wider text-sm border border-primary text-primary hover:bg-primary/10 px-5 py-2 rounded clip-angled-sm transition-all active:scale-95">
                    Member Login
                  </Link>
                  <Link href="/portal/register"
                    className="font-display font-bold uppercase tracking-wider text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded clip-angled-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_hsla(var(--primary),0.4)] transition-all active:scale-95">
                    Enlist Now
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Mobile */}
          <div className="lg:hidden flex items-center gap-2">
            <button onClick={toggleTheme} aria-label="Toggle theme"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile bell */}
            {isAuthenticated && (
              <div className="relative" ref={drawerRef}>
                <button onClick={() => setDrawerOpen(o => !o)}
                  className="relative p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Notifications">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {drawerOpen && (
                    <NotificationDrawer token={token} onClose={() => setDrawerOpen(false)} />
                  )}
                </AnimatePresence>
              </div>
            )}

            {isAuthenticated ? (
              <Link href="/portal/dashboard"
                className="font-display font-bold uppercase tracking-wider text-xs bg-primary text-primary-foreground px-3 py-2 rounded transition-all active:scale-95">
                HQ Portal
              </Link>
            ) : (
              <>
                <Link href="/portal/login"
                  className="font-display font-bold uppercase tracking-wider text-xs border border-primary text-primary hover:bg-primary/10 px-3 py-2 rounded transition-all active:scale-95">
                  Login
                </Link>
                <Link href="/portal/register"
                  className="font-display font-bold uppercase tracking-wider text-xs bg-primary text-primary-foreground px-3 py-2 rounded transition-all active:scale-95">
                  Register
                </Link>
              </>
            )}
            <button className="p-2 text-muted-foreground hover:text-foreground ml-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Open menu">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}
            className="lg:hidden absolute top-20 left-0 w-full bg-background/98 backdrop-blur-md border-b border-border shadow-xl"
          >
            <div className="px-4 pt-2 pb-6 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href}
                  className={`font-display font-semibold tracking-wider uppercase text-base px-4 py-3 rounded-md transition-colors ${
                    location === link.href
                      ? "bg-primary/10 text-primary border-l-4 border-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-4 border-transparent"
                  }`}>
                  {(link as any).crown ? <span className="flex items-center gap-1"><Crown className="w-3.5 h-3.5 text-yellow-400" />{link.label}</span> : link.label}
                </Link>
              ))}
              <Link href={VETERANS_LINK.href}
                className={`font-display font-semibold tracking-wider uppercase text-base px-4 py-3 rounded-md transition-colors ${
                  location === VETERANS_LINK.href
                    ? "bg-accent/10 text-accent border-l-4 border-accent"
                    : "text-accent/70 hover:bg-accent/10 hover:text-accent border-l-4 border-transparent"
                }`}>
                {VETERANS_LINK.label}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
