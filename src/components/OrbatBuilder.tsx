/**
 * NATO ORBAT Builder
 * NATO APP-6 standard. One uniform system. No switcher.
 */

import { useState, useCallback, useEffect, useRef } from "react";
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

// ─── Cached milsymbol loader ──────────────────────────────────────────────────

let msCache: any = null;
let msPromise: Promise<any> | null = null;

function loadMilsymbol(): Promise<any> {
  if (msCache) return Promise.resolve(msCache);
  if (!msPromise) {
    msPromise = import("milsymbol").then((ms: any) => {
      msCache = ms.default ?? ms;
      return msCache;
    });
  }
  return msPromise;
}

// ─── milsymbol Symbol ─────────────────────────────────────────────────────────

function MilSymbol({ unitType, echelon, size = 56 }: { unitType: string; echelon: string; size?: number }) {
  const [svg, setSvg] = useState<string>("");
  const echelonData = NATO_ECHELONS.find(e => e.id === echelon);

  useEffect(() => {
    let cancelled = false;
    loadMilsymbol().then(MS => {
      if (cancelled) return;
      let sidc = UNIT_SIDC_MAP[unitType] ?? UNIT_SIDC_MAP.infantry;
      sidc = sidc.slice(0, 8) + (echelonData?.echelonCode ?? "14") + sidc.slice(10);
      try {
        const sym = new MS.Symbol(sidc, { size, standard: "APP6", fillOpacity: 1 });
        setSvg(sym.asSVG());
      } catch {
        try {
          const sym = new MS.Symbol(UNIT_SIDC_MAP[unitType] ?? UNIT_SIDC_MAP.infantry, { size, standard: "APP6", fillOpacity: 1 });
          setSvg(sym.asSVG());
        } catch { setSvg(""); }
      }
    }).catch(() => setSvg(""));
    return () => { cancelled = true; };
  }, [unitType, echelon, size]);

  if (!svg) {
    return (
      <div className="border border-primary/40 bg-primary/10 flex items-center justify-center font-display font-bold text-xs rounded text-primary"
        style={{ width: size, height: Math.round(size * 0.75) }}>
        {unitType.slice(0, 3).toUpperCase()}
      </div>
    );
  }

  return (
    <span className="inline-block leading-none" style={{ width: size, height: Math.round(size * 0.75) + 12, overflow: "visible" }}
      dangerouslySetInnerHTML={{ __html: svg }} />
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
