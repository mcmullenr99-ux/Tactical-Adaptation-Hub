/**
 * NATO ORBAT Builder — Full APP-6D / MIL-STD-2525D
 * Powered by milsymbol (spatialillusions.com)
 */

import React, { useState, useMemo } from "react";
import ms from "milsymbol";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Save,
  ZoomIn, ZoomOut, X, Download, Copy, Settings2, Palette,
} from "lucide-react";

// ─── SIDC builder ─────────────────────────────────────────────────────────────

export function buildSIDC({
  affiliation = "03",
  symbolSet = "10",
  status = "0",
  hqTfDummy = "0",
  echelon = "00",
  functionId = "121100",
}: {
  affiliation?: string;
  symbolSet?: string;
  status?: string;
  hqTfDummy?: string;
  echelon?: string;
  functionId?: string;
}) {
  // 30-char MIL-STD-2525D SIDC
  return `13${affiliation}${symbolSet}${status}${hqTfDummy}${echelon}${functionId}0000000000`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const AFFILIATIONS = [
  { id: "03", label: "Friendly",         color: "#80e0ff" },
  { id: "06", label: "Hostile",          color: "#ff8080" },
  { id: "04", label: "Neutral",          color: "#aaffaa" },
  { id: "01", label: "Unknown",          color: "#ffff80" },
  { id: "02", label: "Assumed Friendly", color: "#80c0ff" },
  { id: "05", label: "Suspect",          color: "#ffb060" },
];

export const STATUSES: { id: string; label: string; color?: string; dotted?: boolean }[] = [
  { id: "0", label: "Present",         color: undefined     },
  { id: "1", label: "Planned",         color: undefined, dotted: true },
  { id: "2", label: "Fully Capable",   color: "#00cc00"     },
  { id: "3", label: "Damaged",         color: "#ffff00"     },
  { id: "4", label: "Destroyed",       color: "#ff0000"     },
  { id: "5", label: "Full to Capacity",color: "#00b4f0"     },
];

export const HQ_TF_DUMMY = [
  { id: "0", label: "None"          },
  { id: "1", label: "HQ"            },
  { id: "2", label: "Task Force"    },
  { id: "3", label: "HQ + TF"       },
  { id: "4", label: "Dummy / Feint" },
  { id: "5", label: "HQ + Dummy"    },
  { id: "6", label: "TF + Dummy"    },
  { id: "7", label: "HQ + TF + Dummy" },
];

export const ECHELONS: { id: string; label: string; mark: string }[] = [
  { id: "00", label: "Unspecified",             mark: "—"        },
  { id: "11", label: "Fireteam / Crew",          mark: "•"        },
  { id: "12", label: "Squad",                    mark: "••"       },
  { id: "13", label: "Section",                  mark: "•••"      },
  { id: "14", label: "Platoon / Detachment",     mark: "|"        },
  { id: "15", label: "Company / Battery / Troop",mark: "||"       },
  { id: "16", label: "Battalion / Squadron",     mark: "|||"      },
  { id: "17", label: "Regiment / Group",         mark: "X"        },
  { id: "18", label: "Brigade",                  mark: "XX"       },
  { id: "19", label: "Division",                 mark: "XXX"      },
  { id: "20", label: "Corps",                    mark: "XXXX"     },
  { id: "21", label: "Army",                     mark: "XXXXX"    },
  { id: "22", label: "Army Group / Front",       mark: "XXXXXX"   },
  { id: "23", label: "Region",                   mark: "XXXXXXX"  },
  { id: "24", label: "Command",                  mark: "XXXXXXXX" },
];

export const REINFORCED_REDUCED = [
  { id: "",    label: "None"               },
  { id: "(+)", label: "(+) Reinforced"     },
  { id: "(-)", label: "(-) Reduced"        },
  { id: "(±)", label: "(±) Both"           },
];

// Preset fill colours for the symbol selector
export const FILL_COLORS = [
  { id: "auto",    label: "Auto (NATO standard)", value: null           },
  { id: "blue",    label: "Friendly Blue",        value: "#80e0ff"      },
  { id: "red",     label: "Hostile Red",          value: "#ff8080"      },
  { id: "green",   label: "Neutral Green",        value: "#aaffaa"      },
  { id: "yellow",  label: "Unknown Yellow",       value: "#ffff80"      },
  { id: "orange",  label: "Orange",               value: "#ffb060"      },
  { id: "purple",  label: "Purple",               value: "#c084fc"      },
  { id: "white",   label: "White / Uncoloured",   value: "#ffffff"      },
  { id: "black",   label: "Black",                value: "#111111"      },
  { id: "custom",  label: "Custom…",              value: null           },
];

// ─── CORRECTED unit type catalogue ───────────────────────────────────────────
// All function IDs validated against milsymbol landunit.js

export const UNIT_CATEGORIES: { category: string; units: { id: string; label: string; functionId: string }[] }[] = [
  {
    category: "Infantry",
    units: [
      { id: "infantry",        label: "Infantry",               functionId: "121100" },
      { id: "inf_amphibious",  label: "Amphibious Infantry",    functionId: "121101" },
      { id: "inf_mech",        label: "Mechanised Infantry",    functionId: "121102" },
      { id: "inf_motor",       label: "Motorized Infantry",     functionId: "121104" },
      { id: "inf_airborne",    label: "Airborne",               functionId: "120100" },
      { id: "inf_air_assault", label: "Air Assault",            functionId: "120100" },
      { id: "recce",           label: "Reconnaissance",         functionId: "121300" },
      { id: "surveillance",    label: "Surveillance",           functionId: "121600" },
      { id: "sniper",          label: "Sniper",                 functionId: "121500" },
      { id: "sf",              label: "Special Forces",         functionId: "121700" },
      { id: "sof",             label: "SOF",                    functionId: "121800" },
      { id: "ranger",          label: "Ranger",                 functionId: "122000" },
      { id: "seal",            label: "SEA-AIR-LAND (SEAL)",    functionId: "121400" },
      { id: "anti_armor",      label: "Anti-Armour",            functionId: "120400" },
      { id: "combined_arms",   label: "Combined Arms",          functionId: "121000" },
    ],
  },
  {
    category: "Armour",
    units: [
      { id: "armour",          label: "Armour / Tank",          functionId: "120500" },
      { id: "armd_cav",        label: "Armoured Cavalry",       functionId: "120501" },
      { id: "armd_amphibious", label: "Armour (Amphibious)",    functionId: "120502" },
    ],
  },
  {
    category: "Aviation",
    units: [
      { id: "avn_rotary",      label: "Aviation (Rotary Wing)", functionId: "120600" },
      { id: "avn_fixed",       label: "Aviation (Fixed Wing)",  functionId: "120800" },
      { id: "avn_composite",   label: "Aviation (Composite)",   functionId: "120700" },
      { id: "uav",             label: "Unmanned Systems / UAV", functionId: "121900" },
    ],
  },
  {
    category: "Fires",
    units: [
      { id: "arty",            label: "Field Artillery",        functionId: "130300" },
      { id: "arty_obs",        label: "Artillery Observer",     functionId: "130400" },
      { id: "jfst",            label: "Joint Fire Support",     functionId: "130500" },
      { id: "missile",         label: "Missile",                functionId: "130700" },
      { id: "mortar",          label: "Mortar",                 functionId: "130800" },
      { id: "mortar_tracked",  label: "Mortar (Tracked)",       functionId: "130801" },
      { id: "mortar_truck",    label: "Mortar (Truck)",         functionId: "130802" },
      { id: "mortar_towed",    label: "Mortar (Towed)",         functionId: "130803" },
      { id: "ada",             label: "Air Defence",            functionId: "130100" },
    ],
  },
  {
    category: "Combat Support",
    units: [
      { id: "engineer",        label: "Engineer",               functionId: "140700" },
      { id: "eng_mech",        label: "Engineer (Mech)",        functionId: "140701" },
      { id: "eod",             label: "EOD / Ordnance",         functionId: "140800" },
      { id: "cbrn",            label: "CBRN / NBC",             functionId: "140100" },
      { id: "cbrn_armd",       label: "CBRN (Armoured)",        functionId: "140101" },
      { id: "signal",          label: "Signal / Comms",         functionId: "111000" },
      { id: "signal_radio",    label: "Signal (Radio)",         functionId: "111001" },
      { id: "signal_sat",      label: "Signal (Satellite)",     functionId: "111004" },
      { id: "mp",              label: "Military Police",        functionId: "141200" },
      { id: "intel",           label: "Military Intelligence",  functionId: "151000" },
      { id: "ew",              label: "Electronic Warfare",     functionId: "150500" },
      { id: "psyops",          label: "PsyOps / Info Ops",      functionId: "110400" },
      { id: "civil_affairs",   label: "Civil Affairs",          functionId: "110200" },
      { id: "cimic",           label: "CIMIC",                  functionId: "110300" },
      { id: "jtac",            label: "JTAC / TACP",            functionId: "130400" },
    ],
  },
  {
    category: "Combat Service Support",
    units: [
      { id: "medical",         label: "Medical",                functionId: "161300" },
      { id: "med_hospital",    label: "Medical Treatment",      functionId: "161400" },
      { id: "supply",          label: "Supply",                 functionId: "160200" },
      { id: "sustainment",     label: "Sustainment",            functionId: "160000" },
      { id: "maintenance",     label: "Maintenance",            functionId: "161100" },
      { id: "transport",       label: "Transportation",         functionId: "163600" },
      { id: "ammo",            label: "Ammunition",             functionId: "160400" },
      { id: "ordnance",        label: "Ordnance",               functionId: "162300" },
      { id: "petroleum",       label: "Petroleum / Fuel (POL)", functionId: "162500" },
      { id: "finance",         label: "Finance",                functionId: "160700" },
      { id: "mortuary",        label: "Mortuary Affairs",       functionId: "161600" },
      { id: "water",           label: "Water",                  functionId: "164700" },
      { id: "css_general",     label: "CSS (General)",          functionId: "160600" },
    ],
  },
  {
    category: "Command & Control",
    units: [
      { id: "c2_generic",      label: "C2 (Generic)",           functionId: "110000" },
      { id: "special_troops",  label: "Special Troops",         functionId: "111400" },
      { id: "multi_domain",    label: "Multi-Domain",           functionId: "111500" },
      { id: "liaison",         label: "Liaison",                functionId: "110500" },
    ],
  },
];

export const ALL_UNIT_TYPES = UNIT_CATEGORIES.flatMap(c => c.units);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrbatNodeAmplifiers {
  unitName?: string;
  higherFormation?: string;
  additionalInfo?: string;
  staffComments?: string;
  quantity?: string;
  direction?: number;
  dtg?: string;
  location?: string;
  type?: string;
  combatEffectiveness?: string;
}

export interface OrbatNode {
  id: string;
  label: string;
  affiliation: string;
  symbolSet: string;
  status: string;
  hqTfDummy: string;
  echelon: string;
  functionId: string;
  reinforcedReduced: string;
  fillColor?: string;        // null = auto NATO colour
  amplifiers: OrbatNodeAmplifiers;
  children: OrbatNode[];
  collapsed?: boolean;
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
    functionId: "121100",
    reinforcedReduced: "",
    fillColor: undefined,
    amplifiers: {},
    children: [],
    slots: 0,
    ...overrides,
  };
}

