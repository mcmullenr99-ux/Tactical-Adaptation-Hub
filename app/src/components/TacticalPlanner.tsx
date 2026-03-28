/**
 * TacticalPlanner v2 — Commander's Battle/Navigation Planning Canvas
 * Full rewrite fixing: crashes, drawing persistence, map rendering,
 * compass upgrade, map rotation, op linking, commander notes
 */

import React, {
  useRef, useState, useEffect, useCallback, useMemo,
} from "react";
import {
  Map, Pencil, MousePointer2, Move, Minus, Plus, RotateCcw,
  Trash2, Download, Save, Layers, Compass, Ruler,
  Circle, Square, ArrowRight, ChevronDown, Target, Flag,
  Check, X, Link, MessageSquare, RotateCw, AlertTriangle,
} from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToolMode = "select" | "pan" | "draw" | "line" | "arrow" | "rect" | "circle" | "ruler" | "marker";

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

interface ViewState { ox: number; oy: number; scale: number; rotation: number; }

// ─── Map catalogue ────────────────────────────────────────────────────────────

interface GameMap {
  id: string; game: string; name: string;
  imageUrl: string | null;
  bgColor: string; previewColor: string;
  gridSize: number; mapSizeKm: number;
  attribution: string;
}

// For Arma3 maps we use the PLANOPS tile servers at a fixed zoom level
// rendered as static background image tiles stitched together
const GAME_MAPS: GameMap[] = [
  { id:"a3_altis",    game:"Arma 3",         name:"Altis",
    imageUrl: "https://atlas.plan-ops.fr/maps/arma3/altis/100/3/4/3.png",
    bgColor:"#2d3a2e", previewColor:"#4a7c59", gridSize:100, mapSizeKm:27, attribution:"© Bohemia Interactive / PLANOPS" },
  { id:"a3_stratis",  game:"Arma 3",         name:"Stratis",
    imageUrl: "https://atlas.plan-ops.fr/maps/arma3/stratis/100/3/4/3.png",
    bgColor:"#2d3a2e", previewColor:"#5a8c6a", gridSize:100, mapSizeKm:8,  attribution:"© Bohemia Interactive / PLANOPS" },
  { id:"a3_malden",   game:"Arma 3",         name:"Malden",
    imageUrl: "https://atlas.plan-ops.fr/maps/arma3/malden/100/3/4/3.png",
    bgColor:"#2d3a2e", previewColor:"#6a9c7a", gridSize:100, mapSizeKm:12, attribution:"© Bohemia Interactive / PLANOPS" },
  { id:"a3_tanoa",    game:"Arma 3",         name:"Tanoa",
    imageUrl: "https://atlas.plan-ops.fr/maps/arma3/tanoa/100/3/4/3.png",
    bgColor:"#1a3a2a", previewColor:"#3a7a5a", gridSize:100, mapSizeKm:16, attribution:"© Bohemia Interactive / PLANOPS" },
  { id:"rf_everon",   game:"Arma Reforger",  name:"Everon",
    imageUrl: null, bgColor:"#263326", previewColor:"#4d7a55", gridSize:100, mapSizeKm:16, attribution:"© Bohemia Interactive" },
  { id:"sq_yeho",     game:"Squad",          name:"Yehorivka",
    imageUrl: null, bgColor:"#2a2a1e", previewColor:"#6a7a3a", gridSize:300, mapSizeKm:8,  attribution:"© Offworld Industries" },
  { id:"sq_kohat",    game:"Squad",          name:"Kohat Toi",
    imageUrl: null, bgColor:"#3a2a1e", previewColor:"#7a6a3a", gridSize:300, mapSizeKm:8,  attribution:"© Offworld Industries" },
  { id:"sq_gorodok",  game:"Squad",          name:"Gorodok",
    imageUrl: null, bgColor:"#1e2a1e", previewColor:"#4a6a4a", gridSize:300, mapSizeKm:8,  attribution:"© Offworld Industries" },
  { id:"sq_talil",    game:"Squad",          name:"Tallil Outskirts",
    imageUrl: null, bgColor:"#3a3020", previewColor:"#8a7a4a", gridSize:300, mapSizeKm:8,  attribution:"© Offworld Industries" },
  { id:"hll_sthelen", game:"Hell Let Loose", name:"Sainte-Marie-du-Mont",
    imageUrl: null, bgColor:"#283020", previewColor:"#5a7a4a", gridSize:250, mapSizeKm:2,  attribution:"© Black Matter" },
  { id:"hll_stalin",  game:"Hell Let Loose", name:"Stalingrad",
    imageUrl: null, bgColor:"#302820", previewColor:"#7a6a5a", gridSize:250, mapSizeKm:2,  attribution:"© Black Matter" },
  { id:"hll_hurtgen", game:"Hell Let Loose", name:"Hürtgen Forest",
    imageUrl: null, bgColor:"#203020", previewColor:"#4a6a4a", gridSize:250, mapSizeKm:2,  attribution:"© Black Matter" },
  { id:"custom",      game:"Custom",         name:"Upload Image",
    imageUrl: null, bgColor:"#1a1a1a", previewColor:"#444", gridSize:100, mapSizeKm:10, attribution:"" },
];

// ─── NATO Symbols ─────────────────────────────────────────────────────────────

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
  friendly: "#4a9eff", enemy: "#ff4a4a", control: "#ffd700",
};

