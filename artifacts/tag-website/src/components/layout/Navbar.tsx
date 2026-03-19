import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/games", label: "Games" },
  { href: "/training", label: "Training" },
  { href: "/join", label: "Join" },
];

export function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
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
          <nav className="hidden md:flex items-center gap-8">
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
              href="/join"
              className="ml-4 font-display font-bold uppercase tracking-wider text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded clip-angled-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_hsla(var(--primary),0.4)] transition-all active:scale-95"
            >
              Enlist Now
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-20 left-0 w-full bg-background border-b border-border shadow-xl"
          >
            <div className="px-4 pt-2 pb-6 flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-display font-semibold tracking-wider uppercase text-lg px-4 py-3 rounded-md transition-colors ${
                    location === link.href
                      ? "bg-primary/10 text-primary border-l-4 border-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-4 border-transparent"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 px-4">
                <Link
                  href="/join"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center font-display font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded clip-angled-sm shadow-lg transition-all"
                >
                  Enlist Now
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
