/**
 * ORBAT Builder v3
 * NATO APP-6 style icons — white/coloured fill, black border, black symbols
 * Site monochrome theme — no blue/green UI chrome
 */

import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Save, ZoomIn, ZoomOut, Download, Copy, X, Edit3, Table2, Users, ChevronDown, ChevronUp, Flag } from "lucide-react";

export type Affiliation = "friendly" | "hostile" | "neutral" | "unknown";
export type Echelon = "" | "fireteam" | "squad" | "section" | "platoon" | "staffel" | "company" | "battalion" | "regiment" | "brigade" | "division" | "corps" | "army" | "theater" | "command";
export type TaskForceModifier = "none" | "hq" | "taskforce" | "hq_taskforce" | "dummy" | "reinforced" | "reduced" | "reinforced_reduced";
export interface WeaponEntry { name: string; [k: string]: string | number; }
export interface ChartColumn { id: string; label: string; }
export interface OrbatNode {
  id: string; label: string; nickname?: string; designation?: string;
  unitType: string; affiliation: Affiliation; echelon: Echelon; modifier: TaskForceModifier;
  fillColor?: string; flagCode?: string; description?: string;
  collapsed?: boolean; children: OrbatNode[];
  officers?: number; enlisted?: number; rosterSlots?: string[];
  weaponsChart?: WeaponEntry[]; vehiclesChart?: WeaponEntry[];
  weaponsCols?: ChartColumn[]; vehiclesCols?: ChartColumn[];
}

function generateId() { return Math.random().toString(36).slice(2, 10); }
function defaultNode(o: Partial<OrbatNode> = {}): OrbatNode {
  return { id: generateId(), label: "New Unit", nickname: "", designation: "", unitType: "infantry",
    affiliation: "friendly", echelon: "platoon", modifier: "none", description: "",
    collapsed: false, children: [], rosterSlots: [], ...o };
}

// ─── Site-matching monochrome theme ──────────────────────────────────────────
// Mirrors the CSS variables from index.css dark mode
const T = {
  bg: "hsl(0,0%,5%)",          // --background dark
  bgCard: "hsl(0,0%,8%)",      // --card dark
  bgPanel: "hsl(0,0%,6%)",
  bgInput: "hsl(0,0%,12%)",    // --input dark
  border: "hsl(0,0%,17%)",     // --border dark
  borderHover: "hsl(0,0%,28%)",
  text: "hsl(0,0%,92%)",       // --foreground dark
  textMuted: "hsl(0,0%,56%)",  // --muted-foreground dark
  textDim: "hsl(0,0%,35%)",
  primary: "hsl(0,0%,90%)",    // --primary dark
  primaryFg: "hsl(0,0%,5%)",
  danger: "hsl(0,65%,48%)",
};

// ─── NATO APP-6 affiliation fills (these are correct standard colours) ────────
// Friendly=blue, Hostile=red, Neutral=green, Unknown=yellow
// These are the actual recognised symbols — not UI chrome
const AFF: Record<Affiliation,{fill:string;stroke:string;sym:string}> = {
  friendly: { fill:"#aad4f5", stroke:"#000", sym:"#000" },
  hostile:  { fill:"#f59898", stroke:"#000", sym:"#000" },
  neutral:  { fill:"#aaffaa", stroke:"#000", sym:"#000" },
  unknown:  { fill:"#ffff80", stroke:"#000", sym:"#000" },
};

// ─── Symbol definitions — proper NATO APP-6 style ─────────────────────────────
// Black symbols on coloured/white fill, standard black border rect
interface SymDef { id:string; label:string; cat:string; r:(cx:number,cy:number,sc:number)=>React.ReactNode; }

