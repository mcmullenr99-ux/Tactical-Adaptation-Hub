/**
 * TacticalPlanner v4.1
 *
 * Architecture:
 *   - <div>    : Map image background (panned/zoomed via CSS transform)
 *   - <canvas> : Transparent overlay — drawing tools, NATO markers, ruler, scale bar
 *
 * Scale system:
 *   Every GameMap has a realSizeM (real-world width in metres).
 *   metersPerPixel = realSizeM / (canvasWidth * zoom)
 *   Ruler measures pixels → converts to metres/km.
 *   Scale bar shows a real-world distance bar that updates with zoom.
 */

import React, {
  useRef, useState, useEffect, useCallback, useMemo,
} from "react";
import ReactDOM from "react-dom";
import {
  Map as MapIcon, Pencil, MousePointer2, MousePointer, Move, Minus, Plus, RotateCcw,
  Trash2, Download, Save, Layers, Compass, Ruler, Settings,
  Circle, Square, ArrowRight, ArrowLeft, ChevronDown, Target, Flag,
  Check, X, Link, MessageSquare, RotateCw, ExternalLink,
  ZoomIn, ZoomOut, Navigation, Crosshair, MapPin, PanelRight, RefreshCw,
} from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToolMode = "pan" | "select" | "draw" | "line" | "arrow" | "rect" | "circle" | "ruler" | "marker" | "bearing" | "arty" | "phase";

type LabelFont = "default" | "marker" | "field" | "intel";

const HAND_FONTS: Record<LabelFont, { css: string; preview: string; label: string }> = {
  default: { css: "bold {sz}px Arial",                              preview: "Arial",            label: "Std"    },
  marker:  { css: "bold {sz}px 'Permanent Marker', cursive",        preview: "'Permanent Marker'", label: "Marker" },
  field:   { css: "bold {sz}px 'Rock Salt', cursive",               preview: "'Rock Salt'",        label: "Field"  },
  intel:   { css: "bold {sz}px 'Caveat', cursive",                  preview: "'Caveat'",           label: "Intel"  },
};

/** Return a canvas font string for the given LabelFont key at a specific pixel size */
function handFont(lf: LabelFont | undefined, sz: number): string {
  const key: LabelFont = lf ?? "default";
  return HAND_FONTS[key].css.replace("{sz}", String(sz));
}

interface Pt { x: number; y: number; }
/** World-space point — metres east (mx) and metres north (my) from map SW corner */
interface WPt { mx: number; my: number; }

interface PlanElement {
  id: string;
  type: "draw" | "line" | "arrow" | "rect" | "circle" | "marker" | "ruler" | "bearing" | "arty" | "phase";
  /** World-space points (metres). ALL new elements use these — canvas coords are derived at draw time. */
  wpts?: WPt[];
  /** World-space centre for rect/circle/arty/marker (metres from SW) */
  wmx?: number; wmy?: number;
  /** World-space size for rect (metres) */
  ww?: number; wh?: number;
  /** World-space radius for circle/arty (metres) */
  wr?: number; wr2?: number;  // wr2 = outer radius for arty
  // Legacy canvas-pixel fields — kept for backward compat with old saved plans
  points?: Pt[];
  x?: number; y?: number;
  w?: number; h?: number;
  r?: number;
  color: string;
  lw: number;
  label?: string;
  labelFont?: LabelFont;
  symbol?: string;
  dashed?: boolean;
  markerColor?: string;
  rotation?: number;
  flip?: boolean;
}

// ─── Map catalogue ─────────────────────────────────────────────────────────────

interface TileConfig {
  mapId: number;        // plan-ops gameMapId (0 if using tileUrlTemplate)
  layerId: number;      // plan-ops gameMapLayerId (0 if using tileUrlTemplate)
  maxZoom: number;      // max tile zoom level
  tileSize: number;     // tile pixel size
  factorX: number;      // metres per pixel at zoom 0
  tileUrlTemplate?: string; // optional: "{z}/{x}/{y}" template e.g. squadmaps.com
}

interface GameMap {
  id: string;
  game: string;
  name: string;
  mapImageUrl: string | null;
  tileConfig?: TileConfig;    // if present, real topographic tiles are available
  northAtBottom?: boolean;    // true when tile Y=0 is south (tiles served with inverted Y axis)
  fallbackColor: string;
  previewColor: string;
  attribution: string;
  openUrl: string;
  realSizeM: number;   // real-world width in metres
  gridCellM: number;   // how many real metres each in-game grid square represents
  gridSystem?: "arma" | "squad" | "numeric"; // grid label convention
  aspectRatio?: number; // w/h if non-square (default 1)
}

const GAME_MAPS: GameMap[] = [
  // ── Arma 3 Vanilla ──────────────────────────────────────────────────────────
  // Altis: 30,720m terrain, 1000m grid squares
  { id:"a3_altis",    game:"Arma 3 — Vanilla", name:"Altis",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/c6c06437c_generated_image.png",
    tileConfig:{ mapId:3, layerId:3, maxZoom:6, tileSize:212, factorX:0.006839, gridSystem:"arma" },
    northAtBottom:false,
    fallbackColor:"#2d3a2e", previewColor:"#4a7c59",
    attribution:"BI Official", openUrl:"https://atlas.plan-ops.fr/maps/arma3/altis/150",
    realSizeM:30720, gridCellM:1000, gridSystem:"arma" },

  // Stratis: 8,192m terrain, 1000m grid squares
  { id:"a3_stratis",  game:"Arma 3 — Vanilla", name:"Stratis",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/ea6747836_generated_image.png",
    tileConfig:{ mapId:104, layerId:104, maxZoom:4, tileSize:226, factorX:0.027475, gridSystem:"arma" },
    northAtBottom:false,
    fallbackColor:"#2d3a2e", previewColor:"#5a8c6a",
    attribution:"BI Official", openUrl:"https://atlas.plan-ops.fr/maps/arma3/stratis/150",
    realSizeM:8192, gridCellM:1000, gridSystem:"arma" },

  // Malden: 12,800m terrain, 1000m grid squares
  { id:"a3_malden",   game:"Arma 3 — Vanilla", name:"Malden",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/2cd515d90_generated_image.png",
    tileConfig:{ mapId:68, layerId:68, maxZoom:5, tileSize:186, factorX:0.01448, gridSystem:"arma" },
    northAtBottom:false,
    fallbackColor:"#2d3a2e", previewColor:"#6a9c7a",
    attribution:"BI Official", openUrl:"https://atlas.plan-ops.fr/maps/arma3/malden/150",
    realSizeM:12800, gridCellM:1000, gridSystem:"arma" },

  // Tanoa: 15,360m terrain, 1000m grid squares
  { id:"a3_tanoa",    game:"Arma 3 — Vanilla", name:"Tanoa",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/de89f0a9c_generated_image.png",
    tileConfig:{ mapId:109, layerId:109, maxZoom:5, tileSize:213, factorX:0.01385, gridSystem:"arma" },
    northAtBottom:false,
    fallbackColor:"#1a3a2a", previewColor:"#3a7a5a",
    attribution:"BI Official", openUrl:"https://atlas.plan-ops.fr/maps/arma3/tanoa/150",
    realSizeM:15360, gridCellM:1000, gridSystem:"arma" },

  // ── Arma 3 Modded ───────────────────────────────────────────────────────────
  // Chernarus: 15,360m terrain, 1000m grid squares (ArmA 2 / A3 CUP)
  { id:"a3_chernarus", game:"Arma 3 — Modded", name:"Chernarus (Summer)",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/c0c3edd32_generated_image.png",
    tileConfig:{ mapId:18, layerId:18, maxZoom:5, tileSize:242, factorX:0.01575, gridSystem:"arma" },
    northAtBottom:false,
    fallbackColor:"#263326", previewColor:"#4a7a55",
    attribution:"BI / CUP", openUrl:"https://atlas.plan-ops.fr/maps/arma3/chernarus/150",
    realSizeM:15360, gridCellM:1000, gridSystem:"arma" },

  // Takistan: 12,800m terrain, 1000m grid squares
  { id:"a3_takistan",  game:"Arma 3 — Modded", name:"Takistan",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/eee40b659_generated_image.png",
    tileConfig:{ mapId:108, layerId:108, maxZoom:5, tileSize:202, factorX:0.01575, gridSystem:"arma" },
    northAtBottom:false,
    fallbackColor:"#3a3020", previewColor:"#7a7040",
    attribution:"BI / CUP", openUrl:"https://atlas.plan-ops.fr/maps/arma3/takistan/150",
    realSizeM:12800, gridCellM:1000, gridSystem:"arma" },

  // Lingor: 10,240m terrain, 1000m grid squares
  { id:"a3_lingor",    game:"Arma 3 — Modded", name:"Lingor",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/665ed628f_generated_image.png",
    tileConfig:{ mapId:66, layerId:66, maxZoom:4, tileSize:256, factorX:0.025, gridSystem:"arma" },
    northAtBottom:false,
    fallbackColor:"#1a3020", previewColor:"#3a6a40",
    attribution:"IceBreakr", openUrl:"https://atlas.plan-ops.fr/maps/arma3/lingor/150",
    realSizeM:10240, gridCellM:1000, gridSystem:"arma" },

  // Fallujah (A3): 10,240m terrain, 1000m grid squares
  { id:"a3_fallujah",  game:"Arma 3 — Modded", name:"Fallujah",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/af03413de_generated_image.png",
    tileConfig:{ mapId:39, layerId:39, maxZoom:5, tileSize:323, factorX:0.0315, gridSystem:"arma" },
    northAtBottom:false,
    fallbackColor:"#3a2a10", previewColor:"#8a7040",
    attribution:"Team Ahoy", openUrl:"https://atlas.plan-ops.fr/maps/arma3/fallujah/150",
    realSizeM:10240, gridCellM:1000, gridSystem:"arma" },

  // Lythium: 20,480m terrain, 1000m grid squares
  { id:"a3_lythium",   game:"Arma 3 — Modded", name:"Lythium",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/e61239f17_generated_image.png",
    tileConfig:{ mapId:67, layerId:67, maxZoom:5, tileSize:287, factorX:0.013985, gridSystem:"arma" },
    northAtBottom:false,
    fallbackColor:"#2a2010", previewColor:"#7a6030",
    attribution:"Jakerod", openUrl:"https://atlas.plan-ops.fr/maps/arma3/lythium/150",
    realSizeM:20480, gridCellM:1000, gridSystem:"arma" },

  // ── DayZ Official ────────────────────────────────────────────────────────────
  // Chernarus+: 15,360m terrain (2048 cells × 7.5m), 1000m grid squares
  { id:"dz_chernarus", game:"DayZ — Official", name:"Chernarus+",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/b0c3b721c_generated_image.png",
    tileConfig:{ mapId:0, layerId:0, maxZoom:7, tileSize:256, factorX:0, tileUrlTemplate:"https://static.xam.nu/dayz/maps/chernarusplus/1.27/topographic/{z}/{x}/{y}.webp", gridSystem:"numeric" },
    fallbackColor:"#263326", previewColor:"#4a7a55",
    attribution:"dayz.xam.nu", openUrl:"https://www.izurvive.com/",
    realSizeM:15360, gridCellM:1000, gridSystem:"numeric" },

  // Livonia: 12,800m terrain (confirmed via iZurvive), 1000m grid squares
  { id:"dz_livonia",   game:"DayZ — Official", name:"Livonia",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/e4965a2d7_generated_image.png",
    tileConfig:{ mapId:0, layerId:0, maxZoom:7, tileSize:256, factorX:0, tileUrlTemplate:"https://static.xam.nu/dayz/maps/livonia/1.27/topographic/{z}/{x}/{y}.webp", gridSystem:"numeric" },
    fallbackColor:"#2a3320", previewColor:"#5a7050",
    attribution:"dayz.xam.nu", openUrl:"https://www.izurvive.com/livonia/",
    realSizeM:12800, gridCellM:1000, gridSystem:"numeric" },

  // Sakhal: 12,800m terrain (volcanic island, 1024 cells × 12.5m), 1000m grid squares
  { id:"dz_sakhal",    game:"DayZ — Official", name:"Sakhal",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/0ad0c7d43_generated_image.png",
    tileConfig:{ mapId:0, layerId:0, maxZoom:5, tileSize:256, factorX:0, tileUrlTemplate:"https://static.xam.nu/dayz/maps/sakhal/1.27/topographic/{z}/{x}/{y}.webp", gridSystem:"numeric" },
    fallbackColor:"#1c2030", previewColor:"#3a4a6a",
    attribution:"dayz.xam.nu", openUrl:"https://www.izurvive.com/sakhal/",
    realSizeM:9144, gridCellM:1000, gridSystem:"numeric" },

  // ── DayZ Community ────────────────────────────────────────────────────────────
  // Namalsk: 7,680m terrain (ArmA 2 origin: 1024 cells × 7.5m), 1000m grid squares
  { id:"dz_namalsk",   game:"DayZ — Community", name:"Namalsk",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/3dab9fe42_generated_image.png",
    tileConfig:{ mapId:0, layerId:0, maxZoom:6, tileSize:256, factorX:0, tileUrlTemplate:"https://static.xam.nu/dayz/maps/namalsk/May.27/topographic/{z}/{x}/{y}.webp", gridSystem:"numeric" },
    fallbackColor:"#1a1f2a", previewColor:"#3a4a6a",
    attribution:"dayz.xam.nu", openUrl:"https://www.izurvive.com/namalsk/",
    realSizeM:5460, gridCellM:500, gridSystem:"numeric" },

  // ── Squad ─────────────────────────────────────────────────────────────────────
  // Yehorivka: 4,180m playable (wiki confirmed), 300m grid squares
  { id:"sq_yehorivka", game:"Squad", name:"Yehorivka",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/279e5759b_generated_image.png",
    tileConfig:{ mapId:0, layerId:0, maxZoom:4, tileSize:256, factorX:24.8047, tileUrlTemplate:"https://squadmaps.com/assets/maps/tiles/Yehorivka_Minimap/{z}/{x}/{y}.png", gridSystem:"squad" },
    fallbackColor:"#2a3020", previewColor:"#6a7a3a",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=Yehorivka&layer=AAS%20v1",
    realSizeM:4180, gridCellM:300, gridSystem:"squad" },

  // Fallujah (Squad): 4,096m playable, 300m grid squares
  { id:"sq_fallujah",  game:"Squad", name:"Fallujah",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/af03413de_generated_image.png",
    tileConfig:{ mapId:0, layerId:0, maxZoom:4, tileSize:256, factorX:11.7383, tileUrlTemplate:"https://squadmaps.com/assets/maps/tiles/T_Fallujah_Minimap/{z}/{x}/{y}.png", gridSystem:"squad" },
    fallbackColor:"#3a2a10", previewColor:"#8a7040",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=Fallujah&layer=AAS%20v1",
    realSizeM:4096, gridCellM:300, gridSystem:"squad" },

  // Al Basrah: 3,200m playable (wiki: 3200×3200m), 200m grid squares
  { id:"sq_albasrah",  game:"Squad", name:"Al Basrah",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/af03413de_generated_image.png",
    tileConfig:{ mapId:0, layerId:0, maxZoom:4, tileSize:256, factorX:11.875, tileUrlTemplate:"https://squadmaps.com/assets/maps/tiles/T_AlBasrah_Minimap/{z}/{x}/{y}.png", gridSystem:"squad" },
    fallbackColor:"#3a2a10", previewColor:"#8a6030",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=AlBasrah&layer=AAS%20v1",
    realSizeM:3200, gridCellM:200, gridSystem:"squad" },

  // Sumari Bala: ~1,500m playable (small urban map), 100m grid squares
  { id:"sq_sumari",    game:"Squad", name:"Sumari Bala",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/0485911ea_generated_image.png",
    tileConfig:{ mapId:0, layerId:0, maxZoom:4, tileSize:256, factorX:5.0781, tileUrlTemplate:"https://squadmaps.com/assets/maps/tiles/Sumari_Minimap/{z}/{x}/{y}.png", gridSystem:"squad" },
    fallbackColor:"#3a2a15", previewColor:"#8a6a35",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=Sumari&layer=AAS%20v1",
    realSizeM:1320, gridCellM:100, gridSystem:"squad" },

  // Kokan: ~2,000m playable (Afghan mountain village), 200m grid squares
  { id:"sq_kokan",     game:"Squad", name:"Kokan",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/a8b620acf_generated_image.png",
    tileConfig:{ mapId:0, layerId:0, maxZoom:4, tileSize:256, factorX:9.75, tileUrlTemplate:"https://squadmaps.com/assets/maps/tiles/T_Kokan_Minimap/{z}/{x}/{y}.png", gridSystem:"squad" },
    fallbackColor:"#2a2010", previewColor:"#7a6030",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=Kokan&layer=AAS%20v1",
    realSizeM:2530, gridCellM:200, gridSystem:"squad" },

  // Narva: ~2,700m playable (Estonian city), 200m grid squares
  { id:"sq_narva",     game:"Squad", name:"Narva",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/b1f6ddf02_generated_image.png",
    tileConfig:{ mapId:0, layerId:0, maxZoom:4, tileSize:256, factorX:10.9375, tileUrlTemplate:"https://squadmaps.com/assets/maps/tiles/Narva_Minimap/{z}/{x}/{y}.png", gridSystem:"squad" },
    fallbackColor:"#2a2a2a", previewColor:"#5a6070",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=Narva&layer=AAS%20v1",
    realSizeM:2300, gridCellM:200, gridSystem:"squad" },

  // Gorodok: 4,340m playable (wiki: 4340×4340m), 300m grid squares
  { id:"sq_gorodok",   game:"Squad", name:"Gorodok",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/c87ed7f69_generated_image.png",
    tileConfig:{ mapId:0, layerId:0, maxZoom:4, tileSize:256, factorX:15.875, tileUrlTemplate:"https://squadmaps.com/assets/maps/tiles/gorodok_minimap/{z}/{x}/{y}.png", gridSystem:"squad" },
    fallbackColor:"#1a2218", previewColor:"#3a5030",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=Gorodok&layer=AAS%20v1",
    realSizeM:4340, gridCellM:300, gridSystem:"squad" },

  // Fool's Road: ~2,000m playable (forested highlands), 200m grid squares
  { id:"sq_foolsroad", game:"Squad", name:"Fool's Road",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/2be1a9b15_generated_image.png",
    tileConfig:{ mapId:0, layerId:0, maxZoom:4, tileSize:256, factorX:6.9297, tileUrlTemplate:"https://squadmaps.com/assets/maps/tiles/Fools_Road_Minimap/{z}/{x}/{y}.png", gridSystem:"squad" },
    fallbackColor:"#1a2210", previewColor:"#3a5025",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=FoolsRoad&layer=AAS%20v1",
    realSizeM:1760, gridCellM:100, gridSystem:"squad" },

  // Mestia: ~3,000m playable (Caucasus mountains), 200m grid squares
  { id:"sq_mestia",    game:"Squad", name:"Mestia",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/d98f64a60_generated_image.png",
    tileConfig:{ mapId:0, layerId:0, maxZoom:4, tileSize:256, factorX:9.375, tileUrlTemplate:"https://squadmaps.com/assets/maps/tiles/T_Mestia_Minimap/{z}/{x}/{y}.png", gridSystem:"squad" },
    fallbackColor:"#1a2020", previewColor:"#3a5555",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=Mestia&layer=AAS%20v1",
    realSizeM:2400, gridCellM:200, gridSystem:"squad" },

  // Tallil Outskirts: ~4,000m playable (Iraqi desert), 300m grid squares
  { id:"sq_tallil",    game:"Squad", name:"Tallil Outskirts",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/de6c21ee1_generated_image.png",
    tileConfig:{ mapId:0, layerId:0, maxZoom:4, tileSize:256, factorX:18.2812, tileUrlTemplate:"https://squadmaps.com/assets/maps/tiles/Tallil_Outskirts_Minimap/{z}/{x}/{y}.png", gridSystem:"squad" },
    fallbackColor:"#3a2a10", previewColor:"#8a7040",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=Tallil&layer=AAS%20v1",
    realSizeM:4000, gridCellM:300, gridSystem:"squad" },

  // Skorpo: ~3,200m playable (Norwegian fjords), 200m grid squares
  { id:"sq_skorpo",    game:"Squad", name:"Skorpo",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/790228140_generated_image.png",
    tileConfig:{ mapId:0, layerId:0, maxZoom:4, tileSize:256, factorX:26.832, tileUrlTemplate:"https://squadmaps.com/assets/maps/tiles/Skorpo_Minimap_RAAS_v3/{z}/{x}/{y}.png", gridSystem:"squad" },
    fallbackColor:"#1a2030", previewColor:"#3a4a6a",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=Skorpo&layer=AAS%20v1",
    realSizeM:7600, gridCellM:500, gridSystem:"squad" },

  // ── Custom ────────────────────────────────────────────────────────────────
  { id:"custom", game:"Custom", name:"Custom URL",
    mapImageUrl:null,
    fallbackColor:"#1a1a1a", previewColor:"#444",
    attribution:"", openUrl:"",
    realSizeM:10000, gridCellM:1000 },
];

