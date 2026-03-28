/**
 * TacticalPlanner — Commander's battle / navigation planning canvas
 *
 * Features:
 *  - Game map selector with real tileset URLs (Arma 3, Squad, HLL, Reforger)
 *  - Pan + zoom canvas (mouse wheel, drag)
 *  - MGRS/grid overlay that scales with zoom
 *  - Tools: Select | Pan | Draw (freehand pen) | Line | Arrow | Shape (rect/circle)
 *  - NATO APP-6 ORBAT symbols recycled as map markers (from OrbatBuilder symbol set)
 *  - Marker labels + drag-to-move
 *  - Compass rose overlay (toggleable)
 *  - Ruler / distance measurement tool
 *  - Delete selected element
 *  - Clear all
 *  - Export canvas as PNG
 *  - Save/load plan as JSON (persisted to group ORBAT field via parent)
 */

import React, {
  useRef, useState, useEffect, useCallback, useReducer, useMemo,
} from "react";
import {
  Map, Pencil, MousePointer2, Move, Minus, Plus, RotateCcw,
  Trash2, Download, Save, Layers, Crosshair, Ruler, Circle,
  Square, ArrowRight, ChevronDown, ChevronUp, Target, Compass,
  Eye, EyeOff, X, Check, AlertTriangle, Shield, Zap, Flag,
  Navigation, Waypoints,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToolMode = "select" | "pan" | "draw" | "line" | "arrow" | "rect" | "circle" | "ruler" | "marker" | "text";

interface Point { x: number; y: number; }

interface PlanElement {
  id: string;
  type: "draw" | "line" | "arrow" | "rect" | "circle" | "marker" | "ruler" | "text";
  points?: Point[];       // draw path / line endpoints
  x?: number; y?: number; // anchor for marker/rect/circle/text
  w?: number; h?: number; // rect size
  r?: number;             // circle radius
  color: string;
  lineWidth: number;
  label?: string;
  symbol?: string;        // NATO symbol key
  opacity?: number;
  dashed?: boolean;
  fontSize?: number;
}

interface ViewState { ox: number; oy: number; scale: number; }

// ─── Map catalogue ────────────────────────────────────────────────────────────

interface GameMap {
  id: string;
  game: string;
  name: string;
  tileUrl: string | null;   // null = solid color placeholder
  attribution: string;
  gridSize: number;          // metres per grid square
  mapSizeKm: number;
  bgColor: string;
  previewColor: string;
}

const GAME_MAPS: GameMap[] = [
  // ── Arma 3 ────────────────────────────────────────────────────────────────
  {
    id: "a3_altis",     game: "Arma 3",        name: "Altis",
    tileUrl: "https://atlas.plan-ops.fr/maps/arma3/altis/100/{z}/{x}/{y}.png",
    attribution: "© Bohemia Interactive / PLANOPS Atlas",
    gridSize: 100, mapSizeKm: 27, bgColor: "#2d3a2e", previewColor: "#4a7c59",
  },
  {
    id: "a3_stratis",   game: "Arma 3",        name: "Stratis",
    tileUrl: "https://atlas.plan-ops.fr/maps/arma3/stratis/100/{z}/{x}/{y}.png",
    attribution: "© Bohemia Interactive / PLANOPS Atlas",
    gridSize: 100, mapSizeKm: 8, bgColor: "#2d3a2e", previewColor: "#5a8c6a",
  },
  {
    id: "a3_malden",    game: "Arma 3",        name: "Malden",
    tileUrl: "https://atlas.plan-ops.fr/maps/arma3/malden/100/{z}/{x}/{y}.png",
    attribution: "© Bohemia Interactive / PLANOPS Atlas",
    gridSize: 100, mapSizeKm: 12, bgColor: "#2d3a2e", previewColor: "#6a9c7a",
  },
  {
    id: "a3_tanoa",     game: "Arma 3",        name: "Tanoa",
    tileUrl: "https://atlas.plan-ops.fr/maps/arma3/tanoa/100/{z}/{x}/{y}.png",
    attribution: "© Bohemia Interactive / PLANOPS Atlas",
    gridSize: 100, mapSizeKm: 16, bgColor: "#1a3a2a", previewColor: "#3a7a5a",
  },
  // ── Arma Reforger ─────────────────────────────────────────────────────────
  {
    id: "rf_everon",    game: "Arma Reforger",  name: "Everon",
    tileUrl: null,
    attribution: "© Bohemia Interactive",
    gridSize: 100, mapSizeKm: 16, bgColor: "#263326", previewColor: "#4d7a55",
  },
  // ── Squad ─────────────────────────────────────────────────────────────────
  {
    id: "sq_jensen",    game: "Squad",          name: "Jensen\'s Range",
    tileUrl: null,
    attribution: "© Offworld Industries",
    gridSize: 300, mapSizeKm: 4, bgColor: "#2a2a1e", previewColor: "#7a7a3a",
  },
  {
    id: "sq_yeho",      game: "Squad",          name: "Yehorivka",
    tileUrl: null,
    attribution: "© Offworld Industries",
    gridSize: 300, mapSizeKm: 8, bgColor: "#2a2a1e", previewColor: "#6a7a3a",
  },
  {
    id: "sq_kohat",     game: "Squad",          name: "Kohat Toi",
    tileUrl: null,
    attribution: "© Offworld Industries",
    gridSize: 300, mapSizeKm: 8, bgColor: "#3a2a1e", previewColor: "#7a6a3a",
  },
  {
    id: "sq_gorodok",   game: "Squad",          name: "Gorodok",
    tileUrl: null,
    attribution: "© Offworld Industries",
    gridSize: 300, mapSizeKm: 8, bgColor: "#1e2a1e", previewColor: "#4a6a4a",
  },
  {
    id: "sq_talil",     game: "Squad",          name: "Tallil Outskirts",
    tileUrl: null,
    attribution: "© Offworld Industries",
    gridSize: 300, mapSizeKm: 8, bgColor: "#3a3020", previewColor: "#8a7a4a",
  },
  // ── Hell Let Loose ────────────────────────────────────────────────────────
  {
    id: "hll_sthelen",  game: "Hell Let Loose", name: "Sainte-Marie-du-Mont",
    tileUrl: null,
    attribution: "© Black Matter",
    gridSize: 250, mapSizeKm: 2, bgColor: "#283020", previewColor: "#5a7a4a",
  },
  {
    id: "hll_stalingrad", game: "Hell Let Loose", name: "Stalingrad",
    tileUrl: null,
    attribution: "© Black Matter",
    gridSize: 250, mapSizeKm: 2, bgColor: "#302820", previewColor: "#7a6a5a",
  },
  {
    id: "hll_hurtgen",  game: "Hell Let Loose", name: "Hürtgen Forest",
    tileUrl: null,
    attribution: "© Black Matter",
    gridSize: 250, mapSizeKm: 2, bgColor: "#203020", previewColor: "#4a6a4a",
  },
  // ── Custom ────────────────────────────────────────────────────────────────
  {
    id: "custom",       game: "Custom",         name: "Custom / Upload",
    tileUrl: null,
    attribution: "",
    gridSize: 100, mapSizeKm: 10, bgColor: "#1a1a1a", previewColor: "#444",
  },
];

// ─── NATO Symbols (reusing OrbatBuilder symbol concept) ──────────────────────

const NATO_SYMBOLS: Array<{ key: string; label: string; shape: string; color: string }> = [
  { key: "inf",    label: "Infantry",       shape: "X",  color: "#4a9eff" },
  { key: "arm",    label: "Armour",         shape: "▭",  color: "#4a9eff" },
  { key: "art",    label: "Artillery",      shape: "•",  color: "#4a9eff" },
  { key: "eng",    label: "Engineer",       shape: "E",  color: "#4a9eff" },
  { key: "med",    label: "Medical",        shape: "+",  color: "#4a9eff" },
  { key: "hq",     label: "HQ",            shape: "⊕",  color: "#4a9eff" },
  { key: "log",    label: "Logistics",      shape: "L",  color: "#4a9eff" },
  { key: "recon",  label: "Recon",          shape: "⌖",  color: "#4a9eff" },
  { key: "sniper", label: "Sniper",         shape: "⊗",  color: "#4a9eff" },
  { key: "air",    label: "Air Asset",      shape: "✈",  color: "#4a9eff" },
  { key: "enemy_inf",  label: "Enemy Inf",  shape: "X",  color: "#ff4a4a" },
  { key: "enemy_arm",  label: "Enemy Arm",  shape: "▭",  color: "#ff4a4a" },
  { key: "enemy_hq",   label: "Enemy HQ",   shape: "⊕",  color: "#ff4a4a" },
  { key: "obj",    label: "Objective",      shape: "★",  color: "#ffd700" },
  { key: "rally",  label: "Rally Point",    shape: "R",  color: "#44ff88" },
  { key: "fob",    label: "FOB",            shape: "F",  color: "#44ff88" },
  { key: "cache",  label: "Cache",          shape: "◆",  color: "#ff8c44" },
  { key: "lz",     label: "LZ",             shape: "H",  color: "#44ddff" },
  { key: "danger", label: "Danger Area",    shape: "⚠",  color: "#ffcc00" },
  { key: "mine",   label: "Minefield",      shape: "M",  color: "#ff6644" },
];

// ─── Colour palette ───────────────────────────────────────────────────────────

const COLORS = [
  "#ffffff", "#ff4444", "#ff8800", "#ffcc00", "#44ff88",
  "#4a9eff", "#aa44ff", "#ff44aa", "#00ffdd", "#aaaaaa",
];

// ─── Utility ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);

function dist(a: Point, b: Point) {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

function screenToCanvas(sx: number, sy: number, view: ViewState, canvasEl: HTMLCanvasElement): Point {
  const rect = canvasEl.getBoundingClientRect();
  return {
    x: (sx - rect.left - view.ox) / view.scale,
    y: (sy - rect.top  - view.oy) / view.scale,
  };
}

// ─── Draw helpers (called onto a 2D context at scale=1) ───────────────────────

function drawArrowHead(ctx: CanvasRenderingContext2D, from: Point, to: Point, size = 14) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - size * Math.cos(angle - Math.PI / 6), to.y - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(to.x - size * Math.cos(angle + Math.PI / 6), to.y - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawNatoSymbol(
  ctx: CanvasRenderingContext2D,
  sym: (typeof NATO_SYMBOLS)[0],
  x: number, y: number,
  label: string,
  selected: boolean,
) {
  const size = 22;
  const isEnemy = sym.key.startsWith("enemy_");
  const fill = isEnemy ? "#ff4a4a" : sym.key === "obj" || sym.key === "rally" || sym.key === "fob" ? sym.color : "#1a3a6a";
  const border = sym.color;

  ctx.save();

  // Selection glow
  if (selected) {
    ctx.shadowColor = "#ffcc00";
    ctx.shadowBlur = 10;
  }

  // Background shape: rectangle for units, diamond for objectives
  if (sym.key === "obj" || sym.key === "cache") {
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.8);
    ctx.lineTo(x + size * 0.8, y);
    ctx.lineTo(x, y + size * 0.8);
    ctx.lineTo(x - size * 0.8, y);
    ctx.closePath();
  } else {
    ctx.beginPath();
    ctx.roundRect(x - size, y - size * 0.65, size * 2, size * 1.3, 3);
  }
  ctx.fillStyle = fill + "cc";
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Symbol glyph
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${size * 0.9}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(sym.shape, x, y);

  // Label below
  if (label) {
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 10px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    // small dark bg for readability
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(x - tw / 2 - 2, y + size + 2, tw + 4, 14);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x, y + size + 3);
  }

  ctx.restore();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  view: ViewState,
  canvasW: number,
  canvasH: number,
  gridSize: number,
  mapSizeKm: number,
) {
  const gridPx = gridSize * view.scale / 10; // gridSize metres → canvas px at this zoom
  if (gridPx < 12) return; // too dense, skip

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 0.5;
  ctx.setLineDash([]);

  // Vertical lines
  const startX = (view.ox % gridPx);
  for (let x = startX; x < canvasW; x += gridPx) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasH); ctx.stroke();
  }
  // Horizontal lines
  const startY = (view.oy % gridPx);
  for (let y = startY; y < canvasH; y += gridPx) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke();
  }

  // Grid labels (only when zoomed enough)
  if (gridPx > 40) {
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    let col = 0;
    for (let x = startX; x < canvasW; x += gridPx) {
      let row = 0;
      for (let y = startY; y < canvasH; y += gridPx) {
        const label = String.fromCharCode(65 + col) + String(row).padStart(2, "0");
        ctx.fillText(label, x + 2, y + 2);
        row++;
      }
      col++;
    }
  }
  ctx.restore();
}