// ─── Symbol renderer ──────────────────────────────────────────────────────────

function nodeToSIDC(node: OrbatNode): string {
  return buildSIDC({
    affiliation: node.affiliation,
    symbolSet: node.symbolSet,
    status: node.status,
    hqTfDummy: node.hqTfDummy,
    echelon: node.echelon,
    functionId: node.functionId,
  });
}

function MilSymbolSvg({ node, size = 60, showName = false }: { node: OrbatNode; size?: number; showName?: boolean }) {
  const { svgString, symW, symH } = useMemo(() => {
    try {
      const sidc = nodeToSIDC(node);
      const opts: Record<string, unknown> = {
        size,
        ...(node.reinforcedReduced ? { reinforcedReduced: node.reinforcedReduced } : {}),
        ...(node.fillColor ? { fillColor: node.fillColor } : {}),
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
      const sz = sym.getSize();
      return { svgString: sym.asSVG(), symW: sz.width, symH: sz.height };
    } catch {
      const sym = new ms.Symbol("130310001412110000000000000000", { size });
      const sz = sym.getSize();
      return { svgString: sym.asSVG(), symW: sz.width, symH: sz.height };
    }
  }, [node, size]);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div style={{ width: symW, height: symH }} dangerouslySetInnerHTML={{ __html: svgString }} />
      {showName && node.label && (
        <span className="text-[10px] font-mono font-bold text-foreground text-center leading-tight max-w-[100px] truncate">
          {node.label}
        </span>
      )}
    </div>
  );
}

