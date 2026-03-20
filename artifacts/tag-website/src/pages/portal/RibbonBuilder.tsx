import { useState, useEffect, useCallback, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { apiFetch } from "@/lib/apiFetch";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Save, Loader2,
  Award, ArrowLeft, CheckCircle2, AlertCircle, Users, LayoutList,
} from "lucide-react";
import { useLocation } from "wouter";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type MetalType = "gold" | "silver" | "bronze";
export type AccessoryType = "star" | "oakleaf" | "maple" | "laurel" | "v_device" | "e_device" | "numeral";
export type StripeOrientation = "vertical" | "horizontal";

export interface Stripe { id: string; color: string; weight: number; }
export interface Accessory { id: string; type: AccessoryType; metal: MetalType; count: number; xPercent: number; }
export interface RibbonDesign {
  stripes: Stripe[];
  accessories: Accessory[];
  orientation: StripeOrientation;
}

interface RibbonTemplate { id: number; name: string; description: string | null; design: RibbonDesign; grants: Grant[]; }
interface Grant { id: number; roster_entry_id: number; callsign: string; awarded_by: string; awarded_at: string; }
interface RosterEntry { id: number; callsign: string; rankId: number | null; }
interface GroupInfo { id: number; name: string; roster: RosterEntry[]; }

// ─────────────────────────────────────────────────────────────────────────────
// Icon asset paths — served from public/icons/
// ─────────────────────────────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL;
const ICON_URLS: Record<string, string> = {
  star:      `${BASE}icons/star.svg`,
  oakleaf:   `${BASE}icons/oak_leaf.svg`,
  maple:     `${BASE}icons/maple_leaf.svg`,
  laurel:    `${BASE}icons/laurel.svg`,
  v_device:  `${BASE}icons/v_device.svg`,
  e_device:  `${BASE}icons/e_device.svg`,
};