// ─── Marker definitions (flat, no faction, sprite-based) ─────────────────────
// ── Hand-drawn marker definitions ───────────────────────────────────────────
// shape = canvas draw function key. section = picker group.
const NATO_SYMS: {key:string; label:string; section:string; shape:string}[] = [
  {key:"fm_column",   label:"Column",          section:"Formations", shape:"img:https://base44.app/api/apps/69bf52c997cae5d4cff87ae4/files/mp/public/69bf52c997cae5d4cff87ae4/6e466fbc9_fm_column.png"},
  {key:"fm_wedge",    label:"Wedge",           section:"Formations", shape:"img:https://base44.app/api/apps/69bf52c997cae5d4cff87ae4/files/mp/public/69bf52c997cae5d4cff87ae4/293c2c947_fm_wedge.png"},
  {key:"fm_line",     label:"Line",            section:"Formations", shape:"img:https://base44.app/api/apps/69bf52c997cae5d4cff87ae4/files/mp/public/69bf52c997cae5d4cff87ae4/c863d3a57_fm_line.png"},
  {key:"fm_stag_col", label:"Staggered Column",section:"Formations", shape:"img:https://base44.app/api/apps/69bf52c997cae5d4cff87ae4/files/mp/public/69bf52c997cae5d4cff87ae4/4a17c4512_fm_stag_col.png"},
  {key:"fm_ech_left", label:"Echelon Left",    section:"Formations", shape:"img:https://base44.app/api/apps/69bf52c997cae5d4cff87ae4/files/mp/public/69bf52c997cae5d4cff87ae4/31efcc6da_fm_ech_left.png"},
];

const MAP_GROUPS: Record<string, GameMap[]> = GAME_MAPS.reduce((acc, m) => {
  if (!acc[m.game]) acc[m.game] = [];
  acc[m.game].push(m);
  return acc;
}, {} as Record<string, GameMap[]>);


const COLORS = [
  "#000000","#ffffff","#ff4444","#4a9eff","#ffcc00","#44cc44",
];

// ─── Utilities ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2,10);
const dist = (a: Pt, b: Pt) => Math.sqrt((b.x-a.x)**2+(b.y-a.y)**2);

type CoordFormat  = "DG" | "DMS" | "MGRS";
type MeasureUnit  = "metric" | "imperial" | "nautical";

/** Format a distance respecting measurement unit */
function formatDist(metres: number, unit: MeasureUnit = "metric"): string {
  if (unit === "imperial") {
    const ft = metres * 3.28084;
    if (ft >= 5280) return `${(ft / 5280).toFixed(2)} mi`;
    return `${Math.round(ft)} ft`;
  }
  if (unit === "nautical") {
    const nm = metres / 1852;
    if (nm >= 1) return `${nm.toFixed(2)} nm`;
    return `${Math.round(metres)} m`;
  }
  // metric (default)
  if (metres >= 1000) return `${(metres / 1000).toFixed(2)} km`;
  return `${Math.round(metres)} m`;
}

/**
 * Convert a canvas pixel position to in-game map coordinates (metres from SW corner).
 * Canvas (0,0) = NW corner of map, X→East, Y→South.
 * In-game: origin SW, X→East, Y→North.
 * Returns { mx, my } in metres.
 */
function canvasToMapMetres(cx: number, cy: number, canvasW: number, canvasH: number, realSizeM: number, panOffset: {x:number;y:number}, zoom: number, mapAspect = 1, northAtBottom = false): {mx:number;my:number} {
  // isTileMap: mapAspect===1 is used as proxy (tile maps always pass aspect=1)
  // For tile maps: rendered map size = max(W,H)*zoom (square map covers the larger dim)
  // For image maps: rendered map fits inside canvas via object-fit:contain logic
  let renderedMapW: number;
  let renderedMapH: number;
  if (mapAspect === 1) {
    // Tile map — square, fills max dimension
    const rendered = Math.max(canvasW, canvasH) * zoom;
    renderedMapW = rendered;
    renderedMapH = rendered;
  } else {
    // Image map — object-fit:contain inside canvas
    renderedMapW = Math.min(canvasW, canvasH * mapAspect) * zoom;
    renderedMapH = renderedMapW / mapAspect;
  }
  // Undo pan to get position relative to map centre, then normalise to 0–1
  const normX = (cx - canvasW/2 - panOffset.x) / renderedMapW + 0.5;
  const normY = (cy - canvasH/2 - panOffset.y) / renderedMapH + 0.5;
  const mx = normX * realSizeM;
  // northAtBottom=false (standard / plan-ops tiles): canvas top = north = high northing (flip Y)
  // northAtBottom=true: canvas top = south = low northing (only for unusual maps)
  const my = northAtBottom ? normY * realSizeM : (1 - normY) * realSizeM;
  return { mx, my };
}

/**
 * Rotate a canvas-space point around the canvas centre by -mapRotation radians.
 * This transforms a screen-space coordinate into the unrotated map coordinate space,
 * which is required before passing to canvasToMapMetres when the map is tilted.
 */
/**
 * mapMetresToCanvas — inverse of canvasToMapMetres.
 * Converts world-space metres (mx east, my north from SW corner) to canvas pixels.
 */
function mapMetresToCanvas(mx: number, my: number, canvasW: number, canvasH: number, realSizeM: number, panOffset: {x:number;y:number}, zoom: number, mapAspect = 1, northAtBottom = false): {cx: number; cy: number} {
  let renderedMapW: number;
  let renderedMapH: number;
  if (mapAspect === 1) {
    const rendered = Math.max(canvasW, canvasH) * zoom;
    renderedMapW = rendered;
    renderedMapH = rendered;
  } else {
    renderedMapW = Math.min(canvasW, canvasH * mapAspect) * zoom;
    renderedMapH = renderedMapW / mapAspect;
  }
  const normX = mx / realSizeM;
  const normY = northAtBottom ? my / realSizeM : 1 - my / realSizeM;
  const cx = (normX - 0.5) * renderedMapW + canvasW / 2 + panOffset.x;
  const cy = (normY - 0.5) * renderedMapH + canvasH / 2 + panOffset.y;
  return { cx, cy };
}

function rotatePoint(cx: number, cy: number, canvasW: number, canvasH: number, mapRotation: number): {cx: number; cy: number} {
  if (mapRotation === 0) return { cx, cy };
  const ox = canvasW / 2;
  const oy = canvasH / 2;
  const cos = Math.cos(mapRotation);
  const sin = Math.sin(mapRotation);
  const dx = cx - ox;
  const dy = cy - oy;
  return {
    cx: ox + dx * cos - dy * sin,
    cy: oy + dx * sin + dy * cos,
  };
}

function unrotatePoint(cx: number, cy: number, canvasW: number, canvasH: number, mapRotation: number): {cx: number; cy: number} {
  if (mapRotation === 0) return { cx, cy };
  const ox = canvasW / 2;
  const oy = canvasH / 2;
  const cos = Math.cos(-mapRotation);
  const sin = Math.sin(-mapRotation);
  const dx = cx - ox;
  const dy = cy - oy;
  return {
    cx: ox + dx * cos - dy * sin,
    cy: oy + dx * sin + dy * cos,
  };
}

/**
 * formatGridRef — returns the correct in-game grid reference string for the
 * given map position, matching the exact format each game uses.
 *
 * mx = metres east from map west edge (0 = west)
 * my = metres north from map south edge (0 = south) — this is what canvasToMapMetres returns
 *
 * gridSystem:
 *   "arma"   — Arma 3 / Arma Reforger / DayZ
 *              6-digit: EEEYYY (3-digit easting then 3-digit northing, each in 100 m units)
 *              e.g. position 3500m east, 4800m north → "035 048"
 *              Sub-precision to 10 m: 6-digit → "035048", full 8-digit → "03504800"
 *   "squad"  — Squad: Letter column (A→east) + number row (1→south) + keypad sub-cell
 *              Each major cell = 300 m. Sub-keypad cell = 100 m.
 *              e.g. "F6 KP5"
 *   "numeric"— Generic decimal metres display
 */
function formatGridRef(
  mx: number, my: number,
  gridSystem: "arma" | "squad" | "numeric",
  gridCellM: number,
  realSizeM: number,
): string {
  const x = Math.max(0, mx);
  const y = Math.max(0, my);

  if (gridSystem === "arma") {
    // Arma 3 / DayZ: each grid unit = 100 m.
    // 3-digit easting = floor(x / 100), 3-digit northing = floor(y / 100)
    // Full 6-digit ref (to nearest 100 m grid square) concatenated: EEEYYY
    const e100 = Math.floor(x / 100);
    const n100 = Math.floor(y / 100);
    const eStr = String(e100).padStart(3, "0");
    const nStr = String(n100).padStart(3, "0");
    // Sub-precision within the 100 m square (0–9): floor((remainder) / 10)
    const eSub = Math.floor((x % 100) / 10);
    const nSub = Math.floor((y % 100) / 10);
    // Return 6-digit (standard) — e.g. "035 048"
    return `${eStr} ${nStr}`;
  }

  if (gridSystem === "squad") {
    // Squad: major cell = gridCellM (300 m by default)
    // Column letter: floor(x / cellM) → A, B, C...
    // Row number:    floor((realSizeM - y) / cellM) + 1  (y=0 is south = bottom = last row)
    const colIdx = Math.floor(x / gridCellM);
    const rowIdx = Math.floor((realSizeM - y) / gridCellM);
    const letter = String.fromCharCode(65 + Math.min(colIdx, 25));
    const rowNum = rowIdx + 1;

    // Keypad: 3×3 sub-grid within the major cell, numbered like numpad (7-top-left, 1-bottom-left)
    // Sub-cell x offset within major cell
    const subX = (x % gridCellM) / gridCellM;   // 0–1 within cell
    const subY = ((realSizeM - y) % gridCellM) / gridCellM; // 0–1 from top of cell
    const kpCol = Math.floor(subX * 3);          // 0=left, 1=mid, 2=right
    const kpRow = Math.floor(subY * 3);          // 0=top, 1=mid, 2=bottom
    // Numpad layout: row 0 = 7,8,9 | row 1 = 4,5,6 | row 2 = 1,2,3
    const kp = [7, 8, 9, 4, 5, 6, 1, 2, 3][kpRow * 3 + kpCol];
    return `${letter}${rowNum} KP${kp}`;
  }

  // Generic: decimal metres
  return `${Math.round(x)} E / ${Math.round(y)} N`;
}

/** Legacy wrapper used by older HUD rows — kept for compatibility */
function formatMGRS(mx: number, my: number): string {
  const e = String(Math.floor(Math.max(0, mx) / 100)).padStart(3, "0");
  const n = String(Math.floor(Math.max(0, my) / 100)).padStart(3, "0");
  return `${e} ${n}`;
}

/** Format in-game metres as decimal degrees (approximation for display) */
function formatDG(mx: number, my: number, realSizeM: number): string {
  const lon = (mx / realSizeM) * 0.5;
  const lat = (my / realSizeM) * 0.5;
  return `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`;
}

/** Format in-game metres as DMS */
function formatDMS(mx: number, my: number, realSizeM: number): string {
  const lon = (mx / realSizeM) * 0.5;
  const lat = (my / realSizeM) * 0.5;
  function toDMS(deg: number, isLon: boolean): string {
    const d = Math.floor(deg);
    const mRaw = (deg - d) * 60;
    const m = Math.floor(mRaw);
    const s = ((mRaw - m) * 60).toFixed(1);
    const dir = isLon ? "E" : "N";
    return `${d}°${String(m).padStart(2,"0")}'${s}"${dir}`;
  }
  return `${toDMS(lat, false)} ${toDMS(lon, true)}`;
}

/** Pick a "nice" scale bar distance given current metres-per-pixel and bar pixel width */
function niceScaleBarM(mpp: number, targetPx: number): number {
  const raw = mpp * targetPx;          // max real-world metres that fit in targetPx
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const candidates = [1, 2, 2.5, 5, 10].map(f => f * mag);
  // pick the largest candidate that fits
  return candidates.filter(c => c <= raw).at(-1) ?? candidates[0];
}

// ─── Drawing helpers ───────────────────────────────────────────────────────────

function drawArrowHead(ctx: CanvasRenderingContext2D, from: Pt, to: Pt, sz: number) {
  const a = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - sz * Math.cos(a - Math.PI/6), to.y - sz * Math.sin(a - Math.PI/6));
  ctx.lineTo(to.x - sz * Math.cos(a + Math.PI/6), to.y - sz * Math.sin(a + Math.PI/6));
  ctx.closePath();
  ctx.fill();
}

// ─── Hand-drawn marker renderer ──────────────────────────────────────────────
// Sharpie/marker aesthetic: thick strokes, slight roughness, no fills.

function jitter(n: number, amt = 1.2): number {
  return n + (Math.random() - 0.5) * amt;
}

/**
 * Draw text with per-character jitter — slight random Y offset + rotation per char.
 * Used for handwriting-style label fonts (marker / field / intel).
 * amt controls wobble intensity (default 1.4px vertical, 0.04rad rotation).
 */
function jitterFillText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  amt = 1.4,
) {
  // Measure total width first so we can centre correctly
  const totalW = ctx.measureText(text).width;
  let cx = x - totalW / 2;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const cw = ctx.measureText(ch).width;
    ctx.save();
    ctx.translate(cx + cw / 2, y);
    ctx.rotate((Math.random() - 0.5) * 0.07);
    ctx.translate(-(cx + cw / 2), -y);
    ctx.fillText(ch, cx, y + (Math.random() - 0.5) * amt);
    ctx.restore();
    cx += cw;
  }
}


function drawSharpieX(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 2.8; ctx.lineCap = "round";
  // Two crossing lines with slight jitter
  ctx.beginPath();
  ctx.moveTo(jitter(cx - r), jitter(cy - r));
  ctx.lineTo(jitter(cx + r), jitter(cy + r));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(jitter(cx + r), jitter(cy - r));
  ctx.lineTo(jitter(cx - r), jitter(cy + r));
  ctx.stroke();
  ctx.restore();
}

function drawSharpieCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.lineCap = "round";
  // Scribble fill — dense diagonal hatching inside circle
  const step = r * 0.22;
  for (let d = -r * 1.1; d <= r * 1.1; d += step) {
    const dj = d + (Math.random() - 0.5) * 1.2;
    const half = Math.sqrt(Math.max(0, r * r - dj * dj));
    if (half < 1) continue;
    ctx.beginPath();
    ctx.moveTo(jitter(cx + dj - half * 0.35), jitter(cy - half));
    ctx.lineTo(jitter(cx + dj + half * 0.35), jitter(cy + half));
    ctx.stroke();
  }
  // Outline — jittery circle
  const segs = 12;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  for (let i = 0; i <= segs; i++) {
    const ang = (i / segs) * Math.PI * 2;
    const rj = r + (Math.random() - 0.5) * 1.8;
    const px = cx + Math.cos(ang) * rj;
    const py = cy + Math.sin(ang) * rj;
    if (i === 0) ctx.moveTo(jitter(px), jitter(py));
    else ctx.lineTo(jitter(px), jitter(py));
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawSharpieArrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
  // Shaft up, arrowhead at top
  ctx.beginPath();
  ctx.moveTo(jitter(cx), jitter(cy + r));
  ctx.lineTo(jitter(cx), jitter(cy - r * 0.3));
  ctx.stroke();
  // Head
  ctx.beginPath();
  ctx.moveTo(jitter(cx - r * 0.5), jitter(cy - r * 0.1));
  ctx.lineTo(jitter(cx), jitter(cy - r));
  ctx.lineTo(jitter(cx + r * 0.5), jitter(cy - r * 0.1));
  ctx.stroke();
  ctx.restore();
}




function drawSharpieDot(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(jitter(cx, 0.8), jitter(cy, 0.8), r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSharpieDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
  // Scribble fill — horizontal hatching clipped to diamond
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.7, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r * 0.7, cy);
  ctx.closePath();
  ctx.clip();
  const step = r * 0.22;
  for (let dy = -r; dy <= r; dy += step) {
    const dj = dy + (Math.random() - 0.5) * 1.2;
    const halfW = r * 0.7 * (1 - Math.abs(dy) / r);
    if (halfW < 1) continue;
    ctx.beginPath();
    ctx.moveTo(jitter(cx - halfW), jitter(cy + dj));
    ctx.lineTo(jitter(cx + halfW), jitter(cy + dj));
    ctx.stroke();
  }
  ctx.restore();
  // Outline
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(jitter(cx), jitter(cy - r));
  ctx.lineTo(jitter(cx + r * 0.7), jitter(cy));
  ctx.lineTo(jitter(cx), jitter(cy + r));
  ctx.lineTo(jitter(cx - r * 0.7), jitter(cy));
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawSharpieSquare(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
  // Scribble fill — horizontal hatching inside square
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - r, cy - r, r * 2, r * 2);
  ctx.clip();
  const step = r * 0.22;
  for (let dy = -r; dy <= r; dy += step) {
    const dj = dy + (Math.random() - 0.5) * 1.2;
    ctx.beginPath();
    ctx.moveTo(jitter(cx - r + 1), jitter(cy + dj));
    ctx.lineTo(jitter(cx + r - 1), jitter(cy + dj));
    ctx.stroke();
  }
  ctx.restore();
  // Outline
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(jitter(cx - r), jitter(cy - r));
  ctx.lineTo(jitter(cx + r), jitter(cy - r));
  ctx.lineTo(jitter(cx + r), jitter(cy + r));
  ctx.lineTo(jitter(cx - r), jitter(cy + r));
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// ─── Arrow draw functions (all hollow block style) ───────────────────────────

/**
 * Core hollow block arrow — always drawn pointing UP, then rotated.
 * Proportions tuned so it looks like the second icon in the screenshot.
 */
function drawHollowBlockArrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, angleDeg: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((angleDeg * Math.PI) / 180);
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2.2;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";

  const sw  = r * 0.28;
  const hw  = r * 0.60;
  const tip  = -r * 0.92;
  const neck = -r * 0.22;
  const base =  r * 0.68;
  const j = (n: number) => n + (Math.random() - 0.5) * 0.9;

  // Clip to arrow shape and scribble-fill
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-sw, base); ctx.lineTo(-sw, neck); ctx.lineTo(-hw, neck);
  ctx.lineTo(0, tip);    ctx.lineTo(hw, neck);  ctx.lineTo(sw, neck);
  ctx.lineTo(sw, base);  ctx.closePath();
  ctx.clip();
  const step = r * 0.18;
  for (let dy = tip; dy <= base; dy += step) {
    const dj = dy + (Math.random() - 0.5) * 1.0;
    // width of arrow at this y
    let lx: number, rx: number;
    if (dy < neck) {
      // triangular head section: interpolate from tip(0) to neck(±hw)
      const t = (dy - tip) / (neck - tip);
      lx = -hw * t; rx = hw * t;
    } else {
      lx = -sw; rx = sw;
    }
    if (rx - lx < 1) continue;
    ctx.beginPath();
    ctx.moveTo(j(lx + 1), j(dj));
    ctx.lineTo(j(rx - 1), j(dj));
    ctx.stroke();
  }
  ctx.restore();

  // Outline
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(j(-sw), j(base)); ctx.lineTo(j(-sw), j(neck)); ctx.lineTo(j(-hw), j(neck));
  ctx.lineTo(j(0),   j(tip));  ctx.lineTo(j(hw),  j(neck)); ctx.lineTo(j(sw),  j(neck));
  ctx.lineTo(j(sw),  j(base)); ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

/**
 * Soft curve arrow — gentle bend using a quadratic bezier.
 * Starts at bottom-centre, curves slightly to one side, ends at top with arrowhead.
 * dir: -1 = top-left exit (bends left), +1 = top-right exit (bends right)
 */
function drawSoftCurveArrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, dir: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2.6;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";

  const x0 = cx; const y0 = cy + r * 0.9;
  const cpX = cx + dir * r * 0.9; const cpY = cy;
  const x1 = cx + dir * r * 0.7; const y1 = cy - r * 0.9;

  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cpX, cpY, x1, y1);
  ctx.stroke();

  const tanX = x1 - cpX; const tanY = y1 - cpY;
  const ang  = Math.atan2(tanY, tanX);
  const j = (n: number) => n + (Math.random()-0.5)*0.9;

  // Scribble-filled arrowhead
  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(ang + Math.PI / 2);
  const sw = r * 0.22; const hw = r * 0.46; const hl = r * 0.46;
  // clip to head shape
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-sw, 0); ctx.lineTo(-hw, 0); ctx.lineTo(0, -hl);
  ctx.lineTo(hw, 0);  ctx.lineTo(sw, 0);  ctx.closePath();
  ctx.clip();
  ctx.lineWidth = 1.8;
  const step = hl * 0.22;
  for (let dy = -hl; dy <= 0; dy += step) {
    const dj = dy + (Math.random()-0.5)*1.0;
    const t = Math.abs(dy) / hl;
    const halfW = hw * (1 - t) * 0.95 + sw * t * 0.95;
    ctx.beginPath();
    ctx.moveTo(j(-halfW), j(dj)); ctx.lineTo(j(halfW), j(dj));
    ctx.stroke();
  }
  ctx.restore();
  // outline
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(j(-sw),0); ctx.lineTo(j(-hw),0); ctx.lineTo(j(0),j(-hl));
  ctx.lineTo(j(hw),0);  ctx.lineTo(j(sw),0);  ctx.closePath();
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

/**
 * Clean curved arrow — ~90° arc with hollow block head at tip.
 * dir: -1 = curves left, +1 = curves right
 */
function drawCleanCurvedArrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, dir: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2.6;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";

  const arcR   = r * 0.90;
  const arcCx  = cx;
  const arcCy  = cy + arcR * 0.05;
  const startA = Math.PI * 0.5;
  const endA   = dir > 0 ? 0 : Math.PI;

  ctx.beginPath();
  ctx.arc(arcCx, arcCy, arcR, startA, endA, dir < 0);
  ctx.stroke();

  const tipX = arcCx + Math.cos(endA) * arcR;
  const tipY = arcCy + Math.sin(endA) * arcR;
  const tangentAng = endA + (dir > 0 ? -Math.PI/2 : Math.PI/2);
  const j = (n: number) => n + (Math.random()-0.5)*0.9;
  const sw = r * 0.26; const hw = r * 0.52; const hl = r * 0.52;

  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(tangentAng);
  // Scribble fill head
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-sw,0); ctx.lineTo(-hw,0); ctx.lineTo(0,-hl);
  ctx.lineTo(hw,0);  ctx.lineTo(sw,0);  ctx.closePath();
  ctx.clip();
  ctx.lineWidth = 1.8;
  const step = hl * 0.22;
  for (let dy = -hl; dy <= 0; dy += step) {
    const dj = dy + (Math.random()-0.5)*1.0;
    const t = Math.abs(dy) / hl;
    const halfW = hw * (1-t) * 0.95 + sw * t * 0.95;
    ctx.beginPath();
    ctx.moveTo(j(-halfW), j(dj)); ctx.lineTo(j(halfW), j(dj));
    ctx.stroke();
  }
  ctx.restore();
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(j(-sw),j(0)); ctx.lineTo(j(-hw),j(0)); ctx.lineTo(j(0),j(-hl));
  ctx.lineTo(j(hw),j(0)); ctx.lineTo(j(sw),j(0)); ctx.closePath();
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

/**
 * U-turn arrow — clean hairpin. Stem up on left, semicircle at top, stem down on right, block head pointing down.
 */
function drawUTurnArrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2.6;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";

  const stemH  = r * 1.10;
  const arcR   = r * 0.42;
  const lx     = cx - arcR;
  const rx     = cx + arcR;
  const topY   = cy - stemH + arcR;

  ctx.beginPath();
  ctx.moveTo(lx, cy + r * 0.35);
  ctx.lineTo(lx, topY);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, topY, arcR, Math.PI, 0, false);
  ctx.stroke();

  const headBase = cy + r * 0.05;
  ctx.beginPath();
  ctx.moveTo(rx, topY);
  ctx.lineTo(rx, headBase);
  ctx.stroke();

  // Scribble-filled block head pointing DOWN
  ctx.save();
  ctx.translate(rx, headBase);
  const sw = r * 0.24; const hw = r * 0.50; const hl = r * 0.48;
  const j = (n: number) => n + (Math.random()-0.5)*0.8;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-sw, 0); ctx.lineTo(-hw, 0); ctx.lineTo(0, hl);
  ctx.lineTo(hw, 0);  ctx.lineTo(sw, 0);  ctx.closePath();
  ctx.clip();
  ctx.lineWidth = 1.8;
  const step = hl * 0.22;
  for (let dy = 0; dy <= hl; dy += step) {
    const dj = dy + (Math.random()-0.5)*1.0;
    const t = dy / hl;
    const halfW = hw * (1-t) * 0.95 + sw * t * 0.95;
    ctx.beginPath();
    ctx.moveTo(j(-halfW), j(dj)); ctx.lineTo(j(halfW), j(dj));
    ctx.stroke();
  }
  ctx.restore();
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(j(-sw), j(0)); ctx.lineTo(j(-hw), j(0)); ctx.lineTo(j(0), j(hl));
  ctx.lineTo(j(hw), j(0));  ctx.lineTo(j(sw), j(0));  ctx.closePath();
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}



// ── Milsim sprite sheet (extracted from NATO milsim reference card) ──────────
const MARKER_SPRITE_W = 80;
const MARKER_SHEET_COLS = 30;
let _markerSheet: HTMLImageElement | null = null;
let _markerSheetLoaded = false;
let _markerSheet2: HTMLImageElement | null = null;
let _markerSheet2Loaded = false;

function getMarkerSheet(): HTMLImageElement | null {
  if (_markerSheet) return _markerSheetLoaded ? _markerSheet : null;
  _markerSheet = new Image();
  _markerSheet.onload = () => { _markerSheetLoaded = true; };
  _markerSheet.src = "/images/marker_sheet_v2.png";
  return null;
}

function getMarkerSheet2(): HTMLImageElement | null {
  if (_markerSheet2) return _markerSheet2Loaded ? _markerSheet2 : null;
  _markerSheet2 = new Image();
  _markerSheet2.onload = () => { _markerSheet2Loaded = true; };
  _markerSheet2.src = "/images/marker_sheet2_v2.png";
  return null;
}

let _markerSheet3: HTMLImageElement | null = null;
let _markerSheet3Loaded = false;

function getMarkerSheet3(): HTMLImageElement | null {
  if (_markerSheet3) return _markerSheet3Loaded ? _markerSheet3 : null;
  _markerSheet3 = new Image();
  _markerSheet3.onload = () => { _markerSheet3Loaded = true; };
  _markerSheet3.src = "/images/nato-icons-v3.png?v=20260414c";
  return null;
}

function drawNatoIconMarker(
  ctx: CanvasRenderingContext2D,
  col: number, row: number,
  cx: number, cy: number,
  r: number,
  color: string
) {
  const sheet = getMarkerSheet3();
  if (!sheet) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    return;
  }
  const CELL = 80;
  const size = r * 2.4;
  const sx = col * CELL;
  const sy = row * CELL;
  ctx.save();
  const offscreen = document.createElement('canvas');
  offscreen.width = Math.ceil(size);
  offscreen.height = Math.ceil(size);
  const oc = offscreen.getContext('2d')!;
  // Draw sprite — then threshold alpha to kill near-transparent bg remnants
  oc.drawImage(sheet, sx, sy, CELL, CELL, 0, 0, size, size);
  const idata = oc.getImageData(0, 0, offscreen.width, offscreen.height);
  const d = idata.data;
  for (let i = 3; i < d.length; i += 4) {
    d[i] = d[i] < 80 ? 0 : d[i]; // anything below alpha 80 = fully transparent
  }
  oc.putImageData(idata, 0, 0);
  if (color !== '#ffffff' && color !== 'white') {
    oc.globalCompositeOperation = 'source-atop';
    oc.fillStyle = color;
    oc.fillRect(0, 0, size, size);
  }
  ctx.drawImage(offscreen, cx - size / 2, cy - size / 2);
  ctx.restore();
}


/**
 * Draw a sprite from the milsim marker sheet.
 * shape = "sp:N" where N is the 0-based column index.
 * Tints white sprites to `color` using compositing.
 */
function drawSpriteMarker(
  ctx: CanvasRenderingContext2D,
  spriteIdx: number,
  cx: number, cy: number,
  r: number,
  color: string
) {
  const sheet = getMarkerSheet();
  if (!sheet) {
    // Sheet not loaded yet — draw a placeholder dot
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    return;
  }
  const size = r * 2.4;
  const sx = spriteIdx * MARKER_SPRITE_W;
  // Draw white sprite, then tint via color + source-atop
  ctx.save();
  ctx.globalAlpha = 1;
  // Step 1: draw the sprite (white+alpha)
  const offscreen = document.createElement('canvas');
  offscreen.width = Math.ceil(size);
  offscreen.height = Math.ceil(size);
  const oc = offscreen.getContext('2d')!;
  oc.drawImage(sheet, sx, 0, MARKER_SPRITE_W, MARKER_SPRITE_W, 0, 0, size, size);
  // Step 2: tint — fill color over sprite using source-atop
  if (color !== '#ffffff' && color !== 'white') {
    oc.globalCompositeOperation = 'source-atop';
    oc.fillStyle = color;
    oc.fillRect(0, 0, size, size);
  }
  ctx.drawImage(offscreen, cx - size / 2, cy - size / 2);
  ctx.restore();
}

function drawSpriteMarker2(
  ctx: CanvasRenderingContext2D,
  spriteIdx: number,
  cx: number, cy: number,
  r: number,
  color: string
) {
  const sheet = getMarkerSheet2();
  if (!sheet) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    return;
  }
  const size = r * 2.4;
  const sx = spriteIdx * MARKER_SPRITE_W;
  ctx.save();
  ctx.globalAlpha = 1;
  const offscreen = document.createElement('canvas');
  offscreen.width = Math.ceil(size);
  offscreen.height = Math.ceil(size);
  const oc = offscreen.getContext('2d')!;
  oc.drawImage(sheet, sx, 0, MARKER_SPRITE_W, MARKER_SPRITE_W, 0, 0, size, size);
  if (color !== '#ffffff' && color !== 'white') {
    oc.globalCompositeOperation = 'source-atop';
    oc.fillStyle = color;
    oc.fillRect(0, 0, size, size);
  }
  ctx.drawImage(offscreen, cx - size / 2, cy - size / 2);
  ctx.restore();
}

function drawMarkerShape(ctx: CanvasRenderingContext2D, shape: string, cx: number, cy: number, r: number, color: string) {
  switch (shape) {
    case "x":           drawSharpieX(ctx, cx, cy, r, color); break;
    case "circle":      drawSharpieCircle(ctx, cx, cy, r, color); break;
    case "dot":         drawSharpieDot(ctx, cx, cy, r, color); break;
    case "diamond":     drawSharpieDiamond(ctx, cx, cy, r, color); break;
    case "square":      drawSharpieSquare(ctx, cx, cy, r, color); break;
    case "arr_n":       drawHollowBlockArrow(ctx, cx, cy, r, color, 0);   break;
    case "arr_ne":      drawHollowBlockArrow(ctx, cx, cy, r, color, 45);  break;
    case "arr_e":       drawHollowBlockArrow(ctx, cx, cy, r, color, 90);  break;
    case "arr_se":      drawHollowBlockArrow(ctx, cx, cy, r, color, 135); break;
    case "arr_s":       drawHollowBlockArrow(ctx, cx, cy, r, color, 180); break;
    case "arr_sw":      drawHollowBlockArrow(ctx, cx, cy, r, color, 225); break;
    case "arr_w":       drawHollowBlockArrow(ctx, cx, cy, r, color, 270); break;
    case "arr_nw":      drawHollowBlockArrow(ctx, cx, cy, r, color, 315); break;
    case "arr_soft_l":  drawSoftCurveArrow(ctx, cx, cy, r, color, -1);  break;
    case "arr_soft_r":  drawSoftCurveArrow(ctx, cx, cy, r, color, +1);  break;
    case "arr_curve_l": drawCleanCurvedArrow(ctx, cx, cy, r, color, -1); break;
    case "arr_curve_r": drawCleanCurvedArrow(ctx, cx, cy, r, color, +1); break;
    case "arr_uturn":   drawUTurnArrow(ctx, cx, cy, r, color); break;

    default: {
      if (shape.startsWith("sp3:")) {
        const parts = shape.slice(4).split(":");
        const col = parseInt(parts[0], 10);
        const row = parseInt(parts[1], 10);
        drawNatoIconMarker(ctx, col, row, cx, cy, r, color);
      } else if (shape.startsWith("sp2:")) {
        const idx = parseInt(shape.slice(4), 10);
        drawSpriteMarker2(ctx, idx, cx, cy, r, color);
      } else if (shape.startsWith("sp:")) {
        const idx = parseInt(shape.slice(3), 10);
        drawSpriteMarker(ctx, idx, cx, cy, r, color);
      } else {
        drawSharpieDot(ctx, cx, cy, r, color);
      }
      break;
    }
  }
}

function drawMarkerThumb(el: HTMLCanvasElement, sym: typeof NATO_SYMS[0]) {
  const ctx = el.getContext('2d');
  if (!ctx) return;
  const W = el.width; const H = el.height;
  const doDraw = () => {
    ctx.clearRect(0, 0, W, H);
    drawMarkerShape(ctx, sym.shape, W / 2, H / 2, W * 0.32, '#ffffff');
  };
  // If sprite sheet not yet loaded, wait for it then redraw
  const shape = sym.shape;
  if (shape.startsWith('sp:')) {
    if (!_markerSheet || !_markerSheetLoaded) {
      if (!_markerSheet) { _markerSheet = new Image(); _markerSheet.src = '/images/marker_sheet_v2.png'; }
      _markerSheet.addEventListener('load', () => { _markerSheetLoaded = true; doDraw(); }, { once: true });
    }
  } else if (shape.startsWith('sp2:')) {
    if (!_markerSheet2 || !_markerSheet2Loaded) {
      if (!_markerSheet2) { _markerSheet2 = new Image(); _markerSheet2.src = '/images/marker_sheet2_v2.png'; }
      _markerSheet2.addEventListener('load', () => { _markerSheet2Loaded = true; doDraw(); }, { once: true });
    }
  } else if (shape.startsWith('sp3:')) {
    if (!_markerSheet3 || !_markerSheet3Loaded) {
      if (!_markerSheet3) { _markerSheet3 = new Image(); _markerSheet3.src = '/images/nato-icons-v3.png?v=20260414c'; }
      _markerSheet3.addEventListener('load', () => { _markerSheet3Loaded = true; doDraw(); }, { once: true });
    }
  } else if (shape.startsWith('img:')) {
    const url = shape.slice(4);
    const imgEl = new Image();
    imgEl.crossOrigin = 'anonymous';
    imgEl.onload = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(imgEl, 0, 0, W, H);
    };
    imgEl.src = url;
    return; // async — don't call doDraw
  }
  doDraw();
}

function drawNatoMarker(
  ctx: CanvasRenderingContext2D,
  sym: typeof NATO_SYMS[0],
  x: number, y: number,
  label: string,
  selected: boolean,
  rotDeg = 0,
  flip = false,
  color = "#ffffff",
  scale = 2,
  lFont: LabelFont = "default",
) {
  const r = 13 * Math.max(0.35, scale / 2);
  ctx.save();
  if (selected) { ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 12; }
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.rotate((rotDeg * Math.PI) / 180);
  ctx.translate(-x, -y);
  if (sym.shape.startsWith('img:')) {
    const imgUrl = sym.shape.slice(4);
    const imgEl = new Image();
    imgEl.crossOrigin = 'anonymous';
    imgEl.onload = () => {
      ctx.save();
      if (selected) { ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 12; }
      ctx.translate(x, y);
      if (flip) ctx.scale(-1, 1);
      ctx.rotate((rotDeg * Math.PI) / 180);
      ctx.translate(-x, -y);
      const sz = r * 3.5;
      ctx.drawImage(imgEl, x - sz/2, y - sz/2, sz, sz);
      ctx.restore();
    };
    imgEl.src = imgUrl;
  } else {
    drawMarkerShape(ctx, sym.shape, x, y, r, color);
  }
  ctx.restore();

  if (label) {
    ctx.save();
    ctx.shadowBlur = 0;
    const labelSz = Math.max(9, Math.round(11 * scale / 2));
    ctx.font = handFont(lFont, labelSz);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const tw = ctx.measureText(label).width;
    const labelY = y + r + 3;
    if (lFont === "default") {
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.fillRect(x - tw/2 - 3, labelY, tw + 6, labelSz + 4);
    }
    ctx.fillStyle = color;
    if (lFont !== "default") {
      ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 4;
      ctx.textAlign = "left";
      jitterFillText(ctx, label, x, labelY, lFont === "field" ? 2.2 : 1.4);
    } else {
      ctx.fillText(label, x, labelY);
    }
    ctx.restore();
  }
}

function drawFullCompass(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  mapRot: number,
  northAtBottom = false,
) {
  // DESIGN — compass v5:
  // Canvas has NO CSS rotation. Tile map has CSS rotate(mapRot) applied.
  // The BEZEL (ticks + N/S/E/W) is always fixed to screen — N permanently at top.
  // The NEEDLE rotates to point at game North on screen.
  //
  // When mapRot = 0:
  //   northAtBottom=false → game North is at TOP of tile image → needle points UP (0)
  //   northAtBottom=true  → game North is at BOTTOM of tile image → needle points DOWN (π)
  //
  // When mapRot > 0 (user rotated CW):
  //   Tile map rotated CW → game North moved CW on screen → needle tracks CW
  //   needleAngle = mapRot + (northAtBottom ? π : 0)
  //
  // Bearing readout: normalised mapRot in degrees (0–359), wrapping cleanly.
  // For northAtBottom we do NOT add 180 to bearing — bearing 0 means "default orientation".

  ctx.save();
  ctx.translate(cx, cy);

  // ── Background disc ──
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2);
  ctx.fillStyle = "rgba(4,7,12,0.92)"; ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r*0.88, 0, Math.PI*2);
  ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1; ctx.stroke();

  // ── Fixed bezel tick marks (N always at top) ──
  for (let deg = 0; deg < 360; deg += 5) {
    const rad = deg * Math.PI / 180;
    const isMajor = deg % 45 === 0;
    const isMed   = deg % 15 === 0;
    const inner = isMajor ? r*0.52 : isMed ? r*0.63 : r*0.72;
    ctx.beginPath();
    ctx.moveTo(Math.sin(rad)*inner, -Math.cos(rad)*inner);
    ctx.lineTo(Math.sin(rad)*r*0.83, -Math.cos(rad)*r*0.83);
    ctx.strokeStyle = isMajor ? "rgba(255,255,255,0.9)" : isMed ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)";
    ctx.lineWidth = isMajor ? 1.8 : 0.8;
    ctx.stroke();
    if (isMajor && deg % 90 !== 0) {
      ctx.save();
      ctx.translate(Math.sin(rad)*r*0.44, -Math.cos(rad)*r*0.44);
      ctx.rotate(rad);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `${r*0.14}px monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(deg), 0, 0);
      ctx.restore();
    }
  }

  // ── Fixed cardinal labels — drawn BEFORE needle so needle overlaps them ──
  const cardinals: {label:string; deg:number; sz:number; color:string}[] = [
    { label:"N", deg:0,   sz:r*0.22, color:"#ff4a4a" },
    { label:"S", deg:180, sz:r*0.18, color:"#cccccc" },
    { label:"E", deg:90,  sz:r*0.18, color:"#cccccc" },
    { label:"W", deg:270, sz:r*0.18, color:"#cccccc" },
  ];
  for (const d of cardinals) {
    const rad = d.deg * Math.PI / 180;
    ctx.save();
    ctx.translate(Math.sin(rad)*r*0.68, -Math.cos(rad)*r*0.68);
    ctx.fillStyle = d.color;
    ctx.font = `bold ${d.sz}px Arial`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(d.label, 0, 0);
    ctx.restore();
  }

  // ── Rotating needle — tracks screen North ──
  // needleAngle = mapRot: when map is unrotated (mapRot=0), red points UP = screen North.
  // As user rotates map CW, needle rotates CW to track the rotation.
  // northAtBottom does not affect needle — the indicator shows map heading, not absolute North.
  const needleAngle = mapRot;
  ctx.save();
  ctx.rotate(needleAngle);
  // Red tip = North end (points toward game North after rotation)
  ctx.beginPath();
  ctx.moveTo(0, -r*0.80); ctx.lineTo(r*0.055, r*0.06); ctx.lineTo(-r*0.055, r*0.06); ctx.closePath();
  ctx.fillStyle = "#ff3333"; ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 0.5; ctx.stroke();
  // White tail = South end
  ctx.beginPath();
  ctx.moveTo(0, r*0.80); ctx.lineTo(r*0.055, -r*0.06); ctx.lineTo(-r*0.055, -r*0.06); ctx.closePath();
  ctx.fillStyle = "#e8e8e8"; ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 0.5; ctx.stroke();
  // Centre pin
  ctx.beginPath(); ctx.arc(0, 0, r*0.06, 0, Math.PI*2);
  ctx.fillStyle = "#888"; ctx.fill();
  ctx.restore();

  // ── Bearing readout — shows normalised mapRot, 0=default/reset ──
  const bearingDeg = Math.round(((mapRot * 180 / Math.PI) % 360 + 360) % 360);
  ctx.fillStyle = "rgba(0,0,0,0.70)";
  ctx.fillRect(-r*0.32, r*0.64, r*0.64, r*0.23);
  ctx.strokeStyle = "rgba(255,204,68,0.35)";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-r*0.32, r*0.64, r*0.64, r*0.23);
  ctx.fillStyle = "#ffcc44";
  ctx.font = `bold ${r*0.17}px monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(`${bearingDeg}°`, 0, r*0.755);

  ctx.restore();
}

