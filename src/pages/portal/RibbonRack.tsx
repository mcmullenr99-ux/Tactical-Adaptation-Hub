import { useState, useEffect, useMemo } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { useAuth } from "@/components/auth/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { useToast } from "@/hooks/use-toast";
import { getRibbonModifiers } from "@/lib/ribbonModifiers";
import { Loader2, Award, Save, Rows3, Crown, Info, Search, ChevronLeft, ChevronRight } from "lucide-react";

function ribbonImageUrl(award: any, modifierUrl?: string): string {
  if (modifierUrl) return modifierUrl;
  if (award.award_image_url) return award.award_image_url;
  return "";
}

function CssRibbon({ award, size = 40 }: { award: any; size?: number }) {
  const c1 = award.ribbon_color_1 ?? "#4a90e2";
  const c2 = award.ribbon_color_2 ?? c1;
  const c3 = award.ribbon_color_3 ?? c2;
  const gradient = `linear-gradient(to right, ${c1} 0%, ${c1} 33%, ${c2} 33%, ${c2} 66%, ${c3} 66%, ${c3} 100%)`;
  return (
    <div style={{ width: size * 1.6, height: size * 0.55, background: gradient, borderRadius: 2, flexShrink: 0 }}
      title={award.award_name ?? award.name ?? ""} />
  );
}

function RibbonImage({ award, size = 40, modifierUrl }: { award: any; size?: number; modifierUrl?: string }) {
  const url = ribbonImageUrl(award, modifierUrl);
  if (!url) return <CssRibbon award={award} size={size} />;
  return (
    <img src={url} alt={award.award_name ?? award.name ?? "ribbon"}
      style={{ width: size * 1.6, height: size * 0.55, objectFit: "fill", borderRadius: 2, flexShrink: 0 }}
      onError={(e: any) => { e.currentTarget.style.display = "none"; }}
      title={award.award_name ?? award.name ?? ""} />
  );
}

const RIBBONS_PER_PAGE = 30;

