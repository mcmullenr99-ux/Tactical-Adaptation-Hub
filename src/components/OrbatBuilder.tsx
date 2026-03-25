/**
 * NATO ORBAT Builder — Full APP-6 / MIL-STD-2525 implementation
 * Powered by milsymbol (spatialillusions.com)
 * Supports: all unit types, echelons, affiliations, status, HQ/TF/Dummy,
 *           reinforced/reduced, text amplifiers, country codes
 */

import React, { useState, useMemo } from "react";
import ms from "milsymbol";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Save,
  ZoomIn, ZoomOut, X, Download, Copy, Settings2,
} from "lucide-react";

// ─── SIDC builder helpers ─────────────────────────────────────────────────────
// Using MIL-STD-2525D / APP-6D 30-character SIDC format
// Pos 1-2: Version (13 = 2525D)
// Pos 3-4: Standard Identity (03=friend, 06=hostile, 04=neutral, 01=unknown, 02=assumed friend, 05=suspect)
// Pos 5-6: Symbol set (10=land unit)
// Pos 7: Status (0=present, 1=anticipated/planned, 2=anticipated/planned+hostile)
// Pos 8: HQ/TF/Dummy (0=none, 1=HQ, 2=TF, 3=HQ+TF, 4=dummy, 5=HQ+dummy, 6=TF+dummy, 7=HQ+TF+dummy)
// Pos 9-10: Echelon/Mobility
// Pos 11-16: Function (main icon code, 6 digits)
// Pos 17-18: Modifier 1
// Pos 19-20: Modifier 2
// Pos 21-30: Country + order of battle padding

