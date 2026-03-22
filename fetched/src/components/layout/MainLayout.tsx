import { ReactNode, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { DevBanner } from "./DevBanner";
import { CookieBanner } from "@/components/CookieBanner";
import { useLocation } from "wouter";

export function MainLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-white">
      <Navbar />
      <main className="flex-grow pt-20">
        <DevBanner />
        {children}
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
}