// ─────────────────────────────────────────────────────────────────────────────
// SVG colour-matrix filters — converts any SVG image to gold / silver / bronze
// ─────────────────────────────────────────────────────────────────────────────
function MetalFilters({ uid }: { uid: string }) {
  return (
    <defs>
      {/* Gold — warm saturated highlights */}
      <filter id={`gold-${uid}`} colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" result="grey" />
        <feComponentTransfer in="grey">
          <feFuncR type="table" tableValues="0.12 0.45 0.72 0.90 1.00" />
          <feFuncG type="table" tableValues="0.06 0.28 0.52 0.72 0.85" />
          <feFuncB type="table" tableValues="0.00 0.02 0.04 0.10 0.18" />
        </feComponentTransfer>
      </filter>
      {/* Silver — cool neutral with white peaks */}
      <filter id={`silver-${uid}`} colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" result="grey" />
        <feComponentTransfer in="grey">
          <feFuncR type="table" tableValues="0.10 0.40 0.68 0.88 1.00" />
          <feFuncG type="table" tableValues="0.10 0.40 0.68 0.88 1.00" />
          <feFuncB type="table" tableValues="0.12 0.44 0.72 0.92 1.00" />
        </feComponentTransfer>
      </filter>
      {/* Bronze — deep warm brown */}
      <filter id={`bronze-${uid}`} colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" result="grey" />
        <feComponentTransfer in="grey">
          <feFuncR type="table" tableValues="0.10 0.38 0.58 0.74 0.85" />
          <feFuncG type="table" tableValues="0.05 0.20 0.38 0.52 0.60" />
          <feFuncB type="table" tableValues="0.00 0.02 0.05 0.09 0.13" />
        </feComponentTransfer>
      </filter>
    </defs>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single accessory rendered inside the ribbon SVG coordinate system
// The icon is centred at (0,0) and fits in a ±iconHalf space
// ─────────────────────────────────────────────────────────────────────────────
function AccessoryIcon({ acc, uid, size }: { acc: Accessory; uid: string; size: number }) {
  const filterId = `${acc.metal}-${uid}`;
  const half = size / 2;

  // Inline paths for geometric devices (don't need external images)
  if (acc.type === "star") {
    // Precise golden-ratio 5-pointed star polygon
    const pts = svgStarPts(0, 0, half * 0.92, half * 0.37);
    return (
      <>
        <MetalFilters uid={uid} />
        <polygon
          points={pts}
          filter={`url(#${filterId})`}
          fill="white"
        />
      </>
    );
  }

  if (acc.type === "v_device") {
    const s = half * 0.9;
    return (
      <>
        <MetalFilters uid={uid} />
        <g filter={`url(#${filterId})`} fill="white">
          <path d={`M${-s},${-s} L${-s},${-s*0.68} L0,${s*0.78} L${s},${-s*0.68} L${s},${-s} L${s*0.72},${-s} L0,${s*0.42} L${-s*0.72},${-s} Z`} />
          <rect x={-s*1.22} y={-s*1.08} width={s*0.54} height={s*0.22} rx={s*0.06} />
          <rect x={s*0.68} y={-s*1.08} width={s*0.54} height={s*0.22} rx={s*0.06} />
        </g>
      </>
    );
  }

  if (acc.type === "e_device") {
    const s = half * 0.82;
    return (
      <>
        <MetalFilters uid={uid} />
        <path
          filter={`url(#${filterId})`}
          fill="white"
          d={`M${-s},${-s} L${s},${-s} L${s},${-s*0.62} L${-s*0.42},${-s*0.62} L${-s*0.42},${-s*0.1} L${s*0.78},${-s*0.1} L${s*0.78},${s*0.1} L${-s*0.42},${s*0.1} L${-s*0.42},${s*0.62} L${s},${s*0.62} L${s},${s} L${-s},${s} Z`}
        />
      </>
    );
  }

  if (acc.type === "numeral") {
    return (
      <>
        <MetalFilters uid={uid} />
        <text
          x="0" y={half * 0.35}
          textAnchor="middle"
          fontSize={size * 0.75}
          fontWeight="900"
          fontFamily="Georgia, serif"
          filter={`url(#${filterId})`}
          fill="white"
        >{acc.count}</text>
      </>
    );
  }

  // Complex organic shapes — use real Wikimedia SVG files rendered via <image>
  // Aspect ratios for each source SVG:
  const viewBoxes: Record<string, { w: number; h: number }> = {
    oakleaf: { w: 623.44, h: 465.79 },
    maple:   { w: 305,    h: 343    },
    laurel:  { w: 1199,   h: 330    },
  };
  const vb = viewBoxes[acc.type] ?? { w: 100, h: 100 };
  const aspect = vb.w / vb.h;
  const imgH = size * (acc.type === "laurel" ? 0.6 : 0.9);
  const imgW = imgH * aspect;
  const clampedW = Math.min(imgW, size * (acc.type === "laurel" ? 2.2 : 1.1));
  const clampedH = clampedW / aspect;

  return (
    <>
      <MetalFilters uid={uid} />
      <image
        href={ICON_URLS[acc.type]}
        x={-clampedW / 2}
        y={-clampedH / 2}
        width={clampedW}
        height={clampedH}
        preserveAspectRatio="xMidYMid meet"
        filter={`url(#${filterId})`}
      />
    </>
  );
}

function svgStarPts(cx: number, cy: number, R: number, r: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const a = (-90 + i * 36) * Math.PI / 180;
    const d = i % 2 === 0 ? R : r;
    return `${(cx + d * Math.cos(a)).toFixed(3)},${(cy + d * Math.sin(a)).toFixed(3)}`;
  }).join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Color palette
// ─────────────────────────────────────────────────────────────────────────────
const COLOR_PALETTE = [
  "#8B0000","#A50021","#C8102E","#DC143C","#B22222","#FF4444",
  "#8B4513","#A0522D","#CD7F32","#D2691E","#FF8C00","#DAA520",
  "#8B6914","#B8860B","#FFD700","#FFDF00","#F5DEB3","#FFFFF0",
  "#004225","#006400","#1B4D3E","#228B22","#4B5320","#6B8E23",
  "#000080","#00008B","#003087","#0033A0","#1A3A7D","#1C2A6B",
  "#4169E1","#5B92E5","#87CEEB","#00BFFF",
  "#4B0082","#6A0DAD","#7B2D8B","#8A2BE2","#9400D3","#C71585",
  "#000000","#1C1C1C","#333333","#555555","#808080",
  "#A9A9A9","#C0C0C0","#D3D3D3","#E8E8E8","#FFFFFF",
  "#3D2B1F","#4A2C2A","#5C4033","#6B4226","#78866B",
  "#B5A27F","#C8A951","#D4B896","#E8D5B7",
];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const normalised = value.toUpperCase();
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {COLOR_PALETTE.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => onChange(c)}
            style={{ background: c }}
            className={`w-6 h-6 rounded-sm transition-transform border ${
              normalised === c.toUpperCase()
                ? "border-primary scale-125 z-10 relative"
                : "border-transparent hover:scale-110"
            }`}
          />
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
        <span>Custom:</span>
        <div className="relative w-8 h-6 rounded-sm border border-border" style={{ background: value }}>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </div>
        <span className="font-mono tracking-wider">{normalised}</span>
      </label>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ribbon SVG Renderer
// ─────────────────────────────────────────────────────────────────────────────
const RW = 280;
const RH = 80;

export function RibbonSVG({
  design,
  width = RW,
  height = RH,
  shadow = true,
}: {
  design: RibbonDesign;
  width?: number;
  height?: number;
  shadow?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const orientation = design.orientation ?? "vertical";
  const { stripes, accessories } = design;
  const totalWeight = stripes.reduce((s, x) => s + x.weight, 0) || 1;
  let cursor = 0;

  const stripeEls = stripes.map((s, i) => {
    const frac = s.weight / totalWeight;
    if (orientation === "vertical") {
      const sw = frac * width;
      const el = <rect key={s.id ?? i} x={cursor} y={0} width={sw} height={height} fill={s.color} />;
      cursor += sw;
      return el;
    } else {
      const sh = frac * height;
      const el = <rect key={s.id ?? i} x={0} y={cursor} width={width} height={sh} fill={s.color} />;
      cursor += sh;
      return el;
    }
  });

  // Icon size in SVG units — fill ~78% of ribbon height
  const iconSize = height * 0.78;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{
        borderRadius: 2,
        boxShadow: shadow
          ? "2px 3px 10px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)"
          : undefined,
        display: "block",
      }}
    >
      <defs>
        <clipPath id={`clip-${uid}`}>
          <rect x="0" y="0" width={width} height={height} rx="2" />
        </clipPath>
      </defs>
      <g clipPath={`url(#clip-${uid})`}>
        {stripes.length === 0 && <rect x="0" y="0" width={width} height={height} fill="#222" />}
        {stripeEls}
        {/* Subtle gloss */}
        <rect x="0" y="0" width={width} height={height * 0.38} fill="rgba(255,255,255,0.055)" />

        {/* Accessories */}
        {accessories.map((acc, idx) => {
          const cx = (acc.xPercent / 100) * width;
          const cy = height / 2;
          const total = (acc.type === "numeral" || acc.type === "v_device" || acc.type === "e_device") ? 1 : acc.count;
          const spacing = iconSize * 1.08;
          const totalW = (total - 1) * spacing;

          return Array.from({ length: total }).map((_, j) => {
            const tx = cx - totalW / 2 + j * spacing;
            return (
              <g key={`${idx}-${j}`} transform={`translate(${tx},${cy})`}>
                <AccessoryIcon acc={acc} uid={`${uid}-${idx}-${j}`} size={iconSize} />
              </g>
            );
          });
        })}

        {/* Edge border */}
        <rect x="0.5" y="0.5" width={width - 1} height={height - 1} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" rx="1.5" />
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }

function defaultDesign(): RibbonDesign {
  return {
    orientation: "vertical",
    stripes: [
      { id: uid(), color: "#1A3A7D", weight: 1 },
      { id: uid(), color: "#FFFFFF", weight: 0.5 },
      { id: uid(), color: "#C8102E", weight: 1 },
    ],
    accessories: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Gallery preview — small standalone SVG per accessory type
// ─────────────────────────────────────────────────────────────────────────────
function AccessoryGalleryPreview({ type }: { type: AccessoryType }) {
  const previewAcc: Accessory = { id: "preview", type, metal: "gold", count: 1, xPercent: 50 };
  const previewSize = 36;
  return (
    <svg viewBox={`${-previewSize / 2} ${-previewSize / 2} ${previewSize} ${previewSize}`} width={44} height={44}>
      <AccessoryIcon acc={previewAcc} uid={`gal-${type}`} size={previewSize} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function RibbonBuilder() {
  const [, setLocation] = useLocation();
  const [groupId, setGroupId] = useState<number | null>(null);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [ribbons, setRibbons] = useState<RibbonTemplate[]>([]);
  const [selected, setSelected] = useState<RibbonTemplate | null>(null);
  const [design, setDesign] = useState<RibbonDesign>(defaultDesign());
  const [ribbonName, setRibbonName] = useState("New Ribbon");
  const [ribbonDesc, setRibbonDesc] = useState("");
  const [activeTab, setActiveTab] = useState<"stripes" | "accessories" | "grant">("stripes");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStripe, setExpandedStripe] = useState<string | null>(null);

  const showMsg = (ok: boolean, text: string) => {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 4000);
  };

  useEffect(() => {
    apiFetch<GroupInfo | null>("/api/milsim-groups/mine/own")
      .then((g) => {
        if (!g) return;
        setGroupId(g.id);
        setRoster(g.roster ?? []);
        return apiFetch<RibbonTemplate[]>(`/api/milsim-groups/${g.id}/ribbons`);
      })
      .then((r) => { if (r) setRibbons(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadRibbons = useCallback(async () => {
    if (!groupId) return;
    const r = await apiFetch<RibbonTemplate[]>(`/api/milsim-groups/${groupId}/ribbons`);
    setRibbons(r);
  }, [groupId]);

  function newRibbon() {
    setSelected(null);
    setDesign(defaultDesign());
    setRibbonName("New Ribbon");
    setRibbonDesc("");
    setActiveTab("stripes");
  }

  function editRibbon(r: RibbonTemplate) {
    setSelected(r);
    setDesign({ ...r.design, orientation: r.design.orientation ?? "vertical" });
    setRibbonName(r.name);
    setRibbonDesc(r.description ?? "");
    setActiveTab("stripes");
  }

  async function saveRibbon() {
    if (!groupId) return;
    setSaving(true);
    try {
      const payload = { name: ribbonName, description: ribbonDesc, design };
      if (selected) {
        await apiFetch(`/api/milsim-groups/${groupId}/ribbons/${selected.id}`, {
          method: "PATCH", body: JSON.stringify(payload),
        });
        showMsg(true, "Ribbon updated.");
      } else {
        const created = await apiFetch<RibbonTemplate>(
          `/api/milsim-groups/${groupId}/ribbons`,
          { method: "POST", body: JSON.stringify(payload) }
        );
        setSelected(created);
        showMsg(true, "Ribbon created.");
      }
      await loadRibbons();
    } catch { showMsg(false, "Save failed."); }
    finally { setSaving(false); }
  }

  async function deleteRibbon(r: RibbonTemplate) {
    if (!groupId || !confirm(`Delete "${r.name}"?`)) return;
    await apiFetch(`/api/milsim-groups/${groupId}/ribbons/${r.id}`, { method: "DELETE" });
    if (selected?.id === r.id) newRibbon();
    await loadRibbons();
  }

  const addStripe = () =>
    setDesign((d) => ({ ...d, stripes: [...d.stripes, { id: uid(), color: "#4ADE80", weight: 1 }] }));
  const removeStripe = (id: string) =>
    setDesign((d) => ({ ...d, stripes: d.stripes.filter((s) => s.id !== id) }));
  const moveStripe = (id: string, dir: -1 | 1) =>
    setDesign((d) => {
      const arr = [...d.stripes];
      const idx = arr.findIndex((s) => s.id === id);
      const next = idx + dir;
      if (next < 0 || next >= arr.length) return d;
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return { ...d, stripes: arr };
    });
  const updateStripe = (id: string, patch: Partial<Stripe>) =>
    setDesign((d) => ({ ...d, stripes: d.stripes.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));

  const addAccessory = (type: AccessoryType) => {
    setDesign((d) => ({
      ...d,
      accessories: [...d.accessories, { id: uid(), type, metal: "gold", count: 1, xPercent: 50 }],
    }));
    setActiveTab("accessories");
  };
  const removeAccessory = (id: string) =>
    setDesign((d) => ({ ...d, accessories: d.accessories.filter((a) => a.id !== id) }));
  const updateAccessory = (id: string, patch: Partial<Accessory>) =>
    setDesign((d) => ({ ...d, accessories: d.accessories.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));

  const ACCESSORY_TYPES: { type: AccessoryType; label: string; hasCount: boolean }[] = [
    { type: "star",      label: "Star",            hasCount: true  },
    { type: "oakleaf",   label: "Oak Leaf Cluster", hasCount: true  },
    { type: "maple",     label: "Maple Cluster",    hasCount: true  },
    { type: "laurel",    label: "Laurel Cluster",   hasCount: true  },
    { type: "v_device",  label: "V Device",         hasCount: false },
    { type: "e_device",  label: "E Device",         hasCount: false },
    { type: "numeral",   label: "Numeral",           hasCount: true  },
  ];

  const METALS: { val: MetalType; hex: string; label: string }[] = [
    { val: "gold",   hex: "#FFD700", label: "Gold"   },
    { val: "silver", hex: "#C0C0C0", label: "Silver" },
    { val: "bronze", hex: "#CD7F32", label: "Bronze" },
  ];

  if (loading) return (
    <PortalLayout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    </PortalLayout>
  );

  if (!groupId) return (
    <PortalLayout>
      <div className="max-w-lg mx-auto mt-20 text-center space-y-4">
        <Award className="w-10 h-10 text-primary mx-auto" />
        <p className="font-display text-lg uppercase tracking-widest">No MilSim Group Found</p>
        <p className="text-muted-foreground text-sm">You need to own a MilSim group to manage ribbons.</p>
        <button onClick={() => setLocation("/portal/milsim")} className="mf-btn-primary text-xs px-4 py-2">
          Go to MilSim Management
        </button>
      </div>
    </PortalLayout>
  );

  return (
    <PortalLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">

        <div className="flex items-center gap-4 border-b border-border pb-4">
          <button onClick={() => setLocation("/portal/milsim")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display font-black uppercase tracking-widest text-lg text-primary">
              Ribbon & Commendation Builder
            </h1>
            <p className="text-muted-foreground text-xs">
              Design full graphical ribbon bars — stripes, devices & accessories, award to operators
            </p>
          </div>
          <button onClick={newRibbon} className="ml-auto mf-btn-primary text-xs px-4 py-2 flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" /> New Ribbon
          </button>
        </div>

        <AnimatePresence>
          {msg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`flex items-center gap-2 p-3 border text-sm ${msg.ok ? "border-primary/40 bg-primary/5 text-primary" : "border-red-500/40 bg-red-500/5 text-red-400"}`}
            >
              {msg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">

          {/* Library */}
          <div className="space-y-3">
            <h2 className="font-display text-xs uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
              Ribbon Library
            </h2>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {ribbons.length === 0 && (
                <p className="text-muted-foreground text-xs text-center py-8">No ribbons yet</p>
              )}
              {ribbons.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  className={`border cursor-pointer p-3 space-y-2 hover:border-primary/40 transition-colors ${selected?.id === r.id ? "border-primary bg-primary/5" : "border-border"}`}
                  onClick={() => editRibbon(r)}
                >
                  <RibbonSVG design={r.design} width={220} height={62} />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-xs uppercase tracking-wider truncate max-w-[140px]">{r.name}</p>
                      <p className="text-muted-foreground text-xs">{r.grants.length} awarded</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteRibbon(r); }} className="text-muted-foreground hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Builder */}
          <div className="space-y-5">

            <div className="border border-border p-5 bg-card space-y-4">
              <div className="flex items-center gap-3 justify-between">
                <input
                  value={ribbonName}
                  onChange={(e) => setRibbonName(e.target.value)}
                  className="mf-input text-sm font-display font-bold uppercase tracking-widest max-w-xs"
                  placeholder="Ribbon name..."
                />
                <button onClick={saveRibbon} disabled={saving} className="mf-btn-primary text-xs px-5 py-2.5 flex items-center gap-2">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {selected ? "Update" : "Save"}
                </button>
              </div>

              {/* Preview */}
              <div className="flex flex-col items-center gap-3 py-6 bg-[#0a0f0a] rounded-sm">
                <RibbonSVG design={design} width={320} height={91} />
                <p className="text-muted-foreground text-[10px] uppercase tracking-widest">{ribbonName}</p>
              </div>

              {/* Orientation */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-display uppercase tracking-wider">Stripes:</span>
                {(["vertical", "horizontal"] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() => setDesign((d) => ({ ...d, orientation: o }))}
                    className={`px-3 py-1.5 text-xs font-display uppercase tracking-widest border transition-colors flex items-center gap-1.5 ${
                      design.orientation === o
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <LayoutList className={`w-3.5 h-3.5 ${o === "horizontal" ? "rotate-90" : ""}`} />
                    {o === "vertical" ? "Vertical" : "Horizontal"}
                  </button>
                ))}
              </div>

              <textarea
                value={ribbonDesc}
                onChange={(e) => setRibbonDesc(e.target.value)}
                className="mf-input text-sm w-full resize-none"
                rows={2}
                placeholder="Description / award criteria..."
              />
            </div>

            {/* Editor tabs */}
            <div className="border border-border">
              <div className="flex border-b border-border">
                {(["stripes", "accessories", "grant"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-5 py-3 text-xs font-display uppercase tracking-widest transition-colors ${
                      activeTab === t ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "stripes" ? "Stripe Editor" : t === "accessories" ? "Accessories" : "Award to Operators"}
                  </button>
                ))}
              </div>

              <div className="p-5">

                {/* STRIPES */}
                {activeTab === "stripes" && (
                  <div className="space-y-3">
                    <p className="text-muted-foreground text-xs">
                      Click a stripe to expand the colour picker. Use the slider to adjust its width.
                    </p>
                    <div className="space-y-2">
                      {design.stripes.map((stripe, idx) => (
                        <div key={stripe.id} className="border border-border">
                          <div
                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-card/60"
                            onClick={() => setExpandedStripe(expandedStripe === stripe.id ? null : stripe.id)}
                          >
                            <div className="w-10 h-10 rounded-sm border border-border flex-shrink-0" style={{ background: stripe.color }} />
                            <span className="font-mono text-xs text-muted-foreground">{stripe.color.toUpperCase()}</span>
                            <div className="flex-1">
                              <input
                                type="range" min="0.2" max="6" step="0.1"
                                value={stripe.weight}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateStripe(stripe.id, { weight: parseFloat(e.target.value) })}
                                className="w-full accent-primary h-1"
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8 text-right">{stripe.weight.toFixed(1)}×</span>
                            <div className="flex flex-col gap-0.5">
                              <button onClick={(e) => { e.stopPropagation(); moveStripe(stripe.id, -1); }} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); moveStripe(stripe.id, 1); }} disabled={idx === design.stripes.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeStripe(stripe.id); }} className="text-muted-foreground hover:text-red-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <AnimatePresence>
                            {expandedStripe === stripe.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-border"
                              >
                                <div className="p-4">
                                  <ColorPicker value={stripe.color} onChange={(c) => updateStripe(stripe.id, { color: c })} />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addStripe}
                      className="w-full border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors py-2.5 text-xs font-display uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Stripe
                    </button>
                  </div>
                )}

                {/* ACCESSORIES */}
                {activeTab === "accessories" && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-muted-foreground text-xs mb-3">Click an accessory to add it to the ribbon.</p>
                      <div className="grid grid-cols-4 gap-3">
                        {ACCESSORY_TYPES.map((at) => (
                          <button
                            key={at.type}
                            onClick={() => addAccessory(at.type)}
                            className="border border-border hover:border-primary/50 bg-card p-3 flex flex-col items-center gap-2 transition-colors group"
                          >
                            <AccessoryGalleryPreview type={at.type} />
                            <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground group-hover:text-primary text-center leading-tight">
                              {at.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {design.accessories.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-xs border border-dashed border-border">
                        No accessories added — click one above to add it
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {design.accessories.map((acc) => {
                          const meta = ACCESSORY_TYPES.find((x) => x.type === acc.type)!;
                          return (
                            <div key={acc.id} className="border border-border p-4 space-y-3">
                              <div className="flex items-center gap-3">
                                <AccessoryGalleryPreview type={acc.type} />
                                <span className="font-display text-xs uppercase tracking-widest text-primary flex-1">{meta.label}</span>
                                <button onClick={() => removeAccessory(acc.id)} className="text-muted-foreground hover:text-red-400">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Metal */}
                              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground text-xs w-14">Metal</span>
                                <div className="flex gap-2">
                                  {METALS.map((m) => (
                                    <button
                                      key={m.val}
                                      onClick={() => updateAccessory(acc.id, { metal: m.val })}
                                      className={`flex items-center gap-1.5 px-3 py-1 text-xs border transition-colors ${
                                        acc.metal === m.val ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                                      }`}
                                    >
                                      <span style={{ color: m.hex }}>●</span> {m.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Count */}
                              {meta.hasCount && acc.type !== "numeral" && (
                                <div className="flex items-center gap-3">
                                  <span className="text-muted-foreground text-xs w-14">Count</span>
                                  <div className="flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                      <button
                                        key={n}
                                        onClick={() => updateAccessory(acc.id, { count: n })}
                                        className={`w-7 h-7 text-xs border transition-colors ${acc.count === n ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                                      >{n}</button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Numeral */}
                              {acc.type === "numeral" && (
                                <div className="flex items-center gap-3">
                                  <span className="text-muted-foreground text-xs w-14">Numeral</span>
                                  <div className="flex gap-1.5 flex-wrap">
                                    {[2,3,4,5,6,7,8,9].map((n) => (
                                      <button
                                        key={n}
                                        onClick={() => updateAccessory(acc.id, { count: n })}
                                        className={`w-7 h-7 text-xs border transition-colors ${acc.count === n ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                                      >{n}</button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Position */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Position on ribbon</span>
                                  <span>{acc.xPercent}%</span>
                                </div>
                                <input
                                  type="range" min="5" max="95" step="1"
                                  value={acc.xPercent}
                                  onChange={(e) => updateAccessory(acc.id, { xPercent: parseInt(e.target.value) })}
                                  className="w-full accent-primary h-1"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* GRANT */}
                {activeTab === "grant" && (
                  <GrantTab
                    ribbon={selected}
                    groupId={groupId}
                    roster={roster}
                    onUpdate={loadRibbons}
                    showMsg={showMsg}
                  />
                )}
              </div>
            </div>

            {/* Rack preview */}
            {ribbons.length > 1 && (
              <div className="border border-border p-5 space-y-4">
                <h3 className="font-display text-xs uppercase tracking-widest text-muted-foreground">Full Ribbon Rack</h3>
                <RibbonRack ribbons={ribbons} />
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ribbon Rack
// ─────────────────────────────────────────────────────────────────────────────
function RibbonRack({ ribbons }: { ribbons: RibbonTemplate[] }) {
  const perRow = 3;
  const rw = 90, rh = 26, gap = 3;
  const rows = Math.ceil(ribbons.length / perRow);
  const W = perRow * rw + (perRow - 1) * gap;
  const H = rows * rh + (rows - 1) * gap;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W * 2} height={H * 2}>
      {ribbons.map((r, idx) => {
        const col = idx % perRow;
        const row = Math.floor(idx / perRow);
        const ox = col * (rw + gap);
        const oy = row * (rh + gap);
        const orientation = r.design.orientation ?? "vertical";
        const total = r.design.stripes.reduce((s, x) => s + x.weight, 0) || 1;
        let cursor = 0;
        const uid = `rack-${r.id}`;
        const iconSz = rh * 0.78;
        return (
          <g key={r.id} transform={`translate(${ox},${oy})`}>
            <clipPath id={`rc-${uid}`}><rect x="0" y="0" width={rw} height={rh} rx="1" /></clipPath>
            <g clipPath={`url(#rc-${uid})`}>
              {r.design.stripes.map((s, si) => {
                const frac = s.weight / total;
                if (orientation === "vertical") {
                  const sw = frac * rw;
                  const el = <rect key={si} x={cursor} y={0} width={sw} height={rh} fill={s.color} />;
                  cursor += sw; return el;
                } else {
                  const sh = frac * rh;
                  const el = <rect key={si} x={0} y={cursor} width={rw} height={sh} fill={s.color} />;
                  cursor += sh; return el;
                }
              })}
              {r.design.accessories.map((acc, ai) => {
                const cx = (acc.xPercent / 100) * rw;
                const cy = rh / 2;
                const total2 = (acc.type === "numeral" || acc.type === "v_device" || acc.type === "e_device") ? 1 : acc.count;
                const sp = iconSz * 1.08;
                return Array.from({ length: total2 }).map((_, j) => (
                  <g key={`${ai}-${j}`} transform={`translate(${cx - ((total2 - 1) * sp) / 2 + j * sp},${cy})`}>
                    <AccessoryIcon acc={acc} uid={`${uid}-${ai}-${j}`} size={iconSz} />
                  </g>
                ));
              })}
              <rect x="0.5" y="0.5" width={rw - 1} height={rh - 1} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" rx="0.5" />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Grant Tab
// ─────────────────────────────────────────────────────────────────────────────
function GrantTab({ ribbon, groupId, roster, onUpdate, showMsg }: {
  ribbon: RibbonTemplate | null; groupId: number; roster: RosterEntry[];
  onUpdate: () => void; showMsg: (ok: boolean, t: string) => void;
}) {
  const [granting, setGranting] = useState(false);
  const [selectedRosterId, setSelectedRosterId] = useState<number | "">("");

  if (!ribbon) {
    return <div className="text-center py-8 text-muted-foreground text-xs">Save the ribbon first before awarding it to operators.</div>;
  }

  async function grant() {
    if (!selectedRosterId) return;
    setGranting(true);
    try {
      await apiFetch(`/api/milsim-groups/${groupId}/ribbons/${ribbon!.id}/grant`, {
        method: "POST", body: JSON.stringify({ rosterEntryId: selectedRosterId }),
      });
      showMsg(true, "Ribbon awarded!");
      await onUpdate();
    } catch { showMsg(false, "Failed to award ribbon."); }
    finally { setGranting(false); }
  }

  async function revoke(grantId: number) {
    await apiFetch(`/api/milsim-groups/${groupId}/ribbons/${ribbon!.id}/grant/${grantId}`, { method: "DELETE" });
    showMsg(true, "Ribbon revoked.");
    await onUpdate();
  }

  const grantedIds = new Set(ribbon.grants.map((g) => g.roster_entry_id));
  const available = roster.filter((r) => !grantedIds.has(r.id));

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-xs">Award <span className="text-primary">{ribbon.name}</span> to operators on your roster.</p>
      <div className="flex gap-2">
        <select value={selectedRosterId} onChange={(e) => setSelectedRosterId(Number(e.target.value) || "")} className="mf-input text-sm flex-1">
          <option value="">Select operator...</option>
          {available.map((r) => <option key={r.id} value={r.id}>{r.callsign}</option>)}
        </select>
        <button onClick={grant} disabled={granting || !selectedRosterId} className="mf-btn-primary text-xs px-4 py-2 flex items-center gap-2 disabled:opacity-50">
          {granting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
          Award
        </button>
      </div>
      {ribbon.grants.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-display text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Users className="w-3.5 h-3.5" /> Recipients ({ribbon.grants.length})
          </h4>
          {ribbon.grants.map((g) => (
            <div key={g.id} className="flex items-center justify-between border border-border p-2.5">
              <div>
                <p className="text-sm font-display font-bold uppercase tracking-wider">{g.callsign}</p>
                <p className="text-xs text-muted-foreground">Awarded by {g.awarded_by} · {new Date(g.awarded_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => revoke(g.id)} className="text-xs text-muted-foreground hover:text-red-400 px-2 py-1 border border-transparent hover:border-red-400/30">
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
