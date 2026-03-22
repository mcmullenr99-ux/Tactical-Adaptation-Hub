import { useState, useEffect } from "react";
import { X, Wrench } from "lucide-react";

const STORAGE_KEY = "tag-dev-banner-dismissed";

export function DevBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="relative z-40 bg-primary/10 border-b border-primary/30 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Wrench className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="font-sans text-sm text-foreground/80">
            <span className="font-semibold text-foreground">Site under active development.</span>{" "}
            <span className="hidden sm:inline">Some sections are empty or incomplete while we build things out — more content and features are on the way.</span>
            <span className="sm:hidden">More content is on the way.</span>
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
