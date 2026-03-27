/**
 * ORBAT Builder — BattleOrder Style
 * NATO APP-6 icons with BattleOrder visual style:
 * coloured symbol boxes, echelon marks, description panels, weapons/vehicles charts
 */

import React, { useState, useRef, useCallback } from "react";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Save,
  ZoomIn, ZoomOut, Download, Copy, X, Edit3, Table2, FileText, Image,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Affiliation = "friendly" | "hostile" | "neutral" | "unknown";
export type Echelon =
  | "" | "fireteam" | "squad" | "section" | "platoon" | "company"
  | "battalion" | "regiment" | "brigade" | "division" | "corps" | "army";

export type UnitType =
  | "infantry" | "armor" | "mechanized" | "airborne" | "air_assault"
  | "ranger" | "special_forces" | "cavalry" | "recon" | "artillery"
  | "mortar" | "antitank" | "air_defense" | "aviation" | "engineer"
  | "signal" | "medical" | "logistics" | "maintenance" | "hq"
  | "headquarters" | "weapons" | "support" | "military_police"
  | "nuclear_bio_chem" | "field_artillery" | "rocket_artillery"
  | "amphibious" | "mountain" | "arctic" | "light_infantry"
  | "motorized" | "wheeled" | "bridging" | "construction"
  | "electronic_warfare" | "cyber" | "psyops" | "civil_affairs"
  | "sniper" | "naval_gunfire" | "forward_observer" | "custom";

export type TaskForceModifier = "none" | "hq" | "taskforce" | "hq_taskforce" | "dummy" | "reinforced" | "reduced" | "reinforced_reduced";

export interface WeaponEntry {
  name: string;
  [unitId: string]: string | number;
}