function drawCompass(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  // Outer ring
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Cardinal directions
  const dirs = [
    { label: "N", a: -Math.PI / 2, color: "#ff4444" },
    { label: "E", a: 0,            color: "#aaaaaa" },
    { label: "S", a: Math.PI / 2,  color: "#aaaaaa" },
    { label: "W", a: Math.PI,      color: "#aaaaaa" },
  ];
  for (const d of dirs) {
    const tx = x + Math.cos(d.a) * (r - 8);
    const ty = y + Math.sin(d.a) * (r - 8);
    ctx.fillStyle = d.color;
    ctx.font = `bold ${r * 0.35}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(d.label, tx, ty);
  }

  // North needle
  ctx.beginPath();
  ctx.moveTo(x, y - r * 0.6);
  ctx.lineTo(x - r * 0.15, y + r * 0.2);
  ctx.lineTo(x + r * 0.15, y + r * 0.2);
  ctx.closePath();
  ctx.fillStyle = "#ff4444";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.6);
  ctx.lineTo(x - r * 0.15, y - r * 0.2);
  ctx.lineTo(x + r * 0.15, y - r * 0.2);
  ctx.closePath();
  ctx.fillStyle = "#aaaaaa";
  ctx.fill();

  ctx.restore();
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TacticalPlannerProps {
  group: any;
  showMsg: (ok: boolean, msg: string) => void;
  initialJson?: string;
  onSave?: (json: string) => void;
}

export default function TacticalPlanner({ group, showMsg, initialJson, onSave }: TacticalPlannerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── State ────────────────────────────────────────────────────────────────
  const [selectedMapId, setSelectedMapId] = useState<string>("a3_altis");
  const [tool, setTool] = useState<ToolMode>("pan");
  const [elements, setElements] = useState<PlanElement[]>(() => {
    try { return initialJson ? JSON.parse(initialJson).elements ?? [] : []; } catch { return []; }
  });
  const [view, setView] = useState<ViewState>({ ox: 0, oy: 0, scale: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [color, setColor] = useState("#ff4444");
  const [lineWidth, setLineWidth] = useState(2);
  const [showGrid, setShowGrid] = useState(true);
  const [showCompass, setShowCompass] = useState(true);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [pendingLabel, setPendingLabel] = useState("");
  const [labelPrompt, setLabelPrompt] = useState<{ x: number; y: number; symbolKey: string } | null>(null);
  const [rulerPoints, setRulerPoints] = useState<Point[]>([]);
  const [rulerDist, setRulerDist] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [mapImages, setMapImages] = useState<Record<string, HTMLImageElement>>({});
  const [dashed, setDashed] = useState(false);

  // ── Drawing in-progress ──────────────────────────────────────────────────
  const drawing = useRef(false);
  const currentPath = useRef<Point[]>([]);
  const dragStart = useRef<Point | null>(null);
  const panStart = useRef<{ ox: number; oy: number; mx: number; my: number } | null>(null);
  const dragElementId = useRef<string | null>(null);
  const dragElementOrigin = useRef<Point | null>(null);

  const gameMap = useMemo(() => GAME_MAPS.find(m => m.id === selectedMapId) ?? GAME_MAPS[0], [selectedMapId]);

  // ── Resize canvas to container ───────────────────────────────────────────
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        setCanvasSize({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // ── Fit map to canvas on map change ─────────────────────────────────────
  useEffect(() => {
    const mapPx = gameMap.mapSizeKm * 100; // 1 km = 100 canvas units
    const scaleX = canvasSize.w / mapPx;
    const scaleY = canvasSize.h / mapPx;
    const scale = Math.min(scaleX, scaleY) * 0.9;
    setView({
      ox: (canvasSize.w - mapPx * scale) / 2,
      oy: (canvasSize.h - mapPx * scale) / 2,
      scale,
    });
  }, [selectedMapId, canvasSize.w, canvasSize.h]);

  // ── Render loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mapPxW = gameMap.mapSizeKm * 100;
    const mapPxH = gameMap.mapSizeKm * 100;

    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);

    // Background (outside map)
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);

    // Map area
    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);

    // Map bg colour or image
    if (customBg && selectedMapId === "custom") {
      const img = mapImages["custom"];
      if (img) ctx.drawImage(img, 0, 0, mapPxW, mapPxH);
      else { ctx.fillStyle = gameMap.bgColor; ctx.fillRect(0, 0, mapPxW, mapPxH); }
    } else {
      ctx.fillStyle = gameMap.bgColor;
      ctx.fillRect(0, 0, mapPxW, mapPxH);
      // Subtle terrain texture
      ctx.fillStyle = "rgba(255,255,255,0.015)";
      for (let i = 0; i < mapPxW; i += 40) {
        for (let j = 0; j < mapPxH; j += 40) {
          if ((i + j) % 80 === 0) ctx.fillRect(i, j, 40, 40);
        }
      }
    }

    // Map border
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1 / view.scale;
    ctx.strokeRect(0, 0, mapPxW, mapPxH);

    ctx.restore();

    // Grid (screen space)
    if (showGrid) drawGrid(ctx, view, canvasSize.w, canvasSize.h, gameMap.gridSize, gameMap.mapSizeKm);

    // Elements
    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);

    for (const el of elements) {
      const isSelected = el.id === selectedId;
      ctx.save();
      ctx.globalAlpha = el.opacity ?? 1;
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.lineWidth / view.scale;
      if (el.dashed) ctx.setLineDash([8 / view.scale, 4 / view.scale]);
      else ctx.setLineDash([]);

      if (isSelected) {
        ctx.shadowColor = "#ffcc00";
        ctx.shadowBlur = 8 / view.scale;
      }

      if (el.type === "draw" && el.points && el.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (const p of el.points.slice(1)) ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      if ((el.type === "line" || el.type === "arrow") && el.points && el.points.length === 2) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        ctx.lineTo(el.points[1].x, el.points[1].y);
        ctx.stroke();
        if (el.type === "arrow") {
          ctx.setLineDash([]);
          ctx.fillStyle = el.color;
          drawArrowHead(ctx, el.points[0], el.points[1], 14 / view.scale);
        }
        // Label midpoint
        if (el.label) {
          const mx = (el.points[0].x + el.points[1].x) / 2;
          const my = (el.points[0].y + el.points[1].y) / 2;
          ctx.font = `bold ${11 / view.scale}px Arial`;
          ctx.fillStyle = el.color;
          ctx.textAlign = "center";
          ctx.fillText(el.label, mx, my - 6 / view.scale);
        }
      }

      if (el.type === "rect" && el.x != null && el.y != null && el.w != null && el.h != null) {
        ctx.strokeRect(el.x, el.y, el.w, el.h);
        if (el.label) {
          ctx.font = `bold ${11 / view.scale}px Arial`;
          ctx.fillStyle = el.color;
          ctx.textAlign = "center";
          ctx.fillText(el.label, el.x + el.w / 2, el.y - 4 / view.scale);
        }
      }

      if (el.type === "circle" && el.x != null && el.y != null && el.r != null) {
        ctx.beginPath();
        ctx.arc(el.x, el.y, el.r, 0, Math.PI * 2);
        ctx.stroke();
        if (el.label) {
          ctx.font = `bold ${11 / view.scale}px Arial`;
          ctx.fillStyle = el.color;
          ctx.textAlign = "center";
          ctx.fillText(el.label, el.x, el.y - el.r - 4 / view.scale);
        }
      }

      if (el.type === "ruler" && el.points && el.points.length === 2) {
        ctx.setLineDash([5 / view.scale, 3 / view.scale]);
        ctx.strokeStyle = "#ffcc00";
        ctx.lineWidth = 1.5 / view.scale;
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        ctx.lineTo(el.points[1].x, el.points[1].y);
        ctx.stroke();
        // Tick marks at ends
        ctx.setLineDash([]);
        for (const p of el.points) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4 / view.scale, 0, Math.PI * 2);
          ctx.fillStyle = "#ffcc00";
          ctx.fill();
        }
        // Distance label
        const d = dist(el.points[0], el.points[1]);
        const metres = d * 10; // canvas units × 10 = metres (1 km = 100 units)
        const label = metres >= 1000 ? `${(metres / 1000).toFixed(2)} km` : `${Math.round(metres)} m`;
        const mx = (el.points[0].x + el.points[1].x) / 2;
        const my = (el.points[0].y + el.points[1].y) / 2;
        ctx.font = `bold ${11 / view.scale}px Arial`;
        ctx.fillStyle = "#ffcc00";
        ctx.textAlign = "center";
        ctx.fillText(label, mx, my - 8 / view.scale);
      }

      if (el.type === "marker" && el.x != null && el.y != null && el.symbol) {
        const sym = NATO_SYMBOLS.find(s => s.key === el.symbol);
        if (sym) {
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;
          drawNatoSymbol(ctx, { ...sym, color: el.color }, el.x, el.y, el.label ?? "", isSelected);
        }
      }

      if (el.type === "text" && el.x != null && el.y != null && el.label) {
        ctx.font = `bold ${(el.fontSize ?? 12) / view.scale}px Arial`;
        ctx.fillStyle = el.color;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        // Background
        const tw = ctx.measureText(el.label).width;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(el.x - 2 / view.scale, el.y - 2 / view.scale, tw + 4 / view.scale, (el.fontSize ?? 12) / view.scale + 4 / view.scale);
        ctx.fillStyle = el.color;
        ctx.fillText(el.label, el.x, el.y);
      }

      ctx.restore();
    }

    // Ruler in-progress
    if (tool === "ruler" && rulerPoints.length === 1) {
      // drawn via mousemove below
    }

    ctx.restore();

    // Compass (screen space, bottom-right)
    if (showCompass) {
      drawCompass(ctx, canvasSize.w - 55, canvasSize.h - 55, 42);
    }

    // Attribution
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "9px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(gameMap.attribution, canvasSize.w - 8, canvasSize.h - 4);

  }, [elements, view, showGrid, showCompass, canvasSize, gameMap, selectedId, rulerPoints, tool, customBg, mapImages]);

  // ── Pointer events ──────────────────────────────────────────────────────
  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: (clientX - rect.left - view.ox) / view.scale,
      y: (clientY - rect.top  - view.oy) / view.scale,
    };
  }, [view]);

  const hitTestMarker = useCallback((cp: Point): PlanElement | null => {
    const threshold = 30 / view.scale;
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.type === "marker" && el.x != null && el.y != null) {
        if (Math.abs(cp.x - el.x) < threshold && Math.abs(cp.y - el.y) < threshold) return el;
      }
      if ((el.type === "text") && el.x != null && el.y != null) {
        if (Math.abs(cp.x - el.x) < threshold && Math.abs(cp.y - el.y) < threshold) return el;
      }
    }
    return null;
  }, [elements, view.scale]);

  const onPointerDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const cp = getCanvasPoint(e);

    if (tool === "pan") {
      panStart.current = { ox: view.ox, oy: view.oy, mx: e.clientX, my: e.clientY };
      return;
    }

    if (tool === "select") {
      const hit = hitTestMarker(cp);
      if (hit) {
        setSelectedId(hit.id);
        dragElementId.current = hit.id;
        dragElementOrigin.current = { x: hit.x!, y: hit.y! };
      } else {
        setSelectedId(null);
      }
      return;
    }

    if (tool === "ruler") {
      if (rulerPoints.length === 0) {
        setRulerPoints([cp]);
      } else if (rulerPoints.length === 1) {
        const d = dist(rulerPoints[0], cp);
        const metres = d * 10;
        const label = metres >= 1000 ? `${(metres / 1000).toFixed(2)} km` : `${Math.round(metres)} m`;
        const el: PlanElement = {
          id: uid(), type: "ruler",
          points: [rulerPoints[0], cp],
          color: "#ffcc00", lineWidth: 1.5, label,
        };
        setElements(prev => [...prev, el]);
        setRulerPoints([]);
      }
      return;
    }

    if (tool === "marker") {
      // Show label prompt
      setLabelPrompt({ x: cp.x, y: cp.y, symbolKey: "" });
      return;
    }

    drawing.current = true;
    currentPath.current = [cp];
    dragStart.current = cp;

    if (tool === "draw") {
      // started
    }
  }, [tool, view, getCanvasPoint, hitTestMarker, rulerPoints]);

  const onPointerMove = useCallback((e: React.MouseEvent) => {
    if (tool === "pan" && panStart.current) {
      const dx = e.clientX - panStart.current.mx;
      const dy = e.clientY - panStart.current.my;
      setView(v => ({ ...v, ox: panStart.current!.ox + dx, oy: panStart.current!.oy + dy }));
      return;
    }

    if (tool === "select" && dragElementId.current && dragElementOrigin.current) {
      const cp = getCanvasPoint(e);
      const orig = dragElementOrigin.current;
      const startCp = getCanvasPoint({ clientX: e.clientX - (e.movementX), clientY: e.clientY - (e.movementY) } as any);
      setElements(prev => prev.map(el =>
        el.id === dragElementId.current
          ? { ...el, x: (el.x ?? 0) + cp.x - (getCanvasPoint({ clientX: e.clientX - e.movementX, clientY: e.clientY - e.movementY } as any)).x,
              y: (el.y ?? 0) + cp.y - (getCanvasPoint({ clientX: e.clientX - e.movementX, clientY: e.clientY - e.movementY } as any)).y }
          : el
      ));
      return;
    }

    if (!drawing.current) return;
    const cp = getCanvasPoint(e);

    if (tool === "draw") {
      currentPath.current.push(cp);
      // Live preview — add partial element
      setElements(prev => {
        const last = prev[prev.length - 1];
        if (last && last.id === "__preview__") {
          return [...prev.slice(0, -1), { ...last, points: [...currentPath.current] }];
        }
        return [...prev, { id: "__preview__", type: "draw", points: [...currentPath.current], color, lineWidth, dashed }];
      });
    }
  }, [tool, view, getCanvasPoint, color, lineWidth, dashed]);

  const onPointerUp = useCallback((e: React.MouseEvent) => {
    panStart.current = null;
    dragElementId.current = null;
    dragElementOrigin.current = null;

    if (!drawing.current) return;
    drawing.current = false;
    const cp = getCanvasPoint(e);

    if (tool === "draw") {
      setElements(prev => {
        const withoutPreview = prev.filter(el => el.id !== "__preview__");
        if (currentPath.current.length < 2) return withoutPreview;
        return [...withoutPreview, {
          id: uid(), type: "draw",
          points: [...currentPath.current],
          color, lineWidth, dashed,
        }];
      });
      currentPath.current = [];
      return;
    }

    if (tool === "line" || tool === "arrow") {
      if (!dragStart.current) return;
      if (dist(dragStart.current, cp) < 5 / view.scale) return;
      setElements(prev => [...prev, {
        id: uid(), type: tool,
        points: [dragStart.current!, cp],
        color, lineWidth, dashed, label: "",
      }]);
      dragStart.current = null;
      return;
    }

    if (tool === "rect") {
      if (!dragStart.current) return;
      const x = Math.min(dragStart.current.x, cp.x);
      const y = Math.min(dragStart.current.y, cp.y);
      const w = Math.abs(cp.x - dragStart.current.x);
      const h = Math.abs(cp.y - dragStart.current.y);
      if (w < 4 / view.scale || h < 4 / view.scale) return;
      setElements(prev => [...prev, { id: uid(), type: "rect", x, y, w, h, color, lineWidth, dashed, label: "" }]);
      dragStart.current = null;
      return;
    }

    if (tool === "circle") {
      if (!dragStart.current) return;
      const r = dist(dragStart.current, cp);
      if (r < 4 / view.scale) return;
      setElements(prev => [...prev, {
        id: uid(), type: "circle",
        x: dragStart.current!.x, y: dragStart.current!.y, r,
        color, lineWidth, dashed, label: "",
      }]);
      dragStart.current = null;
      return;
    }
  }, [tool, view, getCanvasPoint, color, lineWidth, dashed]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.9;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setView(v => {
      const newScale = Math.max(0.1, Math.min(20, v.scale * factor));
      const ratio = newScale / v.scale;
      return {
        scale: newScale,
        ox: mx - (mx - v.ox) * ratio,
        oy: my - (my - v.oy) * ratio,
      };
    });
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        setElements(prev => prev.filter(el => el.id !== selectedId));
        setSelectedId(null);
      }
      if (e.key === "Escape") { setSelectedId(null); setRulerPoints([]); }
      if (e.key === "v") setTool("select");
      if (e.key === "p") setTool("pan");
      if (e.key === "d") setTool("draw");
      if (e.key === "l") setTool("line");
      if (e.key === "a") setTool("arrow");
      if (e.key === "r") setTool("ruler");
      if (e.key === "m") setTool("marker");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId]);

  // ── Export as PNG ────────────────────────────────────────────────────────
  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `tacplan_${group?.name ?? "map"}_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // ── Save plan ────────────────────────────────────────────────────────────
  const savePlan = () => {
    const json = JSON.stringify({ version: 1, mapId: selectedMapId, elements: elements.filter(e => e.id !== "__preview__") });
    onSave?.(json);
    showMsg(true, "Tactical plan saved.");
  };

  // ── Symbol placement ─────────────────────────────────────────────────────
  const placeSymbol = (symKey: string) => {
    setShowSymbolPicker(false);
    setTool("marker");
    // Store pending symbol key in ref so next click places it
    pendingSymbolRef.current = symKey;
  };
  const pendingSymbolRef = useRef<string>("inf");

  // Patch: when tool=marker, pointer down sets labelPrompt with the pending symbol
  useEffect(() => {
    if (tool === "marker") pendingSymbolRef.current = pendingSymbolRef.current || "inf";
  }, [tool]);

  const confirmLabel = () => {
    if (!labelPrompt) return;
    const sym = NATO_SYMBOLS.find(s => s.key === pendingSymbolRef.current) ?? NATO_SYMBOLS[0];
    setElements(prev => [...prev, {
      id: uid(), type: "marker",
      x: labelPrompt.x, y: labelPrompt.y,
      symbol: pendingSymbolRef.current,
      color: sym.color,
      lineWidth: 2,
      label: pendingLabel,
    }]);
    setLabelPrompt(null);
    setPendingLabel("");
  };

  // Custom map upload
  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomBg(url);
    const img = new Image();
    img.src = url;
    img.onload = () => setMapImages(prev => ({ ...prev, custom: img }));
    setSelectedMapId("custom");
  };

  const gameGroups = useMemo(() => {
    const groups: Record<string, GameMap[]> = {};
    for (const m of GAME_MAPS) {
      if (!groups[m.game]) groups[m.game] = [];
      groups[m.game].push(m);
    }
    return groups;
  }, []);

  const TOOLS: Array<{ id: ToolMode; label: string; icon: React.ReactNode; key: string }> = [
    { id: "select", label: "Select / Move", icon: <MousePointer2 className="w-4 h-4" />, key: "V" },
    { id: "pan",    label: "Pan",           icon: <Move          className="w-4 h-4" />, key: "P" },
    { id: "draw",   label: "Freehand",      icon: <Pencil        className="w-4 h-4" />, key: "D" },
    { id: "line",   label: "Line",          icon: <Minus         className="w-4 h-4" />, key: "L" },
    { id: "arrow",  label: "Arrow",         icon: <ArrowRight    className="w-4 h-4" />, key: "A" },
    { id: "rect",   label: "Rectangle",     icon: <Square        className="w-4 h-4" />, key: "" },
    { id: "circle", label: "Circle / AO",   icon: <Circle        className="w-4 h-4" />, key: "" },
    { id: "ruler",  label: "Ruler",         icon: <Ruler         className="w-4 h-4" />, key: "R" },
    { id: "marker", label: "Place Marker",  icon: <Target        className="w-4 h-4" />, key: "M" },
  ];

  const btnCls = (active: boolean) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-display font-bold uppercase tracking-wider transition-all border ${
      active
        ? "bg-primary/20 border-primary/60 text-primary"
        : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
    }`;

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 640, userSelect: "none" }}>

      {/* ── Top toolbar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card flex-wrap">

        {/* Map selector */}
        <div className="relative">
          <button
            onClick={() => setShowMapPicker(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
          >
            <Map className="w-3.5 h-3.5" />
            {gameMap.game} — {gameMap.name}
            <ChevronDown className="w-3 h-3 ml-1" />
          </button>
          {showMapPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-2xl p-3 w-72 max-h-80 overflow-y-auto">
              {Object.entries(gameGroups).map(([game, maps]) => (
                <div key={game} className="mb-3">
                  <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">{game}</p>
                  <div className="space-y-1">
                    {maps.map(m => (
                      <button key={m.id}
                        onClick={() => { setSelectedMapId(m.id); setShowMapPicker(false); }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-sans text-left transition-all ${
                          m.id === selectedMapId ? "bg-primary/15 text-primary border border-primary/40" : "text-foreground hover:bg-secondary/50 border border-transparent"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-sm flex-shrink-0" style={{ background: m.previewColor }} />
                        {m.name}
                        {m.tileUrl && <span className="ml-auto text-[9px] text-green-400 font-display uppercase">LIVE</span>}
                        {m.id === "custom" && <span className="ml-auto text-[9px] text-blue-400 font-display uppercase">UPLOAD</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {/* Custom upload */}
              <div className="border-t border-border pt-2 mt-2">
                <label className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded border border-dashed border-border hover:border-primary/50 text-xs text-muted-foreground hover:text-foreground transition-all">
                  <Layers className="w-3.5 h-3.5" />
                  Upload custom map image
                  <input type="file" accept="image/*" className="hidden" onChange={handleCustomUpload} />
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-border" />

        {/* Tool buttons */}
        {TOOLS.map(t => (
          <button key={t.id} onClick={() => setTool(t.id)} className={btnCls(tool === t.id)} title={`${t.label}${t.key ? ` (${t.key})` : ""}`}>
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}

        <div className="w-px h-5 bg-border" />

        {/* Symbol picker toggle */}
        <div className="relative">
          <button
            onClick={() => setShowSymbolPicker(p => !p)}
            className={btnCls(showSymbolPicker || tool === "marker")}
            title="NATO Symbols"
          >
            <Flag className="w-4 h-4" />
            <span className="hidden sm:inline">Symbols</span>
          </button>
          {showSymbolPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-2xl p-3 w-64">
              <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">Friendly</p>
              <div className="grid grid-cols-4 gap-1 mb-3">
                {NATO_SYMBOLS.filter(s => !s.key.startsWith("enemy_") && s.key !== "obj" && s.key !== "danger" && s.key !== "mine" && s.key !== "cache").map(sym => (
                  <button key={sym.key}
                    onClick={() => placeSymbol(sym.key)}
                    className="flex flex-col items-center gap-0.5 p-1.5 rounded border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all"
                    title={sym.label}
                  >
                    <span style={{ color: sym.color, fontFamily: "monospace", fontSize: 14, fontWeight: "bold" }}>{sym.shape}</span>
                    <span className="text-[8px] text-muted-foreground font-sans">{sym.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-display font-bold uppercase tracking-widest text-red-400 mb-2">Enemy</p>
              <div className="grid grid-cols-4 gap-1 mb-3">
                {NATO_SYMBOLS.filter(s => s.key.startsWith("enemy_")).map(sym => (
                  <button key={sym.key}
                    onClick={() => placeSymbol(sym.key)}
                    className="flex flex-col items-center gap-0.5 p-1.5 rounded border border-border hover:border-red-500/50 hover:bg-red-500/10 transition-all"
                    title={sym.label}
                  >
                    <span style={{ color: sym.color, fontFamily: "monospace", fontSize: 14, fontWeight: "bold" }}>{sym.shape}</span>
                    <span className="text-[8px] text-muted-foreground font-sans">{sym.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-display font-bold uppercase tracking-widest text-yellow-400 mb-2">Control / Terrain</p>
              <div className="grid grid-cols-4 gap-1">
                {NATO_SYMBOLS.filter(s => ["obj","rally","fob","cache","lz","danger","mine"].includes(s.key)).map(sym => (
                  <button key={sym.key}
                    onClick={() => placeSymbol(sym.key)}
                    className="flex flex-col items-center gap-0.5 p-1.5 rounded border border-border hover:border-yellow-500/50 hover:bg-yellow-500/10 transition-all"
                    title={sym.label}
                  >
                    <span style={{ color: sym.color, fontFamily: "monospace", fontSize: 14, fontWeight: "bold" }}>{sym.shape}</span>
                    <span className="text-[8px] text-muted-foreground font-sans">{sym.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-border" />

        {/* Colour picker */}
        <div className="flex items-center gap-1">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              style={{ background: c, width: 16, height: 16, borderRadius: 3, border: color === c ? "2px solid white" : "1px solid rgba(255,255,255,0.2)" }}
              title={c}
            />
          ))}
        </div>

        {/* Line width */}
        <div className="flex items-center gap-1">
          {[1, 2, 4, 6].map(w => (
            <button key={w} onClick={() => setLineWidth(w)}
              className={`w-6 h-6 flex items-center justify-center rounded border transition-all ${lineWidth === w ? "border-primary/60 bg-primary/15" : "border-border hover:bg-secondary/50"}`}
            >
              <div style={{ width: Math.min(16, w * 3), height: w, background: "white", borderRadius: 99 }} />
            </button>
          ))}
        </div>

        {/* Dashed toggle */}
        <button onClick={() => setDashed(d => !d)} className={btnCls(dashed)} title="Dashed line">
          <span style={{ fontFamily: "monospace", letterSpacing: 2 }}>- -</span>
        </button>

        <div className="w-px h-5 bg-border" />

        {/* View toggles */}
        <button onClick={() => setShowGrid(g => !g)} className={btnCls(showGrid)} title="Grid">
          <Layers className="w-4 h-4" />
        </button>
        <button onClick={() => setShowCompass(c => !c)} className={btnCls(showCompass)} title="Compass">
          <Compass className="w-4 h-4" />
        </button>

        {/* Zoom */}
        <button onClick={() => setView(v => ({ ...v, scale: Math.max(0.1, v.scale * 0.8) }))} className={btnCls(false)} title="Zoom out (scroll)">
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-xs text-muted-foreground font-mono w-10 text-center">{Math.round(view.scale * 100)}%</span>
        <button onClick={() => setView(v => ({ ...v, scale: Math.min(20, v.scale * 1.25) }))} className={btnCls(false)} title="Zoom in (scroll)">
          <Plus className="w-4 h-4" />
        </button>
        <button onClick={() => setView(v => ({ ...v, scale: 1, ox: 0, oy: 0 }))} className={btnCls(false)} title="Reset view">
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-border" />

        {/* Actions */}
        {selectedId && (
          <button onClick={() => { setElements(p => p.filter(e => e.id !== selectedId)); setSelectedId(null); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all text-xs font-display font-bold uppercase tracking-wider"
            title="Delete selected (Del)"
          >
            <Trash2 className="w-4 h-4" /> Del
          </button>
        )}
        <button onClick={() => { if (window.confirm("Clear all markings?")) setElements([]); }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-all text-xs font-display font-bold uppercase tracking-wider"
          title="Clear all"
        >
          <X className="w-4 h-4" />
        </button>
        <button onClick={exportPng}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-all text-xs font-display font-bold uppercase tracking-wider"
          title="Export PNG"
        >
          <Download className="w-4 h-4" /> Export
        </button>
        <button onClick={savePlan}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/15 border border-primary/50 text-primary hover:bg-primary/25 transition-all text-xs font-display font-bold uppercase tracking-wider"
          title="Save plan"
        >
          <Save className="w-4 h-4" /> Save
        </button>
      </div>

      {/* ── Canvas area ──────────────────────────────────────────────────── */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#0d0d0d]"
        style={{ cursor: tool === "pan" ? (panStart.current ? "grabbing" : "grab") : tool === "select" ? "default" : "crosshair" }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          style={{ display: "block", width: "100%", height: "100%" }}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={() => { panStart.current = null; drawing.current = false; dragElementId.current = null; }}
          onWheel={onWheel}
        />

        {/* Ruler status */}
        {tool === "ruler" && rulerPoints.length === 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-card border border-yellow-500/40 rounded text-xs text-yellow-400 font-display font-bold uppercase tracking-wider">
            Click second point to measure distance
          </div>
        )}

        {/* Marker label prompt modal */}
        {labelPrompt && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="bg-card border border-border rounded-lg p-5 w-72 shadow-2xl">
              <p className="text-xs font-display font-bold uppercase tracking-widest mb-1">Select Symbol</p>
              <div className="grid grid-cols-5 gap-1 mb-3 max-h-32 overflow-y-auto">
                {NATO_SYMBOLS.map(sym => (
                  <button key={sym.key}
                    onClick={() => { pendingSymbolRef.current = sym.key; }}
                    className={`flex flex-col items-center gap-0.5 p-1 rounded border transition-all ${pendingSymbolRef.current === sym.key ? "border-primary/60 bg-primary/15" : "border-border hover:bg-secondary/50"}`}
                    title={sym.label}
                  >
                    <span style={{ color: sym.color, fontFamily: "monospace", fontSize: 12, fontWeight: "bold" }}>{sym.shape}</span>
                    <span className="text-[7px] text-muted-foreground">{sym.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs font-display font-bold uppercase tracking-widest mb-1.5">Label (optional)</p>
              <input
                autoFocus
                className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm font-sans text-foreground mb-3"
                placeholder="e.g. 1 SECT, Alpha, HQ"
                value={pendingLabel}
                onChange={e => setPendingLabel(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") confirmLabel(); if (e.key === "Escape") { setLabelPrompt(null); setPendingLabel(""); } }}
              />
              <div className="flex gap-2">
                <button onClick={confirmLabel}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-primary/15 border border-primary/50 text-primary rounded px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wider hover:bg-primary/25 transition-all">
                  <Check className="w-3.5 h-3.5" /> Place
                </button>
                <button onClick={() => { setLabelPrompt(null); setPendingLabel(""); }}
                  className="px-3 py-1.5 border border-border rounded text-muted-foreground text-xs font-display font-bold uppercase tracking-wider hover:text-foreground transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tool hint bar */}
        <div className="absolute bottom-2 right-16 flex items-center gap-3 text-[10px] text-muted-foreground font-sans pointer-events-none">
          <span>Scroll = zoom</span>
          <span>Del = delete selected</span>
          <span>Esc = deselect</span>
        </div>
      </div>
    </div>
  );
}
