/**
 * TacticalPlanner v4
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

import L from "leaflet";

import React, {
  useRef, useState, useEffect, useCallback, useMemo,
} from "react";
import {
  Map, Pencil, MousePointer2, Move, Minus, Plus, RotateCcw,
  Trash2, Download, Save, Layers, Compass, Ruler,
  Circle, Square, ArrowRight, ChevronDown, Target, Flag,
  Check, X, Link, MessageSquare, RotateCw, ExternalLink,
  ZoomIn, ZoomOut,
} from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToolMode = "pan" | "select" | "draw" | "line" | "arrow" | "rect" | "circle" | "ruler" | "marker";

interface Pt { x: number; y: number; }

interface PlanElement {
  id: string;
  type: "draw" | "line" | "arrow" | "rect" | "circle" | "marker" | "ruler";
  points?: Pt[];
  x?: number; y?: number;
  w?: number; h?: number;
  r?: number;
  color: string;
  lw: number;
  label?: string;
  symbol?: string;
  dashed?: boolean;
}

// ─── Map catalogue ─────────────────────────────────────────────────────────────

interface TileConfig {
  mapId: number;        // plan-ops gameMapId
  layerId: number;      // plan-ops gameMapLayerId
  maxZoom: number;      // max tile zoom level
  tileSize: number;     // tile pixel size
  factorX: number;      // plan-ops factorX (metres per pixel at zoom 0)
}

interface GameMap {
  id: string;
  game: string;
  name: string;
  mapImageUrl: string | null;
  tileConfig?: TileConfig;    // if present, real topographic tiles are available
  fallbackColor: string;
  previewColor: string;
  attribution: string;
  openUrl: string;
  realSizeM: number;   // real-world width in metres
  gridCellM: number;   // how many real metres each in-game grid square represents
  aspectRatio?: number; // w/h if non-square (default 1)
}

const GAME_MAPS: GameMap[] = [
  // ── Arma 3 Vanilla ──────────────────────────────────────────────────────────
  // Altis: 30,720m terrain, 1000m grid squares
  { id:"a3_altis",    game:"Arma 3 — Vanilla", name:"Altis",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/c6c06437c_generated_image.png",
    tileConfig:{ mapId:3, layerId:3, maxZoom:6, tileSize:212, factorX:0.006839 },
    fallbackColor:"#2d3a2e", previewColor:"#4a7c59",
    attribution:"BI Official", openUrl:"https://atlas.plan-ops.fr/maps/arma3/altis/150",
    realSizeM:30720, gridCellM:1000 },

  // Stratis: 8,192m terrain, 1000m grid squares
  { id:"a3_stratis",  game:"Arma 3 — Vanilla", name:"Stratis",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/ea6747836_generated_image.png",
    tileConfig:{ mapId:104, layerId:104, maxZoom:4, tileSize:226, factorX:0.027475 },
    fallbackColor:"#2d3a2e", previewColor:"#5a8c6a",
    attribution:"BI Official", openUrl:"https://atlas.plan-ops.fr/maps/arma3/stratis/150",
    realSizeM:8192, gridCellM:1000 },

  // Malden: 12,800m terrain, 1000m grid squares
  { id:"a3_malden",   game:"Arma 3 — Vanilla", name:"Malden",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/2cd515d90_generated_image.png",
    tileConfig:{ mapId:68, layerId:68, maxZoom:5, tileSize:186, factorX:0.01448 },
    fallbackColor:"#2d3a2e", previewColor:"#6a9c7a",
    attribution:"BI Official", openUrl:"https://atlas.plan-ops.fr/maps/arma3/malden/150",
    realSizeM:12800, gridCellM:1000 },

  // Tanoa: 15,360m terrain, 1000m grid squares
  { id:"a3_tanoa",    game:"Arma 3 — Vanilla", name:"Tanoa",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/de89f0a9c_generated_image.png",
    tileConfig:{ mapId:109, layerId:109, maxZoom:5, tileSize:213, factorX:0.01385 },
    fallbackColor:"#1a3a2a", previewColor:"#3a7a5a",
    attribution:"BI Official", openUrl:"https://atlas.plan-ops.fr/maps/arma3/tanoa/150",
    realSizeM:15360, gridCellM:1000 },

  // ── Arma 3 Modded ───────────────────────────────────────────────────────────
  // Chernarus: 15,360m terrain, 1000m grid squares (ArmA 2 / A3 CUP)
  { id:"a3_chernarus", game:"Arma 3 — Modded", name:"Chernarus (Summer)",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/c0c3edd32_generated_image.png",
    tileConfig:{ mapId:18, layerId:18, maxZoom:5, tileSize:242, factorX:0.01575 },
    fallbackColor:"#263326", previewColor:"#4a7a55",
    attribution:"BI / CUP", openUrl:"https://atlas.plan-ops.fr/maps/arma3/chernarus/150",
    realSizeM:15360, gridCellM:1000 },

  // Takistan: 12,800m terrain, 1000m grid squares
  { id:"a3_takistan",  game:"Arma 3 — Modded", name:"Takistan",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/eee40b659_generated_image.png",
    tileConfig:{ mapId:108, layerId:108, maxZoom:5, tileSize:202, factorX:0.01575 },
    fallbackColor:"#3a3020", previewColor:"#7a7040",
    attribution:"BI / CUP", openUrl:"https://atlas.plan-ops.fr/maps/arma3/takistan/150",
    realSizeM:12800, gridCellM:1000 },

  // Lingor: 10,240m terrain, 1000m grid squares
  { id:"a3_lingor",    game:"Arma 3 — Modded", name:"Lingor",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/665ed628f_generated_image.png",
    tileConfig:{ mapId:66, layerId:66, maxZoom:4, tileSize:256, factorX:0.025 },
    fallbackColor:"#1a3020", previewColor:"#3a6a40",
    attribution:"IceBreakr", openUrl:"https://atlas.plan-ops.fr/maps/arma3/lingor/150",
    realSizeM:10240, gridCellM:1000 },

  // Fallujah (A3): 10,240m terrain, 1000m grid squares
  { id:"a3_fallujah",  game:"Arma 3 — Modded", name:"Fallujah",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/af03413de_generated_image.png",
    tileConfig:{ mapId:39, layerId:39, maxZoom:5, tileSize:323, factorX:0.0315 },
    fallbackColor:"#3a2a10", previewColor:"#8a7040",
    attribution:"Team Ahoy", openUrl:"https://atlas.plan-ops.fr/maps/arma3/fallujah/150",
    realSizeM:10240, gridCellM:1000 },

  // Lythium: 20,480m terrain, 1000m grid squares
  { id:"a3_lythium",   game:"Arma 3 — Modded", name:"Lythium",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/e61239f17_generated_image.png",
    tileConfig:{ mapId:67, layerId:67, maxZoom:5, tileSize:287, factorX:0.013985 },
    fallbackColor:"#2a2010", previewColor:"#7a6030",
    attribution:"Jakerod", openUrl:"https://atlas.plan-ops.fr/maps/arma3/lythium/150",
    realSizeM:20480, gridCellM:1000 },

  // ── DayZ Official ────────────────────────────────────────────────────────────
  // Chernarus+: 15,360m terrain (2048 cells × 7.5m), 1000m grid squares
  { id:"dz_chernarus", game:"DayZ — Official", name:"Chernarus+",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/b0c3b721c_generated_image.png",
    fallbackColor:"#263326", previewColor:"#4a7a55",
    attribution:"Bohemia Interactive", openUrl:"https://www.izurvive.com/",
    realSizeM:15360, gridCellM:1000 },

  // Livonia: 12,800m terrain (confirmed via iZurvive), 1000m grid squares
  { id:"dz_livonia",   game:"DayZ — Official", name:"Livonia",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/e4965a2d7_generated_image.png",
    fallbackColor:"#2a3320", previewColor:"#5a7050",
    attribution:"Bohemia Interactive", openUrl:"https://www.izurvive.com/livonia/",
    realSizeM:12800, gridCellM:1000 },

  // ── DayZ Community ────────────────────────────────────────────────────────────
  // Namalsk: 7,680m terrain (ArmA 2 origin: 1024 cells × 7.5m), 1000m grid squares
  { id:"dz_namalsk",   game:"DayZ — Community", name:"Namalsk",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/3dab9fe42_generated_image.png",
    fallbackColor:"#1a1f2a", previewColor:"#3a4a6a",
    attribution:"Sumrak / Bohemia", openUrl:"https://www.izurvive.com/namalsk/",
    realSizeM:7680, gridCellM:1000 },

  // ── Squad ─────────────────────────────────────────────────────────────────────
  // Yehorivka: 4,180m playable (wiki confirmed), 300m grid squares
  { id:"sq_yehorivka", game:"Squad", name:"Yehorivka",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/279e5759b_generated_image.png",
    fallbackColor:"#2a3020", previewColor:"#6a7a3a",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=Yehorivka&layer=AAS%20v1",
    realSizeM:4180, gridCellM:300 },

  // Fallujah (Squad): 4,096m playable, 300m grid squares
  { id:"sq_fallujah",  game:"Squad", name:"Fallujah",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/af03413de_generated_image.png",
    fallbackColor:"#3a2a10", previewColor:"#8a7040",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=Fallujah&layer=AAS%20v1",
    realSizeM:4096, gridCellM:300 },

  // Al Basrah: 3,200m playable (wiki: 3200×3200m), 200m grid squares
  { id:"sq_albasrah",  game:"Squad", name:"Al Basrah",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/af03413de_generated_image.png",
    fallbackColor:"#3a2a10", previewColor:"#8a6030",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=AlBasrah&layer=AAS%20v1",
    realSizeM:3200, gridCellM:200 },

  // Sumari Bala: ~1,500m playable (small urban map), 100m grid squares
  { id:"sq_sumari",    game:"Squad", name:"Sumari Bala",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/0485911ea_generated_image.png",
    fallbackColor:"#3a2a15", previewColor:"#8a6a35",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=Sumari&layer=AAS%20v1",
    realSizeM:1500, gridCellM:100 },

  // Kokan: ~2,000m playable (Afghan mountain village), 200m grid squares
  { id:"sq_kokan",     game:"Squad", name:"Kokan",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/a8b620acf_generated_image.png",
    fallbackColor:"#2a2010", previewColor:"#7a6030",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=Kokan&layer=AAS%20v1",
    realSizeM:2000, gridCellM:200 },

  // Narva: ~2,700m playable (Estonian city), 200m grid squares
  { id:"sq_narva",     game:"Squad", name:"Narva",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/b1f6ddf02_generated_image.png",
    fallbackColor:"#2a2a2a", previewColor:"#5a6070",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=Narva&layer=AAS%20v1",
    realSizeM:2700, gridCellM:200 },

  // Gorodok: 4,340m playable (wiki: 4340×4340m), 300m grid squares
  { id:"sq_gorodok",   game:"Squad", name:"Gorodok",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/c87ed7f69_generated_image.png",
    fallbackColor:"#1a2218", previewColor:"#3a5030",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=Gorodok&layer=AAS%20v1",
    realSizeM:4340, gridCellM:300 },

  // Fool's Road: ~2,000m playable (forested highlands), 200m grid squares
  { id:"sq_foolsroad", game:"Squad", name:"Fool's Road",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/2be1a9b15_generated_image.png",
    fallbackColor:"#1a2210", previewColor:"#3a5025",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=FoolsRoad&layer=AAS%20v1",
    realSizeM:2000, gridCellM:200 },

  // Mestia: ~3,000m playable (Caucasus mountains), 200m grid squares
  { id:"sq_mestia",    game:"Squad", name:"Mestia",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/d98f64a60_generated_image.png",
    fallbackColor:"#1a2020", previewColor:"#3a5555",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=Mestia&layer=AAS%20v1",
    realSizeM:3000, gridCellM:200 },

  // Tallil Outskirts: ~4,000m playable (Iraqi desert), 300m grid squares
  { id:"sq_tallil",    game:"Squad", name:"Tallil Outskirts",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/de6c21ee1_generated_image.png",
    fallbackColor:"#3a2a10", previewColor:"#8a7040",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=Tallil&layer=AAS%20v1",
    realSizeM:4000, gridCellM:300 },

  // Skorpo: ~3,200m playable (Norwegian fjords), 200m grid squares
  { id:"sq_skorpo",    game:"Squad", name:"Skorpo",
    mapImageUrl:"https://media.base44.com/images/public/69bf52c997cae5d4cff87ae4/790228140_generated_image.png",
    fallbackColor:"#1a2030", previewColor:"#3a4a6a",
    attribution:"OWI Wiki", openUrl:"https://squadmaps.com/map?name=Skorpo&layer=AAS%20v1",
    realSizeM:3200, gridCellM:200 },

  // ── Custom ────────────────────────────────────────────────────────────────
  { id:"custom", game:"Custom", name:"Custom URL",
    mapImageUrl:null,
    fallbackColor:"#1a1a1a", previewColor:"#444",
    attribution:"", openUrl:"",
    realSizeM:10000, gridCellM:1000 },
];

// ─── NATO Symbols ──────────────────────────────────────────────────────────────

const NATO_SYMS = [
  { key:"inf",       label:"Infantry",     shape:"X",  cat:"friendly" },
  { key:"arm",       label:"Armour",       shape:"▭",  cat:"friendly" },
  { key:"art",       label:"Artillery",    shape:"•",  cat:"friendly" },
  { key:"eng",       label:"Engineer",     shape:"E",  cat:"friendly" },
  { key:"med",       label:"Medical",      shape:"+",  cat:"friendly" },
  { key:"hq",        label:"HQ",           shape:"⊕",  cat:"friendly" },
  { key:"log",       label:"Logistics",    shape:"L",  cat:"friendly" },
  { key:"recon",     label:"Recon",        shape:"⌖",  cat:"friendly" },
  { key:"sniper",    label:"Sniper",       shape:"⊗",  cat:"friendly" },
  { key:"air",       label:"Air Asset",    shape:"✈",  cat:"friendly" },
  { key:"enemy_inf", label:"Enemy Inf",    shape:"X",  cat:"enemy" },
  { key:"enemy_arm", label:"Enemy Arm",    shape:"▭",  cat:"enemy" },
  { key:"enemy_art", label:"Enemy Art",    shape:"•",  cat:"enemy" },
  { key:"enemy_hq",  label:"Enemy HQ",     shape:"⊕",  cat:"enemy" },
  { key:"obj",       label:"Objective",    shape:"★",  cat:"control" },
  { key:"rally",     label:"Rally Point",  shape:"R",  cat:"control" },
  { key:"fob",       label:"FOB",          shape:"F",  cat:"control" },
  { key:"lz",        label:"LZ",           shape:"H",  cat:"control" },
  { key:"cache",     label:"Cache",        shape:"◆",  cat:"control" },
  { key:"danger",    label:"Danger Area",  shape:"⚠",  cat:"control" },
  { key:"mine",      label:"Minefield",    shape:"M",  cat:"control" },
];

const SYM_COLOR: Record<string, string> = {
  friendly:"#4a9eff", enemy:"#ff4a4a", control:"#ffd700",
};

const COLORS = [
  "#ffffff","#ff4444","#ff8800","#ffcc00","#44ff88",
  "#4a9eff","#aa44ff","#ff44aa","#00ffdd","#888888",
];

// ─── Utilities ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2,10);
const dist = (a: Pt, b: Pt) => Math.sqrt((b.x-a.x)**2+(b.y-a.y)**2);

/** Format a distance in metres — auto-switches to km above 999m */
function formatDist(metres: number): string {
  if (metres >= 1000) return `${(metres / 1000).toFixed(2)} km`;
  return `${Math.round(metres)} m`;
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

function drawNatoMarker(
  ctx: CanvasRenderingContext2D,
  sym: typeof NATO_SYMS[0],
  x: number, y: number,
  label: string,
  selected: boolean,
) {
  const sz = 20;
  const cat = sym.cat as "friendly"|"enemy"|"control";
  const baseColor = SYM_COLOR[cat] ?? "#4a9eff";
  const fillColor = cat === "enemy" ? "#5a0000" : cat === "control" ? "#3a3000" : "#001a3a";

  ctx.save();
  if (selected) { ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 10; }

  if (sym.key === "obj" || sym.key === "cache") {
    ctx.beginPath();
    ctx.moveTo(x, y - sz*0.9); ctx.lineTo(x + sz*0.9, y);
    ctx.lineTo(x, y + sz*0.9); ctx.lineTo(x - sz*0.9, y);
    ctx.closePath();
  } else {
    ctx.beginPath();
    ctx.roundRect(x - sz, y - sz*0.65, sz*2, sz*1.3, 3);
  }
  ctx.fillStyle = fillColor + "dd";
  ctx.fill();
  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = baseColor;
  ctx.font = `bold ${sz*1.1}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(sym.shape, x, y + 1);

  if (label) {
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(x - tw/2 - 2, y + sz + 2, tw + 4, 14);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x, y + sz + 3);
  }
  ctx.restore();
}

// ─── ACE3-style compass ────────────────────────────────────────────────────────

function drawFullCompass(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  mapRot: number,
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2);
  ctx.fillStyle = "rgba(4,7,12,0.90)"; ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.beginPath(); ctx.arc(0, 0, r*0.88, 0, Math.PI*2);
  ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 1; ctx.stroke();

  ctx.rotate(-mapRot);

  for (let deg = 0; deg < 360; deg += 5) {
    const rad = deg * Math.PI / 180;
    const isMajor = deg % 45 === 0;
    const isMed   = deg % 15 === 0;
    const inner = isMajor ? r*0.52 : isMed ? r*0.63 : r*0.72;
    ctx.beginPath();
    ctx.moveTo(Math.sin(rad)*inner, -Math.cos(rad)*inner);
    ctx.lineTo(Math.sin(rad)*r*0.83, -Math.cos(rad)*r*0.83);
    ctx.strokeStyle = isMajor ? "rgba(255,255,255,0.9)" : isMed ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.3)";
    ctx.lineWidth = isMajor ? 1.8 : 0.8;
    ctx.stroke();

    if (isMajor && deg % 90 !== 0) {
      ctx.save();
      const tx = Math.sin(rad) * r * 0.44;
      const ty = -Math.cos(rad) * r * 0.44;
      ctx.translate(tx, ty);
      ctx.rotate(rad);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = `${r*0.14}px monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(deg), 0, 0);
      ctx.restore();
    }
  }

  const dirs: {label:string; deg:number; sz:number; color:string}[] = [
    { label:"N", deg:0,   sz:r*0.22, color:"#ff4a4a" },
    { label:"S", deg:180, sz:r*0.18, color:"#ffffff" },
    { label:"E", deg:90,  sz:r*0.18, color:"#ffffff" },
    { label:"W", deg:270, sz:r*0.18, color:"#ffffff" },
  ];
  for (const d of dirs) {
    const rad = d.deg * Math.PI / 180;
    ctx.save();
    ctx.translate(Math.sin(rad)*r*0.32, -Math.cos(rad)*r*0.32);
    ctx.fillStyle = d.color;
    ctx.font = `bold ${d.sz}px Arial`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(d.label, 0, 0);
    ctx.restore();
  }

  // N needle
  ctx.beginPath();
  ctx.moveTo(0, -r*0.82); ctx.lineTo(r*0.06, 0); ctx.lineTo(-r*0.06, 0); ctx.closePath();
  ctx.fillStyle = "#ff4a4a"; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, r*0.82);  ctx.lineTo(r*0.06, 0); ctx.lineTo(-r*0.06, 0); ctx.closePath();
  ctx.fillStyle = "#ffffff"; ctx.fill();

  ctx.rotate(mapRot);

  const bearing = Math.round(((mapRot * 180 / Math.PI) % 360 + 360) % 360);
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(-r*0.34, r*0.66, r*0.68, r*0.24);
  ctx.strokeStyle = "rgba(255,204,68,0.3)";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-r*0.34, r*0.66, r*0.68, r*0.24);
  ctx.fillStyle = "#ffcc44";
  ctx.font = `bold ${r*0.18}px monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(`${bearing}°`, 0, r*0.78);

  ctx.restore();
}

// ─── Grid overlay ──────────────────────────────────────────────────────────────
// step = pixels per in-game grid cell, derived from realSizeM / gridCellM * pixelsPerMetre

function drawGrid(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  realSizeM: number,
  gridCellM: number,
  zoom: number,
) {
  // pixels per grid cell at current zoom
  const pxPerMetre = (cw / realSizeM) * zoom;
  const step = Math.max(8, gridCellM * pxPerMetre);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 0.7;
  ctx.setLineDash([]);
  for (let x = 0; x < cw; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
  }
  for (let y = 0; y < ch; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
  }

  // Grid labels — only draw if step is large enough to be readable
  if (step >= 30) {
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    let ci = 0;
    for (let x = 0; x < cw; x += step) {
      let ri = 0;
      for (let y = 0; y < ch; y += step) {
        // Format: A00, A01 ... Z99 style grid refs
        ctx.fillText(String.fromCharCode(65 + (ci % 26)) + String(ri).padStart(2,"0"), x+2, y+2);
        ri++;
      }
      ci++;
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

// ─── Tile Map Layer (Leaflet) ─────────────────────────────────────────────────
// Uses Leaflet.js for battle-tested tile rendering, pan/zoom sync.
// The Leaflet map is read-only (no controls) — all interaction is handled by
// the TacticalPlanner canvas overlay above it.


interface TileLayerProps {
  tileConfig: TileConfig;
  panOffset: Pt;
  zoom: number;
  containerW: number;
  containerH: number;
}

function TileMapLayer({ tileConfig, panOffset, zoom, containerW, containerH }: TileLayerProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const { mapId, layerId, maxZoom } = tileConfig;

  // ── Init Leaflet once per map ────────────────────────────────────────────────
  useEffect(() => {
    if (!divRef.current) return;

    // plan-ops.fr uses a standard TMS tile scheme with CRS.Simple.
    // At zoom level z, the map is (tileSize * 2^z) pixels square.
    // We use tileSize=256 for Leaflet; plan-ops.fr tiles scale to fit.
    // The coordinate space: [0,0] = top-left, [1,1] = bottom-right (normalised).
    const TILE_SIZE = 256;

    const crs = L.Util.extend({}, L.CRS.Simple, {
      // No transformation needed — tiles already use pixel coords
      transformation: new L.Transformation(1, 0, 1, 0),
    });

    const map = L.map(divRef.current, {
      crs: L.CRS.Simple,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
      zoomSnap: 0,
      zoomDelta: 0.5,
      minZoom: 0,
      maxZoom,
    });

    // plan-ops.fr tile URL — standard z/x/y slippy map scheme
    L.tileLayer(
      `https://atlas.plan-ops.fr/data/1/maps/${mapId}/${layerId}/{z}/{x}/{y}.png`,
      {
        tileSize: TILE_SIZE,
        minZoom: 0,
        maxZoom,
        noWrap: true,
        // plan-ops tiles use TMS y-axis (bottom-origin) — flip y
        tms: true,
      }
    ).addTo(map);

    // Set initial view to centre of the map at mid zoom
    const midZoom = Math.floor(maxZoom / 2);
    // In CRS.Simple the coordinate at the centre of the tile grid at zoom z is:
    // (2^z * tileSize / 2) in both axes
    const halfPx = Math.pow(2, midZoom) * TILE_SIZE / 2;
    map.setView(map.unproject([halfPx, halfPx], midZoom), midZoom);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId, layerId, maxZoom]);

  // ── Sync pan + zoom from TacticalPlanner into Leaflet ───────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Map UI zoom (1.0 = "fit to screen") onto a Leaflet zoom level.
    // At zoom=1 we want to see the whole map → use zoom level 0.
    // Each doubling of zoom → +1 Leaflet zoom level.
    const leafletZoom = Math.max(0, Math.min(maxZoom, Math.log2(Math.max(zoom, 0.01))));

    const TILE_SIZE = 256;
    const mapPxAtZoom = Math.pow(2, leafletZoom) * TILE_SIZE;
    const W = containerW || 900;
    const H = containerH || 560;

    // Centre of the view, then shift by panOffset
    const cx = mapPxAtZoom / 2 - panOffset.x;
    const cy = mapPxAtZoom / 2 - panOffset.y;

    map.setView(map.unproject([cx, cy], leafletZoom), leafletZoom, { animate: false });
  }, [panOffset, zoom, containerW, containerH, maxZoom]);

  // ── Resize ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    mapRef.current?.invalidateSize({ animate: false });
  }, [containerW, containerH]);

  return (
    <div
      ref={divRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface Props {
  group: any;
  showMsg: (ok: boolean, msg: string) => void;
  initialJson?: string;
  onSave?: (json: string) => void;
}

export default function TacticalPlanner({ group, showMsg, initialJson, onSave }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [mapId,       setMapId]       = useState("a3_altis");
  const [tool,        setTool]        = useState<ToolMode>("pan");
  const [elements,    setElements]    = useState<PlanElement[]>([]);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [color,       setColor]       = useState("#ff4444");
  const [lw,          setLw]          = useState(2);
  const [dashed,      setDashed]      = useState(false);
  const [showGrid,    setShowGrid]    = useState(true);
  const [showCompass, setShowCompass] = useState(true);
  const [showScaleBar,setShowScaleBar]= useState(true);
  const [mapRotation, setMapRotation] = useState(0);
  const [canvasSize,  setCanvasSize]  = useState({ w: 900, h: 560 });
  const [zoom,        setZoom]        = useState(1.0);   // image zoom level
  const [panOffset,   setPanOffset]   = useState<Pt>({ x: 0, y: 0 });
  const [isPanning,   setIsPanning]   = useState(false);
  const [compassPos,  setCompassPos]  = useState<Pt>({ x: -1, y: -1 });  // -1 = auto (bottom-right)
  const isDraggingCompass = useRef(false);
  const compassDragStart  = useRef<Pt | null>(null);
  const compassPosStart   = useRef<Pt>({ x: 0, y: 0 });
  const panStart      = useRef<Pt | null>(null);
  const panOffsetStart= useRef<Pt>({ x:0, y:0 });
  const [showMapPicker,  setShowMapPicker]  = useState(false);
  const [showSymPicker,  setShowSymPicker]  = useState(false);
  const [labelPrompt,    setLabelPrompt]    = useState<{ cp: Pt; symKey: string } | null>(null);
  const [labelText,      setLabelText]      = useState("");
  const [pendingSym,     setPendingSym]     = useState("inf");
  const [rulerStart,     setRulerStart]     = useState<Pt | null>(null);
  const [customBgUrl,    setCustomBgUrl]    = useState<string | null>(null);
  const [showOpLink,     setShowOpLink]     = useState(false);
  const [ops,            setOps]            = useState<any[]>([]);
  const [linkedOpId,     setLinkedOpId]     = useState<string | null>(null);
  const [cmdNote,        setCmdNote]        = useState("");
  const [showNotes,      setShowNotes]      = useState(false);
  const [showScaleHelper,setShowScaleHelper]= useState(false);
  const [preview,        setPreview]        = useState<PlanElement | null>(null);

  const isDrawing  = useRef(false);
  const drawPath   = useRef<Pt[]>([]);
  const drawStart  = useRef<Pt | null>(null);
  const dragId     = useRef<string | null>(null);
  const dragPrev   = useRef<Pt | null>(null);

  const gameMap = useMemo(() => GAME_MAPS.find(m => m.id === mapId) ?? GAME_MAPS[0], [mapId]);

  // metersPerPixel: how many real-world metres each canvas pixel represents at current zoom
  const metersPerPixel = useMemo(() =>
    gameMap.realSizeM / (canvasSize.w * zoom),
  [gameMap.realSizeM, canvasSize.w, zoom]);

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
      if (d.elements) setElements(d.elements);
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

    if (showGrid) drawGrid(ctx, w, h, gameMap.realSizeM, gameMap.gridCellM, zoom);

    const allEls = preview ? [...elements, preview] : elements;

    for (const el of allEls) {
      ctx.save();
      const sel = el.id === selectedId;
      ctx.strokeStyle = el.color; ctx.fillStyle = el.color; ctx.lineWidth = el.lw;
      ctx.setLineDash(el.dashed ? [6,3] : []);
      if (sel) { ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 8; }

      if (el.type === "draw" && el.points && el.points.length > 1) {
        ctx.beginPath(); ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) ctx.lineTo(el.points[i].x, el.points[i].y);
        ctx.stroke();
      }
      if ((el.type === "line" || el.type === "arrow") && el.points?.length === 2) {
        ctx.beginPath(); ctx.moveTo(el.points[0].x, el.points[0].y);
        ctx.lineTo(el.points[1].x, el.points[1].y); ctx.stroke();
        if (el.type === "arrow") drawArrowHead(ctx, el.points[0], el.points[1], 14);
      }
      if (el.type === "rect" && el.x != null && el.y != null && el.w != null && el.h != null && el.w > 0 && el.h > 0) {
        ctx.strokeRect(el.x, el.y, el.w, el.h);
      }
      if (el.type === "circle" && el.x != null && el.y != null && el.r != null && el.r > 0) {
        ctx.beginPath(); ctx.arc(el.x, el.y, el.r, 0, Math.PI*2); ctx.stroke();
      }

      if (el.type === "ruler" && el.points?.length === 2) {
        ctx.setLineDash([6, 3]);
        ctx.strokeStyle = "#ffcc44"; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        ctx.lineTo(el.points[1].x, el.points[1].y);
        ctx.stroke();
        ctx.setLineDash([]);
        for (const p of el.points) {
          ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
          ctx.fillStyle = "#ffcc44"; ctx.fill();
        }
        if (el.label) {
          const mx = (el.points[0].x + el.points[1].x) / 2;
          const my = (el.points[0].y + el.points[1].y) / 2;
          const angle = Math.atan2(
            el.points[1].y - el.points[0].y,
            el.points[1].x - el.points[0].x
          );
          ctx.save();
          ctx.translate(mx, my);
          // Keep label right-way-up regardless of line angle
          const flip = Math.abs(angle) > Math.PI / 2;
          ctx.rotate(flip ? angle + Math.PI : angle);
          ctx.font = "bold 11px Arial";
          ctx.fillStyle = "#ffcc44";
          ctx.textAlign = "center"; ctx.textBaseline = "bottom";
          // Small backing pill
          const tw = ctx.measureText(el.label).width;
          ctx.fillStyle = "rgba(0,0,0,0.65)";
          ctx.fillRect(-tw/2 - 3, -17, tw + 6, 13);
          ctx.fillStyle = "#ffcc44";
          ctx.fillText(el.label, 0, -5);
          ctx.restore();
        }
      }

      if (el.type === "marker" && el.symbol) {
        const sym = NATO_SYMS.find(s => s.key === el.symbol);
        if (sym) {
          ctx.setLineDash([]); ctx.shadowBlur = 0;
          drawNatoMarker(ctx, sym, el.x!, el.y!, el.label ?? "", sel);
        }
      }

      ctx.restore();
    }

    // Live ruler preview line while placing first point
    if (tool === "ruler" && rulerStart) {
      // (preview handled by onMouseMove via preview state)
    }

    if (showCompass) {
      const cx = compassPos.x >= 0 ? compassPos.x : w - 72;
      const cy = compassPos.y >= 0 ? compassPos.y : h - 72;
      drawFullCompass(ctx, cx, cy, 58, mapRotation);
    }
    if (showScaleBar) drawScaleBar(ctx, w, h, metersPerPixel);

  }, [elements, preview, showGrid, showCompass, showScaleBar, canvasSize, selectedId, mapRotation, metersPerPixel, tool, rulerStart, compassPos, gameMap, zoom]);

  // ── Hit test ─────────────────────────────────────────────────────────────────

  const hitTest = useCallback((cp: Pt) => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if ((el.type === "marker" || el.type === "ruler") && el.x != null && el.y != null) {
        if (dist(cp, { x: el.x, y: el.y }) < 22) return el;
      }
      if (el.type === "rect" && el.x != null && el.y != null && el.w != null && el.h != null) {
        if (cp.x >= el.x && cp.x <= el.x + el.w && cp.y >= el.y && cp.y <= el.y + el.h) return el;
      }
    }
    return null;
  }, [elements]);

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
  useEffect(() => { pendingSymRef.current     = pendingSym;     }, [pendingSym]);
  useEffect(() => { canvasSizeRef.current     = canvasSize;     }, [canvasSize]);

  // ── Coordinate helper — reads from ref, always fresh ─────────────────────────

  const getEvtPt = useCallback((e: React.MouseEvent | MouseEvent): Pt => {
    const r = containerRef.current!.getBoundingClientRect();
    const { w, h } = canvasSizeRef.current;
    return {
      x: (e.clientX - r.left) * (w / r.width),
      y: (e.clientY - r.top)  * (h / r.height),
    };
  }, []);   // stable forever — reads refs only

  // ── Pointer events — defined ONCE, read current values from refs ──────────────

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const t = toolRef.current;
    const cp = getEvtPt(e);

    // Compass drag — check before pan
    if (t === "pan" && showCompassRef.current) {
      const cPos = compassPosRef.current;
      const { w, h } = canvasSizeRef.current;
      const r = containerRef.current!.getBoundingClientRect();
      const cx = cPos.x >= 0 ? cPos.x : w - 72;
      const cy = cPos.y >= 0 ? cPos.y : h - 72;
      // cp is in canvas coords, but compass is also in canvas coords
      const dx = (e.clientX - r.left) * (w / r.width) - cx;
      const dy = (e.clientY - r.top)  * (h / r.height) - cy;
      if (Math.sqrt(dx*dx + dy*dy) < 62) {
        isDraggingCompass.current = true;
        compassDragStart.current  = { x: e.clientX, y: e.clientY };
        compassPosStart.current   = { x: cx, y: cy };
        e.stopPropagation();
        return;
      }
    }

    if (t === "pan") {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      panOffsetStart.current = panOffset;
      return;
    }

    if (t === "select") {
      const hit = hitTest(cp);
      if (hit) { setSelectedId(hit.id); dragId.current = hit.id; dragPrev.current = cp; }
      else { setSelectedId(null); dragId.current = null; }
      return;
    }

    if (t === "ruler") {
      const rs = rulerStartRef.current;
      if (!rs) {
        setRulerStart(cp);
      } else {
        const px = dist(rs, cp);
        const metres = px * metersPerPixelRef.current;
        const lbl = formatDist(metres);
        setElements(prev => [...prev, {
          id: uid(), type:"ruler",
          points:[rs, cp],
          x:(rs.x+cp.x)/2, y:(rs.y+cp.y)/2,
          color:"#ffcc44", lw:1.5, label:lbl,
        }]);
        setRulerStart(null);
        setPreview(null);
      }
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

    // Compass drag
    if (isDraggingCompass.current && compassDragStart.current) {
      const { w, h } = canvasSizeRef.current;
      const r = containerRef.current!.getBoundingClientRect();
      const scaleX = w / r.width;
      const scaleY = h / r.height;
      const dx = (e.clientX - compassDragStart.current.x) * scaleX;
      const dy = (e.clientY - compassDragStart.current.y) * scaleY;
      setCompassPos({
        x: Math.max(62, Math.min(w - 62, compassPosStart.current.x + dx)),
        y: Math.max(62, Math.min(h - 62, compassPosStart.current.y + dy)),
      });
      return;
    }

    // Pan
    if (t === "pan" && isPanningRef.current && panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPanOffset({ x: panOffsetStart.current.x + dx, y: panOffsetStart.current.y + dy });
      return;
    }

    const rs = rulerStartRef.current;

    if (!isDrawing.current && !dragId.current && t !== "ruler") return;
    const cp = getEvtPt(e);

    // Drag selected element
    if (dragId.current && dragPrev.current) {
      const dx = cp.x - dragPrev.current.x;
      const dy = cp.y - dragPrev.current.y;
      setElements(prev => prev.map(el => el.id !== dragId.current ? el : {
        ...el,
        x:      (el.x  ?? 0) + dx,
        y:      (el.y  ?? 0) + dy,
        points: el.points?.map(p => ({ x: p.x + dx, y: p.y + dy })),
      }));
      dragPrev.current = cp;
      return;
    }

    // Live ruler preview
    if (t === "ruler" && rs) {
      const px = dist(rs, cp);
      const metres = px * metersPerPixelRef.current;
      const lbl = formatDist(metres);
      setPreview({
        id:"__preview__", type:"ruler",
        points:[rs, cp],
        x:(rs.x+cp.x)/2, y:(rs.y+cp.y)/2,
        color:"#ffcc44cc", lw:1.2, label:lbl,
      });
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
      setElements(p => [...p, { id:uid(), type:"draw", points:[...drawPath.current], color:c, lw:w, dashed:d }]);
    } else if (t === "line" && drawStart.current) {
      setElements(p => [...p, { id:uid(), type:"line", points:[drawStart.current!, cp], color:c, lw:w, dashed:d }]);
    } else if (t === "arrow" && drawStart.current) {
      const pts = [drawStart.current, cp] as [Pt, Pt];
      if (dist(pts[0], pts[1]) > 2) {
        setElements(p => [...p, { id:uid(), type:"arrow", points:pts, color:c, lw:w, dashed:d }]);
      }
    } else if (t === "rect" && drawStart.current) {
      const s = drawStart.current;
      const rw = Math.abs(cp.x - s.x);
      const rh = Math.abs(cp.y - s.y);
      if (rw > 2 && rh > 2) {
        setElements(p => [...p, { id:uid(), type:"rect",
          x:Math.min(s.x,cp.x), y:Math.min(s.y,cp.y),
          w:rw, h:rh,
          color:c, lw:w, dashed:d }]);
      }
    } else if (t === "circle" && drawStart.current) {
      const cr = dist(drawStart.current, cp);
      if (cr > 2) {
        setElements(p => [...p, { id:uid(), type:"circle",
          x:drawStart.current!.x, y:drawStart.current!.y,
          r:cr, color:c, lw:w, dashed:d }]);
      }
    }
    drawPath.current = []; drawStart.current = null;
  }, [getEvtPt]);   // reads all from refs — stable

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape") { setSelectedId(null); setRulerStart(null); setLabelPrompt(null); setPreview(null); }
      if (e.key === "Delete" && selectedId) {
        setElements(p => p.filter(el => el.id !== selectedId)); setSelectedId(null);
      }
      const m: Record<string, ToolMode> = { p:"pan", v:"select", d:"draw", l:"line", a:"arrow", r:"ruler", m:"marker" };
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

  const zoomIn  = () => setZoom(z => Math.min(z + 0.25, 4.0));
  const zoomOut = () => setZoom(z => Math.max(z - 0.25, 0.25));
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
    { id:"ruler",  icon:<Ruler         className="w-3.5 h-3.5"/>, label:"Ruler",  k:"R" },
    { id:"marker", icon:<Target        className="w-3.5 h-3.5"/>, label:"Marker", k:"M" },
  ] as const;

  const gameGroups = useMemo(() => {
    const groups: Record<string, GameMap[]> = {};
    for (const m of GAME_MAPS) {
      if (!groups[m.game]) groups[m.game] = [];
      groups[m.game].push(m);
    }
    return groups;
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0a0c0e] text-foreground select-none font-sans">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-card/80 flex-wrap">

        {/* Map picker */}
        <div className="relative">
          <button onClick={()=>setShowMapPicker(p=>!p)} className={btnCls(showMapPicker)}>
            <Map className="w-3.5 h-3.5"/>
            <span className="hidden sm:inline">{gameMap.name}</span>
            <ChevronDown className="w-3 h-3"/>
          </button>
          {showMapPicker && (
            <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-2xl z-50 w-72 overflow-hidden">
              <div className="p-2 max-h-80 overflow-y-auto space-y-1">
                {Object.entries(gameGroups).map(([game, maps]) => (
                  <div key={game}>
                    <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground px-2 py-1">{game}</p>
                    {maps.map(m => (
                      <button key={m.id}
                        onClick={()=>{ setMapId(m.id); setShowMapPicker(false); }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs transition-all ${
                          mapId===m.id ? "bg-primary/15 text-primary" : "text-foreground hover:bg-secondary/60"
                        }`}>
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{background:m.previewColor}}/>
                        {m.name}
                        {m.realSizeM > 0 && (
                          <span className="ml-auto text-[9px] text-muted-foreground font-mono">
                            {(m.realSizeM/1000).toFixed(1)}km
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-border flex-shrink-0"/>

        {/* Zoom controls */}
        <button onClick={zoomOut}  className={btnCls(false)} title="Zoom out"><ZoomOut  className="w-3.5 h-3.5"/></button>
        <span className="text-xs font-mono text-muted-foreground w-10 text-center">{Math.round(zoom*100)}%</span>
        <button onClick={zoomIn}   className={btnCls(false)} title="Zoom in"><ZoomIn   className="w-3.5 h-3.5"/></button>
        <button onClick={zoomReset} className={btnCls(false)} title="Reset zoom/pan"><RotateCcw className="w-3 h-3"/></button>

        <div className="w-px h-5 bg-border flex-shrink-0"/>

        {/* Tools */}
        {TOOLS.map(t => (
          <button key={t.id} onClick={()=>setTool(t.id as ToolMode)}
            className={btnCls(tool===t.id)}
            title={`${t.label}${t.k ? ` (${t.k})` : ""}`}>
            {t.icon}
            <span className="hidden lg:inline">{t.label}</span>
          </button>
        ))}

        {/* Marker symbol picker */}
        {tool === "marker" && (
          <div className="relative">
            <button onClick={()=>setShowSymPicker(p=>!p)} className={btnCls(showSymPicker)}>
              <Flag className="w-3.5 h-3.5"/>
              <span>{NATO_SYMS.find(s=>s.key===pendingSym)?.label ?? "Symbol"}</span>
              <ChevronDown className="w-3 h-3"/>
            </button>
            {showSymPicker && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-2xl z-50 w-56 p-2">
                <div className="grid grid-cols-4 gap-1">
                  {NATO_SYMS.map(sym=>(
                    <button key={sym.key}
                      onClick={()=>{ setPendingSym(sym.key); setShowSymPicker(false); }}
                      className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border transition-all ${
                        pendingSym===sym.key?"border-primary/60 bg-primary/15":"border-border hover:bg-secondary/50"
                      }`} title={sym.label}>
                      <span style={{color:SYM_COLOR[sym.cat],fontFamily:"monospace",fontSize:12,fontWeight:"bold"}}>{sym.shape}</span>
                      <span className="text-[7px] text-muted-foreground leading-tight text-center">{sym.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="w-px h-5 bg-border flex-shrink-0"/>

        {/* Colour */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setColor(c)}
              className={`w-4 h-4 rounded-sm transition-all ${color===c?"ring-2 ring-white ring-offset-1 ring-offset-background":""}`}
              style={{background:c}}/>
          ))}
        </div>

        {/* Line width */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {[1,2,4,6].map(w=>(
            <button key={w} onClick={()=>setLw(w)}
              className={btnCls(lw===w)}
              style={{minWidth:28}}>{w}px</button>
          ))}
        </div>

        {/* Dash */}
        <button onClick={()=>setDashed(d=>!d)} className={btnCls(dashed)}>- -</button>

        <div className="w-px h-5 bg-border flex-shrink-0"/>

        {/* Map rotation */}
        <button onClick={()=>setMapRotation(r=>r-Math.PI/12)} className={btnCls(false)} title="Rotate CCW"><RotateCcw className="w-3.5 h-3.5"/></button>
        <button onClick={()=>setMapRotation(0)} className="text-xs font-mono text-muted-foreground w-8 text-center hover:text-foreground transition-colors">{Math.round(mapRotation*180/Math.PI)}°</button>
        <button onClick={()=>setMapRotation(r=>r+Math.PI/12)} className={btnCls(false)} title="Rotate CW"><RotateCw  className="w-3.5 h-3.5"/></button>

        <div className="w-px h-5 bg-border flex-shrink-0"/>

        {/* Toggles */}
        <button onClick={()=>setShowGrid(g=>!g)}     className={btnCls(showGrid)}    title="Grid"><Layers className="w-3.5 h-3.5"/></button>
        <button onClick={()=>setShowCompass(c=>!c)}  className={btnCls(showCompass)} title="Compass"><Compass className="w-3.5 h-3.5"/></button>
        <button onClick={()=>setShowScaleBar(s=>!s)} className={btnCls(showScaleBar)} title="Scale bar">
          <Ruler className="w-3.5 h-3.5"/>
          <span className="hidden xl:inline">Scale</span>
        </button>

        <div className="w-px h-5 bg-border flex-shrink-0"/>

        <button onClick={()=>setShowOpLink(p=>!p)} className={btnCls(!!linkedOpId)} title="Link Op">
          <Link className="w-3.5 h-3.5"/>
          <span className="hidden xl:inline">{linkedOp ? linkedOp.name : "Link Op"}</span>
        </button>
        <button onClick={()=>setShowNotes(p=>!p)} className={btnCls(showNotes)} title="Notes">
          <MessageSquare className="w-3.5 h-3.5"/>
          <span className="hidden xl:inline">Notes</span>
        </button>
        <button
          onClick={()=>setShowScaleHelper(p=>!p)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all flex-shrink-0 ${
            showScaleHelper
              ? "bg-yellow-500/20 border-yellow-500/60 text-yellow-400"
              : "border-yellow-700/40 text-yellow-600 hover:bg-yellow-500/10 hover:border-yellow-500/50 hover:text-yellow-400"
          }`}
          title="Map Scale Helper — terrain dimensions, grid cell size, distance reference"
        >
          <Map className="w-3.5 h-3.5"/>
          <span>Map Info</span>
        </button>

        {selectedId && (
          <button onClick={()=>{setElements(p=>p.filter(e=>e.id!==selectedId));setSelectedId(null);}} className={btnCls(false,true)}>
            <Trash2 className="w-3.5 h-3.5"/>Del
          </button>
        )}

        <button onClick={()=>{if(window.confirm("Clear all markings?"))setElements([]);}} className={btnCls(false)} title="Clear"><X className="w-3.5 h-3.5"/></button>
        <button onClick={exportPng} className={btnCls(false)}><Download className="w-3.5 h-3.5"/><span className="hidden xl:inline">Export</span></button>
        <button onClick={savePlan} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/15 border border-primary/50 text-primary hover:bg-primary/25 transition-all text-xs font-display font-bold uppercase tracking-wider flex-shrink-0">
          <Save className="w-3.5 h-3.5"/>Save
        </button>
      </div>

      {/* ── Op link panel ──────────────────────────────────────────────────── */}
      {showOpLink && (
        <div className="border-b border-border bg-card/50 px-4 py-3">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Link to Operation</p>
          <div className="flex flex-wrap gap-2">
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

      {/* ── Commander notes ─────────────────────────────────────────────────── */}
      {showNotes && (
        <div className="border-b border-border bg-card/50 px-4 py-3">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Commander\'s Notes</p>
          <textarea
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans text-foreground resize-none"
            rows={3} placeholder="Pre-deployment intentions, ROE, timings, coordination notes..."
            value={cmdNote} onChange={e=>setCmdNote(e.target.value)}
          />
        </div>
      )}

      {/* ── Scale Helper Panel ─────────────────────────────────────────────── */}
      {showScaleHelper && (
        <div className="border-b border-border bg-card/50 px-4 py-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1">Map Scale Reference</p>
              <p className="text-xs text-muted-foreground">Current map: <span className="text-foreground font-bold">{gameMap.name}</span></p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-background border border-border rounded-lg p-2.5">
                <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Terrain Size</p>
                <p className="text-primary font-mono font-bold">{(gameMap.realSizeM / 1000).toFixed(1)} km</p>
                <p className="text-muted-foreground text-[9px]">{gameMap.realSizeM.toLocaleString()} m × {gameMap.realSizeM.toLocaleString()} m</p>
              </div>
              <div className="bg-background border border-border rounded-lg p-2.5">
                <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Grid Cell Size</p>
                <p className="text-primary font-mono font-bold">{gameMap.gridCellM} m</p>
                <p className="text-muted-foreground text-[9px]">per grid square</p>
              </div>
              <div className="bg-background border border-border rounded-lg p-2.5">
                <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Grid Count</p>
                <p className="text-primary font-mono font-bold">{Math.floor(gameMap.realSizeM / gameMap.gridCellM)} × {Math.floor(gameMap.realSizeM / gameMap.gridCellM)}</p>
                <p className="text-muted-foreground text-[9px]">squares across</p>
              </div>
              <div className="bg-background border border-border rounded-lg p-2.5">
                <p className="text-[9px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Scale (at 1x zoom)</p>
                <p className="text-primary font-mono font-bold">{metersPerPixel.toFixed(1)} m/px</p>
                <p className="text-muted-foreground text-[9px]">metres per pixel</p>
              </div>
            </div>
            <div className="text-[9px] text-muted-foreground leading-relaxed max-w-xs">
              <p className="font-bold text-foreground/60 mb-0.5">Grid squares on this map</p>
              <p>Each square = <span className="text-yellow-400 font-bold">{gameMap.gridCellM}m</span>. Use the ruler tool to measure distances — it reads in real-world metres/km based on this map's terrain dimensions. Zoom in to increase ruler precision.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Map + canvas stack ───────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-[#0a0c0e]"
        style={{ cursor: isDraggingCompass.current ? "grabbing" : tool === "pan" ? (isPanningRef.current ? "grabbing" : "grab") : "crosshair" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={()=>{
          dragId.current=null; dragPrev.current=null;
          if (isPanning) { setIsPanning(false); panStart.current = null; }
          if (isDraggingCompass.current) { isDraggingCompass.current = false; compassDragStart.current = null; }
        }}
        onContextMenu={e => e.preventDefault()}
      >

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
              />
            ) : gameMap.mapImageUrl ? (
              /* Fallback static image for maps without tile config */
              <img
                src={gameMap.mapImageUrl}
                alt={gameMap.name}
                draggable={false}
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

        {/* Ruler hint */}
        {tool==="ruler" && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-card/90 border border-yellow-500/40 rounded text-xs text-yellow-400 font-display font-bold uppercase tracking-wider pointer-events-none">
            {rulerStart
              ? `Click second point — measuring from (${Math.round(rulerStart.x)}, ${Math.round(rulerStart.y)})`
              : "Click start point"}
          </div>
        )}

        {/* Hint strip */}
        <div className="absolute bottom-2 right-20 flex items-center gap-3 text-[9px] text-white/20 font-mono pointer-events-none">
          <span>P=pan</span><span>D=draw</span><span>A=arrow</span><span>M=marker</span><span>R=ruler</span><span>Del=delete</span>
        </div>
      </div>

      {/* ── Marker label modal ──────────────────────────────────────────────── */}
      {labelPrompt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999]">
          <div className="bg-card border border-border rounded-xl p-5 w-80 shadow-2xl">
            <p className="text-xs font-display font-bold uppercase tracking-widest mb-2">Choose Symbol</p>
            <div className="grid grid-cols-5 gap-1 mb-4 max-h-40 overflow-y-auto">
              {NATO_SYMS.map(sym=>(
                <button key={sym.key}
                  onClick={()=>setLabelPrompt(p=>p?{...p,symKey:sym.key}:p)}
                  className={`flex flex-col items-center gap-0.5 p-1 rounded border transition-all ${
                    labelPrompt.symKey===sym.key?"border-primary/60 bg-primary/15":"border-border hover:bg-secondary/50"
                  }`} title={sym.label}>
                  <span style={{color:SYM_COLOR[sym.cat],fontFamily:"monospace",fontSize:12,fontWeight:"bold"}}>{sym.shape}</span>
                  <span className="text-[7px] text-muted-foreground">{sym.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs font-display font-bold uppercase tracking-widest mb-1.5">Label (optional)</p>
            <input autoFocus
              className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm mb-3"
              placeholder="e.g. 1 SECT, Alpha, HQ"
              value={labelText} onChange={e=>setLabelText(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") {
                setElements(prev=>[...prev, {
                  id:uid(), type:"marker",
                  x:labelPrompt.cp.x, y:labelPrompt.cp.y,
                  symbol:labelPrompt.symKey, label:labelText,
                  color: SYM_COLOR[NATO_SYMS.find(s=>s.key===labelPrompt.symKey)?.cat ?? "friendly"],
                  lw:2,
                }]);
                setLabelPrompt(null); setLabelText("");
              }}}
            />
            <div className="flex gap-2">
              <button
                onClick={()=>{
                  setElements(prev=>[...prev, {
                    id:uid(), type:"marker",
                    x:labelPrompt.cp.x, y:labelPrompt.cp.y,
                    symbol:labelPrompt.symKey, label:labelText,
                    color: SYM_COLOR[NATO_SYMS.find(s=>s.key===labelPrompt.symKey)?.cat ?? "friendly"],
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