export interface OrbatNode {
  id: string;
  label: string;
  nickname?: string;
  designation?: string;
  unitType: UnitType;
  affiliation: Affiliation;
  echelon: Echelon;
  modifier: TaskForceModifier;
  fillColor?: string;
  customSymbol?: string;
  description?: string;
  backgroundImageUrl?: string;
  collapsed?: boolean;
  children: OrbatNode[];
  // Strength
  officers?: number;
  enlisted?: number;
  // Weapons rows per unit (stored on root node)
  weaponsChart?: WeaponEntry[];
  vehiclesChart?: WeaponEntry[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId() { return Math.random().toString(36).slice(2, 10); }

function defaultNode(overrides: Partial<OrbatNode> = {}): OrbatNode {
  return {
    id: generateId(),
    label: "New Unit",
    nickname: "",
    designation: "",
    unitType: "infantry",
    affiliation: "friendly",
    echelon: "platoon",
    modifier: "none",
    fillColor: undefined,
    description: "",
    collapsed: false,
    children: [],
    ...overrides,
  };
}

// ─── BattleOrder Color System ─────────────────────────────────────────────────

const AFFILIATION_COLORS: Record<Affiliation, { bg: string; border: string; text: string }> = {
  friendly: { bg: "#4a9e6e", border: "#2d7a50", text: "#fff" },
  hostile:  { bg: "#c0392b", border: "#922b21", text: "#fff" },
  neutral:  { bg: "#27ae60", border: "#1e8449", text: "#fff" },
  unknown:  { bg: "#d4ac0d", border: "#b7950b", text: "#fff" },
};

const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  infantry: "Infantry", armor: "Armor", mechanized: "Mechanized Infantry",
  airborne: "Airborne", air_assault: "Air Assault", ranger: "Ranger",
  special_forces: "Special Forces", cavalry: "Cavalry", recon: "Reconnaissance",
  artillery: "Artillery", mortar: "Mortar", antitank: "Anti-Tank",
  air_defense: "Air Defense", aviation: "Aviation", engineer: "Engineer",
  signal: "Signal", medical: "Medical", logistics: "Logistics",
  maintenance: "Maintenance", hq: "Headquarters", headquarters: "Headquarters",
  weapons: "Weapons", support: "Support", military_police: "Military Police",
  nuclear_bio_chem: "NBC", field_artillery: "Field Artillery",
  rocket_artillery: "Rocket Artillery", amphibious: "Amphibious",
  mountain: "Mountain", arctic: "Arctic", light_infantry: "Light Infantry",
  motorized: "Motorized", wheeled: "Wheeled", bridging: "Bridging",
  construction: "Construction", electronic_warfare: "Electronic Warfare",
  cyber: "Cyber", psyops: "PSYOP", civil_affairs: "Civil Affairs",
  sniper: "Sniper", naval_gunfire: "Naval Gunfire",
  forward_observer: "Forward Observer", custom: "Custom",
};

// BattleOrder-style unit symbols as SVG paths/shapes
function UnitSymbolSVG({ type, affiliation, size = 48, fillColor }: {
  type: UnitType;
  affiliation: Affiliation;
  size?: number;
  fillColor?: string;
}) {
  const colors = AFFILIATION_COLORS[affiliation];
  const bg = fillColor || colors.bg;
  const border = colors.border;
  const s = size;
  const w = s * 1.4;
  const h = s;

  // Inner symbol paths by unit type
  const getInnerSymbol = () => {
    const cx = w / 2, cy = h / 2;
    const lw = Math.max(1.5, s / 24);
    const sc = s / 48; // scale factor

    switch (type) {
      case "infantry":
      case "light_infantry":
      case "airborne":
      case "air_assault":
      case "ranger":
        // Crossed diagonal lines (infantry X)
        return <g stroke="#fff" strokeWidth={lw * 1.5} opacity={0.95}>
          <line x1={cx - 14 * sc} y1={cy - 10 * sc} x2={cx + 14 * sc} y2={cy + 10 * sc} />
          <line x1={cx + 14 * sc} y1={cy - 10 * sc} x2={cx - 14 * sc} y2={cy + 10 * sc} />
        </g>;

      case "armor":
        // Oval (armor)
        return <ellipse cx={cx} cy={cy} rx={14 * sc} ry={8 * sc} fill="none" stroke="#fff" strokeWidth={lw * 1.4} />;

      case "mechanized":
        // Circle with cross
        return <g stroke="#fff" strokeWidth={lw * 1.3} fill="none">
          <circle cx={cx} cy={cy} r={10 * sc} />
          <line x1={cx - 14 * sc} y1={cy - 10 * sc} x2={cx + 14 * sc} y2={cy + 10 * sc} />
          <line x1={cx + 14 * sc} y1={cy - 10 * sc} x2={cx - 14 * sc} y2={cy + 10 * sc} />
        </g>;

      case "cavalry":
      case "recon":
        // Diagonal line
        return <line x1={cx - 14 * sc} y1={cy + 12 * sc} x2={cx + 14 * sc} y2={cy - 12 * sc}
          stroke="#fff" strokeWidth={lw * 2} />;

      case "artillery":
      case "field_artillery":
        // Circle
        return <circle cx={cx} cy={cy} r={10 * sc} fill="none" stroke="#fff" strokeWidth={lw * 1.5} />;

      case "rocket_artillery":
        // Circle with arrow up
        return <g stroke="#fff" strokeWidth={lw * 1.3} fill="none">
          <circle cx={cx} cy={cy + 4 * sc} r={8 * sc} />
          <line x1={cx} y1={cy - 4 * sc} x2={cx} y2={cy - 14 * sc} />
          <line x1={cx - 4 * sc} y1={cy - 10 * sc} x2={cx} y2={cy - 14 * sc} />
          <line x1={cx + 4 * sc} y1={cy - 10 * sc} x2={cx} y2={cy - 14 * sc} />
        </g>;

      case "mortar":
        // Circle with dot
        return <g>
          <circle cx={cx} cy={cy} r={10 * sc} fill="none" stroke="#fff" strokeWidth={lw * 1.3} />
          <circle cx={cx} cy={cy} r={3 * sc} fill="#fff" />
        </g>;

      case "antitank":
        // Inverted triangle
        return <polygon
          points={`${cx},${cy + 12 * sc} ${cx - 12 * sc},${cy - 8 * sc} ${cx + 12 * sc},${cy - 8 * sc}`}
          fill="none" stroke="#fff" strokeWidth={lw * 1.3} />;

      case "air_defense":
        // Triangle up
        return <polygon
          points={`${cx},${cy - 12 * sc} ${cx - 12 * sc},${cy + 8 * sc} ${cx + 12 * sc},${cy + 8 * sc}`}
          fill="none" stroke="#fff" strokeWidth={lw * 1.3} />;

      case "aviation":
        // Rotor blades / helicopter symbol
        return <g stroke="#fff" strokeWidth={lw * 1.3} fill="none">
          <line x1={cx - 14 * sc} y1={cy} x2={cx + 14 * sc} y2={cy} />
          <line x1={cx} y1={cy - 8 * sc} x2={cx} y2={cy + 8 * sc} />
          <circle cx={cx} cy={cy} r={4 * sc} fill="#fff" />
        </g>;

      case "engineer":
      case "bridging":
      case "construction":
        // Castle / tower shape
        return <g stroke="#fff" strokeWidth={lw} fill="none">
          <rect x={cx - 10 * sc} y={cy - 8 * sc} width={20 * sc} height={16 * sc} />
          <line x1={cx - 10 * sc} y1={cy} x2={cx + 10 * sc} y2={cy} />
        </g>;

      case "signal":
        // Lightning bolt / wave
        return <g stroke="#fff" strokeWidth={lw * 1.3} fill="none">
          <polyline points={`${cx - 12 * sc},${cy + 6 * sc} ${cx - 4 * sc},${cy - 6 * sc} ${cx + 4 * sc},${cy + 6 * sc} ${cx + 12 * sc},${cy - 6 * sc}`} />
        </g>;

      case "medical":
        // Cross
        return <g stroke="#fff" strokeWidth={lw * 2} fill="none">
          <line x1={cx} y1={cy - 12 * sc} x2={cx} y2={cy + 12 * sc} />
          <line x1={cx - 12 * sc} y1={cy} x2={cx + 12 * sc} y2={cy} />
        </g>;

      case "logistics":
      case "maintenance":
      case "support":
        // Wrench/gear simple square
        return <rect x={cx - 10 * sc} y={cy - 10 * sc} width={20 * sc} height={20 * sc}
          fill="none" stroke="#fff" strokeWidth={lw * 1.3} />;

      case "special_forces":
        // X with inner diamond
        return <g stroke="#fff" strokeWidth={lw * 1.5} fill="none">
          <line x1={cx - 12 * sc} y1={cy - 12 * sc} x2={cx + 12 * sc} y2={cy + 12 * sc} />
          <line x1={cx + 12 * sc} y1={cy - 12 * sc} x2={cx - 12 * sc} y2={cy + 12 * sc} />
          <polygon points={`${cx},${cy - 7 * sc} ${cx + 7 * sc},${cy} ${cx},${cy + 7 * sc} ${cx - 7 * sc},${cy}`} />
        </g>;

      case "hq":
      case "headquarters":
        // "HQ" text
        return <text x={cx} y={cy + 5 * sc} textAnchor="middle" fill="#fff"
          fontSize={14 * sc} fontWeight="bold" fontFamily="Arial, sans-serif">HQ</text>;

      case "weapons":
        // WPN text
        return <text x={cx} y={cy + 4 * sc} textAnchor="middle" fill="#fff"
          fontSize={10 * sc} fontWeight="bold" fontFamily="Arial, sans-serif">WPN</text>;

      case "military_police":
        // MP text
        return <text x={cx} y={cy + 5 * sc} textAnchor="middle" fill="#fff"
          fontSize={13 * sc} fontWeight="bold" fontFamily="Arial, sans-serif">MP</text>;

      case "nuclear_bio_chem":
        return <text x={cx} y={cy + 4 * sc} textAnchor="middle" fill="#fff"
          fontSize={9 * sc} fontWeight="bold" fontFamily="Arial, sans-serif">NBC</text>;

      case "electronic_warfare":
        return <text x={cx} y={cy + 4 * sc} textAnchor="middle" fill="#fff"
          fontSize={9 * sc} fontWeight="bold" fontFamily="Arial, sans-serif">EW</text>;

      case "forward_observer":
        return <text x={cx} y={cy + 4 * sc} textAnchor="middle" fill="#fff"
          fontSize={9 * sc} fontWeight="bold" fontFamily="Arial, sans-serif">FO</text>;

      case "sniper":
        // Crosshair
        return <g stroke="#fff" strokeWidth={lw * 1.2} fill="none">
          <circle cx={cx} cy={cy} r={9 * sc} />
          <line x1={cx} y1={cy - 14 * sc} x2={cx} y2={cy - 9 * sc} />
          <line x1={cx} y1={cy + 9 * sc} x2={cx} y2={cy + 14 * sc} />
          <line x1={cx - 14 * sc} y1={cy} x2={cx - 9 * sc} y2={cy} />
          <line x1={cx + 9 * sc} y1={cy} x2={cx + 14 * sc} y2={cy} />
        </g>;

      case "cyber":
        return <text x={cx} y={cy + 4 * sc} textAnchor="middle" fill="#fff"
          fontSize={9 * sc} fontWeight="bold" fontFamily="Arial, sans-serif">CY</text>;

      case "psyops":
        return <text x={cx} y={cy + 4 * sc} textAnchor="middle" fill="#fff"
          fontSize={9 * sc} fontWeight="bold" fontFamily="Arial, sans-serif">PSY</text>;

      case "civil_affairs":
        return <text x={cx} y={cy + 4 * sc} textAnchor="middle" fill="#fff"
          fontSize={9 * sc} fontWeight="bold" fontFamily="Arial, sans-serif">CA</text>;

      case "motorized":
      case "wheeled":
        // Wheel circle
        return <g stroke="#fff" strokeWidth={lw * 1.3} fill="none">
          <circle cx={cx} cy={cy} r={10 * sc} />
          <line x1={cx - 10 * sc} y1={cy - 10 * sc} x2={cx + 10 * sc} y2={cy + 10 * sc} />
          <line x1={cx + 10 * sc} y1={cy - 10 * sc} x2={cx - 10 * sc} y2={cy + 10 * sc} />
        </g>;

      case "mountain":
        // Triangle (mountain)
        return <polygon
          points={`${cx},${cy - 13 * sc} ${cx - 13 * sc},${cy + 9 * sc} ${cx + 13 * sc},${cy + 9 * sc}`}
          fill="none" stroke="#fff" strokeWidth={lw * 1.3} />;

      case "amphibious":
        // Wave line
        return <g stroke="#fff" strokeWidth={lw * 1.5} fill="none">
          <line x1={cx - 14 * sc} y1={cy - 10 * sc} x2={cx + 14 * sc} y2={cy + 10 * sc} />
          <line x1={cx + 14 * sc} y1={cy - 10 * sc} x2={cx - 14 * sc} y2={cy + 10 * sc} />
          <line x1={cx - 12 * sc} y1={cy + 8 * sc} x2={cx + 12 * sc} y2={cy + 8 * sc} />
        </g>;

      default:
        // Generic X
        return <g stroke="#fff" strokeWidth={lw * 1.5}>
          <line x1={cx - 12 * sc} y1={cy - 10 * sc} x2={cx + 12 * sc} y2={cy + 10 * sc} />
          <line x1={cx + 12 * sc} y1={cy - 10 * sc} x2={cx - 12 * sc} y2={cy + 10 * sc} />
        </g>;
    }
  };

  // Echelon & modifier marks rendered outside the box (above)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", display: "block" }}>
      {/* Main box */}
      <rect x={2} y={2} width={w - 4} height={h - 4} rx={2}
        fill={bg} stroke={border} strokeWidth={2} />
      {/* Inner symbol */}
      {getInnerSymbol()}
    </svg>
  );
}

