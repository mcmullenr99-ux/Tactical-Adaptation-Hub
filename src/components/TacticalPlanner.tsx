/**
 * TacticalPlanner v3
 *
 * Architecture:
 *   - <iframe>  : Live interactive map from atlas.plan-ops.fr / squadmaps.com
 *                 sits BELOW as the real map source, user can pan/zoom it normally
 *   - <canvas>  : Transparent overlay — drawing tools, NATO markers, ruler
 *                 sits ABOVE with pointer-events toggled based on active tool
 *
 * When tool = "pan" or "select" (no drawing) → canvas is pointer-events:none
 *   → clicks pass through to iframe → user pans/zooms the real map
 * When tool = draw/line/arrow/etc → canvas captures pointer events → draw on top
 */

import React, {
  useRef, useState, useEffect, useCallback, useMemo,
} from "react";
import {
  Map, Pencil, MousePointer2, Move, Minus, Plus, RotateCcw,
  Trash2, Download, Save, Layers, Compass, Ruler,
  Circle, Square, ArrowRight, ChevronDown, Target, Flag,
  Check, X, Link, MessageSquare, RotateCw, ExternalLink,
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
  iframeUrl: string | null;   // live interactive URL
  fallbackColor: string;
  previewColor: string;
  attribution: string;
  openUrl: string;            // link to open in new tab
}

