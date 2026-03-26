import { Eye, EyeOff, X } from "lucide-react";
import { useOutsiderMode } from "@/hooks/useOutsiderMode";

export function OutsiderModeBanner() {
  const { active, exit } = useOutsiderMode();
  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-black flex items-center justify-between px-4 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 shrink-0" />
        <span className="font-display font-black uppercase tracking-widest text-xs">
          Outsider Preview Active — Commander privileges suspended
        </span>
      </div>
      <button
        onClick={exit}
        className="flex items-center gap-1.5 bg-black/20 hover:bg-black/40 transition-colors px-3 py-1.5 rounded font-display font-bold uppercase tracking-widest text-xs"
      >
        <EyeOff className="w-3.5 h-3.5" />
        Exit Preview
      </button>
    </div>
  );
}