const SYMS: SymDef[] = [
  // ── Infantry ──
  { id:"infantry", label:"Infantry", cat:"Infantry",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><line x1={cx-13*sc} y1={cy-9*sc} x2={cx+13*sc} y2={cy+9*sc}/><line x1={cx+13*sc} y1={cy-9*sc} x2={cx-13*sc} y2={cy+9*sc}/></g> },
  { id:"infantry_airborne", label:"Infantry (Airborne)", cat:"Infantry",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><line x1={cx-13*sc} y1={cy-9*sc} x2={cx+13*sc} y2={cy+9*sc}/><line x1={cx+13*sc} y1={cy-9*sc} x2={cx-13*sc} y2={cy+9*sc}/><path d={`M${cx-9*sc},${cy+8*sc} Q${cx},${cy+2*sc} ${cx+9*sc},${cy+8*sc}`}/></g> },
  { id:"infantry_air_assault", label:"Infantry (Air Assault)", cat:"Infantry",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><line x1={cx-13*sc} y1={cy-9*sc} x2={cx+13*sc} y2={cy+9*sc}/><line x1={cx+13*sc} y1={cy-9*sc} x2={cx-13*sc} y2={cy+9*sc}/><path d={`M${cx-9*sc},${cy+8*sc} Q${cx},${cy+3*sc} ${cx+9*sc},${cy+8*sc}`}/><line x1={cx-5*sc} y1={cy+8*sc} x2={cx-5*sc} y2={cy+13*sc}/><line x1={cx+5*sc} y1={cy+8*sc} x2={cx+5*sc} y2={cy+13*sc}/></g> },
  { id:"infantry_armored", label:"Infantry (Armored, IFV)", cat:"Infantry",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><line x1={cx-13*sc} y1={cy-9*sc} x2={cx+13*sc} y2={cy+9*sc}/><line x1={cx+13*sc} y1={cy-9*sc} x2={cx-13*sc} y2={cy+9*sc}/><ellipse cx={cx} cy={cy+9*sc} rx={7*sc} ry={4*sc}/></g> },
  { id:"infantry_amphibious", label:"Infantry (Amphibious)", cat:"Infantry",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><line x1={cx-13*sc} y1={cy-9*sc} x2={cx+13*sc} y2={cy+9*sc}/><line x1={cx+13*sc} y1={cy-9*sc} x2={cx-13*sc} y2={cy+9*sc}/><path d={`M${cx-11*sc},${cy+9*sc} Q${cx-5*sc},${cy+5*sc} ${cx},${cy+9*sc} Q${cx+5*sc},${cy+13*sc} ${cx+11*sc},${cy+9*sc}`}/></g> },
  { id:"infantry_arctic", label:"Infantry (Arctic)", cat:"Infantry",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><line x1={cx-13*sc} y1={cy-9*sc} x2={cx+13*sc} y2={cy+9*sc}/><line x1={cx+13*sc} y1={cy-9*sc} x2={cx-13*sc} y2={cy+9*sc}/><polygon points={`${cx},${cy-13*sc} ${cx-7*sc},${cy-4*sc} ${cx+7*sc},${cy-4*sc}`}/></g> },
  { id:"infantry_mountain", label:"Infantry (Mountain)", cat:"Infantry",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><line x1={cx-13*sc} y1={cy-9*sc} x2={cx+13*sc} y2={cy+9*sc}/><line x1={cx+13*sc} y1={cy-9*sc} x2={cx-13*sc} y2={cy+9*sc}/><polygon points={`${cx},${cy-12*sc} ${cx-9*sc},${cy+3*sc} ${cx+9*sc},${cy+3*sc}`}/></g> },
  { id:"infantry_motorized", label:"Infantry (Motorized)", cat:"Infantry",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><line x1={cx-13*sc} y1={cy-9*sc} x2={cx+13*sc} y2={cy+9*sc}/><line x1={cx+13*sc} y1={cy-9*sc} x2={cx-13*sc} y2={cy+9*sc}/><circle cx={cx-5*sc} cy={cy+12*sc} r={3*sc}/><circle cx={cx+5*sc} cy={cy+12*sc} r={3*sc}/></g> },
  { id:"ranger", label:"Ranger", cat:"Infantry",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><line x1={cx-13*sc} y1={cy-9*sc} x2={cx+13*sc} y2={cy+9*sc}/><line x1={cx+13*sc} y1={cy-9*sc} x2={cx-13*sc} y2={cy+9*sc}/><circle cx={cx} cy={cy} r={7*sc}/></g> },
  { id:"special_forces", label:"Special Forces / SOF", cat:"Infantry",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><line x1={cx-13*sc} y1={cy-12*sc} x2={cx+13*sc} y2={cy+12*sc}/><line x1={cx+13*sc} y1={cy-12*sc} x2={cx-13*sc} y2={cy+12*sc}/><polygon points={`${cx},${cy-7*sc} ${cx+7*sc},${cy} ${cx},${cy+7*sc} ${cx-7*sc},${cy}`}/></g> },
  { id:"sniper", label:"Sniper", cat:"Infantry",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.5*sc} fill="none"><circle cx={cx} cy={cy} r={9*sc}/><line x1={cx} y1={cy-14*sc} x2={cx} y2={cy-9*sc}/><line x1={cx} y1={cy+9*sc} x2={cx} y2={cy+14*sc}/><line x1={cx-14*sc} y1={cy} x2={cx-9*sc} y2={cy}/><line x1={cx+9*sc} y1={cy} x2={cx+14*sc} y2={cy}/></g> },
  { id:"machine_gun", label:"Machine Gun (MG)", cat:"Infantry",
    r:(cx,cy,sc)=><text x={cx} y={cy+4*sc} textAnchor="middle" fill="#000" fontSize={10*sc} fontWeight="bold" fontFamily="Arial,sans-serif">MG</text> },
  { id:"dismounted_atgm", label:"Dismounted ATGMs", cat:"Infantry",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><line x1={cx-13*sc} y1={cy-9*sc} x2={cx+13*sc} y2={cy+9*sc}/><line x1={cx+13*sc} y1={cy-9*sc} x2={cx-13*sc} y2={cy+9*sc}/><polygon points={`${cx},${cy+13*sc} ${cx-7*sc},${cy+6*sc} ${cx+7*sc},${cy+6*sc}`} fill="#000"/></g> },
  { id:"sof", label:"SOF", cat:"Infantry",
    r:(cx,cy,sc)=><text x={cx} y={cy+4*sc} textAnchor="middle" fill="#000" fontSize={10*sc} fontWeight="bold" fontFamily="Arial,sans-serif">SOF</text> },
  { id:"sfa", label:"Security Force Assistance", cat:"Infantry",
    r:(cx,cy,sc)=><text x={cx} y={cy+4*sc} textAnchor="middle" fill="#000" fontSize={8*sc} fontWeight="bold" fontFamily="Arial,sans-serif">SFA</text> },
  { id:"weapons", label:"Weapons (General)", cat:"Infantry",
    r:(cx,cy,sc)=><text x={cx} y={cy+4*sc} textAnchor="middle" fill="#000" fontSize={9*sc} fontWeight="bold" fontFamily="Arial,sans-serif">WPN</text> },
  // ── Armor ──
  { id:"armor", label:"Armor", cat:"Armor",
    r:(cx,cy,sc)=><ellipse cx={cx} cy={cy} rx={13*sc} ry={7*sc} fill="none" stroke="#000" strokeWidth={1.8*sc}/> },
  { id:"armor_half_tracked", label:"Armor (Half-Tracked)", cat:"Armor",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><ellipse cx={cx} cy={cy} rx={13*sc} ry={7*sc}/><circle cx={cx-5*sc} cy={cy+9*sc} r={3*sc}/></g> },
  { id:"mechanized", label:"Mechanized Infantry", cat:"Armor",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><circle cx={cx} cy={cy} r={9*sc}/><line x1={cx-13*sc} y1={cy-9*sc} x2={cx+13*sc} y2={cy+9*sc}/><line x1={cx+13*sc} y1={cy-9*sc} x2={cx-13*sc} y2={cy+9*sc}/></g> },
  { id:"cavalry", label:"Cavalry / Recon", cat:"Armor",
    r:(cx,cy,sc)=><line x1={cx-13*sc} y1={cy+11*sc} x2={cx+13*sc} y2={cy-11*sc} stroke="#000" strokeWidth={2.2*sc}/> },
  // ── Artillery ──
  { id:"artillery", label:"Artillery", cat:"Artillery",
    r:(cx,cy,sc)=><circle cx={cx} cy={cy} r={10*sc} fill="none" stroke="#000" strokeWidth={1.8*sc}/> },
  { id:"field_artillery", label:"Field Artillery", cat:"Artillery",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><circle cx={cx} cy={cy} r={10*sc}/><line x1={cx} y1={cy-10*sc} x2={cx} y2={cy-14*sc}/></g> },
  { id:"rocket_artillery", label:"Rocket Artillery (MLRS)", cat:"Artillery",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><circle cx={cx} cy={cy+3*sc} r={8*sc}/><line x1={cx} y1={cy-5*sc} x2={cx} y2={cy-14*sc}/><line x1={cx-4*sc} y1={cy-10*sc} x2={cx} y2={cy-14*sc}/><line x1={cx+4*sc} y1={cy-10*sc} x2={cx} y2={cy-14*sc}/></g> },
  { id:"mortar", label:"Mortar", cat:"Artillery",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc}><circle cx={cx} cy={cy} r={10*sc} fill="none"/><circle cx={cx} cy={cy} r={3*sc} fill="#000"/></g> },
  { id:"antitank", label:"Anti-Tank (AT)", cat:"Artillery",
    r:(cx,cy,sc)=><polygon points={`${cx},${cy+11*sc} ${cx-11*sc},${cy-7*sc} ${cx+11*sc},${cy-7*sc}`} fill="none" stroke="#000" strokeWidth={1.8*sc}/> },
  { id:"air_defense", label:"Air Defense (AD)", cat:"Artillery",
    r:(cx,cy,sc)=><polygon points={`${cx},${cy-11*sc} ${cx-11*sc},${cy+7*sc} ${cx+11*sc},${cy+7*sc}`} fill="none" stroke="#000" strokeWidth={1.8*sc}/> },
  // ── Aviation ──
  { id:"aviation", label:"Aviation (General)", cat:"Aviation",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><line x1={cx-13*sc} y1={cy} x2={cx+13*sc} y2={cy}/><line x1={cx} y1={cy-8*sc} x2={cx} y2={cy+8*sc}/><circle cx={cx} cy={cy} r={3*sc} fill="#000"/></g> },
  { id:"aviation_attack", label:"Aviation (Attack Helicopter)", cat:"Aviation",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><line x1={cx-13*sc} y1={cy} x2={cx+13*sc} y2={cy}/><line x1={cx} y1={cy-8*sc} x2={cx} y2={cy+8*sc}/><circle cx={cx} cy={cy} r={3*sc} fill="#000"/><polygon points={`${cx},${cy+12*sc} ${cx-5*sc},${cy+7*sc} ${cx+5*sc},${cy+7*sc}`} fill="#000"/></g> },
  { id:"aviation_utility", label:"Aviation (Utility Helicopter)", cat:"Aviation",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><line x1={cx-13*sc} y1={cy} x2={cx+13*sc} y2={cy}/><line x1={cx} y1={cy-8*sc} x2={cx} y2={cy+8*sc}/><circle cx={cx} cy={cy} r={3*sc} fill="#000"/><circle cx={cx} cy={cy+10*sc} r={3*sc}/></g> },
  { id:"aviation_fixed_wing", label:"Aviation (Fixed Wing)", cat:"Aviation",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><ellipse cx={cx} cy={cy} rx={5*sc} ry={10*sc}/><line x1={cx-13*sc} y1={cy+2*sc} x2={cx+13*sc} y2={cy+2*sc}/></g> },
  { id:"aviation_uav", label:"UAV / Drone", cat:"Aviation",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><rect x={cx-9*sc} y={cy-5*sc} width={18*sc} height={10*sc} rx={2*sc}/><line x1={cx-13*sc} y1={cy} x2={cx-9*sc} y2={cy}/><line x1={cx+9*sc} y1={cy} x2={cx+13*sc} y2={cy}/></g> },
  { id:"atc", label:"Air Traffic Control", cat:"Aviation",
    r:(cx,cy,sc)=><text x={cx} y={cy+4*sc} textAnchor="middle" fill="#000" fontSize={9*sc} fontWeight="bold" fontFamily="Arial,sans-serif">ATC</text> },
  { id:"forward_air_controller", label:"Forward Air Controller (FAC)", cat:"Aviation",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><polygon points={`${cx},${cy-11*sc} ${cx-9*sc},${cy+5*sc} ${cx+9*sc},${cy+5*sc}`}/><line x1={cx} y1={cy+5*sc} x2={cx} y2={cy+12*sc}/></g> },
  { id:"satellite", label:"Satellite", cat:"Aviation",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.5*sc} fill="none"><circle cx={cx} cy={cy} r={5*sc}/><line x1={cx-13*sc} y1={cy-7*sc} x2={cx-5*sc} y2={cy}/><line x1={cx+5*sc} y1={cy} x2={cx+13*sc} y2={cy+7*sc}/></g> },
  // ── Combat Support ──
  { id:"engineer", label:"Engineer (General)", cat:"Combat Support",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.5*sc} fill="none"><rect x={cx-9*sc} y={cy-7*sc} width={18*sc} height={14*sc}/><line x1={cx-9*sc} y1={cy} x2={cx+9*sc} y2={cy}/></g> },
  { id:"engineer_armored", label:"Armored Engineers", cat:"Combat Support",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.5*sc} fill="none"><rect x={cx-9*sc} y={cy-7*sc} width={18*sc} height={14*sc}/><line x1={cx-9*sc} y1={cy} x2={cx+9*sc} y2={cy}/><ellipse cx={cx} cy={cy+9*sc} rx={7*sc} ry={3*sc}/></g> },
  { id:"bridging", label:"Bridging / Pontoon", cat:"Combat Support",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.5*sc} fill="none"><line x1={cx-13*sc} y1={cy+3*sc} x2={cx+13*sc} y2={cy+3*sc}/><line x1={cx-9*sc} y1={cy+3*sc} x2={cx-9*sc} y2={cy-5*sc}/><line x1={cx-3*sc} y1={cy+3*sc} x2={cx-3*sc} y2={cy-5*sc}/><line x1={cx+3*sc} y1={cy+3*sc} x2={cx+3*sc} y2={cy-5*sc}/><line x1={cx+9*sc} y1={cy+3*sc} x2={cx+9*sc} y2={cy-5*sc}/></g> },
  { id:"construction", label:"Construction / Airfield", cat:"Combat Support",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.5*sc} fill="none"><rect x={cx-9*sc} y={cy-7*sc} width={18*sc} height={14*sc}/><line x1={cx-9*sc} y1={cy-7*sc} x2={cx+9*sc} y2={cy+7*sc}/></g> },
  { id:"signal", label:"Signal / Comms", cat:"Combat Support",
    r:(cx,cy,sc)=><polyline points={`${cx-11*sc},${cy+5*sc} ${cx-4*sc},${cy-5*sc} ${cx+4*sc},${cy+5*sc} ${cx+11*sc},${cy-5*sc}`} fill="none" stroke="#000" strokeWidth={1.8*sc}/> },
  { id:"electronic_warfare", label:"Electronic Warfare (EW)", cat:"Combat Support",
    r:(cx,cy,sc)=><text x={cx} y={cy+4*sc} textAnchor="middle" fill="#000" fontSize={9*sc} fontWeight="bold" fontFamily="Arial,sans-serif">EW</text> },
  { id:"cyber", label:"Cyber", cat:"Combat Support",
    r:(cx,cy,sc)=><text x={cx} y={cy+4*sc} textAnchor="middle" fill="#000" fontSize={9*sc} fontWeight="bold" fontFamily="Arial,sans-serif">CY</text> },
  { id:"psyops", label:"PSYOP", cat:"Combat Support",
    r:(cx,cy,sc)=><text x={cx} y={cy+4*sc} textAnchor="middle" fill="#000" fontSize={9*sc} fontWeight="bold" fontFamily="Arial,sans-serif">PSY</text> },
  { id:"civil_affairs", label:"Civil Affairs", cat:"Combat Support",
    r:(cx,cy,sc)=><text x={cx} y={cy+4*sc} textAnchor="middle" fill="#000" fontSize={9*sc} fontWeight="bold" fontFamily="Arial,sans-serif">CA</text> },
  { id:"forward_observer", label:"Forward Observer / JTAC", cat:"Combat Support",
    r:(cx,cy,sc)=><text x={cx} y={cy+4*sc} textAnchor="middle" fill="#000" fontSize={9*sc} fontWeight="bold" fontFamily="Arial,sans-serif">FO</text> },
  { id:"military_police", label:"Military Police (MP)", cat:"Combat Support",
    r:(cx,cy,sc)=><text x={cx} y={cy+5*sc} textAnchor="middle" fill="#000" fontSize={12*sc} fontWeight="bold" fontFamily="Arial,sans-serif">MP</text> },
  { id:"nuclear_bio_chem", label:"NBC / CBRN", cat:"Combat Support",
    r:(cx,cy,sc)=><text x={cx} y={cy+4*sc} textAnchor="middle" fill="#000" fontSize={8*sc} fontWeight="bold" fontFamily="Arial,sans-serif">NBC</text> },
  { id:"naval_gunfire", label:"Naval Gunfire Support", cat:"Combat Support",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.5*sc} fill="none"><circle cx={cx} cy={cy} r={9*sc}/><path d={`M${cx-7*sc},${cy+5*sc} L${cx},${cy-3*sc} L${cx+7*sc},${cy+5*sc}`}/></g> },
  // ── Service Support ──
  { id:"logistics", label:"Logistics (General)", cat:"Service Support",
    r:(cx,cy,sc)=><rect x={cx-9*sc} y={cy-9*sc} width={18*sc} height={18*sc} fill="none" stroke="#000" strokeWidth={1.5*sc}/> },
  { id:"supply", label:"Supply", cat:"Service Support",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.5*sc} fill="none"><rect x={cx-9*sc} y={cy-7*sc} width={18*sc} height={14*sc}/><line x1={cx-9*sc} y1={cy-2*sc} x2={cx+9*sc} y2={cy-2*sc}/></g> },
  { id:"maintenance", label:"Maintenance / Recovery", cat:"Service Support",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.5*sc} fill="none"><rect x={cx-9*sc} y={cy-9*sc} width={18*sc} height={18*sc}/><circle cx={cx} cy={cy} r={5*sc}/></g> },
  { id:"transportation", label:"Transportation", cat:"Service Support",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.5*sc} fill="none"><rect x={cx-11*sc} y={cy-5*sc} width={22*sc} height={9*sc}/><circle cx={cx-6*sc} cy={cy+7*sc} r={3*sc}/><circle cx={cx+6*sc} cy={cy+7*sc} r={3*sc}/></g> },
  { id:"ordnance", label:"Ordnance / Ammunition", cat:"Service Support",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.5*sc} fill="none"><ellipse cx={cx} cy={cy} rx={9*sc} ry={5*sc}/><line x1={cx} y1={cy-5*sc} x2={cx} y2={cy-11*sc}/><line x1={cx-4*sc} y1={cy-9*sc} x2={cx+4*sc} y2={cy-9*sc}/></g> },
  { id:"fuel", label:"Petroleum / Fuel", cat:"Service Support",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.5*sc} fill="none"><rect x={cx-7*sc} y={cy-7*sc} width={14*sc} height={14*sc} rx={3*sc}/><line x1={cx} y1={cy-7*sc} x2={cx} y2={cy-11*sc}/><line x1={cx-4*sc} y1={cy} x2={cx+4*sc} y2={cy}/></g> },
  // ── Medical ──
  { id:"medical", label:"Medical (General)", cat:"Medical",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={2.2*sc} fill="none"><line x1={cx} y1={cy-11*sc} x2={cx} y2={cy+11*sc}/><line x1={cx-11*sc} y1={cy} x2={cx+11*sc} y2={cy}/></g> },
  { id:"medical_armor", label:"Armored Ambulance", cat:"Medical",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.8*sc} fill="none"><line x1={cx} y1={cy-9*sc} x2={cx} y2={cy+9*sc}/><line x1={cx-9*sc} y1={cy} x2={cx+9*sc} y2={cy}/><ellipse cx={cx} cy={cy+9*sc} rx={7*sc} ry={3*sc}/></g> },
  { id:"hospital", label:"Hospital / Aid Station", cat:"Medical",
    r:(cx,cy,sc)=><g stroke="#000" strokeWidth={1.3*sc} fill="none"><rect x={cx-11*sc} y={cy-9*sc} width={22*sc} height={18*sc}/><line x1={cx} y1={cy-6*sc} x2={cx} y2={cy+6*sc} strokeWidth={2.2*sc}/><line x1={cx-6*sc} y1={cy} x2={cx+6*sc} y2={cy} strokeWidth={2.2*sc}/></g> },
  // ── HQ ──
  { id:"hq", label:"Headquarters (HQ)", cat:"Headquarters",
    r:(cx,cy,sc)=><text x={cx} y={cy+5*sc} textAnchor="middle" fill="#000" fontSize={13*sc} fontWeight="bold" fontFamily="Arial,sans-serif">HQ</text> },
  { id:"cp", label:"Command Post (CP)", cat:"Headquarters",
    r:(cx,cy,sc)=><text x={cx} y={cy+5*sc} textAnchor="middle" fill="#000" fontSize={11*sc} fontWeight="bold" fontFamily="Arial,sans-serif">CP</text> },
  { id:"maneuver_support", label:"Maneuver Support (SPT)", cat:"Headquarters",
    r:(cx,cy,sc)=><text x={cx} y={cy+4*sc} textAnchor="middle" fill="#000" fontSize={8*sc} fontWeight="bold" fontFamily="Arial,sans-serif">SPT</text> },
  { id:"custom", label:"Custom / Unknown", cat:"Custom",
    r:(cx,cy,sc)=><text x={cx} y={cy+4*sc} textAnchor="middle" fill="#000" fontSize={10*sc} fontWeight="bold" fontFamily="Arial,sans-serif">?</text> },
];

