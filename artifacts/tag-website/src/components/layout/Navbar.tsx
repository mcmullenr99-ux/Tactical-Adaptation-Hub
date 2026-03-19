import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth/AuthContext";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/games", label: "Games" },
  { href: "/training", label: "Training" },
  { href: "/milsim", label: "MilSim" },
  { href: "/forum", label: "Forum" },
  { href: "/join", label: "Join" },
  { href: "/donate", label: "Donate" },
];

const VETERANS_LINK = { href: "/veterans", label: "Veterans" };

export function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const portalHref = isAuthenticated ? "/portal/dashboard" : "/portal/login";
  const portalLabel = isAuthenticated ? "HQ Portal" : "Login";

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
            <div className="relative flex items-center justify-center w-10 h-10 bg-primary/20 border border-primary/50 rounded clip-angled group-hover:bg-primary/40 transition-colors">
              <Shield className="w-5 h-5 text-primary group-hover:text-accent transition-colors" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-2xl tracking-widest text-foreground group-hover:text-primary transition-colors">
                TAG
              </span>
              <span className="font-display text-[10px] tracking-[0.2em] text-muted-foreground uppercase hidden sm:block">
                Tactical Adaptation Group
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-display font-semibold tracking-wider uppercase text-sm transition-all duration-200 hover:text-accent relative group py-2 ${
                  location === link.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
                {location === link.href && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
                )}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-accent transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100" />
              </Link>
            ))}

            <Link
              href={VETERANS_LINK.href}
              className={`font-display font-semibold tracking-wider uppercase text-sm transition-all duration-200 relative group py-2 ${
                location === VETERANS_LINK.href
                  ? "text-accent"
                  : "text-accent/70 hover:text-accent"
              }`}
            >
              {VETERANS_LINK.label}
              {location === VETERANS_LINK.href && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-accent" />
              )}
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-accent transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100" />
            </Link>

            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border">
              <Link
                href={portalHref}
                className="font-display font-bold uppercase tracking-wider text-sm border border-primary text-primary hover:bg-primary/10 px-5 py-2 rounded clip-angled-sm transition-all active:scale-95"
              >
                {isAuthenticated ? "HQ Portal" : "Member Login"}
              </Link>
              <Link
                href="/join"
                className="font-display font-bold uppercase tracking-wider text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded clip-angled-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_hsla(var(--primary),0.4)] transition-all active:scale-95"
              >
                Enlist Now
              </Link>
            </div>
          </nav>

          {/* Mobile: Login button always visible + hamburger */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              href={portalHref}
              className="font-display font-bold uppercase tracking-wider text-xs border border-primary text-primary hover:bg-primary/10 px-3 py-2 rounded transition-all active:scale-95"
            >
              {portalLabel}
            </Link>
            <Link
              href="/join"
              className="font-display font-bold uppercase tracking-wider text-xs bg-primary text-primary-foreground px-3 py-2 rounded transition-all active:scale-95"
            >
              Join
            </Link>
            <button
              className="p-2 text-muted-foreground hover:text-foreground ml-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="lg:hidden absolute top-20 left-0 w-full bg-background/98 backdrop-blur-md border-b border-border shadow-xl"
          >
            <div className="px-4 pt-2 pb-6 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-display font-semibold tracking-wider uppercase text-base px-4 py-3 rounded-md transition-colors ${
                    location === link.href
                      ? "bg-primary/10 text-primary border-l-4 border-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-4 border-transparent"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={VETERANS_LINK.href}
                className={`font-display font-semibold tracking-wider uppercase text-base px-4 py-3 rounded-md transition-colors ${
                  location === VETERANS_LINK.href
                    ? "bg-accent/10 text-accent border-l-4 border-accent"
                    : "text-accent/70 hover:bg-accent/10 hover:text-accent border-l-4 border-transparent"
                }`}
              >
                {VETERANS_LINK.label}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