// ─── Artillery systems ─────────────────────────────────────────────────────── // build:20260401-6─
interface ArtySystem { id: string; name: string; game: string; category: string; minM: number; maxM: number; color: string; }
const _BUILD_ID = "20260411-6"; // force rebuild
const ARTY_SYSTEMS: ArtySystem[] = [
  // ── ARMA 3 — Mortars ─────────────────────────────────────────────────────
  { id:"mk6",     name:"Mk6 Mortar (60mm)",      game:"Arma 3", category:"Mortar",    minM:40,    maxM:4000,  color:"#ffcc44" },
  { id:"m252",    name:"M252 Mortar (81mm)",      game:"Arma 3", category:"Mortar",    minM:38,    maxM:6021,  color:"#ffcc44" },
  { id:"2b14",    name:"2B14 Podnos (82mm)",      game:"Arma 3", category:"Mortar",    minM:38,    maxM:4078,  color:"#ffcc44" },
  // ── ARMA 3 — Towed / Light Howitzers ──────────────────────────────────────
  { id:"m119",    name:"M119A1 Howitzer (105mm)", game:"Arma 3", category:"Howitzer",  minM:200,   maxM:4200,  color:"#ff9900" },
  { id:"d30",     name:"D-30 Howitzer (122mm)",   game:"Arma 3", category:"Howitzer",  minM:400,   maxM:5000,  color:"#ff9900" },
  // ── ARMA 3 — Self-Propelled Guns (SPG) ────────────────────────────────────
  { id:"2s1",     name:"2S1 Gvozdika (122mm)",    game:"Arma 3", category:"SPG",       minM:500,   maxM:8000,  color:"#ff6600" },
  { id:"m4sc",    name:"M4 Scorcher (155mm)",      game:"Arma 3", category:"SPG",       minM:800,   maxM:18000, color:"#ff6600" },
  { id:"m109",    name:"M109A6 Paladin (155mm)",   game:"Arma 3", category:"SPG",       minM:800,   maxM:18000, color:"#ff6600" },
  { id:"2s9sc",   name:"2S9 Sochor (120mm)",       game:"Arma 3", category:"SPG",       minM:500,   maxM:5000,  color:"#ff6600" },
  { id:"2s3",     name:"2S3M1 Akatsiya (152mm)",   game:"Arma 3", category:"SPG",       minM:500,   maxM:12000, color:"#ff6600" },
  // ── ARMA 3 — Multiple Launch Rocket Systems (MLRS) ────────────────────────
  { id:"bm21",    name:"BM-21 Grad (122mm)",       game:"Arma 3", category:"MLRS",      minM:500,   maxM:18000, color:"#ff4444" },
  { id:"zamak",   name:"Zamak MLRS (122mm)",        game:"Arma 3", category:"MLRS",      minM:500,   maxM:18000, color:"#ff4444" },
  { id:"rm70",    name:"RM-70 MLRS (122mm)",        game:"Arma 3", category:"MLRS",      minM:500,   maxM:18000, color:"#ff4444" },
  { id:"m5sand",  name:"M5 Sandstorm MLRS",         game:"Arma 3", category:"MLRS",      minM:2500,  maxM:30000, color:"#ff4444" },
  { id:"mlrs",    name:"M270 MLRS (227mm)",          game:"Arma 3", category:"MLRS",      minM:10000, maxM:40000, color:"#ff2222" },
  // ── SQUAD — Mortars ───────────────────────────────────────────────────────
  { id:"sq_m252", name:"M252 Mortar (81mm)",         game:"Squad",  category:"Mortar",   minM:50,    maxM:1270,  color:"#ffcc44" },
  { id:"sq_2b14", name:"2B14 Mortar (82mm)",          game:"Squad",  category:"Mortar",   minM:50,    maxM:1270,  color:"#ffcc44" },
  { id:"sq_m120", name:"M120 Mortar (120mm)",         game:"Squad",  category:"Mortar",   minM:100,   maxM:2000,  color:"#ffaa22" },
  { id:"sq_hav",  name:"Hävbåt 120mm Mortar",         game:"Squad",  category:"Mortar",   minM:100,   maxM:1800,  color:"#ffaa22" },
  // ── SQUAD — Recoilless / Direct Fire Support ──────────────────────────────
  { id:"sq_b10",  name:"B-10 Recoilless (82mm)",      game:"Squad",  category:"Recoilless", minM:50,  maxM:800,   color:"#ff9900" },
  { id:"sq_zis3", name:"ZIS-3 Field Gun (76mm)",       game:"Squad",  category:"Field Gun",  minM:100, maxM:1500,  color:"#ff9900" },
  // ── SQUAD — MLRS / Rocket Artillery ──────────────────────────────────────
  { id:"sq_bm21", name:"BM-21 Grad (122mm MLRS)",     game:"Squad",  category:"MLRS",     minM:900,   maxM:1500,  color:"#ff4444" },
  { id:"sq_ub32", name:"UB-32 Rocket Technical",       game:"Squad",  category:"MLRS",     minM:100,   maxM:2000,  color:"#ff4444" },
  // ── DAYZ ──────────────────────────────────────────────────────────────────
  { id:"dz_gp",   name:"GP-25 UGL (40mm)",             game:"DayZ",   category:"UGL",      minM:50,    maxM:400,   color:"#ffcc44" },
];

// ─── Grid overlay ──────────────────────────────────────────────────────────────
// step = pixels per in-game grid cell, derived from realSizeM / gridCellM * pixelsPerMetre

function drawGrid(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  realSizeM: number,
  gridCellM: number,
  zoom: number,
  panOffset: { x: number; y: number },
  gridSystem: "arma" | "squad" | "numeric" = "arma",
) {
  // ── Geometry ────────────────────────────────────────────────────────────────
  // All tile maps are square and fill max(cw,ch)*zoom pixels.
  const rendered    = Math.max(cw, ch) * zoom;
  const pxPerMetre  = rendered / realSizeM;
  const step        = gridCellM * pxPerMetre;          // px per primary grid cell
  if (step < 5) return;                                // too dense — skip

  // Canvas pixel of the map's top-left (NW) corner
  const mapX0 = cw / 2 + panOffset.x - rendered / 2;
  const mapY0 = ch / 2 + panOffset.y - rendered / 2;

  // Total whole cells across the map
  const totalCells = Math.ceil(realSizeM / gridCellM);

  // ── Grid lines (always anchored to world) ───────────────────────────────────
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth   = 0.7;
  ctx.setLineDash([]);

  for (let i = 0; i <= totalCells; i++) {
    const x = mapX0 + i * step;
    if (x < -1 || x > cw + 1) continue;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
  }
  for (let j = 0; j <= totalCells; j++) {
    const y = mapY0 + j * step;
    if (y < -1 || y > ch + 1) continue;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
  }

  // ── Labels ──────────────────────────────────────────────────────────────────
  // Only draw labels when cells are big enough to read
  if (step < 28) { ctx.restore(); return; }

  ctx.font          = "bold 9px monospace";
  ctx.textAlign     = "left";
  ctx.textBaseline  = "top";
  ctx.fillStyle     = "rgba(255,255,255,0.70)";

  for (let c = 0; c < totalCells; c++) {
    const x = mapX0 + c * step;
    if (x + step < 0 || x > cw) continue;

    for (let r = 0; r < totalCells; r++) {
      const y = mapY0 + r * step;
      if (y + step < 0 || y > ch) continue;

      if (gridSystem === "arma") {
        // ── Arma 3 / Arma Reforger / DayZ (same engine origin) ────────────────
        // In-game coords: origin SW. X increases east, Y increases north.
        // Canvas row 0 = north = highest northing.
        //
        // Each grid cell = gridCellM metres.  The in-game grid label shown on
        // the map is floor(worldX / 100) for easting and floor(worldY / 100)
        // for northing — always expressed in 100 m units (so 1 cell = 10 units
        // when gridCellM=1000).
        //
        // We show the label at the SW corner of the cell (bottom-left of the
        // canvas cell) which is the traditional land-nav convention.
        //
        // Easting:  c  * gridCellM metres from west edge
        // Northing: (totalCells - 1 - r) * gridCellM metres from south edge
        //           (r=0 is northernmost canvas row → highest northing)
        const eastingM   = c * gridCellM;
        const northingM  = (totalCells - 1 - r) * gridCellM;

        // Convert to in-game 100 m grid units (floor), zero-padded to 3 digits
        const eStr = String(Math.floor(eastingM  / 100)).padStart(3, "0");
        const nStr = String(Math.floor(northingM / 100)).padStart(3, "0");

        // Draw easting on top line, northing below — compact 2-line style
        ctx.fillText(eStr, x + 2, y + 2);
        ctx.fillText(nStr, x + 2, y + 11);

      } else if (gridSystem === "squad") {
        // ── Squad ─────────────────────────────────────────────────────────────
        // Letter = column (A at left, increases east). Number = row (1 at top,
        // increases south). Origin top-left. Each major cell = 300 m.
        // Label format: "A1", "B3", "Z12" etc.
        const letter = String.fromCharCode(65 + (c % 26));
        const num    = String(r + 1);
        ctx.fillText(letter + num, x + 2, y + 2);

      } else {
        // ── Generic numeric fallback ───────────────────────────────────────────
        // Simple zero-padded easting / northing in gridCellM units.
        const eStr = String(c).padStart(2, "0");
        const nStr = String(r).padStart(2, "0");
        ctx.fillText(eStr + "/" + nStr, x + 2, y + 2);
      }
    }
  }

  ctx.restore();
}

// ─── Military-style scale bar (km + metres) ───────────────────────────────────

function drawScaleBar(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  metersPerPixel: number,
) {
  const TARGET_PX = 200;        // wider bar
  const barM  = niceScaleBarM(metersPerPixel, TARGET_PX);
  const barPx = barM / metersPerPixel;

  const left    = 16;
  const bottom  = ch - 16;
  const KH      = 14;           // km bar height
  const MH      = 11;           // metres bar height
  const GAP     = 3;            // gap between bars
  const LABEL_H = 16;           // height reserved for top labels
  const totalH  = LABEL_H + KH + GAP + MH + 14;  // +14 for bottom labels

  const kmTop   = bottom - totalH + LABEL_H;
  const mTop    = kmTop + KH + GAP;
  const seg     = barPx / 5;

  ctx.save();

  // Background pill — sized to contain both bars + labels
  ctx.fillStyle = "rgba(0,0,0,0.70)";
  ctx.beginPath();
  ctx.roundRect(left - 8, bottom - totalH - 4, barPx + 28, totalH + 8, 5);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // ── Top row: km bar ────────────────────────────────────────────────────────
  // 5 alternating segments
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#1a1a1a" : "#ffffff";
    ctx.fillRect(left + i * seg, kmTop, seg, KH);
  }
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1;
  ctx.strokeRect(left, kmTop, barPx, KH);
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(left + i * seg, kmTop);
    ctx.lineTo(left + i * seg, kmTop + KH);
    ctx.stroke();
  }

  // Tick marks above km bar
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    ctx.beginPath();
    ctx.moveTo(left + i * seg, kmTop - 3);
    ctx.lineTo(left + i * seg, kmTop);
    ctx.stroke();
  }

  // KM labels above bar
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left"; ctx.textBaseline = "bottom";
  ctx.fillText("0", left, kmTop - 4);
  ctx.textAlign = "center";
  ctx.fillText(formatDist(barM / 2), left + barPx / 2, kmTop - 4);
  ctx.textAlign = "right";
  ctx.fillText(formatDist(barM), left + barPx, kmTop - 4);

  // ── Bottom row: metres bar (half the km bar width) ─────────────────────────
  const mBarM  = barM / 2;
  const mBarPx = mBarM / metersPerPixel;
  const mSeg   = mBarPx / 4;

  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#1a1a1a";
    ctx.fillRect(left + i * mSeg, mTop, mSeg, MH);
  }
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1;
  ctx.strokeRect(left, mTop, mBarPx, MH);
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(left + i * mSeg, mTop);
    ctx.lineTo(left + i * mSeg, mTop + MH);
    ctx.stroke();
  }

  // Metres labels below bar
  ctx.fillStyle = "#cccccc";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText("0", left, mTop + MH + 3);
  ctx.textAlign = "right";
  const mLabel = mBarM >= 1000
    ? `${(mBarM / 1000).toFixed(2)} km`
    : `${Math.round(mBarM)} m`;
  ctx.fillText(mLabel, left + mBarPx, mTop + MH + 3);

  ctx.restore();
}

// ─── Tile Map Layer ────────────────────────────────────────────────────────────
// Renders real topographic map tiles from atlas.plan-ops.fr
// Tile map renderer — renders plan-ops.fr slippy tiles at native resolution,
// then uses a single CSS transform to scale/pan the whole grid.
// This avoids floating-point tile position errors from per-tile width/height scaling.

interface TileLayerProps {
  tileConfig: TileConfig;
  panOffset: Pt;
  zoom: number;        // UI zoom multiplier (1.0 = fit to container)
  containerW: number;
  containerH: number;
  mapRotation: number; // radians
}