const SYM_CATS = Array.from(new Set(SYMS.map(s=>s.cat)));
const SYM_BY_ID: Record<string,SymDef> = Object.fromEntries(SYMS.map(s=>[s.id,s]));

const FLAGS = [
  {code:"gb",label:"UK"},{code:"us",label:"USA"},{code:"ca",label:"Canada"},
  {code:"au",label:"Australia"},{code:"nz",label:"NZ"},{code:"de",label:"Germany"},
  {code:"fr",label:"France"},{code:"it",label:"Italy"},{code:"nl",label:"Netherlands"},
  {code:"be",label:"Belgium"},{code:"no",label:"Norway"},{code:"se",label:"Sweden"},
  {code:"fi",label:"Finland"},{code:"dk",label:"Denmark"},{code:"pl",label:"Poland"},
  {code:"ua",label:"Ukraine"},{code:"tr",label:"Turkey"},{code:"il",label:"Israel"},
  {code:"za",label:"S.Africa"},{code:"jp",label:"Japan"},{code:"kr",label:"S.Korea"},
  {code:"br",label:"Brazil"},{code:"es",label:"Spain"},
];
const flagUrl=(c:string)=>`https://flagcdn.com/w80/${c}.png`;

const ECHELON_MARKS: Record<Echelon,string> = {
  "":"", fireteam:"·", squad:"··", section:"···", platoon:"|",
  staffel:"||||", company:"||", battalion:"|||", regiment:"X",
  brigade:"XX", division:"XXX", corps:"XXXX", army:"XXXXX", theater:"+++", command:"++",
};
const ECHELON_OPTS:{id:Echelon;label:string}[] = [
  {id:"",label:"None"},{id:"fireteam",label:"Fireteam"},{id:"squad",label:"Squad"},
  {id:"section",label:"Section"},{id:"platoon",label:"Platoon"},{id:"staffel",label:"Staffel"},
  {id:"company",label:"Company / Battery / Troop"},{id:"battalion",label:"Battalion / Squadron"},
  {id:"regiment",label:"Regiment / Group"},{id:"brigade",label:"Brigade"},
  {id:"division",label:"Division"},{id:"corps",label:"Corps"},
  {id:"army",label:"Army"},{id:"theater",label:"Theater"},{id:"command",label:"Command"},
];
const MOD_OPTS:{id:TaskForceModifier;label:string}[] = [
  {id:"none",label:"None"},{id:"hq",label:"Headquarters (HQ)"},{id:"taskforce",label:"Task Force (TF)"},
  {id:"hq_taskforce",label:"HQ + Task Force"},{id:"dummy",label:"Dummy / Feint"},
  {id:"reinforced",label:"Reinforced (+)"},{id:"reduced",label:"Reduced (-)"},
  {id:"reinforced_reduced",label:"Reinforced & Reduced (±)"},
];
const AFF_OPTS:{id:Affiliation;label:string}[] = [
  {id:"friendly",label:"Friendly"},{id:"hostile",label:"Hostile / Enemy"},
  {id:"neutral",label:"Neutral"},{id:"unknown",label:"Unknown"},
];


