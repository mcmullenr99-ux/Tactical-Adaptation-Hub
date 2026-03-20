import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { Home } from "lucide-react";
import { TagLogo } from "@/components/TagLogo";
import { motion } from "framer-motion";

export default function NotFound() {
  useSEO({ title: "404 — Signal Lost" });

  return (
    <MainLayout>
      <div className="min-h-[90vh] flex items-center justify-center px-4 relative overflow-hidden">
        {/* faint watermark grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 39px,currentColor 39px,currentColor 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,currentColor 39px,currentColor 40px)" }} />

        <div className="relative z-10 text-center max-w-lg">
          {/* large ghost helmet */}
          <motion.div
            className="relative mb-2 inline-block"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="relative">
              <TagLogo size={220} className="opacity-60 mx-auto" />
              <motion.span
                className="absolute top-4 right-0 text-[10px] font-display font-bold text-destructive uppercase tracking-[0.3em] animate-pulse bg-background/80 px-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                OFFLINE
              </motion.span>
            </div>
          </motion.div>

          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <span className="font-display font-bold text-8xl sm:text-[120px] tracking-tighter text-primary/20 select-none">404</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            <h1 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-widest mb-3">Signal Lost</h1>
            <p className="text-muted-foreground mb-2">This frequency doesn't exist or has been decommissioned.</p>
            <p className="text-muted-foreground text-sm mb-8">You may have taken a wrong turn in the field. Regroup at base.</p>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-widest text-sm rounded clip-angled-sm transition-all active:scale-95"
            >
              <Home className="w-4 h-4" /> Return to Base
            </Link>
            <Link
              href="/portal/dashboard"
              className="flex items-center gap-2 px-6 py-3 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground font-display font-bold uppercase tracking-widest text-sm rounded clip-angled-sm transition-all"
            >
              HQ Portal
            </Link>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
