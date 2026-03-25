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
  { id: "fireteam",  label: "Fire Team",  echelonCode: "11" },
  { id: "squad",     label: "Squad",      echelonCode: "12" },
  { id: "section",   label: "Section",    echelonCode: "13" },
  { id: "platoon",   label: "Platoon",    echelonCode: "14" },
  { id: "company",   label: "Company",    echelonCode: "15" },
  { id: "battalion", label: "Battalion",  echelonCode: "16" },
  { id: "regiment",  label: "Regiment",   echelonCode: "17" },
  { id: "brigade",   label: "Brigade",    echelonCode: "18" },
  { id: "division",  label: "Division",   echelonCode: "19" },
  { id: "corps",     label: "Corps",      echelonCode: "20" },
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

// ─── NATO Paper-Map Symbol Renderer ──────────────────────────────────────────
// Hand-drawn authentic style: white fill, black lines, no library dependency.

// Echelon marks drawn ABOVE the box
// fireteam=· squad=·· section=··· platoon=| company=|| battalion=||| 
// regiment=X brigade=XX division=XXX corps=XXXX

function echelonMark(id: string, cx: number, y: number, sw: number): React.ReactNode {
  const marks: Record<string, React.ReactNode> = {
    fireteam:  <text x={cx} y={y} textAnchor="middle" fontSize={sw*3.5} fontFamily="serif" fill="#111">·</text>,
    squad:     <text x={cx} y={y} textAnchor="middle" fontSize={sw*3.5} fontFamily="serif" fill="#111">··</text>,
    section:   <text x={cx} y={y} textAnchor="middle" fontSize={sw*3.5} fontFamily="serif" fill="#111">···</text>,
    platoon:   <line x1={cx} y1={y-sw*4} x2={cx} y2={y} stroke="#111" strokeWidth={sw} />,
    company:   <><line x1={cx-sw*2} y1={y-sw*4} x2={cx-sw*2} y2={y} stroke="#111" strokeWidth={sw}/><line x1={cx+sw*2} y1={y-sw*4} x2={cx+sw*2} y2={y} stroke="#111" strokeWidth={sw}/></>,
    battalion: <><line x1={cx-sw*3} y1={y-sw*4} x2={cx-sw*3} y2={y} stroke="#111" strokeWidth={sw}/><line x1={cx} y1={y-sw*4} x2={cx} y2={y} stroke="#111" strokeWidth={sw}/><line x1={cx+sw*3} y1={y-sw*4} x2={cx+sw*3} y2={y} stroke="#111" strokeWidth={sw}/></>,
    regiment:  <text x={cx} y={y} textAnchor="middle" fontSize={sw*5} fontFamily="serif" fontWeight="bold" fill="#111">X</text>,
    brigade:   <text x={cx} y={y} textAnchor="middle" fontSize={sw*5} fontFamily="serif" fontWeight="bold" fill="#111">XX</text>,
    division:  <text x={cx} y={y} textAnchor="middle" fontSize={sw*5} fontFamily="serif" fontWeight="bold" fill="#111">XXX</text>,
    corps:     <text x={cx} y={y} textAnchor="middle" fontSize={sw*5} fontFamily="serif" fontWeight="bold" fill="#111">XXXX</text>,
  };
  return marks[id] ?? null;
}