const GAME_MAPS: GameMap[] = [
  // ── Arma 3 Vanilla ────────────────────────────────────────────────────────
  { id:"a3_altis",    game:"Arma 3 — Vanilla",  name:"Altis",
    iframeUrl:"https://atlas.plan-ops.fr/maps/arma3/altis/150",
    fallbackColor:"#2d3a2e", previewColor:"#4a7c59",
    attribution:"© Bohemia Interactive / PLANOPS Atlas",
    openUrl:"https://atlas.plan-ops.fr/maps/arma3/altis/150" },

  { id:"a3_stratis",  game:"Arma 3 — Vanilla",  name:"Stratis",
    iframeUrl:"https://atlas.plan-ops.fr/maps/arma3/stratis/150",
    fallbackColor:"#2d3a2e", previewColor:"#5a8c6a",
    attribution:"© Bohemia Interactive / PLANOPS Atlas",
    openUrl:"https://atlas.plan-ops.fr/maps/arma3/stratis/150" },

  { id:"a3_malden",   game:"Arma 3 — Vanilla",  name:"Malden",
    iframeUrl:"https://atlas.plan-ops.fr/maps/arma3/malden/150",
    fallbackColor:"#2d3a2e", previewColor:"#6a9c7a",
    attribution:"© Bohemia Interactive / PLANOPS Atlas",
    openUrl:"https://atlas.plan-ops.fr/maps/arma3/malden/150" },

  { id:"a3_tanoa",    game:"Arma 3 — Vanilla",  name:"Tanoa",
    iframeUrl:"https://atlas.plan-ops.fr/maps/arma3/tanoa/150",
    fallbackColor:"#1a3a2a", previewColor:"#3a7a5a",
    attribution:"© Bohemia Interactive / PLANOPS Atlas",
    openUrl:"https://atlas.plan-ops.fr/maps/arma3/tanoa/150" },

  // ── Arma 3 Top Modded ─────────────────────────────────────────────────────
  { id:"a3_chernarus",     game:"Arma 3 — Modded", name:"Chernarus (Summer)",
    iframeUrl:"https://atlas.plan-ops.fr/maps/arma3/chernarus/150",
    fallbackColor:"#263326", previewColor:"#4a7a55",
    attribution:"© Bohemia Interactive / PLANOPS Atlas",
    openUrl:"https://atlas.plan-ops.fr/maps/arma3/chernarus/150" },

  { id:"a3_takistan",      game:"Arma 3 — Modded", name:"Takistan",
    iframeUrl:"https://atlas.plan-ops.fr/maps/arma3/takistan/150",
    fallbackColor:"#3a3020", previewColor:"#7a7040",
    attribution:"© Bohemia Interactive / PLANOPS Atlas",
    openUrl:"https://atlas.plan-ops.fr/maps/arma3/takistan/150" },

  { id:"a3_lingor",        game:"Arma 3 — Modded", name:"Lingor",
    iframeUrl:"https://atlas.plan-ops.fr/maps/arma3/lingor/150",
    fallbackColor:"#1a3020", previewColor:"#3a6a40",
    attribution:"© IceBreakr / PLANOPS Atlas",
    openUrl:"https://atlas.plan-ops.fr/maps/arma3/lingor/150" },

  { id:"a3_fallujah",      game:"Arma 3 — Modded", name:"Fallujah",
    iframeUrl:"https://atlas.plan-ops.fr/maps/arma3/fallujah/150",
    fallbackColor:"#3a2a10", previewColor:"#8a7040",
    attribution:"© Shezan74 / PLANOPS Atlas",
    openUrl:"https://atlas.plan-ops.fr/maps/arma3/fallujah/150" },

  { id:"a3_lythium",       game:"Arma 3 — Modded", name:"Lythium",
    iframeUrl:"https://atlas.plan-ops.fr/maps/arma3/lythium/150",
    fallbackColor:"#2a2010", previewColor:"#7a6030",
    attribution:"© Jakerod / PLANOPS Atlas",
    openUrl:"https://atlas.plan-ops.fr/maps/arma3/lythium/150" },

  // ── Squad ── squadmaps.com ─────────────────────────────────────────────────
  { id:"sq_all",           game:"Squad", name:"All Maps (squadmaps.com)",
    iframeUrl:"https://squadmaps.com/",
    fallbackColor:"#2a2a1e", previewColor:"#6a7a3a",
    attribution:"© Offworld Industries / squadmaps.com",
    openUrl:"https://squadmaps.com/" },

  // ── Custom ────────────────────────────────────────────────────────────────
  { id:"custom",           game:"Custom", name:"Upload Image",
    iframeUrl:null, fallbackColor:"#1a1a1a", previewColor:"#444",
    attribution:"", openUrl:"" },
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

// ─── ACE3-style full compass ───────────────────────────────────────────────────

function drawFullCompass(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  mapRot: number,
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Outer ring
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2);
  ctx.fillStyle = "rgba(4,7,12,0.90)"; ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1.5; ctx.stroke();

  // Inner ring
  ctx.beginPath(); ctx.arc(0, 0, r*0.88, 0, Math.PI*2);
  ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 1; ctx.stroke();

  ctx.rotate(-mapRot);

  // Tick marks
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

    // Degree numbers every 45°
    if (isMajor && deg % 90 !== 0) {
      ctx.save();
      const tx = Math.sin(rad) * r * 0.44;
      const ty = -Math.cos(rad) * r * 0.44;
      ctx.translate(tx, ty);
      ctx.rotate(mapRot);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = `bold ${r*0.14}px Arial`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(deg), 0, 0);
      ctx.restore();
    }
  }

  // Cardinal + intercardinal labels
  const dirs = [
    { l:"N", d:0,   c:"#ff3333", sz:r*0.26 },
    { l:"NE",d:45,  c:"#cccccc", sz:r*0.15 },
    { l:"E", d:90,  c:"#dddddd", sz:r*0.20 },
    { l:"SE",d:135, c:"#cccccc", sz:r*0.15 },
    { l:"S", d:180, c:"#dddddd", sz:r*0.20 },
    { l:"SW",d:225, c:"#cccccc", sz:r*0.15 },
    { l:"W", d:270, c:"#dddddd", sz:r*0.20 },
    { l:"NW",d:315, c:"#cccccc", sz:r*0.15 },
  ];
  for (const d of dirs) {
    const rad = d.d * Math.PI / 180;
    const tx = Math.sin(rad) * r * 0.38;
    const ty = -Math.cos(rad) * r * 0.38;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(mapRot);
    ctx.fillStyle = d.c;
    ctx.font = `bold ${d.sz}px Arial`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(d.l, 0, 0);
    ctx.restore();
  }

  ctx.rotate(mapRot); // undo for needle

  // North needle
  const nh = r*0.40, nw = r*0.12;
  ctx.save();
  ctx.rotate(-mapRot);

  // Red north
  ctx.beginPath();
  ctx.moveTo(0, -nh); ctx.lineTo(-nw, 0); ctx.lineTo(nw, 0); ctx.closePath();
  ctx.fillStyle = "#ff3333"; ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 0.5; ctx.stroke();

  // White south
  ctx.beginPath();
  ctx.moveTo(0, nh); ctx.lineTo(-nw, 0); ctx.lineTo(nw, 0); ctx.closePath();
  ctx.fillStyle = "#eeeeee"; ctx.fill();
  ctx.stroke();

  // Centre pin
  ctx.beginPath(); ctx.arc(0, 0, r*0.07, 0, Math.PI*2);
  ctx.fillStyle = "#111"; ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();

  // Bearing readout box
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