// ─── Echelon mark ─────────────────────────────────────────────────────────────

const ECHELON_MARKS: Record<Echelon, string> = {
  "": "",
  fireteam: "·",
  squad: "··",
  section: "···",
  platoon: "|",
  company: "||",
  battalion: "|||",
  regiment: "X",
  brigade: "XX",
  division: "XXX",
  corps: "XXXX",
  army: "XXXXX",
};

const ECHELON_OPTIONS: { id: Echelon; label: string }[] = [
  { id: "", label: "None" },
  { id: "fireteam", label: "Fireteam / Crew" },
  { id: "squad", label: "Squad" },
  { id: "section", label: "Section" },
  { id: "platoon", label: "Platoon / Detachment" },
  { id: "company", label: "Company / Battery / Troop" },
  { id: "battalion", label: "Battalion / Squadron" },
  { id: "regiment", label: "Regiment / Group" },
  { id: "brigade", label: "Brigade" },
  { id: "division", label: "Division" },
  { id: "corps", label: "Corps" },
  { id: "army", label: "Army" },
];

const MODIFIER_OPTIONS: { id: TaskForceModifier; label: string }[] = [
  { id: "none", label: "None" },
  { id: "hq", label: "Headquarters (HQ)" },
  { id: "taskforce", label: "Task Force (TF)" },
  { id: "hq_taskforce", label: "HQ + Task Force" },
  { id: "dummy", label: "Dummy / Feint" },
  { id: "reinforced", label: "Reinforced (+)" },
  { id: "reduced", label: "Reduced (-)" },
  { id: "reinforced_reduced", label: "Reinforced & Reduced (±)" },
];

