import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "tag-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="max-w-4xl mx-auto bg-card border border-border rounded-lg shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/20 border border-primary/40 rounded flex items-center justify-center">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground font-medium">
                We use session cookies to keep you logged in. No tracking, no adverts.{" "}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                {" · "}
                <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Required under UK PECR and UK GDPR.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={decline}
                className="px-4 py-2 text-sm border border-border rounded font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                Decline
              </button>
              <button
                onClick={accept}
                className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded font-display font-bold uppercase tracking-wider transition-colors"
              >
                Accept
              </button>
            </div>
            <button onClick={decline} className="absolute top-3 right-3 sm:hidden text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
