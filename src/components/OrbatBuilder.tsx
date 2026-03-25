/**
 * NATO ORBAT Builder
 * NATO APP-6 standard. One uniform system. No switcher.
 */

import React, { useState, useCallback, useRef } from "react";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Save,
  ZoomIn, ZoomOut, Settings, X, Download,
} from "lucide-react";

// ─── Echelons ─────────────────────────────────────────────────────────────────

export const NATO_ECHELONS = [
  { id: "fireteam",  label: "Fire Team"  },
  { id: "squad",     label: "Squad"      },
  { id: "section",   label: "Section"    },
  { id: "platoon",   label: "Platoon"    },
  { id: "company",   label: "Company"    },
  { id: "battalion", label: "Battalion"  },
  { id: "regiment",  label: "Regiment"   },
  { id: "brigade",   label: "Brigade"    },
  { id: "division",  label: "Division"   },
  { id: "corps",     label: "Corps"      },
];

// ─── Unit Types ───────────────────────────────────────────────────────────────

export const NATO_UNIT_TYPES = [
  // Command
  { id: "hq",             label: "HQ / Command",        category: "Command"  },
  { id: "command_post",   label: "Command Post",         category: "Command"  },
  // Infantry
  { id: "infantry",       label: "Infantry",             category: "Infantry" },
  { id: "light_infantry", label: "Light Infantry",       category: "Infantry" },
  { id: "mech_infantry",  label: "Mechanised Infantry",  category: "Infantry" },
  { id: "airborne",       label: "Airborne",             category: "Infantry" },
  { id: "ranger",         label: "Ranger / Recon",       category: "Infantry" },
  { id: "special_forces", label: "Special Forces",       category: "Infantry" },
  { id: "anti_armor",     label: "Anti-Armour",          category: "Infantry" },
  // Armour
  { id: "armour",         label: "Armour / Tank",        category: "Armour"   },
  { id: "apc",            label: "APC",                  category: "Armour"   },
  { id: "ifv",            label: "IFV",                  category: "Armour"   },
  { id: "cavalry",        label: "Cavalry / Recce",      category: "Armour"   },
  // Aviation
  { id: "aviation",       label: "Aviation",             category: "Aviation" },
  { id: "attack_helo",    label: "Attack Helicopter",    category: "Aviation" },
  { id: "transport_helo", label: "Transport Helicopter", category: "Aviation" },
  { id: "uav",            label: "UAV / Drone",          category: "Aviation" },
  // Fires
  { id: "artillery",      label: "Artillery",            category: "Fires"    },
  { id: "mortar",         label: "Mortar",               category: "Fires"    },
  // Support
  { id: "engineers",      label: "Engineers",            category: "Support"  },
  { id: "logistics",      label: "Logistics / Supply",   category: "Support"  },
  { id: "medical",        label: "Medical",              category: "Support"  },
  { id: "signals",        label: "Signals / Comms",      category: "Support"  },
  { id: "intelligence",   label: "Intelligence",         category: "Support"  },
  { id: "mp",             label: "Military Police",      category: "Support"  },
  { id: "sof",            label: "SOF / JTAC",           category: "Support"  },
  { id: "cbrn",           label: "CBRN",                 category: "Support"  },
  { id: "maintenance",    label: "Maintenance",          category: "Support"  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrbatNode {
  id: string;
  name: string;
  callsign?: string;
  unitType: string;
  echelon: string;
  slots: number;
  children: OrbatNode[];
  collapsed?: boolean;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Echelon marks drawn ABOVE the box ────────────────────────────────────────
// fireteam=• squad=•• section=••• platoon=| company=|| battalion=|||
// regiment=X brigade=XX division=XXX corps=XXXX

function EchelonMark({ id, cx, topY, sw }: { id: string; cx: number; topY: number; sw: number }) {
  const lineH = sw * 5;
  switch (id) {
    case "fireteam":
      return <text x={cx} y={topY - 1} textAnchor="middle" fontSize={sw * 4} fontFamily="serif" fill="#111">•</text>;
    case "squad":
      return <text x={cx} y={topY - 1} textAnchor="middle" fontSize={sw * 4} fontFamily="serif" fill="#111">••</text>;
    case "section":
      return <text x={cx} y={topY - 1} textAnchor="middle" fontSize={sw * 4} fontFamily="serif" fill="#111">•••</text>;
    case "platoon":
      return <line x1={cx} y1={topY - lineH} x2={cx} y2={topY} stroke="#111" strokeWidth={sw} />;
    case "company":
      return <>
        <line x1={cx - sw * 2.5} y1={topY - lineH} x2={cx - sw * 2.5} y2={topY} stroke="#111" strokeWidth={sw} />
        <line x1={cx + sw * 2.5} y1={topY - lineH} x2={cx + sw * 2.5} y2={topY} stroke="#111" strokeWidth={sw} />
      </>;
    case "battalion":
      return <>
        <line x1={cx - sw * 4}  y1={topY - lineH} x2={cx - sw * 4}  y2={topY} stroke="#111" strokeWidth={sw} />
        <line x1={cx}            y1={topY - lineH} x2={cx}            y2={topY} stroke="#111" strokeWidth={sw} />
        <line x1={cx + sw * 4}  y1={topY - lineH} x2={cx + sw * 4}  y2={topY} stroke="#111" strokeWidth={sw} />
      </>;
    case "regiment":
      return <text x={cx} y={topY - 1} textAnchor="middle" fontSize={sw * 5.5} fontFamily="serif" fontWeight="bold" fill="#111">X</text>;
    case "brigade":
      return <text x={cx} y={topY - 1} textAnchor="middle" fontSize={sw * 5.5} fontFamily="serif" fontWeight="bold" fill="#111">XX</text>;
    case "division":
      return <text x={cx} y={topY - 1} textAnchor="middle" fontSize={sw * 5.5} fontFamily="serif" fontWeight="bold" fill="#111">XXX</text>;
    case "corps":
      return <text x={cx} y={topY - 1} textAnchor="middle" fontSize={sw * 5.5} fontFamily="serif" fontWeight="bold" fill="#111">XXXX</text>;
    default:
      return null;
  }
}

// ─── NATO APP-6 interior symbols ──────────────────────────────────────────────
// Drawn inside a 70×44 box (x:5-75, y:3-47) centred at (40, 25)

function UnitInterior({ type, sw }: { type: string; sw: number }) {
  switch (type) {

    // ── INFANTRY (diagonal cross) ─────────────────────────────────────────────
    case "infantry":
    case "light_infantry":
      return <>
        <line x1={8}  y1={6}  x2={72} y2={44} stroke="#111" strokeWidth={sw} />
        <line x1={72} y1={6}  x2={8}  y2={44} stroke="#111" strokeWidth={sw} />
      </>;

    // ── MECHANISED INFANTRY (diagonal cross + oval) ───────────────────────────
    case "mech_infantry":
    case "ifv":
      return <>
        <line x1={8}  y1={6}  x2={72} y2={44} stroke="#111" strokeWidth={sw} />
        <line x1={72} y1={6}  x2={8}  y2={44} stroke="#111" strokeWidth={sw} />
        <ellipse cx={40} cy={25} rx={20} ry={11} fill="none" stroke="#111" strokeWidth={sw} />
      </>;

    // ── AIRBORNE (diagonal cross + arc below) ────────────────────────────────
    case "airborne":
      return <>
        <line x1={8}  y1={6}  x2={72} y2={44} stroke="#111" strokeWidth={sw} />
        <line x1={72} y1={6}  x2={8}  y2={44} stroke="#111" strokeWidth={sw} />
        <path d="M 18,42 Q 40,20 62,42" fill="none" stroke="#111" strokeWidth={sw} />
      </>;

    // ── SPECIAL FORCES (diagonal cross + diamond) ────────────────────────────
    case "special_forces":
    case "sof":
      return <>
        <line x1={8}  y1={6}  x2={72} y2={44} stroke="#111" strokeWidth={sw} />
        <line x1={72} y1={6}  x2={8}  y2={44} stroke="#111" strokeWidth={sw} />
        <polygon points="40,10 58,25 40,40 22,25" fill="none" stroke="#111" strokeWidth={sw} />
      </>;

    // ── RANGER (diagonal cross + chevron) ────────────────────────────────────
    case "ranger":
      return <>
        <line x1={8}  y1={6}  x2={72} y2={44} stroke="#111" strokeWidth={sw} />
        <line x1={72} y1={6}  x2={8}  y2={44} stroke="#111" strokeWidth={sw} />
        <polyline points="28,40 40,30 52,40" fill="none" stroke="#111" strokeWidth={sw} />
      </>;

    // ── ANTI-ARMOUR (arrow pointing left) ────────────────────────────────────
    case "anti_armor":
      return <>
        <line x1={18} y1={25} x2={62} y2={25} stroke="#111" strokeWidth={sw + 0.5} />
        <polyline points="30,16 18,25 30,34" fill="none" stroke="#111" strokeWidth={sw + 0.5} />
        <line x1={52} y1={16} x2={64} y2={25} stroke="#111" strokeWidth={sw} />
        <line x1={52} y1={34} x2={64} y2={25} stroke="#111" strokeWidth={sw} />
      </>;

    // ── ARMOUR / TANK (oval) ──────────────────────────────────────────────────
    case "armour":
      return <ellipse cx={40} cy={25} rx={24} ry={14} fill="none" stroke="#111" strokeWidth={sw} />;

    // ── APC (oval) ────────────────────────────────────────────────────────────
    case "apc":
      return <>
        <ellipse cx={40} cy={25} rx={24} ry={14} fill="none" stroke="#111" strokeWidth={sw} />
        <line x1={30} y1={25} x2={50} y2={25} stroke="#111" strokeWidth={sw} />
      </>;

    // ── CAVALRY / RECCE (diagonal slash) ─────────────────────────────────────
    case "cavalry":
      return <line x1={14} y1={44} x2={66} y2={6} stroke="#111" strokeWidth={sw + 0.5} />;

    // ── HQ / COMMAND POST (horizontal line through centre) ───────────────────
    case "hq":
    case "command_post":
      return <>
        <line x1={10} y1={25} x2={70} y2={25} stroke="#111" strokeWidth={sw + 0.5} />
        <line x1={40} y1={10} x2={40} y2={40} stroke="#111" strokeWidth={sw + 0.5} />
      </>;

    // ── ARTILLERY (solid filled circle) ──────────────────────────────────────
    case "artillery":
      return <circle cx={40} cy={25} r={13} fill="#111" />;

    // ── MORTAR (small solid circle) ──────────────────────────────────────────
    case "mortar":
      return <>
        <circle cx={40} cy={25} r={13} fill="none" stroke="#111" strokeWidth={sw} />
        <circle cx={40} cy={25} r={6} fill="#111" />
      </>;

    // ── AVIATION (infinity / figure-8) ───────────────────────────────────────
    case "aviation":
      return <path
        d="M 16,25 C 16,14 28,14 40,25 C 52,36 64,36 64,25 C 64,14 52,14 40,25 C 28,36 16,36 16,25 Z"
        fill="none" stroke="#111" strokeWidth={sw}
      />;

    // ── ATTACK HELICOPTER (infinity + arrow up) ───────────────────────────────
    case "attack_helo":
      return <>
        <path
          d="M 16,28 C 16,18 28,18 40,28 C 52,38 64,38 64,28 C 64,18 52,18 40,28 C 28,38 16,38 16,28 Z"
          fill="none" stroke="#111" strokeWidth={sw}
        />
        <line x1={40} y1={22} x2={40} y2={8} stroke="#111" strokeWidth={sw} />
        <polyline points="34,14 40,8 46,14" fill="none" stroke="#111" strokeWidth={sw} />
      </>;

    // ── TRANSPORT HELICOPTER (infinity + horizontal bar top) ──────────────────
    case "transport_helo":
      return <>
        <path
          d="M 16,28 C 16,18 28,18 40,28 C 52,38 64,38 64,28 C 64,18 52,18 40,28 C 28,38 16,38 16,28 Z"
          fill="none" stroke="#111" strokeWidth={sw}
        />
        <line x1={26} y1={12} x2={54} y2={12} stroke="#111" strokeWidth={sw} />
      </>;

    // ── UAV (cross + circle) ──────────────────────────────────────────────────
    case "uav":
      return <>
        <line x1={22} y1={25} x2={58} y2={25} stroke="#111" strokeWidth={sw + 0.5} />
        <line x1={40} y1={11} x2={40} y2={39} stroke="#111" strokeWidth={sw + 0.5} />
        <circle cx={40} cy={25} r={5} fill="none" stroke="#111" strokeWidth={sw} />
      </>;

    // ── ENGINEERS (castle / battlement) ──────────────────────────────────────
    case "engineers":
      return <>
        <line x1={14} y1={36} x2={66} y2={36} stroke="#111" strokeWidth={sw} />
        <rect x={18} y={18} width={9}  height={18} fill="white" stroke="#111" strokeWidth={sw} />
        <rect x={35} y={18} width={9}  height={18} fill="white" stroke="#111" strokeWidth={sw} />
        <rect x={52} y={18} width={9}  height={18} fill="white" stroke="#111" strokeWidth={sw} />
        <line x1={14} y1={18} x2={66} y2={18} stroke="#111" strokeWidth={sw} />
      </>;

    // ── LOGISTICS (open circle) ───────────────────────────────────────────────
    case "logistics":
      return <circle cx={40} cy={25} r={14} fill="none" stroke="#111" strokeWidth={sw} />;

    // ── MEDICAL (cross — bold) ────────────────────────────────────────────────
    case "medical":
      return <>
        <line x1={40} y1={9}  x2={40} y2={41} stroke="#111" strokeWidth={sw * 3.5} />
        <line x1={22} y1={25} x2={58} y2={25} stroke="#111" strokeWidth={sw * 3.5} />
      </>;

    // ── SIGNALS (sine wave) ───────────────────────────────────────────────────
    case "signals":
      return <path
        d="M 10,25 Q 20,10 30,25 Q 40,40 50,25 Q 60,10 70,25"
        fill="none" stroke="#111" strokeWidth={sw + 0.5}
      />;

    // ── INTELLIGENCE (eye) ────────────────────────────────────────────────────
    case "intelligence":
      return <>
        <path d="M 10,25 Q 40,6 70,25 Q 40,44 10,25 Z" fill="none" stroke="#111" strokeWidth={sw} />
        <circle cx={40} cy={25} r={8} fill="none" stroke="#111" strokeWidth={sw} />
        <circle cx={40} cy={25} r={3} fill="#111" />
      </>;

    // ── MILITARY POLICE (MP text) ─────────────────────────────────────────────
    case "mp":
      return <text x={40} y={33} textAnchor="middle" fontSize={18} fontFamily="serif" fontWeight="bold" fill="#111">MP</text>;

    // ── CBRN (circle + hazard lines) ─────────────────────────────────────────
    case "cbrn":
      return <>
        <circle cx={40} cy={25} r={14} fill="none" stroke="#111" strokeWidth={sw} />
        <line x1={40} y1={11} x2={40} y2={39} stroke="#111" strokeWidth={sw} />
        <line x1={26} y1={25} x2={54} y2={25} stroke="#111" strokeWidth={sw} />
        <line x1={30} y1={15} x2={50} y2={35} stroke="#111" strokeWidth={sw} />
        <line x1={50} y1={15} x2={30} y2={35} stroke="#111" strokeWidth={sw} />
      </>;

    // ── MAINTENANCE (wrench / circle + slash) ─────────────────────────────────
    case "maintenance":
      return <>
        <circle cx={40} cy={25} r={14} fill="none" stroke="#111" strokeWidth={sw} />
        <line x1={30} y1={15} x2={50} y2={35} stroke="#111" strokeWidth={sw * 2} />
      </>;

    // ── FALLBACK ──────────────────────────────────────────────────────────────
    default:
      return <>
        <line x1={8}  y1={6}  x2={72} y2={44} stroke="#111" strokeWidth={sw} />
        <line x1={72} y1={6}  x2={8}  y2={44} stroke="#111" strokeWidth={sw} />
      </>;
  }
}

// ─── MilSymbol component ──────────────────────────────────────────────────────

function MilSymbol({ unitType, echelon, name, callsign, size = 60 }: {
  unitType: string;
  echelon: string;
  name?: string;
  callsign?: string;
  size?: number;
}) {
  const W = size;
  const H = Math.round(size * 0.625);         // box height = 62.5% of width
  const sw = Math.max(1.2, size / 38);        // stroke width scales with size
  const echelonSpace = size * 0.32;           // vertical space above box for echelon marks

  // SVG coordinate system: 80 wide, (50 + echelonSpace_scaled) tall
  const vbEchelon = echelonSpace * (80 / W);
  const totalVbH = 50 + vbEchelon + 16;       // +16 for name/callsign below box

  return (
    <svg
      width={W}
      height={Math.round(H + echelonSpace + (name ? size * 0.3 : 0))}
      viewBox={`0 0 80 ${totalVbH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      {/* Echelon mark above box */}
      <EchelonMark id={echelon} cx={40} topY={vbEchelon} sw={sw} />

      {/* Main NATO box */}
      <g transform={`translate(0, ${vbEchelon})`}>
        <rect x={5} y={3} width={70} height={44} rx={0} fill="white" stroke="#111" strokeWidth={sw} />
        <UnitInterior type={unitType} sw={sw} />
      </g>

      {/* Callsign above box (top-left) */}
      {callsign && (
        <text x={5} y={vbEchelon - 2} fontSize={sw * 3.5} fontFamily="monospace" fill="#555">{callsign}</text>
      )}

      {/* Unit name below box */}
      {name && (
        <text
          x={40} y={vbEchelon + 50 + 4}
          textAnchor="middle"
          fontSize={sw * 3.8}
          fontFamily="monospace"
          fontWeight="bold"
          fill="#111"
        >{name}</text>
      )}
    </svg>
  );
}

// ─── Node Editor ──────────────────────────────────────────────────────────────

function NodeEditor({ node, onSave, onClose }: { node: OrbatNode; onSave: (n: OrbatNode) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<OrbatNode>({ ...node });
  const categories = Array.from(new Set(NATO_UNIT_TYPES.map(u => u.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="font-display font-black uppercase tracking-wider text-sm">Edit Unit Node</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Live preview */}
          <div className="flex justify-center py-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <MilSymbol unitType={draft.unitType} echelon={draft.echelon} name={draft.name || "Unit"} callsign={draft.callsign} size={72} />
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Unit Name</label>
            <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. 1st Platoon, Alpha Company" />
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Callsign</label>
            <input value={draft.callsign || ""} onChange={e => setDraft(d => ({ ...d, callsign: e.target.value }))}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. BRAVO-1" />
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Unit Type</label>
            {categories.map(cat => (
              <div key={cat} className="mb-3">
                <div className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground/60 mb-1.5 px-1">{cat}</div>
                <div className="flex flex-wrap gap-1.5">
                  {NATO_UNIT_TYPES.filter(u => u.category === cat).map(u => (
                    <button key={u.id} onClick={() => setDraft(d => ({ ...d, unitType: u.id }))}
                      className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded border transition-all ${draft.unitType === u.id ? "bg-primary/20 border-primary/60 text-primary font-bold" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
                      <MilSymbol unitType={u.id} echelon="platoon" size={32} />
                      <span className="text-[9px] whitespace-nowrap">{u.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Echelon</label>
            <div className="flex flex-wrap gap-1">
              {NATO_ECHELONS.map(e => (
                <button key={e.id} onClick={() => setDraft(d => ({ ...d, echelon: e.id }))}
                  className={`px-2 py-1 text-[11px] rounded border transition-all ${draft.echelon === e.id ? "bg-primary/20 border-primary/60 text-primary font-bold" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Manning Slots</label>
            <input type="number" min={1} max={999} value={draft.slots}
              onChange={e => setDraft(d => ({ ...d, slots: parseInt(e.target.value) || 1 }))}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-border sticky bottom-0 bg-card">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button onClick={() => { onSave(draft); onClose(); }}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-bold hover:bg-primary/90 transition-colors">
            Save Node
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Org-chart layout engine ─────────────────────────────────────────────────

const NODE_W  = 110;
const NODE_H  = 112;
const V_GAP   = 64;
const H_GAP   = 18;
const TREE_SEP = 64;

interface LayoutNode {
  node: OrbatNode;
  x: number;
  y: number;
  children: LayoutNode[];
}

function leafCount(node: OrbatNode): number {
  if (node.collapsed || !node.children.length) return 1;
  return node.children.reduce((s, c) => s + leafCount(c), 0);
}

function layoutTree(node: OrbatNode, startX: number, depth: number): LayoutNode {
  const children: LayoutNode[] = [];
  let usedW = 0;

  if (!node.collapsed && node.children.length) {
    for (const child of node.children) {
      const slotW = leafCount(child) * (NODE_W + H_GAP);
      children.push(layoutTree(child, startX + usedW, depth + 1));
      usedW += slotW;
    }
  }

  const myW = usedW || (NODE_W + H_GAP);
  return {
    node,
    x: startX + myW / 2,
    y: depth * (NODE_H + V_GAP),
    children,
  };
}

function flattenLayout(root: LayoutNode) {
  const nodes: LayoutNode[] = [];
  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];

  function walk(ln: LayoutNode) {
    nodes.push(ln);
    const parentBottom = ln.y + NODE_H;
    const midY = parentBottom + V_GAP / 2;
    for (const child of ln.children) {
      edges.push({ x1: ln.x,    y1: parentBottom, x2: ln.x,    y2: midY    });
      edges.push({ x1: ln.x,    y1: midY,          x2: child.x, y2: midY    });
      edges.push({ x1: child.x, y1: midY,          x2: child.x, y2: child.y });
      walk(child);
    }
  }
  walk(root);
  return { nodes, edges };
}

function treeExtent(root: LayoutNode): { w: number; h: number } {
  let maxX = 0, maxY = 0;
  function walk(ln: LayoutNode) {
    if (ln.x + NODE_W / 2 > maxX) maxX = ln.x + NODE_W / 2;
    if (ln.y + NODE_H > maxY)     maxY = ln.y + NODE_H;
    ln.children.forEach(walk);
  }
  walk(root);
  return { w: maxX + H_GAP, h: maxY + 32 };
}

// ─── Org-chart card ────────────────────────────────────────────────────────────

function OrgCard({
  ln, onEdit, onAddChild, onDelete, onDuplicate, onToggle, readOnly,
}: {
  ln: LayoutNode;
  onEdit: (n: OrbatNode) => void;
  onAddChild: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (n: OrbatNode) => void;
  onToggle: (id: string) => void;
  readOnly: boolean;
}) {
  const { node, x, y } = ln;
  const [hovered, setHovered] = React.useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const modBadge = node.reinforcedReduced === "reinforced" ? "(+)"
    : node.reinforcedReduced === "reduced" ? "(−)"
    : node.reinforcedReduced === "reinforcedAndReduced" ? "(±)"
    : null;

  return (
    <div
      style={{ position: "absolute", left: x - NODE_W / 2, top: y, width: NODE_W }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Action toolbar above card */}
      {hovered && !readOnly && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-popover border border-border rounded-md px-1 py-0.5 shadow-xl z-30 whitespace-nowrap">
          <button onClick={e => { e.stopPropagation(); onAddChild(node.id); }}
            className="p-1 rounded hover:bg-primary/20 hover:text-primary text-muted-foreground" title="Add child">
            <Plus className="w-3 h-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDuplicate(node); }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Duplicate">
            <Copy className="w-3 h-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(node.id); }}
            className="p-1 rounded hover:bg-destructive/20 hover:text-destructive text-muted-foreground" title="Delete">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Card body */}
      <div
        onClick={() => onEdit(node)}
        className={`flex flex-col items-center gap-1 p-2 rounded-lg border cursor-pointer transition-all select-none
          ${hovered ? "border-primary/70 bg-muted/40 shadow-lg shadow-primary/10" : "border-border bg-card hover:border-border/80"}`}
        style={{ minHeight: NODE_H - 4 }}
      >
        <div className="flex items-center justify-center flex-shrink-0" style={{ minHeight: 54 }}>
          <MilSymbolSvg node={node} size={46} />
        </div>
        <div className="text-center w-full">
          <div className="text-[10px] font-bold leading-tight text-foreground line-clamp-2" title={node.label}>
            {node.label || "Unnamed"}
          </div>
          {modBadge && <div className="text-[9px] font-mono text-muted-foreground">{modBadge}</div>}
          {node.hqTfDummy !== "0" && (
            <div className="text-[8px] font-mono text-yellow-400 uppercase leading-tight">
              {HQ_TF_DUMMY.find(h => h.id === node.hqTfDummy)?.label}
            </div>
          )}
          {node.status === "1" && <div className="text-[8px] font-mono text-purple-400 uppercase">Planned</div>}
        </div>
      </div>

      {/* Expand/collapse button on bottom edge */}
      {hasChildren && (
        <button
          onClick={e => { e.stopPropagation(); onToggle(node.id); }}
          title={node.collapsed ? "Expand" : "Collapse"}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10
            w-6 h-6 rounded-full bg-card border border-border shadow
            flex items-center justify-center hover:border-primary/60 hover:bg-muted transition-all"
        >
          {node.collapsed
            ? <ChevronDown className="w-3 h-3 text-muted-foreground" />
            : <ChevronRight className="w-3 h-3 text-muted-foreground rotate-90" />
          }
        </button>
      )}
    </div>
  );
}

// ─── Org-chart canvas ─────────────────────────────────────────────────────────

function OrgChart({
  roots, onEdit, onAddChild, onDelete, onDuplicate, onToggle, readOnly,
}: {
  roots: OrbatNode[];
  onEdit: (n: OrbatNode) => void;
  onAddChild: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (n: OrbatNode) => void;
  onToggle: (id: string) => void;
  readOnly: boolean;
}) {
  const layoutRoots: LayoutNode[] = [];
  let offsetX = 0;

  for (const root of roots) {
    const lc = leafCount(root);
    const treeW = lc * (NODE_W + H_GAP);
    layoutRoots.push(layoutTree(root, offsetX, 0));
    offsetX += treeW + TREE_SEP;
  }

  const allNodes: LayoutNode[] = [];
  const allEdges: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const lr of layoutRoots) {
    const { nodes, edges } = flattenLayout(lr);
    allNodes.push(...nodes);
    allEdges.push(...edges);
  }

  let canvasW = 0, canvasH = 0;
  for (const lr of layoutRoots) {
    const sz = treeExtent(lr);
    if (sz.w > canvasW) canvasW = sz.w;
    if (sz.h > canvasH) canvasH = sz.h;
  }
  canvasW = Math.max(offsetX, 300);
  canvasH = Math.max(canvasH, 200);

  return (
    <div style={{ position: "relative", width: canvasW, height: canvasH + 48 }}>
      {/* Connector lines */}
      <svg
        style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
        width={canvasW} height={canvasH + 48}
      >
        {allEdges.map((e, i) => (
          <line
            key={i}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke="rgb(63,63,70)"
            strokeWidth={1.5}
          />
        ))}
      </svg>

      {/* Node cards */}
      {allNodes.map(ln => (
        <OrgCard
          key={ln.node.id}
          ln={ln}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onToggle={onToggle}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

// ─── Main builder ─────────────────────────────────────────────────────────────

interface OrbatBuilderProps {
  initialData?: OrbatNode[];
  onSave?: (nodes: OrbatNode[]) => void;
  readOnly?: boolean;
}

export default function OrbatBuilder({ initialData, onSave, readOnly = false }: OrbatBuilderProps) {
  const [nodes, setNodes] = useState<OrbatNode[]>(initialData ?? []);
  const [editingNode, setEditingNode] = useState<OrbatNode | null>(null);
  const [zoom, setZoom] = useState(1);

  function updateById(tree: OrbatNode[], id: string, u: Partial<OrbatNode>): OrbatNode[] {
    return tree.map(n => n.id === id ? { ...n, ...u } : { ...n, children: updateById(n.children, id, u) });
  }
  function deleteById(tree: OrbatNode[], id: string): OrbatNode[] {
    return tree.filter(n => n.id !== id).map(n => ({ ...n, children: deleteById(n.children, id) }));
  }
  function addChildTo(tree: OrbatNode[], pid: string, child: OrbatNode): OrbatNode[] {
    return tree.map(n => n.id === pid
      ? { ...n, children: [...n.children, child] }
      : { ...n, children: addChildTo(n.children, pid, child) });
  }
  function replaceById(tree: OrbatNode[], id: string, updated: OrbatNode): OrbatNode[] {
    return tree.map(n => n.id === id ? updated : { ...n, children: replaceById(n.children, id, updated) });
  }
  function findNode(tree: OrbatNode[], id: string): OrbatNode | undefined {
    for (const n of tree) {
      if (n.id === id) return n;
      const f = findNode(n.children, id);
      if (f) return f;
    }
  }

  function handleUpdate(id: string, u: Partial<OrbatNode>) { setNodes(p => updateById(p, id, u)); }
  function handleDelete(id: string) { setNodes(p => deleteById(p, id)); }
  function handleToggle(id: string) {
    setNodes(p => updateById(p, id, { collapsed: !findNode(p, id)?.collapsed }));
  }
  function handleAddChild(pid: string) {
    const child = defaultNode({ echelon: "12" });
    setNodes(p => addChildTo(p, pid, child));
    setEditingNode(child);
  }
  function handleAddRoot() {
    const node = defaultNode({ echelon: "16" });
    setNodes(p => [...p, node]);
    setEditingNode(node);
  }
  function handleSaveEdit(updated: OrbatNode) {
    setNodes(prev => {
      const exists = JSON.stringify(prev).includes(`"id":"${updated.id}"`);
      return exists ? replaceById(prev, updated.id, updated) : [...prev, updated];
    });
  }
  function handleDuplicate(node: OrbatNode) {
    function deepCopy(n: OrbatNode): OrbatNode {
      return { ...n, id: generateId(), label: n.label + " (copy)", children: n.children.map(deepCopy) };
    }
    setNodes(p => [...p, deepCopy(node)]);
  }
  function handleExport() {
    const blob = new Blob([JSON.stringify(nodes, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "orbat.json"; a.click();
  }

  return (
    <div className="flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">ORBAT</span>
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono border border-primary/20">APP-6D</span>
          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono">2525D</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-muted-foreground font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(1)))}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button onClick={handleExport} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Export JSON">
            <Download className="w-3.5 h-3.5" />
          </button>
          {!readOnly && onSave && (
            <button onClick={() => onSave(nodes)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-bold hover:bg-primary/90 transition-colors">
              <Save className="w-3 h-3" /> Save
            </button>
          )}
        </div>
      </div>

      {/* Scrollable canvas */}
      <div className="flex-1 overflow-auto p-6" style={{ cursor: "default" }}>
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
            <div className="opacity-20 pointer-events-none">
              <MilSymbolSvg node={defaultNode({ echelon: "16", hqTfDummy: "1" })} size={80} />
            </div>
            <p className="text-muted-foreground text-sm">No units yet. Build your ORBAT.</p>
            {!readOnly && (
              <button onClick={handleAddRoot}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-bold hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4" /> Add Root Unit
              </button>
            )}
          </div>
        ) : (
          <div>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
              <OrgChart
                roots={nodes}
                onEdit={setEditingNode}
                onAddChild={handleAddChild}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onToggle={handleToggle}
                readOnly={readOnly}
              />
            </div>
            {!readOnly && (
              <div className="mt-4">
                <button onClick={handleAddRoot}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-border rounded text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                  <Plus className="w-3 h-3" /> Add Root Unit
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {editingNode && (
        <NodeEditor node={editingNode} onSave={handleSaveEdit} onClose={() => setEditingNode(null)} />
      )}
    </div>
  );
}
