import { useState, useEffect, useCallback, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { apiFetch } from "@/lib/apiFetch";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Save, Loader2,
  Award, Star, ArrowLeft, CheckCircle2, AlertCircle, Users
} from "lucide-react";
import { useLocation } from "wouter";

// ── Types ──────────────────────────────────────────────────────────────────────
type MetalType = "gold" | "silver" | "bronze";
type AccessoryType = "star" | "oakleaf" | "maple" | "laurel" | "v_device" | "e_device" | "numeral";

interface Stripe {
  id: string;
  color: string;
  weight: number;
}

interface Accessory {
  id: string;
  type: AccessoryType;
  metal: MetalType;
  count: number;
  xPercent: number;
}

interface RibbonDesign {
  stripes: Stripe[];
  accessories: Accessory[];
}

interface RibbonTemplate {
  id: number;
  name: string;
  description: string | null;
  design: RibbonDesign;
  grants: Grant[];
}

interface Grant {
  id: number;
  roster_entry_id: number;
  callsign: string;
  awarded_by: string;
  awarded_at: string;
}

interface RosterEntry {
  id: number;
  callsign: string;
  rankId: number | null;
}

interface GroupInfo {
  id: number;
  name: string;
  roster: RosterEntry[];
}

// ── SVG Ribbon Renderer ────────────────────────────────────────────────────────
const W = 280;
const H = 80;
const SHADOW_SIZE = 3;

function metalGradient(id: string, metal: MetalType) {
  const stops: Record<MetalType, string[]> = {
    gold:   ["#8B6508", "#FFD700", "#DAA520", "#FFD700", "#8B6508"],
    silver: ["#707070", "#D8D8D8", "#A8A8A8", "#D8D8D8", "#707070"],
    bronze: ["#6B3A2A", "#CD7F32", "#A0522D", "#CD7F32", "#6B3A2A"],
  };
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      {stops[metal].map((s, i) => (
        <stop key={i} offset={`${i * 25}%`} stopColor={s} />
      ))}
    </linearGradient>
  );
}

function starPoints(cx: number, cy: number, R = 8, r = 3.5): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = (i % 2 === 0 ? -90 : -54) + i * 36;
    const a = (rad * Math.PI) / 180;
    const dist = i % 2 === 0 ? R : r;
    pts.push(`${cx + dist * Math.cos(a)},${cy + dist * Math.sin(a)}`);
  }
  return pts.join(" ");
}

