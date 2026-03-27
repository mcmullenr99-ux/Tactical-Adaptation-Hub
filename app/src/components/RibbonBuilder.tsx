import { useState, useCallback, useEffect, useMemo } from "react";
import { Search, X, ChevronDown } from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
export type StripePattern =
  | "solid"
  | "thirds"
  | "halves"
  | "center"
  | "edges"
  | "quarters"
  | "center-wide";

export interface RibbonConfig {
  colors: string[];
  pattern: StripePattern;
  // Real award fields
  realAward?: {
    name: string;
    sku: string;
    image_url: string;
    branches: string[];
  } | null;
}

/* ─── Award data type ────────────────────────────────────────────────────── */
interface Award {
  name: string;
  sku: string;
  image_url: string;
  branches: string[];
}

/* ─── SVG ribbon builder (custom mode) ──────────────────────────────────── */
const PATTERNS: { id: StripePattern; label: string }[] = [
  { id: "solid",       label: "Solid" },
  { id: "thirds",      label: "Thirds" },
  { id: "halves",      label: "Halves" },
  { id: "center",      label: "Center Stripe" },
  { id: "edges",       label: "Edge Stripes" },
  { id: "quarters",    label: "Quarters" },
  { id: "center-wide", label: "Wide Center" },
];

function buildStripes(pattern: StripePattern, colors: string[]): { x: number; w: number; color: string }[] {
  const c = (i: number) => colors[i] ?? colors[colors.length - 1] ?? "#888";
  switch (pattern) {
    case "solid":       return [{ x: 0, w: 100, color: c(0) }];
    case "halves":      return [{ x: 0, w: 50, color: c(0) }, { x: 50, w: 50, color: c(1) }];
    case "thirds":      return [{ x: 0, w: 33.33, color: c(0) }, { x: 33.33, w: 33.34, color: c(1) }, { x: 66.67, w: 33.33, color: c(2) }];
    case "quarters":    return [0,1,2,3].map(i => ({ x: i*25, w: 25, color: c(i) }));
    case "center":      return [{ x: 0, w: 35, color: c(0) }, { x: 35, w: 30, color: c(1) }, { x: 65, w: 35, color: c(0) }];
    case "center-wide": return [{ x: 0, w: 25, color: c(0) }, { x: 25, w: 50, color: c(1) }, { x: 75, w: 25, color: c(0) }];
    case "edges":       return [{ x: 0, w: 15, color: c(1) }, { x: 15, w: 70, color: c(0) }, { x: 85, w: 15, color: c(1) }];
    default:            return [{ x: 0, w: 100, color: c(0) }];
  }
}

