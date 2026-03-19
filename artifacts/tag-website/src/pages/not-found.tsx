import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { Home, Radio } from "lucide-react";

export default function NotFound() {
  useSEO({ title: "404 — Signal Lost" });

  return (
    <MainLayout>
      <div className="min-h-[90vh] flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <div className="relative mb-4 inline-block">
            <Radio className="w-20 h-20 text-primary/30 mx-auto" />
            <span className="absolute -top-2 -right-4 text-xs font-display font-bold text-destructive uppercase tracking-widest animate-pulse">STATIC</span>
          </div>

          <div className="mb-4">
            <span className="font-display font-bold text-8xl sm:text-[120px] tracking-tighter text-primary/20 select-none">404</span>
          </div>

          <h1 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-widest mb-3">Signal Lost</h1>
          <p className="text-muted-foreground mb-2">This frequency doesn't exist or has been decommissioned.</p>
          <p className="text-muted-foreground text-sm mb-8">You may have taken a wrong turn in the field. Regroup at base.</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
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
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