const AFFILIATION_OPTIONS: { id: Affiliation; label: string }[] = [
  { id: "friendly", label: "Friendly" },
  { id: "hostile", label: "Hostile / Enemy" },
  { id: "neutral", label: "Neutral" },
  { id: "unknown", label: "Unknown" },
];

const UNIT_TYPE_OPTIONS: { id: UnitType; label: string }[] = Object.entries(UNIT_TYPE_LABELS)
  .map(([id, label]) => ({ id: id as UnitType, label }))
  .sort((a, b) => a.label.localeCompare(b.label));

// ─── Layout constants ─────────────────────────────────────────────────────────

const NODE_W = 110;
const NODE_H = 90;
const H_GAP  = 28;
const V_GAP  = 70;
const TREE_SEP = 40;

interface LayoutNode {
  node: OrbatNode;
  x: number;
  y: number;
  depth: number;
}

function leafCount(n: OrbatNode): number {
  if (n.collapsed || n.children.length === 0) return 1;
  return n.children.reduce((s, c) => s + leafCount(c), 0);
}

function layoutTree(node: OrbatNode, offsetX: number, depth: number): LayoutNode {
  return { node, x: offsetX + (leafCount(node) * (NODE_W + H_GAP)) / 2, y: depth * (NODE_H + V_GAP), depth };
}

function layoutAll(node: OrbatNode, startX: number, depth: number): LayoutNode[] {
  const results: LayoutNode[] = [];
  const totalW = leafCount(node) * (NODE_W + H_GAP);
  const cx = startX + totalW / 2;
  results.push({ node, x: cx, y: depth * (NODE_H + V_GAP), depth });

  if (!node.collapsed && node.children.length > 0) {
    let childX = startX;
    for (const child of node.children) {
      const childLeaves = leafCount(child);
      const childW = childLeaves * (NODE_W + H_GAP);
      results.push(...layoutAll(child, childX, depth + 1));
      childX += childW;
    }
  }
  return results;
}

function buildEdges(nodes: LayoutNode[]): { x1: number; y1: number; x2: number; y2: number }[] {
  const byId = new Map<string, LayoutNode>();
  for (const n of nodes) byId.set(n.node.id, n);
  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];

  for (const ln of nodes) {
    if (ln.node.collapsed) continue;
    for (const child of ln.node.children) {
      const childLn = byId.get(child.id);
      if (!childLn) continue;
      const parentBottomY = ln.y + NODE_H + 16;
      const midY = ln.y + NODE_H + V_GAP / 2;
      edges.push({ x1: ln.x, y1: parentBottomY, x2: ln.x, y2: midY });
      edges.push({ x1: ln.x, y1: midY, x2: childLn.x, y2: midY });
      edges.push({ x1: childLn.x, y1: midY, x2: childLn.x, y2: childLn.y - 2 });
    }
  }
  return edges;
}

// ─── Unit Card ────────────────────────────────────────────────────────────────