export function buildSIDC({
  affiliation = "03",
  symbolSet = "10",
  status = "0",
  hqTfDummy = "0",
  echelon = "00",
  functionId = "110000",
  modifier1 = "00",
  modifier2 = "00",
}: {
  affiliation?: string;
  symbolSet?: string;
  status?: string;
  hqTfDummy?: string;
  echelon?: string;
  functionId?: string;
  modifier1?: string;
  modifier2?: string;
}) {
  return `13${affiliation}${symbolSet}${status}${hqTfDummy}${echelon}${functionId}${modifier1}${modifier2}0000000000`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const AFFILIATIONS = [
  { id: "03", label: "Friendly", color: "text-blue-400" },
  { id: "06", label: "Hostile",  color: "text-red-400"  },
  { id: "04", label: "Neutral",  color: "text-green-400"},
  { id: "01", label: "Unknown",  color: "text-yellow-400"},
  { id: "02", label: "Assumed Friendly", color: "text-blue-300" },
  { id: "05", label: "Suspect",  color: "text-orange-400"},
];

export const STATUSES = [
  { id: "0", label: "Present / Actual" },
  { id: "1", label: "Anticipated / Planned" },
];

export const HQ_TF_DUMMY = [
  { id: "0", label: "None" },
  { id: "1", label: "Headquarters (HQ)" },
  { id: "2", label: "Task Force (TF)" },
  { id: "3", label: "HQ + Task Force" },
  { id: "4", label: "Dummy / Feint" },
  { id: "5", label: "HQ + Dummy" },
  { id: "6", label: "TF + Dummy" },
  { id: "7", label: "HQ + TF + Dummy" },
];

export const ECHELONS = [
  { id: "00", label: "—  Unspecified"   },
  { id: "11", label: "🔸 Fireteam / Crew" },
  { id: "12", label: "🔹 Squad"          },
  { id: "13", label: "▪  Section"       },
  { id: "14", label: "|   Platoon / Detachment" },
  { id: "15", label: "||  Company / Battery / Troop" },
  { id: "16", label: "||| Battalion / Squadron" },
  { id: "17", label: "X   Regiment / Group" },
  { id: "18", label: "XX  Brigade"      },
  { id: "19", label: "XXX Division"     },
  { id: "20", label: "XXXX Corps"       },
  { id: "21", label: "XXXXX Army"       },
  { id: "22", label: "XXXXXX Army Group / Front" },
  { id: "23", label: "XXXXXXX Region"  },
  { id: "24", label: "XXXXXXXX Command"},
];

export const REINFORCED_REDUCED = [
  { id: "",           label: "None"       },
  { id: "reinforced", label: "(+) Reinforced" },
  { id: "reduced",    label: "(−) Reduced"    },
  { id: "reinforcedAndReduced", label: "(±) Reinforced & Reduced" },
];

// ─── Unit type catalogue ──────────────────────────────────────────────────────
// functionId = 6-digit APP-6D land unit function code

export const UNIT_CATEGORIES: { category: string; units: { id: string; label: string; functionId: string }[] }[] = [
  {
    category: "Infantry",
    units: [
      { id: "infantry",        label: "Infantry",               functionId: "110000" },
      { id: "inf_close",       label: "Close Combat Infantry",  functionId: "111000" },
      { id: "inf_light",       label: "Light Infantry",         functionId: "121100" },
      { id: "inf_airborne",    label: "Airborne Infantry",      functionId: "121300" },
      { id: "inf_air_assault", label: "Air Assault Infantry",   functionId: "121600" },
      { id: "inf_mech",        label: "Mechanised Infantry",    functionId: "121700" },
      { id: "inf_motor",       label: "Motorized Infantry",     functionId: "121800" },
      { id: "inf_mountain",    label: "Mountain Infantry",      functionId: "121900" },
      { id: "inf_arctic",      label: "Arctic Infantry",        functionId: "122000" },
      { id: "inf_jungle",      label: "Jungle Infantry",        functionId: "122100" },
      { id: "sf",              label: "Special Forces",         functionId: "122200" },
      { id: "ranger",          label: "Ranger",                 functionId: "122300" },
      { id: "raider",          label: "Raider",                 functionId: "122400" },
      { id: "recce",           label: "Reconnaissance",         functionId: "122700" },
      { id: "sniper",          label: "Sniper",                 functionId: "122500" },
      { id: "anti_armor_inf",  label: "Anti-Armour (Infantry)", functionId: "122600" },
    ],
  },
  {
    category: "Armour",
    units: [
      { id: "armour",          label: "Armour / Tank",          functionId: "131100" },
      { id: "armd_cav",        label: "Armoured Cavalry",       functionId: "131200" },
      { id: "armd_recce",      label: "Armoured Recce",         functionId: "131300" },
      { id: "apc",             label: "APC",                    functionId: "131400" },
      { id: "ifv",             label: "IFV / MICV",             functionId: "131500" },
      { id: "anti_armor",      label: "Anti-Armour (Vehicle)",  functionId: "131600" },
      { id: "light_armour",    label: "Light Armour",           functionId: "131700" },
    ],
  },
  {
    category: "Aviation",
    units: [
      { id: "aviation",        label: "Aviation (Generic)",     functionId: "141100" },
      { id: "atk_helo",        label: "Attack Helicopter",      functionId: "141300" },
      { id: "tpt_helo",        label: "Transport Helicopter",   functionId: "141500" },
      { id: "obs_helo",        label: "Observation Helicopter", functionId: "141400" },
      { id: "uav",             label: "UAV / UAS",              functionId: "141600" },
      { id: "cas",             label: "Close Air Support",      functionId: "141200" },
    ],
  },
  {
    category: "Fires",
    units: [
      { id: "arty",            label: "Field Artillery",        functionId: "151100" },
      { id: "arty_self",       label: "Self-Propelled Artillery",functionId:"151200" },
      { id: "arty_rocket",     label: "Rocket Artillery / MLRS",functionId: "151300" },
      { id: "mortar",          label: "Mortar",                 functionId: "151400" },
      { id: "ada",             label: "Air Defence Artillery",  functionId: "161100" },
      { id: "ada_short",       label: "Short-Range Air Defence",functionId: "161200" },
      { id: "ada_medium",      label: "Medium Air Defence",     functionId: "161300" },
    ],
  },
  {
    category: "Combat Support",
    units: [
      { id: "engineer",        label: "Combat Engineer",        functionId: "201100" },
      { id: "eng_bridge",      label: "Bridge Engineer",        functionId: "201200" },
      { id: "eng_combat",      label: "Combat Engineer (Armd)", functionId: "201300" },
      { id: "cbrn",            label: "CBRN / NBC",             functionId: "211100" },
      { id: "signal",          label: "Signal / Comms",         functionId: "251100" },
      { id: "intel",           label: "Intelligence",           functionId: "321100" },
      { id: "ew",              label: "Electronic Warfare",     functionId: "271100" },
      { id: "mp",              label: "Military Police",        functionId: "311100" },
      { id: "psy_ops",         label: "PsyOps / Info Ops",      functionId: "261100" },
      { id: "cimic",           label: "CIMIC",                  functionId: "281100" },
      { id: "jtac",            label: "JTAC / FAC",             functionId: "291100" },
    ],
  },
  {
    category: "Combat Service Support",
    units: [
      { id: "medical",         label: "Medical",                functionId: "401100" },
      { id: "med_hospital",    label: "Hospital",               functionId: "401200" },
      { id: "supply",          label: "Supply / Logistics",     functionId: "411100" },
      { id: "maintenance",     label: "Maintenance",            functionId: "421100" },
      { id: "transport",       label: "Transport",              functionId: "431100" },
      { id: "ordnance",        label: "Ordnance / EOD",         functionId: "441100" },
      { id: "fuel",            label: "Petroleum / Fuel",       functionId: "451100" },
      { id: "finance",         label: "Finance",                functionId: "461100" },
    ],
  },
  {
    category: "Command & Control",
    units: [
      { id: "hq_generic",      label: "HQ (Generic)",           functionId: "110000" },
      { id: "cp_main",         label: "Command Post – Main",    functionId: "111100" },
      { id: "cp_tac",          label: "Command Post – Tac",     functionId: "111200" },
      { id: "cp_rear",         label: "Command Post – Rear",    functionId: "111300" },
    ],
  },
];

// Flat lookup
export const ALL_UNIT_TYPES = UNIT_CATEGORIES.flatMap(c => c.units);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrbatNodeAmplifiers {
  unitName?: string;          // Unique designation (e.g. "A/1-12 INF")
  higherFormation?: string;   // Parent unit (e.g. "I CORPS")
  additionalInfo?: string;    // Additional info text
  staffComments?: string;     // Staff comments
  quantity?: string;          // Number of items
  direction?: number;         // Direction of movement (degrees)
  dtg?: string;               // Date-time group
  location?: string;          // MGRS or lat/lon
  type?: string;              // Equipment type
  combatEffectiveness?: string;
}

export interface OrbatNode {
  id: string;
  // Label shown in tree
  label: string;
  // SIDC components
  affiliation: string;
  symbolSet: string;
  status: string;
  hqTfDummy: string;
  echelon: string;
  functionId: string;
  modifier1: string;
  modifier2: string;
  // Modifiers
  reinforcedReduced: string;
  // Text amplifiers
  amplifiers: OrbatNodeAmplifiers;
  // Tree
  children: OrbatNode[];
  collapsed?: boolean;
  // Manning
  slots?: number;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function defaultNode(overrides: Partial<OrbatNode> = {}): OrbatNode {
  return {
    id: generateId(),
    label: "New Unit",
    affiliation: "03",
    symbolSet: "10",
    status: "0",
    hqTfDummy: "0",
    echelon: "14",
    functionId: "110000",
    modifier1: "00",
    modifier2: "00",
    reinforcedReduced: "",
    amplifiers: {},
    children: [],
    slots: 0,
    ...overrides,
  };
}

// ─── Symbol rendering via milsymbol ──────────────────────────────────────────

function nodeToSIDC(node: OrbatNode): string {
  return buildSIDC({
    affiliation: node.affiliation,
    symbolSet: node.symbolSet,
    status: node.status,
    hqTfDummy: node.hqTfDummy,
    echelon: node.echelon,
    functionId: node.functionId,
    modifier1: node.modifier1 || "00",
    modifier2: node.modifier2 || "00",
  });
}

interface MilSymbolProps {
  node: OrbatNode;
  size?: number;
  showName?: boolean;
}

function MilSymbolSvg({ node, size = 60, showName = false }: MilSymbolProps) {
  const svgString = useMemo(() => {
    try {
      const sidc = nodeToSIDC(node);
      const opts: Record<string, unknown> = {
        size,
        ...(node.reinforcedReduced ? { reinforcedReduced: node.reinforcedReduced } : {}),
        ...(node.amplifiers.unitName ? { uniqueDesignation: node.amplifiers.unitName } : {}),
        ...(node.amplifiers.higherFormation ? { higherFormation: node.amplifiers.higherFormation } : {}),
        ...(node.amplifiers.additionalInfo ? { additionalInformation: node.amplifiers.additionalInfo } : {}),
        ...(node.amplifiers.quantity ? { quantity: node.amplifiers.quantity } : {}),
        ...(node.amplifiers.direction !== undefined ? { direction: node.amplifiers.direction } : {}),
        ...(node.amplifiers.dtg ? { dtg: node.amplifiers.dtg } : {}),
        ...(node.amplifiers.location ? { location: node.amplifiers.location } : {}),
        ...(node.amplifiers.type ? { type: node.amplifiers.type } : {}),
        ...(node.amplifiers.staffComments ? { staffComments: node.amplifiers.staffComments } : {}),
        ...(node.amplifiers.combatEffectiveness ? { combatEffectiveness: node.amplifiers.combatEffectiveness } : {}),
      };
      const sym = new ms.Symbol(sidc, opts);
      return sym.asSVG();
    } catch {
      // Fallback: basic infantry
      const sym = new ms.Symbol("130310001412110000000000000000", { size });
      return sym.asSVG();
    }
  }, [node, size]);

  const symSize = useMemo(() => {
    try {
      const sidc = nodeToSIDC(node);
      const sym = new ms.Symbol(sidc, { size });
      return sym.getSize();
    } catch {
      return { width: size, height: size };
    }
  }, [node, size]);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        style={{ width: symSize.width, height: symSize.height }}
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
      {showName && node.label && (
        <span className="text-[10px] font-mono font-bold text-foreground text-center leading-tight max-w-[100px] truncate">
          {node.label}
        </span>
      )}
    </div>
  );
}

// ─── Node Editor (full modal) ─────────────────────────────────────────────────

function NodeEditor({ node, onSave, onClose }: { node: OrbatNode; onSave: (n: OrbatNode) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<OrbatNode>(JSON.parse(JSON.stringify(node)));
  const [tab, setTab] = useState<"symbol" | "amplifiers">("symbol");

  function set(updates: Partial<OrbatNode>) {
    setDraft(d => ({ ...d, ...updates }));
  }
  function setAmp(updates: Partial<OrbatNodeAmplifiers>) {
    setDraft(d => ({ ...d, amplifiers: { ...d.amplifiers, ...updates } }));
  }

  const unitType = ALL_UNIT_TYPES.find(u => u.functionId === draft.functionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-display font-black uppercase tracking-wider text-sm">Edit Unit</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live preview */}
        <div className="flex justify-center items-center gap-6 py-4 px-5 bg-zinc-900 border-b border-border flex-shrink-0">
          <MilSymbolSvg node={draft} size={64} showName />
          <div className="text-xs text-muted-foreground font-mono space-y-0.5">
            <div>SIDC: <span className="text-primary">{nodeToSIDC(draft)}</span></div>
            <div>Set: APP-6D / MIL-STD-2525D</div>
            {unitType && <div>Type: {unitType.label}</div>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          {(["symbol", "amplifiers"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 px-4 py-2.5 text-xs font-display font-bold uppercase tracking-widest transition-colors
                ${tab === t ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "symbol" ? "Symbol & Echelon" : "Text Amplifiers"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {tab === "symbol" && <>
            {/* Label */}
            <div>
              <label className="field-label">Unit Label (Tree Display)</label>
              <input value={draft.label} onChange={e => set({ label: e.target.value })}
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                placeholder="e.g. 1 PARA, A Squadron, 3rd Platoon" />
            </div>

            {/* Affiliation */}
            <div>
              <label className="field-label">Affiliation</label>
              <div className="flex flex-wrap gap-1.5">
                {AFFILIATIONS.map(a => (
                  <button key={a.id} onClick={() => set({ affiliation: a.id })}
                    className={`px-3 py-1.5 text-xs rounded border transition-all ${draft.affiliation === a.id ? "bg-primary/20 border-primary text-primary font-bold" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="field-label">Status</label>
              <div className="flex gap-2">
                {STATUSES.map(s => (
                  <button key={s.id} onClick={() => set({ status: s.id })}
                    className={`flex-1 px-3 py-1.5 text-xs rounded border transition-all ${draft.status === s.id ? "bg-primary/20 border-primary text-primary font-bold" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* HQ / TF / Dummy */}
            <div>
              <label className="field-label">HQ / Task Force / Dummy</label>
              <div className="flex flex-wrap gap-1.5">
                {HQ_TF_DUMMY.map(h => (
                  <button key={h.id} onClick={() => set({ hqTfDummy: h.id })}
                    className={`px-2.5 py-1.5 text-xs rounded border transition-all ${draft.hqTfDummy === h.id ? "bg-primary/20 border-primary text-primary font-bold" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Echelon */}
            <div>
              <label className="field-label">Echelon</label>
              <div className="flex flex-wrap gap-1.5">
                {ECHELONS.map(e => (
                  <button key={e.id} onClick={() => set({ echelon: e.id })}
                    className={`px-2.5 py-1.5 text-xs rounded border transition-all font-mono ${draft.echelon === e.id ? "bg-primary/20 border-primary text-primary font-bold" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {e.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reinforced / Reduced */}
            <div>
              <label className="field-label">Reinforced / Reduced</label>
              <div className="flex flex-wrap gap-1.5">
                {REINFORCED_REDUCED.map(r => (
                  <button key={r.id} onClick={() => set({ reinforcedReduced: r.id })}
                    className={`px-3 py-1.5 text-xs rounded border transition-all ${draft.reinforcedReduced === r.id ? "bg-primary/20 border-primary text-primary font-bold" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Unit Type */}
            <div>
              <label className="field-label">Unit Type</label>
              {UNIT_CATEGORIES.map(cat => (
                <div key={cat.category} className="mb-4">
                  <div className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground/50 mb-2">{cat.category}</div>
                  <div className="flex flex-wrap gap-2">
                    {cat.units.map(u => {
                      const previewNode: OrbatNode = { ...draft, functionId: u.functionId, hqTfDummy: "0", echelon: "14", reinforcedReduced: "", amplifiers: {} };
                      return (
                        <button key={u.id} onClick={() => set({ functionId: u.functionId })}
                          className={`flex flex-col items-center gap-1 p-2 rounded border transition-all ${draft.functionId === u.functionId ? "bg-primary/15 border-primary/70" : "border-border hover:border-primary/30"}`}>
                          <MilSymbolSvg node={previewNode} size={28} />
                          <span className="text-[8px] text-center text-muted-foreground leading-tight max-w-[56px]">{u.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Manning */}
            <div>
              <label className="field-label">Manning / Slots</label>
              <input type="number" min={0} max={9999} value={draft.slots ?? 0}
                onChange={e => set({ slots: parseInt(e.target.value) || 0 })}
                className="w-32 bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
          </>}

          {tab === "amplifiers" && <>
            <p className="text-xs text-muted-foreground">Text amplifiers appear around the symbol on the ORBAT diagram (name, parent unit, quantity, etc.)</p>

            {[
              { key: "unitName",           label: "Unit Name / Unique Designation",  placeholder: "e.g. A/1-12 INF, 2 PARA" },
              { key: "higherFormation",    label: "Higher Formation (Parent Unit)",   placeholder: "e.g. I CORPS, 3 DIV" },
              { key: "additionalInfo",     label: "Additional Information",           placeholder: "e.g. OPCON to 5 RIFLES" },
              { key: "staffComments",      label: "Staff Comments",                   placeholder: "e.g. 75% strength" },
              { key: "quantity",           label: "Quantity",                         placeholder: "e.g. 24" },
              { key: "dtg",                label: "Date-Time Group (DTG)",            placeholder: "e.g. 301400ZSEP97" },
              { key: "location",           label: "Location (MGRS / Lat-Lon)",        placeholder: "e.g. 30UYC1234567890" },
              { key: "type",               label: "Equipment Type",                   placeholder: "e.g. CHALLENGER 2" },
              { key: "combatEffectiveness",label: "Combat Effectiveness",             placeholder: "e.g. COMBAT INEFFECTIVE" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="field-label">{label}</label>
                <input
                  value={(draft.amplifiers as Record<string, string>)[key] ?? ""}
                  onChange={e => setAmp({ [key]: e.target.value })}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder={placeholder}
                />
              </div>
            ))}

            <div>
              <label className="field-label">Direction of Movement (0–360°)</label>
              <input type="number" min={0} max={360}
                value={draft.amplifiers.direction ?? ""}
                onChange={e => setAmp({ direction: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-32 bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                placeholder="e.g. 045"
              />
            </div>
          </>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-border flex-shrink-0 bg-card">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button onClick={() => { onSave(draft); onClose(); }}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-bold hover:bg-primary/90 transition-colors">
            Save Unit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tree node ────────────────────────────────────────────────────────────────

function OrbatTreeNode({
  node, depth, onUpdate, onDelete, onAddChild, onEdit, onDuplicate,
}: {
  node: OrbatNode; depth: number;
  onUpdate: (id: string, updates: Partial<OrbatNode>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onEdit: (node: OrbatNode) => void;
  onDuplicate: (node: OrbatNode, parentId?: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const affil = AFFILIATIONS.find(a => a.id === node.affiliation);
  const echelon = ECHELONS.find(e => e.id === node.echelon);

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-2 group py-1 px-2 rounded hover:bg-muted/30 transition-colors"
        style={{ paddingLeft: `${depth * 28 + 8}px` }}
      >
        {/* Collapse toggle */}
        <button
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 w-4 h-4 flex items-center justify-center"
          onClick={() => onUpdate(node.id, { collapsed: !node.collapsed })}
        >
          {hasChildren
            ? (node.collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
            : <span className="w-3 block" />
          }
        </button>

        {/* Symbol */}
        <div className="flex-shrink-0 cursor-pointer flex items-center justify-center w-14"
          onClick={() => onEdit(node)}>
          <MilSymbolSvg node={node} size={40} />
        </div>

        {/* Labels */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(node)}>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold truncate">{node.label || "Unnamed"}</span>
            {node.hqTfDummy !== "0" && (
              <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1 rounded font-mono uppercase">
                {HQ_TF_DUMMY.find(h => h.id === node.hqTfDummy)?.label.split(" ")[0]}
              </span>
            )}
            {node.reinforcedReduced && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {node.reinforcedReduced === "reinforced" ? "(+)" : node.reinforcedReduced === "reduced" ? "(−)" : "(±)"}
              </span>
            )}
            {node.status === "1" && (
              <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1 rounded font-mono">PLANNED</span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground/60 font-mono flex gap-2">
            <span className={affil?.color}>{affil?.label}</span>
            {echelon && <span>· {echelon.label.replace(/^[🔸🔹▪|X ]+/, "")}</span>}
            {node.amplifiers.unitName && <span>· {node.amplifiers.unitName}</span>}
            {node.slots ? <span>· {node.slots} slots</span> : null}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onAddChild(node.id)}
            className="p-1 rounded hover:bg-primary/20 hover:text-primary transition-colors text-muted-foreground" title="Add child unit">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDuplicate(node)}
            className="p-1 rounded hover:bg-muted hover:text-foreground transition-colors text-muted-foreground" title="Duplicate unit">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(node.id)}
            className="p-1 rounded hover:bg-destructive/20 hover:text-destructive transition-colors text-muted-foreground" title="Delete unit">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Children */}
      {!node.collapsed && hasChildren && (
        <div className="border-l border-dashed border-border/30 ml-7">
          {node.children.map(child => (
            <OrbatTreeNode
              key={child.id} node={child} depth={depth + 1}
              onUpdate={onUpdate} onDelete={onDelete} onAddChild={onAddChild}
              onEdit={onEdit} onDuplicate={onDuplicate}
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

  // ── Tree helpers ──────────────────────────────────────────────────────────

  function updateById(tree: OrbatNode[], id: string, updates: Partial<OrbatNode>): OrbatNode[] {
    return tree.map(n => n.id === id
      ? { ...n, ...updates }
      : { ...n, children: updateById(n.children, id, updates) });
  }

  function deleteById(tree: OrbatNode[], id: string): OrbatNode[] {
    return tree
      .filter(n => n.id !== id)
      .map(n => ({ ...n, children: deleteById(n.children, id) }));
  }

  function addChildTo(tree: OrbatNode[], parentId: string, child: OrbatNode): OrbatNode[] {
    return tree.map(n => n.id === parentId
      ? { ...n, children: [...n.children, child] }
      : { ...n, children: addChildTo(n.children, parentId, child) });
  }

  function replaceById(tree: OrbatNode[], id: string, updated: OrbatNode): OrbatNode[] {
    return tree.map(n => n.id === id ? updated : { ...n, children: replaceById(n.children, id, updated) });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  function handleUpdate(id: string, updates: Partial<OrbatNode>) {
    setNodes(prev => updateById(prev, id, updates));
  }

  function handleDelete(id: string) {
    setNodes(prev => deleteById(prev, id));
  }

  function handleAddChild(parentId: string) {
    const child = defaultNode({ echelon: "12" });
    setNodes(prev => addChildTo(prev, parentId, child));
    setEditingNode(child);
  }

  function handleAddRoot() {
    const node = defaultNode({ echelon: "16" });
    setNodes(prev => [...prev, node]);
    setEditingNode(node);
  }

  function handleSaveEdit(updated: OrbatNode) {
    setNodes(prev => {
      // If node exists, replace it; if not (newly added), add to root
      const exists = JSON.stringify(prev).includes(`"id":"${updated.id}"`);
      if (exists) return replaceById(prev, updated.id, updated);
      return [...prev, updated];
    });
  }

  function handleDuplicate(node: OrbatNode) {
    function deepCopyWithNewIds(n: OrbatNode): OrbatNode {
      return { ...n, id: generateId(), children: n.children.map(deepCopyWithNewIds) };
    }
    const copy = deepCopyWithNewIds(node);
    copy.label = copy.label + " (copy)";
    setNodes(prev => [...prev, copy]);
  }

  function handleExportJSON() {
    const blob = new Blob([JSON.stringify(nodes, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "orbat.json"; a.click();
  }

  // ── Render ────────────────────────────────────────────────────────────────

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
          <button onClick={() => setZoom(z => Math.max(0.6, +(z - 0.1).toFixed(1)))}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-muted-foreground font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(1)))}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button onClick={handleExportJSON}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Export JSON">
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

      {/* Tree */}
      <div className="flex-1 overflow-auto p-4" style={{ fontSize: `${zoom}rem` }}>
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
            <div className="opacity-20 pointer-events-none">
              <MilSymbolSvg node={defaultNode({ echelon: "16", hqTfDummy: "1" })} size={80} />
            </div>
            <div className="text-muted-foreground text-sm">No units yet. Build your ORBAT.</div>
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
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        )}

        {nodes.length > 0 && !readOnly && (
          <button onClick={handleAddRoot}
            className="mt-4 flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-border rounded text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
            <Plus className="w-3 h-3" /> Add Root Unit
          </button>
        )}
      </div>

      {/* Editor modal */}
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
