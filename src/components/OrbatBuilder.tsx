/**
 * NATO ORBAT Builder
 * Full APP-6 compliant unit symbology with family-tree layout
 */

import { useState, useCallback, useRef } from "react";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Save, Download,
  ZoomIn, ZoomOut, RefreshCw, Settings, X, GripVertical
} from "lucide-react";

// ─── NATO Unit Types ─────────────────────────────────────────────────────────

export const NATO_UNIT_TYPES = [
  // Combat Arms
  { id: "infantry",          label: "Infantry",             category: "Combat",        symbol: "infantry" },
  { id: "armor",             label: "Armor / Tank",         category: "Combat",        symbol: "armor" },
  { id: "mechanized",        label: "Mechanized Infantry",  category: "Combat",        symbol: "mechanized" },
  { id: "motorized",         label: "Motorized Infantry",   category: "Combat",        symbol: "motorized" },
  { id: "airborne",          label: "Airborne",             category: "Combat",        symbol: "airborne" },
  { id: "air_assault",       label: "Air Assault",          category: "Combat",        symbol: "air_assault" },
  { id: "special_forces",    label: "Special Forces",       category: "Combat",        symbol: "special_forces" },
  { id: "ranger",            label: "Ranger",               category: "Combat",        symbol: "ranger" },
  { id: "cavalry",           label: "Cavalry / Recon",      category: "Combat",        symbol: "cavalry" },
  { id: "recce",             label: "Reconnaissance",       category: "Combat",        symbol: "recce" },
  { id: "sniper",            label: "Sniper",               category: "Combat",        symbol: "sniper" },
  { id: "anti_armor",        label: "Anti-Armor",           category: "Combat",        symbol: "anti_armor" },
  // Fires
  { id: "artillery",         label: "Field Artillery",      category: "Fires",         symbol: "artillery" },
  { id: "rocket_artillery",  label: "Rocket Artillery",     category: "Fires",         symbol: "rocket_artillery" },
  { id: "mortar",            label: "Mortar",               category: "Fires",         symbol: "mortar" },
  { id: "air_defense",       label: "Air Defense",          category: "Fires",         symbol: "air_defense" },
  // Aviation
  { id: "aviation",          label: "Aviation",             category: "Aviation",      symbol: "aviation" },
  { id: "attack_helo",       label: "Attack Helicopter",    category: "Aviation",      symbol: "attack_helo" },
  { id: "transport_helo",    label: "Transport Helicopter", category: "Aviation",      symbol: "transport_helo" },
  { id: "uav",               label: "UAV / Drone",          category: "Aviation",      symbol: "uav" },
  // Combat Support
  { id: "engineer",          label: "Engineer",             category: "Support",       symbol: "engineer" },
  { id: "signal",            label: "Signal / Comms",       category: "Support",       symbol: "signal" },
  { id: "military_police",   label: "Military Police",      category: "Support",       symbol: "military_police" },
  { id: "intelligence",      label: "Intelligence",         category: "Support",       symbol: "intelligence" },
  { id: "cbrn",              label: "CBRN",                 category: "Support",       symbol: "cbrn" },
  // CSS
  { id: "logistics",         label: "Logistics / Supply",   category: "CSS",           symbol: "logistics" },
  { id: "medical",           label: "Medical",              category: "CSS",           symbol: "medical" },
  { id: "maintenance",       label: "Maintenance",          category: "CSS",           symbol: "maintenance" },
  { id: "transport",         label: "Transport",            category: "CSS",           symbol: "transport" },
  // C2
  { id: "hq",                label: "Headquarters",         category: "C2",            symbol: "hq" },
  { id: "command_post",      label: "Command Post",         category: "C2",            symbol: "command_post" },
  { id: "fac",               label: "FAC / JTAC",           category: "C2",            symbol: "fac" },
];

