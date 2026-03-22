import { useEffect, useState, useCallback } from "react";

const SEQUENCE = ["m", "a", "c"];

export default function MacEasterEgg() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const dismiss = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, 400);
  }, []);

  useEffect(() => {
    const isMobile = () =>
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      window.matchMedia("(pointer: coarse)").matches;

    const handleKey = (e: KeyboardEvent) => {
      if (isMobile()) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();
      setProgress((prev) => {
        if (key === SEQUENCE[prev]) {
          const next = prev + 1;
          if (next === SEQUENCE.length) {
            setVisible(true);
            setClosing(false);
            return 0;
          }
          return next;
        }
        return key === SEQUENCE[0] ? 1 : 0;
      });
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(dismiss, 6000);
    return () => clearTimeout(t);
  }, [visible, dismiss]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      <div
        className={`pointer-events-auto relative max-w-sm w-full mx-4 transition-all duration-400
          ${closing ? "opacity-0 scale-90 translate-y-4" : "opacity-100 scale-100 translate-y-0"}`}
        style={{ animation: closing ? undefined : "mac-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <style>{`
          @keyframes mac-pop {
            from { opacity: 0; transform: scale(0.7) translateY(24px); }
            to   { opacity: 1; transform: scale(1)   translateY(0); }
          }
          @keyframes mac-scanline {
            0%   { background-position: 0 0; }
            100% { background-position: 0 100px; }
          }
        `}</style>

        <div className="relative overflow-hidden border border-green-500 bg-black shadow-[0_0_40px_rgba(74,222,128,0.35)]">
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(74,222,128,0.5) 2px, rgba(74,222,128,0.5) 4px)",
              animation: "mac-scanline 3s linear infinite",
            }}
          />

          <div className="relative z-10 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px flex-1 bg-green-500 opacity-40" />
              <span className="text-[10px] text-green-500 font-mono tracking-[3px] uppercase opacity-70">
                ── CLASSIFIED ──
              </span>
              <span className="h-px flex-1 bg-green-500 opacity-40" />
            </div>

            <div className="text-center">
              <div className="text-green-400 font-mono text-[11px] tracking-widest uppercase mb-1 opacity-60">
                &gt;&gt; INTRUSION DETECTED &lt;&lt;
              </div>
              <div className="text-white font-black text-2xl tracking-tight leading-tight mt-2 mb-1"
                   style={{ textShadow: "0 0 20px rgba(74,222,128,0.6)" }}>
                MacTheOperator
              </div>
              <div className="text-green-400 font-mono text-lg tracking-widest font-bold">
                WAS HERE
              </div>
              <div className="mt-4 text-gray-500 font-mono text-[10px] tracking-wider uppercase">
                you found the egg, operator.
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <span className="h-px flex-1 bg-green-500 opacity-20" />
              <span className="text-[9px] text-green-700 font-mono tracking-widest">TAG // EYES ONLY</span>
              <span className="h-px flex-1 bg-green-500 opacity-20" />
            </div>
          </div>

          <button
            onClick={dismiss}
            className="absolute top-2 right-2 text-green-700 hover:text-green-400 font-mono text-xs transition-colors"
          >
            [X]
          </button>
        </div>
      </div>
    </div>
  );
}