function UnitCard({
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
  const [hovered, setHovered] = useState(false);
  const colors = AFFILIATION_COLORS[node.affiliation];
  const echelonMark = ECHELON_MARKS[node.echelon] || "";
  const hasChildren = node.children && node.children.length > 0;

  const modifierText = () => {
    switch (node.modifier) {
      case "hq": return "HQ";
      case "taskforce": return "TF";
      case "hq_taskforce": return "HQ/TF";
      case "dummy": return "(D)";
      case "reinforced": return "(+)";
      case "reduced": return "(-)";
      case "reinforced_reduced": return "(±)";
      default: return null;
    }
  };
  const mod = modifierText();

  return (
    <div
      style={{ position: "absolute", left: x - NODE_W / 2, top: y, width: NODE_W }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Echelon mark above box */}
      <div style={{ textAlign: "center", height: 16, lineHeight: "16px", marginBottom: 2 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: "#e5e7eb", letterSpacing: 1,
          fontFamily: "serif",
        }}>{echelonMark}</span>
      </div>

      {/* Action bar */}
      {hovered && !readOnly && (
        <div style={{
          position: "absolute", top: -26, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 2, background: "#1f2937", border: "1px solid #374151",
          borderRadius: 6, padding: "2px 4px", zIndex: 30, whiteSpace: "nowrap",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }}>
          {[
            { icon: <Plus size={11} />, action: () => onAddChild(node.id), title: "Add child" },
            { icon: <Edit3 size={11} />, action: () => onEdit(node), title: "Edit" },
            { icon: <Copy size={11} />, action: () => onDuplicate(node), title: "Duplicate" },
            { icon: <Trash2 size={11} />, action: () => onDelete(node.id), title: "Delete" },
          ].map((btn, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); btn.action(); }} title={btn.title}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: "#9ca3af", padding: "2px 3px", borderRadius: 3,
                display: "flex", alignItems: "center",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f9fafb")}
              onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
            >{btn.icon}</button>
          ))}
        </div>
      )}

      {/* Main card */}
      <div
        onClick={() => onEdit(node)}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          cursor: "pointer", position: "relative",
          filter: hovered ? "drop-shadow(0 0 8px rgba(74,158,110,0.4))" : undefined,
        }}
      >
        {/* Modifier badge top-right */}
        {mod && (
          <div style={{
            position: "absolute", top: 0, right: -2, zIndex: 10,
            background: "#1f2937", border: `1px solid ${colors.border}`,
            color: colors.bg, fontSize: 8, fontWeight: 700, padding: "1px 3px",
            borderRadius: 3, fontFamily: "monospace",
          }}>{mod}</div>
        )}

        {/* Symbol box */}
        <div style={{ position: "relative" }}>
          <UnitSymbolSVG
            type={node.unitType}
            affiliation={node.affiliation}
            size={40}
            fillColor={node.fillColor}
          />
          {/* Designation inside box top-left */}
          {node.designation && (
            <div style={{
              position: "absolute", top: 2, left: 4,
              fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.9)",
              fontFamily: "monospace", pointerEvents: "none",
            }}>{node.designation}</div>
          )}
        </div>

        {/* Label below box */}
        <div style={{ marginTop: 4, textAlign: "center", width: NODE_W }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "#f9fafb", lineHeight: 1.2,
            fontFamily: "Arial, sans-serif",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }} title={node.label}>{node.label}</div>
          {node.nickname && (
            <div style={{
              fontSize: 9, color: "#9ca3af", fontStyle: "italic", lineHeight: 1.2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{`"${node.nickname}"`}</div>
          )}
        </div>
      </div>

      {/* Expand/collapse */}
      {hasChildren && (
        <button
          onClick={e => { e.stopPropagation(); onToggle(node.id); }}
          style={{
            position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)",
            width: 18, height: 18, borderRadius: "50%",
            background: "#111827", border: "1px solid #374151",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", zIndex: 10,
          }}
        >
          {node.collapsed
            ? <ChevronDown size={10} color="#9ca3af" />
            : <ChevronRight size={10} color="#9ca3af" style={{ transform: "rotate(90deg)" }} />}
        </button>
      )}
    </div>
  );
}

// ─── Description Panel ────────────────────────────────────────────────────────