function drawGrid(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
) {
  // Fixed screen-space grid — 60px per cell
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

  // Grid labels
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
  const [mapRotation, setMapRotation] = useState(0);
  const [canvasSize,  setCanvasSize]  = useState({ w: 900, h: 560 });
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
  const [iframeBlocked,  setIframeBlocked]  = useState(false);
  const [preview,        setPreview]        = useState<PlanElement | null>(null);

  // Drawing refs
  const isPanning  = useRef(false);
  const panAnchor  = useRef<{ ox:number; oy:number; mx:number; my:number } | null>(null);
  const isDrawing  = useRef(false);
  const drawPath   = useRef<Pt[]>([]);
  const drawStart  = useRef<Pt | null>(null);
  const dragId     = useRef<string | null>(null);
  const dragPrev   = useRef<Pt | null>(null);

  const gameMap = useMemo(() => GAME_MAPS.find(m => m.id === mapId) ?? GAME_MAPS[0], [mapId]);

  // Canvas passthrough — when pan or nothing drawing, let iframe handle mouse
  const canvasCapture = !["pan"].includes(tool);

  // Resize observer
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

  // Load ops
  useEffect(() => {
    if (!group?.id || !showOpLink) return;
    apiFetch(`/api/milsim-ops?groupId=${group.id}`)
      .then((d: any) => setOps(Array.isArray(d) ? d : d?.ops ?? []))
      .catch(() => {});
  }, [group?.id, showOpLink]);

  // Canvas coordinate (raw screen → canvas pixels)
  const getEvtPt = useCallback((e: React.MouseEvent): Pt => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  // Hit test
  const hitTest = useCallback((cp: Pt): PlanElement | null => {
    const thr = 28;
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if ((el.type === "marker" || el.type === "ruler") && el.x != null && el.y != null) {
        if (Math.abs(cp.x - el.x!) < thr && Math.abs(cp.y - el.y!) < thr) return el;
      }
    }
    return null;
  }, [elements]);

  // ── Render loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = canvasSize;
    ctx.clearRect(0, 0, w, h);

    // Completely transparent background — iframe shows through
    // Only draw grid overlay if enabled
    if (showGrid) drawGrid(ctx, w, h);

    // Draw all elements (no pan/zoom transform — elements are pinned to screen pixels
    // which is intentional: they stay fixed over the iframe as the user pans)
    const allEls = preview ? [...elements, preview] : elements;

    for (const el of allEls) {
      const sel = el.id === selectedId;
      ctx.save();
      ctx.strokeStyle = el.color;
      ctx.fillStyle   = el.color;
      ctx.lineWidth   = el.lw;
      ctx.setLineDash(el.dashed ? [8, 4] : []);
      if (sel) { ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 8; }

      if (el.type === "draw" && el.points && el.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (const p of el.points.slice(1)) ctx.lineTo(p.x, p.y);
        ctx.lineJoin = "round"; ctx.lineCap = "round";
        ctx.stroke();
      }

      if ((el.type === "line" || el.type === "arrow") && el.points?.length === 2) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        ctx.lineTo(el.points[1].x, el.points[1].y);
        ctx.stroke();
        if (el.type === "arrow") {
          ctx.setLineDash([]);
          drawArrowHead(ctx, el.points[0], el.points[1], 14);
        }
        if (el.label) {
          const mx = (el.points[0].x + el.points[1].x)/2;
          const my = (el.points[0].y + el.points[1].y)/2;
          ctx.setLineDash([]);
          ctx.font = "bold 11px Arial";
          ctx.textAlign = "center"; ctx.textBaseline = "bottom";
          ctx.fillText(el.label, mx, my - 4);
        }
      }

      if (el.type === "rect" && el.x != null) {
        ctx.strokeRect(el.x!, el.y!, el.w!, el.h!);
      }

      if (el.type === "circle" && el.x != null) {
        ctx.beginPath(); ctx.arc(el.x!, el.y!, el.r!, 0, Math.PI*2); ctx.stroke();
      }

      if (el.type === "ruler" && el.points?.length === 2) {
        ctx.setLineDash([6, 3]);
        ctx.strokeStyle = "#ffcc44"; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        ctx.lineTo(el.points[1].x, el.points[1].y);
        ctx.stroke();
        for (const p of el.points) {
          ctx.setLineDash([]);
          ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
          ctx.fillStyle = "#ffcc44"; ctx.fill();
        }
        if (el.label) {
          const mx=(el.points[0].x+el.points[1].x)/2;
          const my=(el.points[0].y+el.points[1].y)/2;
          ctx.setLineDash([]);
          ctx.font = "bold 11px Arial"; ctx.fillStyle = "#ffcc44";
          ctx.textAlign = "center"; ctx.textBaseline = "bottom";
          ctx.fillText(el.label, mx, my - 6);
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

    // Compass (always on top, screen-space, bottom-right corner)
    if (showCompass) {
      drawFullCompass(ctx, w - 68, h - 68, 55, mapRotation);
    }

  }, [elements, preview, showGrid, showCompass, canvasSize, selectedId, mapRotation]);

  // ── Pointer events ───────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const cp = getEvtPt(e);

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
        const d = dist(rulerStart, cp);
        // Distance is purely pixel-based — note to user it's relative
        const lbl = `~${Math.round(d)}px`;
        setElements(prev => [...prev, {
          id: uid(), type:"ruler",
          points:[rulerStart, cp],
          x:(rulerStart.x+cp.x)/2, y:(rulerStart.y+cp.y)/2,
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
  }, [tool, getEvtPt, hitTest, rulerStart, pendingSym]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (tool === "select" && dragId.current && dragPrev.current) {
      const cp = getEvtPt(e);
      const dx = cp.x - dragPrev.current.x;
      const dy = cp.y - dragPrev.current.y;
      dragPrev.current = cp;
      setElements(prev => prev.map(el =>
        el.id === dragId.current
          ? { ...el,
              x: (el.x ?? 0) + dx,
              y: (el.y ?? 0) + dy,
              points: el.points?.map(p => ({ x: p.x + dx, y: p.y + dy })),
            }
          : el
      ));
      return;
    }
    if (!isDrawing.current || !drawStart.current) return;
    const cp = getEvtPt(e);

    if (tool === "draw") {
      drawPath.current.push(cp);
      setPreview({ id:"__prev__", type:"draw", points:[...drawPath.current], color, lw, dashed });
      return;
    }
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

  // Use refs for color/lw/dashed so the window mouseup listener always has fresh values
  const colorRef  = useRef(color);
  const lwRef     = useRef(lw);
  const dashedRef = useRef(dashed);
  const toolRef   = useRef(tool);
  useEffect(() => { colorRef.current  = color;  }, [color]);
  useEffect(() => { lwRef.current     = lw;     }, [lw]);
  useEffect(() => { dashedRef.current = dashed; }, [dashed]);
  useEffect(() => { toolRef.current   = tool;   }, [tool]);

  // Commit stroke — attached to window so mouse-up off-canvas still fires
  useEffect(() => {
    const commitStroke = (clientX: number, clientY: number) => {
      dragId.current = null; dragPrev.current = null;
      if (!isDrawing.current) return;
      isDrawing.current = false;

      const t     = toolRef.current;
      const c     = colorRef.current;
      const w     = lwRef.current;
      const d     = dashedRef.current;
      const start = drawStart.current;

      if (t === "draw") {
        if (drawPath.current.length >= 2) {
          setElements(prev => [...prev, { id:uid(), type:"draw", points:[...drawPath.current], color:c, lw:w, dashed:d }]);
        }
        drawPath.current = [];
        drawStart.current = null;
        setPreview(null);
        return;
      }

      setPreview(null);
      if (!start) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cp = { x: clientX - rect.left, y: clientY - rect.top };

      if (t === "line" || t === "arrow") {
        if (dist(start, cp) < 5) return;
        setElements(prev => [...prev, { id:uid(), type:t, points:[start,cp], color:c, lw:w, dashed:d, label:"" }]);
      }
      if (t === "rect") {
        const rw = Math.abs(cp.x-start.x); const rh = Math.abs(cp.y-start.y);
        if (rw < 5 || rh < 5) return;
        setElements(prev => [...prev, { id:uid(), type:"rect", x:Math.min(start.x,cp.x), y:Math.min(start.y,cp.y), w:rw, h:rh, color:c, lw:w, dashed:d }]);
      }
      if (t === "circle") {
        const r = dist(start, cp);
        if (r < 5) return;
        setElements(prev => [...prev, { id:uid(), type:"circle", x:start.x, y:start.y, r, color:c, lw:w, dashed:d }]);
      }
      drawStart.current = null;
    };

    const onWindowMouseUp = (e: MouseEvent) => commitStroke(e.clientX, e.clientY);
    const onWindowTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (t) commitStroke(t.clientX, t.clientY);
    };

    window.addEventListener("mouseup",   onWindowMouseUp);
    window.addEventListener("touchend",  onWindowTouchEnd);
    return () => {
      window.removeEventListener("mouseup",  onWindowMouseUp);
      window.removeEventListener("touchend", onWindowTouchEnd);
    };
  }, []);  // intentionally empty — refs keep values fresh

  const onMouseUp = useCallback((_e: React.MouseEvent) => {
    // no-op: handled by window listener above
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        setElements(p => p.filter(el => el.id !== selectedId)); setSelectedId(null);
      }
      if (e.key === "Escape") { setSelectedId(null); setRulerStart(null); setLabelPrompt(null); }
      const m: Record<string, ToolMode> = { p:"pan", v:"select", d:"draw", l:"line", a:"arrow", r:"ruler", m:"marker" };
      if (m[e.key]) setTool(m[e.key]);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [selectedId]);

  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `tacplan_${group?.name ?? "map"}_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const savePlan = () => {
    const data = JSON.stringify({ v:3, mapId, elements: elements.filter(e=>e.id!=="__prev__"), linkedOpId, cmdNote });
    onSave?.(data);
    showMsg(true, "Plan saved.");
  };

  const confirmMarker = () => {
    if (!labelPrompt) return;
    const sym = NATO_SYMS.find(s => s.key === labelPrompt.symKey) ?? NATO_SYMS[0];
    setElements(prev => [...prev, {
      id:uid(), type:"marker",
      x:labelPrompt.cp.x, y:labelPrompt.cp.y,
      symbol:labelPrompt.symKey,
      color:SYM_COLOR[sym.cat], lw:2, label:labelText,
    }]);
    setLabelPrompt(null); setLabelText("");
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomBgUrl(URL.createObjectURL(file));
    setMapId("custom"); setShowMapPicker(false);
  };

  const gameGroups = useMemo(() => {
    const out: Record<string, GameMap[]> = {};
    for (const m of GAME_MAPS) { if (!out[m.game]) out[m.game]=[]; out[m.game].push(m); }
    return out;
  }, []);

  const btnCls = (active: boolean, danger = false) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-display font-bold uppercase tracking-wider transition-all border whitespace-nowrap flex-shrink-0 ${
      danger  ? "border-red-500/40 text-red-400 hover:bg-red-500/10" :
      active  ? "bg-primary/20 border-primary/60 text-primary" :
                "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
    }`;

  const TOOLS: { id:ToolMode; icon:React.ReactNode; label:string; k:string }[] = [
    { id:"pan",    icon:<Move          className="w-3.5 h-3.5"/>, label:"Pan",    k:"P" },
    { id:"select", icon:<MousePointer2 className="w-3.5 h-3.5"/>, label:"Select", k:"V" },
    { id:"draw",   icon:<Pencil        className="w-3.5 h-3.5"/>, label:"Pen",    k:"D" },
    { id:"line",   icon:<svg width="14" height="14" viewBox="0 0 14 14"><line x1="2" y1="12" x2="12" y2="2" stroke="currentColor" strokeWidth="2"/></svg>, label:"Line", k:"L" },
    { id:"arrow",  icon:<ArrowRight    className="w-3.5 h-3.5"/>, label:"Arrow",  k:"A" },
    { id:"rect",   icon:<Square        className="w-3.5 h-3.5"/>, label:"Rect",   k:"" },
    { id:"circle", icon:<Circle        className="w-3.5 h-3.5"/>, label:"Circle", k:"" },
    { id:"ruler",  icon:<Ruler         className="w-3.5 h-3.5"/>, label:"Ruler",  k:"R" },
    { id:"marker", icon:<Target        className="w-3.5 h-3.5"/>, label:"Marker", k:"M" },
  ];

  const linkedOp = ops.find(o => o.id === linkedOpId);
  const iframeUrl = mapId === "custom" ? null : gameMap.iframeUrl;
  // Canvas is on top and captures input only during drawing tools
  const canvasPointerEvents = canvasCapture ? "auto" : "none";

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
                    {maps.filter(m=>m.id!=="custom").map(m=>(
                      <button key={m.id} onClick={()=>{setMapId(m.id);setShowMapPicker(false);setIframeBlocked(false);}}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-left transition-all ${
                          m.id===mapId?"bg-primary/15 text-primary border border-primary/40":"text-foreground hover:bg-secondary/50 border border-transparent"
                        }`}>
                        <div className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{background:m.previewColor}}/>
                        {m.name}
                        {m.iframeUrl && <span className="ml-auto text-[9px] text-green-400 font-mono">LIVE</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="border-t border-border pt-2">
                <label className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded border border-dashed border-border hover:border-primary/40 text-xs text-muted-foreground hover:text-foreground transition-all">
                  <Layers className="w-3.5 h-3.5"/>Upload custom map image
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload}/>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Open in new tab */}
        {gameMap.openUrl && (
          <a href={gameMap.openUrl} target="_blank" rel="noopener noreferrer" className={btnCls(false)} title="Open map in new tab">
            <ExternalLink className="w-3.5 h-3.5"/>
          </a>
        )}

        <div className="w-px h-5 bg-border flex-shrink-0"/>

        {/* Tools */}
        {TOOLS.map(t=>(
          <button key={t.id} onClick={()=>setTool(t.id)} className={btnCls(tool===t.id)}
            title={`${t.label}${t.k?" ("+t.k+")":""}`}>
            {t.icon}
            <span className="hidden xl:inline">{t.label}</span>
          </button>
        ))}

        {/* Symbol picker */}
        <div className="relative">
          <button onClick={()=>setShowSymPicker(p=>!p)} className={btnCls(showSymPicker||tool==="marker")}>
            <Flag className="w-3.5 h-3.5"/>
            <span className="hidden xl:inline">Symbols</span>
          </button>
          {showSymPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-2xl p-3 w-72">
              {(["friendly","enemy","control"] as const).map(cat=>(
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

        <div className="w-px h-5 bg-border flex-shrink-0"/>

        {/* Colours */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setColor(c)}
              style={{background:c,width:15,height:15,borderRadius:3,flexShrink:0,
                border:color===c?"2px solid white":"1px solid rgba(255,255,255,0.2)"}}/>
          ))}
        </div>

        {/* Line width */}
        {[1,2,4,6].map(w=>(
          <button key={w} onClick={()=>setLw(w)}
            className={`w-6 h-6 flex items-center justify-center rounded border transition-all flex-shrink-0 ${lw===w?"border-primary/60 bg-primary/15":"border-border hover:bg-secondary/50"}`}>
            <div style={{width:Math.min(14,w*2.5),height:w,background:"white",borderRadius:99}}/>
          </button>
        ))}

        <button onClick={()=>setDashed(d=>!d)} className={btnCls(dashed)}>
          <span className="font-mono tracking-widest">- -</span>
        </button>

        <div className="w-px h-5 bg-border flex-shrink-0"/>

        {/* Compass rotation */}
        <button onClick={()=>setMapRotation(r=>r - Math.PI/16)} className={btnCls(false)} title="Rotate CCW"><RotateCcw className="w-3.5 h-3.5"/></button>
        <span className="text-[10px] text-muted-foreground font-mono w-10 text-center flex-shrink-0">
          {Math.round(((mapRotation*180/Math.PI)%360+360)%360)}°
        </span>
        <button onClick={()=>setMapRotation(r=>r + Math.PI/16)} className={btnCls(false)} title="Rotate CW"><RotateCw className="w-3.5 h-3.5"/></button>
        <button onClick={()=>setMapRotation(0)} className={btnCls(false)} title="Reset north"><Compass className="w-3.5 h-3.5"/></button>

        <div className="w-px h-5 bg-border flex-shrink-0"/>

        {/* Toggles */}
        <button onClick={()=>setShowGrid(g=>!g)}    className={btnCls(showGrid)}   title="Grid overlay"><Layers className="w-3.5 h-3.5"/></button>
        <button onClick={()=>setShowCompass(c=>!c)} className={btnCls(showCompass)} title="Compass"><Compass className="w-3.5 h-3.5"/></button>

        <div className="w-px h-5 bg-border flex-shrink-0"/>

        {/* Op link */}
        <button onClick={()=>setShowOpLink(p=>!p)} className={btnCls(!!linkedOpId)} title="Link Op">
          <Link className="w-3.5 h-3.5"/>
          <span className="hidden xl:inline">{linkedOp ? linkedOp.name : "Link Op"}</span>
        </button>
        <button onClick={()=>setShowNotes(p=>!p)} className={btnCls(showNotes)} title="Notes">
          <MessageSquare className="w-3.5 h-3.5"/>
          <span className="hidden xl:inline">Notes</span>
        </button>

        {/* Delete selected */}
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

      {/* ── Op link panel ─────────────────────────────────────────────────── */}
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

      {/* ── Commander notes ───────────────────────────────────────────────── */}
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

      {/* ── Map + canvas stack ────────────────────────────────────────────── */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#0a0c0e]">

        {/* LAYER 1: Live iframe map */}
        {iframeUrl && !iframeBlocked && (
          <iframe
            key={mapId}
            src={iframeUrl}
            title={`${gameMap.game} — ${gameMap.name}`}
            className="absolute inset-0 w-full h-full border-0"
            style={{ pointerEvents: canvasCapture ? "none" : "auto" }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onError={()=>setIframeBlocked(true)}
          />
        )}

        {/* LAYER 1 (custom): uploaded image bg */}
        {mapId === "custom" && customBgUrl && (
          <div className="absolute inset-0" style={{ pointerEvents: canvasCapture ? "none" : "auto" }}>
            <img src={customBgUrl} alt="Custom map" className="w-full h-full object-contain"/>
          </div>
        )}

        {/* LAYER 1 (fallback): solid colour when no iframe and no custom */}
        {(!iframeUrl || iframeBlocked) && mapId !== "custom" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{background: gameMap.fallbackColor}}>
            <p className="text-white/40 text-sm font-display uppercase tracking-wider">
              {iframeBlocked ? "Map blocked by browser" : "No live map for this selection"}
            </p>
            {gameMap.openUrl && (
              <a href={gameMap.openUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded text-white text-sm font-display uppercase tracking-wider hover:bg-white/20 transition-all">
                <ExternalLink className="w-4 h-4"/> Open {gameMap.name} in new tab
              </a>
            )}
          </div>
        )}

        {/* LAYER 2: Transparent drawing canvas */}
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          className="absolute inset-0"
          style={{
            width:"100%", height:"100%",
            pointerEvents: canvasPointerEvents,
            cursor: tool==="pan" ? "grab" :
                    tool==="select" ? "default" :
                    tool==="ruler" ? "crosshair" : "crosshair",
            background: "transparent",
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={()=>{ dragId.current=null; isPanning.current=false; panAnchor.current=null; }}
        />

        {/* Tool mode indicator */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded border text-xs font-display font-bold uppercase tracking-wider ${
            canvasCapture
              ? "bg-primary/20 border-primary/50 text-primary"
              : "bg-black/50 border-white/10 text-white/40"
          }`}>
            {canvasCapture ? `✎ ${tool.toUpperCase()} MODE — drawing active` : "⊕ PAN MODE — map interactive"}
          </div>
          {linkedOp && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 border border-primary/40 rounded text-xs text-primary font-display font-bold uppercase tracking-wider">
              <Link className="w-3 h-3"/> {linkedOp.name}
            </div>
          )}
        </div>

        {/* Ruler hint */}
        {tool==="ruler" && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-card/90 border border-yellow-500/40 rounded text-xs text-yellow-400 font-display font-bold uppercase tracking-wider pointer-events-none">
            {rulerStart ? "Click second point to measure" : "Click start point"}
          </div>
        )}

        {/* Hint strip */}
        <div className="absolute bottom-2 right-20 flex items-center gap-3 text-[9px] text-white/25 font-sans pointer-events-none">
          <span>P=pan</span><span>D=draw</span><span>A=arrow</span><span>M=marker</span><span>Del=delete</span>
        </div>
      </div>

      {/* ── Marker label modal ─────────────────────────────────────────────── */}
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