export function ribbonToSvgDataUri(config: RibbonConfig, width = 90, height = 24): string {
  const stripes = buildStripes(config.pattern, config.colors);
  const rects = stripes.map(s =>
    `<rect x="${(s.x / 100) * width}" y="0" width="${(s.w / 100) * width}" height="${height}" fill="${s.color}"/>`
  ).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#000" opacity="0.08" rx="1"/>
  ${rects}
  <rect width="${width}" height="1" fill="#fff" opacity="0.18"/>
  <rect y="${height-1}" width="${width}" height="1" fill="#000" opacity="0.22"/>
</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function RibbonPreview({ config, className = "" }: { config: RibbonConfig; className?: string }) {
  if (config.realAward?.image_url) {
    return (
      <img
        src={`${config.realAward.image_url}?h=36&w=132&auto=format`}
        alt={config.realAward.name}
        className={`rounded-sm object-cover ${className}`}
        style={{ imageRendering: "crisp-edges" }}
      />
    );
  }
  const uri = ribbonToSvgDataUri(config);
  return <img src={uri} alt="ribbon preview" className={`rounded-sm ${className}`} style={{ imageRendering: "crisp-edges" }} />;
}

/* ─── Branch labels ──────────────────────────────────────────────────────── */
const BRANCH_LABELS: Record<string, string> = {
  army: "Army",
  navy: "Navy",
  marine_corps: "Marine Corps",
  air_force: "Air Force",
  coast_guard: "Coast Guard",
  space_force: "Space Force",
  national_guard: "National Guard",
  public_health_services: "Public Health Service",
  civil_air_patrol: "Civil Air Patrol",
  young_marines: "Young Marines",
  civilian: "Civilian",
  joint: "Joint / Other",
};

const BRANCH_ORDER = [
  "army", "navy", "marine_corps", "air_force", "coast_guard",
  "space_force", "national_guard", "public_health_services",
  "civil_air_patrol", "young_marines", "civilian", "joint",
];

/* ─── Real Awards picker ─────────────────────────────────────────────────── */
function RealAwardPicker({ onSelect, selected }: {
  onSelect: (award: Award | null) => void;
  selected: Award | null;
}) {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState<string>("all");

  useEffect(() => {
    fetch("/awards.json")
      .then(r => r.json())
      .then((data: Award[]) => {
        setAwards(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = awards;
    if (branch !== "all") {
      list = list.filter(a => a.branches.includes(branch));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.sku.toLowerCase().includes(q));
    }
    return list.slice(0, 80); // cap for perf
  }, [awards, search, branch]);

  // Get all unique branches present in data
  const allBranches = useMemo(() => {
    const seen = new Set<string>();
    awards.forEach(a => a.branches.forEach(b => seen.add(b)));
    return BRANCH_ORDER.filter(b => seen.has(b));
  }, [awards]);

  if (loading) {
    return <div className="text-xs text-muted-foreground font-sans py-4 text-center">Loading award database...</div>;
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search awards..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 bg-secondary/40 border border-border rounded text-xs font-sans focus:outline-none focus:border-primary/60"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
            <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Branch filter */}
      <div className="relative">
        <select
          value={branch}
          onChange={e => setBranch(e.target.value)}
          className="w-full appearance-none pl-3 pr-8 py-1.5 bg-secondary/40 border border-border rounded text-xs font-display uppercase tracking-wider focus:outline-none focus:border-primary/60"
        >
          <option value="all">All Branches ({awards.length})</option>
          {allBranches.map(b => {
            const count = awards.filter(a => a.branches.includes(b)).length;
            return (
              <option key={b} value={b}>{BRANCH_LABELS[b] || b} ({count})</option>
            );
          })}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>

      {/* Count */}
      <p className="text-[10px] text-muted-foreground font-display uppercase tracking-widest">
        {filtered.length === 80 ? "Showing first 80 — refine search" : `${filtered.length} award${filtered.length !== 1 ? "s" : ""}`}
      </p>

      {/* Currently selected */}
      {selected && (
        <div className="flex items-center gap-2 p-2 bg-primary/10 border border-primary/30 rounded">
          <img
            src={`${selected.image_url}?h=28&w=102&auto=format`}
            alt={selected.name}
            className="h-7 w-auto rounded-sm object-cover flex-shrink-0"
          />
          <span className="flex-1 text-xs font-display font-bold uppercase tracking-wider truncate">{selected.name}</span>
          <button
            onClick={() => onSelect(null)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grid of ribbons */}
      <div className="grid grid-cols-3 gap-1.5 max-h-72 overflow-y-auto pr-1">
        {filtered.map(award => (
          <button
            key={award.sku}
            onClick={() => onSelect(selected?.sku === award.sku ? null : award)}
            title={award.name}
            className={`flex flex-col items-center gap-1 p-1.5 rounded border transition-colors ${
              selected?.sku === award.sku
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary/20 hover:border-primary/40 hover:bg-secondary/60"
            }`}
          >
            <img
              src={`${award.image_url}?h=24&w=88&auto=format`}
              alt={award.name}
              className="w-full h-5 object-cover rounded-sm"
              loading="lazy"
            />
            <span className="text-[9px] font-sans text-muted-foreground leading-tight text-center line-clamp-2 w-full">
              {award.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Custom colour builder ──────────────────────────────────────────────── */
const PRESET_COLORS = [
  "#1a3a6b","#c8102e","#ffffff","#ffd700","#006400","#000000",
  "#003087","#e8b84b","#ff6b00","#8b0000","#4a90d9","#2e8b57",
  "#6a0dad","#708090","#c0c0c0","#b8860b","#dc143c","#00308f",
];

function CustomBuilder({ value, onChange }: { value: RibbonConfig; onChange: (cfg: RibbonConfig) => void }) {
  const maxColors = value.pattern === "solid" ? 1
    : value.pattern === "halves" ? 2
    : value.pattern === "quarters" ? 4
    : 3;

  const setPattern = (p: StripePattern) => onChange({ ...value, pattern: p, realAward: null });
  const setColor = (i: number, color: string) => {
    const next = [...value.colors];
    next[i] = color;
    onChange({ ...value, colors: next, realAward: null });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center py-3">
        <RibbonPreview config={{ ...value, realAward: null }} className="h-8 w-24 shadow-md" />
      </div>

      <div>
        <label className="block text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-2">Stripe Pattern</label>
        <div className="grid grid-cols-4 gap-1.5">
          {PATTERNS.map(p => (
            <button key={p.id} onClick={() => setPattern(p.id)}
              className={`py-1.5 px-2 rounded text-[10px] font-display uppercase tracking-widest border transition-colors ${value.pattern === p.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-2">Colors</label>
        <div className="flex gap-3 flex-wrap">
          {Array.from({ length: maxColors }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <div className="w-8 h-8 rounded border-2 border-border" style={{ background: value.colors[i] ?? "#888" }} />
                <input type="color" value={value.colors[i] ?? "#888888"}
                  onChange={e => setColor(i, e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              </div>
              <span className="text-[9px] font-sans text-muted-foreground">{["L","M","R","R2"][i]}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {PRESET_COLORS.map(col => (
            <button key={col} title={col}
              onClick={() => {
                const slots = Array.from({ length: maxColors });
                const firstEmpty = slots.findIndex((_, i) => !value.colors[i]);
                const idx = firstEmpty >= 0 ? firstEmpty : maxColors - 1;
                setColor(idx, col);
              }}
              className="w-5 h-5 rounded-sm border border-white/10 hover:scale-110 transition-transform"
              style={{ background: col }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main RibbonBuilder export ──────────────────────────────────────────── */
interface RibbonBuilderProps {
  value: RibbonConfig;
  onChange: (cfg: RibbonConfig) => void;
}

export function RibbonBuilder({ value, onChange }: RibbonBuilderProps) {
  const [mode, setMode] = useState<"real" | "custom">(value.realAward ? "real" : "custom");

  const handleSelectAward = (award: Award | null) => {
    onChange({
      ...value,
      realAward: award ?? null,
    });
  };

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex gap-1 p-0.5 bg-secondary/40 border border-border rounded">
        <button
          onClick={() => setMode("real")}
          className={`flex-1 py-1.5 text-[10px] font-display uppercase tracking-widest rounded transition-colors ${
            mode === "real" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🎖️ Real Awards
        </button>
        <button
          onClick={() => setMode("custom")}
          className={`flex-1 py-1.5 text-[10px] font-display uppercase tracking-widest rounded transition-colors ${
            mode === "custom" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🎨 Custom
        </button>
      </div>

      {/* Preview for real mode */}
      {mode === "real" && value.realAward && (
        <div className="flex justify-center py-2">
          <RibbonPreview config={value} className="h-8 w-24 shadow-md" />
        </div>
      )}

      {mode === "real" ? (
        <RealAwardPicker
          onSelect={handleSelectAward}
          selected={value.realAward ?? null}
        />
      ) : (
        <CustomBuilder value={value} onChange={onChange} />
      )}
    </div>
  );
}