function AccessorySVG({
  acc,
  cx,
  cy,
  uid,
}: {
  acc: Accessory;
  cx: number;
  cy: number;
  uid: string;
}) {
  const gradId = `grad-${uid}`;
  const fill = `url(#${gradId})`;
  const stroke = acc.metal === "gold" ? "#8B6508" : acc.metal === "silver" ? "#606060" : "#6B3A2A";

  switch (acc.type) {
    case "star": {
      const total = acc.count;
      const step = 18;
      const startX = cx - ((total - 1) * step) / 2;
      return (
        <g>
          <defs>{metalGradient(gradId, acc.metal)}</defs>
          {Array.from({ length: total }).map((_, i) => (
            <polygon
              key={i}
              points={starPoints(startX + i * step, cy)}
              fill={fill}
              stroke={stroke}
              strokeWidth="0.5"
            />
          ))}
        </g>
      );
    }
    case "oakleaf": {
      const total = acc.count;
      const step = 16;
      const startX = cx - ((total - 1) * step) / 2;
      return (
        <g>
          <defs>{metalGradient(gradId, acc.metal)}</defs>
          {Array.from({ length: total }).map((_, i) => (
            <g key={i} transform={`translate(${startX + i * step},${cy})`}>
              <path
                d="M0,-9 C4,-7 9,-3 8,1 C7,5 3,8 0,9 C-3,8 -7,5 -8,1 C-9,-3 -4,-7 0,-9Z M0,-9 L0,9"
                fill={fill}
                stroke={stroke}
                strokeWidth="0.5"
              />
              <line x1="0" y1="-7" x2="0" y2="7" stroke={stroke} strokeWidth="0.6" />
            </g>
          ))}
        </g>
      );
    }
    case "maple": {
      const total = acc.count;
      const step = 18;
      const startX = cx - ((total - 1) * step) / 2;
      return (
        <g>
          <defs>{metalGradient(gradId, acc.metal)}</defs>
          {Array.from({ length: total }).map((_, i) => (
            <g key={i} transform={`translate(${startX + i * step},${cy})`}>
              <path
                d="M0,-9 C1,-6 4,-5 7,-6 C5,-3 6,-1 9,0 C6,1 6,4 4,6 L2,9 L0,7 L-2,9 L-4,6 C-6,4 -6,1 -9,0 C-6,-1 -5,-3 -7,-6 C-4,-5 -1,-6 0,-9Z"
                fill={fill}
                stroke={stroke}
                strokeWidth="0.5"
              />
            </g>
          ))}
        </g>
      );
    }
    case "laurel": {
      const total = acc.count;
      const step = 16;
      const startX = cx - ((total - 1) * step) / 2;
      return (
        <g>
          <defs>{metalGradient(gradId, acc.metal)}</defs>
          {Array.from({ length: total }).map((_, i) => (
            <g key={i} transform={`translate(${startX + i * step},${cy})`}>
              <ellipse rx="4" ry="9" fill={fill} stroke={stroke} strokeWidth="0.5" />
              <ellipse rx="4" ry="9" transform="rotate(20)" fill={fill} stroke={stroke} strokeWidth="0.3" opacity="0.6" />
              <ellipse rx="4" ry="9" transform="rotate(-20)" fill={fill} stroke={stroke} strokeWidth="0.3" opacity="0.6" />
            </g>
          ))}
        </g>
      );
    }
    case "v_device":
      return (
        <g>
          <defs>{metalGradient(gradId, acc.metal)}</defs>
          <text
            x={cx} y={cy + 5}
            textAnchor="middle"
            fontSize="16"
            fontWeight="900"
            fontFamily="serif"
            fill={fill}
            stroke={stroke}
            strokeWidth="0.5"
          >V</text>
        </g>
      );
    case "e_device":
      return (
        <g>
          <defs>{metalGradient(gradId, acc.metal)}</defs>
          <text
            x={cx} y={cy + 5}
            textAnchor="middle"
            fontSize="16"
            fontWeight="900"
            fontFamily="serif"
            fill={fill}
            stroke={stroke}
            strokeWidth="0.5"
          >E</text>
        </g>
      );
    case "numeral":
      return (
        <g>
          <defs>{metalGradient(gradId, acc.metal)}</defs>
          <text
            x={cx} y={cy + 5}
            textAnchor="middle"
            fontSize="14"
            fontWeight="900"
            fontFamily="serif"
            fill={fill}
            stroke={stroke}
            strokeWidth="0.5"
          >{acc.count}</text>
        </g>
      );
    default:
      return null;
  }
}