function TileMapLayer({ tileConfig, panOffset, zoom, containerW, containerH, mapRotation }: TileLayerProps) {
  const _MARKER = "TAG_TILE_v9_PRESENT";
  const W = containerW || 900;
  const H = containerH || 560;

  const { mapId, layerId, maxZoom, tileSize } = tileConfig;

  // Pick tile zoom level based on UI zoom + map zoom budget
  const tileZoom = Math.max(0, Math.min(maxZoom, Math.round(Math.log2(Math.max(zoom, 0.1)) + maxZoom * 0.6)));
  const numTiles = Math.pow(2, tileZoom);

  // Natural (unscaled) map size in pixels — tiles are rendered at native resolution
  const naturalMapPx = numTiles * tileSize;

  // Scale factor to fit the map into the container at current UI zoom
  // Use the larger dimension so the map always fills/covers the container
  const targetMapPx = Math.max(W, H) * zoom;
  const scale = targetMapPx / naturalMapPx;

  // Map center in screen space — used as CSS transform origin reference
  const centerX = W / 2 + panOffset.x;
  const centerY = H / 2 + panOffset.y;

  // Top-left origin of the natural map in screen space (before scale is applied)
  // After applying scale from the container's top-left, we offset to center the map
  const translateX = centerX - (naturalMapPx / 2) * scale;
  const translateY = centerY - (naturalMapPx / 2) * scale;

  // Visible tile range (in natural coordinates, accounting for scale)
  const invScale = 1 / scale;
  const startTX = Math.max(0, Math.floor((-translateX) * invScale / tileSize));
  const startTY = Math.max(0, Math.floor((-translateY) * invScale / tileSize));
  const endTX   = Math.min(numTiles - 1, Math.ceil((W - translateX) * invScale / tileSize));
  const endTY   = Math.min(numTiles - 1, Math.ceil((H - translateY) * invScale / tileSize));

  const tiles: { key: string; url: string; left: number; top: number }[] = [];
  for (let tx = startTX; tx <= endTX; tx++) {
    for (let ty = startTY; ty <= endTY; ty++) {
      // Standard XYZ tile scheme: y=0 is top-left (north-west)
      const tileUrl = tileConfig.tileUrlTemplate
        ? tileConfig.tileUrlTemplate.replace("{z}", String(tileZoom)).replace("{x}", String(tx)).replace("{y}", String(ty))
        : `https://atlas.plan-ops.fr/data/1/maps/${mapId}/${layerId}/${tileZoom}/${tx}/${ty}.png`;
      tiles.push({
        key: `${mapId}-${tileZoom}/${tx}/${ty}`,
        url: tileUrl,
        left: tx * tileSize,
        top:  ty * tileSize,
      });
    }
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ pointerEvents: "none", transform: `rotate(${mapRotation}rad)`, transformOrigin: "center center" }}
    >
      {/* Single container scaled + translated as one unit — no per-tile float maths */}
      <div
        key={`${mapId}-${tileZoom}`}
        style={{
          position: "absolute",
          width:  naturalMapPx,
          height: naturalMapPx,
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
          transformOrigin: "0 0",
          imageRendering: "pixelated",
        }}
      >
        {tiles.map(t => (
          <img
            key={t.key}
            src={t.url}
            alt=""
            draggable={false}
            width={tileSize}
            height={tileSize}
            style={{
              position: "absolute",
              left: t.left,
              top:  t.top,
              display: "block",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface Props {
  group: any;
  showMsg: (ok: boolean, msg: string) => void;
  initialJson?: string;
  onSave?: (json: string) => void;
  onBack?: () => void;
}

export const _MAP_BUILD = "v2-sidebar-fix-20260411";
export default function TacticalPlanner({ group, showMsg, initialJson, onSave, onBack }: Props) {
  console.log("TAG_TP_V5_XK7");

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [mapId,       setMapId]       = useState("a3_altis");
  const [tool,        setTool]        = useState<ToolMode>("pan");
  const [elements,    setElements]    = useState<PlanElement[]>([]);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [color,       setColor]       = useState("#000000");
  const [lw,          setLw]          = useState(2);
  const [dashed,      setDashed]      = useState(false);
  const [showGrid,    setShowGrid]    = useState(true);
  const [showCompass, setShowCompass] = useState(true);
  const [showScaleBar,setShowScaleBar]= useState(true);
  const [showCoords,  setShowCoords]  = useState(true);
  const [mapRotation, setMapRotation] = useState(0);
  const [canvasSize,  setCanvasSize]  = useState({ w: 900, h: 560 });
  const [zoom,        setZoom]        = useState(1.0);   // image zoom level
  const [panOffset,   setPanOffset]   = useState<Pt>({ x: 0, y: 0 });
  const [isPanning,   setIsPanning]   = useState(false);
  const [compassPos,  setCompassPos]  = useState<Pt>({ x: -1, y: -1 });  // -1 = auto (bottom-right)
  const isDraggingCompass = useRef(false);
  const compassDragStart  = useRef<Pt | null>(null);
  const compassPosStart   = useRef<Pt>({ x: 0, y: 0 });
  const compassClickOrigin = useRef<{cx:number;cy:number;startRot:number} | null>(null);
  const panStart      = useRef<Pt | null>(null);
  const panOffsetStart= useRef<Pt>({ x:0, y:0 });
  const [showMapPicker,  setShowMapPicker]  = useState(false);
  const mapPickerBtnRef = useRef<HTMLButtonElement>(null);
  const [showSymPicker,  setShowSymPicker]  = useState(false);
  const [labelPrompt,    setLabelPrompt]    = useState<{ cp: Pt; symKey: string } | null>(null);
  const [labelText,      setLabelText]      = useState("");
  const [labelFont,      setLabelFont]      = useState<LabelFont>("default");
  const [pendingSym,     setPendingSym]     = useState("inf");
  const [artySystem, setArtySystem] = useState<ArtySystem>(ARTY_SYSTEMS[0]);

  const [phasePoints, setPhasePoints] = useState<Pt[]>([]);
  const phasePointsRef = useRef<Pt[]>([]);
  const [phaseName, setPhaseName] = useState("PL AMBER");
  const [rulerStart,     setRulerStart]     = useState<Pt | null>(null);
  const [customBgUrl,    setCustomBgUrl]    = useState<string | null>(null);
  const [showOpLink,     setShowOpLink]     = useState(false);
  const [ops,            setOps]            = useState<any[]>([]);
  const [linkedOpId,     setLinkedOpId]     = useState<string | null>(null);
  const [cmdNote,        setCmdNote]        = useState("");
  const [showNotes,      setShowNotes]      = useState(false);
  const [showScaleHelper,setShowScaleHelper]= useState(false);
  const [showSidebar,    setShowSidebar]    = useState(false);
  const [preview,        setPreview]        = useState<PlanElement | null>(null);
  const [coordFormat,    setCoordFormat]    = useState<CoordFormat>("MGRS");
  const [measureUnit,    setMeasureUnit]    = useState<MeasureUnit>("metric");
  const [showSettings,   setShowSettings]   = useState(false);
  const [mouseMapPos,    setMouseMapPos]    = useState<{mx:number;my:number} | null>(null);
  // Track natural aspect ratio of static map image to compute accurate metersPerPixel
  const [mapImageAspect, setMapImageAspect] = useState<number>(1); // w/h

  const isDrawing  = useRef(false);
  const drawPath   = useRef<Pt[]>([]);
  const drawStart  = useRef<Pt | null>(null);
  const dragId     = useRef<string | null>(null);
  const dragPrev   = useRef<Pt | null>(null);
  const dragReady  = useRef<{id:string; pt:Pt} | null>(null);   // mousedown hit — drag starts after threshold

  // Single useMemo — TRACE_MARKER_V2_FIXED
  const { gameMap, filteredArtySystems } = useMemo(() => {
    const gm = GAME_MAPS.find(m => m.id === mapId) ?? GAME_MAPS[0];
    const g = gm.game;
    let arty: typeof ARTY_SYSTEMS;
    if (g.startsWith("Arma 3")) arty = ARTY_SYSTEMS.filter(s => s.game === "Arma 3");
    else if (g.startsWith("Squad"))  arty = ARTY_SYSTEMS.filter(s => s.game === "Squad");
    else if (g.startsWith("DayZ"))   arty = ARTY_SYSTEMS.filter(s => s.game === "DayZ");
    else arty = ARTY_SYSTEMS;
    return { gameMap: gm, filteredArtySystems: arty };
  }, [mapId]);

  // When map changes, reset artySystem to first valid one for that game
  useEffect(() => {
    if (!filteredArtySystems.find(s => s.id === artySystem.id)) {
      setArtySystem(filteredArtySystems[0] ?? ARTY_SYSTEMS[0]);
    }
  }, [filteredArtySystems]);

  // Reset image aspect ratio when map changes (before image loads)
  useEffect(() => { setMapImageAspect(1); }, [mapId]);

  // metersPerPixel: how many real-world metres each canvas pixel represents at current zoom.
  // For tile maps: tiles fill the canvas, so canvasSize.w is correct.
  // For static image maps (objectFit:contain): actual rendered width depends on aspect ratio.
  const metersPerPixel = useMemo(() => {
    if (gameMap.tileConfig) {
      // Tile maps fill canvas — canvas width = map width in pixels
      return gameMap.realSizeM / (canvasSize.w * zoom);
    }
    // Static image: objectFit:contain means the map is letterboxed.
    // Rendered map width = min(canvasW, canvasH * mapAR) where mapAR = mapImageAspect
    const ar = mapImageAspect > 0 ? mapImageAspect : 1;
    const renderedMapW = Math.min(canvasSize.w, canvasSize.h * ar);
    return gameMap.realSizeM / (renderedMapW * zoom);
  }, [gameMap.realSizeM, gameMap.tileConfig, canvasSize.w, canvasSize.h, zoom, mapImageAspect]);

  // canvasCapture kept for iframe custom map passthrough
  const canvasCapture = tool !== "pan";

  // Canvas sizing
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setCanvasSize({ w: Math.round(width), h: Math.round(height) });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Load ops for linked op feature
  useEffect(() => {
    if (!group?.id) return;
    apiFetch(`/milsimOps?path=list&group_id=${group.id}`)
      .then((r: any) => { if (Array.isArray(r)) setOps(r); })
      .catch(() => {});
  }, [group?.id]);

  // Load from initialJson
  useEffect(() => {
    if (!initialJson) return;
    try {
      const d = JSON.parse(initialJson);
      if (d.elements) {
        const sanitised = d.elements
          .filter((el: any) => el && el.type)
          .map((el: any) => ({
            ...el,
            points: Array.isArray(el.points)
              ? el.points.filter((p: any) => p != null && typeof p.x === 'number' && typeof p.y === 'number')
              : el.points,
          }));
        setElements(sanitised);
      }
      if (d.mapId) setMapId(d.mapId);
      if (d.cmdNote) setCmdNote(d.cmdNote);
      if (d.linkedOpId) setLinkedOpId(d.linkedOpId);
      if (d.zoom) setZoom(d.zoom);
    } catch {}
  }, [initialJson]);

  const linkedOp = useMemo(() => ops.find(o => o.id === linkedOpId), [ops, linkedOpId]);

  // ── Canvas draw ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = canvasSize;
    canvas.width = w; canvas.height = h;
    ctx.clearRect(0, 0, w, h);

    if (showGrid) drawGrid(ctx, w, h, gameMap.realSizeM, gameMap.gridCellM, zoom, panOffset, gameMap.gridSystem ?? 'squad');

    const allEls = preview ? [...elements, preview] : elements;

    for (const el of allEls) {
      try {
      ctx.save();
      const sel = el.id === selectedId;
      ctx.strokeStyle = el.color ?? "#ffffff"; ctx.fillStyle = el.color ?? "#ffffff"; ctx.lineWidth = el.lw ?? 1;
      ctx.setLineDash(el.dashed ? [6,3] : []);
      if (sel) { ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 8; }

      // ── World-space coordinate resolver ──────────────────────────────────────
      // New elements store wpts/wmx/wmy/wr in world metres.
      // Legacy elements store canvas pixels in points[]/x/y/r — leave as-is.
      const toCanvasPt = (wp: WPt): Pt => {
        const gm = gameMap;
        const aspect = gm.tileConfig ? 1 : mapImageAspect;
        const { cx: tcx, cy: tcy } = mapMetresToCanvas(wp.mx, wp.my, w, h, gm.realSizeM, panOffset, zoom, aspect, gm.northAtBottom ?? false);
        const rot = rotatePoint(tcx, tcy, w, h, mapRotation);
        return { x: rot.cx, y: rot.cy };
      };
      const wToCanvasPts = (wps: WPt[]): Pt[] => wps.map(toCanvasPt);

      // Resolve canvas points for this element (prefer world-space if available)
      const pts: Pt[] = el.wpts ? wToCanvasPts(el.wpts) : (el.points?.filter((p:any) => p!=null && typeof p.x==='number') ?? []);
      const cx0 = el.wmx != null ? toCanvasPt({mx:el.wmx, my:el.wmy!}).x : (el.x ?? 0);
      const cy0 = el.wmy != null ? toCanvasPt({mx:el.wmx!, my:el.wmy!}).y : (el.y ?? 0);
      // World-space radius: convert metres to current canvas pixels
      const worldRadToPx = (metres: number) => {
        const gm = gameMap;
        const rendered = Math.max(w, h) * zoom;
        return (metres / gm.realSizeM) * rendered;
      };

      if (el.type === "draw" && pts.length > 1) {
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      }
      if ((el.type === "line" || el.type === "arrow") && pts.length === 2) {
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y); ctx.stroke();
        if (el.type === "arrow") drawArrowHead(ctx, pts[0], pts[1], 14);
      }
      if (el.type === "rect" && pts.length === 2) {
        // Stored as TL + BR world points
        ctx.strokeRect(pts[0].x, pts[0].y, pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      } else if (el.type === "rect" && el.x != null && el.y != null && el.w != null && el.h != null) {
        // Legacy canvas coords
        ctx.strokeRect(el.x, el.y, el.w, el.h);
      }
      if (el.type === "circle") {
        const r = el.wr != null ? worldRadToPx(el.wr) : (el.r ?? 0);
        if (r > 0) { ctx.beginPath(); ctx.arc(cx0, cy0, r, 0, Math.PI*2); ctx.stroke(); }
      }

      if (el.type === "ruler" && pts.length >= 2) {
        ctx.setLineDash([6, 3]);
        ctx.strokeStyle = "#ffcc44"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); ctx.stroke();
        ctx.setLineDash([]);
        for (const p of pts) {
          ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
          ctx.fillStyle = "#ffcc44"; ctx.fill();
        }
        if (el.label) {
          const midx = (pts[0].x + pts[1].x) / 2;
          const midy = (pts[0].y + pts[1].y) / 2;
          const angle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
          ctx.save();
          ctx.translate(midx, midy);
          const flip = Math.abs(angle) > Math.PI / 2;
          ctx.rotate(flip ? angle + Math.PI : angle);
          ctx.font = handFont(el.labelFont as LabelFont | undefined, 11);
          const tw = ctx.measureText(el.label).width;
          if (!el.labelFont || el.labelFont === "default") {
            ctx.fillStyle = "rgba(0,0,0,0.65)";
            ctx.fillRect(-tw/2 - 3, -17, tw + 6, 13);
          }
          ctx.fillStyle = "#ffcc44";
          if (el.labelFont && el.labelFont !== "default") {
            ctx.shadowColor="rgba(0,0,0,0.9)"; ctx.shadowBlur=4;
            ctx.textAlign = "left"; ctx.textBaseline = "bottom";
            jitterFillText(ctx, el.label, 0, -5, el.labelFont === "field" ? 2.2 : 1.4);
          } else {
            ctx.textAlign = "center"; ctx.textBaseline = "bottom";
            ctx.fillText(el.label, 0, -5);
          }
          ctx.shadowBlur = 0;
          ctx.restore();
        }
      }

      if (el.type === "bearing" && pts.length >= 2) {
        const [p0, p1] = pts as [Pt,Pt];
        ctx.setLineDash([8, 4]);
        ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = el.lw ?? 2;
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(p1.x, p1.y, 5, 0, Math.PI*2);
        ctx.fillStyle = "#00ffcc"; ctx.fill();
        const deg = ((Math.atan2(p1.x - p0.x, p0.y - p1.y) * 180 / Math.PI) + 360) % 360;
        const lbl = `${Math.round(deg)}°`;
        const midx = (p0.x + p1.x) / 2;
        const midy = (p0.y + p1.y) / 2;
        ctx.font = "bold 12px Arial";
        const tw = ctx.measureText(lbl).width;
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(midx - tw/2 - 3, midy - 16, tw + 6, 14);
        ctx.fillStyle = "#00ffcc"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.fillText(lbl, midx, midy - 3);
      }

      if (el.type === "arty") {
        const ax = cx0, ay = cy0;
        // World-space radii → canvas pixels
        const innerR = el.wr  != null ? worldRadToPx(el.wr)  : (el.r != null ? el.r : 0);
        const outerR = el.wr2 != null ? worldRadToPx(el.wr2) : (el.w != null ? el.w : 0);
        if (outerR > 0) {
        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = el.color ?? "#ff9900"; ctx.lineWidth = 1.5;
        if (innerR > 0) { ctx.beginPath(); ctx.arc(ax, ay, innerR, 0, Math.PI*2); ctx.stroke(); }
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ax, ay, outerR, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.07;
        ctx.fillStyle = el.color ?? "#ff9900";
        ctx.beginPath(); ctx.arc(ax, ay, outerR, 0, Math.PI*2); ctx.fill();
        if (innerR > 0) {
          ctx.globalAlpha = 0.12; ctx.fillStyle = "#000000";
          ctx.beginPath(); ctx.arc(ax, ay, innerR, 0, Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = el.color ?? "#ff9900"; ctx.lineWidth = 1.5;
        const cs = 8;
        ctx.beginPath(); ctx.moveTo(ax - cs, ay); ctx.lineTo(ax + cs, ay); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax, ay - cs); ctx.lineTo(ax, ay + cs); ctx.stroke();
        if (el.label) {
          ctx.font = handFont(el.labelFont as LabelFont | undefined, 11);
          const tw = ctx.measureText(el.label).width;
          if (!el.labelFont || el.labelFont === "default") {
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(ax - tw/2 - 3, ay - 26, tw + 6, 14);
          }
          ctx.fillStyle = el.color ?? "#ff9900";
          if (el.labelFont && el.labelFont !== "default") {
            ctx.shadowColor="rgba(0,0,0,0.9)"; ctx.shadowBlur=4;
            ctx.textAlign = "left"; ctx.textBaseline = "bottom";
            jitterFillText(ctx, el.label, ax, ay - 13, el.labelFont === "field" ? 2.2 : 1.4);
          } else {
            ctx.textAlign = "center"; ctx.textBaseline = "bottom";
            ctx.fillText(el.label, ax, ay - 13);
          }
          ctx.shadowBlur = 0;
        }
        } // end if (outerR > 0)
      }

      if (el.type === "phase" && pts.length >= 2) {
        ctx.setLineDash([10, 4]);
        ctx.strokeStyle = el.color ?? "#ff4a4a"; ctx.lineWidth = el.lw ?? 2.5;
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
        ctx.setLineDash([]);
        for (const p of pts) {
          ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
          ctx.fillStyle = el.color ?? "#ff4a4a"; ctx.fill();
        }
        if (el.label) {
          const mid = pts[Math.floor(pts.length / 2)];
          ctx.font = handFont(el.labelFont as LabelFont | undefined, 12);
          const tw = ctx.measureText(el.label).width;
          if (!el.labelFont || el.labelFont === "default") {
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(mid.x - tw/2 - 4, mid.y - 22, tw + 8, 16);
          }
          ctx.fillStyle = el.color ?? "#ff4a4a";
          if (el.labelFont && el.labelFont !== "default") {
            ctx.shadowColor="rgba(0,0,0,0.9)"; ctx.shadowBlur=4;
            ctx.textAlign = "left"; ctx.textBaseline = "bottom";
            jitterFillText(ctx, el.label, mid.x, mid.y - 7, el.labelFont === "field" ? 2.2 : 1.4);
          } else {
            ctx.textAlign = "center"; ctx.textBaseline = "bottom";
            ctx.fillText(el.label, mid.x, mid.y - 7);
          }
          ctx.shadowBlur = 0;
        }
      }

      if (el.type === "marker" && el.symbol) {
        const sym = NATO_SYMS.find(s => s.key === el.symbol);
        if (sym) {
          ctx.setLineDash([]); ctx.shadowBlur = 0;
          // Use world-space position if available, fall back to legacy canvas coords
          const mx = el.wmx != null ? cx0 : (el.x ?? 0);
          const my = el.wmy != null ? cy0 : (el.y ?? 0);
          drawNatoMarker(ctx, sym, mx, my, el.label ?? "", sel, el.rotation ?? 0, el.flip ?? false, el.markerColor ?? "#ffffff", el.lw ?? 2, (el.labelFont ?? "default") as LabelFont);
        }
      }

      ctx.restore();
      } catch (renderErr) {
        console.error('[TacticalPlanner] Canvas render crash on element:', JSON.stringify(el), renderErr);
        try { ctx.restore(); } catch {}
      }
    }

    // Live ruler preview line while placing first point
    if (tool === "ruler" && rulerStart) {
      // (preview handled by onMouseMove via preview state)
    }

    if (showCompass) {
      const cx = compassPos.x >= 0 ? compassPos.x : w - 72;
      const cy = compassPos.y >= 0 ? compassPos.y : h - 72;
      drawFullCompass(ctx, cx, cy, 58, mapRotation, gameMap.northAtBottom ?? false);
    }
    if (showScaleBar) drawScaleBar(ctx, w, h, metersPerPixel);

  }, [elements, preview, showGrid, showCompass, showScaleBar, canvasSize, selectedId, mapRotation, metersPerPixel, tool, rulerStart, compassPos, gameMap, zoom, panOffset]);

  // ── Coordinate helper — reads from ref, always fresh ─────────────────────────

  const getEvtPt = useCallback((e: React.MouseEvent | MouseEvent): Pt => {
    const r = containerRef.current?.getBoundingClientRect() ?? { left: 0, top: 0, width: 1, height: 1 };
    const { w, h } = canvasSizeRef.current;
    return {
      x: (e.clientX - r.left) * (w / r.width),
      y: (e.clientY - r.top)  * (h / r.height),
    };
  }, []);   // stable forever — reads refs only

  // ── Pointer events — defined ONCE, read current values from refs ──────────────

  // ── World-space coordinate helpers ──────────────────────────────────────────
  // Convert a canvas-pixel Pt to a world-space WPt (metres from SW corner).
  // All elements MUST store world-space coords so they stay anchored on zoom/pan.
  const toWorld = useCallback((pt: Pt): WPt => {
    const { w, h } = canvasSizeRef.current;
    const gm = GAME_MAPS.find(m => m.id === mapIdRef.current) ?? GAME_MAPS[0];
    const aspect = gm.tileConfig ? 1 : mapImageAspectRef.current;
    // Undo map rotation first
    const { cx, cy } = unrotatePoint(pt.x, pt.y, w, h, mapRotationRef.current);
    return canvasToMapMetres(cx, cy, w, h, gm.realSizeM, panOffsetRef.current, zoomRef.current, aspect, gm.northAtBottom ?? false);
  }, []);

  // Convert a world-space WPt back to canvas pixels for drawing.
  const fromWorld = useCallback((wp: WPt): Pt => {
    const { w, h } = canvasSizeRef.current;
    const gm = GAME_MAPS.find(m => m.id === mapIdRef.current) ?? GAME_MAPS[0];
    const aspect = gm.tileConfig ? 1 : mapImageAspectRef.current;
    const { cx, cy } = mapMetresToCanvas(wp.mx, wp.my, w, h, gm.realSizeM, panOffsetRef.current, zoomRef.current, aspect, gm.northAtBottom ?? false);
    // Re-apply map rotation so marker follows the rotated canvas
    const rotated = rotatePoint(cx, cy, w, h, mapRotationRef.current);
    return { x: rotated.cx, y: rotated.cy };
  }, []);

  // ── Hit test ─────────────────────────────────────────────────────────────────

  const hitTest = useCallback((cp: Pt) => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      // For elements with world-space coords, convert to current canvas position first
      const elPt: Pt | null = el.wmx != null && el.wmy != null
        ? fromWorld({ mx: el.wmx, my: el.wmy })
        : (el.x != null && el.y != null ? { x: el.x, y: el.y } : null);
      if (!elPt) continue;

      if (el.type === "marker" || el.type === "ruler") {
        if (dist(cp, elPt) < 28) return el;
      }
      // For multi-point elements, check against first world point
      if ((el.type === "line" || el.type === "arrow" || el.type === "phase" || el.type === "freehand") && el.wpts && el.wpts.length > 0) {
        const p0 = fromWorld(el.wpts[0]);
        if (dist(cp, p0) < 18) return el;
      }
      if (el.type === "arty" && elPt) {
        if (dist(cp, elPt) < 18) return el;
      }
      if (el.type === "rect") {
        // rect stored as world TL + BR corners
        if (el.wpts && el.wpts.length >= 2) {
          const tl = fromWorld(el.wpts[0]);
          const br = fromWorld(el.wpts[1]);
          if (cp.x >= Math.min(tl.x,br.x) && cp.x <= Math.max(tl.x,br.x) &&
              cp.y >= Math.min(tl.y,br.y) && cp.y <= Math.max(tl.y,br.y)) return el;
        } else if (el.x != null && el.y != null && el.w != null && el.h != null) {
          if (cp.x >= el.x && cp.x <= el.x + el.w && cp.y >= el.y && cp.y <= el.y + el.h) return el;
        }
      }
    }
    return null;
  }, [elements, fromWorld]);

  // ── Stable refs for everything handlers need ──────────────────────────────────
  // Keeps mouse handlers stable (no recreation mid-drag = no lost events)

  const compassPosRef     = useRef(compassPos);
  const isPanningRef      = useRef(isPanning);
  const showCompassRef    = useRef(showCompass);
  const mapRotationRef    = useRef(mapRotation);
  const toolRef           = useRef(tool);
  const colorRef          = useRef(color);
  const lwRef             = useRef(lw);
  const dashedRef         = useRef(dashed);
  const rulerStartRef     = useRef(rulerStart);
  const metersPerPixelRef = useRef(metersPerPixel);
  const pendingSymRef     = useRef(pendingSym);
  const canvasSizeRef     = useRef(canvasSize);
  const measureUnitRef    = useRef(measureUnit);
  const panOffsetRef      = useRef(panOffset);
  const zoomRef           = useRef(zoom);
  const mapIdRef          = useRef(mapId);
  const mapImageAspectRef = useRef(mapImageAspect);

  useEffect(() => { compassPosRef.current     = compassPos;     }, [compassPos]);
  useEffect(() => { isPanningRef.current      = isPanning;       }, [isPanning]);
  useEffect(() => { showCompassRef.current    = showCompass;     }, [showCompass]);
  useEffect(() => { mapRotationRef.current    = mapRotation;     }, [mapRotation]);
  useEffect(() => { toolRef.current           = tool;           }, [tool]);
  useEffect(() => { colorRef.current          = color;          }, [color]);
  useEffect(() => { lwRef.current             = lw;             }, [lw]);
  useEffect(() => { dashedRef.current         = dashed;         }, [dashed]);
  useEffect(() => { rulerStartRef.current     = rulerStart;     }, [rulerStart]);
  useEffect(() => { metersPerPixelRef.current = metersPerPixel; }, [metersPerPixel]);
  useEffect(() => { phasePointsRef.current = phasePoints; }, [phasePoints]);
  useEffect(() => { pendingSymRef.current     = pendingSym;     }, [pendingSym]);
  useEffect(() => { canvasSizeRef.current     = canvasSize;     }, [canvasSize]);
  useEffect(() => { measureUnitRef.current    = measureUnit;    }, [measureUnit]);
  useEffect(() => { panOffsetRef.current      = panOffset;      }, [panOffset]);
  useEffect(() => { zoomRef.current           = zoom;           }, [zoom]);
  useEffect(() => { mapIdRef.current          = mapId;          }, [mapId]);
  useEffect(() => { mapImageAspectRef.current = mapImageAspect; }, [mapImageAspect]);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const t = toolRef.current;
    const cp = getEvtPt(e);

    // Compass drag — works in ALL tool modes
    if (showCompassRef.current) {
      const cPos = compassPosRef.current;
      const { w, h } = canvasSizeRef.current;
      const r = containerRef.current?.getBoundingClientRect();
      if (!r) return;
      const cx = cPos.x >= 0 ? cPos.x : w - 72;
      const cy = cPos.y >= 0 ? cPos.y : h - 72;
      // cp is in canvas coords, but compass is also in canvas coords
      const dx = (e.clientX - r.left) * (w / r.width) - cx;
      const dy = (e.clientY - r.top)  * (h / r.height) - cy;
      if (Math.sqrt(dx*dx + dy*dy) < 62) {
        isDraggingCompass.current = true;
        compassDragStart.current  = { x: e.clientX, y: e.clientY };
        compassPosStart.current   = { x: cx, y: cy };
        compassClickOrigin.current = { cx: e.clientX, cy: e.clientY, startRot: mapRotationRef.current };
        e.stopPropagation();
        return;
      }
    }

    if (t === "pan") {
      // Check if clicking a placed element first — if so, select + drag it instead of pan
      const hitPan = hitTest(cp);
      if (hitPan) {
        setSelectedId(hitPan.id);
        dragReady.current = { id: hitPan.id, pt: cp };
        dragId.current = null;
        dragPrev.current = null;
        return;
      }
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      panOffsetStart.current = panOffset;
      return;
    }

    if (t === "select") {
      const hit = hitTest(cp);
      if (hit) {
        setSelectedId(hit.id);
        dragReady.current = { id: hit.id, pt: cp };
        dragId.current = null;
        dragPrev.current = null;
      } else {
        setSelectedId(null);
        dragId.current = null;
        dragReady.current = null;
      }
      return;
    }

    if (t === "ruler") {
      const rs = rulerStartRef.current;
      if (!rs) {
        setRulerStart(cp);
      } else {
        const wp0 = toWorld(rs);
        const wp1 = toWorld(cp);
        const metres = Math.hypot(wp1.mx - wp0.mx, wp1.my - wp0.my);
        const lbl = formatDist(metres, measureUnitRef.current);
        setElements(prev => [...prev, {
          id: uid(), type:"ruler",
          wpts:[wp0, wp1],
          color:"#ffcc44", lw:1.5, label:lbl,
        }]);
        setRulerStart(null);
        setPreview(null);
      }
      return;
    }

    if (t === "bearing") {
      const rs = rulerStartRef.current;
      if (!rs) {
        setRulerStart(cp);
      } else {
        setElements(prev => [...prev, {
          id: uid(), type:"bearing",
          wpts:[toWorld(rs), toWorld(cp)],
          color:"#00ffcc", lw:2, label:"",
        }]);
        setRulerStart(null);
        setPreview(null);
      }
      return;
    }

    if (t === "arty") {
      const sys = artySystem;
      const wc = toWorld(cp);
      setElements(prev => [...prev, {
        id: uid(), type:"arty",
        wmx: wc.mx, wmy: wc.my,
        wr:  sys.minM,   // inner radius in metres
        wr2: sys.maxM,   // outer radius in metres
        color: sys.color, lw:1.5, label: sys.name,
      }]);
      return;
    }

    if (t === "phase") {
      setPhasePoints(prev => {
        const next = [...prev, cp];
        phasePointsRef.current = next;
        return next;
      });
      // Note: phase completion (from onMouseDown finalise) will convert to world coords
      return;
    }

    if (t === "marker") {
      setLabelPrompt({ cp, symKey: pendingSymRef.current });
      return;
    }

    // Drawing tools
    isDrawing.current = true;
    drawStart.current = cp;
    drawPath.current  = [cp];
  }, [getEvtPt, hitTest, panOffset]);   // showCompass read from ref

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const t = toolRef.current;

    // Track mouse map coordinates for HUD display
    {
      const { w, h } = canvasSizeRef.current;
      const r = containerRef.current?.getBoundingClientRect();
      if (r) {
        const scaleX = w / r.width;
        const scaleY = h / r.height;
        const rawCx = (e.clientX - r.left) * scaleX;
        const rawCy = (e.clientY - r.top)  * scaleY;
        const gm = GAME_MAPS.find(m => m.id === mapIdRef.current) ?? GAME_MAPS[0];
        const aspect = gm.tileConfig ? 1 : mapImageAspectRef.current;
        // Undo map rotation so coordinates are in unrotated map space
        const { cx, cy } = unrotatePoint(rawCx, rawCy, w, h, mapRotationRef.current);
        const pos = canvasToMapMetres(cx, cy, w, h, gm.realSizeM, panOffsetRef.current, zoomRef.current, aspect, gm.northAtBottom ?? false);
        setMouseMapPos(pos);
      }
    }

    // Compass drag
    if (isDraggingCompass.current && compassDragStart.current) {
      const { w, h } = canvasSizeRef.current;
      const r = containerRef.current?.getBoundingClientRect();
      if (!r) return;
      const scaleX = w / r.width;
      const scaleY = h / r.height;
      const dx = (e.clientX - compassDragStart.current.x) * scaleX;
      const dy = (e.clientY - compassDragStart.current.y) * scaleY;
      // Rotate map based on angular drag around compass centre
      if (compassClickOrigin.current) {
        const cPos = compassPosRef.current;
        const cxCanvas = cPos.x >= 0 ? cPos.x : w - 72;
        const cyCanvas = cPos.y >= 0 ? cPos.y : h - 72;
        const cxScreen = r.left + cxCanvas / scaleX;
        const cyScreen = r.top  + cyCanvas / scaleY;
        const startAngle = Math.atan2(compassClickOrigin.current.cy - cyScreen, compassClickOrigin.current.cx - cxScreen);
        const curAngle   = Math.atan2(e.clientY - cyScreen, e.clientX - cxScreen);
        setMapRotation(compassClickOrigin.current.startRot + (curAngle - startAngle));
      } else {
        setCompassPos({
          x: Math.max(62, Math.min(w - 62, compassPosStart.current.x + dx)),
          y: Math.max(62, Math.min(h - 62, compassPosStart.current.y + dy)),
        });
      }
      return;
    }

    // Pan (clamped so map never drifts off-screen)
    if (t === "pan" && isPanningRef.current && panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      const rawX = panOffsetStart.current.x + dx;
      const rawY = panOffsetStart.current.y + dy;
      // Clamp: rendered map size = max(W,H)*zoom; half of excess = how far we can pan
      const cW = canvasSize.w || 900;
      const cH = canvasSize.h || 560;
      const renderedMap = Math.max(cW, cH) * zoomRef.current;
      const maxPanX = Math.max(0, (renderedMap - cW) / 2);
      const maxPanY = Math.max(0, (renderedMap - cH) / 2);
      setPanOffset({
        x: Math.max(-maxPanX, Math.min(maxPanX, rawX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, rawY)),
      });
      return;
    }

    const rs = rulerStartRef.current;

    if (!isDrawing.current && !dragId.current && !dragReady.current && t !== "ruler" && t !== "bearing" && t !== "phase") return;
    const cp = getEvtPt(e);

    // Promote pending drag to active after threshold
    if (dragReady.current && !dragId.current) {
      const dxr = cp.x - dragReady.current.pt.x;
      const dyr = cp.y - dragReady.current.pt.y;
      if (Math.sqrt(dxr*dxr + dyr*dyr) > 2) {
        dragId.current = dragReady.current.id;
        dragPrev.current = dragReady.current.pt;
        dragReady.current = null;
      }
    }

    // Drag selected element
    if (dragId.current && dragPrev.current) {
      const dx = cp.x - dragPrev.current.x;
      const dy = cp.y - dragPrev.current.y;
      // Convert pixel delta to world-space delta so wmx/wmy elements move correctly
      const mpp = metersPerPixelRef.current / zoomRef.current;
      const dmx =  dx * mpp;
      const dmy = -dy * mpp;  // Y is inverted (screen Y down = world Y up)
      setElements(prev => prev.map(el => {
        if (el.id !== dragId.current) return el;
        const updates: Partial<typeof el> = {};
        // World-space centre (markers, arty, rect, circle)
        if (el.wmx != null) updates.wmx = el.wmx + dmx;
        if (el.wmy != null) updates.wmy = el.wmy + dmy;
        // World-space point array (lines, arrows, phase lines, freehand)
        if (el.wpts && el.wpts.length > 0) {
          updates.wpts = el.wpts.map(p => ({ mx: p.mx + dmx, my: p.my + dmy }));
        }
        // Legacy pixel fallback
        if (el.wmx == null && el.x != null) updates.x = el.x + dx;
        if (el.wmy == null && el.y != null) updates.y = el.y + dy;
        if (!el.wpts && el.points) {
          updates.points = el.points.map(p => p == null ? p : { x: p.x + dx, y: p.y + dy });
        }
        return { ...el, ...updates };
      }));
      dragPrev.current = cp;
      return;
    }

    // Live ruler preview
    if (t === "ruler" && rs) {
      const px = dist(rs, cp);
      const metres = px * metersPerPixelRef.current;
      const lbl = formatDist(metres, measureUnitRef.current);
      setPreview({
        id:"__preview__", type:"ruler",
        points:[rs, cp],
        x:(rs.x+cp.x)/2, y:(rs.y+cp.y)/2,
        color:"#ffcc44cc", lw:1.2, label:lbl,
      });
      return;
    }

    if (t === "bearing" && rs) {
      setPreview({ id:"__preview__", type:"bearing", points:[rs, cp], x:(rs.x+cp.x)/2, y:(rs.y+cp.y)/2, color:"#00ffccaa", lw:1.5, label:"" });
      return;
    }

    if (t === "phase" && phasePointsRef.current.length > 0) {
      const pts = phasePointsRef.current;
      setPreview({ id:"__preview__", type:"phase", points:[...pts, cp], x:pts[0].x, y:pts[0].y, color:"#ff4a4aaa", lw:2, label:"" });
      return;
    }

    if (!isDrawing.current) return;

    const c = colorRef.current;
    const w = lwRef.current;
    const d = dashedRef.current;

    if (t === "draw") {
      drawPath.current.push(cp);
      setPreview({ id:"__preview__", type:"draw", points:[...drawPath.current], color:c, lw:w, dashed:d });
    } else if ((t === "line" || t === "arrow") && drawStart.current) {
      setPreview({ id:"__preview__", type:t, points:[drawStart.current, cp], color:c, lw:w, dashed:d });
    } else if (t === "rect" && drawStart.current) {
      const s = drawStart.current;
      const rw = Math.abs(cp.x - s.x);
      const rh = Math.abs(cp.y - s.y);
      if (rw > 1 && rh > 1) {
        setPreview({ id:"__preview__", type:"rect",
          x:Math.min(s.x,cp.x), y:Math.min(s.y,cp.y),
          w:rw, h:rh,
          color:c, lw:w, dashed:d });
      }
    } else if (t === "circle" && drawStart.current) {
      const cr = dist(drawStart.current, cp);
      if (cr > 1) {
        setPreview({ id:"__preview__", type:"circle",
          x:drawStart.current.x, y:drawStart.current.y,
          r:cr, color:c, lw:w, dashed:d });
      }
    }
  }, [getEvtPt]);   // fully stable — all state read from refs

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    const t = toolRef.current;
    if (isDraggingCompass.current) {
      isDraggingCompass.current = false;
      compassDragStart.current  = null;
      return;
    }
    if (t === "pan") { setIsPanning(false); panStart.current = null; return; }
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const cp = getEvtPt(e);
    setPreview(null);
    const c = colorRef.current;
    const w = lwRef.current;
    const d = dashedRef.current;
    if (t === "draw" && drawPath.current.length > 1) {
      // Store draw paths as world points
      const wpts = drawPath.current.map(p => toWorld(p));
      setElements(p => [...p, { id:uid(), type:"draw", wpts, color:c, lw:w, dashed:d }]);
    } else if (t === "line" && drawStart.current) {
      setElements(p => [...p, { id:uid(), type:"line",
        wpts:[toWorld(drawStart.current!), toWorld(cp)],
        color:c, lw:w, dashed:d }]);
    } else if (t === "arrow" && drawStart.current) {
      const ds = drawStart.current;
      if (dist(ds, cp) > 2) {
        setElements(p => [...p, { id:uid(), type:"arrow",
          wpts:[toWorld(ds), toWorld(cp)],
          color:c, lw:w, dashed:d }]);
      }
    } else if (t === "rect" && drawStart.current) {
      const s = drawStart.current;
      const rw = Math.abs(cp.x - s.x);
      const rh = Math.abs(cp.y - s.y);
      if (rw > 2 && rh > 2) {
        // Store rect as two world-space corner points
        const tl = toWorld({ x: Math.min(s.x, cp.x), y: Math.min(s.y, cp.y) });
        const br = toWorld({ x: Math.max(s.x, cp.x), y: Math.max(s.y, cp.y) });
        setElements(p => [...p, { id:uid(), type:"rect",
          wpts:[tl, br],
          color:c, lw:w, dashed:d }]);
      }
    } else if (t === "circle" && drawStart.current) {
      const ds = drawStart.current;
      const cr = dist(ds, cp);
      if (cr > 2) {
        // Store centre + radius in world metres
        const centre = toWorld(ds);
        const edge   = toWorld(cp);
        const wr = Math.hypot(edge.mx - centre.mx, edge.my - centre.my);
        setElements(p => [...p, { id:uid(), type:"circle",
          wmx:centre.mx, wmy:centre.my, wr,
          color:c, lw:w, dashed:d }]);
      }
    }
    drawPath.current = []; drawStart.current = null;
  }, [getEvtPt, toWorld]);   // reads all from refs — stable

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape") {
        if (toolRef.current === "phase") { setPhasePoints([]); phasePointsRef.current=[]; setPreview(null); return; } setSelectedId(null); setRulerStart(null); setLabelPrompt(null); setPreview(null); }
      if (e.key === "Delete" && selectedId) {
        setElements(p => p.filter(el => el.id !== selectedId)); setSelectedId(null);
      }
      const m: Record<string, ToolMode> = { p:"pan", v:"select", d:"draw", l:"line", a:"arrow", r:"ruler", m:"marker", b:"bearing" };
      if (m[e.key.toLowerCase()]) setTool(m[e.key.toLowerCase()]);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [selectedId]);

  // Reset pan+zoom when map changes
  useEffect(() => {
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
  }, [mapId]);

  // ── Save / Export ─────────────────────────────────────────────────────────────

  const savePlan = useCallback(async () => {
    const json = JSON.stringify({ mapId, elements, cmdNote, linkedOpId, zoom });
    if (onSave) { onSave(json); return; }
    try {
      await apiFetch("/milsimBriefings?path=save-plan", {
        method:"POST",
        body: JSON.stringify({ group_id: group?.id, content_json: json }),
      });
      showMsg(true, "Plan saved");
    } catch { showMsg(false, "Save failed"); }
  }, [mapId, elements, cmdNote, linkedOpId, zoom, group, onSave, showMsg]);

  const exportPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `tac-plan-${gameMap.name.toLowerCase().replace(/\s+/g,"-")}.png`;
    a.click();
  }, [gameMap]);

  // ── Zoom helpers ──────────────────────────────────────────────────────────────

  const clampPan = (newZoom: number) => {
    setPanOffset(prev => {
      const cW = canvasSize.w || 900;
      const cH = canvasSize.h || 560;
      const renderedMap = Math.max(cW, cH) * newZoom;
      const maxPanX = Math.max(0, (renderedMap - cW) / 2);
      const maxPanY = Math.max(0, (renderedMap - cH) / 2);
      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, prev.x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, prev.y)),
      };
    });
  };
  const zoomIn  = () => { const nz = Math.min(zoomRef.current + 0.25, 4.0); setZoom(nz); clampPan(nz); };
  const zoomOut = () => { const nz = Math.max(zoomRef.current - 0.25, 0.25); setZoom(nz); clampPan(nz); };
  const zoomReset = () => { setZoom(1.0); setPanOffset({ x: 0, y: 0 }); };

  // ── Button class helpers ──────────────────────────────────────────────────────

  const btnCls = (active: boolean, danger = false) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all flex-shrink-0 ${
      danger
        ? "border-red-500/50 text-red-400 hover:bg-red-500/15"
        : active
          ? "bg-primary/15 border-primary/50 text-primary"
          : "border-border text-muted-foreground hover:bg-secondary/50"
    }`;

  const TOOLS = [
    { id:"pan",    icon:<Move          className="w-3.5 h-3.5"/>, label:"Pan",    k:"P" },
    { id:"select", icon:<MousePointer2 className="w-3.5 h-3.5"/>, label:"Select", k:"V" },
    { id:"draw",   icon:<Pencil        className="w-3.5 h-3.5"/>, label:"Draw",   k:"D" },
    { id:"line",   icon:<Minus         className="w-3.5 h-3.5"/>, label:"Line",   k:"L" },
    { id:"arrow",  icon:<ArrowRight    className="w-3.5 h-3.5"/>, label:"Arrow",  k:"A" },
    { id:"rect",   icon:<Square        className="w-3.5 h-3.5"/>, label:"Rect",   k:"" },
    { id:"circle", icon:<Circle        className="w-3.5 h-3.5"/>, label:"Circle", k:"" },
    { id:"ruler",   icon:<Ruler         className="w-3.5 h-3.5"/>, label:"Ruler",   k:"R" },
    { id:"bearing", icon:<Navigation    className="w-3.5 h-3.5"/>, label:"Bearing", k:"B" },
    { id:"arty",    icon:<Crosshair     className="w-3.5 h-3.5"/>, label:"Arty",    k:"" },
    { id:"phase",   icon:<Flag          className="w-3.5 h-3.5"/>, label:"Phase",   k:"" },
    { id:"marker",  icon:<Target        className="w-3.5 h-3.5"/>, label:"Marker",  k:"M" },
  ] as const;

  const gameGroups = useMemo(() => {
    const groups: Record<string, GameMap[]> = {};
    for (const m of GAME_MAPS) {
      if (!groups[m.game]) groups[m.game] = [];
      groups[m.game].push(m);
    }
    return groups;
  }, []);

  const onDblClick = useCallback((e: React.MouseEvent) => {
    void e;
    if (toolRef.current === "phase") {
      const pts = phasePointsRef.current;
      if (pts.length >= 2) {
        setElements(prev => [...prev, { id:uid(), type:"phase", wpts:pts.map((p:Pt)=>toWorld(p)), color:"#ff4a4a", lw:2.5, label:phaseName }]);
      }
      setPhasePoints([]); phasePointsRef.current=[]; setPreview(null);
    }
  }, [phaseName]);

  return (
    <div className={`flex flex-col bg-[#0a0c0e] text-foreground select-none font-sans overflow-hidden ${onBack ? "" : "flex-1 min-h-0"}`}
      style={onBack ? {height:"100vh"} : {minHeight:560}}>

      {/* ── Toolbar (two rows) ─────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-card/90 backdrop-blur-sm relative z-[200] flex-shrink-0" style={{isolation:"isolate", pointerEvents:"auto", position:"relative"}}>

        {/* Row 1: Map picker + Zoom + Actions */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/40">

          {/* Back button — only shown in fullscreen mode */}
          {onBack && (
            <button onClick={onBack}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border/60 bg-secondary/30 hover:bg-secondary/60 text-foreground transition-all text-[11px] font-display font-bold uppercase tracking-wide flex-shrink-0">
              <ArrowLeft className="w-3.5 h-3.5"/>Back
            </button>
          )}
          {onBack && <div className="w-px h-4 bg-border/60 flex-shrink-0"/>}

          {/* Map picker */}
          <div className="relative flex-shrink-0">
            <button ref={mapPickerBtnRef} onClick={()=>setShowMapPicker(p=>!p)}
              className="flex items-center gap-2 px-3 py-1.5 rounded border border-border/60 bg-secondary/30 hover:bg-secondary/60 text-foreground transition-all text-[11px] font-display font-bold uppercase tracking-wide">
              <MapIcon className="w-4 h-4 text-primary"/>
              <span>{gameMap.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground"/>
            </button>
            {showMapPicker && ReactDOM.createPortal(
              <>
                <div className="fixed inset-0 z-[10000]" onClick={()=>setShowMapPicker(false)}/>
                <div className="fixed z-[10001] w-72 bg-card border border-border rounded-lg shadow-2xl max-h-96 overflow-y-auto"
                  style={{
                    top: (mapPickerBtnRef.current?.getBoundingClientRect().bottom ?? 0) + 6,
                    left: mapPickerBtnRef.current?.getBoundingClientRect().left ?? 0,
                  }}>
                  {Object.entries(MAP_GROUPS).map(([grp, maps])=>(
                    <div key={grp}>
                      <div className="px-3 py-2 text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40 bg-secondary/30">{grp}</div>
                      {maps.map(m=>(
                        <button key={m.id} onClick={()=>{setMapId(m.id);setPanOffset({x:0,y:0});setZoom(1);setShowMapPicker(false);}}
                          className={`w-full text-left px-4 py-2.5 text-xs font-display hover:bg-secondary/60 transition-colors flex items-center justify-between ${mapId===m.id?"text-primary bg-primary/10 font-bold":"text-foreground"}`}>
                          <span>{m.name}</span>
                          {m.tileConfig && <span className="text-[9px] text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded">TOPO</span>}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </>,
              document.body
            )}
          </div>

          <div className="w-px h-5 bg-border/60 flex-shrink-0"/>

          {/* Zoom */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={()=>setZoom(z=>Math.max(0.25,+(z-0.25).toFixed(2)))} className="p-1.5 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors" title="Zoom out"><ZoomOut className="w-4 h-4"/></button>
            <span className="text-[12px] font-mono text-foreground w-12 text-center font-bold">{Math.round(zoom*100)}%</span>
            <button onClick={()=>setZoom(z=>Math.min(4,+(z+0.25).toFixed(2)))} className="p-1.5 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors" title="Zoom in"><ZoomIn className="w-4 h-4"/></button>
            <button onClick={()=>{setZoom(1);setPanOffset({x:0,y:0});}} className="p-1.5 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors" title="Reset view"><RefreshCw className="w-4 h-4"/></button>
          </div>

          <div className="flex-1"/>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {selectedId && (
              <button onClick={()=>{setElements(p=>p.filter(e=>e.id!==selectedId));setSelectedId(null);}}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-red-800/50 text-red-400 hover:bg-red-900/20 transition-all text-[11px] font-display font-bold uppercase">
                <Trash2 className="w-3.5 h-3.5"/>Delete
              </button>
            )}
            <button onClick={()=>{if(window.confirm("Clear all annotations?"))setElements([]);}}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border/40 text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors text-[11px] font-display font-bold uppercase"
              title="Clear all"><X className="w-3.5 h-3.5"/>Clear</button>
            <button onClick={exportPng}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border/40 text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors text-[11px] font-display font-bold uppercase"
              title="Export PNG"><Download className="w-3.5 h-3.5"/>Export</button>
            <button onClick={savePlan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/15 border border-primary/50 text-primary hover:bg-primary/25 transition-all text-[11px] font-display font-bold uppercase tracking-wider">
              <Save className="w-3.5 h-3.5"/>Save
            </button>
            <button onClick={()=>setShowSidebar(s=>!s)}
              className={`p-1.5 rounded border transition-all ${showSidebar?"bg-primary/15 border-primary/50 text-primary":"border-border/40 text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`}
              title="Toggle sidebar"><PanelRight className="w-4 h-4"/></button>
          </div>
        </div>

        {/* Row 2: Tool buttons */}
        <div className="flex items-center gap-1 px-3 py-1.5 flex-wrap">
          <button onClick={()=>setTool("pan")} className={btnCls(tool==="pan")}><Move className="w-3.5 h-3.5"/><span className="font-display font-bold text-[11px] uppercase tracking-wide">Pan</span></button>
          <button onClick={()=>setTool("select")} className={btnCls(tool==="select")}><MousePointer className="w-3.5 h-3.5"/><span className="font-display font-bold text-[11px] uppercase tracking-wide">Select</span></button>
          <div className="w-px h-4 bg-border/40 mx-0.5"/>
          <button onClick={()=>setTool("draw")} className={btnCls(tool==="draw")}><Pencil className="w-3.5 h-3.5"/><span className="font-display font-bold text-[11px] uppercase tracking-wide">Draw</span></button>
          <button onClick={()=>setTool("line")} className={btnCls(tool==="line")}><Minus className="w-3.5 h-3.5"/><span className="font-display font-bold text-[11px] uppercase tracking-wide">Line</span></button>
          <button onClick={()=>setTool("arrow")} className={btnCls(tool==="arrow")}><ArrowRight className="w-3.5 h-3.5"/><span className="font-display font-bold text-[11px] uppercase tracking-wide">Arrow</span></button>
          <button onClick={()=>setTool("rect")} className={btnCls(tool==="rect")}><Square className="w-3.5 h-3.5"/><span className="font-display font-bold text-[11px] uppercase tracking-wide">Rect</span></button>
          <button onClick={()=>setTool("circle")} className={btnCls(tool==="circle")}><Circle className="w-3.5 h-3.5"/><span className="font-display font-bold text-[11px] uppercase tracking-wide">Circle</span></button>
          <div className="w-px h-4 bg-border/40 mx-0.5"/>
          <button onClick={()=>setTool("ruler")} className={btnCls(tool==="ruler")}><Ruler className="w-3.5 h-3.5"/><span className="font-display font-bold text-[11px] uppercase tracking-wide">Ruler</span></button>
          <button onClick={()=>setTool("bearing")} className={btnCls(tool==="bearing")}><Compass className="w-3.5 h-3.5"/><span className="font-display font-bold text-[11px] uppercase tracking-wide">Bearing</span></button>
          <button onClick={()=>setTool("arty")} className={btnCls(tool==="arty")}><Target className="w-3.5 h-3.5"/><span className="font-display font-bold text-[11px] uppercase tracking-wide">Arty</span></button>
          <div className="w-px h-4 bg-border/40 mx-0.5"/>
          <button onClick={()=>setTool("phase")} className={btnCls(tool==="phase")}><Navigation className="w-3.5 h-3.5"/><span className="font-display font-bold text-[11px] uppercase tracking-wide">Phase</span></button>
          <button onClick={()=>setTool("marker")} className={btnCls(tool==="marker")}><Flag className="w-3.5 h-3.5"/><span className="font-display font-bold text-[11px] uppercase tracking-wide">Marker</span></button>
        </div>
      </div>

      {/* ── Body: map canvas + right sidebar ─────────────────────────────────── */}
      <div className="relative flex flex-1 min-h-0 overflow-hidden">

      {/* ── Map + canvas stack ───────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-[#0a0c0e]"
        style={{ cursor: isDraggingCompass.current ? "grabbing" : tool === "pan" ? (isPanningRef.current ? "grabbing" : "grab") : "crosshair" }}
        onDoubleClick={onDblClick}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={()=>{
          dragId.current=null; dragPrev.current=null; dragReady.current=null;
          if (isPanning) { setIsPanning(false); panStart.current = null; }
          if (isDraggingCompass.current) { isDraggingCompass.current = false; compassDragStart.current = null; }
        }}
        onContextMenu={e => e.preventDefault()}
      >

        {/* ── Floating overlay panels — do NOT push map down ─────────────────── */}
        {/* ── Selected marker control strip ─────────────────────────────────── */}
        {(()=>{
          const selEl = selectedId ? elements.find(e=>e.id===selectedId) : null;
          if (!selEl || selEl.type !== "marker") return null;
          const updateSel = (patch: Partial<PlanElement>) =>
            setElements(p => p.map(e => e.id === selectedId ? {...e,...patch} : e));
          const curRot   = selEl.rotation   ?? 0;
          const curScale = selEl.lw         ?? 2;   // repurpose lw as scale factor for markers (1–5)
          const curColor = selEl.markerColor ?? "#ffffff";
          const curFlip  = selEl.flip       ?? false;
          const COLOURS  = ["#ffffff","#ff4a4a","#ff9900","#ffe84a","#4aff6e","#4ab3ff","#c34aff","#ff4ac3"];
          return (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-2 bg-black/85 border border-white/15 rounded-xl backdrop-blur-sm shadow-2xl"
              onMouseDown={e=>e.stopPropagation()}>
              {/* Rotate CCW */}
              <button title="Rotate -45°" onClick={()=>updateSel({rotation:((curRot-45)+360)%360})}
                className="w-7 h-7 flex items-center justify-center rounded border border-white/15 text-white/70 hover:bg-white/10 hover:text-white transition-all text-base">↺</button>
              {/* Rotation display / fine slider on click */}
              <div className="flex flex-col items-center">
                <input type="range" min={0} max={359} value={curRot}
                  onChange={e=>updateSel({rotation:Number(e.target.value)})}
                  className="w-20 accent-primary h-1" title="Rotation" />
                <span className="text-[9px] text-white/40 mt-0.5">{curRot}°</span>
              </div>
              {/* Rotate CW */}
              <button title="Rotate +45°" onClick={()=>updateSel({rotation:(curRot+45)%360})}
                className="w-7 h-7 flex items-center justify-center rounded border border-white/15 text-white/70 hover:bg-white/10 hover:text-white transition-all text-base">↻</button>
              {/* Divider */}
              <div className="w-px h-5 bg-white/10 mx-0.5"/>
              {/* Flip */}
              <button title="Flip horizontal" onClick={()=>updateSel({flip:!curFlip})}
                className={`w-7 h-7 flex items-center justify-center rounded border transition-all text-sm font-bold ${curFlip?"border-primary/60 bg-primary/20 text-primary":"border-white/15 text-white/70 hover:bg-white/10 hover:text-white"}`}>⇔</button>
              {/* Divider */}
              <div className="w-px h-5 bg-white/10 mx-0.5"/>
              {/* Shrink */}
              <button title="Shrink" onClick={()=>updateSel({lw:Math.max(0.7, curScale - 0.4)})}
                className="w-7 h-7 flex items-center justify-center rounded border border-white/15 text-white/70 hover:bg-white/10 hover:text-white transition-all font-bold text-sm">−</button>
              <span className="text-[9px] text-white/40 w-4 text-center">{Math.round((curScale/2)*100)}%</span>
              {/* Enlarge */}
              <button title="Enlarge" onClick={()=>updateSel({lw:Math.min(5, curScale + 0.4)})}
                className="w-7 h-7 flex items-center justify-center rounded border border-white/15 text-white/70 hover:bg-white/10 hover:text-white transition-all font-bold text-sm">+</button>
              {/* Divider */}
              <div className="w-px h-5 bg-white/10 mx-0.5"/>
              {/* Colour swatches */}
              {COLOURS.map(c=>(
                <button key={c} onClick={()=>updateSel({markerColor:c, color:c})}
                  style={{background:c, width:16, height:16, borderRadius:3,
                    border: curColor===c ? "2px solid #fff" : "2px solid transparent"}} />
              ))}
              <input type="color" value={curColor}
                onChange={e=>updateSel({markerColor:e.target.value, color:e.target.value})}
                style={{width:18,height:18,padding:0,border:"1px solid rgba(255,255,255,0.2)",borderRadius:3,background:"transparent",cursor:"pointer"}} />
              {/* Divider */}
              <div className="w-px h-5 bg-white/10 mx-0.5"/>
              {/* Label font picker */}
              {(["default","marker","field","intel"] as LabelFont[]).map(fk => (
                <button key={fk} title={HAND_FONTS[fk].label}
                  onClick={() => updateSel({ labelFont: fk })}
                  className={`px-1.5 py-0.5 rounded border text-[9px] transition-all ${(selEl.labelFont??'default')===fk?"border-primary/60 bg-primary/20 text-primary":"border-white/10 text-white/50 hover:bg-white/10 hover:text-white"}`}
                  style={{ fontFamily: HAND_FONTS[fk].preview.replace(/'/g,""), fontWeight:700 }}
                >{HAND_FONTS[fk].label}</button>
              ))}
              {/* Divider */}
              <div className="w-px h-5 bg-white/10 mx-0.5"/>
              {/* Delete */}
              <button title="Delete (Del)" onClick={()=>{setElements(p=>p.filter(e=>e.id!==selectedId));setSelectedId(null);}}
                className="w-7 h-7 flex items-center justify-center rounded border border-red-800/50 text-red-400 hover:bg-red-900/20 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          );
        })()}
        {showOpLink && (
          <div className="absolute top-2 left-2 z-50 w-80 bg-card/95 border border-border rounded-lg shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
              <span className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Link to Operation</span>
              <button onClick={()=>setShowOpLink(false)} className="p-0.5 rounded text-muted-foreground hover:text-foreground"><X className="w-3 h-3"/></button>
            </div>
            <div className="flex flex-wrap gap-1.5 p-3">
              <button onClick={()=>setLinkedOpId(null)}
                className={`px-2.5 py-1 rounded border text-xs transition-all ${!linkedOpId?"bg-primary/15 border-primary/50 text-primary":"border-border text-muted-foreground hover:bg-secondary/50"}`}>
                None
              </button>
              {ops.length===0 && <span className="text-xs text-muted-foreground">No ops found for this group</span>}
              {ops.map(op=>(
                <button key={op.id} onClick={()=>{setLinkedOpId(op.id);setShowOpLink(false);}}
                  className={`px-2.5 py-1 rounded border text-xs transition-all ${linkedOpId===op.id?"bg-primary/15 border-primary/50 text-primary":"border-border text-muted-foreground hover:bg-secondary/50"}`}>
                  {op.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {showNotes && (
          <div className="absolute top-2 left-2 z-50 w-80 bg-card/95 border border-border rounded-lg shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
              <span className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Commander's Notes</span>
              <button onClick={()=>setShowNotes(false)} className="p-0.5 rounded text-muted-foreground hover:text-foreground"><X className="w-3 h-3"/></button>
            </div>
            <div className="p-3">
              <textarea
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans text-foreground resize-none"
                rows={4} placeholder="Pre-deployment intentions, ROE, timings, coordination notes..."
                value={cmdNote} onChange={e=>setCmdNote(e.target.value)}
              />
            </div>
          </div>
        )}

        {showScaleHelper && (
          <div className="absolute top-2 left-2 z-50 w-96 bg-card/95 border border-border rounded-lg shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
              <span className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Map Scale — {gameMap.name}</span>
              <button onClick={()=>setShowScaleHelper(false)} className="p-0.5 rounded text-muted-foreground hover:text-foreground"><X className="w-3 h-3"/></button>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div className="bg-background border border-border rounded-lg p-2">
                  <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Terrain Size</p>
                  <p className="text-primary font-mono font-bold">{(gameMap.realSizeM / 1000).toFixed(1)} km</p>
                  <p className="text-muted-foreground text-[9px]">{gameMap.realSizeM.toLocaleString()} m sq</p>
                </div>
                <div className="bg-background border border-border rounded-lg p-2">
                  <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Grid Cell</p>
                  <p className="text-primary font-mono font-bold">{gameMap.gridCellM} m</p>
                  <p className="text-muted-foreground text-[9px]">per square</p>
                </div>
                <div className="bg-background border border-border rounded-lg p-2">
                  <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Grid Count</p>
                  <p className="text-primary font-mono font-bold">{Math.floor(gameMap.realSizeM / gameMap.gridCellM)}×{Math.floor(gameMap.realSizeM / gameMap.gridCellM)}</p>
                  <p className="text-muted-foreground text-[9px]">squares</p>
                </div>
                <div className="bg-background border border-border rounded-lg p-2">
                  <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Scale</p>
                  <p className="text-primary font-mono font-bold">{metersPerPixel.toFixed(1)} m/px</p>
                  <p className="text-muted-foreground text-[9px]">at current zoom</p>
                </div>
              </div>
              <p className="text-[9px] text-yellow-600/80">⚠ 2D crow-flies only — elevation not accounted for.</p>
            </div>
          </div>
        )}

        {showSettings && (
          <div className="absolute top-2 right-2 z-50 bg-card/95 border border-border rounded-lg shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
              <span className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Settings</span>
              <button onClick={()=>setShowSettings(false)} className="p-0.5 rounded text-muted-foreground hover:text-foreground"><X className="w-3 h-3"/></button>
            </div>
            <div className="flex items-start gap-6 p-4">
              {/* Coordinate Format */}
              <div>
                <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Coord Format</p>
                <div className="flex flex-col gap-1">
                  {([
                    { id:"MGRS" as CoordFormat, label:"Grid Ref", sub:"In-game grid reference (per game)" },
                    { id:"DG"   as CoordFormat, label:"DG",   sub:"Decimal degrees" },
                    { id:"DMS"  as CoordFormat, label:"DMS",  sub:"Deg min sec" },
                  ] as {id:CoordFormat;label:string;sub:string}[]).map(opt => (
                    <button key={opt.id} onClick={()=>setCoordFormat(opt.id)}
                      className={`flex items-center gap-2 w-44 px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                        coordFormat===opt.id
                          ? "bg-primary/10 border-primary/50 text-primary"
                          : "border-border/40 text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      }`}>
                      <div className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${coordFormat===opt.id?"border-primary bg-primary":"border-muted-foreground"}`}/>
                      <div>
                        <div className="text-xs font-bold font-display">{opt.label}</div>
                        <div className="text-[10px] text-muted-foreground">{opt.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Measurement Unit */}
              <div>
                <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Units</p>
                <div className="flex flex-col gap-1">
                  {([
                    { id:"metric"   as MeasureUnit, label:"Metric",   sub:"km, m" },
                    { id:"imperial" as MeasureUnit, label:"Imperial",  sub:"mi, ft" },
                    { id:"nautical" as MeasureUnit, label:"Nautical",  sub:"nm, m" },
                  ] as {id:MeasureUnit;label:string;sub:string}[]).map(opt => (
                    <button key={opt.id} onClick={()=>setMeasureUnit(opt.id)}
                      className={`flex items-center gap-2 w-44 px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                        measureUnit===opt.id
                          ? "bg-primary/10 border-primary/50 text-primary"
                          : "border-border/40 text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      }`}>
                      <div className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${measureUnit===opt.id?"border-primary bg-primary":"border-muted-foreground"}`}/>
                      <div>
                        <div className="text-xs font-bold font-display">{opt.label}</div>
                        <div className="text-[10px] text-muted-foreground">{opt.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Live cursor coords if available */}
              {mouseMapPos && showCoords && (
                <div>
                  <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Cursor Position</p>
                  <div className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 font-mono text-xs space-y-1">
                    <div><span className="text-white/30">GRID </span><span className="text-yellow-300">{formatGridRef(mouseMapPos.mx, mouseMapPos.my, gameMap.gridSystem ?? "arma", gameMap.gridCellM, gameMap.realSizeM)}</span></div>
                    <div><span className="text-white/30">DG   </span><span className="text-white/60">{formatDG(mouseMapPos.mx, mouseMapPos.my, gameMap.realSizeM)}</span></div>
                    <div><span className="text-white/30">Raw  </span><span className="text-white/40">{Math.round(mouseMapPos.mx)}m E, {Math.round(mouseMapPos.my)}m N</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

                {/* LAYER 0: Map background — tiles if available, else static image, else fallback */}
        {mapId !== "custom" && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ pointerEvents: "none", background: "#0a0c0e" }}
          >
            {/* Fallback colour/gradient always underneath */}
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at 30% 40%, ${gameMap.previewColor}66 0%, ${gameMap.fallbackColor}99 45%, #0a0c0e 100%)`,
              }}
            />

            {/* Real topographic tiles — primary rendering path */}
            {gameMap.tileConfig ? (
              <TileMapLayer
                tileConfig={gameMap.tileConfig}
                panOffset={panOffset}
                zoom={zoom}
                containerW={canvasSize.w}
                containerH={canvasSize.h}
                mapRotation={mapRotation}
              />
            ) : gameMap.mapImageUrl ? (
              /* Fallback static image for maps without tile config */
              <img
                src={gameMap.mapImageUrl}
                alt={gameMap.name}
                draggable={false}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth && img.naturalHeight) {
                    setMapImageAspect(img.naturalWidth / img.naturalHeight);
                  }
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom}) rotate(${mapRotation}rad)`,
                  transformOrigin: "center center",
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  userSelect: "none",
                  transition: isPanning ? "none" : "transform 0.05s ease-out",
                }}
              />
            ) : null}
          </div>
        )}

        {/* LAYER 0b: Custom URL iframe */}
        {mapId === "custom" && customBgUrl && (
          <iframe
            key={customBgUrl}
            src={customBgUrl}
            title="Custom map"
            className="absolute inset-0 w-full h-full border-0"
            style={{ pointerEvents: canvasCapture ? "none" : "auto" }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}

        {/* LAYER 1: Drawing canvas (transparent overlay) */}
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          className="absolute inset-0"
          style={{
            width:"100%", height:"100%",
            pointerEvents: "none",
            background: "transparent",
          }}
        />

        {/* Mode indicator */}
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
          <div className={`px-2.5 py-1 rounded border text-xs font-display font-bold uppercase tracking-wider ${
            canvasCapture
              ? "bg-primary/20 border-primary/50 text-primary"
              : "bg-black/50 border-white/10 text-white/40"
          }`}>
            {canvasCapture ? `✎ ${tool.toUpperCase()} MODE` : "✥ PAN MODE"}
          </div>
          {linkedOp && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 border border-primary/40 rounded text-xs text-primary font-display font-bold uppercase tracking-wider">
              <Link className="w-3 h-3"/> {linkedOp.name}
            </div>
          )}
        </div>

        {/* Open-in-atlas button (top right) */}
        {gameMap.openUrl && mapId !== "custom" && (
          <a href={gameMap.openUrl} target="_blank" rel="noopener noreferrer"
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 border border-white/15 rounded-lg text-white/50 text-[10px] font-display font-bold uppercase tracking-wider hover:bg-black/80 hover:text-white/80 transition-all pointer-events-auto">
            <ExternalLink className="w-3 h-3"/>
            Open {gameMap.name} interactive map
          </a>
        )}

        {/* ── Coordinate HUD — bottom-left overlay ── */}
        {mouseMapPos && showCoords && (
          <div className="absolute bottom-10 left-3 flex items-center gap-2 pointer-events-none">
            <div className="px-2.5 py-1.5 bg-black/80 border border-white/10 rounded-lg text-[11px] font-mono text-white/70 backdrop-blur-sm select-none">
              {coordFormat === "MGRS" && (
                <span className="text-yellow-300/90">
                  <span className="text-white/30 text-[9px] mr-1">GRID</span>
                  {formatGridRef(mouseMapPos.mx, mouseMapPos.my, gameMap.gridSystem ?? "arma", gameMap.gridCellM, gameMap.realSizeM)}
                </span>
              )}
              {coordFormat === "DG" && (
                <span className="text-yellow-300/90">
                  <span className="text-white/30 text-[9px] mr-1">DG</span>
                  {formatDG(mouseMapPos.mx, mouseMapPos.my, gameMap.realSizeM)}
                </span>
              )}
              {coordFormat === "DMS" && (
                <span className="text-yellow-300/90">
                  <span className="text-white/30 text-[9px] mr-1">DMS</span>
                  {formatDMS(mouseMapPos.mx, mouseMapPos.my, gameMap.realSizeM)}
                </span>
              )}
              <span className="text-white/20 mx-1.5">|</span>
              <span className="text-white/40">
                {Math.round(mouseMapPos.mx)}m E  {Math.round(mouseMapPos.my)}m N
              </span>
            </div>
          </div>
        )}

        {/* Ruler hint */}
        {tool==="ruler" && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-card/90 border border-yellow-500/40 rounded text-xs text-yellow-400 font-display font-bold uppercase tracking-wider pointer-events-none">
            {rulerStart
              ? (() => {
                  const { cx: rsx, cy: rsy } = unrotatePoint(rulerStart.x, rulerStart.y, canvasSize.w, canvasSize.h, mapRotation);
                  const pos = canvasToMapMetres(rsx, rsy, canvasSize.w, canvasSize.h, gameMap.realSizeM, panOffset, zoom, gameMap.tileConfig ? 1 : mapImageAspect, gameMap.northAtBottom ?? false);
                  const coord = coordFormat === "MGRS" ? formatGridRef(pos.mx, pos.my, gameMap.gridSystem ?? "arma", gameMap.gridCellM, gameMap.realSizeM) : coordFormat === "DG" ? formatDG(pos.mx, pos.my, gameMap.realSizeM) : formatDMS(pos.mx, pos.my, gameMap.realSizeM);
                  return `From ${coord} — click end point`;
                })()
              : "Click start point"}
          </div>
        )}

        {/* ── Tool HUD strip — pointer-events-none on wrapper, auto on children ── */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-2">

          {/* Bearing hint */}
          {tool==="bearing" && (
            <div className="px-3 py-1.5 bg-card/90 border border-cyan-500/40 rounded text-xs text-cyan-400 font-display font-bold uppercase tracking-wider">
              {rulerStart ? "Click end point to draw bearing line" : "Click start point for bearing"}
            </div>
          )}

          {/* Arty — dropdown + hint */}
          {tool==="arty" && (
            <div className="pointer-events-auto flex items-center gap-2 bg-card/95 border border-border rounded-lg px-3 py-2 shadow-xl">
              <span className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">System:</span>
              <select
                value={artySystem.id}
                onChange={e => setArtySystem(filteredArtySystems.find(s => s.id === e.target.value) ?? filteredArtySystems[0])}
                className="bg-background border border-border rounded px-2 py-1 text-xs font-display font-bold text-foreground cursor-pointer"
              >
                {(() => {
                  const groups = filteredArtySystems.reduce<Record<string, ArtySystem[]>>((acc, s) => {
                    (acc[s.category] ??= []).push(s);
                    return acc;
                  }, {});
                  return Object.entries(groups).map(([cat, systems]) => (
                    <optgroup key={cat} label={`── ${cat} ──`}>
                      {systems.map(sys => (
                        <option key={sys.id} value={sys.id}>{sys.name}</option>
                      ))}
                    </optgroup>
                  ));
                })()}
              </select>
              <span className="text-[9px] text-muted-foreground font-mono">
                {artySystem.minM >= 1000 ? `${(artySystem.minM/1000).toFixed(1)}km` : `${artySystem.minM}m`}
                {" – "}
                {artySystem.maxM >= 1000 ? `${(artySystem.maxM/1000).toFixed(0)}km` : `${artySystem.maxM}m`}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide">{artySystem.category}</span>
              <span className="text-[10px] text-yellow-400">← Click map to place</span>
            </div>
          )}

          {/* Phase line — name input + status */}
          {tool==="phase" && (
            <div className="pointer-events-auto flex items-center gap-2 bg-card/95 border border-border rounded-lg px-3 py-2 shadow-xl">
              <span className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">Line:</span>
              <input
                className="bg-background border border-border rounded px-2 py-1 text-xs font-display font-bold text-foreground w-28"
                value={phaseName} onChange={e=>setPhaseName(e.target.value)}
                placeholder="PL AMBER"
                onMouseDown={e=>e.stopPropagation()}
              />
              <span className="text-[10px] text-yellow-400">
                {phasePoints.length === 0 ? "← Click map to add points" : `${phasePoints.length} pts — Dbl-click to finish`}
              </span>
              {phasePoints.length > 0 && (
                <button
                  onClick={()=>{setPhasePoints([]);phasePointsRef.current=[];setPreview(null);}}
                  className="px-2 py-1 rounded border border-red-800/50 text-red-400 hover:bg-red-900/20 text-[10px] font-display font-bold uppercase">
                  Cancel
                </button>
              )}
            </div>
          )}

        </div>

        {/* Hint strip */}
        <div className="absolute bottom-2 right-20 flex items-center gap-3 text-[9px] text-white/20 font-mono pointer-events-none">
          <span>P=pan</span><span>D=draw</span><span>A=arrow</span><span>M=marker</span><span>R=ruler</span><span>Del=delete</span>
        </div>
      </div>

        {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
        {showSidebar && (
          <div className="absolute right-0 top-0 bottom-0 w-56 border-l border-border bg-card/80 backdrop-blur-sm flex flex-col overflow-y-auto z-[90]" data-panel="settings">

            {/* Stroke colour */}
            <div className="border-b border-border/50 px-3 py-2">
              <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Colour</p>
              <div className="flex flex-wrap gap-1">
                {COLORS.map(c=>(
                  <button key={c} onClick={()=>setColor(c)}
                    className={`w-5 h-5 rounded-sm flex-shrink-0 transition-all hover:scale-110 ${color===c?"ring-2 ring-white ring-offset-1 ring-offset-background scale-110":""}`}
                    style={{background:c, border: c==="#000000"||c==="#ffffff"?"1px solid rgba(255,255,255,0.25)":"none"}}/>
                ))}
                <label className="relative cursor-pointer flex-shrink-0" title="Custom colour">
                  <div className={`w-5 h-5 rounded-sm border flex items-center justify-center overflow-hidden hover:scale-110 transition-all ${!COLORS.includes(color)?"ring-2 ring-white ring-offset-1 ring-offset-background":""}`}
                    style={{background:COLORS.includes(color)?"rgba(255,255,255,0.08)":color,borderColor:"rgba(255,255,255,0.2)"}}>
                    {COLORS.includes(color)&&<span className="text-[9px] font-bold text-muted-foreground">+</span>}
                  </div>
                  <input type="color" value={color} onChange={e=>setColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" style={{minWidth:20}}/>
                </label>
              </div>
            </div>

            {/* Stroke weight + dash */}
            <div className="border-b border-border/50 px-3 py-2">
              <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Weight & Style</p>
              <div className="flex items-center gap-1.5">
                {[1,2,3,5].map(w=>(
                  <button key={w} onClick={()=>setLw(w)}
                    className={`w-6 h-6 flex items-center justify-center rounded transition-all hover:bg-secondary/60 border ${lw===w?"bg-primary/20 border-primary/40 text-primary":"border-border/40 text-muted-foreground"}`}
                    title={`${w}px`}>
                    <div className="rounded-full" style={{background:"currentColor",width:Math.min(w*2+2,14),height:Math.min(w*2+2,14),opacity:0.9}}/>
                  </button>
                ))}
                <button onClick={()=>setDashed(d=>!d)}
                  className={`px-2 py-1 rounded text-[11px] font-mono border transition-all ${dashed?"bg-primary/15 border-primary/50 text-primary":"border-border/40 text-muted-foreground hover:bg-secondary/40 hover:text-foreground"}`}>- -</button>
              </div>
            </div>

            {/* Overlays */}
            <div className="border-b border-border/50 px-3 py-2">
              <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Overlays</p>
              <div className="flex flex-col gap-1">
                {([
                  {key:"grid", label:"Grid", state:showGrid, set:setShowGrid},
                  {key:"compass", label:"Compass", state:showCompass, set:setShowCompass},
                  {key:"scalebar", label:"Scale Bar", state:showScaleBar, set:setShowScaleBar},
                  {key:"coords", label:"Coords HUD", state:showCoords, set:setShowCoords},
                ] as {key:string;label:string;state:boolean;set:(fn:(v:boolean)=>boolean)=>void}[]).map(o=>(
                  <button key={o.key} onClick={()=>o.set(v=>!v)}
                    className={`flex items-center gap-2 px-2 py-1 rounded border text-[10px] font-display font-bold uppercase tracking-wide transition-all text-left ${o.state?"bg-primary/10 border-primary/40 text-primary":"border-border/40 text-muted-foreground hover:bg-secondary/40 hover:text-foreground"}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${o.state?"bg-primary":"bg-muted-foreground/40"}`}/>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Map rotation */}
            <div className="border-b border-border/50 px-3 py-2">
              <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Rotation</p>
              <div className="flex items-center gap-1">
                <button onClick={()=>setMapRotation(r=>r-Math.PI/12)} className="p-1.5 rounded border border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors" title="CCW"><RotateCcw className="w-3.5 h-3.5"/></button>
                <span className="flex-1 text-center text-[11px] font-mono text-muted-foreground">{Math.round(mapRotation*180/Math.PI)}°</span>
                <button onClick={()=>setMapRotation(0)} className="px-1.5 py-1 rounded border border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors text-[9px] font-mono">0°</button>
                <button onClick={()=>setMapRotation(r=>r+Math.PI/12)} className="p-1.5 rounded border border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors" title="CW"><RotateCw className="w-3.5 h-3.5"/></button>
              </div>
            </div>

            {/* Coord format */}
            <div className="border-b border-border/50 px-3 py-2">
              <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Coord Format</p>
              <div className="flex flex-col gap-1">
                {([
                  { id:"MGRS" as CoordFormat, label:"Grid Ref", sub:"In-game grid (per game)" },
                  { id:"DG"   as CoordFormat, label:"DG",   sub:"Decimal degrees" },
                  { id:"DMS"  as CoordFormat, label:"DMS",  sub:"Deg min sec" },
                ] as {id:CoordFormat;label:string;sub:string}[]).map(opt=>(
                  <button key={opt.id} onClick={()=>setCoordFormat(opt.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded border text-left transition-all ${coordFormat===opt.id?"bg-primary/10 border-primary/50 text-primary":"border-border/40 text-muted-foreground hover:bg-secondary/40 hover:text-foreground"}`}>
                    <div className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${coordFormat===opt.id?"border-primary bg-primary":"border-muted-foreground"}`}/>
                    <div><div className="text-xs font-bold font-display">{opt.label}</div><div className="text-[9px] text-muted-foreground">{opt.sub}</div></div>
                  </button>
                ))}
              </div>
            </div>

            {/* Units */}
            <div className="border-b border-border/50 px-3 py-2">
              <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Units</p>
              <div className="flex flex-col gap-1">
                {([
                  { id:"metric"   as MeasureUnit, label:"Metric",   sub:"km, m" },
                  { id:"imperial" as MeasureUnit, label:"Imperial",  sub:"mi, ft" },
                  { id:"nautical" as MeasureUnit, label:"Nautical",  sub:"nm, m" },
                ] as {id:MeasureUnit;label:string;sub:string}[]).map(opt=>(
                  <button key={opt.id} onClick={()=>setMeasureUnit(opt.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded border text-left transition-all ${measureUnit===opt.id?"bg-primary/10 border-primary/50 text-primary":"border-border/40 text-muted-foreground hover:bg-secondary/40 hover:text-foreground"}`}>
                    <div className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${measureUnit===opt.id?"border-primary bg-primary":"border-muted-foreground"}`}/>
                    <div><div className="text-xs font-bold font-display">{opt.label}</div><div className="text-[9px] text-muted-foreground">{opt.sub}</div></div>
                  </button>
                ))}
              </div>
            </div>

            {/* Map info */}
            <div className="border-b border-border/50 px-3 py-2">
              <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Map Info</p>
              <div className="grid grid-cols-2 gap-1">
                <div className="bg-background/50 rounded p-1.5 border border-border/30">
                  <p className="text-muted-foreground text-[8px] uppercase">Size</p>
                  <p className="text-primary font-mono font-bold text-[10px]">{(gameMap.realSizeM/1000).toFixed(1)}km</p>
                </div>
                <div className="bg-background/50 rounded p-1.5 border border-border/30">
                  <p className="text-muted-foreground text-[8px] uppercase">Grid</p>
                  <p className="text-primary font-mono font-bold text-[10px]">{gameMap.gridCellM}m</p>
                </div>
                <div className="bg-background/50 rounded p-1.5 border border-border/30">
                  <p className="text-muted-foreground text-[8px] uppercase">Scale</p>
                  <p className="text-primary font-mono font-bold text-[10px]">{metersPerPixel.toFixed(1)}m/px</p>
                </div>
                <div className="bg-background/50 rounded p-1.5 border border-border/30">
                  <p className="text-muted-foreground text-[8px] uppercase">Squares</p>
                  <p className="text-primary font-mono font-bold text-[10px]">{Math.floor(gameMap.realSizeM/gameMap.gridCellM)}×{Math.floor(gameMap.realSizeM/gameMap.gridCellM)}</p>
                </div>
              </div>
            </div>

            {/* Link Op */}
            <div className="border-b border-border/50 px-3 py-2">
              <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Link Operation</p>
              <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
                <button onClick={()=>setLinkedOpId(null)}
                  className={`px-2 py-1 rounded border text-[10px] text-left transition-all ${!linkedOpId?"bg-primary/15 border-primary/50 text-primary":"border-border/40 text-muted-foreground hover:bg-secondary/50"}`}>
                  None
                </button>
                {ops.length===0 && <span className="text-[10px] text-muted-foreground italic">No ops for this group</span>}
                {ops.map(op=>(
                  <button key={op.id} onClick={()=>setLinkedOpId(op.id)}
                    className={`px-2 py-1 rounded border text-[10px] text-left transition-all ${linkedOpId===op.id?"bg-primary/15 border-primary/50 text-primary":"border-border/40 text-muted-foreground hover:bg-secondary/50"}`}>
                    {op.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes button — opens floating panel */}
            <div className="px-3 py-2">
              <button onClick={()=>setShowNotes(n=>!n)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded border text-[11px] font-display font-bold uppercase tracking-wide transition-all ${showNotes?"bg-primary/15 border-primary/50 text-primary":"border-border/40 text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`}>
                <MessageSquare className="w-3.5 h-3.5"/>Commander's Notes
              </button>
            </div>

          </div>
        )}

      </div>{/* end body flex-row */}


      {/* ── Marker label modal ──────────────────────────────────────────────── */}
      {labelPrompt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999]">
          <div className="bg-card border border-border rounded-xl p-4 w-[420px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <p className="text-xs font-display font-bold uppercase tracking-widest mb-3">Choose Marker</p>
            {(() => {
              const sections = Array.from(new Set(NATO_SYMS.map(s=>s.section)));
              return sections.map(sec=>(
                <div key={sec} className="mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1 text-muted-foreground/70 border-b border-border/40 pb-0.5">{sec}</p>
                  <div className="grid grid-cols-9 gap-1">
                    {NATO_SYMS.filter(s=>s.section===sec).map(sym=>(
                      <button key={sym.key}
                        onClick={()=>setLabelPrompt(p=>p?{...p,symKey:sym.key}:p)}
                        className={`flex flex-col items-center justify-center p-0.5 rounded border transition-all ${
                          labelPrompt.symKey===sym.key?"border-primary/60 bg-primary/15":"border-transparent hover:border-border/50 hover:bg-secondary/30"
                        }`} title={sym.label}
                        style={{background:'transparent'}}>
                        <canvas width={32} height={32} ref={el=>{ if(el) drawMarkerThumb(el, sym); }} />
                      </button>
                    ))}
                  </div>
                </div>
              ));
            })()}
            <p className="text-xs font-display font-bold uppercase tracking-widest mb-1.5">Label (optional)</p>
            {/* Font style picker */}
            <div className="flex gap-1.5 mb-2">
              {(Object.entries(HAND_FONTS) as [LabelFont, typeof HAND_FONTS[LabelFont]][]).map(([key, f]) => (
                <button key={key}
                  onClick={() => setLabelFont(key)}
                  className={`flex-1 px-2 py-1 rounded border text-[11px] transition-all ${labelFont === key ? "border-primary/60 bg-primary/15 text-primary" : "border-border/40 text-muted-foreground hover:bg-secondary/50"}`}
                  style={{ fontFamily: f.preview.replace(/'/g, ""), fontWeight: key === "intel" ? 700 : 700 }}
                >{f.label}</button>
              ))}
            </div>
            <input autoFocus
              className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm mb-3"
              style={{ fontFamily: HAND_FONTS[labelFont].preview.replace(/'/g, ""), fontWeight: 700 }}
              placeholder="e.g. 1 SECT, Alpha, HQ"
              value={labelText} onChange={e=>setLabelText(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") {
                const _wm1 = toWorld(labelPrompt.cp);
                setElements(prev=>[...prev, {
                  id:uid(), type:"marker",
                  wmx:_wm1.mx, wmy:_wm1.my,
                  symbol:labelPrompt.symKey, label:labelText,
                  labelFont,
                  color: "#ffffff",
                  lw:2,
                }]);
                setLabelPrompt(null); setLabelText("");
              }}}
            />
            <div className="flex gap-2">
              <button
                onClick={()=>{
                  const _wm2 = toWorld(labelPrompt.cp);
                  setElements(prev=>[...prev, {
                    id:uid(), type:"marker",
                    wmx:_wm2.mx, wmy:_wm2.my,
                    symbol:labelPrompt.symKey, label:labelText,
                    labelFont,
                    color: "#ffffff",
                    lw:2,
                  }]);
                  setLabelPrompt(null); setLabelText("");
                }}
                className="flex-1 px-3 py-1.5 bg-primary/15 border border-primary/50 rounded text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/25 transition-all">
                <Check className="w-3.5 h-3.5 inline mr-1"/>Place
              </button>
              <button onClick={()=>{setLabelPrompt(null);setLabelText("");}}
                className="px-3 py-1.5 border border-border rounded text-muted-foreground text-xs font-bold uppercase tracking-wider hover:bg-secondary/50 transition-all">
                <X className="w-3.5 h-3.5 inline"/>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// BUILD_FORCE 1775043959
// build 1775054238
// build 1775157066

// CACHE_BUST_1775956461
// cache-bust 1776137126