// ─── NATO APP-6 Icon SVG ──────────────────────────────────────────────────────
// White/coloured fill, BLACK border rectangle, BLACK internal symbol
function UnitIcon({ type, affiliation, size=48, fillColor, flagCode }: {
  type:string; affiliation:Affiliation; size?:number; fillColor?:string; flagCode?:string;
}) {
  const aff = AFF[affiliation];
  const fill = fillColor || aff.fill;
  const w = size*1.4, h = size;
  const cx = w/2, cy = h/2, sc = size/48;
  const uid = `fc-${type}-${size}`;
  const sym = SYM_BY_ID[type];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{overflow:"visible",display:"block"}}>
      <defs><clipPath id={uid}><rect x={2} y={2} width={w-4} height={h-4} rx={1}/></clipPath></defs>
      {/* Fill */}
      <rect x={2} y={2} width={w-4} height={h-4} rx={1} fill={fill} stroke={aff.stroke} strokeWidth={2}/>
      {/* Flag overlay */}
      {flagCode && <image href={flagUrl(flagCode)} x={2} y={2} width={w-4} height={h-4} clipPath={`url(#${uid})`} preserveAspectRatio="xMidYMid slice" opacity={0.4}/>}
      {/* Symbol (black) */}
      {sym ? sym.r(cx,cy,sc) : <g stroke="#000" strokeWidth={1.8*sc} fill="none"><line x1={cx-12*sc} y1={cy-9*sc} x2={cx+12*sc} y2={cy+9*sc}/><line x1={cx+12*sc} y1={cy-9*sc} x2={cx-12*sc} y2={cy+9*sc}/></g>}
    </svg>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
const NW=120,NH=92,HG=32,VG=72,TS=48;
interface LN { node:OrbatNode; x:number; y:number; }
function lc(n:OrbatNode):number { if(n.collapsed||!n.children.length)return 1; return n.children.reduce((s,c)=>s+lc(c),0); }
function layout(node:OrbatNode,sx:number,d:number):LN[] {
  const res:LN[]=[];
  const tw=lc(node)*(NW+HG);
  res.push({node,x:sx+tw/2,y:d*(NH+VG)});
  if(!node.collapsed&&node.children.length){
    let cx=sx;
    for(const c of node.children){res.push(...layout(c,cx,d+1));cx+=lc(c)*(NW+HG);}
  }
  return res;
}
function edges(nodes:LN[]){
  const byId=new Map(nodes.map(n=>[n.node.id,n]));
  const e:{x1:number;y1:number;x2:number;y2:number}[]=[];
  for(const ln of nodes){
    if(ln.node.collapsed)continue;
    for(const c of ln.node.children){
      const cl=byId.get(c.id);if(!cl)continue;
      const py=ln.y+NH+14,my=ln.y+NH+VG/2;
      e.push({x1:ln.x,y1:py,x2:ln.x,y2:my});
      e.push({x1:ln.x,y1:my,x2:cl.x,y2:my});
      e.push({x1:cl.x,y1:my,x2:cl.x,y2:cl.y-2});
    }
  }
  return e;
}