export default function RibbonRack() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading]             = useState(true);
  const [isPro, setIsPro]                 = useState<boolean | null>(null);
  const [groups, setGroups]               = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [allRibbons, setAllRibbons]       = useState<any[]>([]);
  const [barIds, setBarIds]               = useState<string[]>([]);
  const [barMods, setBarMods]             = useState<Record<string, Record<string, string>>>({});
  const [dragging, setDragging]           = useState<string | null>(null);
  const [dragOver, setDragOver]           = useState<string | null>(null);
  const [saving, setSaving]               = useState(false);
  const [hovered, setHovered]             = useState<string | null>(null);
  const [localRoster, setLocalRoster]     = useState<any | null>(null);

  // Search / filter / pagination
  const [search, setSearch]               = useState("");
  const [filterCountry, setFilterCountry] = useState("all");
  const [page, setPage]                   = useState(1);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    apiFetch<any[]>("/milsimGroups?path=mine/memberships")
      .then(data => {
        const g = data ?? [];
        setGroups(g);
        if (g.length > 0) setSelectedGroupId(g[0].id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!selectedGroupId || !user?.id) return;
    setLoading(true);
    const go = async () => {
      try {
        const proData = await apiFetch<any>(`/getProStatus?path=status&group_id=${selectedGroupId}`);
        setIsPro(!!proData.is_pro);
        if (!proData.is_pro) { setLoading(false); return; }

        const [awardsData, rosterData] = await Promise.all([
          apiFetch<any>(`/milsimAwards?path=member_awards&group_id=${selectedGroupId}&user_id=${user.id}`),
          apiFetch<any>(`/milsimGroups?path=roster_member&group_id=${selectedGroupId}&user_id=${user.id}`),
        ]);

        // Show all awarded items — medals, ribbons, orders, decorations all belong in the rack
        const ribbons = awardsData.awards ?? [];
        setAllRibbons(ribbons);

        const member = rosterData.roster_member ?? null;
        setLocalRoster(member);
        const savedOrder: string[] = member?.ribbon_bar_order ?? [];
        const savedMods: Record<string, Record<string, string>> = member?.ribbon_bar_mods ?? {};
        const validIds = savedOrder.filter((id: string) => ribbons.some((r: any) => r.id === id));
        setBarIds(validIds);
        setBarMods(savedMods);
      } catch { toast({ title: "Failed to load ribbons", variant: "destructive" }); }
      setLoading(false);
    };
    go();
  }, [selectedGroupId, user?.id]);

  // Derive unique countries from awarded ribbons
  const countries = useMemo(() => {
    const set = new Set<string>();
    allRibbons.forEach(r => { if (r.source_country) set.add(r.source_country); });
    return Array.from(set).sort();
  }, [allRibbons]);

  // Filtered + paged ribbons for the picker section
  const filteredRibbons = useMemo(() => {
    const q = search.toLowerCase();
    return allRibbons.filter(r => {
      if (filterCountry !== "all" && r.source_country !== filterCountry) return false;
      if (q && !(r.award_name ?? r.name ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allRibbons, search, filterCountry]);

  const totalPages = Math.ceil(filteredRibbons.length / RIBBONS_PER_PAGE);
  const pagedRibbons = filteredRibbons.slice((page - 1) * RIBBONS_PER_PAGE, page * RIBBONS_PER_PAGE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleCountry = (v: string) => { setFilterCountry(v); setPage(1); };

  const toggleInBar = (id: string) =>
    setBarIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleDragStart = (id: string) => setDragging(id);
  const handleDragEnd   = () => { setDragging(null); setDragOver(null); };
  const handleDragOver  = (e: any, id: string) => { e.preventDefault(); setDragOver(id); };
  const handleDrop      = (targetId: string) => {
    if (!dragging || dragging === targetId) { setDragging(null); setDragOver(null); return; }
    setBarIds(prev => {
      const arr = [...prev];
      const fi = arr.indexOf(dragging), ti = arr.indexOf(targetId);
      if (fi === -1 || ti === -1) return prev;
      arr.splice(fi, 1); arr.splice(ti, 0, dragging);
      return arr;
    });
    setDragging(null); setDragOver(null);
  };

  const setMod = (ribbonId: string, modName: string, value: string) =>
    setBarMods(prev => ({ ...prev, [ribbonId]: { ...(prev[ribbonId] ?? {}), [modName]: value } }));
  const clearMod = (ribbonId: string, modName: string) =>
    setBarMods(prev => { const u = { ...(prev[ribbonId] ?? {}) }; delete u[modName]; return { ...prev, [ribbonId]: u }; });

  const getModifierUrl = (ribbon: any): string | undefined => {
    const mods = barMods[ribbon.id];
    if (!mods) return undefined;
    const baseUrl = ribbonImageUrl(ribbon);
    const modifiers = getRibbonModifiers(baseUrl);
    for (const mod of modifiers) {
      if (mod.type === "select" && mod.options) {
        const sel = mods[mod.name];
        if (sel) { const opt = mod.options.find(o => o.value === sel); if (opt?.url) return opt.url; }
      }
    }
    for (const mod of modifiers) {
      if (mod.type === "checkbox" && mod.affectsImage && mods[mod.name] === "1") return mod.variantUrl;
    }
    return undefined;
  };

  const saveBar = async () => {
    let rosterId = localRoster?.id;
    if (!rosterId && selectedGroupId && user?.id) {
      try {
        const rd = await apiFetch<any>(`/milsimGroups?path=roster_member&group_id=${selectedGroupId}&user_id=${user.id}`);
        const member = rd?.roster_member ?? null;
        if (member) { setLocalRoster(member); rosterId = member.id; }
      } catch {}
    }
    if (!rosterId) { toast({ title: "No roster entry found — are you on this unit's roster?", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await apiFetch("/milsimGroups?path=update_roster_member", {
        method: "POST",
        body: JSON.stringify({ roster_id: rosterId, ribbon_bar_order: barIds, ribbon_bar_mods: barMods }),
      });
      toast({ title: "Ribbon bar saved! ✓" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.message ?? "Unknown error", variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) return (
    <PortalLayout>
      <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    </PortalLayout>
  );

  if (groups.length === 0) return (
    <PortalLayout>
      <div className="text-center py-24 space-y-3">
        <Award className="w-12 h-12 mx-auto opacity-20" />
        <p className="font-display font-black text-sm uppercase tracking-widest text-muted-foreground">No unit membership</p>
        <p className="text-xs text-muted-foreground font-sans">You need to be a member of a unit to use the ribbon rack.</p>
      </div>
    </PortalLayout>
  );

  if (isPro === false) return (
    <PortalLayout>
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <Crown className="w-12 h-12 text-yellow-400/40" />
        <p className="font-display font-black text-sm uppercase tracking-widest text-muted-foreground">Commander Pro Required</p>
        <p className="text-xs text-muted-foreground font-sans max-w-sm">
          The Ribbon Bar builder is a Commander Pro feature. Your unit commander can upgrade at{" "}
          <a href="/commander-pro" className="underline text-primary">commander-pro</a>.
        </p>
      </div>
    </PortalLayout>
  );

  const barRibbons = barIds.map(id => allRibbons.find(r => r.id === id)).filter(Boolean);
  const rows: any[][] = [];
  for (let i = 0; i < barRibbons.length; i += 5) rows.push(barRibbons.slice(i, i + 5));

  return (
    <PortalLayout>
      <div className="mb-8 pb-6 border-b border-border flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 text-primary rounded flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-2xl uppercase tracking-widest">Ribbon Bar</h1>
              <span className="text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 rounded flex items-center gap-1">
                <Crown className="w-2.5 h-2.5" /> Pro
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-sans">Build your service ribbon rack — drag to reorder, select variants &amp; clasps per ribbon</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {groups.length > 1 && (
            <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="mf-input text-xs">
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
          <button onClick={saveBar} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded font-display text-xs uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Bar
          </button>
        </div>
      </div>

      <div className="space-y-8 max-w-4xl">

        {/* Live Ribbon Rack */}
        <div className="border border-primary/30 rounded-lg overflow-hidden">
          <div className="bg-primary/10 border-b border-primary/20 px-5 py-3 flex items-center gap-2">
            <Rows3 className="w-4 h-4 text-primary" />
            <p className="font-display font-black text-xs uppercase tracking-widest text-primary">Your Ribbon Rack</p>
            <span className="text-xs text-muted-foreground font-sans">— {barRibbons.length} ribbon{barRibbons.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="p-5 bg-card min-h-[80px]">
            {barRibbons.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-border rounded-lg">
                <Rows3 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs font-sans text-muted-foreground">No ribbons in your rack yet — select from your awards below</p>
              </div>
            ) : (
              <div className="space-y-0.5 inline-block">
                {rows.map((row, ri) => (
                  <div key={ri} className="flex gap-0.5">
                    {row.map((ribbon: any) => (
                      <div key={ribbon.id} draggable
                        onDragStart={() => handleDragStart(ribbon.id)} onDragEnd={handleDragEnd}
                        onDragOver={e => handleDragOver(e, ribbon.id)} onDrop={() => handleDrop(ribbon.id)}
                        className={`relative cursor-grab active:cursor-grabbing transition-all ${dragging === ribbon.id ? "opacity-40" : ""} ${dragOver === ribbon.id ? "ring-2 ring-primary" : ""}`}
                        title={ribbon.award_name ?? ribbon.name ?? ""}
                        onMouseEnter={() => setHovered(ribbon.id)} onMouseLeave={() => setHovered(null)}>
                        (() => { const r = getModifierResult(ribbon); return <RibbonImage award={ribbon} size={52} modifierUrl={r.url} overlayUrl={r.overlayUrl} />; })()
                        {hovered === ribbon.id && (
                          <button onClick={() => toggleInBar(ribbon.id)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center hover:bg-red-600 z-10"
                            title="Remove from rack">×</button>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Available Awards — with search, country filter, pagination */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-secondary/40 border-b border-border px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <p className="font-display font-black text-xs uppercase tracking-widest">Awarded Ribbons</p>
              <span className="text-xs text-muted-foreground font-sans">({allRibbons.length} granted)</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search ribbons..."
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  className="text-xs bg-background border border-border rounded pl-6 pr-2 py-1 font-sans w-40 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {/* Country filter */}
              {countries.length > 0 && (
                <select
                  value={filterCountry}
                  onChange={e => handleCountry(e.target.value)}
                  className="text-xs bg-background border border-border rounded px-2 py-1 font-sans focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Countries</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="p-5">
            {allRibbons.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-lg">
                <Award className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs font-sans text-muted-foreground">No ribbons have been awarded to you yet</p>
                <p className="text-[10px] text-muted-foreground/60 font-sans mt-1">Your commander issues ribbons from the unit Awards section</p>
              </div>
            ) : (
              <>
                {filteredRibbons.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-border rounded-lg mb-4">
                    <p className="text-xs font-sans text-muted-foreground">No ribbons match your search</p>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {pagedRibbons.map((ribbon: any) => {
                    const inBar = barIds.includes(ribbon.id);
                    const baseUrl = ribbonImageUrl(ribbon);
                    const modifiers = inBar ? getRibbonModifiers(baseUrl) : [];
                    const currentMods = barMods[ribbon.id] ?? {};
                    const modResult = inBar ? getModifierResult(ribbon) : {};
                    const modUrl = modResult.url;
                    const modOverlay = modResult.overlayUrl;
                    return (
                      <div key={ribbon.id}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                          inBar ? "border-primary/60 bg-primary/10 ring-1 ring-primary/30" : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                        }`}>
                        <button className="flex flex-col items-center gap-2 w-full" onClick={() => toggleInBar(ribbon.id)}>
                          <RibbonImage award={ribbon} size={44} modifierUrl={modUrl} overlayUrl={modOverlay} />
                          <div className="text-center">
                            <p className="text-[10px] font-display font-bold uppercase tracking-wider leading-tight line-clamp-2">
                              {ribbon.award_name ?? ribbon.name ?? "Ribbon"}
                            </p>
                            {ribbon.source_country && (
                              <p className="text-[9px] text-muted-foreground font-sans mt-0.5">{ribbon.source_country}</p>
                            )}
                            {ribbon.reason && (
                              <p className="text-[9px] text-muted-foreground font-sans mt-0.5 line-clamp-1 italic">{ribbon.reason}</p>
                            )}
                          </div>
                          <span className={`text-[9px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                            inBar ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                          }`}>
                            {inBar ? "In Rack ✓" : "Add to Rack"}
                          </span>
                        </button>

                        {/* Modifiers — only when in rack */}
                        {inBar && modifiers.length > 0 && (
                          <div className="w-full border-t border-primary/20 pt-2 space-y-1.5" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                            <p className="text-[8px] font-display font-bold uppercase tracking-widest text-primary mb-1">Variants &amp; Clasps</p>
                            {modifiers.map((mod) => (
                              <div key={mod.name} className="flex flex-col gap-0.5">
                                {mod.type === "select" && mod.options && (
                                  <>
                                    <label className="text-[8px] text-muted-foreground font-sans uppercase tracking-wider">{mod.label}</label>
                                    <select
                                      value={currentMods[mod.name] ?? mod.options[0].value}
                                      onChange={e => { e.stopPropagation(); setMod(ribbon.id, mod.name, e.target.value); }}
                                      className="text-[9px] bg-background border border-border rounded px-1 py-0.5 w-full font-sans">
                                      {mod.options.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                      ))}
                                    </select>
                                  </>
                                )}
                                {mod.type === "checkbox" && (
                                  <label className="flex items-center gap-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                                    <input type="checkbox" checked={currentMods[mod.name] === "1"}
                                      onChange={e => { e.stopPropagation(); e.target.checked ? setMod(ribbon.id, mod.name, "1") : clearMod(ribbon.id, mod.name); }}
                                      className="w-3 h-3 accent-primary" />
                                    <span className="text-[9px] text-muted-foreground font-sans">{mod.label}</span>
                                  </label>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-display uppercase tracking-widest border border-border rounded hover:bg-secondary disabled:opacity-40 transition-colors">
                      <ChevronLeft className="w-3 h-3" /> Prev
                    </button>
                    <div className="flex gap-1 flex-wrap justify-center">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                        <button key={pg} onClick={() => setPage(pg)}
                          className={`w-7 h-7 text-xs font-display rounded transition-colors ${
                            pg === page ? "bg-primary text-primary-foreground" : "border border-border hover:bg-secondary text-muted-foreground"
                          }`}>{pg}</button>
                      ))}
                    </div>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-display uppercase tracking-widest border border-border rounded hover:bg-secondary disabled:opacity-40 transition-colors">
                      Next <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground font-sans text-center mt-3">
                  Showing {pagedRibbons.length} of {filteredRibbons.length} ribbons
                  {filterCountry !== "all" || search ? ` matching filters` : ""}
                  {totalPages > 1 ? ` — page ${page} of ${totalPages}` : ""}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Help */}
        <div className="flex items-start gap-3 p-4 bg-secondary/30 border border-border rounded-lg">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground font-sans space-y-1">
            <p><strong className="text-foreground">Adding to rack</strong> — Click any ribbon to toggle it in/out of your rack. Click the × on hover in the rack to remove it.</p>
            <p><strong className="text-foreground">Variants &amp; clasps</strong> — When a ribbon is in your rack, dropdowns appear below it if variants exist (e.g. MID, clasps, bars).</p>
            <p><strong className="text-foreground">Saving</strong> — Click <strong className="text-foreground">Save Bar</strong> to persist. Your rack displays on your public service profile.</p>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