const COLORS = [
  "#ffffff","#ff4444","#ff8800","#ffcc00","#44ff88",
  "#4a9eff","#aa44ff","#ff44aa","#00ffdd","#888888",
];

// ─── Utilities ────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2,10);
const dist = (a: Pt, b: Pt) => Math.sqrt((b.x-a.x)**2+(b.y-a.y)**2);

// ─── Drawing helpers ──────────────────────────────────────────────────────────

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
  invScale: number,
) {
  const sz = 20 * invScale;
  const cat = sym.cat as "friendly"|"enemy"|"control";
  const baseColor = SYM_COLOR[cat] ?? "#4a9eff";
  const fillColor = cat === "enemy" ? "#5a0000" : cat === "control" ? "#3a3000" : "#001a3a";

  ctx.save();
  if (selected) { ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 10 * invScale; }

  if (sym.key === "obj" || sym.key === "cache") {
    ctx.beginPath();
    ctx.moveTo(x, y - sz * 0.9);
    ctx.lineTo(x + sz * 0.9, y);
    ctx.lineTo(x, y + sz * 0.9);
    ctx.lineTo(x - sz * 0.9, y);
    ctx.closePath();
  } else {
    ctx.beginPath();
    ctx.roundRect(x - sz, y - sz * 0.65, sz * 2, sz * 1.3, 3 * invScale);
  }
  ctx.fillStyle = fillColor + "dd";
  ctx.fill();
  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 1.8 * invScale;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = baseColor;
  ctx.font = `bold ${sz * 1.1}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(sym.shape, x, y + 1 * invScale);

  if (label) {
    ctx.font = `bold ${9 * invScale}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(x - tw/2 - 2*invScale, y + sz + 2*invScale, tw + 4*invScale, 13*invScale);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x, y + sz + 3*invScale);
  }
  ctx.restore();
}

