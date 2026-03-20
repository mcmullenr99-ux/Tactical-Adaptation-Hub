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
// Color palette
// ─────────────────────────────────────────────────────────────────────────────
const COLOR_PALETTE = [
  // Reds / Crimsons
  "#8B0000","#A50021","#C8102E","#DC143C","#B22222","#FF4444",
  // Orange / Bronze tones
  "#8B4513","#A0522D","#CD7F32","#D2691E","#FF8C00","#DAA520",
  // Golds / Yellows
  "#8B6914","#B8860B","#FFD700","#FFDF00","#F5DEB3","#FFFFF0",
  // Greens
  "#004225","#006400","#1B4D3E","#228B22","#4B5320","#6B8E23",
  // Blues
  "#000080","#00008B","#003087","#0033A0","#1A3A7D","#1C2A6B",
  "#4169E1","#5B92E5","#87CEEB","#00BFFF",
  // Purples / Magentas
  "#4B0082","#6A0DAD","#7B2D8B","#8A2BE2","#9400D3","#C71585",
  // Neutrals / Greys / Black / White
  "#000000","#1C1C1C","#333333","#555555","#808080",
  "#A9A9A9","#C0C0C0","#D3D3D3","#E8E8E8","#FFFFFF",
  // Military / Earthy
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
// Metal gradient definitions
// ─────────────────────────────────────────────────────────────────────────────
function MetalGradientDef({ id, metal, angle = 0 }: { id: string; metal: MetalType; angle?: number }) {
  // angle=0 → top-to-bottom; angle=90 → left-to-right
  const x2 = Math.sin((angle * Math.PI) / 180).toFixed(3);
  const y2 = Math.cos((angle * Math.PI) / 180).toFixed(3);
  const stops: Record<MetalType, Array<{ o: string; c: string }>> = {
    gold: [
      { o: "0%",   c: "#7A5200" },
      { o: "18%",  c: "#C8941A" },
      { o: "38%",  c: "#FFE066" },
      { o: "55%",  c: "#FFD700" },
      { o: "72%",  c: "#C8941A" },
      { o: "85%",  c: "#FFE066" },
      { o: "100%", c: "#7A5200" },
    ],
    silver: [
      { o: "0%",   c: "#484848" },
      { o: "20%",  c: "#A0A0A0" },
      { o: "42%",  c: "#F0F0F0" },
      { o: "58%",  c: "#D8D8D8" },
      { o: "75%",  c: "#909090" },
      { o: "88%",  c: "#E0E0E0" },
      { o: "100%", c: "#484848" },
    ],
    bronze: [
      { o: "0%",   c: "#4A2208" },
      { o: "20%",  c: "#9A5A1A" },
      { o: "42%",  c: "#E0982A" },
      { o: "58%",  c: "#CD7F32" },
      { o: "75%",  c: "#9A5A1A" },
      { o: "88%",  c: "#D4902A" },
      { o: "100%", c: "#4A2208" },
    ],
  };
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2} gradientUnits="objectBoundingBox">
      {stops[metal].map((s, i) => (
        <stop key={i} offset={s.o} stopColor={s.c} />
      ))}
    </linearGradient>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// High-fidelity accessory SVG artwork
// Each icon is drawn in a [-13,13] x [-13,13] coordinate space, centered at 0,0
// ─────────────────────────────────────────────────────────────────────────────

/** Five-pointed star with faceted shading */
function StarIcon({ fill, stroke, highlightFill }: { fill: string; stroke: string; highlightFill: string }) {
  // R=11.5, r=4.6 (phi ratio ≈ 2.5)
  const pts = svgStarPoints(0, 0, 11.5, 4.6);
  const hlPts = svgStarPoints(0, 0, 11.5, 4.6).split(" ").filter((_, i) => i < 5).join(" ");
  return (
    <g>
      <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="0.7" strokeLinejoin="round" />
      {/* Top-face highlight */}
      <polygon
        points={hlPts}
        fill={highlightFill}
        opacity="0.35"
        clipPath="url(#star-top-half)"
      />
      {/* Facet lines from each outer tip to adjacent inner points */}
      <FacetLines R={11.5} r={4.6} stroke={stroke} />
    </g>
  );
}

function svgStarPoints(cx: number, cy: number, R: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angleDeg = -90 + i * 36;
    const a = (angleDeg * Math.PI) / 180;
    const dist = i % 2 === 0 ? R : r;
    pts.push(`${(cx + dist * Math.cos(a)).toFixed(3)},${(cy + dist * Math.sin(a)).toFixed(3)}`);
  }
  return pts.join(" ");
}

