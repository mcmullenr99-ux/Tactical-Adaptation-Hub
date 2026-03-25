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

// ─── Tree Node ────────────────────────────────────────────────────────────────

function OrbatTreeNode({
  node, depth, onUpdate, onDelete, onAddChild, onEdit,
}: {
  node: OrbatNode; depth: number;
  onUpdate: (id: string, updates: Partial<OrbatNode>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onEdit: (node: OrbatNode) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none">
      <div
        className="flex items-start gap-2 group py-1 px-2 rounded hover:bg-muted/40 transition-colors cursor-pointer"
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        {/* Collapse toggle */}
        <button
          className="mt-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 w-4"
          onClick={() => onUpdate(node.id, { collapsed: !node.collapsed })}
        >
          {hasChildren
            ? (node.collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
            : <span className="w-3 h-3 block" />
          }
        </button>

        {/* Symbol */}
        <div className="flex-shrink-0 cursor-pointer" onClick={() => onEdit(node)}>
          <MilSymbol unitType={node.unitType} echelon={node.echelon} size={48} />
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0 cursor-pointer pt-2" onClick={() => onEdit(node)}>
          <div className="text-sm font-bold truncate">{node.name || "Unnamed"}</div>
          {node.callsign && <div className="text-[11px] text-muted-foreground font-mono">{node.callsign}</div>}
          <div className="text-[10px] text-muted-foreground/60">
            {NATO_UNIT_TYPES.find(u => u.id === node.unitType)?.label} · {NATO_ECHELONS.find(e => e.id === node.echelon)?.label} · {node.slots} slots
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1 flex-shrink-0">
          <button onClick={() => onAddChild(node.id)}
            className="p-1 rounded hover:bg-primary/20 hover:text-primary transition-colors text-muted-foreground" title="Add child unit">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(node.id)}
            className="p-1 rounded hover:bg-destructive/20 hover:text-destructive transition-colors text-muted-foreground" title="Delete unit">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Children */}
      {!node.collapsed && hasChildren && (
        <div className="border-l border-dashed border-border/40 ml-6">
          {node.children.map(child => (
            <OrbatTreeNode
              key={child.id} node={child} depth={depth + 1}
              onUpdate={onUpdate} onDelete={onDelete} onAddChild={onAddChild} onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ORBAT Builder ───────────────────────────────────────────────────────

interface OrbatBuilderProps {
  initialData?: OrbatNode[];
  roster?: { callsign: string; rank?: string }[];
  onSave?: (nodes: OrbatNode[]) => void;
  readOnly?: boolean;
}

export default function OrbatBuilder({ initialData, onSave, readOnly = false }: OrbatBuilderProps) {
  const [nodes, setNodes] = useState<OrbatNode[]>(initialData ?? []);
  const [editingNode, setEditingNode] = useState<OrbatNode | null>(null);
  const [zoom, setZoom] = useState(1);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function updateNodeById(tree: OrbatNode[], id: string, updates: Partial<OrbatNode>): OrbatNode[] {
    return tree.map(n => {
      if (n.id === id) return { ...n, ...updates };
      return { ...n, children: updateNodeById(n.children, id, updates) };
    });
  }

  function deleteNodeById(tree: OrbatNode[], id: string): OrbatNode[] {
    return tree
      .filter(n => n.id !== id)
      .map(n => ({ ...n, children: deleteNodeById(n.children, id) }));
  }

  function addChildById(tree: OrbatNode[], parentId: string, child: OrbatNode): OrbatNode[] {
    return tree.map(n => {
      if (n.id === parentId) return { ...n, children: [...n.children, child] };
      return { ...n, children: addChildById(n.children, parentId, child) };
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  function handleUpdate(id: string, updates: Partial<OrbatNode>) {
    setNodes(prev => updateNodeById(prev, id, updates));
  }

  function handleDelete(id: string) {
    setNodes(prev => deleteNodeById(prev, id));
  }

  function handleAddChild(parentId: string) {
    const child: OrbatNode = {
      id: generateId(), name: "New Unit", unitType: "infantry",
      echelon: "squad", slots: 4, children: [],
    };
    setNodes(prev => addChildById(prev, parentId, child));
  }

  function handleAddRoot() {
    const node: OrbatNode = {
      id: generateId(), name: "New Unit", unitType: "infantry",
      echelon: "platoon", slots: 8, children: [],
    };
    setNodes(prev => [...prev, node]);
  }

  function handleSaveEdit(updated: OrbatNode) {
    setNodes(prev => updateNodeById(prev, updated.id, updated));
  }

  function handleSave() {
    onSave?.(nodes);
  }

  // ── Export ────────────────────────────────────────────────────────────────

  function handleExport() {
    const data = JSON.stringify(nodes, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "orbat.json"; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">ORBAT</span>
          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono">NATO APP-6</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-muted-foreground font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button onClick={handleExport}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Export JSON">
            <Download className="w-3.5 h-3.5" />
          </button>
          {!readOnly && onSave && (
            <button onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-bold hover:bg-primary/90 transition-colors">
              <Save className="w-3 h-3" /> Save
            </button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto p-4" style={{ fontSize: `${zoom}rem` }}>
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
            <div className="opacity-30">
              <MilSymbol unitType="infantry" echelon="battalion" size={72} />
            </div>
            <div className="text-muted-foreground text-sm">No units yet. Add a root unit to begin.</div>
            {!readOnly && (
              <button onClick={handleAddRoot}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-bold hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4" /> Add Root Unit
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {nodes.map(node => (
              <OrbatTreeNode
                key={node.id} node={node} depth={0}
                onUpdate={handleUpdate} onDelete={handleDelete}
                onAddChild={handleAddChild} onEdit={setEditingNode}
              />
            ))}
          </div>
        )}

        {/* Add root button when tree has nodes */}
        {nodes.length > 0 && !readOnly && (
          <button onClick={handleAddRoot}
            className="mt-4 flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-border rounded text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
            <Plus className="w-3 h-3" /> Add Root Unit
          </button>
        )}
      </div>

      {/* Node editor modal */}
      {editingNode && (
        <NodeEditor
          node={editingNode}
          onSave={handleSaveEdit}
          onClose={() => setEditingNode(null)}
        />
      )}
    </div>
  );
}