// ─── Colour picker panel ──────────────────────────────────────────────────────

function ColorPicker({ value, onChange }: { value?: string; onChange: (v?: string) => void }) {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {FILL_COLORS.map(c => {
          const isActive = c.id === "custom"
            ? (!!value && !FILL_COLORS.some(x => x.id !== "custom" && x.id !== "auto" && x.value === value))
            : c.id === "auto"
              ? !value
              : value === c.value;

          return (
            <button
              key={c.id}
              onClick={() => {
                if (c.id === "auto") { onChange(undefined); setShowCustom(false); }
                else if (c.id === "custom") { setShowCustom(true); }
                else { onChange(c.value ?? undefined); setShowCustom(false); }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs transition-all
                ${isActive ? "border-primary bg-primary/15 text-foreground font-bold" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              {c.value && (
                <span className="w-3 h-3 rounded-full border border-border/60 flex-shrink-0" style={{ background: c.value }} />
              )}
              {c.label}
            </button>
          );
        })}
      </div>
      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value || "#80e0ff"}
            onChange={e => onChange(e.target.value)}
            className="w-10 h-8 rounded border border-border bg-background cursor-pointer"
          />
          <input
            type="text"
            value={value || ""}
            onChange={e => onChange(e.target.value || undefined)}
            placeholder="#rrggbb"
            className="w-28 bg-background border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-primary"
          />
        </div>
      )}
    </div>
  );
}