function FacetLines({ R, r, stroke }: { R: number; r: number; stroke: string }) {
  const outerPts: [number, number][] = [];
  const innerPts: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const a = ((-90 + i * 72) * Math.PI) / 180;
    const ai = ((-90 + 36 + i * 72) * Math.PI) / 180;
    outerPts.push([R * Math.cos(a), R * Math.sin(a)]);
    innerPts.push([r * Math.cos(ai), r * Math.sin(ai)]);
  }
  return (
    <g opacity="0.25" stroke={stroke} strokeWidth="0.4" fill="none">
      {outerPts.map(([ox, oy], i) => {
        const [ix1, iy1] = innerPts[i];
        const [ix2, iy2] = innerPts[(i + 4) % 5];
        return (
          <g key={i}>
            <line x1={ox} y1={oy} x2={ix1} y2={iy1} />
            <line x1={ox} y1={oy} x2={ix2} y2={iy2} />
          </g>
        );
      })}
    </g>
  );
}

/** Single oak leaf with lobes — used for OLC */
function OakLeafIcon({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <g>
      {/* Main leaf body — alternating lobes via cubic bezier */}
      <path
        d={`
          M 0,-12
          C 0.4,-11 1.5,-10 1.8,-9
          C 3.8,-9.5 5.5,-8 4.5,-6.5
          C 6.5,-6.5 7.5,-4.5 6,-3.5
          C 8,-3 8.5,-1 7,0.5
          C 8.5,1.5 8,3.5 6,4.5
          C 5.5,6 4,7.5 2,7.5
          L 1.2,10.5
          L 0.6,12.5
          L 0,12
          L -0.6,12.5
          L -1.2,10.5
          L -2,7.5
          C -4,7.5 -5.5,6 -6,4.5
          C -8,3.5 -8.5,1.5 -7,0.5
          C -8.5,-1 -8,-3 -6,-3.5
          C -7.5,-4.5 -6.5,-6.5 -4.5,-6.5
          C -5.5,-8 -3.8,-9.5 -1.8,-9
          C -1.5,-10 -0.4,-11 0,-12
          Z
        `}
        fill={fill}
        stroke={stroke}
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      {/* Central vein */}
      <path d="M 0,-11 Q 0.4,0 0,11" fill="none" stroke={stroke} strokeWidth="0.5" opacity="0.6" />
      {/* Side veins */}
      {[[-2,-7,[-5,-5]], [0.5,-3.5,[5.5,-2.5]], [-0.5,2,[5.5,3]], [0,6,[4,6.5]]].map(([x1,y1,to], i) => (
        <line key={i} x1={x1 as number} y1={y1 as number} x2={(to as number[])[0]} y2={(to as number[])[1]}
          stroke={stroke} strokeWidth="0.4" opacity="0.5" />
      ))}
    </g>
  );
}