// Interior symbol paths/elements for each unit type
// All drawn within a normalised 80×50 box (viewBox "0 0 80 50")
function unitInterior(type: string, sw: number): React.ReactNode {
  const s = sw;
  switch (type) {
    // ── Combat ──────────────────────────────────────────────────────────────
    case "infantry":
      // Two diagonal crosses (X) — classic NATO infantry
      return <>
        <line x1={10} y1={8} x2={70} y2={42} stroke="#111" strokeWidth={s}/>
        <line x1={70} y1={8} x2={10} y2={42} stroke="#111" strokeWidth={s}/>
      </>;
    case "armor":
      // Oval / ellipse centred
      return <ellipse cx={40} cy={25} rx={22} ry={13} fill="none" stroke="#111" strokeWidth={s}/>;
    case "mechanized":
      // Oval + diagonal cross
      return <>
        <ellipse cx={40} cy={25} rx={22} ry={13} fill="none" stroke="#111" strokeWidth={s}/>
        <line x1={10} y1={8} x2={70} y2={42} stroke="#111" strokeWidth={s}/>
        <line x1={70} y1={8} x2={10} y2={42} stroke="#111" strokeWidth={s}/>
      </>;
    case "motorized":
      // Single diagonal line + small circle
      return <>
        <line x1={15} y1={10} x2={65} y2={40} stroke="#111" strokeWidth={s}/>
        <circle cx={40} cy={25} r={8} fill="none" stroke="#111" strokeWidth={s}/>
      </>;
    case "airborne":
      // Cross + arc (parachute suggestion)
      return <>
        <line x1={10} y1={8} x2={70} y2={42} stroke="#111" strokeWidth={s}/>
        <line x1={70} y1={8} x2={10} y2={42} stroke="#111" strokeWidth={s}/>
        <path d="M 20 40 Q 40 10 60 40" fill="none" stroke="#111" strokeWidth={s}/>
      </>;
    case "air_assault":
      // Cross + helicopter rotor (horizontal line at top)
      return <>
        <line x1={10} y1={8} x2={70} y2={42} stroke="#111" strokeWidth={s}/>
        <line x1={70} y1={8} x2={10} y2={42} stroke="#111" strokeWidth={s}/>
        <line x1={25} y1={12} x2={55} y2={12} stroke="#111" strokeWidth={s}/>
      </>;
    case "special_forces":
      // Cross + inner diamond
      return <>
        <line x1={10} y1={8} x2={70} y2={42} stroke="#111" strokeWidth={s}/>
        <line x1={70} y1={8} x2={10} y2={42} stroke="#111" strokeWidth={s}/>
        <polygon points="40,13 55,25 40,37 25,25" fill="none" stroke="#111" strokeWidth={s}/>
      </>;
    case "ranger":
      // Cross + small chevron top
      return <>
        <line x1={10} y1={8} x2={70} y2={42} stroke="#111" strokeWidth={s}/>
        <line x1={70} y1={8} x2={10} y2={42} stroke="#111" strokeWidth={s}/>
        <polyline points="30,18 40,10 50,18" fill="none" stroke="#111" strokeWidth={s}/>
      </>;
    case "cavalry":
      // Diagonal line (recon slash)
      return <line x1={15} y1={42} x2={65} y2={8} stroke="#111" strokeWidth={s+0.5}/>;
    case "recce":
      // Diagonal line + small eye/oval
      return <>
        <line x1={15} y1={42} x2={65} y2={8} stroke="#111" strokeWidth={s+0.5}/>
        <ellipse cx={40} cy={25} rx={10} ry={6} fill="none" stroke="#111" strokeWidth={s}/>
      </>;
    case "sniper":
      // Cross + dot centre
      return <>
        <line x1={10} y1={8} x2={70} y2={42} stroke="#111" strokeWidth={s}/>
        <line x1={70} y1={8} x2={10} y2={42} stroke="#111" strokeWidth={s}/>
        <circle cx={40} cy={25} r={4} fill="#111"/>
      </>;
    case "anti_armor":
      // Arrow pointing left (anti-tank symbol)
      return <>
        <line x1={20} y1={25} x2={60} y2={25} stroke="#111" strokeWidth={s+0.5}/>
        <polyline points="32,16 20,25 32,34" fill="none" stroke="#111" strokeWidth={s+0.5}/>
        <line x1={55} y1={18} x2={65} y2={25} stroke="#111" strokeWidth={s}/>
        <line x1={55} y1={32} x2={65} y2={25} stroke="#111" strokeWidth={s}/>
      </>;
    // ── Fires ────────────────────────────────────────────────────────────────
    case "artillery":
      // Solid black dot (classic field artillery)
      return <circle cx={40} cy={25} r={11} fill="#111"/>;
    case "rocket_artillery":
      // Dot + upward arrow
      return <>
        <circle cx={40} cy={30} r={9} fill="#111"/>
        <line x1={40} y1={21} x2={40} y2={9} stroke="#111" strokeWidth={s}/>
        <polyline points="34,15 40,9 46,15" fill="none" stroke="#111" strokeWidth={s}/>
      </>;
    case "mortar":
      // Dot + vertical bar
      return <>
        <circle cx={40} cy={28} r={9} fill="#111"/>
        <line x1={40} y1={8} x2={40} y2={18} stroke="#111" strokeWidth={s}/>
      </>;
    case "air_defense":
      // Upward pointing arrow
      return <>
        <line x1={40} y1={42} x2={40} y2={10} stroke="#111" strokeWidth={s+1}/>
        <polyline points="28,22 40,10 52,22" fill="none" stroke="#111" strokeWidth={s+1}/>
        <line x1={28} y1={35} x2={52} y2={35} stroke="#111" strokeWidth={s}/>
      </>;
    // ── Aviation ─────────────────────────────────────────────────────────────
    case "aviation":
      // Infinity / rotor symbol
      return <path d="M 18,25 C 18,15 32,15 40,25 C 48,35 62,35 62,25 C 62,15 48,15 40,25 C 32,35 18,35 18,25 Z" fill="none" stroke="#111" strokeWidth={s}/>;
    case "attack_helo":
      // Infinity + upward arrow
      return <>
        <path d="M 18,30 C 18,20 30,20 40,30 C 50,40 62,40 62,30 C 62,20 50,20 40,30 C 30,40 18,40 18,30 Z" fill="none" stroke="#111" strokeWidth={s}/>
        <line x1={40} y1={20} x2={40} y2={8} stroke="#111" strokeWidth={s}/>
        <polyline points="34,14 40,8 46,14" fill="none" stroke="#111" strokeWidth={s}/>
      </>;
    case "transport_helo":
      // Infinity + horizontal bar
      return <>
        <path d="M 18,30 C 18,20 30,20 40,30 C 50,40 62,40 62,30 C 62,20 50,20 40,30 C 30,40 18,40 18,30 Z" fill="none" stroke="#111" strokeWidth={s}/>
        <line x1={28} y1={13} x2={52} y2={13} stroke="#111" strokeWidth={s}/>
      </>;
    case "uav":
      // Small propeller cross
      return <>
        <line x1={24} y1={25} x2={56} y2={25} stroke="#111" strokeWidth={s+0.5}/>
        <line x1={40} y1={12} x2={40} y2={38} stroke="#111" strokeWidth={s+0.5}/>
        <circle cx={40} cy={25} r={4} fill="none" stroke="#111" strokeWidth={s}/>
      </>;
    // ── Support ──────────────────────────────────────────────────────────────
    case "engineer":
      // Castle / battlement suggestion (horizontal line + 3 uprights)
      return <>
        <line x1={15} y1={35} x2={65} y2={35} stroke="#111" strokeWidth={s}/>
        <line x1={20} y1={35} x2={20} y2={15} stroke="#111" strokeWidth={s}/>
        <line x1={40} y1={35} x2={40} y2={15} stroke="#111" strokeWidth={s}/>
        <line x1={60} y1={35} x2={60} y2={15} stroke="#111" strokeWidth={s}/>
        <line x1={15} y1={15} x2={65} y2={15} stroke="#111" strokeWidth={s}/>
      </>;
    case "signal":
      // Sine wave / lightning bolt
      return <path d="M 12,25 Q 22,10 32,25 Q 42,40 52,25 Q 62,10 68,25" fill="none" stroke="#111" strokeWidth={s+0.5}/>;
    case "military_police":
      // MP text
      return <text x={40} y={32} textAnchor="middle" fontSize={18} fontFamily="serif" fontWeight="bold" fill="#111">MP</text>;
    case "intelligence":
      // Eye symbol
      return <>
        <path d="M 14,25 Q 40,5 66,25 Q 40,45 14,25 Z" fill="none" stroke="#111" strokeWidth={s}/>
        <circle cx={40} cy={25} r={7} fill="none" stroke="#111" strokeWidth={s}/>
        <circle cx={40} cy={25} r={3} fill="#111"/>
      </>;
    case "cbrn":
      // Circle + hazard lines
      return <>
        <circle cx={40} cy={25} r={14} fill="none" stroke="#111" strokeWidth={s}/>
        <line x1={40} y1={11} x2={40} y2={39} stroke="#111" strokeWidth={s}/>
        <line x1={26} y1={25} x2={54} y2={25} stroke="#111" strokeWidth={s}/>
        <line x1={30} y1={15} x2={50} y2={35} stroke="#111" strokeWidth={s}/>
        <line x1={50} y1={15} x2={30} y2={35} stroke="#111" strokeWidth={s}/>
      </>;
    // ── CSS ──────────────────────────────────────────────────────────────────
    case "logistics":
      // Open circle (general logistics)
      return <circle cx={40} cy={25} r={13} fill="none" stroke="#111" strokeWidth={s}/>;
    case "medical":
      // Cross (red cross style but black)
      return <>
        <line x1={40} y1={10} x2={40} y2={40} stroke="#111" strokeWidth={s*3}/>
        <line x1={24} y1={25} x2={56} y2={25} stroke="#111" strokeWidth={s*3}/>
      </>;
    case "maintenance":
      // Wrench suggestion (circle + diagonal)
      return <>
        <circle cx={40} cy={25} r={13} fill="none" stroke="#111" strokeWidth={s}/>
        <line x1={30} y1={15} x2={50} y2={35} stroke="#111" strokeWidth={s*2}/>
      </>;
    case "transport":
      // Horizontal arrow
      return <>
        <line x1={15} y1={25} x2={60} y2={25} stroke="#111" strokeWidth={s+1}/>
        <polyline points="50,17 62,25 50,33" fill="none" stroke="#111" strokeWidth={s+1}/>
      </>;
    // ── C2 ───────────────────────────────────────────────────────────────────
    case "hq":
    case "command_post":
      // HQ — single horizontal line through middle
      return <line x1={12} y1={25} x2={68} y2={25} stroke="#111" strokeWidth={s+0.5}/>;
    case "fac":
      // FAC/JTAC — binoculars / two linked circles
      return <>
        <circle cx={30} cy={25} r={10} fill="none" stroke="#111" strokeWidth={s}/>
        <circle cx={50} cy={25} r={10} fill="none" stroke="#111" strokeWidth={s}/>
        <line x1={36} y1={20} x2={44} y2={20} stroke="#111" strokeWidth={s}/>
      </>;
    default:
      // Fallback: X
      return <>
        <line x1={10} y1={8} x2={70} y2={42} stroke="#111" strokeWidth={s}/>
        <line x1={70} y1={8} x2={10} y2={42} stroke="#111" strokeWidth={s}/>
      </>;
  }
}

