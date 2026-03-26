import { useState, useCallback } from "react";

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
}

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
    case "solid":
      return [{ x: 0, w: 100, color: c(0) }];
    case "halves":
      return [{ x: 0, w: 50, color: c(0) }, { x: 50, w: 50, color: c(1) }];
    case "thirds":
      return [{ x: 0, w: 33.33, color: c(0) }, { x: 33.33, w: 33.34, color: c(1) }, { x: 66.67, w: 33.33, color: c(2) }];
    case "quarters":
      return [0,1,2,3].map(i => ({ x: i*25, w: 25, color: c(i) }));
    case "center":
      return [{ x: 0, w: 35, color: c(0) }, { x: 35, w: 30, color: c(1) }, { x: 65, w: 35, color: c(0) }];
    case "center-wide":
      return [{ x: 0, w: 25, color: c(0) }, { x: 25, w: 50, color: c(1) }, { x: 75, w: 25, color: c(0) }];
    case "edges":
      return [{ x: 0, w: 15, color: c(1) }, { x: 15, w: 70, color: c(0) }, { x: 85, w: 15, color: c(1) }];
    default:
      return [{ x: 0, w: 100, color: c(0) }];
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
  const uri = ribbonToSvgDataUri(config);
  return <img src={uri} alt="ribbon preview" className={`rounded-sm ${className}`} style={{ imageRendering: "crisp-edges" }} />;
}

const PRESET_COLORS = [
  "#1a3a6b","#c8102e","#ffffff","#ffd700","#006400","#000000",
  "#003087","#e8b84b","#ff6b00","#8b0000","#4a90d9","#2e8b57",
  "#6a0dad","#708090","#c0c0c0","#b8860b","#dc143c","#00308f",
];

interface RibbonBuilderProps {
  value: RibbonConfig;
  onChange: (cfg: RibbonConfig) => void;
}

export function RibbonBuilder({ value, onChange }: RibbonBuilderProps) {
  const maxColors = value.pattern === "solid" ? 1
    : value.pattern === "halves" ? 2
    : value.pattern === "quarters" ? 4
    : 3;

  const setPattern = (p: StripePattern) => {
    onChange({ ...value, pattern: p });
  };

  const setColor = (i: number, color: string) => {
    const next = [...value.colors];
    next[i] = color;
    onChange({ ...value, colors: next });
  };

  return (
    <div className="space-y-4">
      {/* Live preview */}
      <div className="flex justify-center py-3">
        <RibbonPreview config={value} className="h-8 w-24 shadow-md" />
      </div>

      {/* Pattern picker */}
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

      {/* Color slots */}
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
        {/* Preset swatches */}
        <div className="mt-2 flex flex-wrap gap-1">
          {PRESET_COLORS.map(col => (
            <button key={col} title={col}
              onClick={() => {
                // find first unfilled slot or replace last
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
