/**
 * NATO ORBAT Builder
 * Uses milsymbol (APP-6 / MIL-STD-2525 compliant) for unit symbols
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Save, Download,
  ZoomIn, ZoomOut, RefreshCw, Settings, X
} from "lucide-react";

// ─── milsymbol SIDC map ───────────────────────────────────────────────────────
// SIDC format (APP-6E / MIL-STD-2525E): 30-char string
// Position 3: affiliation — 3 = friendly
// Positions 5-6: symbol set — 10 = land units
// Positions 11-16: entity/entity type/entity subtype

// Echelon modifier codes (positions 9-10 in full SIDC, amplifier)
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

// Full 20-char SIDC (APP-6E style used by milsymbol v3+)
// Format: SSTTEEEEFFFFFFF00000  — we use friendly (S=10, A=3)
// Base: 10031000000000000000 = friendly land unit
// Entity codes for common types
const UNIT_SIDC_MAP: Record<string, string> = {
  infantry:         "10031000141200000000",
  armor:            "10031000141100000000",
  mechanized:       "10031000121100000000",
  motorized:        "10031000120500000000",
  airborne:         "10031000141800000000",
  air_assault:      "10031000141900000000",
  special_forces:   "10031000140600000000",
  ranger:           "10031000140900000000",
  cavalry:          "10031000120100000000",
  recce:            "10031000151600000000",
  sniper:           "10031000140700000000",
  anti_armor:       "10031000130500000000",
  artillery:        "10031000121300000000",
  rocket_artillery: "10031000121400000000",
  mortar:           "10031000121200000000",
  air_defense:      "10031000131100000000",
  aviation:         "10031500000000000000",
  attack_helo:      "10031500110100000000",
  transport_helo:   "10031500120100000000",
  uav:              "10031500130100000000",
  engineer:         "10031000131200000000",
  signal:           "10031000151200000000",
  military_police:  "10031000151500000000",
  intelligence:     "10031000151300000000",
  cbrn:             "10031000131300000000",
  logistics:        "10031000160100000000",
  medical:          "10031000130600000000",
  maintenance:      "10031000160200000000",
  transport:        "10031000160300000000",
  hq:               "10031000000000000000",
  command_post:     "10031000000000000000",
  fac:              "10031000151100000000",
};

export const NATO_UNIT_TYPES = [
  { id: "infantry",         label: "Infantry",             category: "Combat"   },
  { id: "armor",            label: "Armor / Tank",         category: "Combat"   },
  { id: "mechanized",       label: "Mechanized Infantry",  category: "Combat"   },
  { id: "motorized",        label: "Motorized Infantry",   category: "Combat"   },
  { id: "airborne",         label: "Airborne",             category: "Combat"   },
  { id: "air_assault",      label: "Air Assault",          category: "Combat"   },
  { id: "special_forces",   label: "Special Forces",       category: "Combat"   },
  { id: "ranger",           label: "Ranger",               category: "Combat"   },
  { id: "cavalry",          label: "Cavalry / Recon",      category: "Combat"   },
  { id: "recce",            label: "Reconnaissance",       category: "Combat"   },
  { id: "sniper",           label: "Sniper",               category: "Combat"   },
  { id: "anti_armor",       label: "Anti-Armor",           category: "Combat"   },
  { id: "artillery",        label: "Field Artillery",      category: "Fires"    },
  { id: "rocket_artillery", label: "Rocket Artillery",     category: "Fires"    },
  { id: "mortar",           label: "Mortar",               category: "Fires"    },
  { id: "air_defense",      label: "Air Defense",          category: "Fires"    },
  { id: "aviation",         label: "Aviation",             category: "Aviation" },
  { id: "attack_helo",      label: "Attack Helicopter",    category: "Aviation" },
  { id: "transport_helo",   label: "Transport Helicopter", category: "Aviation" },
  { id: "uav",              label: "UAV / Drone",          category: "Aviation" },
  { id: "engineer",         label: "Engineer",             category: "Support"  },
  { id: "signal",           label: "Signal / Comms",       category: "Support"  },
  { id: "military_police",  label: "Military Police",      category: "Support"  },
  { id: "intelligence",     label: "Intelligence",         category: "Support"  },
  { id: "cbrn",             label: "CBRN",                 category: "Support"  },
  { id: "logistics",        label: "Logistics / Supply",   category: "CSS"      },
  { id: "medical",          label: "Medical",              category: "CSS"      },
  { id: "maintenance",      label: "Maintenance",          category: "CSS"      },
  { id: "transport",        label: "Transport",            category: "CSS"      },
  { id: "hq",               label: "Headquarters",         category: "C2"       },
  { id: "command_post",     label: "Command Post",         category: "C2"       },
  { id: "fac",              label: "FAC / JTAC",           category: "C2"       },
];

// ─── milsymbol Symbol Component ───────────────────────────────────────────────

function MilSymbol({ unitType, echelon, size = 56 }: { unitType: string; echelon: string; size?: number }) {
  const [svg, setSvg] = useState<string>("");
  const echelonData = NATO_ECHELONS.find(e => e.id === echelon);

  useEffect(() => {
    let cancelled = false;
    import("milsymbol").then((ms) => {
      if (cancelled) return;
      const MS = ms.default || ms;
      const baseSIDC = UNIT_SIDC_MAP[unitType] || UNIT_SIDC_MAP.infantry;

      // Inject echelon amplifier into positions 8-9 of the SIDC
      const echelonCode = echelonData?.echelonCode ?? "14";
      const sidc = baseSIDC.slice(0, 8) + echelonCode + baseSIDC.slice(10);

      try {
        const sym = new MS.Symbol(sidc, {
          size,
          standard: "APP6",
          fillOpacity: 1,
        });
        setSvg(sym.asSVG());
      } catch {
        // fallback — plain symbol without echelon
        try {
          const sym = new MS.Symbol(baseSIDC, { size, standard: "APP6" });
          setSvg(sym.asSVG());
        } catch {
          setSvg("");
        }
      }
    }).catch(() => setSvg(""));

    return () => { cancelled = true; };
  }, [unitType, echelon, size]);

  if (!svg) {
    // Placeholder while loading — uses a visible colored box so it doesn't look black
    return (
      <div
        className="border border-primary/40 bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-xs rounded"
        style={{ width: size, height: size * 0.75 }}
      >
        {unitType.slice(0, 3).toUpperCase()}
      </div>
    );
  }

  return (
    <span
      className="inline-block"
      style={{ width: size, height: size * 0.75 + 12 }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrbatNode {
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

function NodeEditor({ node, onSave, onClose }: { node: OrbatNode; onSave: (n: OrbatNode) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<OrbatNode>({ ...node });
  const categories = Array.from(new Set(NATO_UNIT_TYPES.map(u => u.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-display font-black uppercase tracking-wider text-sm text-foreground">Edit Unit Node</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex justify-center py-2">
            <div className="flex flex-col items-center gap-1">
              <MilSymbol unitType={draft.unitType} echelon={draft.echelon} size={64} />
              <span className="text-xs text-muted-foreground font-sans mt-1">{draft.name || "Unnamed"}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Unit Name</label>
            <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm font-sans focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. 1st Platoon, Alpha Company" />
          </div>
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Callsign</label>
            <input value={draft.callsign || ""} onChange={e => setDraft(d => ({ ...d, callsign: e.target.value }))}
              className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm font-sans focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. ALPHA, BRAVO-1" />
          </div>
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Unit Type</label>
            <select value={draft.unitType} onChange={e => setDraft(d => ({ ...d, unitType: e.target.value }))}
              className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm font-sans focus:outline-none focus:border-primary transition-colors">
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
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Echelon</label>
            <select value={draft.echelon} onChange={e => setDraft(d => ({ ...d, echelon: e.target.value }))}
              className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm font-sans focus:outline-none focus:border-primary transition-colors">
              {NATO_ECHELONS.map(e => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              Personnel Slots — <span className="text-primary">{draft.slots}</span>
            </label>
            <input type="range" min={1} max={200} value={draft.slots}
              onChange={e => setDraft(d => ({ ...d, slots: Number(e.target.value) }))}
              className="w-full accent-primary" />
            <div className="flex justify-between text-xs text-muted-foreground font-sans mt-0.5">
              <span>1</span><span>50</span><span>100</span><span>150</span><span>200</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-border">
          <button onClick={() => onSave(draft)}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded transition-colors flex items-center justify-center gap-2">
            <Save className="w-3.5 h-3.5" /> Apply
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 border border-border text-muted-foreground hover:text-foreground font-display font-bold uppercase tracking-wider text-xs rounded transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tree Node ────────────────────────────────────────────────────────────────

function OrbatTreeNode({ node, onUpdate, onDelete, onAddChild, depth = 0, isRoot = false, readOnly = false }: {
  node: OrbatNode;
  onUpdate: (updated: OrbatNode) => void;
  onDelete: () => void;
  onAddChild: (parentId: string) => void;
  depth?: number;
  isRoot?: boolean;
  readOnly?: boolean;
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
  const deleteChild = (idx: number) => {
    onUpdate({ ...node, children: node.children.filter((_, i) => i !== idx) });
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex flex-col items-center group">
        <div
          className={`relative flex flex-col items-center cursor-pointer select-none transition-all duration-150 ${depth === 0 ? "scale-110" : ""}`}
          onClick={() => !readOnly && setEditing(true)}
        >
          <MilSymbol unitType={node.unitType} echelon={node.echelon} size={depth === 0 ? 60 : 48} />
        </div>

        <div className="text-center mt-1 max-w-[110px]">
          <div className="text-xs font-display font-bold text-foreground leading-tight truncate">{node.name}</div>
          {node.callsign && (
            <div className="text-[10px] font-sans text-primary truncate">{node.callsign}</div>
          )}
          <div className="text-[9px] text-muted-foreground font-sans truncate">
            {echelon?.label} · {unitType?.label}
          </div>
          <div className="text-[9px] text-muted-foreground font-sans">{node.slots} slots</div>
        </div>

        {!readOnly && <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
          <button onClick={e => { e.stopPropagation(); setEditing(true); }}
            className="w-5 h-5 bg-secondary hover:bg-secondary/70 border border-border rounded text-foreground flex items-center justify-center transition-colors" title="Edit">
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
        </div>}
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
            <div className="absolute top-4 bg-border"
              style={{ left: `calc(${100/(node.children.length*2)}%)`, right: `calc(${100/(node.children.length*2)}%)`, height: "1px" }} />
          )}
          <div className="flex gap-6 items-start">
            {node.children.map((child, idx) => (
              <div key={child.id} className="relative flex flex-col items-center">
                <div className="w-px h-4 bg-border" />
                <OrbatTreeNode node={child} onUpdate={u => updateChild(idx, u)} onDelete={() => deleteChild(idx)} onAddChild={onAddChild} depth={depth + 1} readOnly={readOnly} />
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
    try { if (value) return JSON.parse(value); } catch {}
    return DEFAULT_ORBAT;
  };

  const [tree, setTree] = useState<OrbatNode>(parseValue);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateTree = useCallback((updated: OrbatNode) => {
    setTree(updated); onChange?.(JSON.stringify(updated));
  }, [onChange]);

  const addChildTo = (parentId: string, root: OrbatNode): OrbatNode => {
    if (root.id === parentId) {
      const newChild: OrbatNode = { id: generateId(), name: "New Unit", unitType: "infantry", echelon: "platoon", slots: 20, children: [] };
      return { ...root, children: [...root.children, newChild] };
    }
    return { ...root, children: root.children.map(c => addChildTo(parentId, c)) };
  };

  const countUnits = (node: OrbatNode): number => 1 + node.children.reduce((a, c) => a + countUnits(c), 0);
  const countSlots = (node: OrbatNode): number => node.slots + node.children.reduce((a, c) => a + countSlots(c), 0);

  const exportSVG = () => {
    const container = containerRef.current;
    if (!container) return;
    const svgEls = container.querySelectorAll("svg");
    if (!svgEls.length) return;
    const blob = new Blob([svgEls[0].outerHTML], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "orbat.svg";
    a.click();
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/20">
        <div className="flex items-center gap-3">
          <span className="text-xs font-display font-black uppercase tracking-widest text-foreground">ORBAT Builder</span>
          <span className="text-[10px] font-sans text-muted-foreground">APP-6 Standard</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-sans text-muted-foreground mr-2">
            {countUnits(tree)} units · {countSlots(tree)} total slots
          </span>
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}
            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground border border-border rounded transition-colors">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-sans text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground border border-border rounded transition-colors">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(1)}
            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground border border-border rounded transition-colors">
            <RefreshCw className="w-3 h-3" />
          </button>
          {!readOnly && (
            <button onClick={exportSVG}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-widest text-[10px] px-3 py-1.5 rounded transition-colors">
              <Download className="w-3 h-3" /> Export SVG
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-4 py-2 border-b border-border bg-secondary/10">
        {[
          { type: "infantry",  label: "Infantry"  },
          { type: "armor",     label: "Armor"     },
          { type: "artillery", label: "Artillery" },
          { type: "cavalry",   label: "Recon"     },
          { type: "engineer",  label: "Engineer"  },
          { type: "medical",   label: "Medical"   },
          { type: "hq",        label: "HQ"        },
        ].map(item => (
          <div key={item.type} className="flex items-center gap-1.5">
            <MilSymbol unitType={item.type} echelon="platoon" size={24} />
            <span className="text-[10px] text-muted-foreground font-sans">{item.label}</span>
          </div>
        ))}
        <span className="text-[10px] text-muted-foreground font-sans ml-auto self-center hidden md:block">
          Hover unit · click to edit · + to add subordinate
        </span>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="overflow-auto p-8 min-h-[400px] bg-background">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.15s ease" }}>
          <OrbatTreeNode
            node={tree}
            onUpdate={updateTree}
            onDelete={() => {}}
            onAddChild={(parentId) => updateTree(addChildTo(parentId, tree))}
            isRoot
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
}