function MilSymbol({ unitType, echelon, size = 56 }: { unitType: string; echelon: string; size?: number }) {
  const W = size;
  const H = Math.round(size * 0.625);
  const sw = Math.max(1.2, size / 36);          // stroke width scales with size
  const echelonData = NATO_ECHELONS.find(e => e.id === echelon);
  const topPad = size * 0.28;                   // space above box for echelon mark
  const totalH  = H + topPad;

  return (
    <svg width={W} height={totalH} viewBox={`0 0 80 ${50 + topPad * (80/W)}`} xmlns="http://www.w3.org/2000/svg">
      {/* Echelon mark above box */}
      <g>{echelonData && echelonMark(echelonData.id, 40, topPad * (80/W) - 2, sw)}</g>
      {/* Main box */}
      <g transform={`translate(0, ${topPad * (80/W)})`}>
        <rect x={5} y={3} width={70} height={44} rx={1} fill="white" stroke="#111" strokeWidth={sw}/>
        {unitInterior(unitType, sw)}
      </g>
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
          <div className="flex justify-center py-2">
            <div className="flex flex-col items-center gap-1">
              <MilSymbol unitType={draft.unitType} echelon={draft.echelon} size={64} />
              <span className="text-xs text-muted-foreground mt-1">{draft.name || "Unnamed"}</span>
            </div>
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
                <div className="flex flex-wrap gap-1">
                  {NATO_UNIT_TYPES.filter(u => u.category === cat).map(u => (
                    <button key={u.id} onClick={() => setDraft(d => ({ ...d, unitType: u.id }))}
                      className={`px-2 py-1 text-[11px] rounded border transition-all ${draft.unitType === u.id ? "bg-primary/20 border-primary/60 text-primary font-bold" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
                      {u.label}
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
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Slots</label>
            <input type="number" min={1} max={999} value={draft.slots}
              onChange={e => setDraft(d => ({ ...d, slots: Math.max(1, parseInt(e.target.value) || 1) }))}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-border sticky bottom-0 bg-card">
          <button onClick={onClose} className="flex-1 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground font-display font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded transition-all">Cancel</button>
          <button onClick={() => onSave(draft)} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded transition-all flex items-center justify-center gap-2">
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tree Node ────────────────────────────────────────────────────────────────

function OrbatTreeNode({ node, onUpdate, onDelete, onAddChild, depth = 0, isRoot = false, readOnly = false }: {
  node: OrbatNode; onUpdate: (u: OrbatNode) => void; onDelete: () => void;
  onAddChild: (id: string) => void; depth?: number; isRoot?: boolean; readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [collapsed, setCollapsed] = useState(node.collapsed ?? false);
  const unitType = NATO_UNIT_TYPES.find(u => u.id === node.unitType);
  const echelon = NATO_ECHELONS.find(e => e.id === node.echelon);
  const hasChildren = node.children.length > 0;

  const handleSave = (updated: OrbatNode) => { onUpdate(updated); setEditing(false); };
  const updateChild = (idx: number, updated: OrbatNode) => {
    const children = [...node.children]; children[idx] = updated; onUpdate({ ...node, children });
  };
  const deleteChild = (idx: number) => onUpdate({ ...node, children: node.children.filter((_, i) => i !== idx) });

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex flex-col items-center group">
        <div className={`relative flex flex-col items-center select-none transition-all duration-150 ${depth === 0 ? "scale-110" : ""} ${!readOnly ? "cursor-pointer" : "cursor-default"}`}
          onClick={() => !readOnly && setEditing(true)}>
          <MilSymbol unitType={node.unitType} echelon={node.echelon} size={depth === 0 ? 60 : 48} />
        </div>

        <div className="text-center mt-1 max-w-[120px]">
          <div className="text-xs font-display font-bold text-foreground leading-tight truncate">{node.name}</div>
          {node.callsign && <div className="text-[10px] text-primary truncate">{node.callsign}</div>}
          <div className="text-[9px] text-muted-foreground truncate">{echelon?.label} · {unitType?.label}</div>
          <div className="text-[9px] text-muted-foreground">{node.slots} slots</div>
        </div>

        {!readOnly && (
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
            <button onClick={e => { e.stopPropagation(); setEditing(true); }}
              className="w-5 h-5 bg-secondary hover:bg-secondary/70 border border-border rounded flex items-center justify-center transition-colors" title="Edit">
              <Settings className="w-3 h-3" />
            </button>
            <button onClick={e => { e.stopPropagation(); onAddChild(node.id); }}
              className="w-5 h-5 bg-primary/20 hover:bg-primary/40 border border-primary/40 rounded text-primary flex items-center justify-center transition-colors" title="Add subordinate">
              <Plus className="w-3 h-3" />
            </button>
            {!isRoot && (
              <button onClick={e => { e.stopPropagation(); onDelete(); }}
                className="w-5 h-5 bg-destructive/20 hover:bg-destructive/40 border border-destructive/40 rounded text-destructive flex items-center justify-center transition-colors" title="Delete">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {hasChildren && (
        <button onClick={() => setCollapsed(c => !c)} className="mt-1 text-muted-foreground hover:text-foreground transition-colors">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      )}

      {hasChildren && !collapsed && (
        <div className="relative mt-0 pt-4">
          <div className="absolute top-0 left-1/2 -translate-x-px w-px h-4 bg-border" />
          {node.children.length > 1 && (
            <div className="absolute top-4 bg-border" style={{ left: `calc(${100 / (node.children.length * 2)}%)`, right: `calc(${100 / (node.children.length * 2)}%)`, height: "1px" }} />
          )}
          <div className="flex gap-6 items-start">
            {node.children.map((child, idx) => (
              <div key={child.id} className="relative flex flex-col items-center">
                <div className="w-px h-4 bg-border" />
                <OrbatTreeNode node={child} onUpdate={u => updateChild(idx, u)} onDelete={() => deleteChild(idx)}
                  onAddChild={onAddChild} depth={depth + 1} readOnly={readOnly} />
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && !readOnly && <NodeEditor node={node} onSave={handleSave} onClose={() => setEditing(false)} />}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface OrbatBuilderProps {
  value?: string;
  onChange?: (json: string) => void;
  readOnly?: boolean;
  groupName?: string;
}

const DEFAULT_ORBAT: OrbatNode = {
  id: generateId(),
  name: "HQ Element",
  callsign: "COMMAND",
  unitType: "hq",
  echelon: "battalion",
  slots: 4,
  children: [],
};

export default function OrbatBuilder({ value, onChange, readOnly = false, groupName }: OrbatBuilderProps) {
  const parseTree = (): OrbatNode => {
    try {
      if (value) {
        const parsed = JSON.parse(value);
        if (parsed.tree) return parsed.tree;
        if (parsed.id) return parsed;
      }
    } catch {}
    return { ...DEFAULT_ORBAT, id: generateId() };
  };

  const [tree, setTree] = useState<OrbatNode>(parseTree);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const updateTree = useCallback((updated: OrbatNode) => {
    setTree(updated);
    onChange?.(JSON.stringify(updated));
  }, [onChange]);

  const addChildTo = (parentId: string, root: OrbatNode): OrbatNode => {
    if (root.id === parentId) {
      return { ...root, children: [...root.children, { id: generateId(), name: "New Unit", unitType: "infantry", echelon: "platoon", slots: 20, children: [] }] };
    }
    return { ...root, children: root.children.map(c => addChildTo(parentId, c)) };
  };

  const countUnits = (n: OrbatNode): number => 1 + n.children.reduce((a, c) => a + countUnits(c), 0);
  const countSlots  = (n: OrbatNode): number => n.slots + n.children.reduce((a, c) => a + countSlots(c), 0);

  const exportOrbat = () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) return;

    const canvasEl = canvasRef.current;
    const canvasHTML = canvasEl ? canvasEl.innerHTML : '';
    const title = groupName ?? 'Unit ORBAT';
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title} — ORBAT</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Inter:wght@400;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #fff; color: #1a1a1a; font-family: 'Inter', Arial, sans-serif; padding: 32px 40px; }
    .orbat-header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 3px solid #006ba6; padding-bottom: 16px; margin-bottom: 32px; }
    .orbat-title { font-family: 'Oswald', sans-serif; font-size: 32px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #111; }
    .orbat-subtitle { font-size: 13px; color: #666; margin-top: 4px; }
    .orbat-meta { text-align: right; font-size: 11px; color: #888; line-height: 1.6; }
    .orbat-meta strong { color: #444; }
    .classification { display: inline-block; font-family: 'Oswald', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #fff; background: #006ba6; padding: 4px 12px; margin-bottom: 24px; border-radius: 2px; }
    .orbat-canvas { overflow-x: auto; display: flex; justify-content: center; padding: 16px 0 40px; }
    .orbat-canvas * { font-family: 'Inter', Arial, sans-serif !important; }
    .orbat-footer { margin-top: 48px; padding-top: 12px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; }
    @media print { body { padding: 16px 20px; } @page { size: A3 landscape; margin: 12mm; } }
  </style>
</head>
<body>
  <div class="orbat-header">
    <div>
      <div class="orbat-title">${title}</div>
      <div class="orbat-subtitle">Order of Battle</div>
    </div>
    <div class="orbat-meta">
      <strong>Standard:</strong> NATO APP-6<br/>
      <strong>Generated:</strong> ${dateStr}<br/>
      <strong>Classification:</strong> UNCLASSIFIED
    </div>
  </div>
  <div><span class="classification">UNCLASSIFIED // NATO APP-6</span></div>
  <div class="orbat-canvas">${canvasHTML}</div>
  <div class="orbat-footer">
    <span>${title} — Order of Battle</span>
    <span>UNCLASSIFIED // NATO APP-6 // ${dateStr}</span>
  </div>
  <script>
    document.querySelectorAll('.group .absolute').forEach(el => el.remove());
    window.addEventListener('load', () => setTimeout(() => window.print(), 600));
  </script>
</body>
</html>`);
    printWindow.document.close();
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/20 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-display font-black uppercase tracking-widest">ORBAT Builder</span>
          <span className="text-[10px] text-muted-foreground">🌍 NATO APP-6</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground hidden sm:block">{countUnits(tree)} units · {countSlots(tree)} slots</span>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.15))} className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors" title="Zoom out"><ZoomOut className="w-3.5 h-3.5" /></button>
          <span className="text-[10px] text-muted-foreground w-9 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.15))} className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors" title="Zoom in"><ZoomIn className="w-3.5 h-3.5" /></button>
          <button onClick={exportOrbat} className="p-1.5 hover:bg-secondary rounded border border-transparent hover:border-border text-muted-foreground hover:text-foreground transition-colors" title="Export / Print ORBAT">
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-auto p-8 min-h-[400px] bg-background">
        <div ref={canvasRef} data-orbat-canvas style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.15s ease" }}>
          <OrbatTreeNode node={tree} onUpdate={updateTree} onDelete={() => {}}
            onAddChild={parentId => updateTree(addChildTo(parentId, tree))} isRoot readOnly={readOnly} />
        </div>
      </div>

      {!readOnly && (
        <div className="px-4 py-2 border-t border-border bg-secondary/10 flex justify-end">
          <button onClick={() => updateTree(addChildTo(tree.id, tree))}
            className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Unit
          </button>
        </div>
      )}
    </div>
  );
}
