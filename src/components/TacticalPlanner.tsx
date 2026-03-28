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

interface GameMap {
  id: string;
  game: string;
  name: string;
  mapImageUrl: string | null;
  fallbackColor: string;
  previewColor: string;
  attribution: string;
  openUrl: string;
  realSizeM: number;   // real-world width of the map in metres (used for scale/ruler)
}

const GAME_MAPS: GameMap[] = [
  // ── Arma 3 Vanilla ──────────────────────────────────────────────────────────
  { id:"a3_altis",
    game:"Arma 3 — Vanilla",  name:"Altis",
    mapImageUrl:null,
    fallbackColor:"#2d3a2e", previewColor:"#4a7c59",
    attribution:"PLANOPS Atlas",
    openUrl:"https://atlas.plan-ops.fr/maps/arma3/altis/150",
    realSizeM: 30720 },

  { id:"a3_stratis",
    game:"Arma 3 — Vanilla",  name:"Stratis",
    mapImageUrl:null,
    fallbackColor:"#2d3a2e", previewColor:"#5a8c6a",
    attribution:"PLANOPS Atlas",
    openUrl:"https://atlas.plan-ops.fr/maps/arma3/stratis/150",
    realSizeM: 8192 },

  { id:"a3_malden",
    game:"Arma 3 — Vanilla",  name:"Malden",
    mapImageUrl:null,
    fallbackColor:"#2d3a2e", previewColor:"#6a9c7a",
    attribution:"PLANOPS Atlas",
    openUrl:"https://atlas.plan-ops.fr/maps/arma3/malden/150",
    realSizeM: 12800 },

  { id:"a3_tanoa",
    game:"Arma 3 — Vanilla",  name:"Tanoa",
    mapImageUrl:null,
    fallbackColor:"#1a3a2a", previewColor:"#3a7a5a",
    attribution:"PLANOPS Atlas",
    openUrl:"https://atlas.plan-ops.fr/maps/arma3/tanoa/150",
    realSizeM: 15360 },

  // ── Arma 3 Modded ───────────────────────────────────────────────────────────
  { id:"a3_chernarus",
    game:"Arma 3 — Modded",  name:"Chernarus (Summer)",
    mapImageUrl:null,
    fallbackColor:"#263326", previewColor:"#4a7a55",
    attribution:"PLANOPS Atlas",
    openUrl:"https://atlas.plan-ops.fr/maps/arma3/chernarus/150",
    realSizeM: 15360 },

  { id:"a3_takistan",
    game:"Arma 3 — Modded",  name:"Takistan",
    mapImageUrl:null,
    fallbackColor:"#3a3020", previewColor:"#7a7040",
    attribution:"PLANOPS Atlas",
    openUrl:"https://atlas.plan-ops.fr/maps/arma3/takistan/150",
    realSizeM: 12800 },

  { id:"a3_lingor",
    game:"Arma 3 — Modded",  name:"Lingor",
    mapImageUrl:null,
    fallbackColor:"#1a3020", previewColor:"#3a6a40",
    attribution:"PLANOPS Atlas",
    openUrl:"https://atlas.plan-ops.fr/maps/arma3/lingor/150",
    realSizeM: 10240 },

  { id:"a3_fallujah",
    game:"Arma 3 — Modded",  name:"Fallujah",
    mapImageUrl:null,
    fallbackColor:"#3a2a10", previewColor:"#8a7040",
    attribution:"PLANOPS Atlas",
    openUrl:"https://atlas.plan-ops.fr/maps/arma3/fallujah/150",
    realSizeM: 10240 },

  { id:"a3_lythium",
    game:"Arma 3 — Modded",  name:"Lythium",
    mapImageUrl:null,
    fallbackColor:"#2a2010", previewColor:"#7a6030",
    attribution:"PLANOPS Atlas",
    openUrl:"https://atlas.plan-ops.fr/maps/arma3/lythium/150",
    realSizeM: 20480 },

  // ── Squad ────────────────────────────────────────────────────────────────────
  { id:"sq_yehorivka",
    game:"Squad",  name:"Yehorivka",
    mapImageUrl:null,
    fallbackColor:"#2a3020", previewColor:"#6a7a3a",
    attribution:"squadmaps.com",
    openUrl:"https://squadmaps.com/map?name=Yehorivka&layer=AAS%20v1",
    realSizeM: 8192 },

  { id:"sq_fallujah",
    game:"Squad",  name:"Fallujah",
    mapImageUrl:null,
    fallbackColor:"#3a2a10", previewColor:"#8a7040",
    attribution:"squadmaps.com",
    openUrl:"https://squadmaps.com/map?name=Fallujah&layer=AAS%20v1",
    realSizeM: 4096 },

  // ── Custom ────────────────────────────────────────────────────────────────
  { id:"custom",
    game:"Custom",  name:"Custom URL",
    mapImageUrl:null,
    fallbackColor:"#1a1a1a", previewColor:"#444",
    attribution:"", openUrl:"",
    realSizeM: 10000 },
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

function drawGrid(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
  const step = 60;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 0.5;
  ctx.setLineDash([]);
  for (let x = 0; x < cw; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
  }
  for (let y = 0; y < ch; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.font = "8px monospace";
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  let ci = 0;
  for (let x = 0; x < cw; x += step) {
    let ri = 0;
    for (let y = 0; y < ch; y += step) {
      ctx.fillText(String.fromCharCode(65 + (ci % 26)) + String(ri).padStart(2,"0"), x+2, y+2);
      ri++;
    }
    ci++;
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

    if (showGrid) drawGrid(ctx, w, h);

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
      if (el.type === "rect" && el.x != null && el.y != null && el.w != null && el.h != null) {
        ctx.strokeRect(el.x, el.y, el.w, el.h);
      }
      if (el.type === "circle" && el.x != null && el.y != null && el.r != null) {
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

    if (showCompass) drawFullCompass(ctx, w - 68, h - 68, 55, mapRotation);
    if (showScaleBar) drawScaleBar(ctx, w, h, metersPerPixel);

  }, [elements, preview, showGrid, showCompass, showScaleBar, canvasSize, selectedId, mapRotation, metersPerPixel, tool, rulerStart]);

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

  // ── Coordinate helper ─────────────────────────────────────────────────────────

  const getEvtPt = useCallback((e: React.MouseEvent): Pt => {
    const r = containerRef.current!.getBoundingClientRect();
    const scaleX = canvasSize.w / r.width;
    const scaleY = canvasSize.h / r.height;
    return { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY };
  }, [canvasSize]);

  // ── Pointer events ────────────────────────────────────────────────────────────

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const cp = getEvtPt(e);

    if (tool === "pan") {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      panOffsetStart.current = panOffset;
      return;
    }

    if (tool === "select") {
      const hit = hitTest(cp);
      if (hit) { setSelectedId(hit.id); dragId.current = hit.id; dragPrev.current = cp; }
      else { setSelectedId(null); dragId.current = null; }
      return;
    }

    if (tool === "ruler") {
      if (!rulerStart) {
        setRulerStart(cp);
      } else {
        const px = dist(rulerStart, cp);
        const metres = px * metersPerPixel;
        const lbl = formatDist(metres);
        setElements(prev => [...prev, {
          id: uid(), type:"ruler",
          points:[rulerStart, cp],
          x:(rulerStart.x+cp.x)/2, y:(rulerStart.y+cp.y)/2,
          color:"#ffcc44", lw:1.5, label:lbl,
        }]);
        setRulerStart(null);
        setPreview(null);
      }
      return;
    }

    if (tool === "marker") {
      setLabelPrompt({ cp, symKey: pendingSym });
      return;
    }

    isDrawing.current = true;
    drawStart.current = cp;
    drawPath.current  = [cp];
  }, [tool, getEvtPt, hitTest, rulerStart, pendingSym, metersPerPixel, panOffset]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    // Pan mode — move the background image
    if (tool === "pan" && isPanning && panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPanOffset({ x: panOffsetStart.current.x + dx, y: panOffsetStart.current.y + dy });
      return;
    }

    if (!isDrawing.current && !dragId.current && tool !== "ruler") return;
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
    if (tool === "ruler" && rulerStart) {
      const px = dist(rulerStart, cp);
      const metres = px * metersPerPixel;
      const lbl = formatDist(metres);
      setPreview({
        id:"__preview__", type:"ruler",
        points:[rulerStart, cp],
        x:(rulerStart.x+cp.x)/2, y:(rulerStart.y+cp.y)/2,
        color:"#ffcc44cc", lw:1.2, label:lbl,
      });
      return;
    }

    if (!isDrawing.current) return;

    if (tool === "draw") {
      drawPath.current.push(cp);
      setPreview({ id:"__preview__", type:"draw", points:[...drawPath.current], color, lw, dashed });
    } else if (tool === "line") {
      setPreview({ id:"__preview__", type:"line", points:[drawStart.current!, cp], color, lw, dashed });
    } else if (tool === "arrow") {
      setPreview({ id:"__preview__", type:"arrow", points:[drawStart.current!, cp], color, lw, dashed });
    } else if (tool === "rect") {
      const s = drawStart.current!;
      setPreview({ id:"__preview__", type:"rect",
        x:Math.min(s.x,cp.x), y:Math.min(s.y,cp.y),
        w:Math.abs(cp.x-s.x), h:Math.abs(cp.y-s.y),
        color, lw, dashed });
    } else if (tool === "circle") {
      setPreview({ id:"__preview__", type:"circle",
        x:drawStart.current!.x, y:drawStart.current!.y,
        r:dist(drawStart.current!, cp), color, lw, dashed });
    }
  }, [tool, getEvtPt, color, lw, dashed, rulerStart, metersPerPixel, isPanning, panOffset]);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (tool === "pan") { setIsPanning(false); panStart.current = null; return; }
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const cp = getEvtPt(e);
    setPreview(null);
    if (tool === "draw" && drawPath.current.length > 1) {
      setElements(p => [...p, { id:uid(), type:"draw", points:[...drawPath.current], color, lw, dashed }]);
    } else if (tool === "line" && drawStart.current) {
      setElements(p => [...p, { id:uid(), type:"line", points:[drawStart.current!, cp], color, lw, dashed }]);
    } else if (tool === "arrow" && drawStart.current) {
      setElements(p => [...p, { id:uid(), type:"arrow", points:[drawStart.current!, cp], color, lw, dashed }]);
    } else if (tool === "rect" && drawStart.current) {
      const s = drawStart.current;
      setElements(p => [...p, { id:uid(), type:"rect",
        x:Math.min(s.x,cp.x), y:Math.min(s.y,cp.y),
        w:Math.abs(cp.x-s.x), h:Math.abs(cp.y-s.y),
        color, lw, dashed }]);
    } else if (tool === "circle" && drawStart.current) {
      setElements(p => [...p, { id:uid(), type:"circle",
        x:drawStart.current!.x, y:drawStart.current!.y,
        r:dist(drawStart.current!, cp), color, lw, dashed }]);
    }
    drawPath.current = []; drawStart.current = null;
  }, [tool, getEvtPt, color, lw, dashed]);

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

      {/* ── Map + canvas stack ───────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-[#0a0c0e]"
        style={{ cursor: tool === "pan" ? (isPanning ? "grabbing" : "grab") : "crosshair" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={()=>{
          dragId.current=null; dragPrev.current=null;
          if (isPanning) { setIsPanning(false); panStart.current = null; }
        }}
      >

        {/* LAYER 0: Map background image (panned + zoomed) */}
        {mapId !== "custom" && (
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            style={{ pointerEvents: "none" }}
          >
            {gameMap.mapImageUrl ? (
              <img
                src={gameMap.mapImageUrl}
                alt={gameMap.name}
                draggable={false}
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  userSelect: "none",
                  transition: isPanning ? "none" : "transform 0.05s ease-out",
                }}
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `
                    repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(255,255,255,0.04) 59px, rgba(255,255,255,0.04) 60px),
                    repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(255,255,255,0.04) 59px, rgba(255,255,255,0.04) 60px),
                    radial-gradient(ellipse at 30% 40%, ${gameMap.previewColor}99 0%, ${gameMap.fallbackColor}cc 45%, #0a0c0e 100%)
                  `,
                }}
              />
            )}
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