// ─── Node editor modal ────────────────────────────────────────────────────────

function NodeEditor({ node, onSave, onClose }: {
  node: OrbatNode;
  onSave: (n: OrbatNode) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<OrbatNode>(JSON.parse(JSON.stringify(node)));
  const [tab, setTab] = useState<"symbol" | "color" | "amplifiers">("symbol");

  function set(updates: Partial<OrbatNode>) {
    setDraft(d => ({ ...d, ...updates }));
  }
  function setAmp(updates: Partial<OrbatNodeAmplifiers>) {
    setDraft(d => ({ ...d, amplifiers: { ...d.amplifiers, ...updates } }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
            <span className="font-display font-black uppercase tracking-wider text-sm">Edit Unit</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live preview */}
        <div className="flex justify-center items-center gap-6 py-4 px-5 bg-zinc-900 border-b border-border flex-shrink-0 flex-wrap">
          <MilSymbolSvg node={draft} size={64} showName />
          <div className="text-xs text-muted-foreground font-mono space-y-0.5">
            <div>SIDC: <span className="text-primary">{nodeToSIDC(draft)}</span></div>
            <div>Standard: APP-6D / MIL-STD-2525D</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          {(["symbol", "color", "amplifiers"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 px-3 py-2.5 text-xs font-display font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1
                ${tab === t ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "color" && <Palette className="w-3 h-3" />}
              {t === "symbol" ? "Symbol & Echelon" : t === "color" ? "Colour" : "Text Amplifiers"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* ── Symbol tab ─────────────────────────────────────────── */}
          {tab === "symbol" && <>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Unit Label</label>
              <input value={draft.label} onChange={e => set({ label: e.target.value })}
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                placeholder="e.g. 1 PARA, A Sqn, 3 Plt" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Affiliation</label>
              <div className="flex flex-wrap gap-1.5">
                {AFFILIATIONS.map(a => (
                  <button key={a.id} onClick={() => set({ affiliation: a.id })}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border transition-all
                      ${draft.affiliation === a.id ? "border-primary bg-primary/15 font-bold text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: a.color }} />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Status</label>
              <div className="flex flex-wrap gap-3">
                {STATUSES.map(s => {
                  const previewNode = { ...draft, status: s.id };
                  return (
                    <button key={s.id} onClick={() => set({ status: s.id })}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded border transition-all min-w-[70px]
                        ${draft.status === s.id ? "border-primary bg-primary/15" : "border-border hover:border-primary/40"}`}>
                      <MilSymbolSvg node={previewNode} size={36} />
                      <span className="text-[9px] font-mono text-muted-foreground text-center leading-tight">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">HQ / Task Force / Dummy</label>
              <div className="flex flex-wrap gap-1.5">
                {HQ_TF_DUMMY.map(h => (
                  <button key={h.id} onClick={() => set({ hqTfDummy: h.id })}
                    className={`px-2.5 py-1.5 text-xs rounded border transition-all
                      ${draft.hqTfDummy === h.id ? "bg-primary/15 border-primary font-bold text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Echelon</label>
              <div className="flex flex-wrap gap-1.5">
                {ECHELONS.map(e => (
                  <button key={e.id} onClick={() => set({ echelon: e.id })}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded border font-mono transition-all
                      ${draft.echelon === e.id ? "bg-primary/15 border-primary font-bold text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    <span className="text-primary font-bold">{e.mark}</span>
                    <span>{e.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Reinforced / Reduced</label>
              <div className="flex flex-wrap gap-1.5">
                {REINFORCED_REDUCED.map(r => (
                  <button key={r.id} onClick={() => set({ reinforcedReduced: r.id })}
                    className={`px-3 py-1.5 text-sm font-mono rounded border transition-all
                      ${draft.reinforcedReduced === r.id ? "bg-primary/15 border-primary font-bold text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Unit Type</label>
              {UNIT_CATEGORIES.map(cat => (
                <div key={cat.category} className="mb-5">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2 px-0.5">{cat.category}</div>
                  <div className="flex flex-wrap gap-2">
                    {cat.units.map(u => {
                      const preview = defaultNode({ functionId: u.functionId, affiliation: draft.affiliation, fillColor: draft.fillColor });
                      return (
                        <button key={u.id} onClick={() => set({ functionId: u.functionId })}
                          className={`flex flex-col items-center gap-1 p-2 rounded border transition-all
                            ${draft.functionId === u.functionId ? "bg-primary/15 border-primary/70" : "border-border hover:border-primary/40 hover:bg-muted/20"}`}>
                          <MilSymbolSvg node={preview} size={28} />
                          <span className="text-[8px] text-center text-muted-foreground leading-tight max-w-[60px]">{u.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Manning / Slots</label>
              <input type="number" min={0} max={9999} value={draft.slots ?? 0}
                onChange={e => set({ slots: parseInt(e.target.value) || 0 })}
                className="w-32 bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
          </>}

          {/* ── Colour tab ─────────────────────────────────────────── */}
          {tab === "color" && <>
            <p className="text-xs text-muted-foreground">Override the symbol fill colour. "Auto" uses the NATO standard colour for the selected affiliation.</p>
            <ColorPicker value={draft.fillColor} onChange={v => set({ fillColor: v })} />

            {/* Preview strip */}
            <div className="mt-4">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-3">Preview</div>
              <div className="flex flex-wrap gap-4 p-4 bg-zinc-900 rounded-lg">
                {AFFILIATIONS.map(a => {
                  const previewNode = { ...draft, affiliation: a.id };
                  return (
                    <div key={a.id} className="flex flex-col items-center gap-1">
                      <MilSymbolSvg node={previewNode} size={40} />
                      <span className="text-[8px] text-muted-foreground">{a.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>}

          {/* ── Amplifiers tab ─────────────────────────────────────── */}
          {tab === "amplifiers" && <>
            <p className="text-xs text-muted-foreground">Text amplifiers appear around the symbol on the ORBAT.</p>
            {[
              { key: "unitName",            label: "Unit Name / Unique Designation",  placeholder: "e.g. A/1-12 INF, 2 PARA" },
              { key: "higherFormation",     label: "Higher Formation (Parent Unit)",   placeholder: "e.g. I CORPS, 3 DIV" },
              { key: "additionalInfo",      label: "Additional Information",           placeholder: "e.g. OPCON to 5 RIFLES" },
              { key: "staffComments",       label: "Staff Comments",                   placeholder: "e.g. 75% strength" },
              { key: "quantity",            label: "Quantity",                         placeholder: "e.g. 24" },
              { key: "dtg",                 label: "Date-Time Group (DTG)",            placeholder: "e.g. 301400ZSEP97" },
              { key: "location",            label: "Location (MGRS / Lat-Lon)",        placeholder: "e.g. 30UYC1234567890" },
              { key: "type",                label: "Equipment Type",                   placeholder: "e.g. CHALLENGER 2" },
              { key: "combatEffectiveness", label: "Combat Effectiveness",             placeholder: "e.g. COMBAT INEFFECTIVE" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">{label}</label>
                <input
                  value={(draft.amplifiers as Record<string, string>)[key] ?? ""}
                  onChange={e => setAmp({ [key]: e.target.value })}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder={placeholder}
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Direction of Movement (0–360°)</label>
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
  const hoverTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasChildren = node.children && node.children.length > 0;

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHovered(true);
  };
  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => setHovered(false), 300);
  };
  const affil = AFFILIATIONS.find(a => a.id === node.affiliation);
  const echelon = ECHELONS.find(e => e.id === node.echelon);

  const modBadge = node.reinforcedReduced || null;

  return (
    <div
      style={{ position: "absolute", left: x - NODE_W / 2, top: y, width: NODE_W }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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

          {node.hqTfDummy !== "0" && (
            <div className="text-[8px] font-mono text-yellow-400 uppercase leading-tight">
              {HQ_TF_DUMMY.find(h => h.id === node.hqTfDummy)?.label}
            </div>
          )}

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
