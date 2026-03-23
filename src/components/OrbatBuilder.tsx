/**
 * NATO ORBAT Builder — v2
 * Features:
 *  - Roster member assignment per unit node
 *  - Symbology standard selector (APP-6, 2525, UK, CA, AUS, NZ, EU)
 *  - Symbol affiliation / colour selector (Friendly/Blue, Hostile/Red, Neutral/Green, Unknown/Yellow, Custom)
 *  - ReadOnly display mode
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Save, Download,
  ZoomIn, ZoomOut, Settings, X, Users, Palette, Flag,
} from "lucide-react";

// ─── Symbology Standards ──────────────────────────────────────────────────────

export const SYMBOLOGY_STANDARDS = [
  { id: "APP6",   label: "NATO APP-6",      flag: "🌍" },
  { id: "2525",   label: "US MIL-STD 2525", flag: "🇺🇸" },
  { id: "APP6UK", label: "UK APP-6",        flag: "🇬🇧" },
  { id: "APP6CA", label: "Canadian APP-6",  flag: "🇨🇦" },
  { id: "APP6AU", label: "Australian APP-6",flag: "🇦🇺" },
  { id: "APP6NZ", label: "New Zealand",     flag: "🇳🇿" },
  { id: "APP6EU", label: "EU Standard",     flag: "🇪🇺" },
];

// ─── Affiliation / Colour ─────────────────────────────────────────────────────

export const AFFILIATIONS = [
  { id: "friendly", label: "Friendly", sidcChar: "3", color: "#006ba6" },
  { id: "hostile",  label: "Hostile",  sidcChar: "6", color: "#c8001f" },
  { id: "neutral",  label: "Neutral",  sidcChar: "4", color: "#007243" },
  { id: "unknown",  label: "Unknown",  sidcChar: "1", color: "#ffb300" },
];

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

// ─── SIDC Map ─────────────────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RosterMember {
  id: number | string;
  callsign: string;
  rank?: string;
  role?: string;
}

export interface OrbatNode {
  id: string;
  name: string;
  callsign?: string;
  unitType: string;
  echelon: string;
  slots: number;
  assignedMembers?: string[]; // callsigns assigned to this node
  children: OrbatNode[];
  collapsed?: boolean;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── milsymbol Symbol ─────────────────────────────────────────────────────────

function MilSymbol({
  unitType,
  echelon,
  standard = "APP6",
  affiliation = "friendly",
  size = 56,
}: {
  unitType: string;
  echelon: string;
  standard?: string;
  affiliation?: string;
  size?: number;
}) {
  const [svg, setSvg] = useState<string>("");
  const affiliationData = AFFILIATIONS.find(a => a.id === affiliation) ?? AFFILIATIONS[0];
  const echelonData = NATO_ECHELONS.find(e => e.id === echelon);

  useEffect(() => {
    let cancelled = false;
    import("milsymbol").then((ms) => {
      if (cancelled) return;
      const MS = ms.default || ms;
      let baseSIDC = UNIT_SIDC_MAP[unitType] || UNIT_SIDC_MAP.infantry;

      // Swap affiliation char (position 4 in 20-char SIDC)
      baseSIDC = baseSIDC.slice(0, 4) + affiliationData.sidcChar + baseSIDC.slice(5);

      // Inject echelon amplifier into positions 8-9
      const echelonCode = echelonData?.echelonCode ?? "14";
      const sidc = baseSIDC.slice(0, 8) + echelonCode + baseSIDC.slice(10);

      // milsymbol standard mapping
      const stdMap: Record<string, string> = {
        APP6: "APP6", APP6UK: "APP6", APP6CA: "APP6", APP6AU: "APP6",
        APP6NZ: "APP6", APP6EU: "APP6", "2525": "2525",
      };
      const milStandard = stdMap[standard] ?? "APP6";

      try {
        const sym = new MS.Symbol(sidc, {
          size,
          standard: milStandard,
          fillOpacity: 1,
        });
        setSvg(sym.asSVG());
      } catch {
        try {
          const sym = new MS.Symbol(baseSIDC, { size, standard: milStandard });
          setSvg(sym.asSVG());
        } catch {
          setSvg("");
        }
      }
    }).catch(() => setSvg(""));
    return () => { cancelled = true; };
  }, [unitType, echelon, standard, affiliation]);

  if (!svg) {
    return (
      <div
        className="border flex items-center justify-center font-display font-bold text-xs rounded"
        style={{
          width: size,
          height: size * 0.75,
          borderColor: affiliationData.color + "66",
          backgroundColor: affiliationData.color + "1a",
          color: affiliationData.color,
        }}
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

// ─── Node Editor Modal ────────────────────────────────────────────────────────

function NodeEditor({
  node,
  roster,
  standard,
  affiliation,
  onSave,
  onClose,
}: {
  node: OrbatNode;
  roster: RosterMember[];
  standard: string;
  affiliation: string;
  onSave: (n: OrbatNode) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<OrbatNode>({ ...node, assignedMembers: node.assignedMembers ?? [] });
  const [memberSearch, setMemberSearch] = useState("");
  const categories = Array.from(new Set(NATO_UNIT_TYPES.map(u => u.category)));

  const assignedSet = new Set(draft.assignedMembers ?? []);
  const filteredRoster = roster.filter(m =>
    m.callsign.toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.rank ?? "").toLowerCase().includes(memberSearch.toLowerCase())
  );

  const toggleMember = (callsign: string) => {
    setDraft(d => {
      const current = d.assignedMembers ?? [];
      return {
        ...d,
        assignedMembers: current.includes(callsign)
          ? current.filter(c => c !== callsign)
          : [...current, callsign],
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="font-display font-black uppercase tracking-wider text-sm text-foreground">Edit Unit Node</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Preview */}
          <div className="flex justify-center py-2">
            <div className="flex flex-col items-center gap-1">
              <MilSymbol unitType={draft.unitType} echelon={draft.echelon} standard={standard} affiliation={affiliation} size={64} />
              <span className="text-xs text-muted-foreground font-sans mt-1">{draft.name || "Unnamed"}</span>
            </div>
          </div>

          {/* Unit Name */}
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Unit Name</label>
            <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm font-sans focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. 1st Platoon, Alpha Company" />
          </div>

          {/* Callsign */}
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Callsign</label>
            <input value={draft.callsign || ""} onChange={e => setDraft(d => ({ ...d, callsign: e.target.value }))}
              className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm font-sans focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. BRAVO-1" />
          </div>

          {/* Unit Type */}
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Unit Type</label>
            <select value={draft.unitType} onChange={e => setDraft(d => ({ ...d, unitType: e.target.value }))}
              className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm font-sans focus:outline-none focus:border-primary transition-colors">
              {categories.map(cat => (
                <optgroup key={cat} label={cat}>
                  {NATO_UNIT_TYPES.filter(u => u.category === cat).map(u => (
                    <option key={u.id} value={u.id}>{u.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Echelon */}
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Echelon</label>
            <select value={draft.echelon} onChange={e => setDraft(d => ({ ...d, echelon: e.target.value }))}
              className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm font-sans focus:outline-none focus:border-primary transition-colors">
              {NATO_ECHELONS.map(e => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>
          </div>

          {/* Slots */}
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              Slots / Strength
            </label>
            <input type="number" min={1} max={9999} value={draft.slots}
              onChange={e => setDraft(d => ({ ...d, slots: parseInt(e.target.value) || 1 }))}
              className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm font-sans focus:outline-none focus:border-primary transition-colors" />
          </div>

          {/* Roster Member Assignment */}
          {roster.length > 0 && (
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                <Users className="w-3 h-3" /> Assign Roster Members
                {assignedSet.size > 0 && (
                  <span className="ml-auto bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-sans font-normal">
                    {assignedSet.size} assigned
                  </span>
                )}
              </label>
              <input
                type="text"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                placeholder="Search callsign or rank..."
                className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm font-sans focus:outline-none focus:border-primary transition-colors mb-2"
              />
              <div className="max-h-40 overflow-y-auto border border-border rounded divide-y divide-border/50">
                {filteredRoster.length === 0 ? (
                  <p className="text-xs text-muted-foreground font-sans p-3 text-center">No roster members found</p>
                ) : (
                  filteredRoster.map(member => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMember(member.callsign)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors text-sm hover:bg-secondary/50 ${
                        assignedSet.has(member.callsign) ? "bg-primary/10 text-primary" : "text-foreground"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        assignedSet.has(member.callsign)
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border"
                      }`}>
                        {assignedSet.has(member.callsign) && <span className="text-[10px] leading-none">✓</span>}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-display font-bold text-xs uppercase tracking-wide truncate">{member.callsign}</span>
                        {(member.rank || member.role) && (
                          <span className="text-[10px] text-muted-foreground font-sans truncate">
                            {[member.rank, member.role].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-border sticky bottom-0 bg-card">
          <button onClick={onClose}
            className="flex-1 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground font-display font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded transition-all">
            Cancel
          </button>
          <button onClick={() => onSave(draft)}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded transition-all flex items-center justify-center gap-2">
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tree Node ────────────────────────────────────────────────────────────────

function OrbatTreeNode({
  node,
  onUpdate,
  onDelete,
  onAddChild,
  depth = 0,
  isRoot = false,
  readOnly = false,
  roster,
  standard,
  affiliation,
}: {
  node: OrbatNode;
  onUpdate: (updated: OrbatNode) => void;
  onDelete: () => void;
  onAddChild: (parentId: string) => void;
  depth?: number;
  isRoot?: boolean;
  readOnly?: boolean;
  roster: RosterMember[];
  standard: string;
  affiliation: string;
}) {
  const [editing, setEditing] = useState(false);
  const [collapsed, setCollapsed] = useState(node.collapsed ?? false);

  const unitType = NATO_UNIT_TYPES.find(u => u.id === node.unitType);
  const echelon = NATO_ECHELONS.find(e => e.id === node.echelon);
  const hasChildren = node.children.length > 0;
  const affiliationData = AFFILIATIONS.find(a => a.id === affiliation) ?? AFFILIATIONS[0];

  const handleSave = (updated: OrbatNode) => { onUpdate(updated); setEditing(false); };
  const updateChild = (idx: number, updated: OrbatNode) => {
    const children = [...node.children]; children[idx] = updated; onUpdate({ ...node, children });
  };
  const deleteChild = (idx: number) => {
    onUpdate({ ...node, children: node.children.filter((_, i) => i !== idx) });
  };

  const assigned = node.assignedMembers ?? [];

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex flex-col items-center group">
        {/* Symbol box */}
        <div
          className={`relative flex flex-col items-center select-none transition-all duration-150 ${
            depth === 0 ? "scale-110" : ""
          } ${!readOnly ? "cursor-pointer" : "cursor-default"}`}
          onClick={() => !readOnly && setEditing(true)}
        >
          <MilSymbol
            unitType={node.unitType}
            echelon={node.echelon}
            standard={standard}
            affiliation={affiliation}
            size={depth === 0 ? 60 : 48}
          />
        </div>

        {/* Labels */}
        <div className="text-center mt-1 max-w-[120px]">
          <div className="text-xs font-display font-bold text-foreground leading-tight truncate">{node.name}</div>
          {node.callsign && (
            <div className="text-[10px] font-sans truncate" style={{ color: affiliationData.color }}>
              {node.callsign}
            </div>
          )}
          <div className="text-[9px] text-muted-foreground font-sans truncate">
            {echelon?.label} · {unitType?.label}
          </div>
          <div className="text-[9px] text-muted-foreground font-sans">{node.slots} slots</div>

          {/* Assigned members list */}
          {assigned.length > 0 && (
            <div className="mt-1.5 flex flex-col items-center gap-0.5">
              <div className="w-full h-px bg-border/60 mb-0.5" />
              {assigned.map((callsign, i) => (
                <div
                  key={i}
                  className="text-[9px] font-display font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-sm"
                  style={{ color: affiliationData.color, backgroundColor: affiliationData.color + "15" }}
                >
                  {callsign}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit controls (non-readOnly) */}
        {!readOnly && (
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
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
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      {hasChildren && (
        <button onClick={() => setCollapsed(c => !c)} className="mt-1 text-muted-foreground hover:text-foreground transition-colors">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Children */}
      {hasChildren && !collapsed && (
        <div className="relative mt-0 pt-4">
          <div className="absolute top-0 left-1/2 -translate-x-px w-px h-4 bg-border" />
          {node.children.length > 1 && (
            <div className="absolute top-4 bg-border"
              style={{ left: `calc(${100 / (node.children.length * 2)}%)`, right: `calc(${100 / (node.children.length * 2)}%)`, height: "1px" }} />
          )}
          <div className="flex gap-6 items-start">
            {node.children.map((child, idx) => (
              <div key={child.id} className="relative flex flex-col items-center">
                <div className="w-px h-4 bg-border" />
                <OrbatTreeNode
                  node={child}
                  onUpdate={u => updateChild(idx, u)}
                  onDelete={() => deleteChild(idx)}
                  onAddChild={onAddChild}
                  depth={depth + 1}
                  readOnly={readOnly}
                  roster={roster}
                  standard={standard}
                  affiliation={affiliation}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && !readOnly && (
        <NodeEditor
          node={node}
          roster={roster}
          standard={standard}
          affiliation={affiliation}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface OrbatBuilderProps {
  value?: string;
  onChange?: (json: string) => void;
  readOnly?: boolean;
  roster?: RosterMember[];
  groupName?: string;
}

const DEFAULT_ORBAT: OrbatNode = {
  id: generateId(),
  name: "HQ Element",
  callsign: "COMMAND",
  unitType: "hq",
  echelon: "battalion",
  slots: 4,
  assignedMembers: [],
  children: [],
};

interface OrbatSettings {
  standard: string;
  affiliation: string;
}

const DEFAULT_SETTINGS: OrbatSettings = { standard: "APP6", affiliation: "friendly" };

export default function OrbatBuilder({ value, onChange, readOnly = false, roster = [], groupName }: OrbatBuilderProps) {
  const parseData = (): { tree: OrbatNode; settings: OrbatSettings } => {
    try {
      if (value) {
        const parsed = JSON.parse(value);
        // Support both plain tree (legacy) and new { tree, settings } format
        if (parsed.tree && parsed.settings) {
          return { tree: parsed.tree, settings: parsed.settings };
        }
        // Legacy format: just a tree node
        if (parsed.id) {
          return { tree: parsed, settings: DEFAULT_SETTINGS };
        }
      }
    } catch {}
    return { tree: { ...DEFAULT_ORBAT, id: generateId() }, settings: DEFAULT_SETTINGS };
  };

  const initial = parseData();
  const [tree, setTree] = useState<OrbatNode>(initial.tree);
  const [settings, setSettings] = useState<OrbatSettings>(initial.settings);
  const [zoom, setZoom] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const emitChange = useCallback((newTree: OrbatNode, newSettings: OrbatSettings) => {
    onChange?.(JSON.stringify({ tree: newTree, settings: newSettings }));
  }, [onChange]);

  const updateTree = useCallback((updated: OrbatNode) => {
    setTree(updated);
    emitChange(updated, settings);
  }, [settings, emitChange]);

  const updateSettings = (newSettings: OrbatSettings) => {
    setSettings(newSettings);
    emitChange(tree, newSettings);
  };

  const exportOrbat = () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) return;

    // Capture the current ORBAT canvas HTML (milsymbol SVGs are inline already)
    const canvasEl = containerRef.current?.querySelector('[data-orbat-canvas]');
    const canvasHTML = canvasEl ? canvasEl.innerHTML : '';

    const affiliationColor = AFFILIATIONS.find(a => a.id === settings.affiliation)?.color ?? '#006ba6';
    const standardLabel = SYMBOLOGY_STANDARDS.find(s => s.id === settings.standard)?.label ?? 'NATO APP-6';
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
    body {
      background: #ffffff;
      color: #1a1a1a;
      font-family: 'Inter', Arial, sans-serif;
      padding: 32px 40px;
      min-height: 100vh;
    }

    /* Header */
    .orbat-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 3px solid ${affiliationColor};
      padding-bottom: 16px;
      margin-bottom: 32px;
    }
    .orbat-title {
      font-family: 'Oswald', sans-serif;
      font-size: 32px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #111;
    }
    .orbat-subtitle {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      color: #666;
      margin-top: 4px;
    }
    .orbat-meta {
      text-align: right;
      font-size: 11px;
      color: #888;
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
    }
    .orbat-meta strong { color: #444; }

    /* Classification bar */
    .classification {
      text-align: center;
      font-family: 'Oswald', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #fff;
      background: ${affiliationColor};
      padding: 4px 12px;
      margin-bottom: 24px;
      display: inline-block;
      border-radius: 2px;
    }

    /* Canvas */
    .orbat-canvas {
      overflow-x: auto;
      display: flex;
      justify-content: center;
      padding: 16px 0 40px;
    }

    /* Tree structure — preserve flex layout from the component */
    .orbat-canvas * {
      font-family: 'Inter', Arial, sans-serif !important;
    }

    /* Override dark theme colors for print */
    .orbat-canvas [class*="text-muted"] { color: #555 !important; }
    .orbat-canvas [class*="text-foreground"] { color: #111 !important; }
    .orbat-canvas [class*="bg-background"] { background: transparent !important; }
    .orbat-canvas [class*="bg-card"] { background: transparent !important; }
    .orbat-canvas [class*="bg-secondary"] { background: #f5f5f5 !important; }
    .orbat-canvas [class*="border-border"] { border-color: #ddd !important; }

    /* Fix connector lines */
    .orbat-canvas .bg-border { background-color: #999 !important; }
    .orbat-canvas .w-px { background-color: #999 !important; }

    /* Member name chips */
    .orbat-canvas [style*="15"] { background-color: rgba(0,107,166,0.08) !important; }

    /* Footer */
    .orbat-footer {
      margin-top: 48px;
      padding-top: 12px;
      border-top: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #aaa;
      font-family: 'Inter', sans-serif;
    }

    @media print {
      body { padding: 16px 20px; }
      @page { size: A3 landscape; margin: 12mm; }
    }
  </style>
</head>
<body>
  <div class="orbat-header">
    <div>
      <div class="orbat-title">${title}</div>
      <div class="orbat-subtitle">Order of Battle</div>
    </div>
    <div class="orbat-meta">
      <strong>Standard:</strong> ${standardLabel}<br/>
      <strong>Generated:</strong> ${dateStr}<br/>
      <strong>Classification:</strong> UNCLASSIFIED
    </div>
  </div>

  <div class="orbat-canvas">
    ${canvasHTML}
  </div>

  <div class="orbat-footer">
    <span>${title} — Order of Battle</span>
    <span>UNCLASSIFIED // ${standardLabel} // ${dateStr}</span>
  </div>

  <script>
    // Remove any edit controls (hover buttons) before printing
    document.querySelectorAll('.group .absolute').forEach(el => el.remove());
    // Wait for SVGs / fonts to settle then print
    window.addEventListener('load', () => setTimeout(() => window.print(), 600));
  </script>
</body>
</html>`);
    printWindow.document.close();
  };

  const addChildTo = (parentId: string, root: OrbatNode): OrbatNode => {
    if (root.id === parentId) {
      const newChild: OrbatNode = { id: generateId(), name: "New Unit", unitType: "infantry", echelon: "platoon", slots: 20, assignedMembers: [], children: [] };
      return { ...root, children: [...root.children, newChild] };
    }
    return { ...root, children: root.children.map(c => addChildTo(parentId, c)) };
  };

  const countUnits = (node: OrbatNode): number => 1 + node.children.reduce((a, c) => a + countUnits(c), 0);
  const countSlots = (node: OrbatNode): number => node.slots + node.children.reduce((a, c) => a + countSlots(c), 0);
  const countAssigned = (node: OrbatNode): number =>
    (node.assignedMembers?.length ?? 0) + node.children.reduce((a, c) => a + countAssigned(c), 0);

  const currentAffiliation = AFFILIATIONS.find(a => a.id === settings.affiliation) ?? AFFILIATIONS[0];
  const currentStandard = SYMBOLOGY_STANDARDS.find(s => s.id === settings.standard) ?? SYMBOLOGY_STANDARDS[0];

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/20 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-display font-black uppercase tracking-widest text-foreground">ORBAT Builder</span>
          <span className="text-[10px] font-sans text-muted-foreground">{currentStandard.flag} {currentStandard.label}</span>
          <div
            className="w-3 h-3 rounded-full border border-white/20 shrink-0"
            style={{ backgroundColor: currentAffiliation.color }}
            title={currentAffiliation.label}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Stats */}
          <span className="text-[10px] text-muted-foreground font-sans hidden sm:block">
            {countUnits(tree)} units · {countSlots(tree)} slots
            {countAssigned(tree) > 0 && ` · ${countAssigned(tree)} assigned`}
          </span>

          {/* Zoom */}
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
            className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors" title="Zoom out">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-muted-foreground font-sans w-9 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.15))}
            className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors" title="Zoom in">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Settings */}
          {!readOnly && (
            <button onClick={() => setShowSettings(s => !s)}
              className={`p-1.5 rounded border transition-colors ${showSettings ? "bg-primary/10 border-primary/40 text-primary" : "hover:bg-secondary border-transparent text-muted-foreground hover:text-foreground"}`}
              title="Symbology & Colour settings">
              <Palette className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Export / Print */}
          <button
            onClick={exportOrbat}
            className="p-1.5 hover:bg-secondary rounded border border-transparent hover:border-border text-muted-foreground hover:text-foreground transition-colors"
            title="Export / Print ORBAT">
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && !readOnly && (
        <div className="px-4 py-3 border-b border-border bg-secondary/10 flex flex-wrap gap-6">
          {/* Standard */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <label className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Flag className="w-3 h-3" /> Symbology Standard
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SYMBOLOGY_STANDARDS.map(s => (
                <button key={s.id} onClick={() => updateSettings({ ...settings, standard: s.id })}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[11px] font-sans transition-all ${
                    settings.standard === s.id
                      ? "bg-primary/15 border-primary/50 text-primary font-bold"
                      : "border-border hover:border-border/80 text-muted-foreground hover:text-foreground bg-background"
                  }`}>
                  <span>{s.flag}</span> {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Affiliation / Colour */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Palette className="w-3 h-3" /> Symbol Colour
            </label>
            <div className="flex gap-2">
              {AFFILIATIONS.map(a => (
                <button key={a.id} onClick={() => updateSettings({ ...settings, affiliation: a.id })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded border text-[11px] font-sans transition-all ${
                    settings.affiliation === a.id
                      ? "border-white/30 font-bold text-white"
                      : "border-border hover:border-border/80 text-muted-foreground hover:text-foreground bg-background"
                  }`}
                  style={settings.affiliation === a.id ? { backgroundColor: a.color, borderColor: a.color } : {}}>
                  <div className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: a.color }} />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div ref={containerRef} className="overflow-auto p-8 min-h-[400px] bg-background">
        <div data-orbat-canvas style={{ display: "contents" }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.15s ease" }}>
          <OrbatTreeNode
            node={tree}
            onUpdate={updateTree}
            onDelete={() => {}}
            onAddChild={(parentId) => updateTree(addChildTo(parentId, tree))}
            isRoot
            readOnly={readOnly}
            roster={roster}
            standard={settings.standard}
            affiliation={settings.affiliation}
          />
        </div></div>
      </div>
    </div>
  );
}