/** Proper 11-point maple leaf */
function MapleLeafIcon({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <g>
      <path
        d={`
          M 0,-13
          L 1,-10.5 L 3.5,-11.5 L 2.5,-9
          L 6,-9.5 L 4.5,-7 L 7.5,-7.5
          L 5.5,-5 L 9,-5.5 L 7,-3.5
          L 10,-2 L 7,0
          L 9.5,1 L 6.5,2.5 L 4,0
          L 2.5,4.5 L 0.8,4 L 0.8,11.5 L 0,13
          L -0.8,11.5 L -0.8,4 L -2.5,4.5
          L -4,0 L -6.5,2.5 L -9.5,1
          L -7,0 L -10,-2 L -7,-3.5
          L -9,-5.5 L -5.5,-5 L -7.5,-7.5
          L -4.5,-7 L -6,-9.5 L -2.5,-9
          L -3.5,-11.5 L -1,-10.5
          Z
        `}
        fill={fill}
        stroke={stroke}
        strokeWidth="0.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Vein lines */}
      <line x1="0" y1="-11" x2="0" y2="11" stroke={stroke} strokeWidth="0.5" opacity="0.5" />
      <line x1="0" y1="0" x2="6" y2="-4" stroke={stroke} strokeWidth="0.35" opacity="0.4" />
      <line x1="0" y1="0" x2="-6" y2="-4" stroke={stroke} strokeWidth="0.35" opacity="0.4" />
    </g>
  );
}

/** Laurel wreath sprig — two mirrored branches */
function LaurelIcon({ fill, stroke }: { fill: string; stroke: string }) {
  // Each branch has 5 leaves arranged along a curved stem
  function Branch({ side }: { side: 1 | -1 }) {
    const leafPositions: Array<[number, number, number]> = [
      // [stemX, stemY, rotDeg]
      [side * 2,   8,  side * -30],
      [side * 4.5, 4,  side * -50],
      [side * 7,   0,  side * -65],
      [side * 9,  -4,  side * -75],
      [side * 9.5,-8.5,side * -82],
    ];
    return (
      <g>
        {/* Curved stem */}
        <path
          d={`M 0,11 Q ${side * 5},4 ${side * 10},-9`}
          fill="none"
          stroke={stroke}
          strokeWidth="0.8"
          opacity="0.7"
        />
        {/* Leaves */}
        {leafPositions.map(([lx, ly, rot], i) => (
          <ellipse
            key={i}
            cx={lx}
            cy={ly}
            rx={4.2 - i * 0.25}
            ry={2}
            transform={`rotate(${rot} ${lx} ${ly})`}
            fill={fill}
            stroke={stroke}
            strokeWidth="0.5"
          />
        ))}
        {/* Small berries at top */}
        <circle cx={side * 9.8} cy={-9.5} r={1.4} fill={fill} stroke={stroke} strokeWidth="0.4" />
      </g>
    );
  }
  return (
    <g>
      <Branch side={-1} />
      <Branch side={1} />
      {/* Bottom tie */}
      <path d="M -1.5,11.5 Q 0,13 1.5,11.5" fill="none" stroke={stroke} strokeWidth="1" />
    </g>
  );
}

/** Italic serif "V" */
function VDeviceIcon({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <g>
      <path
        d={`
          M -10,-10
          L -10,-7.5
          L -1.5,9.5
          C -0.8,11 0.8,11 1.5,9.5
          L 10,-7.5
          L 10,-10
          L 7.5,-10
          L 0,7
          L -7.5,-10
          Z
        `}
        fill={fill}
        stroke={stroke}
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      {/* Serifs */}
      <rect x="-12" y="-11" width="5" height="2" rx="0.5" fill={fill} stroke={stroke} strokeWidth="0.5" />
      <rect x="7"   y="-11" width="5" height="2" rx="0.5" fill={fill} stroke={stroke} strokeWidth="0.5" />
      {/* Highlight line down left arm */}
      <line x1="-8.5" y1="-9" x2="-1" y2="5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.7" />
    </g>
  );
}