export function RibbonSVG({
  design,
  width = W,
  height = H,
  shadow = true,
}: {
  design: RibbonDesign;
  width?: number;
  height?: number;
  shadow?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const { stripes, accessories } = design;
  const totalWeight = stripes.reduce((s, x) => s + x.weight, 0) || 1;

  let xCursor = 0;
  const stripeRects = stripes.map((s, i) => {
    const sw = (s.weight / totalWeight) * width;
    const rect = (
      <rect
        key={s.id ?? i}
        x={xCursor}
        y={0}
        width={sw}
        height={height}
        fill={s.color}
      />
    );
    xCursor += sw;
    return rect;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{
        borderRadius: 2,
        boxShadow: shadow
          ? `${SHADOW_SIZE}px ${SHADOW_SIZE}px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)`
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
        {stripes.length === 0 && (
          <rect x="0" y="0" width={width} height={height} fill="#2a2a2a" />
        )}
        {stripeRects}
        {/* Gloss overlay */}
        <rect x="0" y="0" width={width} height={height * 0.4} fill="rgba(255,255,255,0.06)" />
        {/* Accessories */}
        {accessories.map((acc, idx) => {
          const cx = (acc.xPercent / 100) * width;
          const cy = height / 2;
          return (
            <AccessorySVG
              key={acc.id ?? idx}
              acc={acc}
              cx={cx}
              cy={cy}
              uid={`${uid}-${idx}`}
            />
          );
        })}
        {/* Border */}
        <rect
          x="0.5"
          y="0.5"
          width={width - 1}
          height={height - 1}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
          rx="1.5"
        />
      </g>
    </svg>
  );
}

// ── Default design ─────────────────────────────────────────────────────────────
function defaultDesign(): RibbonDesign {
  return {
    stripes: [
      { id: uid(), color: "#1a3a7d", weight: 1 },
      { id: uid(), color: "#ffffff", weight: 0.5 },
      { id: uid(), color: "#c8102e", weight: 1 },
    ],
    accessories: [],
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function RibbonBuilder() {
  const [, setLocation] = useLocation();
  const [groupId, setGroupId] = useState<number | null>(null);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [ribbons, setRibbons] = useState<RibbonTemplate[]>([]);
  const [selectedRibbon, setSelectedRibbon] = useState<RibbonTemplate | null>(null);
  const [design, setDesign] = useState<RibbonDesign>(defaultDesign());
  const [ribbonName, setRibbonName] = useState("New Ribbon");
  const [ribbonDesc, setRibbonDesc] = useState("");
  const [activeTab, setActiveTab] = useState<"stripes" | "accessories" | "grant">("stripes");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

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
    setSelectedRibbon(null);
    setDesign(defaultDesign());
    setRibbonName("New Ribbon");
    setRibbonDesc("");
    setActiveTab("stripes");
  }

  function editRibbon(r: RibbonTemplate) {
    setSelectedRibbon(r);
    setDesign(r.design);
    setRibbonName(r.name);
    setRibbonDesc(r.description ?? "");
    setActiveTab("stripes");
  }

  async function saveRibbon() {
    if (!groupId) return;
    setSaving(true);
    try {
      const payload = { name: ribbonName, description: ribbonDesc, design };
      if (selectedRibbon) {
        await apiFetch(`/api/milsim-groups/${groupId}/ribbons/${selectedRibbon.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        showMsg(true, "Ribbon updated.");
      } else {
        const created = await apiFetch<RibbonTemplate>(
          `/api/milsim-groups/${groupId}/ribbons`,
          { method: "POST", body: JSON.stringify(payload) }
        );
        setSelectedRibbon(created);
        showMsg(true, "Ribbon created.");
      }
      await loadRibbons();
    } catch {
      showMsg(false, "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRibbon(r: RibbonTemplate) {
    if (!groupId || !confirm(`Delete "${r.name}"?`)) return;
    await apiFetch(`/api/milsim-groups/${groupId}/ribbons/${r.id}`, { method: "DELETE" });
    if (selectedRibbon?.id === r.id) newRibbon();
    await loadRibbons();
  }

  // ── Stripe helpers ────────────────────────────────────────────────────────
  function addStripe() {
    setDesign((d) => ({
      ...d,
      stripes: [...d.stripes, { id: uid(), color: "#4ade80", weight: 1 }],
    }));
  }
  function removeStripe(id: string) {
    setDesign((d) => ({ ...d, stripes: d.stripes.filter((s) => s.id !== id) }));
  }
  function moveStripe(id: string, dir: -1 | 1) {
    setDesign((d) => {
      const arr = [...d.stripes];
      const idx = arr.findIndex((s) => s.id === id);
      const next = idx + dir;
      if (next < 0 || next >= arr.length) return d;
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return { ...d, stripes: arr };
    });
  }
  function updateStripe(id: string, patch: Partial<Stripe>) {
    setDesign((d) => ({
      ...d,
      stripes: d.stripes.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }

  // ── Accessory helpers ─────────────────────────────────────────────────────
  function addAccessory(type: AccessoryType) {
    setDesign((d) => ({
      ...d,
      accessories: [
        ...d.accessories,
        { id: uid(), type, metal: "gold", count: 1, xPercent: 50 },
      ],
    }));
    setActiveTab("accessories");
  }
  function removeAccessory(id: string) {
    setDesign((d) => ({ ...d, accessories: d.accessories.filter((a) => a.id !== id) }));
  }
  function updateAccessory(id: string, patch: Partial<Accessory>) {
    setDesign((d) => ({
      ...d,
      accessories: d.accessories.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }

  const ACCESSORY_TYPES: { type: AccessoryType; label: string; hasCount: boolean; hasMetal: boolean }[] = [
    { type: "star",      label: "Star",           hasCount: true,  hasMetal: true },
    { type: "oakleaf",   label: "Oak Leaf Cluster", hasCount: true, hasMetal: true },
    { type: "maple",     label: "Maple Cluster",   hasCount: true,  hasMetal: true },
    { type: "laurel",    label: "Laurel Cluster",  hasCount: true,  hasMetal: true },
    { type: "v_device",  label: "V Device",        hasCount: false, hasMetal: true },
    { type: "e_device",  label: "E Device",        hasCount: false, hasMetal: true },
    { type: "numeral",   label: "Numeral",          hasCount: true,  hasMetal: true },
  ];

  const METALS: { val: MetalType; label: string; color: string }[] = [
    { val: "gold",   label: "Gold",   color: "#FFD700" },
    { val: "silver", label: "Silver", color: "#C0C0C0" },
    { val: "bronze", label: "Bronze", color: "#CD7F32" },
  ];

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </PortalLayout>
    );
  }

  if (!groupId) {
    return (
      <PortalLayout>
        <div className="max-w-lg mx-auto mt-20 text-center space-y-4">
          <Award className="w-10 h-10 text-primary mx-auto" />
          <p className="font-display text-lg uppercase tracking-widest">No MilSim Group Found</p>
          <p className="text-muted-foreground text-sm">You need to own a MilSim group to manage ribbons.</p>
          <button
            onClick={() => setLocation("/portal/milsim")}
            className="mf-btn-primary text-xs px-4 py-2"
          >
            Go to MilSim Management
          </button>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <button
            onClick={() => setLocation("/portal/milsim")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display font-black uppercase tracking-widest text-lg text-primary">
              Ribbon & Commendation Builder
            </h1>
            <p className="text-muted-foreground text-xs">
              Design ribbon bars, add devices & accessories, award to your operators
            </p>
          </div>
          <div className="ml-auto">
            <button onClick={newRibbon} className="mf-btn-primary text-xs px-4 py-2 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> New Ribbon
            </button>
          </div>
        </div>

        {/* Status message */}
        <AnimatePresence>
          {msg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-center gap-2 p-3 border text-sm ${msg.ok ? "border-primary/40 bg-primary/5 text-primary" : "border-red-500/40 bg-red-500/5 text-red-400"}`}
            >
              {msg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* ── LEFT: Ribbon Library ── */}
          <div className="space-y-3">
            <h2 className="font-display text-xs uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
              Ribbon Library
            </h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {ribbons.length === 0 && (
                <p className="text-muted-foreground text-xs text-center py-6">
                  No ribbons created yet
                </p>
              )}
              {ribbons.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`border cursor-pointer p-3 space-y-2 hover:border-primary/40 transition-colors ${
                    selectedRibbon?.id === r.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  onClick={() => editRibbon(r)}
                >
                  <RibbonSVG design={r.design} width={220} height={62} />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-xs uppercase tracking-wider truncate max-w-[140px]">
                        {r.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {r.grants.length} awarded
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteRibbon(r); }}
                      className="text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Builder ── */}
          <div className="space-y-5">
            {/* Ribbon preview */}
            <div className="border border-border p-6 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <input
                  value={ribbonName}
                  onChange={(e) => setRibbonName(e.target.value)}
                  className="mf-input text-sm font-display font-bold uppercase tracking-widest max-w-xs"
                  placeholder="Ribbon name..."
                />
                <button
                  onClick={saveRibbon}
                  disabled={saving}
                  className="mf-btn-primary text-xs px-5 py-2.5 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {selectedRibbon ? "Update" : "Save"} Ribbon
                </button>
              </div>

              {/* Large preview */}
              <div className="flex items-center justify-center py-6 bg-[#0a0f0a] rounded-sm">
                <div className="space-y-3 text-center">
                  <RibbonSVG design={design} width={W} height={H} />
                  <p className="text-muted-foreground text-xs uppercase tracking-widest">
                    {ribbonName}
                  </p>
                </div>
              </div>

              {/* Description */}
              <textarea
                value={ribbonDesc}
                onChange={(e) => setRibbonDesc(e.target.value)}
                className="mf-input text-sm w-full resize-none"
                rows={2}
                placeholder="Description / criteria for this ribbon..."
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
                      activeTab === t
                        ? "text-primary border-b-2 border-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "stripes" && "Stripe Editor"}
                    {t === "accessories" && "Accessories"}
                    {t === "grant" && "Award to Operators"}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {/* ── STRIPES TAB ── */}
                {activeTab === "stripes" && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground text-xs">
                      Build stripe pattern left-to-right. Use the weight slider to control relative width.
                    </p>
                    <div className="space-y-3">
                      {design.stripes.map((stripe, idx) => (
                        <motion.div
                          key={stripe.id}
                          layout
                          className="flex items-center gap-3 p-3 border border-border bg-card"
                        >
                          {/* Color swatch/picker */}
                          <div className="relative flex-shrink-0">
                            <div
                              className="w-9 h-9 rounded-sm border border-border cursor-pointer"
                              style={{ background: stripe.color }}
                            />
                            <input
                              type="color"
                              value={stripe.color}
                              onChange={(e) => updateStripe(stripe.id, { color: e.target.value })}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              title="Pick stripe colour"
                            />
                          </div>

                          {/* Color hex input */}
                          <input
                            value={stripe.color.toUpperCase()}
                            onChange={(e) => updateStripe(stripe.id, { color: e.target.value })}
                            className="mf-input text-xs w-24 font-mono"
                            maxLength={7}
                          />

                          {/* Weight slider */}
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Width</span>
                              <span>{stripe.weight.toFixed(1)}×</span>
                            </div>
                            <input
                              type="range"
                              min="0.2"
                              max="5"
                              step="0.1"
                              value={stripe.weight}
                              onChange={(e) =>
                                updateStripe(stripe.id, { weight: parseFloat(e.target.value) })
                              }
                              className="w-full accent-primary h-1"
                            />
                          </div>

                          {/* Reorder */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => moveStripe(stripe.id, -1)}
                              disabled={idx === 0}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moveStripe(stripe.id, 1)}
                              disabled={idx === design.stripes.length - 1}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => removeStripe(stripe.id)}
                            className="text-muted-foreground hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
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
                    {/* Quick-add buttons */}
                    <div>
                      <p className="text-muted-foreground text-xs mb-3">
                        Click to add an accessory to the ribbon. Drag the position slider to place it.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ACCESSORY_TYPES.map((at) => (
                          <button
                            key={at.type}
                            onClick={() => addAccessory(at.type)}
                            className="mf-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                          >
                            <Plus className="w-3 h-3" /> {at.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Accessory list */}
                    {design.accessories.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-xs border border-dashed border-border">
                        No accessories added yet
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {design.accessories.map((acc) => {
                          const meta = ACCESSORY_TYPES.find((x) => x.type === acc.type)!;
                          return (
                            <motion.div
                              key={acc.id}
                              layout
                              className="border border-border p-4 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-display text-xs uppercase tracking-widest text-primary">
                                    {meta.label}
                                  </span>
                                </div>
                                <button
                                  onClick={() => removeAccessory(acc.id)}
                                  className="text-muted-foreground hover:text-red-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Metal selector */}
                              {meta.hasMetal && (
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground text-xs w-16">Metal</span>
                                  <div className="flex gap-2">
                                    {METALS.map((m) => (
                                      <button
                                        key={m.val}
                                        onClick={() => updateAccessory(acc.id, { metal: m.val })}
                                        className={`px-3 py-1 text-xs font-display uppercase tracking-wider border transition-colors ${
                                          acc.metal === m.val
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border text-muted-foreground hover:border-primary/40"
                                        }`}
                                      >
                                        <span style={{ color: m.color }} className="mr-1">●</span>
                                        {m.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Count */}
                              {meta.hasCount && acc.type !== "numeral" && (
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground text-xs w-16">Count</span>
                                  <div className="flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                      <button
                                        key={n}
                                        onClick={() => updateAccessory(acc.id, { count: n })}
                                        className={`w-7 h-7 text-xs border transition-colors ${
                                          acc.count === n
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border text-muted-foreground hover:border-primary/40"
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
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground text-xs w-16">Numeral</span>
                                  <div className="flex gap-1.5">
                                    {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                                      <button
                                        key={n}
                                        onClick={() => updateAccessory(acc.id, { count: n })}
                                        className={`w-7 h-7 text-xs border transition-colors ${
                                          acc.count === n
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border text-muted-foreground hover:border-primary/40"
                                        }`}
                                      >
                                        {n}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Position slider */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Position on ribbon</span>
                                  <span>{acc.xPercent}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="5"
                                  max="95"
                                  step="1"
                                  value={acc.xPercent}
                                  onChange={(e) =>
                                    updateAccessory(acc.id, { xPercent: parseInt(e.target.value) })
                                  }
                                  className="w-full accent-primary h-1"
                                />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── GRANT TAB ── */}
                {activeTab === "grant" && (
                  <GrantTab
                    ribbon={selectedRibbon}
                    groupId={groupId}
                    roster={roster}
                    onUpdate={loadRibbons}
                    showMsg={showMsg}
                  />
                )}
              </div>
            </div>

            {/* Ribbon Rack Preview */}
            {ribbons.length > 1 && (
              <div className="border border-border p-5 space-y-4">
                <h3 className="font-display text-xs uppercase tracking-widest text-muted-foreground">
                  Full Ribbon Rack Preview
                </h3>
                <RibbonRack ribbons={ribbons} />
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

// ── Ribbon Rack ────────────────────────────────────────────────────────────────
function RibbonRack({ ribbons }: { ribbons: RibbonTemplate[] }) {
  const perRow = 3;
  const rw = 88;
  const rh = 25;
  const gap = 4;
  const rows = Math.ceil(ribbons.length / perRow);
  const totalW = perRow * rw + (perRow - 1) * gap;
  const totalH = rows * rh + (rows - 1) * gap;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      width={totalW * 2}
      height={totalH * 2}
      style={{ imageRendering: "pixelated" }}
    >
      {ribbons.map((r, idx) => {
        const col = idx % perRow;
        const row = Math.floor(idx / perRow);
        const x = col * (rw + gap);
        const y = row * (rh + gap);
        return (
          <g key={r.id} transform={`translate(${x},${y})`}>
            <RibbonSVGInline design={r.design} width={rw} height={rh} />
          </g>
        );
      })}
    </svg>
  );
}

function RibbonSVGInline({ design, width, height }: { design: RibbonDesign; width: number; height: number }) {
  const uid2 = Math.random().toString(36).slice(2, 7);
  const { stripes, accessories } = design;
  const totalWeight = stripes.reduce((s, x) => s + x.weight, 0) || 1;
  let xCursor = 0;
  const stripeRects = stripes.map((s, i) => {
    const sw = (s.weight / totalWeight) * width;
    const rect = <rect key={i} x={xCursor} y={0} width={sw} height={height} fill={s.color} />;
    xCursor += sw;
    return rect;
  });
  return (
    <>
      <clipPath id={`cr-${uid2}`}>
        <rect x="0" y="0" width={width} height={height} rx="1" />
      </clipPath>
      <g clipPath={`url(#cr-${uid2})`}>
        {stripeRects}
        {accessories.map((acc, idx) => {
          const scale = height / H;
          const cx = (acc.xPercent / 100) * width;
          const cy = height / 2;
          return (
            <g key={idx} transform={`translate(${cx},${cy}) scale(${scale})`}>
              <AccessorySVG acc={acc} cx={0} cy={0} uid={`rack-${uid2}-${idx}`} />
            </g>
          );
        })}
        <rect x="0.5" y="0.5" width={width - 1} height={height - 1} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" rx="0.5" />
      </g>
    </>
  );
}

// ── Grant Tab ─────────────────────────────────────────────────────────────────
function GrantTab({
  ribbon,
  groupId,
  roster,
  onUpdate,
  showMsg,
}: {
  ribbon: RibbonTemplate | null;
  groupId: number;
  roster: RosterEntry[];
  onUpdate: () => void;
  showMsg: (ok: boolean, t: string) => void;
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
    } catch {
      showMsg(false, "Failed to award ribbon.");
    } finally {
      setGranting(false);
    }
  }

  async function revoke(grantId: number) {
    await apiFetch(
      `/api/milsim-groups/${groupId}/ribbons/${ribbon!.id}/grant/${grantId}`,
      { method: "DELETE" }
    );
    showMsg(true, "Ribbon revoked.");
    await onUpdate();
  }

  const grantedIds = new Set(ribbon.grants.map((g) => g.roster_entry_id));
  const available = roster.filter((r) => !grantedIds.has(r.id));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-muted-foreground text-xs mb-3">
          Award <span className="text-primary">{ribbon.name}</span> to operators on your roster.
        </p>
        <div className="flex gap-2">
          <select
            value={selectedRosterId}
            onChange={(e) => setSelectedRosterId(Number(e.target.value) || "")}
            className="mf-input text-sm flex-1"
          >
            <option value="">Select operator...</option>
            {available.map((r) => (
              <option key={r.id} value={r.id}>{r.callsign}</option>
            ))}
          </select>
          <button
            onClick={grant}
            disabled={granting || !selectedRosterId}
            className="mf-btn-primary text-xs px-4 py-2 flex items-center gap-2 disabled:opacity-50"
          >
            {granting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
            Award
          </button>
        </div>
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
                <p className="text-xs text-muted-foreground">
                  Awarded by {g.awarded_by} · {new Date(g.awarded_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => revoke(g.id)}
                className="text-xs text-muted-foreground hover:text-red-400 transition-colors border border-transparent hover:border-red-400/30 px-2 py-1"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
