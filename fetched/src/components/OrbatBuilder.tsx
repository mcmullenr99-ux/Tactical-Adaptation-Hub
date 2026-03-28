/**
 * ORBAT Builder — Enhanced v2
 * Full symbol library, interactive charts, roster slots, flag backgrounds, site theme
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Plus, Trash2, Save, ZoomIn, ZoomOut, Download, Copy, X, Edit3, Table2, FileText,
  Users, Flag, ChevronDown, ChevronUp,
} from "lucide-react";

export type Affiliation = "friendly" | "hostile" | "neutral" | "unknown";
export type Echelon = "" | "fireteam" | "squad" | "section" | "platoon" | "staffel" | "company" | "battalion" | "regiment" | "brigade" | "division" | "corps" | "army" | "theater" | "command";
export type TaskForceModifier = "none" | "hq" | "taskforce" | "hq_taskforce" | "dummy" | "reinforced" | "reduced" | "reinforced_reduced";

export interface WeaponEntry { name: string; [unitId: string]: string | number; }
export interface ChartColumn { id: string; label: string; }
export interface OrbatNode {
  id: string; label: string; nickname?: string; designation?: string;
  unitType: string; affiliation: Affiliation; echelon: Echelon; modifier: TaskForceModifier;
  fillColor?: string; flagCode?: string; description?: string; backgroundImageUrl?: string;
  collapsed?: boolean; children: OrbatNode[];
  officers?: number; enlisted?: number; rosterSlots?: string[];
  weaponsChart?: WeaponEntry[]; vehiclesChart?: WeaponEntry[];
  weaponsCols?: ChartColumn[]; vehiclesCols?: ChartColumn[];
}

function generateId() { return Math.random().toString(36).slice(2, 10); }
function defaultNode(overrides: Partial<OrbatNode> = {}): OrbatNode {
  return { id: generateId(), label: "New Unit", nickname: "", designation: "", unitType: "infantry",
    affiliation: "friendly", echelon: "platoon", modifier: "none", description: "", collapsed: false,
    children: [], rosterSlots: [], ...overrides };
}

const THEME = {
  bg: "#0d1117", bgCard: "#111827", bgPanel: "#0a0f1a", bgInput: "#1a2332",
  border: "#1e3a2e", borderLight: "#243b30", accent: "#22c55e",
  accentDim: "rgba(34,197,94,0.15)", accentBorder: "rgba(34,197,94,0.35)",
  text: "#f1f5f9", textMuted: "#6b8a7a", textDim: "#4a6b5a",
  danger: "#ef4444", dangerDim: "rgba(239,68,68,0.15)",
};

const AFFILIATION_COLORS: Record<Affiliation, { bg: string; border: string }> = {
  friendly: { bg: "#1a56a0", border: "#1245a8" },
  hostile:  { bg: "#c0392b", border: "#922b21" },
  neutral:  { bg: "#2e7d32", border: "#1b5e20" },
  unknown:  { bg: "#f59e0b", border: "#b45309" },
};

interface UnitSymbolDef {
  id: string; label: string; category: string;
  render: (cx: number, cy: number, sc: number, lw: number) => React.ReactNode;
}

const SYMBOL_LIBRARY: UnitSymbolDef[] = [
  { id: "infantry", label: "Infantry", category: "Infantry",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.5}><line x1={cx-14*sc} y1={cy-10*sc} x2={cx+14*sc} y2={cy+10*sc}/><line x1={cx+14*sc} y1={cy-10*sc} x2={cx-14*sc} y2={cy+10*sc}/></g> },
  { id: "infantry_airborne", label: "Infantry (Airborne)", category: "Infantry",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.5}><line x1={cx-14*sc} y1={cy-10*sc} x2={cx+14*sc} y2={cy+10*sc}/><line x1={cx+14*sc} y1={cy-10*sc} x2={cx-14*sc} y2={cy+10*sc}/><path d={`M${cx-10*sc},${cy+10*sc} Q${cx},${cy+3*sc} ${cx+10*sc},${cy+10*sc}`} fill="none" strokeWidth={lw}/></g> },
  { id: "infantry_air_assault", label: "Infantry (Air Assault)", category: "Infantry",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.5}><line x1={cx-14*sc} y1={cy-10*sc} x2={cx+14*sc} y2={cy+10*sc}/><line x1={cx+14*sc} y1={cy-10*sc} x2={cx-14*sc} y2={cy+10*sc}/><path d={`M${cx-10*sc},${cy+10*sc} Q${cx},${cy+4*sc} ${cx+10*sc},${cy+10*sc}`} fill="none" strokeWidth={lw}/><line x1={cx-6*sc} y1={cy+10*sc} x2={cx-6*sc} y2={cy+14*sc}/><line x1={cx+6*sc} y1={cy+10*sc} x2={cx+6*sc} y2={cy+14*sc}/></g> },
  { id: "infantry_armored", label: "Infantry (Armored, IFV)", category: "Infantry",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.4}><line x1={cx-14*sc} y1={cy-10*sc} x2={cx+14*sc} y2={cy+10*sc}/><line x1={cx+14*sc} y1={cy-10*sc} x2={cx-14*sc} y2={cy+10*sc}/><ellipse cx={cx} cy={cy+8*sc} rx={8*sc} ry={4*sc} fill="none"/></g> },
  { id: "infantry_amphibious", label: "Infantry (Amphibious)", category: "Infantry",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.4}><line x1={cx-14*sc} y1={cy-10*sc} x2={cx+14*sc} y2={cy+10*sc}/><line x1={cx+14*sc} y1={cy-10*sc} x2={cx-14*sc} y2={cy+10*sc}/><path d={`M${cx-12*sc},${cy+10*sc} Q${cx-6*sc},${cy+6*sc} ${cx},${cy+10*sc} Q${cx+6*sc},${cy+14*sc} ${cx+12*sc},${cy+10*sc}`} fill="none" strokeWidth={lw}/></g> },
  { id: "infantry_arctic", label: "Infantry (Arctic)", category: "Infantry",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.4}><line x1={cx-14*sc} y1={cy-10*sc} x2={cx+14*sc} y2={cy+10*sc}/><line x1={cx+14*sc} y1={cy-10*sc} x2={cx-14*sc} y2={cy+10*sc}/><polygon points={`${cx},${cy-14*sc} ${cx-8*sc},${cy-4*sc} ${cx+8*sc},${cy-4*sc}`} fill="none" strokeWidth={lw}/></g> },
  { id: "infantry_mountain", label: "Infantry (Mountain)", category: "Infantry",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.4}><line x1={cx-14*sc} y1={cy-10*sc} x2={cx+14*sc} y2={cy+10*sc}/><line x1={cx+14*sc} y1={cy-10*sc} x2={cx-14*sc} y2={cy+10*sc}/><polygon points={`${cx},${cy-13*sc} ${cx-10*sc},${cy+4*sc} ${cx+10*sc},${cy+4*sc}`} fill="none" strokeWidth={lw}/></g> },
  { id: "infantry_motorized", label: "Infantry (Motorized)", category: "Infantry",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.4}><line x1={cx-14*sc} y1={cy-10*sc} x2={cx+14*sc} y2={cy+10*sc}/><line x1={cx+14*sc} y1={cy-10*sc} x2={cx-14*sc} y2={cy+10*sc}/><circle cx={cx-6*sc} cy={cy+12*sc} r={3*sc} fill="none"/><circle cx={cx+6*sc} cy={cy+12*sc} r={3*sc} fill="none"/></g> },
  { id: "ranger", label: "Ranger", category: "Infantry",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.5}><line x1={cx-14*sc} y1={cy-10*sc} x2={cx+14*sc} y2={cy+10*sc}/><line x1={cx+14*sc} y1={cy-10*sc} x2={cx-14*sc} y2={cy+10*sc}/><circle cx={cx} cy={cy} r={7*sc} fill="none" strokeWidth={lw}/></g> },
  { id: "special_forces", label: "Special Forces / SOF", category: "Infantry",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.5} fill="none"><line x1={cx-12*sc} y1={cy-12*sc} x2={cx+12*sc} y2={cy+12*sc}/><line x1={cx+12*sc} y1={cy-12*sc} x2={cx-12*sc} y2={cy+12*sc}/><polygon points={`${cx},${cy-7*sc} ${cx+7*sc},${cy} ${cx},${cy+7*sc} ${cx-7*sc},${cy}`}/></g> },
  { id: "sniper", label: "Sniper", category: "Infantry",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.2} fill="none"><circle cx={cx} cy={cy} r={9*sc}/><line x1={cx} y1={cy-14*sc} x2={cx} y2={cy-9*sc}/><line x1={cx} y1={cy+9*sc} x2={cx} y2={cy+14*sc}/><line x1={cx-14*sc} y1={cy} x2={cx-9*sc} y2={cy}/><line x1={cx+9*sc} y1={cy} x2={cx+14*sc} y2={cy}/></g> },
  { id: "machine_gun", label: "Machine Gun", category: "Infantry",
    render: (cx,cy,sc,_lw) => <text x={cx} y={cy+4*sc} textAnchor="middle" fill="#fff" fontSize={10*sc} fontWeight="bold" fontFamily="Arial,sans-serif">MG</text> },
  { id: "sof", label: "SOF", category: "Infantry",
    render: (cx,cy,sc,_lw) => <text x={cx} y={cy+4*sc} textAnchor="middle" fill="#fff" fontSize={10*sc} fontWeight="bold" fontFamily="Arial,sans-serif">SOF</text> },
  { id: "sfa", label: "Security Force Assistance", category: "Infantry",
    render: (cx,cy,sc,_lw) => <text x={cx} y={cy+4*sc} textAnchor="middle" fill="#fff" fontSize={9*sc} fontWeight="bold" fontFamily="Arial,sans-serif">SFA</text> },
  { id: "dismounted_atgm", label: "Dismounted ATGMs", category: "Infantry",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.3} fill="none"><line x1={cx-14*sc} y1={cy-10*sc} x2={cx+14*sc} y2={cy+10*sc}/><line x1={cx+14*sc} y1={cy-10*sc} x2={cx-14*sc} y2={cy+10*sc}/><polygon points={`${cx},${cy+13*sc} ${cx-8*sc},${cy+5*sc} ${cx+8*sc},${cy+5*sc}`}/></g> },
  { id: "weapons", label: "Weapons (General)", category: "Infantry",
    render: (cx,cy,sc,_lw) => <text x={cx} y={cy+4*sc} textAnchor="middle" fill="#fff" fontSize={9*sc} fontWeight="bold" fontFamily="Arial,sans-serif">WPN</text> },
  { id: "combined_arms", label: "Combined Arms (Infantry Heavy)", category: "Infantry",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.3} fill="none"><line x1={cx-14*sc} y1={cy-10*sc} x2={cx+14*sc} y2={cy+10*sc}/><line x1={cx+14*sc} y1={cy-10*sc} x2={cx-14*sc} y2={cy+10*sc}/><ellipse cx={cx} cy={cy} rx={12*sc} ry={8*sc}/></g> },
  // Armor
  { id: "armor", label: "Armor", category: "Armor",
    render: (cx,cy,sc,lw) => <ellipse cx={cx} cy={cy} rx={14*sc} ry={8*sc} fill="none" stroke="#fff" strokeWidth={lw*1.4}/> },
  { id: "armor_heavy", label: "Armor (Heavy)", category: "Armor",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.4} fill="none"><ellipse cx={cx} cy={cy} rx={14*sc} ry={8*sc}/><rect x={cx-4*sc} y={cy-12*sc} width={8*sc} height={6*sc}/></g> },
  { id: "mechanized", label: "Mechanized Infantry", category: "Armor",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.3} fill="none"><circle cx={cx} cy={cy} r={10*sc}/><line x1={cx-14*sc} y1={cy-10*sc} x2={cx+14*sc} y2={cy+10*sc}/><line x1={cx+14*sc} y1={cy-10*sc} x2={cx-14*sc} y2={cy+10*sc}/></g> },
  { id: "cavalry", label: "Cavalry / Recon", category: "Armor",
    render: (cx,cy,sc,lw) => <line x1={cx-14*sc} y1={cy+12*sc} x2={cx+14*sc} y2={cy-12*sc} stroke="#fff" strokeWidth={lw*2}/> },
  // Artillery
  { id: "artillery", label: "Artillery", category: "Artillery",
    render: (cx,cy,sc,lw) => <circle cx={cx} cy={cy} r={10*sc} fill="none" stroke="#fff" strokeWidth={lw*1.5}/> },
  { id: "rocket_artillery", label: "Rocket Artillery (MLRS)", category: "Artillery",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.3} fill="none"><circle cx={cx} cy={cy+4*sc} r={8*sc}/><line x1={cx} y1={cy-4*sc} x2={cx} y2={cy-14*sc}/><line x1={cx-4*sc} y1={cy-10*sc} x2={cx} y2={cy-14*sc}/><line x1={cx+4*sc} y1={cy-10*sc} x2={cx} y2={cy-14*sc}/></g> },
  { id: "mortar", label: "Mortar", category: "Artillery",
    render: (cx,cy,sc,lw) => <g><circle cx={cx} cy={cy} r={10*sc} fill="none" stroke="#fff" strokeWidth={lw*1.3}/><circle cx={cx} cy={cy} r={3*sc} fill="#fff"/></g> },
  { id: "antitank", label: "Anti-Tank", category: "Artillery",
    render: (cx,cy,sc,lw) => <polygon points={`${cx},${cy+12*sc} ${cx-12*sc},${cy-8*sc} ${cx+12*sc},${cy-8*sc}`} fill="none" stroke="#fff" strokeWidth={lw*1.3}/> },
  { id: "air_defense", label: "Air Defense", category: "Artillery",
    render: (cx,cy,sc,lw) => <polygon points={`${cx},${cy-12*sc} ${cx-12*sc},${cy+8*sc} ${cx+12*sc},${cy+8*sc}`} fill="none" stroke="#fff" strokeWidth={lw*1.3}/> },
  // Aviation
  { id: "aviation", label: "Aviation (General)", category: "Aviation",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.3} fill="none"><line x1={cx-14*sc} y1={cy} x2={cx+14*sc} y2={cy}/><line x1={cx} y1={cy-8*sc} x2={cx} y2={cy+8*sc}/><circle cx={cx} cy={cy} r={4*sc} fill="#fff"/></g> },
  { id: "aviation_attack", label: "Aviation (Attack Helicopter)", category: "Aviation",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.3} fill="none"><line x1={cx-14*sc} y1={cy} x2={cx+14*sc} y2={cy}/><line x1={cx} y1={cy-8*sc} x2={cx} y2={cy+8*sc}/><circle cx={cx} cy={cy} r={4*sc} fill="#fff"/><polygon points={`${cx},${cy+12*sc} ${cx-6*sc},${cy+6*sc} ${cx+6*sc},${cy+6*sc}`} fill="#fff"/></g> },
  { id: "aviation_utility", label: "Aviation (Utility Helicopter)", category: "Aviation",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.3} fill="none"><line x1={cx-14*sc} y1={cy} x2={cx+14*sc} y2={cy}/><line x1={cx} y1={cy-8*sc} x2={cx} y2={cy+8*sc}/><circle cx={cx} cy={cy} r={4*sc} fill="#fff"/><circle cx={cx} cy={cy+10*sc} r={3*sc}/></g> },
  { id: "aviation_fixed_wing", label: "Aviation (Fixed Wing)", category: "Aviation",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.3} fill="none"><ellipse cx={cx} cy={cy} rx={6*sc} ry={10*sc}/><line x1={cx-14*sc} y1={cy+2*sc} x2={cx+14*sc} y2={cy+2*sc}/></g> },
  { id: "aviation_uav", label: "UAV / Drone", category: "Aviation",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.2} fill="none"><rect x={cx-10*sc} y={cy-6*sc} width={20*sc} height={12*sc} rx={2*sc}/><line x1={cx-14*sc} y1={cy} x2={cx-10*sc} y2={cy}/><line x1={cx+10*sc} y1={cy} x2={cx+14*sc} y2={cy}/></g> },
  { id: "atc", label: "Air Traffic Control", category: "Aviation",
    render: (cx,cy,sc,_lw) => <text x={cx} y={cy+4*sc} textAnchor="middle" fill="#fff" fontSize={9*sc} fontWeight="bold" fontFamily="Arial,sans-serif">ATC</text> },
  { id: "forward_air_controller", label: "Forward Air Controller (FAC)", category: "Aviation",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.2} fill="none"><polygon points={`${cx},${cy-12*sc} ${cx-10*sc},${cy+6*sc} ${cx+10*sc},${cy+6*sc}`}/><line x1={cx} y1={cy+6*sc} x2={cx} y2={cy+12*sc}/></g> },
  { id: "satellite", label: "Satellite", category: "Aviation",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.2} fill="none"><circle cx={cx} cy={cy} r={5*sc}/><line x1={cx-14*sc} y1={cy-8*sc} x2={cx-5*sc} y2={cy}/><line x1={cx+5*sc} y1={cy} x2={cx+14*sc} y2={cy+8*sc}/></g> },
  // Combat Support
  { id: "engineer", label: "Engineer (General)", category: "Combat Support",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw} fill="none"><rect x={cx-10*sc} y={cy-8*sc} width={20*sc} height={16*sc}/><line x1={cx-10*sc} y1={cy} x2={cx+10*sc} y2={cy}/></g> },
  { id: "engineer_armored", label: "Armored Engineers", category: "Combat Support",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw} fill="none"><rect x={cx-10*sc} y={cy-8*sc} width={20*sc} height={16*sc}/><line x1={cx-10*sc} y1={cy} x2={cx+10*sc} y2={cy}/><ellipse cx={cx} cy={cy+10*sc} rx={8*sc} ry={4*sc}/></g> },
  { id: "bridging", label: "Bridging / Pontoon", category: "Combat Support",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw} fill="none"><line x1={cx-14*sc} y1={cy+4*sc} x2={cx+14*sc} y2={cy+4*sc}/><line x1={cx-10*sc} y1={cy+4*sc} x2={cx-10*sc} y2={cy-4*sc}/><line x1={cx-3*sc} y1={cy+4*sc} x2={cx-3*sc} y2={cy-4*sc}/><line x1={cx+3*sc} y1={cy+4*sc} x2={cx+3*sc} y2={cy-4*sc}/><line x1={cx+10*sc} y1={cy+4*sc} x2={cx+10*sc} y2={cy-4*sc}/></g> },
  { id: "construction", label: "Construction / Airfield", category: "Combat Support",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.2} fill="none"><rect x={cx-10*sc} y={cy-8*sc} width={20*sc} height={16*sc}/><line x1={cx-10*sc} y1={cy-8*sc} x2={cx+10*sc} y2={cy+8*sc}/></g> },
  { id: "signal", label: "Signal / Comms", category: "Combat Support",
    render: (cx,cy,sc,lw) => <polyline points={`${cx-12*sc},${cy+6*sc} ${cx-4*sc},${cy-6*sc} ${cx+4*sc},${cy+6*sc} ${cx+12*sc},${cy-6*sc}`} fill="none" stroke="#fff" strokeWidth={lw*1.3}/> },
  { id: "electronic_warfare", label: "Electronic Warfare", category: "Combat Support",
    render: (cx,cy,sc,_lw) => <text x={cx} y={cy+4*sc} textAnchor="middle" fill="#fff" fontSize={9*sc} fontWeight="bold" fontFamily="Arial,sans-serif">EW</text> },
  { id: "cyber", label: "Cyber", category: "Combat Support",
    render: (cx,cy,sc,_lw) => <text x={cx} y={cy+4*sc} textAnchor="middle" fill="#fff" fontSize={9*sc} fontWeight="bold" fontFamily="Arial,sans-serif">CY</text> },
  { id: "psyops", label: "PSYOP", category: "Combat Support",
    render: (cx,cy,sc,_lw) => <text x={cx} y={cy+4*sc} textAnchor="middle" fill="#fff" fontSize={9*sc} fontWeight="bold" fontFamily="Arial,sans-serif">PSY</text> },
  { id: "civil_affairs", label: "Civil Affairs", category: "Combat Support",
    render: (cx,cy,sc,_lw) => <text x={cx} y={cy+4*sc} textAnchor="middle" fill="#fff" fontSize={9*sc} fontWeight="bold" fontFamily="Arial,sans-serif">CA</text> },
  { id: "forward_observer", label: "Forward Observer / JTAC", category: "Combat Support",
    render: (cx,cy,sc,_lw) => <text x={cx} y={cy+4*sc} textAnchor="middle" fill="#fff" fontSize={9*sc} fontWeight="bold" fontFamily="Arial,sans-serif">FO</text> },
  { id: "military_police", label: "Military Police", category: "Combat Support",
    render: (cx,cy,sc,_lw) => <text x={cx} y={cy+5*sc} textAnchor="middle" fill="#fff" fontSize={13*sc} fontWeight="bold" fontFamily="Arial,sans-serif">MP</text> },
  { id: "nuclear_bio_chem", label: "NBC / CBRN", category: "Combat Support",
    render: (cx,cy,sc,_lw) => <text x={cx} y={cy+4*sc} textAnchor="middle" fill="#fff" fontSize={9*sc} fontWeight="bold" fontFamily="Arial,sans-serif">NBC</text> },
  { id: "naval_gunfire", label: "Naval Gunfire Support", category: "Combat Support",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.3} fill="none"><circle cx={cx} cy={cy} r={10*sc}/><path d={`M${cx-8*sc},${cy+6*sc} L${cx},${cy-4*sc} L${cx+8*sc},${cy+6*sc}`}/></g> },
  // Service Support
  { id: "logistics", label: "Logistics", category: "Service Support",
    render: (cx,cy,sc,lw) => <rect x={cx-10*sc} y={cy-10*sc} width={20*sc} height={20*sc} fill="none" stroke="#fff" strokeWidth={lw*1.3}/> },
  { id: "supply", label: "Supply", category: "Service Support",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.2} fill="none"><rect x={cx-10*sc} y={cy-8*sc} width={20*sc} height={16*sc}/><line x1={cx-10*sc} y1={cy-3*sc} x2={cx+10*sc} y2={cy-3*sc}/></g> },
  { id: "maintenance", label: "Maintenance / Recovery", category: "Service Support",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.3} fill="none"><rect x={cx-10*sc} y={cy-10*sc} width={20*sc} height={20*sc}/><circle cx={cx} cy={cy} r={6*sc}/></g> },
  { id: "transportation", label: "Transportation", category: "Service Support",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.2} fill="none"><rect x={cx-12*sc} y={cy-6*sc} width={24*sc} height={10*sc}/><circle cx={cx-7*sc} cy={cy+7*sc} r={3*sc}/><circle cx={cx+7*sc} cy={cy+7*sc} r={3*sc}/></g> },
  { id: "ordnance", label: "Ordnance / Ammunition", category: "Service Support",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.2} fill="none"><ellipse cx={cx} cy={cy} rx={10*sc} ry={6*sc}/><line x1={cx} y1={cy-6*sc} x2={cx} y2={cy-12*sc}/><line x1={cx-4*sc} y1={cy-10*sc} x2={cx+4*sc} y2={cy-10*sc}/></g> },
  { id: "fuel", label: "Petroleum / Fuel", category: "Service Support",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.2} fill="none"><rect x={cx-8*sc} y={cy-8*sc} width={16*sc} height={16*sc} rx={3*sc}/><line x1={cx} y1={cy-8*sc} x2={cx} y2={cy-12*sc}/><line x1={cx-5*sc} y1={cy} x2={cx+5*sc} y2={cy}/></g> },
  // Medical
  { id: "medical", label: "Medical", category: "Medical",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*2} fill="none"><line x1={cx} y1={cy-12*sc} x2={cx} y2={cy+12*sc}/><line x1={cx-12*sc} y1={cy} x2={cx+12*sc} y2={cy}/></g> },
  { id: "medical_armor", label: "Armored Ambulance", category: "Medical",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw*1.5} fill="none"><line x1={cx} y1={cy-10*sc} x2={cx} y2={cy+10*sc}/><line x1={cx-10*sc} y1={cy} x2={cx+10*sc} y2={cy}/><ellipse cx={cx} cy={cy+10*sc} rx={8*sc} ry={4*sc}/></g> },
  { id: "hospital", label: "Hospital / Aid Station", category: "Medical",
    render: (cx,cy,sc,lw) => <g stroke="#fff" strokeWidth={lw} fill="none"><rect x={cx-12*sc} y={cy-10*sc} width={24*sc} height={20*sc}/><line x1={cx} y1={cy-7*sc} x2={cx} y2={cy+7*sc} strokeWidth={lw*2}/><line x1={cx-7*sc} y1={cy} x2={cx+7*sc} y2={cy} strokeWidth={lw*2}/></g> },
  // HQ
  { id: "hq", label: "Headquarters (HQ)", category: "Headquarters",
    render: (cx,cy,sc,_lw) => <text x={cx} y={cy+5*sc} textAnchor="middle" fill="#fff" fontSize={14*sc} fontWeight="bold" fontFamily="Arial,sans-serif">HQ</text> },
  { id: "cp", label: "Command Post (CP)", category: "Headquarters",
    render: (cx,cy,sc,_lw) => <text x={cx} y={cy+5*sc} textAnchor="middle" fill="#fff" fontSize={12*sc} fontWeight="bold" fontFamily="Arial,sans-serif">CP</text> },
  { id: "maneuver_support", label: "Maneuver Support", category: "Headquarters",
    render: (cx,cy,sc,_lw) => <text x={cx} y={cy+4*sc} textAnchor="middle" fill="#fff" fontSize={9*sc} fontWeight="bold" fontFamily="Arial,sans-serif">SPT</text> },
  { id: "custom", label: "Custom", category: "Custom",
    render: (cx,cy,sc,_lw) => <text x={cx} y={cy+4*sc} textAnchor="middle" fill="#fff" fontSize={10*sc} fontWeight="bold" fontFamily="Arial,sans-serif">?</text> },
];

const SYMBOL_CATEGORIES = Array.from(new Set(SYMBOL_LIBRARY.map(s => s.category)));
const SYMBOL_BY_ID: Record<string, UnitSymbolDef> = Object.fromEntries(SYMBOL_LIBRARY.map(s => [s.id, s]));

const FLAGS = [
  { code: "gb", label: "United Kingdom" }, { code: "us", label: "United States" },
  { code: "ca", label: "Canada" }, { code: "au", label: "Australia" },
  { code: "nz", label: "New Zealand" }, { code: "de", label: "Germany" },
  { code: "fr", label: "France" }, { code: "it", label: "Italy" },
  { code: "nl", label: "Netherlands" }, { code: "be", label: "Belgium" },
  { code: "no", label: "Norway" }, { code: "se", label: "Sweden" },
  { code: "fi", label: "Finland" }, { code: "dk", label: "Denmark" },
  { code: "pl", label: "Poland" }, { code: "ua", label: "Ukraine" },
  { code: "tr", label: "Turkey" }, { code: "il", label: "Israel" },
  { code: "za", label: "South Africa" }, { code: "jp", label: "Japan" },
  { code: "kr", label: "South Korea" }, { code: "br", label: "Brazil" },
  { code: "es", label: "Spain" },
];
function flagUrl(code: string) { return `https://flagcdn.com/w80/${code}.png`; }

const ECHELON_MARKS: Record<Echelon, string> = {
  "": "", fireteam: "·", squad: "··", section: "···", platoon: "|",
  staffel: "||||", company: "||", battalion: "|||", regiment: "X",
  brigade: "XX", division: "XXX", corps: "XXXX", army: "XXXXX",
  theater: "+++", command: "++",
};
const ECHELON_OPTIONS: { id: Echelon; label: string }[] = [
  { id: "", label: "None" }, { id: "fireteam", label: "Fireteam / Crew" },
  { id: "squad", label: "Squad" }, { id: "section", label: "Section" },
  { id: "platoon", label: "Platoon" }, { id: "staffel", label: "Staffel" },
  { id: "company", label: "Company / Battery / Troop" }, { id: "battalion", label: "Battalion / Squadron" },
  { id: "regiment", label: "Regiment / Group" }, { id: "brigade", label: "Brigade" },
  { id: "division", label: "Division" }, { id: "corps", label: "Corps" },
  { id: "army", label: "Army" }, { id: "theater", label: "Theater" }, { id: "command", label: "Command" },
];
const MODIFIER_OPTIONS: { id: TaskForceModifier; label: string }[] = [
  { id: "none", label: "None" }, { id: "hq", label: "Headquarters (HQ)" },
  { id: "taskforce", label: "Task Force (TF)" }, { id: "hq_taskforce", label: "HQ + Task Force" },
  { id: "dummy", label: "Dummy / Feint" }, { id: "reinforced", label: "Reinforced (+)" },
  { id: "reduced", label: "Reduced (-)" }, { id: "reinforced_reduced", label: "Reinforced & Reduced (±)" },
];
const AFFILIATION_OPTIONS: { id: Affiliation; label: string }[] = [
  { id: "friendly", label: "Friendly" }, { id: "hostile", label: "Hostile / Enemy" },
  { id: "neutral", label: "Neutral" }, { id: "unknown", label: "Unknown" },
];


// ─── Symbol SVG ───────────────────────────────────────────────────────────────

function UnitSymbolSVG({ type, affiliation, size = 48, fillColor, flagCode }: {
  type: string; affiliation: Affiliation; size?: number; fillColor?: string; flagCode?: string;
}) {
  const colors = AFFILIATION_COLORS[affiliation];
  const bg = fillColor || colors.bg;
  const s = size, w = s * 1.4, h = s;
  const cx = w / 2, cy = h / 2;
  const lw = Math.max(1.5, s / 24);
  const sc = s / 48;
  const sym = SYMBOL_BY_ID[type];
  const uid = `clip-${type}-${Math.round(size)}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", display: "block" }}>
      <defs><clipPath id={uid}><rect x={2} y={2} width={w-4} height={h-4} rx={2}/></clipPath></defs>
      <rect x={2} y={2} width={w-4} height={h-4} rx={2} fill={bg} stroke={colors.border} strokeWidth={2}/>
      {flagCode && <image href={flagUrl(flagCode)} x={2} y={2} width={w-4} height={h-4} clipPath={`url(#${uid})`} preserveAspectRatio="xMidYMid slice" opacity={0.45}/>}
      {sym ? sym.render(cx, cy, sc, lw) : <g stroke="#fff" strokeWidth={lw*1.5}><line x1={cx-12*sc} y1={cy-10*sc} x2={cx+12*sc} y2={cy+10*sc}/><line x1={cx+12*sc} y1={cy-10*sc} x2={cx-12*sc} y2={cy+10*sc}/></g>}
    </svg>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const NODE_W = 120, NODE_H = 95, H_GAP = 30, V_GAP = 75, TREE_SEP = 50;
interface LayoutNode { node: OrbatNode; x: number; y: number; depth: number; }

function leafCount(n: OrbatNode): number {
  if (n.collapsed || n.children.length === 0) return 1;
  return n.children.reduce((s, c) => s + leafCount(c), 0);
}
function layoutAll(node: OrbatNode, startX: number, depth: number): LayoutNode[] {
  const results: LayoutNode[] = [];
  const totalW = leafCount(node) * (NODE_W + H_GAP);
  results.push({ node, x: startX + totalW / 2, y: depth * (NODE_H + V_GAP), depth });
  if (!node.collapsed && node.children.length > 0) {
    let childX = startX;
    for (const child of node.children) {
      results.push(...layoutAll(child, childX, depth + 1));
      childX += leafCount(child) * (NODE_W + H_GAP);
    }
  }
  return results;
}
function buildEdges(nodes: LayoutNode[]) {
  const byId = new Map<string, LayoutNode>();
  for (const n of nodes) byId.set(n.node.id, n);
  const edges: { x1:number; y1:number; x2:number; y2:number }[] = [];
  for (const ln of nodes) {
    if (ln.node.collapsed) continue;
    for (const child of ln.node.children) {
      const c = byId.get(child.id); if (!c) continue;
      const py = ln.y + NODE_H + 16, midY = ln.y + NODE_H + V_GAP / 2;
      edges.push({ x1:ln.x, y1:py, x2:ln.x, y2:midY });
      edges.push({ x1:ln.x, y1:midY, x2:c.x, y2:midY });
      edges.push({ x1:c.x, y1:midY, x2:c.x, y2:c.y - 2 });
    }
  }
  return edges;
}

// ─── Unit Card ────────────────────────────────────────────────────────────────

function UnitCard({ ln, onEdit, onAddChild, onDelete, onDuplicate, onToggle, readOnly }: {
  ln: LayoutNode; onEdit:(n:OrbatNode)=>void; onAddChild:(id:string)=>void;
  onDelete:(id:string)=>void; onDuplicate:(n:OrbatNode)=>void;
  onToggle:(id:string)=>void; readOnly:boolean;
}) {
  const { node, x, y } = ln;
  const [showActions, setShowActions] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const echelonMark = ECHELON_MARKS[node.echelon] || "";
  const hasChildren = node.children && node.children.length > 0;
  const modText = () => {
    switch(node.modifier) {
      case "hq": return "HQ"; case "taskforce": return "TF"; case "hq_taskforce": return "HQ/TF";
      case "dummy": return "(D)"; case "reinforced": return "(+)"; case "reduced": return "(-)";
      case "reinforced_reduced": return "(±)"; default: return null;
    }
  };
  const mod = modText();
  const enter = () => { if (leaveTimer.current) clearTimeout(leaveTimer.current); setShowActions(true); };
  const leave = () => { leaveTimer.current = setTimeout(() => setShowActions(false), 700); };

  return (
    <div style={{ position:"absolute", left:x-NODE_W/2, top:y, width:NODE_W }} onMouseEnter={enter} onMouseLeave={leave}>
      <div style={{ textAlign:"center", height:16, lineHeight:"16px", marginBottom:2 }}>
        <span style={{ fontSize:11, fontWeight:700, color:"#a3c9a8", letterSpacing:1, fontFamily:"serif" }}>{echelonMark}</span>
      </div>
      {showActions && !readOnly && (
        <div onMouseEnter={enter} onMouseLeave={leave} style={{
          position:"absolute", top:-30, left:"50%", transform:"translateX(-50%)",
          display:"flex", gap:2, background:"#0d1f0d", border:`1px solid ${THEME.accentBorder}`,
          borderRadius:6, padding:"3px 5px", zIndex:30, whiteSpace:"nowrap",
          boxShadow:"0 2px 12px rgba(0,0,0,0.7)",
        }}>
          {[
            { icon:<Plus size={11}/>, action:()=>onAddChild(node.id), title:"Add child" },
            { icon:<Edit3 size={11}/>, action:()=>onEdit(node), title:"Edit" },
            { icon:<Copy size={11}/>, action:()=>onDuplicate(node), title:"Duplicate" },
            { icon:<Trash2 size={11}/>, action:()=>onDelete(node.id), title:"Delete" },
          ].map((btn,i) => (
            <button key={i} onClick={e=>{e.stopPropagation();btn.action();}} title={btn.title}
              style={{ background:"transparent",border:"none",cursor:"pointer",color:THEME.textMuted,padding:"2px 4px",borderRadius:3,display:"flex",alignItems:"center" }}
              onMouseEnter={e=>(e.currentTarget.style.color=THEME.accent)}
              onMouseLeave={e=>(e.currentTarget.style.color=THEME.textMuted)}
            >{btn.icon}</button>
          ))}
        </div>
      )}
      <div onClick={()=>!readOnly&&onEdit(node)} style={{ display:"flex",flexDirection:"column",alignItems:"center",cursor:readOnly?"default":"pointer",position:"relative",filter:showActions?`drop-shadow(0 0 8px ${THEME.accentDim})`:undefined }}>
        {mod && <div style={{ position:"absolute",top:0,right:-2,zIndex:10,background:THEME.bgCard,border:`1px solid ${AFFILIATION_COLORS[node.affiliation].border}`,color:AFFILIATION_COLORS[node.affiliation].bg,fontSize:8,fontWeight:700,padding:"1px 3px",borderRadius:3,fontFamily:"monospace" }}>{mod}</div>}
        <div style={{ position:"relative" }}>
          <UnitSymbolSVG type={node.unitType} affiliation={node.affiliation} size={42} fillColor={node.fillColor} flagCode={node.flagCode}/>
          {node.designation && <div style={{ position:"absolute",top:2,left:4,fontSize:8,fontWeight:700,color:"rgba(255,255,255,0.9)",fontFamily:"monospace",pointerEvents:"none" }}>{node.designation}</div>}
          {(node.rosterSlots && node.rosterSlots.length > 0) && <div style={{ position:"absolute",bottom:2,right:2,background:"rgba(34,197,94,0.85)",borderRadius:"50%",width:12,height:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700,color:"#000" }}>{node.rosterSlots.length}</div>}
        </div>
        <div style={{ marginTop:4, textAlign:"center", width:NODE_W }}>
          <div style={{ fontSize:10,fontWeight:700,color:THEME.text,lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }} title={node.label}>{node.label}</div>
          {node.nickname && <div style={{ fontSize:9,color:THEME.textMuted,fontStyle:"italic",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>"{node.nickname}"</div>}
          {(node.officers||node.enlisted) && <div style={{ fontSize:8,color:THEME.textDim,marginTop:1 }}>{node.officers?`${node.officers}O`:""}{node.officers&&node.enlisted?"/":""}{node.enlisted?`${node.enlisted}E`:""}</div>}
        </div>
      </div>
      {hasChildren && (
        <button onClick={e=>{e.stopPropagation();onToggle(node.id);}} style={{ position:"absolute",bottom:-14,left:"50%",transform:"translateX(-50%)",background:THEME.bgCard,border:`1px solid ${THEME.borderLight}`,borderRadius:"50%",width:14,height:14,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:THEME.textMuted,padding:0 }}>
          {node.collapsed?<ChevronDown size={8}/>:<ChevronUp size={8}/>}
        </button>
      )}
    </div>
  );
}


// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = { background:THEME.bgInput, border:`1px solid ${THEME.border}`, borderRadius:5, color:THEME.text, padding:"6px 10px", fontSize:12, width:"100%", boxSizing:"border-box" as const, outline:"none" };
const btnPrimaryStyle: React.CSSProperties = { background:THEME.accent, border:"none", borderRadius:5, color:"#000", padding:"7px 14px", fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:5 };
const btnSecondaryStyle: React.CSSProperties = { background:THEME.bgInput, border:`1px solid ${THEME.borderLight}`, borderRadius:5, color:THEME.textMuted, padding:"7px 14px", fontSize:11, cursor:"pointer" };
const btnSmallStyle: React.CSSProperties = { background:THEME.bgInput, border:`1px solid ${THEME.borderLight}`, borderRadius:4, color:THEME.textMuted, padding:"3px 8px", fontSize:10, cursor:"pointer" };
const iconBtnStyle: React.CSSProperties = { background:THEME.bgInput, border:`1px solid ${THEME.border}`, borderRadius:4, color:THEME.textMuted, padding:"4px 6px", cursor:"pointer", display:"flex", alignItems:"center" };
const thStyle: React.CSSProperties = { background:THEME.bgInput, border:`1px solid ${THEME.border}`, padding:"4px 8px", textAlign:"center" as const, fontWeight:700, fontSize:9, color:THEME.textMuted, textTransform:"uppercase" as const };
const tdStyle: React.CSSProperties = { border:`1px solid ${THEME.border}`, padding:"3px 6px", textAlign:"center" as const, fontSize:10 };

function Field({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      <label style={{ fontSize:10, fontWeight:600, color:THEME.textMuted, textTransform:"uppercase", letterSpacing:0.5 }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Chart Builder ────────────────────────────────────────────────────────────

const CHART_TEMPLATES: Record<string, { cols: ChartColumn[]; rows: WeaponEntry[] }> = {
  "Infantry Section": {
    cols: [{ id:"cmd", label:"Cmd" }, { id:"s1", label:"1 Sect" }, { id:"s2", label:"2 Sect" }, { id:"wpn", label:"Wpn Sect" }],
    rows: [{ name:"SA80 / M4", cmd:"4", s1:"8", s2:"8", wpn:"4" }, { name:"LMG / SAW", cmd:"1", s1:"2", s2:"2", wpn:"2" }, { name:"GPMG / M240", cmd:"", s1:"", s2:"", wpn:"2" }, { name:"UGL / M203", cmd:"", s1:"2", s2:"2", wpn:"" }],
  },
  "Armour Troop": {
    cols: [{ id:"hq", label:"HQ" }, { id:"t1", label:"1 Tp" }, { id:"t2", label:"2 Tp" }, { id:"t3", label:"3 Tp" }],
    rows: [{ name:"MBT (Challenger / M1)", hq:"1", t1:"3", t2:"3", t3:"3" }, { name:"ARV / REME", hq:"1", t1:"", t2:"", t3:"" }],
  },
  "Mechanised Platoon": {
    cols: [{ id:"pl", label:"Pl HQ" }, { id:"s1", label:"1 Sect" }, { id:"s2", label:"2 Sect" }, { id:"s3", label:"3 Sect" }],
    rows: [{ name:"IFV (Warrior / Bradley)", pl:"1", s1:"1", s2:"1", s3:"1" }, { name:"Riflemen", pl:"3", s1:"6", s2:"6", s3:"6" }, { name:"LMG", pl:"", s1:"1", s2:"1", s3:"1" }, { name:"ATGM", pl:"", s1:"1", s2:"1", s3:"1" }],
  },
  "Artillery Battery": {
    cols: [{ id:"hq", label:"Bty HQ" }, { id:"g1", label:"Gun 1" }, { id:"g2", label:"Gun 2" }, { id:"g3", label:"Gun 3" }],
    rows: [{ name:"Howitzer / Gun", hq:"", g1:"2", g2:"2", g3:"2" }, { name:"FDC Vehicle", hq:"1", g1:"", g2:"", g3:"" }, { name:"Ammo Vehicle", hq:"1", g1:"1", g2:"1", g3:"1" }],
  },
};

function ChartBuilder({ title, rows, cols, onChangeRows, onChangeCols }: {
  title:string; rows:WeaponEntry[]; cols:ChartColumn[];
  onChangeRows:(r:WeaponEntry[])=>void; onChangeCols:(c:ChartColumn[])=>void;
}) {
  const addCol = () => { const id=generateId(); onChangeCols([...cols,{id,label:"Unit"}]); };
  const removeCol = (id:string) => onChangeCols(cols.filter(c=>c.id!==id));
  const updateColLabel = (id:string,label:string) => onChangeCols(cols.map(c=>c.id===id?{...c,label}:c));
  const addRow = () => { const row: WeaponEntry = { name:"New Item" }; cols.forEach(c=>{row[c.id]="";}); onChangeRows([...rows,row]); };
  const removeRow = (i:number) => onChangeRows(rows.filter((_,idx)=>idx!==i));
  const updateCell = (ri:number,key:string,val:string) => onChangeRows(rows.map((r,i)=>i===ri?{...r,[key]:val}:r));

  return (
    <div style={{ marginTop:12 }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
        <span style={{ fontSize:11,fontWeight:700,color:THEME.accent,textTransform:"uppercase",letterSpacing:1 }}>{title}</span>
        <div style={{ display:"flex",gap:6,alignItems:"center" }}>
          <select onChange={e=>{if(!e.target.value)return;const tpl=CHART_TEMPLATES[e.target.value];if(tpl){onChangeCols(tpl.cols);onChangeRows(tpl.rows);}e.target.value="";}} style={{ ...inputStyle,fontSize:10,padding:"2px 6px",width:"auto" }}>
            <option value="">Load template…</option>
            {Object.keys(CHART_TEMPLATES).map(k=><option key={k} value={k}>{k}</option>)}
          </select>
          <button onClick={addCol} style={btnSmallStyle}>+ Col</button>
          <button onClick={addRow} style={btnSmallStyle}>+ Row</button>
        </div>
      </div>
      {cols.length === 0 ? (
        <div style={{ color:THEME.textMuted,fontSize:11,padding:"12px 0",textAlign:"center",border:`1px dashed ${THEME.borderLight}`,borderRadius:4 }}>No columns — add one or load a template</div>
      ) : (
        <div style={{ overflowX:"auto" }}>
          <table style={{ borderCollapse:"collapse",fontSize:10,color:THEME.text,width:"100%" }}>
            <thead><tr>
              <th style={{ ...thStyle,textAlign:"left" as const,minWidth:130 }}>Equipment</th>
              {cols.map(c=>(
                <th key={c.id} style={{ ...thStyle,minWidth:70 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:3 }}>
                    <input value={c.label} onChange={e=>updateColLabel(c.id,e.target.value)} style={{ background:"transparent",border:"none",color:THEME.text,fontSize:10,fontWeight:700,width:55,textAlign:"center" }}/>
                    <button onClick={()=>removeCol(c.id)} style={{ background:"none",border:"none",cursor:"pointer",color:THEME.danger,padding:0,lineHeight:1 }}>×</button>
                  </div>
                </th>
              ))}
              <th style={thStyle}></th>
            </tr></thead>
            <tbody>{rows.map((row,i)=>(
              <tr key={i} style={{ background:i%2===0?"rgba(255,255,255,0.02)":undefined }}>
                <td style={{ ...tdStyle,textAlign:"left" as const }}>
                  <input value={row.name} onChange={e=>updateCell(i,"name",e.target.value)} style={{ background:"transparent",border:"none",color:THEME.text,fontSize:10,width:"100%" }}/>
                </td>
                {cols.map(c=>(
                  <td key={c.id} style={tdStyle}>
                    <input value={String(row[c.id]??"")} onChange={e=>updateCell(i,c.id,e.target.value)} style={{ background:"transparent",border:"none",color:THEME.text,fontSize:10,width:50,textAlign:"center" }}/>
                  </td>
                ))}
                <td style={tdStyle}><button onClick={()=>removeRow(i)} style={{ background:"none",border:"none",cursor:"pointer",color:THEME.danger,fontSize:12 }}>×</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Node Editor ──────────────────────────────────────────────────────────────

function NodeEditor({ node, roster, onSave, onClose }: {
  node:OrbatNode; roster:any[]; onSave:(n:OrbatNode)=>void; onClose:()=>void;
}) {
  const [draft, setDraft] = useState<OrbatNode>({ ...node, rosterSlots:node.rosterSlots||[] });
  const [tab, setTab] = useState<"unit"|"symbol"|"slots"|"charts">("unit");
  const [symCat, setSymCat] = useState(SYMBOL_BY_ID[node.unitType]?.category || "Infantry");
  function set<K extends keyof OrbatNode>(k:K, v:OrbatNode[K]) { setDraft(d=>({...d,[k]:v})); }
  const toggleSlot = (uid:string) => {
    const slots = draft.rosterSlots||[];
    set("rosterSlots", slots.includes(uid)?slots.filter(s=>s!==uid):[...slots,uid]);
  };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:THEME.bgCard,border:`1px solid ${THEME.border}`,borderRadius:10,width:580,maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.8)" }} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${THEME.border}`,background:THEME.bgPanel }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <UnitSymbolSVG type={draft.unitType} affiliation={draft.affiliation} size={30} fillColor={draft.fillColor} flagCode={draft.flagCode}/>
            <span style={{ fontSize:13,fontWeight:700,color:THEME.text,textTransform:"uppercase",letterSpacing:1 }}>{draft.label||"Edit Unit"}</span>
          </div>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:THEME.textMuted }}><X size={16}/></button>
        </div>
        {/* Tabs */}
        <div style={{ display:"flex",borderBottom:`1px solid ${THEME.border}` }}>
          {([
            { id:"unit",label:"Unit",icon:<Edit3 size={11}/> },
            { id:"symbol",label:"Symbol",icon:<Flag size={11}/> },
            { id:"slots",label:`Slots${draft.rosterSlots?.length?` (${draft.rosterSlots.length})`:""}`,icon:<Users size={11}/> },
            { id:"charts",label:"Charts",icon:<Table2 size={11}/> },
          ] as const).map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1,padding:"8px 0",background:tab===t.id?THEME.bgInput:"transparent",border:"none",borderBottom:tab===t.id?`2px solid ${THEME.accent}`:"2px solid transparent",color:tab===t.id?THEME.text:THEME.textMuted,cursor:"pointer",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:5 }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        {/* Body */}
        <div style={{ flex:1,overflowY:"auto",padding:16 }}>
          {tab==="unit" && (
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              <Field label="Unit Label"><input value={draft.label} onChange={e=>set("label",e.target.value)} style={inputStyle}/></Field>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                <Field label="Nickname / Callsign"><input value={draft.nickname||""} onChange={e=>set("nickname",e.target.value)} style={inputStyle} placeholder='e.g. "Attack"'/></Field>
                <Field label="Designation"><input value={draft.designation||""} onChange={e=>set("designation",e.target.value)} style={inputStyle} placeholder="A, 1, 28"/></Field>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                <Field label="Affiliation"><select value={draft.affiliation} onChange={e=>set("affiliation",e.target.value as Affiliation)} style={inputStyle}>{AFFILIATION_OPTIONS.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></Field>
                <Field label="Echelon"><select value={draft.echelon} onChange={e=>set("echelon",e.target.value as Echelon)} style={inputStyle}>{ECHELON_OPTIONS.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></Field>
              </div>
              <Field label="Modifier"><select value={draft.modifier} onChange={e=>set("modifier",e.target.value as TaskForceModifier)} style={inputStyle}>{MODIFIER_OPTIONS.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></Field>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                <Field label="Officers"><input type="number" value={draft.officers??""} onChange={e=>set("officers",e.target.value?+e.target.value:undefined)} style={inputStyle} min={0}/></Field>
                <Field label="Enlisted / OR"><input type="number" value={draft.enlisted??""} onChange={e=>set("enlisted",e.target.value?+e.target.value:undefined)} style={inputStyle} min={0}/></Field>
              </div>
              <Field label="Unit Notes"><textarea value={draft.description||""} onChange={e=>set("description",e.target.value)} rows={4} style={{ ...inputStyle,resize:"vertical" as const }} placeholder="Role, equipment, tactics..."/></Field>
            </div>
          )}
          {tab==="symbol" && (
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <Field label="Category">
                <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                  {SYMBOL_CATEGORIES.map(cat=>(
                    <button key={cat} onClick={()=>setSymCat(cat)} style={{ padding:"4px 10px",borderRadius:4,fontSize:11,fontWeight:600,cursor:"pointer",background:symCat===cat?THEME.accentDim:THEME.bgInput,border:`1px solid ${symCat===cat?THEME.accent:THEME.borderLight}`,color:symCat===cat?THEME.accent:THEME.textMuted }}>{cat}</button>
                  ))}
                </div>
              </Field>
              <Field label="Symbol">
                <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,maxHeight:240,overflowY:"auto" }}>
                  {SYMBOL_LIBRARY.filter(s=>s.category===symCat).map(sym=>(
                    <div key={sym.id} onClick={()=>set("unitType",sym.id)} title={sym.label} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 4px",borderRadius:5,cursor:"pointer",background:draft.unitType===sym.id?THEME.accentDim:THEME.bgInput,border:`1px solid ${draft.unitType===sym.id?THEME.accent:THEME.borderLight}` }}>
                      <UnitSymbolSVG type={sym.id} affiliation={draft.affiliation} size={28} fillColor={draft.fillColor}/>
                      <span style={{ fontSize:8,color:THEME.textMuted,textAlign:"center",lineHeight:1.2 }}>{sym.label}</span>
                    </div>
                  ))}
                </div>
              </Field>
              <Field label="Custom Fill Colour">
                <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                  <input type="color" value={draft.fillColor||AFFILIATION_COLORS[draft.affiliation].bg} onChange={e=>set("fillColor",e.target.value)} style={{ width:36,height:32,borderRadius:4,border:`1px solid ${THEME.borderLight}`,cursor:"pointer",background:"none" }}/>
                  {draft.fillColor && <button onClick={()=>set("fillColor",undefined)} style={btnSmallStyle}>Reset</button>}
                </div>
              </Field>
              <Field label="Flag Background">
                <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,maxHeight:180,overflowY:"auto" }}>
                  <div onClick={()=>set("flagCode",undefined)} style={{ padding:4,borderRadius:4,cursor:"pointer",textAlign:"center",background:!draft.flagCode?THEME.accentDim:THEME.bgInput,border:`1px solid ${!draft.flagCode?THEME.accent:THEME.borderLight}`,color:THEME.textMuted,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",minHeight:36 }}>None</div>
                  {FLAGS.map(f=>(
                    <div key={f.code} onClick={()=>set("flagCode",f.code)} title={f.label} style={{ padding:2,borderRadius:4,cursor:"pointer",background:draft.flagCode===f.code?THEME.accentDim:THEME.bgInput,border:`1px solid ${draft.flagCode===f.code?THEME.accent:THEME.borderLight}` }}>
                      <img src={flagUrl(f.code)} alt={f.label} style={{ width:"100%",height:20,objectFit:"cover",borderRadius:2,display:"block" }}/>
                      <div style={{ fontSize:7,color:THEME.textMuted,textAlign:"center",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{f.label}</div>
                    </div>
                  ))}
                </div>
              </Field>
            </div>
          )}
          {tab==="slots" && (
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              <div style={{ fontSize:11,color:THEME.textMuted }}>Select roster members assigned to this unit.</div>
              {roster.length===0 ? (
                <div style={{ color:THEME.textMuted,fontSize:11,padding:16,textAlign:"center",border:`1px dashed ${THEME.borderLight}`,borderRadius:4 }}>No roster members found for this group</div>
              ) : (
                <div style={{ display:"flex",flexDirection:"column",gap:4,maxHeight:320,overflowY:"auto" }}>
                  {roster.map((member:any)=>{
                    const uid=member.user_id||member.id;
                    const selected=(draft.rosterSlots||[]).includes(uid);
                    return (
                      <div key={uid} onClick={()=>toggleSlot(uid)} style={{ display:"flex",alignItems:"center",gap:10,padding:"6px 10px",borderRadius:5,cursor:"pointer",background:selected?THEME.accentDim:THEME.bgInput,border:`1px solid ${selected?THEME.accent:THEME.borderLight}` }}>
                        <div style={{ width:16,height:16,borderRadius:3,background:selected?THEME.accent:"transparent",border:`1px solid ${selected?THEME.accent:THEME.textMuted}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                          {selected&&<span style={{ color:"#000",fontSize:10,fontWeight:700 }}>✓</span>}
                        </div>
                        <div>
                          <div style={{ fontSize:11,fontWeight:600,color:THEME.text }}>{member.callsign||"Unknown"}</div>
                          {member.rank_id&&<div style={{ fontSize:9,color:THEME.textMuted }}>{member.rank_id}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {tab==="charts" && (
            <div>
              <ChartBuilder title="Weapons Chart" rows={draft.weaponsChart||[]} cols={draft.weaponsCols||[]} onChangeRows={r=>set("weaponsChart",r)} onChangeCols={c=>set("weaponsCols",c)}/>
              <div style={{ height:1,background:THEME.border,margin:"20px 0" }}/>
              <ChartBuilder title="Vehicles Chart" rows={draft.vehiclesChart||[]} cols={draft.vehiclesCols||[]} onChangeRows={r=>set("vehiclesChart",r)} onChangeCols={c=>set("vehiclesCols",c)}/>
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{ display:"flex",justifyContent:"flex-end",gap:8,padding:"12px 16px",borderTop:`1px solid ${THEME.border}`,background:THEME.bgPanel }}>
          <button onClick={onClose} style={btnSecondaryStyle}>Cancel</button>
          <button onClick={()=>{onSave(draft);onClose();}} style={btnPrimaryStyle}><Save size={12}/> Save Unit</button>
        </div>
      </div>
    </div>
  );
}


// ─── Canvas ───────────────────────────────────────────────────────────────────

function OrbatCanvas({ roots, onEdit, onAddChild, onDelete, onDuplicate, onToggle, readOnly }: {
  roots:OrbatNode[]; onEdit:(n:OrbatNode)=>void; onAddChild:(id:string)=>void;
  onDelete:(id:string)=>void; onDuplicate:(n:OrbatNode)=>void;
  onToggle:(id:string)=>void; readOnly:boolean;
}) {
  let all: LayoutNode[] = [], offsetX = 0;
  for (const root of roots) {
    all.push(...layoutAll(root, offsetX, 0));
    offsetX += leafCount(root) * (NODE_W + H_GAP) + TREE_SEP;
  }
  const edges = buildEdges(all);
  let maxX = 0, maxY = 0;
  for (const n of all) { if (n.x+NODE_W/2>maxX) maxX=n.x+NODE_W/2; if (n.y+NODE_H>maxY) maxY=n.y+NODE_H; }
  const W = Math.max(offsetX, 300), H = Math.max(maxY + 80, 200);
  return (
    <div style={{ position:"relative",width:W,height:H }}>
      <svg style={{ position:"absolute",inset:0,overflow:"visible",pointerEvents:"none" }} width={W} height={H}>
        {edges.map((e,i)=><line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={THEME.borderLight} strokeWidth={1.5}/>)}
      </svg>
      {all.map(ln=><UnitCard key={ln.node.id} ln={ln} onEdit={onEdit} onAddChild={onAddChild} onDelete={onDelete} onDuplicate={onDuplicate} onToggle={onToggle} readOnly={readOnly}/>)}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface OrbatBuilderProps {
  initialData?: OrbatNode[]; onSave?: (nodes:OrbatNode[]) => void;
  value?: string; onChange?: (json:string) => void;
  groupName?: string; roster?: any[]; readOnly?: boolean;
}

export default function OrbatBuilder({ initialData, onSave, value, onChange, roster = [], readOnly = false }: OrbatBuilderProps) {
  const [nodes, setNodes] = useState<OrbatNode[]>(() => {
    if (initialData && initialData.length > 0) return initialData;
    if (value) { try { const p = JSON.parse(value); if (Array.isArray(p) && p.length > 0) return p; } catch {} }
    return [];
  });
  const [editingNode, setEditingNode] = useState<OrbatNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (!initialised && value) {
      try { const p=JSON.parse(value); if (Array.isArray(p)&&p.length>0) setNodes(p); } catch {}
      setInitialised(true);
    } else if (!initialised && value === "") { setInitialised(true); }
  }, [value, initialised]);

  const didMount = useRef(false);
  useEffect(() => { if (!didMount.current) { didMount.current=true; return; } if (onChange) onChange(JSON.stringify(nodes)); }, [nodes]);

  function updateById(tree:OrbatNode[], id:string, u:Partial<OrbatNode>): OrbatNode[] {
    return tree.map(n=>n.id===id?{...n,...u}:{...n,children:updateById(n.children,id,u)});
  }
  function deleteById(tree:OrbatNode[], id:string): OrbatNode[] {
    return tree.filter(n=>n.id!==id).map(n=>({...n,children:deleteById(n.children,id)}));
  }
  function addChildTo(tree:OrbatNode[], pid:string, child:OrbatNode): OrbatNode[] {
    return tree.map(n=>n.id===pid?{...n,children:[...n.children,child]}:{...n,children:addChildTo(n.children,pid,child)});
  }
  function replaceById(tree:OrbatNode[], id:string, updated:OrbatNode): OrbatNode[] {
    return tree.map(n=>n.id===id?updated:{...n,children:replaceById(n.children,id,updated)});
  }
  function findNode(tree:OrbatNode[], id:string): OrbatNode|undefined {
    for (const n of tree) { if (n.id===id) return n; const f=findNode(n.children,id); if (f) return f; }
  }
  function deepCopy(n:OrbatNode): OrbatNode {
    return { ...n, id:generateId(), label:n.label+" (copy)", children:n.children.map(deepCopy) };
  }

  const handleAddChild = (pid:string) => { const child=defaultNode({echelon:"squad"}); setNodes(p=>addChildTo(p,pid,child)); setEditingNode(child); };
  const handleAddRoot = () => { const node=defaultNode({echelon:"battalion"}); setNodes(p=>[...p,node]); setEditingNode(node); };
  const handleSaveEdit = (updated:OrbatNode) => { setNodes(prev=>JSON.stringify(prev).includes(`"id":"${updated.id}"`)?replaceById(prev,updated.id,updated):[...prev,updated]); };
  const handleExport = () => { const blob=new Blob([JSON.stringify(nodes,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="orbat.json"; a.click(); };

  function flattenNodes(tree:OrbatNode[]): OrbatNode[] { return tree.flatMap(n=>[n,...flattenNodes(n.children)]); }
  const allNodes = flattenNodes(nodes);

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100%",background:THEME.bg,border:`1px solid ${THEME.border}`,borderRadius:8,overflow:"hidden",fontFamily:"Arial, sans-serif" }}>
      {/* Toolbar */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 16px",borderBottom:`1px solid ${THEME.border}`,background:THEME.bgPanel,flexShrink:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:11,fontWeight:700,color:THEME.textMuted,textTransform:"uppercase",letterSpacing:2 }}>ORBAT</span>
          <span style={{ fontSize:9,background:THEME.accentDim,color:THEME.accent,border:`1px solid ${THEME.accentBorder}`,borderRadius:3,padding:"1px 6px",fontWeight:700,letterSpacing:1 }}>BATTLE ORDER STYLE</span>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:6 }}>
          <button onClick={()=>setZoom(z=>Math.max(0.3,+(z-0.1).toFixed(1)))} style={iconBtnStyle}><ZoomOut size={13}/></button>
          <span style={{ fontSize:11,color:THEME.textMuted,fontFamily:"monospace",width:36,textAlign:"center" }}>{Math.round(zoom*100)}%</span>
          <button onClick={()=>setZoom(z=>Math.min(2.5,+(z+0.1).toFixed(1)))} style={iconBtnStyle}><ZoomIn size={13}/></button>
          <div style={{ width:1,height:16,background:THEME.border,margin:"0 4px" }}/>
          <button onClick={handleExport} style={iconBtnStyle} title="Export JSON"><Download size={13}/></button>
          {!readOnly && onSave && <button onClick={()=>onSave(nodes)} style={btnPrimaryStyle}><Save size={11}/> Save</button>}
        </div>
      </div>
      {/* Canvas */}
      <div style={{ flex:1,overflow:"auto",padding:24 }}>
        {nodes.length===0 ? (
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:16,textAlign:"center" }}>
            <div style={{ opacity:0.25 }}><UnitSymbolSVG type="infantry" affiliation="friendly" size={56}/></div>
            <p style={{ color:THEME.textMuted,fontSize:13,margin:0 }}>No units yet. Build your ORBAT.</p>
            {!readOnly && <button onClick={handleAddRoot} style={{ ...btnPrimaryStyle,fontSize:13,padding:"10px 24px" }}><Plus size={14}/> Add Root Unit</button>}
          </div>
        ) : (
          <div>
            <div style={{ transform:`scale(${zoom})`,transformOrigin:"top left",display:"inline-block" }}>
              <OrbatCanvas roots={nodes} onEdit={setEditingNode} onAddChild={handleAddChild}
                onDelete={id=>setNodes(p=>deleteById(p,id))} onDuplicate={node=>setNodes(p=>[...p,deepCopy(node)])}
                onToggle={id=>setNodes(p=>updateById(p,id,{collapsed:!findNode(p,id)?.collapsed}))}
                readOnly={readOnly}/>
            </div>
            {/* Charts display */}
            {allNodes.some(n=>n.weaponsChart&&n.weaponsChart.length>0) && (
              <div style={{ marginTop:24,background:THEME.bgCard,border:`1px solid ${THEME.border}`,borderRadius:6,padding:16 }}>
                {allNodes.filter(n=>n.weaponsChart&&n.weaponsChart.length>0).map(n=>(
                  <div key={n.id} style={{ marginBottom:16 }}>
                    <div style={{ fontSize:10,fontWeight:700,color:THEME.accent,textTransform:"uppercase",letterSpacing:1,marginBottom:6 }}>{n.label} — Weapons</div>
                    <table style={{ borderCollapse:"collapse",fontSize:10,color:THEME.text }}>
                      <thead><tr><th style={{ ...thStyle,textAlign:"left" as const,minWidth:140 }}>Equipment</th>{(n.weaponsCols||[]).map(c=><th key={c.id} style={{ ...thStyle,minWidth:60 }}>{c.label}</th>)}</tr></thead>
                      <tbody>{(n.weaponsChart||[]).map((row,i)=>(
                        <tr key={i} style={{ background:i%2===0?"rgba(255,255,255,0.02)":undefined }}>
                          <td style={{ ...tdStyle,textAlign:"left" as const,fontWeight:600 }}>{row.name}</td>
                          {(n.weaponsCols||[]).map(c=><td key={c.id} style={tdStyle}>{row[c.id]??"—"}</td>)}
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {editingNode && <NodeEditor node={editingNode} roster={roster} onSave={handleSaveEdit} onClose={()=>setEditingNode(null)}/>}
      {!readOnly && nodes.length>0 && (
        <div style={{ borderTop:`1px solid ${THEME.border}`,padding:"8px 16px",background:THEME.bgPanel,flexShrink:0 }}>
          <button onClick={handleAddRoot} style={{ ...btnSecondaryStyle,display:"flex",alignItems:"center",gap:5,fontSize:11 }}><Plus size={12}/> Add Root Unit</button>
        </div>
      )}
    </div>
  );
}