/** Serif "E" */
function EDeviceIcon({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <g>
      <path
        d={`
          M -8,-11
          L 9,-11 L 9,-8.5 L -5.5,-8.5
          L -5.5,-1.5 L 7,-1.5 L 7,1
          L -5.5,1 L -5.5,8
          L 9,8 L 9,11 L -8,11
          Z
        `}
        fill={fill}
        stroke={stroke}
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      {/* Inner highlight on top bar */}
      <line x1="-6" y1="-10" x2="7" y2="-10" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
    </g>
  );
}

/** Renders a single accessory element, centered at (0,0) in icon space */
function AccessoryIcon({ acc, uid }: { acc: Accessory; uid: string }) {
  const gradId = `grad-${uid}`;
  const hlId = `hl-${uid}`;
  const strokeColor = acc.metal === "gold" ? "#7A5200" : acc.metal === "silver" ? "#484848" : "#4A2208";
  const fill = `url(#${gradId})`;
  const hlFill = `url(#${hlId})`;

  return (
    <g>
      <defs>
        <MetalGradientDef id={gradId} metal={acc.metal} angle={160} />
        {/* Highlight gradient — lighter, from top */}
        <linearGradient id={hlId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.6" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {(() => {
        switch (acc.type) {
          case "star":   return <StarIcon fill={fill} stroke={strokeColor} highlightFill={hlFill} />;
          case "oakleaf": return <OakLeafIcon fill={fill} stroke={strokeColor} />;
          case "maple":  return <MapleLeafIcon fill={fill} stroke={strokeColor} />;
          case "laurel": return <LaurelIcon fill={fill} stroke={strokeColor} />;
          case "v_device": return <VDeviceIcon fill={fill} stroke={strokeColor} />;
          case "e_device": return <EDeviceIcon fill={fill} stroke={strokeColor} />;
          case "numeral":
            return (
              <text
                x="0" y="5.5"
                textAnchor="middle"
                fontSize="16"
                fontWeight="900"
                fontFamily="Georgia, serif"
                fill={fill}
                stroke={strokeColor}
                strokeWidth="0.6"
              >{acc.count}</text>
            );
          default: return null;
        }
      })()}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ribbon SVG Renderer
