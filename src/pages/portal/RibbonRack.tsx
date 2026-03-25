import { useState, useEffect, useMemo } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { useAuth } from "@/components/auth/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Award, Info, Download, Share2, ChevronUp, ChevronDown } from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface EarnedRibbon {
  id: string;
  award_name: string;
  award_description: string;
  award_image_url: string | null;
  ribbon_color_1: string | null;
  ribbon_color_2: string | null;
  ribbon_color_3: string | null;
  sort_order: number;
  group_name: string;
  awarded_by: string;
  reason: string;
  created_date: string;
}

/* ─── Ribbon visual ──────────────────────────────────────────────────────── */
function RibbonStripe({
  ribbon,
  size = "md",
  selected = false,
  onClick,
}: {
  ribbon: EarnedRibbon;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  onClick?: () => void;
}) {
  const dims = size === "sm" ? "w-8 h-5" : size === "lg" ? "w-14 h-9" : "w-11 h-7";
  const c1 = ribbon.ribbon_color_1 || "#3b82f6";
  const c2 = ribbon.ribbon_color_2 || c1;
  const c3 = ribbon.ribbon_color_3 || c2;

  return (
    <div
      onClick={onClick}
      title={ribbon.award_name}
      className={`${dims} rounded-sm overflow-hidden cursor-pointer transition-all border-2 ${
        selected ? "border-primary shadow-[0_0_8px_rgba(var(--primary)/0.6)]" : "border-transparent hover:border-primary/50"
      }`}
      style={{ flexShrink: 0 }}
    >
      {ribbon.award_image_url ? (
        <img src={ribbon.award_image_url} alt={ribbon.award_name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex">
          <div className="flex-1" style={{ background: c1 }} />
          {c2 !== c1 && <div className="flex-1" style={{ background: c2 }} />}
          {c3 !== c2 && <div className="flex-1" style={{ background: c3 }} />}
        </div>
      )}
    </div>
  );
}

/* ─── Rack display ───────────────────────────────────────────────────────── */
const RIBBONS_PER_ROW = 4;

function RibbonRackDisplay({ ribbons, onSelect, selected }: {
  ribbons: EarnedRibbon[];
  onSelect: (r: EarnedRibbon) => void;
  selected: EarnedRibbon | null;
}) {
  if (ribbons.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-lg">
        <Award className="w-10 h-10 mx-auto mb-3 opacity-20" />
        <p className="font-display text-sm uppercase tracking-widest text-muted-foreground">No ribbons earned yet</p>
        <p className="text-xs text-muted-foreground font-sans mt-1">Ribbons are awarded by your unit commanders</p>
      </div>
    );
  }

  // Group into rows of RIBBONS_PER_ROW
  const rows: EarnedRibbon[][] = [];
  for (let i = 0; i < ribbons.length; i += RIBBONS_PER_ROW) {
    rows.push(ribbons.slice(i, i + RIBBONS_PER_ROW));
  }

  return (
    <div className="bg-secondary/30 border border-border rounded-lg p-6 inline-block">
      <div className="space-y-1">
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map(r => (
              <RibbonStripe
                key={r.id}
                ribbon={r}
                size="lg"
                selected={selected?.id === r.id}
                onClick={() => onSelect(r)}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground font-display uppercase tracking-widest mt-4 text-center">
        {ribbons.length} ribbon{ribbons.length !== 1 ? "s" : ""} · click to inspect
      </p>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function RibbonRack() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [ribbons, setRibbons] = useState<EarnedRibbon[]>([]);
  const [selected, setSelected] = useState<EarnedRibbon | null>(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    apiFetch<any[]>(`/api/milsim-awards/mine`)
      .then(data => {
        // Filter to only ribbon-type awards
        const r = (data ?? []).filter((a: any) => a.award_type === "ribbon" || !a.award_type);
        // Sort by sort_order then date
        r.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
        setRibbons(r);
      })
      .catch(() => toast({ title: "Failed to load ribbons", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const moveRibbon = (idx: number, dir: -1 | 1) => {
    const newArr = [...ribbons];
    const target = idx + dir;
    if (target < 0 || target >= newArr.length) return;
    [newArr[idx], newArr[target]] = [newArr[target], newArr[idx]];
    setRibbons(newArr);
  };

  if (loading) return (
    <PortalLayout>
      <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    </PortalLayout>
  );

  return (
    <PortalLayout>
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-primary/20 text-primary rounded flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl uppercase tracking-widest">Ribbon Rack</h1>
            <p className="text-xs text-muted-foreground font-sans">Your service ribbons — awarded by unit commanders, displayed on your public profile</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — rack */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="font-display font-bold text-sm uppercase tracking-widest mb-4 text-muted-foreground">Your Rack</h2>
            <RibbonRackDisplay
              ribbons={ribbons}
              onSelect={setSelected}
              selected={selected}
            />
          </div>

          {/* Order manager */}
          {ribbons.length > 1 && (
            <div>
              <h2 className="font-display font-bold text-sm uppercase tracking-widest mb-3 text-muted-foreground">Arrange Order</h2>
              <p className="text-xs text-muted-foreground font-sans mb-4">Drag or use arrows to set precedence order (top-left = highest precedence)</p>
              <div className="space-y-1">
                {ribbons.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-3 p-2 bg-secondary/30 border border-border rounded hover:bg-secondary/60 transition-colors">
                    <span className="text-[10px] font-display font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
                    <RibbonStripe ribbon={r} size="sm" />
                    <span className="flex-1 text-xs font-display font-bold uppercase tracking-wider truncate">{r.award_name}</span>
                    <span className="text-[10px] text-muted-foreground font-sans truncate max-w-[100px]">{r.group_name}</span>
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveRibbon(i, -1)} disabled={i === 0}
                        className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => moveRibbon(i, 1)} disabled={i === ribbons.length - 1}
                        className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — detail panel */}
        <div>
          <h2 className="font-display font-bold text-sm uppercase tracking-widest mb-4 text-muted-foreground">Ribbon Detail</h2>
          {selected ? (
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <div className="flex items-center gap-4">
                <RibbonStripe ribbon={selected} size="lg" />
                <div>
                  <p className="font-display font-black text-base uppercase tracking-widest">{selected.award_name}</p>
                  <p className="text-xs text-muted-foreground font-sans">{selected.group_name}</p>
                </div>
              </div>

              {selected.award_description && (
                <p className="text-sm font-sans text-muted-foreground border-t border-border pt-3">{selected.award_description}</p>
              )}

              {selected.reason && (
                <div className="bg-secondary/40 border border-border rounded p-3">
                  <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Reason Awarded</p>
                  <p className="text-xs font-sans text-foreground">{selected.reason}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Awarded By</p>
                  <p className="font-display font-bold">{selected.awarded_by || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Date</p>
                  <p className="font-display font-bold">
                    {selected.created_date ? new Date(selected.created_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-lg p-8 text-center">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs text-muted-foreground font-sans">Click a ribbon to inspect it</p>
            </div>
          )}

          {/* Info box */}
          <div className="mt-6 bg-secondary/20 border border-border rounded-lg p-4">
            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">How Ribbons Work</p>
            <ul className="space-y-1.5 text-xs font-sans text-muted-foreground">
              <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">·</span> Only unit commanders can award ribbons</li>
              <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">·</span> Ribbons from all units you serve in appear here</li>
              <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">·</span> Your rack displays on your public service profile</li>
              <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">·</span> Arrange ribbons by precedence order</li>
            </ul>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