function DescriptionPanel({ nodes }: { nodes: OrbatNode[] }) {
  // Find root node description
  const root = nodes[0];
  if (!root?.description) return null;

  return (
    <div style={{
      marginTop: 24, maxWidth: 500, background: "#0f172a",
      border: "1px solid #1e3a5f", borderRadius: 6, padding: 16,
      backgroundImage: root.backgroundImageUrl
        ? `linear-gradient(rgba(15,23,42,0.88), rgba(15,23,42,0.88)), url(${root.backgroundImageUrl})`
        : undefined,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      <p style={{
        fontSize: 11, color: "#cbd5e1", lineHeight: 1.6,
        fontFamily: "Times New Roman, serif",
        whiteSpace: "pre-wrap",
        margin: 0,
      }}>{root.description}</p>
    </div>
  );
}

// ─── Weapons/Vehicles Chart ───────────────────────────────────────────────────

function StrengthChart({ title, rows, unitLabels }: {
  title: string;
  rows: WeaponEntry[];
  unitLabels: { id: string; label: string }[];
}) {
  if (!rows || rows.length === 0) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase",
        letterSpacing: 2, marginBottom: 6, fontFamily: "Arial, sans-serif",
      }}>{title}</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{
          borderCollapse: "collapse", fontSize: 10,
          fontFamily: "Arial, sans-serif", color: "#e2e8f0",
        }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: "left", minWidth: 120 }}>Equipment</th>
              {unitLabels.map(u => (
                <th key={u.id} style={{ ...thStyle, minWidth: 60 }}>{u.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : undefined }}>
                <td style={{ ...tdStyle, textAlign: "left", fontWeight: 600 }}>{row.name}</td>
                {unitLabels.map(u => (
                  <td key={u.id} style={tdStyle}>{row[u.id] ?? "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  background: "#1e293b", border: "1px solid #334155",
  padding: "4px 8px", textAlign: "center", fontWeight: 700,
  fontSize: 9, color: "#94a3b8", textTransform: "uppercase" as const,
};
const tdStyle: React.CSSProperties = {
  border: "1px solid #1e293b", padding: "3px 8px",
  textAlign: "center", fontSize: 10,
};

// ─── Node Editor ──────────────────────────────────────────────────────────────

function NodeEditor({ node, onSave, onClose }: {
  node: OrbatNode;
  onSave: (n: OrbatNode) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<OrbatNode>({ ...node });
  const [tab, setTab] = useState<"unit" | "description" | "charts">("unit");

  function set<K extends keyof OrbatNode>(k: K, v: OrbatNode[K]) {
    setDraft(d => ({ ...d, [k]: v }));
  }

  const weaponsChartText = draft.weaponsChart ? JSON.stringify(draft.weaponsChart, null, 2) : "";
  const vehiclesChartText = draft.vehiclesChart ? JSON.stringify(draft.vehiclesChart, null, 2) : "";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.7)", display: "flex",
      alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#0f172a", border: "1px solid #1e293b",
        borderRadius: 10, width: 520, maxHeight: "90vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: "1px solid #1e293b", background: "#0a1628",
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", fontFamily: "Arial, sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>
            Edit Unit
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #1e293b" }}>
          {([
            { id: "unit", label: "Unit", icon: <Edit3 size={12} /> },
            { id: "description", label: "Description", icon: <FileText size={12} /> },
            { id: "charts", label: "Charts", icon: <Table2 size={12} /> },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "8px 0", background: tab === t.id ? "#1e293b" : "transparent",
              border: "none", borderBottom: tab === t.id ? "2px solid #3b82f6" : "2px solid transparent",
              color: tab === t.id ? "#f1f5f9" : "#64748b", cursor: "pointer",
              fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 5, fontFamily: "Arial, sans-serif",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {tab === "unit" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Unit Label">
                <input value={draft.label} onChange={e => set("label", e.target.value)} style={inputStyle} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Nickname / Callsign">
                  <input value={draft.nickname || ""} onChange={e => set("nickname", e.target.value)} style={inputStyle} placeholder='e.g. "Attack"' />
                </Field>
                <Field label="Designation">
                  <input value={draft.designation || ""} onChange={e => set("designation", e.target.value)} style={inputStyle} placeholder="e.g. A, 1, 28" />
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Unit Type">
                  <select value={draft.unitType} onChange={e => set("unitType", e.target.value as UnitType)} style={inputStyle}>
                    {UNIT_TYPE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Affiliation">
                  <select value={draft.affiliation} onChange={e => set("affiliation", e.target.value as Affiliation)} style={inputStyle}>
                    {AFFILIATION_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Echelon">
                  <select value={draft.echelon} onChange={e => set("echelon", e.target.value as Echelon)} style={inputStyle}>
                    {ECHELON_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Modifier">
                  <select value={draft.modifier} onChange={e => set("modifier", e.target.value as TaskForceModifier)} style={inputStyle}>
                    {MODIFIER_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Custom Fill Color (overrides affiliation)">
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="color" value={draft.fillColor || AFFILIATION_COLORS[draft.affiliation].bg}
                    onChange={e => set("fillColor", e.target.value)}
                    style={{ width: 36, height: 32, borderRadius: 4, border: "1px solid #334155", cursor: "pointer", background: "none" }} />
                  {draft.fillColor && (
                    <button onClick={() => set("fillColor", undefined)}
                      style={{ ...btnSecondaryStyle, fontSize: 10 }}>Reset to default</button>
                  )}
                </div>
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Officers">
                  <input type="number" value={draft.officers ?? ""} onChange={e => set("officers", e.target.value ? +e.target.value : undefined)} style={inputStyle} min={0} />
                </Field>
                <Field label="Enlisted / OR">
                  <input type="number" value={draft.enlisted ?? ""} onChange={e => set("enlisted", e.target.value ? +e.target.value : undefined)} style={inputStyle} min={0} />
                </Field>
              </div>
            </div>
          )}

          {tab === "description" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Unit Description / Notes">
                <textarea
                  value={draft.description || ""}
                  onChange={e => set("description", e.target.value)}
                  rows={8}
                  style={{ ...inputStyle, resize: "vertical", minHeight: 140 }}
                  placeholder="Enter unit history, role, equipment notes, tactics..."
                />
              </Field>
              <Field label="Background Image URL (optional)">
                <input
                  value={draft.backgroundImageUrl || ""}
                  onChange={e => set("backgroundImageUrl", e.target.value)}
                  style={inputStyle}
                  placeholder="https://..."
                />
              </Field>
              {draft.backgroundImageUrl && (
                <div style={{
                  borderRadius: 6, overflow: "hidden", border: "1px solid #1e293b",
                  height: 80,
                  background: `linear-gradient(rgba(15,23,42,0.7),rgba(15,23,42,0.7)), url(${draft.backgroundImageUrl}) center/cover`,
                }}>
                  <div style={{ padding: 8, fontSize: 10, color: "#94a3b8" }}>Preview</div>
                </div>
              )}
            </div>
          )}

          {tab === "charts" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>
                Enter JSON arrays for weapons and vehicles charts. Each row needs a <code style={{ color: "#60a5fa" }}>name</code> field plus unit IDs as keys.
                <br />Example: <code style={{ color: "#60a5fa", fontSize: 10 }}>{`[{"name":"M4 Carbine","alpha":"30","bravo":"30"}]`}</code>
              </div>
              <Field label="Weapons Chart (JSON)">
                <textarea
                  value={weaponsChartText}
                  onChange={e => {
                    try { set("weaponsChart", JSON.parse(e.target.value)); } catch { /* ignore */ }
                  }}
                  rows={6}
                  style={{ ...inputStyle, fontFamily: "monospace", fontSize: 10, resize: "vertical" }}
                  placeholder='[{"name":"M4 Carbine","company_a":"30","company_b":"30"}]'
                />
              </Field>
              <Field label="Vehicles Chart (JSON)">
                <textarea
                  value={vehiclesChartText}
                  onChange={e => {
                    try { set("vehiclesChart", JSON.parse(e.target.value)); } catch { /* ignore */ }
                  }}
                  rows={6}
                  style={{ ...inputStyle, fontFamily: "monospace", fontSize: 10, resize: "vertical" }}
                  placeholder='[{"name":"M2 Bradley","company_a":"14","company_b":"14"}]'
                />
              </Field>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "10px 16px", borderTop: "1px solid #1e293b",
          display: "flex", justifyContent: "flex-end", gap: 8,
        }}>
          <button onClick={onClose} style={btnSecondaryStyle}>Cancel</button>
          <button onClick={() => { onSave(draft); onClose(); }} style={btnPrimaryStyle}>Save Unit</button>
        </div>
      </div>
    </div>
  );
}

// Shared styles
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "6px 10px", background: "#1e293b",
  border: "1px solid #334155", borderRadius: 5, color: "#f1f5f9",
  fontSize: 12, fontFamily: "Arial, sans-serif", boxSizing: "border-box",
};
const btnPrimaryStyle: React.CSSProperties = {
  padding: "7px 18px", background: "#2563eb", color: "#fff",
  border: "none", borderRadius: 5, cursor: "pointer",
  fontSize: 12, fontWeight: 700, fontFamily: "Arial, sans-serif",
};
const btnSecondaryStyle: React.CSSProperties = {
  padding: "7px 14px", background: "#1e293b", color: "#94a3b8",
  border: "1px solid #334155", borderRadius: 5, cursor: "pointer",
  fontSize: 12, fontFamily: "Arial, sans-serif",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "Arial, sans-serif" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Main ORBAT Canvas ────────────────────────────────────────────────────────

function OrbatCanvas({ roots, onEdit, onAddChild, onDelete, onDuplicate, onToggle, readOnly }: {
  roots: OrbatNode[];
  onEdit: (n: OrbatNode) => void;
  onAddChild: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (n: OrbatNode) => void;
  onToggle: (id: string) => void;
  readOnly: boolean;
}) {
  let allLayoutNodes: LayoutNode[] = [];
  let offsetX = 0;

  for (const root of roots) {
    const lc = leafCount(root);
    const treeW = lc * (NODE_W + H_GAP);
    allLayoutNodes.push(...layoutAll(root, offsetX, 0));
    offsetX += treeW + TREE_SEP;
  }

  const edges = buildEdges(allLayoutNodes);
  let maxX = 0, maxY = 0;
  for (const n of allLayoutNodes) {
    if (n.x + NODE_W / 2 > maxX) maxX = n.x + NODE_W / 2;
    if (n.y + NODE_H > maxY) maxY = n.y + NODE_H;
  }
  const canvasW = Math.max(offsetX, 300);
  const canvasH = Math.max(maxY + 60, 200);

  return (
    <div style={{ position: "relative", width: canvasW, height: canvasH }}>
      <svg style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
        width={canvasW} height={canvasH}>
        {edges.map((e, i) => (
          <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke="#334155" strokeWidth={1.5} />
        ))}
      </svg>
      {allLayoutNodes.map(ln => (
        <UnitCard key={ln.node.id} ln={ln}
          onEdit={onEdit} onAddChild={onAddChild} onDelete={onDelete}
          onDuplicate={onDuplicate} onToggle={onToggle} readOnly={readOnly} />
      ))}
    </div>
  );
}

// ─── Main Builder Export ──────────────────────────────────────────────────────

interface OrbatBuilderProps {
  // New API
  initialData?: OrbatNode[];
  onSave?: (nodes: OrbatNode[]) => void;
  // Legacy API (value = JSON string, onChange = JSON string callback)
  value?: string;
  onChange?: (json: string) => void;
  groupName?: string;
  roster?: any[];
  readOnly?: boolean;
}

export default function OrbatBuilder({ initialData, onSave, value, onChange, readOnly = false }: OrbatBuilderProps) {
  // Parse legacy JSON string prop
  const parsedInitial: OrbatNode[] = React.useMemo(() => {
    if (initialData) return initialData;
    if (value) {
      try { return JSON.parse(value) as OrbatNode[]; } catch { return []; }
    }
    return [];
  }, []);

  const [nodes, setNodes] = useState<OrbatNode[]>(parsedInitial);
  const [editingNode, setEditingNode] = useState<OrbatNode | null>(null);
  const [zoom, setZoom] = useState(1);

  // Fire legacy onChange when nodes change
  React.useEffect(() => {
    if (onChange) onChange(JSON.stringify(nodes));
  }, [nodes]);

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

  function handleAddChild(pid: string) {
    const child = defaultNode({ echelon: "squad" });
    setNodes(p => addChildTo(p, pid, child));
    setEditingNode(child);
  }
  function handleAddRoot() {
    const node = defaultNode({ echelon: "battalion" });
    setNodes(p => [...p, node]);
    setEditingNode(node);
  }
  function handleSaveEdit(updated: OrbatNode) {
    setNodes(prev => {
      const flat = JSON.stringify(prev);
      return flat.includes(`"id":"${updated.id}"`)
        ? replaceById(prev, updated.id, updated)
        : [...prev, updated];
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
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "orbat.json";
    a.click();
  }

  // Collect all unit labels for charts (flatten tree)
  function flattenNodes(tree: OrbatNode[]): OrbatNode[] {
    return tree.flatMap(n => [n, ...flattenNodes(n.children)]);
  }
  const allNodes = flattenNodes(nodes);
  const unitLabels = allNodes.map(n => ({ id: n.id, label: n.label }));
  const rootNode = nodes[0];

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "#070d1a", border: "1px solid #1e293b",
      borderRadius: 8, overflow: "hidden", fontFamily: "Arial, sans-serif",
    }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px", borderBottom: "1px solid #1e293b", background: "#0a1628",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 2 }}>ORBAT</span>
          <span style={{
            fontSize: 9, background: "rgba(74,158,110,0.15)", color: "#4a9e6e",
            border: "1px solid rgba(74,158,110,0.3)", borderRadius: 3, padding: "1px 6px",
            fontWeight: 700, letterSpacing: 1,
          }}>BATTLE ORDER STYLE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))}
            style={{ ...iconBtnStyle }}><ZoomOut size={13} /></button>
          <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", width: 36, textAlign: "center" }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(z => Math.min(2.5, +(z + 0.1).toFixed(1)))}
            style={{ ...iconBtnStyle }}><ZoomIn size={13} /></button>
          <div style={{ width: 1, height: 16, background: "#1e293b", margin: "0 4px" }} />
          <button onClick={handleExport} style={{ ...iconBtnStyle }} title="Export JSON"><Download size={13} /></button>
          {!readOnly && onSave && (
            <button onClick={() => onSave(nodes)} style={btnPrimaryStyle}>
              <Save size={11} /> Save
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {nodes.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: "100%", gap: 16, textAlign: "center",
          }}>
            <div style={{ opacity: 0.3 }}>
              <UnitSymbolSVG type="infantry" affiliation="friendly" size={56} />
            </div>
            <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>No units yet. Build your ORBAT.</p>
            {!readOnly && (
              <button onClick={handleAddRoot} style={{ ...btnPrimaryStyle, fontSize: 13, padding: "10px 24px" }}>
                <Plus size={14} /> Add Root Unit
              </button>
            )}
          </div>
        ) : (
          <div>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", display: "inline-block" }}>
              <OrbatCanvas
                roots={nodes}
                onEdit={setEditingNode}
                onAddChild={handleAddChild}
                onDelete={id => setNodes(p => deleteById(p, id))}
                onDuplicate={handleDuplicate}
                onToggle={id => setNodes(p => updateById(p, id, { collapsed: !findNode(p, id)?.collapsed }))}
                readOnly={readOnly}
              />
            </div>

            {/* Description panel */}
            {rootNode?.description && (
              <div style={{ marginTop: 24 }}>
                <DescriptionPanel nodes={nodes} />
              </div>
            )}

            {/* Strength charts */}
            {rootNode?.weaponsChart && rootNode.weaponsChart.length > 0 && (
              <div style={{
                marginTop: 24, background: "#0a1628",
                border: "1px solid #1e293b", borderRadius: 6, padding: 16,
              }}>
                <StrengthChart title="KEY WEAPONS" rows={rootNode.weaponsChart} unitLabels={unitLabels} />
              </div>
            )}
            {rootNode?.vehiclesChart && rootNode.vehiclesChart.length > 0 && (
              <div style={{
                marginTop: 12, background: "#0a1628",
                border: "1px solid #1e293b", borderRadius: 6, padding: 16,
              }}>
                <StrengthChart title="VEHICLES & EQUIPMENT" rows={rootNode.vehiclesChart} unitLabels={unitLabels} />
              </div>
            )}

            {!readOnly && (
              <div style={{ marginTop: 16 }}>
                <button onClick={handleAddRoot} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", border: "1px dashed #1e293b",
                  borderRadius: 5, background: "transparent", color: "#475569",
                  cursor: "pointer", fontSize: 11,
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#334155")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e293b")}
                ><Plus size={12} /> Add Root Unit</button>
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

const iconBtnStyle: React.CSSProperties = {
  background: "transparent", border: "none", cursor: "pointer",
  color: "#64748b", padding: "4px 6px", borderRadius: 4,
  display: "flex", alignItems: "center",
};