export const NATO_ECHELONS = [
  { id: "fireteam",   label: "Fire Team",  symbol: "•",   pip: 1 },
  { id: "squad",      label: "Squad",      symbol: "••",  pip: 2 },
  { id: "section",    label: "Section",    symbol: "•••", pip: 3 },
  { id: "platoon",    label: "Platoon",    symbol: "I",   pip: 0 },
  { id: "company",    label: "Company",    symbol: "II",  pip: 0 },
  { id: "battalion",  label: "Battalion",  symbol: "III", pip: 0 },
  { id: "regiment",   label: "Regiment",   symbol: "X",   pip: 0 },
  { id: "brigade",    label: "Brigade",    symbol: "XX",  pip: 0 },
  { id: "division",   label: "Division",   symbol: "XXX", pip: 0 },
  { id: "corps",      label: "Corps",      symbol: "XXXX",pip: 0 },
];

// ─── NATO Symbol SVG Renderer ─────────────────────────────────────────────────

function NatoSymbolSVG({ type, echelon, size = 56 }: { type: string; echelon: string; size?: number }) {
  const w = size;
  const h = size * 0.75;
  const stroke = "#1a3a1a";
  const fill = "#a8d5a2";   // friendly (blue tint replaced with green for milsim)

  const echelonData = NATO_ECHELONS.find(e => e.id === echelon);

  // Draw the inner icon based on unit type
  const renderIcon = () => {
    const cx = w / 2;
    const cy = h / 2;

    switch (type) {
      case "infantry":
        return <line x1={w*0.2} y1={h*0.75} x2={w*0.5} y2={h*0.25} stroke={stroke} strokeWidth="2.5" />;
      case "armor":
        return <ellipse cx={cx} cy={cy} rx={w*0.22} ry={h*0.2} stroke={stroke} strokeWidth="2" fill="none" />;
      case "mechanized":
        return <>
          <line x1={w*0.2} y1={h*0.75} x2={w*0.5} y2={h*0.25} stroke={stroke} strokeWidth="2.5" />
          <ellipse cx={cx} cy={cy+h*0.12} rx={w*0.18} ry={h*0.14} stroke={stroke} strokeWidth="1.5" fill="none" />
        </>;
      case "motorized":
        return <>
          <line x1={w*0.2} y1={h*0.75} x2={w*0.5} y2={h*0.25} stroke={stroke} strokeWidth="2.5" />
          <circle cx={cx-w*0.1} cy={cy+h*0.25} r={h*0.1} stroke={stroke} strokeWidth="1.5" fill="none" />
          <circle cx={cx+w*0.1} cy={cy+h*0.25} r={h*0.1} stroke={stroke} strokeWidth="1.5" fill="none" />
        </>;
      case "airborne":
        return <>
          <line x1={w*0.2} y1={h*0.75} x2={w*0.5} y2={h*0.25} stroke={stroke} strokeWidth="2.5" />
          <path d={`M ${cx-w*0.2} ${cy-h*0.05} Q ${cx} ${cy-h*0.3} ${cx+w*0.2} ${cy-h*0.05}`} stroke={stroke} strokeWidth="1.5" fill="none" />
        </>;
      case "air_assault":
        return <>
          <line x1={w*0.2} y1={h*0.75} x2={w*0.5} y2={h*0.25} stroke={stroke} strokeWidth="2.5" />
          <path d={`M ${cx} ${cy-h*0.3} L ${cx-w*0.2} ${cy+h*0.1} L ${cx+w*0.2} ${cy+h*0.1} Z`} stroke={stroke} strokeWidth="1.5" fill="none" />
        </>;
      case "special_forces":
        return <>
          <line x1={w*0.2} y1={h*0.75} x2={w*0.5} y2={h*0.25} stroke={stroke} strokeWidth="2.5" />
          <line x1={w*0.3} y1={h*0.25} x2={w*0.7} y2={h*0.75} stroke={stroke} strokeWidth="2.5" />
        </>;
      case "ranger":
        return <>
          <line x1={w*0.2} y1={h*0.75} x2={w*0.5} y2={h*0.25} stroke={stroke} strokeWidth="2.5" />
          <line x1={w*0.3} y1={h*0.25} x2={w*0.7} y2={h*0.75} stroke={stroke} strokeWidth="2" />
          <rect x={cx-w*0.08} y={cy-h*0.08} width={w*0.16} height={h*0.16} stroke={stroke} strokeWidth="1.5" fill="none" />
        </>;
      case "cavalry":
      case "recce":
        return <line x1={w*0.15} y1={h*0.5} x2={w*0.85} y2={h*0.5} stroke={stroke} strokeWidth="2.5" />;
      case "sniper":
        return <>
          <line x1={w*0.2} y1={h*0.75} x2={w*0.5} y2={h*0.25} stroke={stroke} strokeWidth="2.5" />
          <circle cx={cx} cy={cy} r={h*0.1} stroke={stroke} strokeWidth="1.5" fill="none" />
        </>;
      case "anti_armor":
        return <>
          <line x1={w*0.15} y1={cy} x2={w*0.85} y2={cy} stroke={stroke} strokeWidth="2" />
          <path d={`M ${cx-w*0.1} ${cy-h*0.15} L ${cx+w*0.2} ${cy} L ${cx-w*0.1} ${cy+h*0.15}`} fill={stroke} />
        </>;
      case "artillery":
        return <circle cx={cx} cy={cy} r={Math.min(w,h)*0.22} stroke={stroke} strokeWidth="2.5" fill="none" />;
      case "rocket_artillery":
        return <>
          <circle cx={cx} cy={cy} r={Math.min(w,h)*0.22} stroke={stroke} strokeWidth="2" fill="none" />
          <line x1={cx} y1={cy-h*0.35} x2={cx} y2={cy+h*0.1} stroke={stroke} strokeWidth="2" />
        </>;
      case "mortar":
        return <>
          <circle cx={cx} cy={cy} r={Math.min(w,h)*0.15} stroke={stroke} strokeWidth="2" fill="none" />
          <line x1={cx} y1={h*0.15} x2={cx} y2={cy-h*0.15} stroke={stroke} strokeWidth="2" />
        </>;
      case "air_defense":
        return <>
          <circle cx={cx} cy={cy} r={Math.min(w,h)*0.18} stroke={stroke} strokeWidth="2" fill="none" />
          <line x1={cx-w*0.2} y1={cy-h*0.25} x2={cx+w*0.2} y2={cy-h*0.25} stroke={stroke} strokeWidth="2" />
        </>;
      case "aviation":
      case "attack_helo":
      case "transport_helo":
        return <>
          <path d={`M ${w*0.1} ${cy} Q ${cx} ${cy-h*0.35} ${w*0.9} ${cy}`} stroke={stroke} strokeWidth="2.5" fill="none" />
          <circle cx={cx} cy={cy+h*0.12} r={h*0.12} stroke={stroke} strokeWidth="2" fill="none" />
        </>;
      case "uav":
        return <>
          <path d={`M ${w*0.2} ${cy} L ${cx} ${cy-h*0.25} L ${w*0.8} ${cy}`} stroke={stroke} strokeWidth="2" fill="none" />
          <circle cx={cx} cy={cy+h*0.05} r={h*0.08} stroke={stroke} strokeWidth="1.5" fill="none" />
        </>;
      case "engineer":
        return <>
          <line x1={w*0.2} y1={h*0.75} x2={w*0.5} y2={h*0.25} stroke={stroke} strokeWidth="2" />
          <line x1={w*0.3} y1={h*0.25} x2={w*0.7} y2={h*0.75} stroke={stroke} strokeWidth="2" />
          <line x1={w*0.2} y1={cy} x2={w*0.8} y2={cy} stroke={stroke} strokeWidth="1.5" />
        </>;
      case "signal":
        return <>
          <path d={`M ${cx-w*0.25} ${cy+h*0.1} Q ${cx-w*0.1} ${cy-h*0.3} ${cx} ${cy}`} stroke={stroke} strokeWidth="2" fill="none" />
          <path d={`M ${cx} ${cy} Q ${cx+w*0.1} ${cy-h*0.3} ${cx+w*0.25} ${cy+h*0.1}`} stroke={stroke} strokeWidth="2" fill="none" />
        </>;
      case "military_police":
        return <>
          <line x1={w*0.2} y1={h*0.75} x2={w*0.5} y2={h*0.25} stroke={stroke} strokeWidth="2.5" />
          <text x={cx+w*0.05} y={cy+h*0.1} fontSize={h*0.3} fontWeight="bold" fill={stroke} textAnchor="middle">MP</text>
        </>;
      case "intelligence":
        return <text x={cx} y={cy+h*0.12} fontSize={h*0.4} fontWeight="bold" fill={stroke} textAnchor="middle">I</text>;
      case "cbrn":
        return <>
          <circle cx={cx} cy={cy} r={Math.min(w,h)*0.2} stroke={stroke} strokeWidth="2" fill="none" />
          <text x={cx} y={cy+h*0.12} fontSize={h*0.28} fontWeight="bold" fill={stroke} textAnchor="middle">NBC</text>
        </>;
      case "logistics":
        return <>
          <rect x={cx-w*0.22} y={cy-h*0.2} width={w*0.44} height={h*0.4} stroke={stroke} strokeWidth="2" fill="none" />
          <line x1={cx-w*0.1} y1={cy+h*0.2} x2={cx-w*0.1} y2={cy+h*0.32} stroke={stroke} strokeWidth="2" />
          <line x1={cx+w*0.1} y1={cy+h*0.2} x2={cx+w*0.1} y2={cy+h*0.32} stroke={stroke} strokeWidth="2" />
        </>;
      case "medical":
        return <>
          <rect x={cx-w*0.2} y={cy-h*0.1} width={w*0.4} height={h*0.2} fill="#e8f4f8" stroke={stroke} strokeWidth="1.5" />
          <rect x={cx-w*0.07} y={cy-h*0.22} width={w*0.14} height={h*0.44} fill="#e8f4f8" stroke={stroke} strokeWidth="1.5" />
        </>;
      case "maintenance":
        return <>
          <path d={`M ${cx-w*0.2} ${cy+h*0.15} L ${cx} ${cy-h*0.2} L ${cx+w*0.2} ${cy+h*0.15} Z`} stroke={stroke} strokeWidth="2" fill="none" />
          <circle cx={cx} cy={cy+h*0.05} r={h*0.08} stroke={stroke} strokeWidth="1.5" fill="none" />
        </>;
      case "transport":
        return <>
          <rect x={cx-w*0.25} y={cy-h*0.15} width={w*0.5} height={h*0.3} stroke={stroke} strokeWidth="2" fill="none" rx="2" />
          <circle cx={cx-w*0.1} cy={cy+h*0.18} r={h*0.09} stroke={stroke} strokeWidth="1.5" fill="none" />
          <circle cx={cx+w*0.1} cy={cy+h*0.18} r={h*0.09} stroke={stroke} strokeWidth="1.5" fill="none" />
        </>;
      case "hq":
      case "command_post":
        return <text x={cx} y={cy+h*0.13} fontSize={h*0.42} fontWeight="900" fill={stroke} textAnchor="middle">HQ</text>;
      case "fac":
        return <text x={cx} y={cy+h*0.13} fontSize={h*0.32} fontWeight="bold" fill={stroke} textAnchor="middle">FAC</text>;
      default:
        return <line x1={w*0.2} y1={h*0.75} x2={w*0.5} y2={h*0.25} stroke={stroke} strokeWidth="2.5" />;
    }
  };

  // Echelon marker above the box
  const renderEchelon = () => {
    if (!echelonData) return null;
    const sym = echelonData.symbol;
    return (
      <text
        x={w / 2}
        y={-4}
        textAnchor="middle"
        fontSize={sym.length > 2 ? 9 : 11}
        fontWeight="bold"
        fill="#111"
        fontFamily="monospace"
      >{sym}</text>
    );
  };

  return (
    <svg width={w} height={h + 24} viewBox={`0 -20 ${w} ${h + 24}`} style={{ overflow: "visible" }}>
      {/* Echelon marker */}
      {renderEchelon()}
      {/* Main frame — rectangle for land units */}
      <rect x={2} y={2} width={w - 4} height={h - 4}
        fill={fill} stroke={stroke} strokeWidth="2" rx="1" />
      {/* Inner unit icon */}
      {renderIcon()}
    </svg>
  );
}

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