// ─── Unit Card ────────────────────────────────────────────────────────────────
function UnitCard({ln,onEdit,onAdd,onDel,onDup,onToggle,ro}:{
  ln:LN;onEdit:(n:OrbatNode)=>void;onAdd:(id:string)=>void;
  onDel:(id:string)=>void;onDup:(n:OrbatNode)=>void;
  onToggle:(id:string)=>void;ro:boolean;
}) {
  const {node,x,y}=ln;
  const [show,setShow]=useState(false);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const em=ECHELON_MARKS[node.echelon]||"";
  const hasCh=node.children?.length>0;
  const modTx=()=>{
    switch(node.modifier){case"hq":return"HQ";case"taskforce":return"TF";case"hq_taskforce":return"HQ/TF";
    case"dummy":return"(D)";case"reinforced":return"(+)";case"reduced":return"(-)";case"reinforced_reduced":return"(±)";default:return null;}
  };
  const mod=modTx();
  const enter=()=>{if(timer.current)clearTimeout(timer.current);setShow(true);};
  const leave=()=>{timer.current=setTimeout(()=>setShow(false),700);};

  return(
    <div style={{position:"absolute",left:x-NW/2,top:y,width:NW}} onMouseEnter={enter} onMouseLeave={leave}>
      {/* Echelon */}
      <div style={{textAlign:"center",height:16,lineHeight:"16px",marginBottom:2}}>
        <span style={{fontSize:11,fontWeight:700,color:T.text,letterSpacing:1,fontFamily:"serif"}}>{em}</span>
      </div>
      {/* Action bar */}
      {show&&!ro&&(
        <div onMouseEnter={enter} onMouseLeave={leave} style={{position:"absolute",top:-30,left:"50%",transform:"translateX(-50%)",display:"flex",gap:2,background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:5,padding:"3px 5px",zIndex:30,whiteSpace:"nowrap",boxShadow:"0 4px 16px rgba(0,0,0,0.6)"}}>
          {[
            {icon:<Plus size={11}/>,fn:()=>onAdd(node.id),t:"Add child"},
            {icon:<Edit3 size={11}/>,fn:()=>onEdit(node),t:"Edit"},
            {icon:<Copy size={11}/>,fn:()=>onDup(node),t:"Duplicate"},
            {icon:<Trash2 size={11}/>,fn:()=>onDel(node.id),t:"Delete"},
          ].map((b,i)=>(
            <button key={i} onClick={e=>{e.stopPropagation();b.fn();}} title={b.t}
              style={{background:"transparent",border:"none",cursor:"pointer",color:T.textMuted,padding:"2px 4px",borderRadius:3,display:"flex",alignItems:"center"}}
              onMouseEnter={e=>e.currentTarget.style.color=T.primary}
              onMouseLeave={e=>e.currentTarget.style.color=T.textMuted}
            >{b.icon}</button>
          ))}
        </div>
      )}
      {/* Icon + label */}
      <div onClick={()=>!ro&&onEdit(node)} style={{display:"flex",flexDirection:"column",alignItems:"center",cursor:ro?"default":"pointer",position:"relative"}}>
        {mod&&<div style={{position:"absolute",top:0,right:-2,zIndex:10,background:T.bgCard,border:`1px solid ${T.border}`,color:T.text,fontSize:8,fontWeight:700,padding:"1px 3px",borderRadius:3,fontFamily:"monospace"}}>{mod}</div>}
        <div style={{position:"relative"}}>
          <UnitIcon type={node.unitType} affiliation={node.affiliation} size={42} fillColor={node.fillColor} flagCode={node.flagCode}/>
          {node.designation&&<div style={{position:"absolute",top:2,left:4,fontSize:8,fontWeight:700,color:"#000",fontFamily:"monospace",pointerEvents:"none"}}>{node.designation}</div>}
          {(node.rosterSlots&&node.rosterSlots.length>0)&&<div style={{position:"absolute",bottom:2,right:2,background:T.primary,borderRadius:"50%",width:12,height:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700,color:T.primaryFg}}>{node.rosterSlots.length}</div>}
        </div>
        <div style={{marginTop:4,textAlign:"center",width:NW}}>
          <div style={{fontSize:10,fontWeight:700,color:T.text,lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={node.label}>{node.label}</div>
          {node.nickname&&<div style={{fontSize:9,color:T.textMuted,fontStyle:"italic",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>"{node.nickname}"</div>}
          {(node.officers||node.enlisted)&&<div style={{fontSize:8,color:T.textDim,marginTop:1}}>{node.officers?`${node.officers}O`:""}{node.officers&&node.enlisted?"/":""}{node.enlisted?`${node.enlisted}E`:""}</div>}
        </div>
      </div>
      {hasCh&&<button onClick={e=>{e.stopPropagation();onToggle(node.id);}} style={{position:"absolute",bottom:-13,left:"50%",transform:"translateX(-50%)",background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"50%",width:13,height:13,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:T.textMuted,padding:0}}>
        {node.collapsed?<ChevronDown size={7}/>:<ChevronUp size={7}/>}
      </button>}
    </div>
  );
}


// ─── Styles ───────────────────────────────────────────────────────────────────
const IS:React.CSSProperties={background:T.bgInput,border:`1px solid ${T.border}`,borderRadius:4,color:T.text,padding:"6px 10px",fontSize:12,width:"100%",boxSizing:"border-box" as const,outline:"none"};
const BPri:React.CSSProperties={background:T.primary,border:"none",borderRadius:4,color:T.primaryFg,padding:"7px 14px",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5};
const BSec:React.CSSProperties={background:T.bgInput,border:`1px solid ${T.border}`,borderRadius:4,color:T.textMuted,padding:"7px 14px",fontSize:11,cursor:"pointer"};
const BSm:React.CSSProperties={background:T.bgInput,border:`1px solid ${T.border}`,borderRadius:4,color:T.textMuted,padding:"3px 8px",fontSize:10,cursor:"pointer"};
const IB:React.CSSProperties={background:T.bgInput,border:`1px solid ${T.border}`,borderRadius:4,color:T.textMuted,padding:"4px 6px",cursor:"pointer",display:"flex",alignItems:"center"};
const TH:React.CSSProperties={background:T.bgInput,border:`1px solid ${T.border}`,padding:"4px 8px",textAlign:"center" as const,fontWeight:700,fontSize:9,color:T.textMuted,textTransform:"uppercase" as const};
const TD:React.CSSProperties={border:`1px solid ${T.border}`,padding:"3px 6px",textAlign:"center" as const,fontSize:10};

function Fld({label,children}:{label:string;children:React.ReactNode}){
  return <div style={{display:"flex",flexDirection:"column",gap:4}}>
    <label style={{fontSize:10,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.5}}>{label}</label>
    {children}
  </div>;
}

// ─── ORBAT structure templates ────────────────────────────────────────────────
interface OrbatTemplate { label:string; build:()=>OrbatNode; }
const ORBAT_TEMPLATES:OrbatTemplate[] = [
  { label:"Infantry Section (Sect + 2 Fireteams)",
    build:()=>{ const s=defaultNode({label:"Section",unitType:"infantry",echelon:"section"}); const f1=defaultNode({label:"Alpha Team",unitType:"infantry",echelon:"fireteam"}); const f2=defaultNode({label:"Bravo Team",unitType:"infantry",echelon:"fireteam"}); s.children=[f1,f2]; return s; } },
  { label:"Infantry Platoon (Pl + 3 Sections)",
    build:()=>{ const pl=defaultNode({label:"1 Platoon",unitType:"infantry",echelon:"platoon"}); for(let i=1;i<=3;i++){const s=defaultNode({label:`${i} Section`,unitType:"infantry",echelon:"section",designation:String(i)});pl.children.push(s);}return pl; } },
  { label:"Infantry Company (Coy + 3 Platoons + Support)",
    build:()=>{ const coy=defaultNode({label:"A Company",unitType:"infantry",echelon:"company",designation:"A"}); for(let i=1;i<=3;i++){const pl=defaultNode({label:`${i} Platoon`,unitType:"infantry",echelon:"platoon",designation:String(i)});for(let j=1;j<=3;j++){pl.children.push(defaultNode({label:`${j} Section`,unitType:"infantry",echelon:"section",designation:String(j)}));}coy.children.push(pl);} coy.children.push(defaultNode({label:"Support Platoon",unitType:"weapons",echelon:"platoon"})); return coy; } },
  { label:"Armour Troop (Tp HQ + 3 MBT)",
    build:()=>{ const tp=defaultNode({label:"1 Troop",unitType:"armor",echelon:"platoon",modifier:"hq"}); for(let i=1;i<=3;i++){tp.children.push(defaultNode({label:`Callsign ${i}${i}`,unitType:"armor",echelon:"",designation:String(i)}));}return tp; } },
  { label:"Mechanised Platoon (Pl + 3 Sections in IFV)",
    build:()=>{ const pl=defaultNode({label:"1 Platoon",unitType:"mechanized",echelon:"platoon"}); for(let i=1;i<=3;i++){pl.children.push(defaultNode({label:`${i} Section`,unitType:"mechanized",echelon:"section",designation:String(i)}));}return pl; } },
  { label:"Artillery Battery (Bty HQ + 3 Guns)",
    build:()=>{ const b=defaultNode({label:"Alpha Battery",unitType:"artillery",echelon:"company",modifier:"hq"}); for(let i=1;i<=3;i++){b.children.push(defaultNode({label:`${i} Gun Sect`,unitType:"artillery",echelon:"section",designation:String(i)}));}return b; } },
  { label:"Engineer Troop (Tp + Bridging + Construction)",
    build:()=>{ const tp=defaultNode({label:"1 Engr Troop",unitType:"engineer",echelon:"platoon"}); tp.children.push(defaultNode({label:"Bridging Sect",unitType:"bridging",echelon:"section"})); tp.children.push(defaultNode({label:"Construction Sect",unitType:"construction",echelon:"section"})); return tp; } },
  { label:"Battalion HQ + 3 Companies",
    build:()=>{ const bn=defaultNode({label:"1st Battalion",unitType:"infantry",echelon:"battalion",modifier:"hq"}); ["A","B","C"].forEach(l=>{const coy=defaultNode({label:`${l} Company`,unitType:"infantry",echelon:"company",designation:l});for(let i=1;i<=3;i++){coy.children.push(defaultNode({label:`${i} Platoon`,unitType:"infantry",echelon:"platoon",designation:String(i)}));}bn.children.push(coy);});bn.children.push(defaultNode({label:"HQ Company",unitType:"hq",echelon:"company",modifier:"hq"}));return bn; } },
];

// ─── Chart templates ──────────────────────────────────────────────────────────
const CHART_TEMPLATES:Record<string,{cols:ChartColumn[];rows:WeaponEntry[]}> = {
  "Infantry Section — Weapons": {
    cols:[{id:"cmd",label:"Sect Cmd"},{id:"s1",label:"Alpha Tm"},{id:"s2",label:"Bravo Tm"},{id:"wpn",label:"Wpn Tm"}],
    rows:[{name:"Rifle (SA80/M4/HK416)",cmd:"1",s1:"4",s2:"4",wpn:"2"},{name:"LMG (Minimi/M249/L110)",cmd:"",s1:"1",s2:"1",wpn:"2"},{name:"UGL (L123/M203)",cmd:"",s1:"1",s2:"1",wpn:""},{name:"GPMG (L7/M240)",cmd:"",s1:"",s2:"",wpn:"1"},{name:"Sniper Rifle",cmd:"",s1:"",s2:"",wpn:"1"}],
  },
  "Infantry Platoon — Weapons": {
    cols:[{id:"pl",label:"Pl HQ"},{id:"s1",label:"1 Sect"},{id:"s2",label:"2 Sect"},{id:"s3",label:"3 Sect"}],
    rows:[{name:"Rifle",pl:"4",s1:"8",s2:"8",s3:"8"},{name:"LMG",pl:"",s1:"2",s2:"2",s3:"2"},{name:"GPMG",pl:"1",s1:"",s2:"",s3:""},{name:"UGL",pl:"",s1:"2",s2:"2",s3:"2"},{name:"AT Launcher (NLAW/Javelin)",pl:"1",s1:"1",s2:"1",s3:"1"}],
  },
  "Armour Troop — Vehicles": {
    cols:[{id:"hq",label:"Tp HQ"},{id:"t1",label:"1 Tk"},{id:"t2",label:"2 Tk"},{id:"t3",label:"3 Tk"}],
    rows:[{name:"MBT (Challenger 2 / M1 Abrams)",hq:"1",t1:"1",t2:"1",t3:"1"},{name:"ARV",hq:"1",t1:"",t2:"",t3:""},{name:"CRARRV",hq:"",t1:"",t2:"",t3:""}],
  },
  "Mechanised Platoon — Vehicles": {
    cols:[{id:"pl",label:"Pl HQ"},{id:"s1",label:"1 Sect"},{id:"s2",label:"2 Sect"},{id:"s3",label:"3 Sect"}],
    rows:[{name:"IFV (Warrior / Bradley / CV90)",pl:"1",s1:"1",s2:"1",s3:"1"},{name:"Riflemen (dismount)",pl:"3",s1:"6",s2:"6",s3:"6"},{name:"LMG",pl:"",s1:"1",s2:"1",s3:"1"},{name:"ATGM",pl:"",s1:"1",s2:"1",s3:"1"}],
  },
  "Artillery Battery — Equipment": {
    cols:[{id:"hq",label:"Bty HQ"},{id:"g1",label:"No.1 Gun"},{id:"g2",label:"No.2 Gun"},{id:"g3",label:"No.3 Gun"}],
    rows:[{name:"Howitzer (AS90 / M109)",hq:"",g1:"2",g2:"2",g3:"2"},{name:"FDC Vehicle",hq:"1",g1:"",g2:"",g3:""},{name:"Ammo Carrier",hq:"1",g1:"1",g2:"1",g3:"1"},{name:"MET/Survey",hq:"1",g1:"",g2:"",g3:""}],
  },
  "Recce / Cavalry — Vehicles": {
    cols:[{id:"hq",label:"Sqn HQ"},{id:"t1",label:"1 Tp"},{id:"t2",label:"2 Tp"},{id:"t3",label:"3 Tp"}],
    rows:[{name:"Recce Vehicle (Jackal / LRSOV)",hq:"2",t1:"4",t2:"4",t3:"4"},{name:"WMIK / GPMG Mount",hq:"1",t1:"2",t2:"2",t3:"2"}],
  },
};

function ChartBuilder({title,rows,cols,onR,onC}:{title:string;rows:WeaponEntry[];cols:ChartColumn[];onR:(r:WeaponEntry[])=>void;onC:(c:ChartColumn[])=>void;}){
  const addC=()=>{const id=generateId();onC([...cols,{id,label:"Unit"}]);};
  const remC=(id:string)=>onC(cols.filter(c=>c.id!==id));
  const upCL=(id:string,l:string)=>onC(cols.map(c=>c.id===id?{...c,label:l}:c));
  const addR=()=>{const r:WeaponEntry={name:"New Item"};cols.forEach(c=>{r[c.id]="";});onR([...rows,r]);};
  const remR=(i:number)=>onR(rows.filter((_,idx)=>idx!==i));
  const upCell=(ri:number,k:string,v:string)=>onR(rows.map((r,i)=>i===ri?{...r,[k]:v}:r));
  return(
    <div style={{marginTop:12}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:11,fontWeight:700,color:T.text,textTransform:"uppercase",letterSpacing:1}}>{title}</span>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <select onChange={e=>{if(!e.target.value)return;const tpl=CHART_TEMPLATES[e.target.value];if(tpl){onC(tpl.cols);onR(tpl.rows);}e.target.value="";}} style={{...IS,fontSize:10,padding:"2px 6px",width:"auto"}}>
            <option value="">Load template…</option>
            {Object.keys(CHART_TEMPLATES).map(k=><option key={k} value={k}>{k}</option>)}
          </select>
          <button onClick={addC} style={BSm}>+ Col</button>
          <button onClick={addR} style={BSm}>+ Row</button>
        </div>
      </div>
      {cols.length===0?(
        <div style={{color:T.textMuted,fontSize:11,padding:"12px 0",textAlign:"center",border:`1px dashed ${T.border}`,borderRadius:4}}>No columns — add one or load a template</div>
      ):(
        <div style={{overflowX:"auto"}}>
          <table style={{borderCollapse:"collapse",fontSize:10,color:T.text,width:"100%"}}>
            <thead><tr>
              <th style={{...TH,textAlign:"left" as const,minWidth:130}}>Equipment / Item</th>
              {cols.map(c=><th key={c.id} style={{...TH,minWidth:70}}>
                <div style={{display:"flex",alignItems:"center",gap:3}}>
                  <input value={c.label} onChange={e=>upCL(c.id,e.target.value)} style={{background:"transparent",border:"none",color:T.text,fontSize:10,fontWeight:700,width:55,textAlign:"center"}}/>
                  <button onClick={()=>remC(c.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.danger,padding:0,lineHeight:1}}>×</button>
                </div>
              </th>)}
              <th style={TH}></th>
            </tr></thead>
            <tbody>{rows.map((row,i)=>(
              <tr key={i} style={{background:i%2===0?"rgba(255,255,255,0.02)":undefined}}>
                <td style={{...TD,textAlign:"left" as const}}><input value={row.name} onChange={e=>upCell(i,"name",e.target.value)} style={{background:"transparent",border:"none",color:T.text,fontSize:10,width:"100%"}}/></td>
                {cols.map(c=><td key={c.id} style={TD}><input value={String(row[c.id]??"")} onChange={e=>upCell(i,c.id,e.target.value)} style={{background:"transparent",border:"none",color:T.text,fontSize:10,width:50,textAlign:"center"}}/></td>)}
                <td style={TD}><button onClick={()=>remR(i)} style={{background:"none",border:"none",cursor:"pointer",color:T.danger,fontSize:12}}>×</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// ─── Node Editor ──────────────────────────────────────────────────────────────
function NodeEditor({node,roster,onSave,onClose}:{node:OrbatNode;roster:any[];onSave:(n:OrbatNode)=>void;onClose:()=>void;}){
  const [d,setD]=useState<OrbatNode>({...node,rosterSlots:node.rosterSlots||[]});
  const [tab,setTab]=useState<"unit"|"symbol"|"slots"|"charts">("unit");
  const [symCat,setSymCat]=useState(SYM_BY_ID[node.unitType]?.cat||"Infantry");
  function s<K extends keyof OrbatNode>(k:K,v:OrbatNode[K]){setD(p=>({...p,[k]:v}));}
  const togSlot=(uid:string)=>{const sl=d.rosterSlots||[];s("rosterSlots",sl.includes(uid)?sl.filter(x=>x!==uid):[...sl,uid]);};

  return(
    <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,width:580,maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.8)"}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${T.border}`,background:T.bgPanel}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <UnitIcon type={d.unitType} affiliation={d.affiliation} size={30} fillColor={d.fillColor} flagCode={d.flagCode}/>
            <span style={{fontSize:13,fontWeight:700,color:T.text,textTransform:"uppercase",letterSpacing:1}}>{d.label||"Edit Unit"}</span>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:T.textMuted}}><X size={16}/></button>
        </div>
        {/* Tabs */}
        <div style={{display:"flex",borderBottom:`1px solid ${T.border}`}}>
          {([{id:"unit",label:"Unit",icon:<Edit3 size={11}/>},{id:"symbol",label:"Symbol",icon:<Flag size={11}/>},{id:"slots",label:`Slots${d.rosterSlots?.length?` (${d.rosterSlots.length})`:""}`,icon:<Users size={11}/>},{id:"charts",label:"Charts",icon:<Table2 size={11}/>}] as const).map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"8px 0",background:tab===t.id?T.bgInput:"transparent",border:"none",borderBottom:tab===t.id?`2px solid ${T.primary}`:"2px solid transparent",color:tab===t.id?T.text:T.textMuted,cursor:"pointer",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        {/* Body */}
        <div style={{flex:1,overflowY:"auto",padding:16}}>
          {tab==="unit"&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <Fld label="Unit Label"><input value={d.label} onChange={e=>s("label",e.target.value)} style={IS}/></Fld>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Fld label="Nickname / Callsign"><input value={d.nickname||""} onChange={e=>s("nickname",e.target.value)} style={IS} placeholder='e.g. "Attack"'/></Fld>
                <Fld label="Designation"><input value={d.designation||""} onChange={e=>s("designation",e.target.value)} style={IS} placeholder="A, 1, 28"/></Fld>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Fld label="Affiliation"><select value={d.affiliation} onChange={e=>s("affiliation",e.target.value as Affiliation)} style={IS}>{AFF_OPTS.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></Fld>
                <Fld label="Echelon"><select value={d.echelon} onChange={e=>s("echelon",e.target.value as Echelon)} style={IS}>{ECHELON_OPTS.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></Fld>
              </div>
              <Fld label="Modifier"><select value={d.modifier} onChange={e=>s("modifier",e.target.value as TaskForceModifier)} style={IS}>{MOD_OPTS.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></Fld>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Fld label="Officers"><input type="number" value={d.officers??""} onChange={e=>s("officers",e.target.value?+e.target.value:undefined)} style={IS} min={0}/></Fld>
                <Fld label="Enlisted / OR"><input type="number" value={d.enlisted??""} onChange={e=>s("enlisted",e.target.value?+e.target.value:undefined)} style={IS} min={0}/></Fld>
              </div>
              <Fld label="Unit Notes"><textarea value={d.description||""} onChange={e=>s("description",e.target.value)} rows={4} style={{...IS,resize:"vertical" as const}} placeholder="Role, equipment, tactics..."/></Fld>
            </div>
          )}
          {tab==="symbol"&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <Fld label="Category">
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {SYM_CATS.map(cat=><button key={cat} onClick={()=>setSymCat(cat)} style={{padding:"4px 10px",borderRadius:4,fontSize:11,fontWeight:600,cursor:"pointer",background:symCat===cat?T.bgInput:"transparent",border:`1px solid ${symCat===cat?T.primary:T.border}`,color:symCat===cat?T.text:T.textMuted}}>{cat}</button>)}
                </div>
              </Fld>
              <Fld label="Symbol">
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,maxHeight:240,overflowY:"auto"}}>
                  {SYMS.filter(x=>x.cat===symCat).map(sym=>(
                    <div key={sym.id} onClick={()=>s("unitType",sym.id)} title={sym.label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 4px",borderRadius:4,cursor:"pointer",background:d.unitType===sym.id?T.bgInput:"transparent",border:`1px solid ${d.unitType===sym.id?T.primary:T.border}`}}>
                      <UnitIcon type={sym.id} affiliation={d.affiliation} size={28} fillColor={d.fillColor}/>
                      <span style={{fontSize:8,color:T.textMuted,textAlign:"center",lineHeight:1.2}}>{sym.label}</span>
                    </div>
                  ))}
                </div>
              </Fld>
              <Fld label="Custom Fill Colour">
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input type="color" value={d.fillColor||AFF[d.affiliation].fill} onChange={e=>s("fillColor",e.target.value)} style={{width:36,height:32,borderRadius:4,border:`1px solid ${T.border}`,cursor:"pointer",background:"none"}}/>
                  {d.fillColor&&<button onClick={()=>s("fillColor",undefined)} style={BSm}>Reset</button>}
                </div>
              </Fld>
              <Fld label="Flag Background">
                <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6,maxHeight:180,overflowY:"auto"}}>
                  <div onClick={()=>s("flagCode",undefined)} style={{padding:4,borderRadius:4,cursor:"pointer",textAlign:"center",background:!d.flagCode?T.bgInput:"transparent",border:`1px solid ${!d.flagCode?T.primary:T.border}`,color:T.textMuted,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",minHeight:32}}>None</div>
                  {FLAGS.map(f=>(
                    <div key={f.code} onClick={()=>s("flagCode",f.code)} title={f.label} style={{padding:2,borderRadius:4,cursor:"pointer",background:d.flagCode===f.code?T.bgInput:"transparent",border:`1px solid ${d.flagCode===f.code?T.primary:T.border}`}}>
                      <img src={flagUrl(f.code)} alt={f.label} style={{width:"100%",height:18,objectFit:"cover",borderRadius:2,display:"block"}}/>
                      <div style={{fontSize:7,color:T.textMuted,textAlign:"center",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.label}</div>
                    </div>
                  ))}
                </div>
              </Fld>
            </div>
          )}
          {tab==="slots"&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontSize:11,color:T.textMuted}}>Select roster members assigned to this unit.</div>
              {roster.length===0?(
                <div style={{color:T.textMuted,fontSize:11,padding:16,textAlign:"center",border:`1px dashed ${T.border}`,borderRadius:4}}>No roster members found</div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:320,overflowY:"auto"}}>
                  {roster.map((m:any)=>{
                    const uid=m.user_id||m.id;const sel=(d.rosterSlots||[]).includes(uid);
                    return <div key={uid} onClick={()=>togSlot(uid)} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",borderRadius:4,cursor:"pointer",background:sel?T.bgInput:"transparent",border:`1px solid ${sel?T.primary:T.border}`}}>
                      <div style={{width:16,height:16,borderRadius:3,background:sel?T.primary:"transparent",border:`1px solid ${sel?T.primary:T.textMuted}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {sel&&<span style={{color:T.primaryFg,fontSize:10,fontWeight:700}}>✓</span>}
                      </div>
                      <div><div style={{fontSize:11,fontWeight:600,color:T.text}}>{m.callsign||"Unknown"}</div>{m.rank_id&&<div style={{fontSize:9,color:T.textMuted}}>{m.rank_id}</div>}</div>
                    </div>;
                  })}
                </div>
              )}
            </div>
          )}
          {tab==="charts"&&(
            <div>
              <ChartBuilder title="Weapons Chart" rows={d.weaponsChart||[]} cols={d.weaponsCols||[]} onR={r=>s("weaponsChart",r)} onC={c=>s("weaponsCols",c)}/>
              <div style={{height:1,background:T.border,margin:"20px 0"}}/>
              <ChartBuilder title="Vehicles Chart" rows={d.vehiclesChart||[]} cols={d.vehiclesCols||[]} onR={r=>s("vehiclesChart",r)} onC={c=>s("vehiclesCols",c)}/>
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,padding:"12px 16px",borderTop:`1px solid ${T.border}`,background:T.bgPanel}}>
          <button onClick={onClose} style={BSec}>Cancel</button>
          <button onClick={()=>{onSave(d);onClose();}} style={BPri}><Save size={12}/> Save Unit</button>
        </div>
      </div>
    </div>
  );
}


// ─── Canvas ───────────────────────────────────────────────────────────────────
function OrbatCanvas({roots,onEdit,onAdd,onDel,onDup,onToggle,ro}:{
  roots:OrbatNode[];onEdit:(n:OrbatNode)=>void;onAdd:(id:string)=>void;
  onDel:(id:string)=>void;onDup:(n:OrbatNode)=>void;onToggle:(id:string)=>void;ro:boolean;
}){
  let all:LN[]=[],ox=0;
  for(const r of roots){all.push(...layout(r,ox,0));ox+=lc(r)*(NW+HG)+TS;}
  const es=edges(all);
  let mx=0,my=0;for(const n of all){if(n.x+NW/2>mx)mx=n.x+NW/2;if(n.y+NH>my)my=n.y+NH;}
  const W=Math.max(ox,300),H=Math.max(my+80,200);
  return(
    <div style={{position:"relative",width:W,height:H}}>
      <svg style={{position:"absolute",inset:0,overflow:"visible",pointerEvents:"none"}} width={W} height={H}>
        {es.map((e,i)=><line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={T.border} strokeWidth={1.5}/>)}
      </svg>
      {all.map(ln=><UnitCard key={ln.node.id} ln={ln} onEdit={onEdit} onAdd={onAdd} onDel={onDel} onDup={onDup} onToggle={onToggle} ro={ro}/>)}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
interface OrbatBuilderProps {
  initialData?:OrbatNode[];onSave?:(n:OrbatNode[])=>void;
  value?:string;onChange?:(j:string)=>void;
  groupName?:string;roster?:any[];readOnly?:boolean;
}

export default function OrbatBuilder({initialData,onSave,value,onChange,roster=[],readOnly=false}:OrbatBuilderProps){
  const [nodes,setNodes]=useState<OrbatNode[]>(()=>{
    if(initialData&&initialData.length>0)return initialData;
    if(value){try{const p=JSON.parse(value);if(Array.isArray(p)&&p.length>0)return p;}catch{}}
    return[];
  });
  const [editing,setEditing]=useState<OrbatNode|null>(null);
  const [zoom,setZoom]=useState(1);
  const [init,setInit]=useState(false);

  useEffect(()=>{
    if(!init&&value){try{const p=JSON.parse(value);if(Array.isArray(p)&&p.length>0)setNodes(p);}catch{}setInit(true);}
    else if(!init&&value==="")setInit(true);
  },[value,init]);

  const mounted=useRef(false);
  useEffect(()=>{if(!mounted.current){mounted.current=true;return;}if(onChange)onChange(JSON.stringify(nodes));},[nodes]);

  function upd(t:OrbatNode[],id:string,u:Partial<OrbatNode>):OrbatNode[]{return t.map(n=>n.id===id?{...n,...u}:{...n,children:upd(n.children,id,u)});}
  function del(t:OrbatNode[],id:string):OrbatNode[]{return t.filter(n=>n.id!==id).map(n=>({...n,children:del(n.children,id)}));}
  function addC(t:OrbatNode[],pid:string,c:OrbatNode):OrbatNode[]{return t.map(n=>n.id===pid?{...n,children:[...n.children,c]}:{...n,children:addC(n.children,pid,c)});}
  function rep(t:OrbatNode[],id:string,u:OrbatNode):OrbatNode[]{return t.map(n=>n.id===id?u:{...n,children:rep(n.children,id,u)});}
  function find(t:OrbatNode[],id:string):OrbatNode|undefined{for(const n of t){if(n.id===id)return n;const f=find(n.children,id);if(f)return f;}}
  function dc(n:OrbatNode):OrbatNode{return{...n,id:generateId(),label:n.label+" (copy)",children:n.children.map(dc)};}
  function flat(t:OrbatNode[]):OrbatNode[]{return t.flatMap(n=>[n,...flat(n.children)]);}

  const addChild=(pid:string)=>{const c=defaultNode({echelon:"section"});setNodes(p=>addC(p,pid,c));setEditing(c);};
  const addRoot=()=>{const n=defaultNode({echelon:"company"});setNodes(p=>[...p,n]);setEditing(n);};
  const saveEdit=(u:OrbatNode)=>{setNodes(p=>JSON.stringify(p).includes(`"id":"${u.id}"`)?rep(p,u.id,u):[...p,u]);};
  const doExport=()=>{const b=new Blob([JSON.stringify(nodes,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="orbat.json";a.click();};

  const allNodes=flat(nodes);

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:T.bg,border:`1px solid ${T.border}`,borderRadius:6,overflow:"hidden",fontFamily:"Arial,sans-serif"}}>
      {/* Toolbar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 16px",borderBottom:`1px solid ${T.border}`,background:T.bgPanel,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:11,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:2}}>ORBAT</span>
          <span style={{fontSize:9,background:"rgba(255,255,255,0.06)",color:T.textMuted,border:`1px solid ${T.border}`,borderRadius:3,padding:"1px 6px",fontWeight:700,letterSpacing:1}}>NATO APP-6</span>
          {!readOnly&&(
            <select onChange={e=>{if(!e.target.value)return;const t=ORBAT_TEMPLATES.find(x=>x.label===e.target.value);if(t){setNodes(p=>[...p,t.build()]);}e.target.value="";}} style={{...IS,fontSize:10,padding:"2px 8px",width:"auto",marginLeft:8}}>
              <option value="">+ Structure template…</option>
              {ORBAT_TEMPLATES.map(t=><option key={t.label} value={t.label}>{t.label}</option>)}
            </select>
          )}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <button onClick={()=>setZoom(z=>Math.max(0.3,+(z-0.1).toFixed(1)))} style={IB}><ZoomOut size={13}/></button>
          <span style={{fontSize:11,color:T.textMuted,fontFamily:"monospace",width:36,textAlign:"center"}}>{Math.round(zoom*100)}%</span>
          <button onClick={()=>setZoom(z=>Math.min(2.5,+(z+0.1).toFixed(1)))} style={IB}><ZoomIn size={13}/></button>
          <div style={{width:1,height:16,background:T.border,margin:"0 4px"}}/>
          <button onClick={doExport} style={IB} title="Export JSON"><Download size={13}/></button>
          {!readOnly&&onSave&&<button onClick={()=>onSave(nodes)} style={BPri}><Save size={11}/> Save</button>}
        </div>
      </div>
      {/* Canvas */}
      <div style={{flex:1,overflow:"auto",padding:24}}>
        {nodes.length===0?(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:16,textAlign:"center"}}>
            <div style={{opacity:0.2}}><UnitIcon type="infantry" affiliation="friendly" size={56}/></div>
            <p style={{color:T.textMuted,fontSize:13,margin:0}}>No units yet. Add a root unit or load a template above.</p>
            {!readOnly&&<button onClick={addRoot} style={{...BPri,fontSize:13,padding:"10px 24px"}}><Plus size={14}/> Add Root Unit</button>}
          </div>
        ):(
          <div>
            <div style={{transform:`scale(${zoom})`,transformOrigin:"top left",display:"inline-block"}}>
              <OrbatCanvas roots={nodes} onEdit={setEditing} onAdd={addChild}
                onDel={id=>setNodes(p=>del(p,id))} onDup={n=>setNodes(p=>[...p,dc(n)])}
                onToggle={id=>setNodes(p=>upd(p,id,{collapsed:!find(p,id)?.collapsed}))}
                ro={readOnly}/>
            </div>
            {/* Charts */}
            {allNodes.some(n=>n.weaponsChart&&n.weaponsChart.length>0)&&(
              <div style={{marginTop:24,background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:6,padding:16}}>
                {allNodes.filter(n=>n.weaponsChart&&n.weaponsChart.length>0).map(n=>(
                  <div key={n.id} style={{marginBottom:16}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.text,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{n.label} — Weapons</div>
                    <table style={{borderCollapse:"collapse",fontSize:10,color:T.text}}>
                      <thead><tr><th style={{...TH,textAlign:"left" as const,minWidth:140}}>Equipment</th>{(n.weaponsCols||[]).map(c=><th key={c.id} style={{...TH,minWidth:60}}>{c.label}</th>)}</tr></thead>
                      <tbody>{(n.weaponsChart||[]).map((row,i)=>(
                        <tr key={i} style={{background:i%2===0?"rgba(255,255,255,0.02)":undefined}}>
                          <td style={{...TD,textAlign:"left" as const,fontWeight:600}}>{row.name}</td>
                          {(n.weaponsCols||[]).map(c=><td key={c.id} style={TD}>{row[c.id]??"—"}</td>)}
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
            {allNodes.some(n=>n.vehiclesChart&&n.vehiclesChart.length>0)&&(
              <div style={{marginTop:16,background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:6,padding:16}}>
                {allNodes.filter(n=>n.vehiclesChart&&n.vehiclesChart.length>0).map(n=>(
                  <div key={n.id} style={{marginBottom:16}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.text,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{n.label} — Vehicles</div>
                    <table style={{borderCollapse:"collapse",fontSize:10,color:T.text}}>
                      <thead><tr><th style={{...TH,textAlign:"left" as const,minWidth:140}}>Vehicle</th>{(n.vehiclesCols||[]).map(c=><th key={c.id} style={{...TH,minWidth:60}}>{c.label}</th>)}</tr></thead>
                      <tbody>{(n.vehiclesChart||[]).map((row,i)=>(
                        <tr key={i} style={{background:i%2===0?"rgba(255,255,255,0.02)":undefined}}>
                          <td style={{...TD,textAlign:"left" as const,fontWeight:600}}>{row.name}</td>
                          {(n.vehiclesCols||[]).map(c=><td key={c.id} style={TD}>{row[c.id]??"—"}</td>)}
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
      {editing&&<NodeEditor node={editing} roster={roster} onSave={saveEdit} onClose={()=>setEditing(null)}/>}
      {!readOnly&&nodes.length>0&&(
        <div style={{borderTop:`1px solid ${T.border}`,padding:"8px 16px",background:T.bgPanel,flexShrink:0}}>
          <button onClick={addRoot} style={{...BSec,display:"flex",alignItems:"center",gap:5,fontSize:11}}><Plus size={12}/> Add Root Unit</button>
        </div>
      )}
    </div>
  );
}