// ─── Full Compass (A3 ACE3 style) ────────────────────────────────────────────
function drawFullCompass(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  mapRotation: number,
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Outer dark ring
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(5,8,12,0.88)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Rotate for map orientation
  ctx.rotate(-mapRotation);

  // Bearing ring — tick marks every 5°, label every 45°
  for (let deg = 0; deg < 360; deg += 5) {
    const rad = (deg * Math.PI) / 180;
    const isMajor = deg % 45 === 0;
    const isMed   = deg % 15 === 0;
    const inner = isMajor ? r * 0.55 : isMed ? r * 0.65 : r * 0.72;
    const outer = r * 0.82;
    ctx.beginPath();
    ctx.moveTo(Math.sin(rad) * inner, -Math.cos(rad) * inner);
    ctx.lineTo(Math.sin(rad) * outer, -Math.cos(rad) * outer);
    ctx.strokeStyle = isMajor ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)";
    ctx.lineWidth = isMajor ? 1.5 : 0.7;
    ctx.stroke();
  }

  // Cardinal + intercardinal labels
  const dirs = [
    { label:"N", deg:0,   color:"#ff3333", size: r*0.28 },
    { label:"NE",deg:45,  color:"#cccccc", size: r*0.16 },
    { label:"E", deg:90,  color:"#cccccc", size: r*0.22 },
    { label:"SE",deg:135, color:"#cccccc", size: r*0.16 },
    { label:"S", deg:180, color:"#cccccc", size: r*0.22 },
    { label:"SW",deg:225, color:"#cccccc", size: r*0.16 },
    { label:"W", deg:270, color:"#cccccc", size: r*0.22 },
    { label:"NW",deg:315, color:"#cccccc", size: r*0.16 },
  ];
  for (const d of dirs) {
    const rad = (d.deg * Math.PI) / 180;
    const tx = Math.sin(rad) * r * 0.43;
    const ty = -Math.cos(rad) * r * 0.43;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(mapRotation); // keep labels readable
    ctx.fillStyle = d.color;
    ctx.font = `bold ${d.size}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(d.label, 0, 0);
    ctx.restore();
  }

  ctx.rotate(mapRotation); // undo rotation for needle

  // North needle (red/white split)
  const needleH = r * 0.38;
  const needleW = r * 0.12;
  const compassRot = -mapRotation;
  ctx.save();
  ctx.rotate(compassRot);
  // Red (north)
  ctx.beginPath();
  ctx.moveTo(0, -needleH);
  ctx.lineTo(-needleW, 0);
  ctx.lineTo(needleW, 0);
  ctx.closePath();
  ctx.fillStyle = "#ff3333";
  ctx.fill();
  // White (south)
  ctx.beginPath();
  ctx.moveTo(0, needleH);
  ctx.lineTo(-needleW, 0);
  ctx.lineTo(needleW, 0);
  ctx.closePath();
  ctx.fillStyle = "#eeeeee";
  ctx.fill();
  // Centre dot
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.07, 0, Math.PI * 2);
  ctx.fillStyle = "#222";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Degree readout at bottom of compass
  const bearing = ((mapRotation * 180 / Math.PI) % 360 + 360) % 360;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(-r * 0.35, r * 0.68, r * 0.7, r * 0.22);
  ctx.fillStyle = "#ffcc44";
  ctx.font = `bold ${r * 0.18}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${Math.round(bearing)}°`, 0, r * 0.79);

  ctx.restore();
}

// ─── Grid overlay ─────────────────────────────────────────────────────────────

function drawGrid(
  ctx: CanvasRenderingContext2D,
  view: ViewState,
  cw: number, ch: number,
  gridSize: number,
) {
  // gridSize metres, 1 canvas unit = 0.1m → gridSize * 10 canvas units
  const gridPx = gridSize * 10 * view.scale;
  if (gridPx < 16) return;

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 0.5;
  ctx.setLineDash([]);

  const startX = ((view.ox % gridPx) + gridPx) % gridPx;
  const startY = ((view.oy % gridPx) + gridPx) % gridPx;

  for (let x = startX; x < cw; x += gridPx) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
  }
  for (let y = startY; y < ch; y += gridPx) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
  }

  if (gridPx > 50) {
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    let ci = 0;
    for (let x = startX; x < cw; x += gridPx) {
      let ri = 0;
      for (let y = startY; y < ch; y += gridPx) {
        ctx.fillText(String.fromCharCode(65 + (ci % 26)) + String(ri).padStart(2, "0"), x + 2, y + 2);
        ri++;
      }
      ci++;
    }
  }
  ctx.restore();
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  group: any;
  showMsg: (ok: boolean, msg: string) => void;
  initialJson?: string;
  onSave?: (json: string) => void;
}

export default function TacticalPlanner({ group, showMsg, initialJson, onSave }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Core state ───────────────────────────────────────────────────────────
  const [mapId,      setMapId]      = useState("a3_altis");
  const [tool,       setTool]       = useState<ToolMode>("pan");
  const [elements,   setElements]   = useState<PlanElement[]>([]);
  const [view,       setView]       = useState<ViewState>({ ox: 0, oy: 0, scale: 1, rotation: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [color,      setColor]      = useState("#ff4444");
  const [lw,         setLw]         = useState(2);
  const [dashed,     setDashed]     = useState(false);
  const [showGrid,   setShowGrid]   = useState(true);
  const [showCompass,setShowCompass]= useState(true);
  const [canvasSize, setCanvasSize] = useState({ w: 900, h: 560 });
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showSymPicker, setShowSymPicker] = useState(false);
  const [labelPrompt, setLabelPrompt] = useState<{ cp: Pt; symKey: string } | null>(null);
  const [labelText,   setLabelText]   = useState("");
  const [pendingSym,  setPendingSym]  = useState("inf");
  const [rulerStart,  setRulerStart]  = useState<Pt | null>(null);
  const [mapImg,      setMapImg]      = useState<HTMLImageElement | null>(null);
  const [mapImgLoaded,setMapImgLoaded]= useState(false);
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  // Op linking
  const [showOpLink,  setShowOpLink]  = useState(false);
  const [ops,         setOps]         = useState<any[]>([]);
  const [linkedOpId,  setLinkedOpId]  = useState<string | null>(null);
  const [cmdNote,     setCmdNote]     = useState("");
  const [showNotes,   setShowNotes]   = useState(false);

  // ── Drawing refs (never cause re-render) ─────────────────────────────────
  const isPanning      = useRef(false);
  const panAnchor      = useRef<{ ox:number; oy:number; mx:number; my:number } | null>(null);
  const isDrawing      = useRef(false);
  const drawPath       = useRef<Pt[]>([]);
  const drawStart      = useRef<Pt | null>(null);
  const dragId         = useRef<string | null>(null);
  const dragPrev       = useRef<Pt | null>(null);
  // Live preview element
  const [preview, setPreview] = useState<PlanElement | null>(null);

  const gameMap = useMemo(() => GAME_MAPS.find(m => m.id === mapId) ?? GAME_MAPS[0], [mapId]);

  // ── Canvas resize observer ───────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const e = entries[0];
      if (e) setCanvasSize({ w: Math.floor(e.contentRect.width), h: Math.floor(e.contentRect.height) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Fit map when map/size changes ────────────────────────────────────────
  useEffect(() => {
    // Map canvas units: 1 km = 1000 units (metres)
    const mapU = gameMap.mapSizeKm * 1000;
    const sc = Math.min(canvasSize.w, canvasSize.h) / mapU * 0.85;
    setView({
      ox: (canvasSize.w - mapU * sc) / 2,
      oy: (canvasSize.h - mapU * sc) / 2,
      scale: sc,
      rotation: 0,
    });
  }, [mapId, canvasSize.w, canvasSize.h, gameMap.mapSizeKm]);

  // ── Load map image ───────────────────────────────────────────────────────
  useEffect(() => {
    setMapImgLoaded(false);
    setMapImg(null);

    const url = mapId === "custom" ? customBgUrl : gameMap.imageUrl;
    if (!url) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => { setMapImg(img); setMapImgLoaded(true); };
    img.onerror = () => { setMapImg(null); setMapImgLoaded(false); };
    img.src = url;
  }, [mapId, gameMap.imageUrl, customBgUrl]);

  // ── Load ops for linking ─────────────────────────────────────────────────
  useEffect(() => {
    if (!group?.id || !showOpLink) return;
    apiFetch(`/api/milsim-ops?groupId=${group.id}`)
      .then((d: any) => setOps(d?.ops ?? d ?? []))
      .catch(() => {});
  }, [group?.id, showOpLink]);

  // ── Coordinate transform helpers ─────────────────────────────────────────
  const screenToCanvas = useCallback((sx: number, sy: number): Pt => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // Account for rotation: rotate point around canvas centre into map space
    const cx = canvasSize.w / 2;
    const cy = canvasSize.h / 2;
    const dx = (sx - rect.left) - cx;
    const dy = (sy - rect.top)  - cy;
    const cos = Math.cos(view.rotation);
    const sin = Math.sin(view.rotation);
    const rx = dx * cos + dy * sin;
    const ry = -dx * sin + dy * cos;
    return {
      x: (rx + cx - view.ox) / view.scale,
      y: (ry + cy - view.oy) / view.scale,
    };
  }, [view, canvasSize]);

  const getEvtPt = useCallback((e: React.MouseEvent): Pt =>
    screenToCanvas(e.clientX, e.clientY), [screenToCanvas]);

  // ── Hit test ─────────────────────────────────────────────────────────────
  const hitTest = useCallback((cp: Pt): PlanElement | null => {
    const thr = 28 / view.scale;
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if ((el.type === "marker" || el.type === "ruler") && el.x != null && el.y != null) {
        if (Math.abs(cp.x - el.x!) < thr && Math.abs(cp.y - el.y!) < thr) return el;
      }
    }
    return null;
  }, [elements, view.scale]);

  // ── Render ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = canvasSize;
    const mapU = gameMap.mapSizeKm * 1000;
    const invSc = 1 / view.scale;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0c0e";
    ctx.fillRect(0, 0, w, h);

    // Apply rotation around canvas centre
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-view.rotation);
    ctx.translate(-w / 2, -h / 2);

    // Pan+zoom transform
    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);

    // ── Map background ───────────────────────────────────────────────────
    ctx.fillStyle = gameMap.bgColor;
    ctx.fillRect(0, 0, mapU, mapU);

    // Draw loaded map image stretched to fill map area
    if (mapImg && mapImgLoaded) {
      ctx.globalAlpha = 0.92;
      ctx.drawImage(mapImg, 0, 0, mapU, mapU);
      ctx.globalAlpha = 1;
    } else if (gameMap.imageUrl || (mapId === "custom" && customBgUrl)) {
      // Loading state — checkerboard pattern
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      const cs = 80;
      for (let ix = 0; ix < mapU; ix += cs)
        for (let iy = 0; iy < mapU; iy += cs)
          if (((ix/cs)+(iy/cs))%2===0) ctx.fillRect(ix, iy, cs, cs);
      // "Loading" text
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = `bold ${40*invSc}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Loading map…", mapU/2, mapU/2);
    }

    // Map border
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2 * invSc;
    ctx.strokeRect(0, 0, mapU, mapU);

    // ── Elements ─────────────────────────────────────────────────────────
    const allEls = preview ? [...elements, preview] : elements;

    for (const el of allEls) {
      const sel = el.id === selectedId;
      ctx.save();
      ctx.strokeStyle = el.color;
      ctx.fillStyle   = el.color;
      ctx.lineWidth   = el.lw * invSc;
      ctx.setLineDash(el.dashed ? [8*invSc, 4*invSc] : []);
      if (sel) { ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 8*invSc; }

      if (el.type === "draw" && el.points && el.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (const p of el.points.slice(1)) ctx.lineTo(p.x, p.y);
        ctx.lineJoin = "round";
        ctx.lineCap  = "round";
        ctx.stroke();
      }

      if ((el.type === "line" || el.type === "arrow") && el.points?.length === 2) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        ctx.lineTo(el.points[1].x, el.points[1].y);
        ctx.stroke();
        if (el.type === "arrow") {
          ctx.setLineDash([]);
          drawArrowHead(ctx, el.points[0], el.points[1], 14*invSc);
        }
        if (el.label) {
          const mx = (el.points[0].x + el.points[1].x)/2;
          const my = (el.points[0].y + el.points[1].y)/2;
          ctx.setLineDash([]);
          ctx.font = `bold ${11*invSc}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(el.label, mx, my - 4*invSc);
        }
      }

      if (el.type === "rect" && el.x != null) {
        ctx.strokeRect(el.x!, el.y!, el.w!, el.h!);
      }

      if (el.type === "circle" && el.x != null) {
        ctx.beginPath();
        ctx.arc(el.x!, el.y!, el.r!, 0, Math.PI*2);
        ctx.stroke();
      }

      if (el.type === "ruler" && el.points?.length === 2) {
        ctx.setLineDash([6*invSc, 3*invSc]);
        ctx.strokeStyle = "#ffcc44";
        ctx.lineWidth = 1.5*invSc;
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        ctx.lineTo(el.points[1].x, el.points[1].y);
        ctx.stroke();
        for (const p of el.points) {
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4*invSc, 0, Math.PI*2);
          ctx.fillStyle = "#ffcc44";
          ctx.fill();
        }
        if (el.label) {
          const mx=(el.points[0].x+el.points[1].x)/2;
          const my=(el.points[0].y+el.points[1].y)/2;
          ctx.setLineDash([]);
          ctx.font = `bold ${11*invSc}px Arial`;
          ctx.fillStyle="#ffcc44";
          ctx.textAlign="center";
          ctx.textBaseline="bottom";
          ctx.fillText(el.label, mx, my - 6*invSc);
        }
      }

      if (el.type === "marker" && el.symbol) {
        const sym = NATO_SYMS.find(s => s.key === el.symbol);
        if (sym) {
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;
          drawNatoMarker(ctx, sym, el.x!, el.y!, el.label ?? "", sel, invSc);
        }
      }

      ctx.restore();
    }

    ctx.restore(); // pan+zoom

    // ── Grid (in rotated screen space, before un-rotating) ───────────────
    if (showGrid) drawGrid(ctx, view, w, h, gameMap.gridSize);

    ctx.restore(); // rotation

    // ── Compass (always screen-space, fixed position) ────────────────────
    if (showCompass) {
      drawFullCompass(ctx, w - 68, h - 68, 55, view.rotation);
    }

    // Attribution
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.font = "9px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(gameMap.attribution, w - 8, h - 4);

  }, [elements, preview, view, showGrid, showCompass, canvasSize, gameMap, selectedId, mapImg, mapImgLoaded, mapId, customBgUrl]);

  // ── Pointer down ─────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const cp = getEvtPt(e);

    if (tool === "pan") {
      isPanning.current = true;
      panAnchor.current = { ox: view.ox, oy: view.oy, mx: e.clientX, my: e.clientY };
      return;
    }

    if (tool === "select") {
      const hit = hitTest(cp);
      if (hit) {
        setSelectedId(hit.id);
        dragId.current   = hit.id;
        dragPrev.current = cp;
      } else {
        setSelectedId(null);
        dragId.current = null;
      }
      return;
    }

    if (tool === "ruler") {
      if (!rulerStart) {
        setRulerStart(cp);
      } else {
        const d = dist(rulerStart, cp);
        const m = d; // 1 unit = 1 metre
        const lbl = m >= 1000 ? `${(m/1000).toFixed(2)} km` : `${Math.round(m)} m`;
        setElements(prev => [...prev, {
          id: uid(), type:"ruler",
          points: [rulerStart, cp],
          x: (rulerStart.x+cp.x)/2, y:(rulerStart.y+cp.y)/2,
          color:"#ffcc44", lw:1.5, label:lbl,
        }]);
        setRulerStart(null);
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
  }, [tool, view, getEvtPt, hitTest, rulerStart, pendingSym]);

  // ── Pointer move ─────────────────────────────────────────────────────────
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    // Pan
    if (tool === "pan" && isPanning.current && panAnchor.current) {
      const dx = e.clientX - panAnchor.current.mx;
      const dy = e.clientY - panAnchor.current.my;
      setView(v => ({ ...v, ox: panAnchor.current!.ox + dx, oy: panAnchor.current!.oy + dy }));
      return;
    }

    // Drag marker
    if (tool === "select" && dragId.current && dragPrev.current) {
      const cp  = getEvtPt(e);
      const dx  = cp.x - dragPrev.current.x;
      const dy  = cp.y - dragPrev.current.y;
      dragPrev.current = cp;
      setElements(prev => prev.map(el =>
        el.id === dragId.current
          ? { ...el, x: (el.x ?? 0) + dx, y: (el.y ?? 0) + dy,
              points: el.points?.map(p => ({ x: p.x + dx, y: p.y + dy })) }
          : el
      ));
      return;
    }

    if (!isDrawing.current || !drawStart.current) return;
    const cp = getEvtPt(e);

    if (tool === "draw") {
      drawPath.current.push(cp);
      setPreview({
        id: "__prev__", type: "draw",
        points: [...drawPath.current],
        color, lw, dashed,
      });
      return;
    }

    // Shape previews
    if (tool === "line" || tool === "arrow") {
      setPreview({ id:"__prev__", type:tool, points:[drawStart.current, cp], color, lw, dashed });
    }
    if (tool === "rect") {
      const x = Math.min(drawStart.current.x, cp.x);
      const y = Math.min(drawStart.current.y, cp.y);
      setPreview({ id:"__prev__", type:"rect", x, y, w:Math.abs(cp.x-drawStart.current.x), h:Math.abs(cp.y-drawStart.current.y), color, lw, dashed });
    }
    if (tool === "circle") {
      setPreview({ id:"__prev__", type:"circle", x:drawStart.current.x, y:drawStart.current.y, r:dist(drawStart.current,cp), color, lw, dashed });
    }
  }, [tool, getEvtPt, color, lw, dashed]);

  // ── Pointer up ───────────────────────────────────────────────────────────
  const onMouseUp = useCallback((e: React.MouseEvent) => {
    isPanning.current = false;
    panAnchor.current = null;
    dragId.current    = null;
    dragPrev.current  = null;

    if (!isDrawing.current) return;
    isDrawing.current = false;
    setPreview(null);

    const cp = getEvtPt(e);
    const start = drawStart.current;
    if (!start) return;

    if (tool === "draw") {
      if (drawPath.current.length >= 2) {
        setElements(prev => [...prev, {
          id: uid(), type:"draw",
          points: [...drawPath.current],
          color, lw, dashed,
        }]);
      }
      drawPath.current = [];
      drawStart.current = null;
      return;
    }

    if (tool === "line" || tool === "arrow") {
      if (dist(start, cp) < 4 / view.scale) return;
      setElements(prev => [...prev, { id:uid(), type:tool, points:[start,cp], color, lw, dashed, label:"" }]);
    }
    if (tool === "rect") {
      const w = Math.abs(cp.x - start.x); const h = Math.abs(cp.y - start.y);
      if (w < 4/view.scale || h < 4/view.scale) return;
      setElements(prev => [...prev, { id:uid(), type:"rect", x:Math.min(start.x,cp.x), y:Math.min(start.y,cp.y), w, h, color, lw, dashed }]);
    }
    if (tool === "circle") {
      const r = dist(start, cp);
      if (r < 4/view.scale) return;
      setElements(prev => [...prev, { id:uid(), type:"circle", x:start.x, y:start.y, r, color, lw, dashed }]);
    }
    drawStart.current = null;
  }, [tool, getEvtPt, view.scale, color, lw, dashed]);

  // ── Wheel zoom ───────────────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1/1.12;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setView(v => {
      const ns = Math.max(0.05, Math.min(25, v.scale * factor));
      const ratio = ns / v.scale;
      return { ...v, scale: ns, ox: mx - (mx - v.ox)*ratio, oy: my - (my - v.oy)*ratio };
    });
  }, []);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        setElements(p => p.filter(el => el.id !== selectedId));
        setSelectedId(null);
      }
      if (e.key === "Escape") { setSelectedId(null); setRulerStart(null); setLabelPrompt(null); }
      const map: Record<string, ToolMode> = { v:"select", p:"pan", d:"draw", l:"line", a:"arrow", r:"ruler", m:"marker" };
      if (map[e.key]) setTool(map[e.key]);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [selectedId]);

  // ── Export PNG ───────────────────────────────────────────────────────────
  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `tacplan_${group?.name ?? "map"}_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const savePlan = () => {
    const data = JSON.stringify({
      v:2, mapId, elements: elements.filter(e=>e.id!=="__prev__"),
      linkedOpId, cmdNote,
    });
    onSave?.(data);
    showMsg(true, "Plan saved.");
  };

  // ── Place marker confirm ─────────────────────────────────────────────────
  const confirmMarker = () => {
    if (!labelPrompt) return;
    const sym = NATO_SYMS.find(s => s.key === labelPrompt.symKey) ?? NATO_SYMS[0];
    setElements(prev => [...prev, {
      id:uid(), type:"marker",
      x: labelPrompt.cp.x, y: labelPrompt.cp.y,
      symbol: labelPrompt.symKey,
      color: SYM_COLOR[sym.cat],
      lw:2, label:labelText,
    }]);
    setLabelPrompt(null);
    setLabelText("");
  };

  // ── Rotation controls ────────────────────────────────────────────────────
  const rotateMap = (delta: number) => setView(v => ({ ...v, rotation: v.rotation + delta }));

  // ── Custom upload ────────────────────────────────────────────────────────
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomBgUrl(url);
    setMapId("custom");
    setShowMapPicker(false);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const gameGroups = useMemo(() => {
    const out: Record<string, GameMap[]> = {};
    for (const m of GAME_MAPS) { if (!out[m.game]) out[m.game]=[]; out[m.game].push(m); }
    return out;
  }, []);

  const btnCls = (active: boolean, danger = false) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-display font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
      danger  ? "border-red-500/40 text-red-400 hover:bg-red-500/10" :
      active  ? "bg-primary/20 border-primary/60 text-primary" :
                "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
    }`;

  const TOOLS: { id:ToolMode; label:string; icon:React.ReactNode; k:string }[] = [
    { id:"select", label:"Select",    icon:<MousePointer2 className="w-3.5 h-3.5"/>, k:"V" },
    { id:"pan",    label:"Pan",       icon:<Move          className="w-3.5 h-3.5"/>, k:"P" },
    { id:"draw",   label:"Pen",       icon:<Pencil        className="w-3.5 h-3.5"/>, k:"D" },
    { id:"line",   label:"Line",      icon:<svg width="14" height="14" viewBox="0 0 14 14"><line x1="2" y1="12" x2="12" y2="2" stroke="currentColor" strokeWidth="2"/></svg>, k:"L" },
    { id:"arrow",  label:"Arrow",     icon:<ArrowRight    className="w-3.5 h-3.5"/>, k:"A" },
    { id:"rect",   label:"Rect",      icon:<Square        className="w-3.5 h-3.5"/>, k:"" },
    { id:"circle", label:"Circle",    icon:<Circle        className="w-3.5 h-3.5"/>, k:"" },
    { id:"ruler",  label:"Ruler",     icon:<Ruler         className="w-3.5 h-3.5"/>, k:"R" },
    { id:"marker", label:"Marker",    icon:<Target        className="w-3.5 h-3.5"/>, k:"M" },
  ];

  const linkedOp = ops.find(o => o.id === linkedOpId);

  return (
    <div className="flex flex-col" style={{ height:"calc(100vh - 260px)", minHeight:580, userSelect:"none" }}>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-border bg-card">

        {/* Map picker */}
        <div className="relative">
          <button onClick={()=>setShowMapPicker(p=>!p)} className={btnCls(false)}>
            <Map className="w-3.5 h-3.5"/>
            {gameMap.game} — {gameMap.name}
            <ChevronDown className="w-3 h-3 opacity-60"/>
          </button>
          {showMapPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-2xl p-3 w-72 max-h-80 overflow-y-auto">
              {Object.entries(gameGroups).map(([game, maps]) => (
                <div key={game} className="mb-3">
                  <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">{game}</p>
                  <div className="space-y-0.5">
                    {maps.filter(m=>m.id!=="custom").map(m => (
                      <button key={m.id} onClick={()=>{setMapId(m.id);setShowMapPicker(false);}}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-left transition-all ${
                          m.id===mapId?"bg-primary/15 text-primary border border-primary/40":"text-foreground hover:bg-secondary/50 border border-transparent"
                        }`}>
                        <div className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{background:m.previewColor}}/>
                        {m.name}
                        {m.imageUrl && <span className="ml-auto text-[9px] text-green-400 font-mono">LIVE MAP</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="border-t border-border pt-2">
                <label className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded border border-dashed border-border hover:border-primary/40 text-xs text-muted-foreground hover:text-foreground transition-all">
                  <Layers className="w-3.5 h-3.5"/>
                  Upload custom map image
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload}/>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-border"/>

        {/* Tools */}
        {TOOLS.map(t => (
          <button key={t.id} onClick={()=>setTool(t.id)} className={btnCls(tool===t.id)}
            title={`${t.label}${t.k?` (${t.k})`:""}`}>
            {t.icon}
            <span className="hidden lg:inline">{t.label}</span>
          </button>
        ))}

        {/* Symbol picker */}
        <div className="relative">
          <button onClick={()=>setShowSymPicker(p=>!p)} className={btnCls(showSymPicker||tool==="marker")}>
            <Flag className="w-3.5 h-3.5"/>
            <span className="hidden lg:inline">Symbols</span>
          </button>
          {showSymPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-2xl p-3 w-72">
              {(["friendly","enemy","control"] as const).map(cat => (
                <div key={cat} className="mb-3 last:mb-0">
                  <p className={`text-[10px] font-display font-bold uppercase tracking-widest mb-1.5 ${
                    cat==="enemy"?"text-red-400":cat==="control"?"text-yellow-400":"text-blue-400"
                  }`}>{cat}</p>
                  <div className="grid grid-cols-5 gap-1">
                    {NATO_SYMS.filter(s=>s.cat===cat).map(sym=>(
                      <button key={sym.key}
                        onClick={()=>{setPendingSym(sym.key);setTool("marker");setShowSymPicker(false);}}
                        className={`flex flex-col items-center gap-0.5 p-1.5 rounded border transition-all ${
                          pendingSym===sym.key&&tool==="marker"?"border-primary/60 bg-primary/15":"border-border hover:bg-secondary/50"
                        }`} title={sym.label}>
                        <span style={{color:SYM_COLOR[cat],fontFamily:"monospace",fontSize:13,fontWeight:"bold"}}>{sym.shape}</span>
                        <span className="text-[8px] text-muted-foreground">{sym.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-border"/>

        {/* Colour swatches */}
        <div className="flex items-center gap-0.5">
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setColor(c)}
              style={{background:c,width:15,height:15,borderRadius:3,
                border:color===c?"2px solid white":"1px solid rgba(255,255,255,0.2)",flexShrink:0}}/>
          ))}
        </div>

        {/* Line width */}
        {[1,2,4,6].map(w=>(
          <button key={w} onClick={()=>setLw(w)}
            className={`w-6 h-6 flex items-center justify-center rounded border transition-all flex-shrink-0 ${
              lw===w?"border-primary/60 bg-primary/15":"border-border hover:bg-secondary/50"
            }`}>
            <div style={{width:Math.min(14,w*2.5),height:w,background:"white",borderRadius:99}}/>
          </button>
        ))}

        {/* Dashed */}
        <button onClick={()=>setDashed(d=>!d)} className={btnCls(dashed)} title="Dashed">
          <span className="font-mono tracking-widest text-sm">- -</span>
        </button>

        <div className="w-px h-5 bg-border"/>

        {/* Map rotation */}
        <button onClick={()=>rotateMap(-Math.PI/16)} className={btnCls(false)} title="Rotate CCW">
          <RotateCcw className="w-3.5 h-3.5"/>
        </button>
        <span className="text-[10px] text-muted-foreground font-mono w-10 text-center">
          {Math.round(((view.rotation*180/Math.PI)%360+360)%360)}°
        </span>
        <button onClick={()=>rotateMap(Math.PI/16)} className={btnCls(false)} title="Rotate CW">
          <RotateCw className="w-3.5 h-3.5"/>
        </button>
        <button onClick={()=>setView(v=>({...v,rotation:0}))} className={btnCls(false)} title="Reset rotation">
          <Compass className="w-3.5 h-3.5"/>
        </button>

        <div className="w-px h-5 bg-border"/>

        {/* View toggles */}
        <button onClick={()=>setShowGrid(g=>!g)} className={btnCls(showGrid)} title="Grid">
          <Layers className="w-3.5 h-3.5"/>
        </button>
        <button onClick={()=>setShowCompass(c=>!c)} className={btnCls(showCompass)} title="Compass">
          <Compass className="w-3.5 h-3.5"/>
        </button>

        {/* Zoom */}
        <button onClick={()=>setView(v=>({...v,scale:Math.max(0.05,v.scale/1.25)}))} className={btnCls(false)}><Minus className="w-3.5 h-3.5"/></button>
        <span className="text-[10px] text-muted-foreground font-mono w-9 text-center">{Math.round(view.scale*100)}%</span>
        <button onClick={()=>setView(v=>({...v,scale:Math.min(25,v.scale*1.25)}))} className={btnCls(false)}><Plus className="w-3.5 h-3.5"/></button>
        <button onClick={()=>setView(v=>({...v,scale:1,ox:0,oy:0,rotation:0}))} className={btnCls(false)} title="Reset view"><RotateCcw className="w-3.5 h-3.5"/></button>

        <div className="w-px h-5 bg-border"/>

        {/* Op link */}
        <button onClick={()=>setShowOpLink(p=>!p)} className={btnCls(!!linkedOpId)} title="Link to Op">
          <Link className="w-3.5 h-3.5"/>
          <span className="hidden lg:inline">{linkedOp ? linkedOp.name : "Link Op"}</span>
        </button>

        {/* Commander notes */}
        <button onClick={()=>setShowNotes(p=>!p)} className={btnCls(showNotes)} title="Commander Notes">
          <MessageSquare className="w-3.5 h-3.5"/>
          <span className="hidden lg:inline">Notes</span>
        </button>

        {/* Delete selected */}
        {selectedId && (
          <button onClick={()=>{setElements(p=>p.filter(e=>e.id!==selectedId));setSelectedId(null);}}
            className={btnCls(false,true)} title="Delete selected (Del)">
            <Trash2 className="w-3.5 h-3.5"/>Del
          </button>
        )}

        {/* Clear all */}
        <button onClick={()=>{if(window.confirm("Clear all markings?"))setElements([]);}} className={btnCls(false)} title="Clear all">
          <X className="w-3.5 h-3.5"/>
        </button>

        {/* Export */}
        <button onClick={exportPng} className={btnCls(false)}><Download className="w-3.5 h-3.5"/><span className="hidden lg:inline">Export</span></button>

        {/* Save */}
        <button onClick={savePlan} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/15 border border-primary/50 text-primary hover:bg-primary/25 transition-all text-xs font-display font-bold uppercase tracking-wider whitespace-nowrap">
          <Save className="w-3.5 h-3.5"/>Save
        </button>
      </div>

      {/* ── Op link panel ────────────────────────────────────────────────── */}
      {showOpLink && (
        <div className="border-b border-border bg-card/50 px-4 py-3">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Link to Operation</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={()=>setLinkedOpId(null)}
              className={`px-2.5 py-1 rounded border text-xs transition-all ${!linkedOpId?"bg-primary/15 border-primary/50 text-primary":"border-border text-muted-foreground hover:bg-secondary/50"}`}>
              None
            </button>
            {ops.length === 0 && <span className="text-xs text-muted-foreground">No ops found for this group</span>}
            {ops.map(op=>(
              <button key={op.id} onClick={()=>{setLinkedOpId(op.id);setShowOpLink(false);}}
                className={`px-2.5 py-1 rounded border text-xs transition-all ${linkedOpId===op.id?"bg-primary/15 border-primary/50 text-primary":"border-border text-muted-foreground hover:bg-secondary/50"}`}>
                {op.name}
              </button>
            ))}
          </div>
          {linkedOp && (
            <p className="text-xs text-primary mt-2 flex items-center gap-1.5">
              <Link className="w-3 h-3"/> Linked to: <strong>{linkedOp.name}</strong>
            </p>
          )}
        </div>
      )}

      {/* ── Commander notes ───────────────────────────────────────────────── */}
      {showNotes && (
        <div className="border-b border-border bg-card/50 px-4 py-3">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Commander\'s Notes</p>
          <textarea
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans text-foreground resize-none"
            rows={3}
            placeholder="Add pre-deployment briefing notes, intentions, ROE, etc..."
            value={cmdNote}
            onChange={e=>setCmdNote(e.target.value)}
          />
        </div>
      )}

      {/* ── Canvas ───────────────────────────────────────────────────────── */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#0a0c0e]"
        style={{ cursor: tool==="pan" ? (isPanning.current?"grabbing":"grab") : tool==="select" ? "default" : "crosshair" }}>
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          style={{ display:"block", width:"100%", height:"100%", imageRendering:"pixelated" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={()=>{ isPanning.current=false; isDrawing.current=false; dragId.current=null; setPreview(null); }}
          onWheel={onWheel}
        />

        {/* Ruler hint */}
        {tool==="ruler" && rulerStart && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-card border border-yellow-500/40 rounded text-xs text-yellow-400 font-display font-bold uppercase tracking-wider pointer-events-none">
            Click second point to measure
          </div>
        )}

        {/* Ruler first point indicator */}
        {tool==="ruler" && !rulerStart && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-card border border-border rounded text-xs text-muted-foreground font-display font-bold uppercase tracking-wider pointer-events-none">
            Click start point
          </div>
        )}

        {/* Hint bar */}
        <div className="absolute bottom-2 right-20 flex items-center gap-3 text-[9px] text-muted-foreground font-sans pointer-events-none">
          <span>Scroll=zoom</span><span>Del=delete</span><span>Esc=deselect</span>
        </div>

        {/* Linked op badge */}
        {linkedOp && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-card/80 border border-primary/40 rounded text-xs text-primary font-display font-bold uppercase tracking-wider">
            <Link className="w-3 h-3"/> {linkedOp.name}
          </div>
        )}
      </div>

      {/* ── Marker label modal ────────────────────────────────────────────── */}
      {labelPrompt && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50" style={{position:"fixed"}}>
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
              value={labelText}
              onChange={e=>setLabelText(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")confirmMarker();if(e.key==="Escape"){setLabelPrompt(null);setLabelText("");}}}
            />
            <div className="flex gap-2">
              <button onClick={confirmMarker}
                className="flex-1 flex items-center justify-center gap-1.5 bg-primary/15 border border-primary/50 text-primary rounded px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wider hover:bg-primary/25 transition-all">
                <Check className="w-3.5 h-3.5"/>Place
              </button>
              <button onClick={()=>{setLabelPrompt(null);setLabelText("");}}
                className="px-3 py-1.5 border border-border rounded text-muted-foreground text-xs font-display font-bold uppercase tracking-wider hover:text-foreground transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