// ─────────────────────────────────────────────────────────────────────────────
const RW = 280;
const RH = 80;
// Icon size on ribbon (in ribbon coords):
const ICON_SCALE = 0.32; // 13 icon units * 0.32 ≈ 4.2 ribbon units → fits in 80px height ribbon

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
    let el: JSX.Element;
    if (orientation === "vertical") {
      const sw = frac * width;
      el = <rect key={s.id ?? i} x={cursor} y={0} width={sw} height={height} fill={s.color} />;
      cursor += sw;
    } else {
      const sh = frac * height;
      el = <rect key={s.id ?? i} x={0} y={cursor} width={width} height={sh} fill={s.color} />;
      cursor += sh;
    }
    return el;
  });

  // Scale factor from icon coords ([-13,13]) to ribbon pixel space
  // We want accessories to fill about 75% of ribbon height
  const iconHalfSize = 13;
  const scaleFactor = (height * 0.72) / (iconHalfSize * 2);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{
        borderRadius: 2,
        boxShadow: shadow
          ? `2px 3px 10px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)`
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
        {/* Background fallback */}
        {stripes.length === 0 && (
          <rect x="0" y="0" width={width} height={height} fill="#222" />
        )}
        {stripeEls}

        {/* Gloss */}
        <rect
          x="0" y="0" width={width} height={height * 0.38}
          fill="rgba(255,255,255,0.055)"
        />

        {/* Accessories */}
        {accessories.map((acc, idx) => {
          const cx = (acc.xPercent / 100) * width;
          const cy = height / 2;
          const total = acc.type === "numeral" || acc.type === "v_device" || acc.type === "e_device"
            ? 1
            : acc.count;
          const spacing = iconHalfSize * 2 * scaleFactor * 1.05;
          const totalWidth = (total - 1) * spacing;

          return Array.from({ length: total }).map((_, j) => {
            const tx = cx - totalWidth / 2 + j * spacing;
            return (
              <g
                key={`${idx}-${j}`}
                transform={`translate(${tx},${cy}) scale(${scaleFactor})`}
              >
                <AccessoryIcon acc={acc} uid={`${uid}-${idx}-${j}`} />
              </g>
            );
          });
        })}

        {/* Edge border */}
        <rect
          x="0.5" y="0.5" width={width - 1} height={height - 1}
          fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" rx="1.5"
        />
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

  // Stripe helpers
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

  // Accessory helpers
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

        {/* Header */}
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

          {/* ── Library sidebar ── */}
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
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
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

          {/* ── Builder main ── */}
          <div className="space-y-5">

            {/* Preview + title */}
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

              {/* LIVE PREVIEW — large, high quality */}
              <div className="flex flex-col items-center gap-3 py-6 bg-[#0a0f0a] rounded-sm">
                <RibbonSVG design={design} width={320} height={91} />
                <p className="text-muted-foreground text-[10px] uppercase tracking-widest">{ribbonName}</p>
              </div>

              {/* Orientation toggle */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-display uppercase tracking-wider">Stripe Direction:</span>
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
                {/* ── STRIPES TAB ── */}
                {activeTab === "stripes" && (
                  <div className="space-y-3">
                    <p className="text-muted-foreground text-xs">
                      Click a stripe to expand its colour picker. Drag the width slider to resize it.
                    </p>
                    <div className="space-y-2">
                      {design.stripes.map((stripe, idx) => (
                        <div key={stripe.id} className="border border-border">
                          {/* Stripe row */}
                          <div
                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-card/60"
                            onClick={() => setExpandedStripe(expandedStripe === stripe.id ? null : stripe.id)}
                          >
                            {/* Color swatch */}
                            <div
                              className="w-10 h-10 rounded-sm border border-border flex-shrink-0"
                              style={{ background: stripe.color }}
                            />
                            <span className="font-mono text-xs text-muted-foreground">{stripe.color.toUpperCase()}</span>

                            {/* Width */}
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

                            {/* Up/Down */}
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

                          {/* Expanded colour picker */}
                          <AnimatePresence>
                            {expandedStripe === stripe.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-border"
                              >
                                <div className="p-4">
                                  <ColorPicker
                                    value={stripe.color}
                                    onChange={(c) => updateStripe(stripe.id, { color: c })}
                                  />
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

                {/* ── ACCESSORIES TAB ── */}
                {activeTab === "accessories" && (
                  <div className="space-y-5">
                    {/* Accessory preview gallery */}
                    <div>
                      <p className="text-muted-foreground text-xs mb-3">Click an accessory to add it to the ribbon.</p>
                      <div className="grid grid-cols-4 gap-3">
                        {ACCESSORY_TYPES.map((at) => (
                          <button
                            key={at.type}
                            onClick={() => addAccessory(at.type)}
                            className="border border-border hover:border-primary/50 bg-card p-3 flex flex-col items-center gap-2 transition-colors group"
                          >
                            {/* Mini preview of the accessory */}
                            <svg viewBox="-14 -14 28 28" width="44" height="44">
                              <AccessoryIcon
                                acc={{ id: "preview", type: at.type, metal: "gold", count: 1, xPercent: 50 }}
                                uid={`preview-${at.type}`}
                              />
                            </svg>
                            <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground group-hover:text-primary text-center leading-tight">
                              {at.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Added accessories */}
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
                                {/* Icon preview */}
                                <svg viewBox="-14 -14 28 28" width="36" height="36" className="flex-shrink-0">
                                  <AccessoryIcon acc={acc} uid={`edit-${acc.id}`} />
                                </svg>
                                <span className="font-display text-xs uppercase tracking-widest text-primary flex-1">
                                  {meta.label}
                                </span>
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
                                        acc.metal === m.val
                                          ? "border-primary bg-primary/10 text-primary"
                                          : "border-border text-muted-foreground hover:border-primary/30"
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
                                        className={`w-7 h-7 text-xs border transition-colors ${
                                          acc.count === n ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                                        }`}
                                      >
                                        {n}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Numeral value */}
                              {acc.type === "numeral" && (
                                <div className="flex items-center gap-3">
                                  <span className="text-muted-foreground text-xs w-14">Numeral</span>
                                  <div className="flex gap-1.5 flex-wrap">
                                    {[2,3,4,5,6,7,8,9].map((n) => (
                                      <button
                                        key={n}
                                        onClick={() => updateAccessory(acc.id, { count: n })}
                                        className={`w-7 h-7 text-xs border transition-colors ${
                                          acc.count === n ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                                        }`}
                                      >
                                        {n}
                                      </button>
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

                {/* ── GRANT TAB ── */}
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

            {/* Ribbon rack preview */}
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
  const W2 = perRow * rw + (perRow - 1) * gap;
  const H2 = rows * rh + (rows - 1) * gap;

  return (
    <svg viewBox={`0 0 ${W2} ${H2}`} width={W2 * 2} height={H2 * 2}>
      {ribbons.map((r, idx) => {
        const col = idx % perRow;
        const row = Math.floor(idx / perRow);
        return (
          <g key={r.id} transform={`translate(${col * (rw + gap)},${row * (rh + gap)})`}>
            <RibbonSVGRack design={r.design} w={rw} h={rh} />
          </g>
        );
      })}
    </svg>
  );
}

function RibbonSVGRack({ design, w, h }: { design: RibbonDesign; w: number; h: number }) {
  const id = Math.random().toString(36).slice(2, 7);
  const orientation = design.orientation ?? "vertical";
  const total = design.stripes.reduce((s, x) => s + x.weight, 0) || 1;
  let cursor = 0;
  const stripeEls = design.stripes.map((s, i) => {
    const frac = s.weight / total;
    if (orientation === "vertical") {
      const sw = frac * w;
      const el = <rect key={i} x={cursor} y={0} width={sw} height={h} fill={s.color} />;
      cursor += sw;
      return el;
    } else {
      const sh = frac * h;
      const el = <rect key={i} x={0} y={cursor} width={w} height={sh} fill={s.color} />;
      cursor += sh;
      return el;
    }
  });

  const scaleFactor = (h * 0.72) / 26;

  return (
    <>
      <clipPath id={`rc-${id}`}><rect x="0" y="0" width={w} height={h} rx="1" /></clipPath>
      <g clipPath={`url(#rc-${id})`}>
        {stripeEls}
        {design.accessories.map((acc, ai) => {
          const cx = (acc.xPercent / 100) * w;
          const cy = h / 2;
          const total2 = acc.type === "numeral" || acc.type === "v_device" || acc.type === "e_device" ? 1 : acc.count;
          const sp = 26 * scaleFactor * 1.05;
          return Array.from({ length: total2 }).map((_, j) => (
            <g key={`${ai}-${j}`} transform={`translate(${cx - ((total2 - 1) * sp) / 2 + j * sp},${cy}) scale(${scaleFactor})`}>
              <AccessoryIcon acc={acc} uid={`rack-${id}-${ai}-${j}`} />
            </g>
          ));
        })}
        <rect x="0.5" y="0.5" width={w - 1} height={h - 1} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" rx="0.5" />
      </g>
    </>
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
    return (
      <div className="text-center py-8 text-muted-foreground text-xs">
        Save the ribbon first before awarding it to operators.
      </div>
    );
  }

  async function grant() {
    if (!selectedRosterId) return;
    setGranting(true);
    try {
      await apiFetch(`/api/milsim-groups/${groupId}/ribbons/${ribbon!.id}/grant`, {
        method: "POST",
        body: JSON.stringify({ rosterEntryId: selectedRosterId }),
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
      <p className="text-muted-foreground text-xs">
        Award <span className="text-primary">{ribbon.name}</span> to operators on your roster.
      </p>
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