// ─── Node Editor Modal ────────────────────────────────────────────────────────

function NodeEditor({ node, onSave, onClose }: {
  node: OrbatNode;
  onSave: (n: OrbatNode) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<OrbatNode>({ ...node });

  const categories = Array.from(new Set(NATO_UNIT_TYPES.map(u => u.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#0f1a0f] border border-[#2a4a2a] rounded-lg w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a4a2a]">
          <h3 className="font-display font-black uppercase tracking-wider text-sm text-white">Edit Unit Node</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Preview */}
          <div className="flex justify-center py-2">
            <div className="flex flex-col items-center gap-1">
              <NatoSymbolSVG type={draft.unitType} echelon={draft.echelon} size={64} />
              <span className="text-xs text-gray-400 font-mono mt-1">{draft.name || "Unnamed"}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-gray-400 mb-1">Unit Name / Designation</label>
            <input
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              className="w-full bg-[#0a120a] border border-[#2a4a2a] rounded px-3 py-2 text-white text-sm font-sans focus:outline-none focus:border-[#4a9a4a]"
              placeholder="e.g. 1st Platoon, Alpha Company"
            />
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-gray-400 mb-1">Callsign</label>
            <input
              value={draft.callsign || ""}
              onChange={e => setDraft(d => ({ ...d, callsign: e.target.value }))}
              className="w-full bg-[#0a120a] border border-[#2a4a2a] rounded px-3 py-2 text-white text-sm font-sans focus:outline-none focus:border-[#4a9a4a]"
              placeholder="e.g. ALPHA, BRAVO-1"
            />
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-gray-400 mb-1">Unit Type</label>
            <select
              value={draft.unitType}
              onChange={e => setDraft(d => ({ ...d, unitType: e.target.value }))}
              className="w-full bg-[#0a120a] border border-[#2a4a2a] rounded px-3 py-2 text-white text-sm font-sans focus:outline-none focus:border-[#4a9a4a]"
            >
              {categories.map(cat => (
                <optgroup key={cat} label={`── ${cat} ──`}>
                  {NATO_UNIT_TYPES.filter(u => u.category === cat).map(u => (
                    <option key={u.id} value={u.id}>{u.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-gray-400 mb-1">Echelon Size</label>
            <select
              value={draft.echelon}
              onChange={e => setDraft(d => ({ ...d, echelon: e.target.value }))}
              className="w-full bg-[#0a120a] border border-[#2a4a2a] rounded px-3 py-2 text-white text-sm font-sans focus:outline-none focus:border-[#4a9a4a]"
            >
              {NATO_ECHELONS.map(e => (
                <option key={e.id} value={e.id}>{e.symbol} — {e.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-gray-400 mb-1">
              Personnel Slots — <span className="text-[#4a9a4a]">{draft.slots}</span>
            </label>
            <input
              type="range"
              min={1}
              max={200}
              value={draft.slots}
              onChange={e => setDraft(d => ({ ...d, slots: Number(e.target.value) }))}
              className="w-full accent-[#4a9a4a]"
            />
            <div className="flex justify-between text-xs text-gray-600 font-mono mt-0.5">
              <span>1</span><span>50</span><span>100</span><span>150</span><span>200</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-[#2a4a2a]">
          <button onClick={() => onSave(draft)}
            className="flex-1 bg-[#2a6a2a] hover:bg-[#3a8a3a] text-white font-display font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded transition-colors flex items-center justify-center gap-2">
            <Save className="w-3.5 h-3.5" /> Apply
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 border border-[#2a4a2a] text-gray-400 hover:text-white hover:border-gray-500 font-display font-bold uppercase tracking-wider text-xs rounded transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tree Node Component ──────────────────────────────────────────────────────

function OrbatTreeNode({
  node,
  onUpdate,
  onDelete,
  onAddChild,
  depth = 0,
  isRoot = false,
}: {
  node: OrbatNode;
  onUpdate: (updated: OrbatNode) => void;
  onDelete: () => void;
  onAddChild: (parentId: string) => void;
  depth?: number;
  isRoot?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [collapsed, setCollapsed] = useState(node.collapsed ?? false);

  const unitType = NATO_UNIT_TYPES.find(u => u.id === node.unitType);
  const echelon = NATO_ECHELONS.find(e => e.id === node.echelon);
  const hasChildren = node.children.length > 0;

  const handleSave = (updated: OrbatNode) => {
    onUpdate(updated);
    setEditing(false);
  };

  const updateChild = (idx: number, updated: OrbatNode) => {
    const children = [...node.children];
    children[idx] = updated;
    onUpdate({ ...node, children });
  };

  const deleteChild = (idx: number) => {
    const children = node.children.filter((_, i) => i !== idx);
    onUpdate({ ...node, children });
  };

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div className="relative flex flex-col items-center group">
        {/* Symbol + Card */}
        <div
          className={`relative flex flex-col items-center cursor-pointer select-none transition-all duration-150
            ${depth === 0 ? "scale-110" : ""}
          `}
          onClick={() => setEditing(true)}
        >
          <NatoSymbolSVG type={node.unitType} echelon={node.echelon} size={depth === 0 ? 64 : 52} />
        </div>

        {/* Label below symbol */}
        <div className="text-center mt-0.5 max-w-[100px]">
          <div className="text-xs font-display font-bold text-white leading-tight truncate">{node.name}</div>
          {node.callsign && (
            <div className="text-[10px] font-mono text-[#4a9a4a] truncate">{node.callsign}</div>
          )}
          <div className="text-[9px] text-gray-500 font-mono truncate">
            {echelon?.label} · {unitType?.label}
          </div>
          <div className="text-[9px] text-gray-600 font-mono">{node.slots} slots</div>
        </div>

        {/* Action buttons — visible on hover */}
        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
          <button
            onClick={e => { e.stopPropagation(); setEditing(true); }}
            className="w-5 h-5 bg-[#2a4a2a] hover:bg-[#3a7a3a] border border-[#4a7a4a] rounded text-white flex items-center justify-center"
            title="Edit"
          >
            <Settings className="w-3 h-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onAddChild(node.id); }}
            className="w-5 h-5 bg-[#1a3a5a] hover:bg-[#2a5a8a] border border-[#2a5a8a] rounded text-white flex items-center justify-center"
            title="Add subordinate unit"
          >
            <Plus className="w-3 h-3" />
          </button>
          {!isRoot && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              className="w-5 h-5 bg-[#4a1a1a] hover:bg-[#7a2a2a] border border-[#7a2a2a] rounded text-white flex items-center justify-center"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      {hasChildren && (
        <button
          onClick={() => setCollapsed(c => !c)}
          className="mt-1 text-gray-600 hover:text-gray-300 transition-colors"
        >
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronDown className="w-3.5 h-3.5" />
          }
        </button>
      )}

      {/* Children */}
      {hasChildren && !collapsed && (
        <div className="relative mt-0 pt-4">
          {/* Vertical connector from parent */}
          <div className="absolute top-0 left-1/2 -translate-x-px w-px h-4 bg-[#3a5a3a]" />

          {/* Horizontal bar connecting children */}
          {node.children.length > 1 && (
            <div
              className="absolute top-4 bg-[#3a5a3a]"
              style={{
                left: `calc(${100 / (node.children.length * 2)}%)`,
                right: `calc(${100 / (node.children.length * 2)}%)`,
                height: "1px",
              }}
            />
          )}

          {/* Children row */}
          <div className="flex gap-6 items-start">
            {node.children.map((child, idx) => (
              <div key={child.id} className="relative flex flex-col items-center">
                {/* Vertical drop from horizontal bar */}
                <div className="w-px h-4 bg-[#3a5a3a]" />
                <OrbatTreeNode
                  node={child}
                  onUpdate={updated => updateChild(idx, updated)}
                  onDelete={() => deleteChild(idx)}
                  onAddChild={onAddChild}
                  depth={depth + 1}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <NodeEditor
          node={node}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

// ─── Main ORBAT Builder ───────────────────────────────────────────────────────

interface OrbatBuilderProps {
  value?: string;          // JSON string of OrbatNode tree
  onChange?: (json: string) => void;
  readOnly?: boolean;
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

export default function OrbatBuilder({ value, onChange, readOnly = false }: OrbatBuilderProps) {
  const parseValue = (): OrbatNode => {
    try {
      if (value) return JSON.parse(value);
    } catch {}
    return DEFAULT_ORBAT;
  };

  const [tree, setTree] = useState<OrbatNode>(parseValue);
  const [zoom, setZoom] = useState(1);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateTree = useCallback((updated: OrbatNode) => {
    setTree(updated);
    onChange?.(JSON.stringify(updated));
  }, [onChange]);

  // Find node by id and add a child
  const addChildTo = (parentId: string, root: OrbatNode): OrbatNode => {
    if (root.id === parentId) {
      const newChild: OrbatNode = {
        id: generateId(),
        name: "New Unit",
        unitType: "infantry",
        echelon: "platoon",
        slots: 20,
        children: [],
      };
      return { ...root, children: [...root.children, newChild] };
    }
    return { ...root, children: root.children.map(c => addChildTo(parentId, c)) };
  };

  const handleAddChild = (parentId: string) => {
    updateTree(addChildTo(parentId, tree));
  };

  const countUnits = (node: OrbatNode): number =>
    1 + node.children.reduce((a, c) => a + countUnits(c), 0);

  const countSlots = (node: OrbatNode): number =>
    node.slots + node.children.reduce((a, c) => a + countSlots(c), 0);

  const exportSVG = () => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "orbat.svg";
    a.click();
  };

  return (
    <div className="bg-[#080f08] border border-[#1a3a1a] rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a3a1a] bg-[#0a140a]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-display font-black uppercase tracking-widest text-[#4a9a4a]">ORBAT Builder</span>
          <span className="text-[10px] font-mono text-gray-600">APP-6 Standard</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Stats */}
          <span className="text-[10px] font-mono text-gray-500 mr-2">
            {countUnits(tree)} units · {countSlots(tree)} total slots
          </span>
          {/* Zoom */}
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white border border-[#1a3a1a] hover:border-[#3a6a3a] rounded transition-colors">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-gray-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white border border-[#1a3a1a] hover:border-[#3a6a3a] rounded transition-colors">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(1)}
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white border border-[#1a3a1a] hover:border-[#3a6a3a] rounded transition-colors">
            <RefreshCw className="w-3 h-3" />
          </button>
          {!readOnly && (
            <button onClick={exportSVG}
              className="flex items-center gap-1.5 bg-[#1a3a1a] hover:bg-[#2a5a2a] border border-[#2a5a2a] text-gray-300 hover:text-white font-display font-bold uppercase tracking-wider text-[10px] px-3 py-1.5 rounded transition-colors">
              <Download className="w-3 h-3" /> Export SVG
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-4 py-2 border-b border-[#0f1f0f] bg-[#090e09]">
        {[
          { type: "infantry", label: "Infantry" },
          { type: "armor", label: "Armor" },
          { type: "artillery", label: "Artillery" },
          { type: "cavalry", label: "Recon" },
          { type: "engineer", label: "Engineer" },
          { type: "medical", label: "Medical" },
          { type: "hq", label: "HQ" },
        ].map(item => (
          <div key={item.type} className="flex items-center gap-1.5">
            <NatoSymbolSVG type={item.type} echelon="squad" size={22} />
            <span className="text-[10px] text-gray-500 font-mono">{item.label}</span>
          </div>
        ))}
        <span className="text-[10px] text-gray-700 font-mono ml-auto self-center">Hover unit → click to edit · + to add subordinate</span>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="overflow-auto p-8 min-h-[400px]"
        style={{ background: "radial-gradient(ellipse at center, #0d1a0d 0%, #080f08 100%)" }}
      >
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.15s ease" }}
        >
          <OrbatTreeNode
            node={tree}
            onUpdate={updateTree}
            onDelete={() => {}}
            onAddChild={handleAddChild}
            isRoot
          />
        </div>
      </div>
    </div>
  );
}
