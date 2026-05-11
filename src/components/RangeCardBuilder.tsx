import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  ArrowLeft, Plus, Trash2, Download, RotateCcw, Crosshair,
  Move, Save, FolderOpen, X, Check, Loader2, FileText, Pen, Eraser, Lock, Unlock
} from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";

// ─── Types ────────────────────────────────────────────────────────────────────
type SymbolType =
  | "point_target" | "linear_target" | "building" | "squad_pos"
  | "platoon_pos"  | "company_pos"   | "fo_lp_op" | "command_post"
  | "tower"        | "medical"       | "church"
  | "ap_mine"      | "at_mine"       | "claymore"  | "tripwire"
  | "parachute_flare"     | "illum_flare"   | "trip_flare"
  | "sector_limit" | "grazing_fire"  | "pdf_arrow"
  | "wire_tactical"| "wire_protective" | "minefield";

const SYMBOL_MODE: Record<SymbolType,"point"|"drag"> = {
  point_target:"point", linear_target:"point", building:"point",
  squad_pos:"point",    platoon_pos:"point",   company_pos:"point",
  fo_lp_op:"point",     command_post:"point",  tower:"point",
  medical:"point",      church:"point",
  ap_mine:"point",      at_mine:"point",       claymore:"point",
  tripwire:"drag",      parachute_flare:"point",      illum_flare:"point",
  trip_flare:"point",
  sector_limit:"drag",  grazing_fire:"drag",   pdf_arrow:"drag",
  wire_tactical:"drag", wire_protective:"drag",minefield:"drag",
};

type TargetRow = {
  id: string; ser: number; gridRef: string; bearing: string;
  tgtDec: string; rangem: string; angleOfSight: string; elevation: string;
  symbolType: SymbolType; polarX: number; polarY: number;
  endX?: number; endY?: number;
};

type Meta = {
  title: string; ownPositionGR: string; aimingPoint: string; aimingGR: string;
  aimingBearings: string; aimingDescrip: string; aimingRange: string;
  madeOutBy: string; date: string; mapSheet: string; scale: string;
  maxRangeM: number;
};

type DrawStroke = {
  id: string;
  points: {x:number;y:number}[];
  color: string;
  width: number;
};

const SYMS: {id:SymbolType;label:string;color:string;group:string}[] = [
  // Targets
  {id:"point_target",    label:"Point Target",        color:"#ef4444",group:"Targets"},
  {id:"linear_target",   label:"Linear Target",       color:"#f97316",group:"Targets"},
  // Positions
  {id:"squad_pos",       label:"Squad Position",      color:"#60a5fa",group:"Positions"},
  {id:"platoon_pos",     label:"Platoon Position",    color:"#3b82f6",group:"Positions"},
  {id:"company_pos",     label:"Company Position",    color:"#2563eb",group:"Positions"},
  {id:"fo_lp_op",        label:"FO / LP / OP",        color:"#4ade80",group:"Positions"},
  {id:"command_post",    label:"Command Post",        color:"#a78bfa",group:"Positions"},
  // Structures
  {id:"tower",           label:"Tower",               color:"#fbbf24",group:"Structures"},
  {id:"building",        label:"Building",            color:"#94a3b8",group:"Structures"},
  {id:"medical",         label:"Medical",             color:"#34d399",group:"Structures"},
  {id:"church",          label:"Church",              color:"#c084fc",group:"Structures"},
  // Obstacles & IED
  {id:"ap_mine",         label:"AP Mine",             color:"#f87171",group:"Obstacles"},
  {id:"at_mine",         label:"AT Mine",             color:"#fb923c",group:"Obstacles"},
  {id:"claymore",        label:"Claymore",            color:"#fde047",group:"Obstacles"},
  {id:"tripwire",        label:"Tripwire (drag)",     color:"#a8a29e",group:"Obstacles"},
  {id:"parachute_flare",    label:"Parachute Flare",     color:"#f472b6",group:"Signals"},
  {id:"illum_flare",     label:"Illum Flare",         color:"#facc15",group:"Signals"},
  {id:"trip_flare",      label:"Trip Flare",          color:"#fb923c",group:"Signals"},
  {id:"minefield",       label:"Minefield (drag)",    color:"#ef4444",group:"Obstacles"},
  // Lines
  {id:"sector_limit",    label:"Sector Limit (drag)", color:"#f59e0b",group:"Lines"},
  {id:"grazing_fire",    label:"Grazing Fire (drag)", color:"#ef4444",group:"Lines"},
  {id:"pdf_arrow",       label:"PDF Arrow (drag)",    color:"#f43f5e",group:"Lines"},
  {id:"wire_tactical",   label:"Tac Wire (drag)",     color:"#a16207",group:"Lines"},
  {id:"wire_protective", label:"Prot Wire (drag)",    color:"#92400e",group:"Lines"},
];

// ─── Canvas drawing ───────────────────────────────────────────────────────────
function arrowHead(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,sz=10){
  const a=Math.atan2(y2-y1,x2-x1);
  ctx.beginPath();
  ctx.moveTo(x2-sz*Math.cos(a-.38),y2-sz*Math.sin(a-.38));
  ctx.lineTo(x2,y2);
  ctx.lineTo(x2-sz*Math.cos(a+.38),y2-sz*Math.sin(a+.38));
  ctx.stroke();
}

function drawDrag(ctx:CanvasRenderingContext2D,type:SymbolType,ox:number,oy:number,ex:number,ey:number,color:string,preview=false){
  ctx.save();
  ctx.strokeStyle=color; ctx.fillStyle=color;
  ctx.lineWidth=preview?1.5:2; ctx.lineCap="round"; ctx.lineJoin="round";
  if(preview) ctx.globalAlpha=0.55;
  const len=Math.sqrt((ex-ox)**2+(ey-oy)**2);
  const ang=Math.atan2(ey-oy,ex-ox);
  if(type==="sector_limit"){
    ctx.setLineDash([7,4]);
    ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ox+Math.cos(ang-Math.PI/6)*len,oy+Math.sin(ang-Math.PI/6)*len);ctx.stroke();
    ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ox+Math.cos(ang+Math.PI/6)*len,oy+Math.sin(ang+Math.PI/6)*len);ctx.stroke();
    ctx.setLineDash([]);
    ctx.font="bold 9px monospace";ctx.textAlign="center";ctx.textBaseline="top";
    ctx.fillText("SECTOR LIMIT",ox+Math.cos(ang)*len*.5,oy+Math.sin(ang)*len*.5+4);
  } else if(type==="grazing_fire"){
    ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ex,ey);ctx.stroke();
    arrowHead(ctx,ox,oy,ex,ey,10);
    const offX=Math.sin(ang)*8,offY=-Math.cos(ang)*8;
    ctx.setLineDash([6,4]);
    ctx.beginPath();ctx.moveTo(ox+offX,oy+offY);ctx.lineTo(ex+offX,ey+offY);ctx.stroke();
    ctx.setLineDash([]);
  } else if(type==="pdf_arrow"){
    ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ex,ey);ctx.stroke();
    arrowHead(ctx,ox,oy,ex,ey,12);
    ctx.font="bold 10px monospace";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText("PDF",(ox+ex)/2+Math.sin(ang)*14,(oy+ey)/2-Math.cos(ang)*14);
  } else if(type==="tripwire"){
    ctx.setLineDash([3,5]);ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ex,ey);ctx.stroke();ctx.setLineDash([]);
    // tick marks
    const steps=Math.max(2,Math.floor(len/20));
    for(let i=0;i<=steps;i++){const t=i/steps,px=ox+(ex-ox)*t,py=oy+(ey-oy)*t;ctx.beginPath();ctx.moveTo(px-Math.sin(ang)*6,py+Math.cos(ang)*6);ctx.lineTo(px+Math.sin(ang)*6,py-Math.cos(ang)*6);ctx.stroke();}
    ctx.font="bold 8px monospace";ctx.textAlign="center";ctx.textBaseline="top";
    ctx.fillText("TRIPWIRE",(ox+ex)/2+Math.sin(ang)*12,(oy+ey)/2-Math.cos(ang)*12+2);
  } else if(type==="minefield"){
    // dashed box along the drag line
    ctx.setLineDash([6,3]);ctx.lineWidth=1.8;
    const perp=Math.PI/2,w=16;
    ctx.beginPath();
    ctx.moveTo(ox+Math.cos(perp+ang)*w,oy+Math.sin(perp+ang)*w);
    ctx.lineTo(ex+Math.cos(perp+ang)*w,ey+Math.sin(perp+ang)*w);
    ctx.lineTo(ex-Math.cos(perp+ang)*w,ey-Math.sin(perp+ang)*w);
    ctx.lineTo(ox-Math.cos(perp+ang)*w,oy-Math.sin(perp+ang)*w);
    ctx.closePath();ctx.stroke();ctx.setLineDash([]);
    // X marks inside
    const steps=Math.max(2,Math.floor(len/24));
    for(let i=0;i<steps;i++){const t=(i+.5)/steps,px=ox+(ex-ox)*t,py=oy+(ey-oy)*t;ctx.font="bold 12px monospace";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("×",px,py);}
    ctx.font="bold 8px monospace";ctx.textAlign="center";ctx.textBaseline="top";
    ctx.fillText("MINEFIELD",(ox+ex)/2,(oy+ey)/2+w+3);
  } else if(type==="wire_tactical"){
    ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ex,ey);ctx.stroke();
    const steps=Math.max(3,Math.floor(len/18));
    for(let i=0;i<=steps;i++){const t=i/steps,px=ox+(ex-ox)*t,py=oy+(ey-oy)*t;ctx.beginPath();ctx.moveTo(px+Math.sin(ang)*5-Math.cos(ang)*3,py-Math.cos(ang)*5-Math.sin(ang)*3);ctx.lineTo(px,py);ctx.lineTo(px+Math.sin(ang)*5+Math.cos(ang)*3,py-Math.cos(ang)*5+Math.sin(ang)*3);ctx.stroke();}
  } else if(type==="wire_protective"){
    ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ex,ey);ctx.stroke();ctx.setLineDash([]);
    const steps=Math.max(2,Math.floor(len/22));
    for(let i=0;i<=steps;i++){const t=i/steps,px=ox+(ex-ox)*t,py=oy+(ey-oy)*t;ctx.beginPath();ctx.moveTo(px-Math.cos(ang)*4+Math.sin(ang)*5,py-Math.sin(ang)*4-Math.cos(ang)*5);ctx.lineTo(px+Math.cos(ang)*4+Math.sin(ang)*5,py+Math.sin(ang)*4-Math.cos(ang)*5);ctx.stroke();}
  }
  ctx.restore();
}

function drawPoint(ctx:CanvasRenderingContext2D,type:SymbolType,cx:number,cy:number,color:string,sz=11){
  ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;ctx.lineCap="round";ctx.lineJoin="round";
  if(type==="point_target"){
    ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(cx-sz,cy);ctx.lineTo(cx+sz,cy);ctx.moveTo(cx,cy-sz);ctx.lineTo(cx,cy+sz);ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,3.5,0,Math.PI*2);ctx.fill();
  } else if(type==="linear_target"){
    ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(cx-sz*1.8,cy);ctx.lineTo(cx+sz*1.8,cy);ctx.moveTo(cx-sz*1.8,cy-6);ctx.lineTo(cx-sz*1.8,cy+6);ctx.moveTo(cx+sz*1.8,cy-6);ctx.lineTo(cx+sz*1.8,cy+6);ctx.stroke();
  } else if(type==="squad_pos"){
    ctx.beginPath();ctx.ellipse(cx,cy,sz*1.6,sz*.9,0,0,Math.PI*2);ctx.stroke();
  } else if(type==="platoon_pos"){
    ctx.beginPath();ctx.ellipse(cx,cy,sz*1.6,sz*.9,0,0,Math.PI*2);ctx.stroke();[-5,0,5].forEach(dx=>{ctx.beginPath();ctx.arc(cx+dx,cy-sz*.9-5,2.5,0,Math.PI*2);ctx.fill();});
  } else if(type==="company_pos"){
    ctx.beginPath();ctx.ellipse(cx,cy,sz*1.6,sz*.9,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,cy-sz*.9);ctx.lineTo(cx,cy-sz*.9-11);ctx.moveTo(cx-5,cy-sz*.9-6);ctx.lineTo(cx,cy-sz*.9-11);ctx.lineTo(cx+5,cy-sz*.9-6);ctx.stroke();
  } else if(type==="fo_lp_op"){
    ctx.beginPath();ctx.moveTo(cx,cy-sz*1.2);ctx.lineTo(cx+sz*1.1,cy+sz*.7);ctx.lineTo(cx-sz*1.1,cy+sz*.7);ctx.closePath();ctx.stroke();
  } else if(type==="command_post"){
    ctx.strokeRect(cx-sz*1.1,cy-sz*.9,sz*2.2,sz*1.8);ctx.font=`bold ${Math.round(sz*1.1)}px monospace`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("CP",cx,cy+1);
  } else if(type==="tower"){
    ctx.beginPath();ctx.arc(cx,cy,sz*.8,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,3,0,Math.PI*2);ctx.fill();
  } else if(type==="building"){
    ctx.fillRect(cx-sz,cy-sz,sz*2,sz*2);
  } else if(type==="medical"){
    ctx.strokeRect(cx-sz,cy-sz,sz*2,sz*2);ctx.strokeRect(cx-sz*.35,cy-sz,sz*.7,sz*2);ctx.strokeRect(cx-sz,cy-sz*.35,sz*2,sz*.7);
  } else if(type==="church"){
    ctx.fillRect(cx-sz*.9,cy-sz*.6,sz*1.8,sz*1.4);
    ctx.strokeStyle=color+"55";ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(cx,cy-sz*.6-10);ctx.lineTo(cx,cy-sz*.6);ctx.moveTo(cx-5,cy-sz*.6-4);ctx.lineTo(cx+5,cy-sz*.6-4);ctx.stroke();
  } else if(type==="ap_mine"){
    // Circle with X inside — AP mine symbol
    ctx.beginPath();ctx.arc(cx,cy,sz*.85,0,Math.PI*2);ctx.stroke();
    ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(cx-sz*.5,cy-sz*.5);ctx.lineTo(cx+sz*.5,cy+sz*.5);ctx.moveTo(cx+sz*.5,cy-sz*.5);ctx.lineTo(cx-sz*.5,cy+sz*.5);ctx.stroke();
    ctx.font="bold 7px monospace";ctx.textAlign="center";ctx.textBaseline="top";ctx.fillText("AP",cx,cy+sz+2);
  } else if(type==="at_mine"){
    // Square with dot — AT mine
    ctx.strokeRect(cx-sz*.85,cy-sz*.85,sz*1.7,sz*1.7);
    ctx.beginPath();ctx.arc(cx,cy,sz*.25,0,Math.PI*2);ctx.fill();
    ctx.font="bold 7px monospace";ctx.textAlign="center";ctx.textBaseline="top";ctx.fillText("AT",cx,cy+sz+2);
  } else if(type==="claymore"){
    // Curved C-shape pointing forward (north)
    ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(cx,cy,sz*.9,Math.PI*1.2,Math.PI*1.8);ctx.stroke();
    // front hazard arc
    ctx.strokeStyle=color+"55";ctx.setLineDash([3,4]);ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(cx,cy-sz*1.5,sz*1.4,Math.PI*1.1,Math.PI*1.9);ctx.stroke();ctx.setLineDash([]);
    ctx.font="bold 7px monospace";ctx.textAlign="center";ctx.textBaseline="top";ctx.fillStyle=color;ctx.fillText("CL",cx,cy+sz+2);
  } else if(type==="parachute_flare"){
    // Parachute flare: canopy dome + suspension lines + payload
    ctx.lineWidth=2;
    // Canopy arc (dome)
    ctx.beginPath();ctx.arc(cx,cy-sz*.4,sz*.9,Math.PI,0);ctx.stroke();
    // Left suspension line
    ctx.beginPath();ctx.moveTo(cx-sz*.9,cy-sz*.4);ctx.lineTo(cx-sz*.2,cy+sz*.7);ctx.stroke();
    // Right suspension line
    ctx.beginPath();ctx.moveTo(cx+sz*.9,cy-sz*.4);ctx.lineTo(cx+sz*.2,cy+sz*.7);ctx.stroke();
    // Payload box
    ctx.beginPath();ctx.rect(cx-sz*.22,cy+sz*.7,sz*.44,sz*.44);ctx.stroke();
    // Glow burst
    ctx.globalAlpha=0.35;ctx.fillStyle=color;ctx.beginPath();ctx.arc(cx,cy-sz*.4,sz*.9,Math.PI,0);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
    ctx.font="bold 7px monospace";ctx.textAlign="center";ctx.textBaseline="top";ctx.fillStyle=color;ctx.fillText("PARA",cx,cy+sz*1.3);
  } else if(type==="illum_flare"){
    // Starburst
    for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*4,cy+Math.sin(a)*4);ctx.lineTo(cx+Math.cos(a)*sz*1.1,cy+Math.sin(a)*sz*1.1);ctx.stroke();}
    ctx.beginPath();ctx.arc(cx,cy,4,0,Math.PI*2);ctx.fill();
    ctx.font="bold 7px monospace";ctx.textAlign="center";ctx.textBaseline="top";ctx.fillText("ILLUM",cx,cy+sz+2);
  } else if(type==="trip_flare"){
    // Small diamond + spark lines
    ctx.beginPath();ctx.moveTo(cx,cy-sz*.9);ctx.lineTo(cx+sz*.6,cy);ctx.lineTo(cx,cy+sz*.9);ctx.lineTo(cx-sz*.6,cy);ctx.closePath();ctx.stroke();
    ctx.lineWidth=1.4;[0,120,240].forEach(deg=>{const r=deg*Math.PI/180;ctx.beginPath();ctx.moveTo(cx+Math.cos(r)*sz*.6,cy+Math.sin(r)*sz*.6);ctx.lineTo(cx+Math.cos(r)*sz*1.3,cy+Math.sin(r)*sz*1.3);ctx.stroke();});
    ctx.font="bold 7px monospace";ctx.textAlign="center";ctx.textBaseline="top";ctx.fillText("T-FLR",cx,cy+sz+2);
  } else {
    ctx.beginPath();ctx.arc(cx,cy,sz*.6,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

function uid(){return Math.random().toString(36).slice(2,9);}
function toBR(nx:number,ny:number,maxRange:number){
  const dx=nx-.5,dy=ny-.5;
  return{
    bearing:String(Math.round(((Math.atan2(dx,-dy)*180/Math.PI)+360)%360)),
    rangem:String(Math.round(Math.min(Math.sqrt(dx*dx+dy*dy)/.48,1)*maxRange)),
  };
}
const EMPTY_ROW=(ser:number):TargetRow=>({id:uid(),ser,gridRef:"",bearing:"",tgtDec:"",rangem:"",angleOfSight:"",elevation:"",symbolType:"point_target",polarX:0,polarY:0});

// ─── Polar chart (SVG — resolution-independent) ──────────────────────────────
interface PolarProps {
  targets: TargetRow[];
  maxRangeM: number;
  selSym: SymbolType;
  tool: string;
  dragOrigin: {x:number;y:number}|null;
  dragCur:    {x:number;y:number}|null;
  onMouseDown: (e:React.MouseEvent<SVGSVGElement>) => void;
  onMouseMove: (e:React.MouseEvent<SVGSVGElement>) => void;
  onMouseUp:   (e:React.MouseEvent<SVGSVGElement>) => void;
  svgRef: React.RefObject<SVGSVGElement>;
}

function SvgPoint({type,cx,cy,color,sz=11}:{type:SymbolType;cx:number;cy:number;color:string;sz?:number}){
  const s=sz;
  if(type==="point_target")    return <g stroke={color} fill={color} strokeWidth={2.2}><line x1={cx-s} y1={cy} x2={cx+s} y2={cy}/><line x1={cx} y1={cy-s} x2={cx} y2={cy+s}/><circle cx={cx} cy={cy} r={3.5}/></g>;
  if(type==="linear_target")   return <g stroke={color} fill="none" strokeWidth={2.2}><line x1={cx-s*1.8} y1={cy} x2={cx+s*1.8} y2={cy}/><line x1={cx-s*1.8} y1={cy-6} x2={cx-s*1.8} y2={cy+6}/><line x1={cx+s*1.8} y1={cy-6} x2={cx+s*1.8} y2={cy+6}/></g>;
  if(type==="squad_pos")       return <ellipse cx={cx} cy={cy} rx={s*1.6} ry={s*.9} stroke={color} fill="none" strokeWidth={2}/>;
  if(type==="platoon_pos")     return <g stroke={color} fill={color} strokeWidth={2}><ellipse cx={cx} cy={cy} rx={s*1.6} ry={s*.9} fill="none"/><circle cx={cx-5} cy={cy-s*.9-5} r={2.5}/><circle cx={cx} cy={cy-s*.9-5} r={2.5}/><circle cx={cx+5} cy={cy-s*.9-5} r={2.5}/></g>;
  if(type==="company_pos")     return <g stroke={color} fill="none" strokeWidth={2}><ellipse cx={cx} cy={cy} rx={s*1.6} ry={s*.9}/><line x1={cx} y1={cy-s*.9} x2={cx} y2={cy-s*.9-11}/><polyline points={`${cx-5},${cy-s*.9-6} ${cx},${cy-s*.9-11} ${cx+5},${cy-s*.9-6}`}/></g>;
  if(type==="fo_lp_op")        return <polygon points={`${cx},${cy-s*1.2} ${cx+s*1.1},${cy+s*.7} ${cx-s*1.1},${cy+s*.7}`} stroke={color} fill="none" strokeWidth={2}/>;
  if(type==="command_post")    return <g stroke={color} fill={color} strokeWidth={2}><rect x={cx-s*1.1} y={cy-s*.9} width={s*2.2} height={s*1.8} fill="none"/><text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="middle" fontSize={s*1.1} fontFamily="monospace" fontWeight="bold" stroke="none">{`CP`}</text></g>;
  if(type==="tower")           return <g stroke={color} fill={color} strokeWidth={2}><circle cx={cx} cy={cy} r={s*.8} fill="none"/><circle cx={cx} cy={cy} r={3}/></g>;
  if(type==="building")        return <rect x={cx-s} y={cy-s} width={s*2} height={s*2} fill={color}/>;
  if(type==="medical")         return <g stroke={color} fill="none" strokeWidth={2}><rect x={cx-s} y={cy-s} width={s*2} height={s*2}/><rect x={cx-s*.35} y={cy-s} width={s*.7} height={s*2}/><rect x={cx-s} y={cy-s*.35} width={s*2} height={s*.7}/></g>;
  if(type==="ap_mine")         return <g stroke={color} fill={color} strokeWidth={2}><circle cx={cx} cy={cy} r={s*.85} fill="none"/><line x1={cx-s*.5} y1={cy-s*.5} x2={cx+s*.5} y2={cy+s*.5} strokeWidth={1.6}/><line x1={cx+s*.5} y1={cy-s*.5} x2={cx-s*.5} y2={cy+s*.5} strokeWidth={1.6}/><text x={cx} y={cy+s+9} textAnchor="middle" fontSize={7} fontFamily="monospace" fontWeight="bold" stroke="none">{`AP`}</text></g>;
  if(type==="at_mine")         return <g stroke={color} fill={color} strokeWidth={2}><rect x={cx-s*.85} y={cy-s*.85} width={s*1.7} height={s*1.7} fill="none"/><circle cx={cx} cy={cy} r={s*.25}/><text x={cx} y={cy+s+9} textAnchor="middle" fontSize={7} fontFamily="monospace" fontWeight="bold" stroke="none">{`AT`}</text></g>;
  if(type==="parachute_flare") return <g stroke={color} fill="none" strokeWidth={2}><path d={`M${cx-s*.9},${cy-s*.4} A${s*.9},${s*.9} 0 0,1 ${cx+s*.9},${cy-s*.4}`}/><line x1={cx-s*.9} y1={cy-s*.4} x2={cx-s*.2} y2={cy+s*.7}/><line x1={cx+s*.9} y1={cy-s*.4} x2={cx+s*.2} y2={cy+s*.7}/><rect x={cx-s*.22} y={cy+s*.7} width={s*.44} height={s*.44}/><path d={`M${cx-s*.9},${cy-s*.4} A${s*.9},${s*.9} 0 0,1 ${cx+s*.9},${cy-s*.4}`} fill={color} fillOpacity={0.3}/><text x={cx} y={cy+s*1.3+9} textAnchor="middle" fontSize={7} fontFamily="monospace" fontWeight="bold" stroke="none" fill={color}>{`PARA`}</text></g>;
  if(type==="illum_flare"){
    const rays=Array.from({length:8},(_,i)=>{const a=(i/8)*Math.PI*2;return <line key={i} x1={cx+Math.cos(a)*4} y1={cy+Math.sin(a)*4} x2={cx+Math.cos(a)*s*1.1} y2={cy+Math.sin(a)*s*1.1}/>;});
    return <g stroke={color} fill={color} strokeWidth={2}>{rays}<circle cx={cx} cy={cy} r={4}/><text x={cx} y={cy+s+9} textAnchor="middle" fontSize={7} fontFamily="monospace" fontWeight="bold" stroke="none">{`ILLUM`}</text></g>;
  }
  if(type==="trip_flare"){
    const sparks=[0,120,240].map((d,i)=>{const r=d*Math.PI/180;return <line key={i} x1={cx+Math.cos(r)*s*.6} y1={cy+Math.sin(r)*s*.6} x2={cx+Math.cos(r)*s*1.3} y2={cy+Math.sin(r)*s*1.3} strokeWidth={1.4}/>;});
    return <g stroke={color} fill="none" strokeWidth={2}><polygon points={`${cx},${cy-s*.9} ${cx+s*.6},${cy} ${cx},${cy+s*.9} ${cx-s*.6},${cy}`}/>{sparks}<text x={cx} y={cy+s+9} textAnchor="middle" fontSize={7} fontFamily="monospace" fontWeight="bold" fill={color} stroke="none">{`T-FLR`}</text></g>;
  }
  return <circle cx={cx} cy={cy} r={s*.6} fill={color}/>;
}

function SvgDragLine({type,ox,oy,ex,ey,color,preview=false}:{type:SymbolType;ox:number;oy:number;ex:number;ey:number;color:string;preview?:boolean}){
  const len=Math.sqrt((ex-ox)**2+(ey-oy)**2);
  const ang=Math.atan2(ey-oy,ex-ox);
  const op=preview?0.55:1;
  const lw=preview?1.5:2;
  const mkArrow=(x1:number,y1:number,x2:number,y2:number,sz:number)=>{const a=Math.atan2(y2-y1,x2-x1);return `M${x2-sz*Math.cos(a-.38)},${y2-sz*Math.sin(a-.38)} L${x2},${y2} L${x2-sz*Math.cos(a+.38)},${y2-sz*Math.sin(a+.38)}`;};
  if(type==="sector_limit"){
    const p1x=ox+Math.cos(ang-Math.PI/6)*len,p1y=oy+Math.sin(ang-Math.PI/6)*len;
    const p2x=ox+Math.cos(ang+Math.PI/6)*len,p2y=oy+Math.sin(ang+Math.PI/6)*len;
    const mx=ox+Math.cos(ang)*len*.5,my=oy+Math.sin(ang)*len*.5;
    return <g stroke={color} fill={color} strokeWidth={lw} opacity={op}><line x1={ox} y1={oy} x2={p1x} y2={p1y} strokeDasharray="7 4"/><line x1={ox} y1={oy} x2={p2x} y2={p2y} strokeDasharray="7 4"/><text x={mx} y={my+4} textAnchor="middle" fontSize={9} fontFamily="monospace" fontWeight="bold" stroke="none">{`SECTOR LIMIT`}</text></g>;
  }
  if(type==="grazing_fire"){
    const offX=Math.sin(ang)*8,offY=-Math.cos(ang)*8;
    return <g stroke={color} fill="none" strokeWidth={lw} opacity={op}><line x1={ox} y1={oy} x2={ex} y2={ey}/><path d={mkArrow(ox,oy,ex,ey,10)}/><line x1={ox+offX} y1={oy+offY} x2={ex+offX} y2={ey+offY} strokeDasharray="6 4"/></g>;
  }
  if(type==="pdf_arrow"){
    const mx=(ox+ex)/2+Math.sin(ang)*14,my=(oy+ey)/2-Math.cos(ang)*14;
    return <g stroke={color} fill={color} strokeWidth={2.5} opacity={op}><line x1={ox} y1={oy} x2={ex} y2={ey}/><path d={mkArrow(ox,oy,ex,ey,12)}/><text x={mx} y={my} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontFamily="monospace" fontWeight="bold" stroke="none">{`PDF`}</text></g>;
  }
  if(type==="tripwire"){
    const steps=Math.max(2,Math.floor(len/20));
    const ticks=Array.from({length:steps+1},(_,i)=>{const t=i/steps,px=ox+(ex-ox)*t,py=oy+(ey-oy)*t;return <line key={i} x1={px-Math.sin(ang)*6} y1={py+Math.cos(ang)*6} x2={px+Math.sin(ang)*6} y2={py-Math.cos(ang)*6}/>;});
    const mx=ox+(ex-ox)*.5+Math.sin(ang)*12,my=oy+(ey-oy)*.5-Math.cos(ang)*12+2;
    return <g stroke={color} fill={color} strokeWidth={1.5} opacity={op}><line x1={ox} y1={oy} x2={ex} y2={ey} strokeDasharray="3 5"/>{ticks}<text x={mx} y={my} textAnchor="middle" fontSize={8} fontFamily="monospace" fontWeight="bold" stroke="none">{`TRIPWIRE`}</text></g>;
  }
  if(type==="minefield"){
    const w=16,perp=Math.PI/2;
    const pts=`${ox+Math.cos(perp+ang)*w},${oy+Math.sin(perp+ang)*w} ${ex+Math.cos(perp+ang)*w},${ey+Math.sin(perp+ang)*w} ${ex-Math.cos(perp+ang)*w},${ey-Math.sin(perp+ang)*w} ${ox-Math.cos(perp+ang)*w},${oy-Math.sin(perp+ang)*w}`;
    const steps=Math.max(2,Math.floor(len/24));
    const xs=Array.from({length:steps},(_,i)=>{const t=(i+.5)/steps,px=ox+(ex-ox)*t,py=oy+(ey-oy)*t;return <text key={i} x={px} y={py} textAnchor="middle" dominantBaseline="middle" fontSize={12} fontFamily="monospace" fontWeight="bold" stroke="none">{`\u00d7`}</text>;});
    const mx=(ox+ex)/2,my=(oy+ey)/2+w+3;
    return <g stroke={color} fill={color} strokeWidth={1.8} opacity={op}><polygon points={pts} fill="none" strokeDasharray="6 3"/>{xs}<text x={mx} y={my} textAnchor="middle" fontSize={8} fontFamily="monospace" fontWeight="bold" stroke="none">{`MINEFIELD`}</text></g>;
  }
  if(type==="wire_tactical"){
    const steps=Math.max(3,Math.floor(len/18));
    const ticks=Array.from({length:steps+1},(_,i)=>{const t=i/steps,px=ox+(ex-ox)*t,py=oy+(ey-oy)*t;return <g key={i}><line x1={px+Math.sin(ang)*5-Math.cos(ang)*3} y1={py-Math.cos(ang)*5-Math.sin(ang)*3} x2={px} y2={py}/><line x1={px} y1={py} x2={px+Math.sin(ang)*5+Math.cos(ang)*3} y2={py-Math.cos(ang)*5+Math.sin(ang)*3}/></g>;});
    return <g stroke={color} fill="none" strokeWidth={lw} opacity={op}><line x1={ox} y1={oy} x2={ex} y2={ey}/>{ticks}</g>;
  }
  if(type==="wire_protective"){
    const steps=Math.max(2,Math.floor(len/22));
    const ticks=Array.from({length:steps+1},(_,i)=>{const t=i/steps,px=ox+(ex-ox)*t,py=oy+(ey-oy)*t;return <line key={i} x1={px-Math.cos(ang)*4+Math.sin(ang)*5} y1={py-Math.sin(ang)*4-Math.cos(ang)*5} x2={px+Math.cos(ang)*4+Math.sin(ang)*5} y2={py+Math.sin(ang)*4-Math.cos(ang)*5}/>;});
    return <g stroke={color} fill="none" strokeWidth={lw} opacity={op}><line x1={ox} y1={oy} x2={ex} y2={ey} strokeDasharray="5 4"/>{ticks}</g>;
  }
  return null;
}

function PolarChart({targets,maxRangeM,selSym,tool,dragOrigin,dragCur,onMouseDown,onMouseMove,onMouseUp,svgRef}:PolarProps){
  const VB=700;
  const cx=VB/2,cy=VB/2;
  const rx=VB*.44,ry=VB*.46;
  const rings=[.15,.35,.6,.88,1];
  const bearings=[0,45,90,135,180,225,270,315];
  const isDrag=SYMBOL_MODE[selSym]==="drag";
  const cursor=tool==="delete"?"pointer":tool==="move"?"grab":isDrag?(dragOrigin?"crosshair":"cell"):"crosshair";
  return(
    <svg ref={svgRef} viewBox={`0 0 ${VB} ${VB}`} preserveAspectRatio="xMidYMid meet"
      style={{width:"100%",height:"100%",display:"block",background:"#ffffff",cursor}}
      onMouseDown={onMouseDown as any} onMouseMove={onMouseMove as any}
      onMouseUp={onMouseUp as any} onMouseLeave={onMouseUp as any}>
      {/* Grid */}
      {Array.from({length:9},(_,i)=>(
        <g key={i}>
          <line x1={i*VB/8} y1={0} x2={i*VB/8} y2={VB} stroke="#d8dce4" strokeWidth={0.8}/>
          <line x1={0} y1={i*VB/8} x2={VB} y2={i*VB/8} stroke="#d8dce4" strokeWidth={0.8}/>
        </g>
      ))}
      {/* Bearing lines */}
      {bearings.map(deg=>{
        const rad=(deg-90)*Math.PI/180;
        return <line key={deg} x1={cx-Math.cos(rad)*VB} y1={cy-Math.sin(rad)*VB} x2={cx+Math.cos(rad)*VB} y2={cy+Math.sin(rad)*VB}
          stroke={deg%90===0?"#9aa3b2":"#c5cad5"} strokeWidth={deg%90===0?1.4:0.7}/>;
      })}
      {/* Concentric ellipses */}
      {rings.map((f,i)=>(
        <ellipse key={i} cx={cx} cy={cy} rx={rx*f} ry={ry*f}
          stroke={i===4?"#9aa0b0":i===3?"#667085":"#444a58"}
          strokeWidth={i===4?2:i===3?1.8:i===2?1.1:0.7} fill="none"/>
      ))}
      {/* Bearing labels */}
      {bearings.map(deg=>{
        const rad=(deg-90)*Math.PI/180;
        return <text key={deg} x={cx+Math.cos(rad)*(rx+26)} y={cy+Math.sin(rad)*(ry+26)}
          textAnchor="middle" dominantBaseline="middle" fontSize={13}
          fontFamily="Arial,sans-serif" fontWeight="bold" fill="#c8cdd8">{deg}&deg;</text>;
      })}
      {/* Range labels */}
      {[.15,.35,.6,.88].map((f,i)=>{
        const rng=Math.round(maxRangeM*(f/rings[3]));
        return <text key={i} x={cx} y={cy-ry*f-4} textAnchor="middle" dominantBaseline="auto"
          fontSize={10} fontFamily="Arial,sans-serif" fill="#667085">{rng}m</text>;
      })}
      <text x={cx} y={cy-ry-6} textAnchor="middle" dominantBaseline="auto"
        fontSize={12} fontFamily="Arial,sans-serif" fill="#8892a4">{maxRangeM}m</text>
      {/* Centre crosshair */}
      <g stroke="#9aa0b0" strokeWidth={1.6}>
        <line x1={cx-14} y1={cy} x2={cx+14} y2={cy}/>
        <line x1={cx} y1={cy-14} x2={cx} y2={cy+14}/>
        <circle cx={cx} cy={cy} r={4.5} fill="none"/>
      </g>
      <text x={cx} y={cy+10} textAnchor="middle" dominantBaseline="hanging"
        fontSize={9} fontFamily="monospace" fontWeight="bold" fill="#8892a4">OWN POS</text>
      {/* Targets — only render if placed (bearing or rangem set) */}
      {targets.filter(t=>t.bearing!==""||t.rangem!=="").map(t=>{
        const ox=t.polarX*VB,oy=t.polarY*VB;
        const sym=SYMS.find(s=>s.id===t.symbolType);
        const col=sym?.color??"#ef4444";
        return(
          <g key={t.id}>
            {SYMBOL_MODE[t.symbolType]==="drag"&&t.endX!=null&&t.endY!=null
              ?<SvgDragLine type={t.symbolType} ox={ox} oy={oy} ex={t.endX*VB} ey={t.endY*VB} color={col}/>
              :<><line x1={cx} y1={cy} x2={ox} y2={oy} stroke={col+"33"} strokeWidth={0.6} strokeDasharray="4 6"/>
                <SvgPoint type={t.symbolType} cx={ox} cy={oy} color={col}/></>
            }
            <text x={ox} y={oy-16} textAnchor="middle" dominantBaseline="auto"
              fontSize={11} fontFamily="Arial,sans-serif" fontWeight="bold" fill="#e2e8f0">{t.ser}</text>
          </g>
        );
      })}
      {/* Live drag preview */}
      {dragOrigin&&dragCur&&SYMBOL_MODE[selSym]==="drag"&&(()=>{
        const sym=SYMS.find(s=>s.id===selSym);
        return <SvgDragLine type={selSym} ox={dragOrigin.x*VB} oy={dragOrigin.y*VB}
          ex={dragCur.x*VB} ey={dragCur.y*VB} color={sym?.color??"#f59e0b"} preview/>;
      })()}
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface Props{group?:any;onBack?:()=>void;}

export default function RangeCardBuilder({group,onBack}:Props){
  const svgRef=useRef<SVGSVGElement>(null);
  const drawRef=useRef<HTMLCanvasElement>(null);
  const [meta,setMeta]=useState<Meta>({
    title:"RANGE CARD",ownPositionGR:"",aimingPoint:"",aimingGR:"",
    aimingBearings:"",aimingDescrip:"",aimingRange:"",
    madeOutBy:group?.owner_username??"",
    date:new Date().toISOString().slice(0,10),mapSheet:"",scale:"1:50000",maxRangeM:600,
  });
  const [targets,setTargets]=useState<TargetRow[]>(Array.from({length:12},(_,i)=>EMPTY_ROW(i+1)));
  const [selSym,setSelSym]=useState<SymbolType>("point_target");
  const [drawTool,setDrawTool]=useState<"pen"|"erase"|null>(null);
  const [penColor,setPenColor]=useState<string>("#ef4444");
  const [penWidth,setPenWidth]=useState<number>(2);
  const [strokes,setStrokes]=useState<DrawStroke[]>([]);
  const [activeStroke,setActiveStroke]=useState<DrawStroke|null>(null);
  const isDrawing=useRef(false);
  const [tool,setTool]=useState<"place"|"move"|"delete">("place");
  const [dragOrigin,setDragOrigin]=useState<{x:number;y:number}|null>(null);
  const [dragCur,setDragCur]=useState<{x:number;y:number}|null>(null);
  const [moving,setMoving]=useState<string|null>(null);
  const [savedCards,setSavedCards]=useState<any[]>([]);
  const [saving,setSaving]=useState(false);
  const [loadPanel,setLoadPanel]=useState(false);
  const [activeCardId,setActiveCardId]=useState<string|null>(null);
  const [saveMsg,setSaveMsg]=useState<{ok:boolean;text:string}|null>(null);
  const [locked,setLocked]=useState(false);
  const [showLegend,setShowLegend]=useState(true);
  const [exporting,setExporting]=useState(false);

  useEffect(()=>{
    if(!group?.id)return;
    apiFetch<any[]>(`/api/range-cards?path=${group.id}/range-cards`).then(r=>setSavedCards(Array.isArray(r)?r:[])).catch(()=>{});
  },[group?.id]);

  function showMsg(ok:boolean,text:string){setSaveMsg({ok,text});setTimeout(()=>setSaveMsg(null),3000);}

  async function saveCard(){
    if(!group?.id)return;setSaving(true);
    const payload={title:meta.title,group_name:group.name??group.id,own_position_gr:meta.ownPositionGR,aiming_point:meta.aimingPoint,aiming_gr:meta.aimingGR,aiming_bearings:meta.aimingBearings,aiming_descrip:meta.aimingDescrip,aiming_range:meta.aimingRange,made_out_by:meta.madeOutBy,date:meta.date,map_sheet:meta.mapSheet,scale:meta.scale,max_range_m:meta.maxRangeM,targets};
    try{
      if(activeCardId){await apiFetch(`/api/range-cards?path=${group.id}/range-cards/${activeCardId}`,{method:"PATCH",body:JSON.stringify(payload)});showMsg(true,"Updated.");}
      else{const res:any=await apiFetch(`/api/range-cards?path=${group.id}/range-cards`,{method:"POST",body:JSON.stringify(payload)});setActiveCardId(res?.id??null);showMsg(true,"Saved to Member HQ.");}
      const cards=await apiFetch<any[]>(`/api/range-cards?path=${group.id}/range-cards`).catch(()=>[]);
      setSavedCards(Array.isArray(cards)?cards:[]);
    }catch{showMsg(false,"Save failed.");}
    finally{setSaving(false);}
  }

  function loadCard(card:any){
    setMeta({title:card.title??"RANGE CARD",ownPositionGR:card.own_position_gr??"",aimingPoint:card.aiming_point??"",aimingGR:card.aiming_gr??"",aimingBearings:card.aiming_bearings??"",aimingDescrip:card.aiming_descrip??"",aimingRange:card.aiming_range??"",madeOutBy:card.made_out_by??"",date:card.date??new Date().toISOString().slice(0,10),mapSheet:card.map_sheet??"",scale:card.scale??"1:50000",maxRangeM:card.max_range_m??600});
    const rows=Array.isArray(card.targets)&&card.targets.length>0?card.targets:[];
    const padded=[...rows];while(padded.length<12)padded.push(EMPTY_ROW(padded.length+1));
    setTargets(padded.slice(0,12));setActiveCardId(card.id);setLoadPanel(false);showMsg(true,`Loaded: ${card.title}`);
  }

  async function deleteCard(cardId:string){
    if(!confirm("Delete this range card?"))return;
    await apiFetch(`/api/range-cards?path=${group.id}/range-cards/${cardId}`,{method:"DELETE"}).catch(()=>{});
    setSavedCards(p=>p.filter(c=>c.id!==cardId));if(activeCardId===cardId)setActiveCardId(null);
  }

  function printCard(){window.print();}

  async function exportPDF(){
    setExporting(true);
    try{
      const [h2c,jspdfMod]=await Promise.all([
        import("html2canvas").then(m=>m.default),
        import("jspdf"),
      ]);
      const jsPDF=(jspdfMod as any).jsPDF||(jspdfMod as any).default?.jsPDF||(jspdfMod as any).default;
      const el=document.getElementById("range-card-document");
      if(!el){setExporting(false);return;}
      const canvas=await h2c(el,{scale:2,useCORS:true,backgroundColor:"#ffffff"});
      const imgData=canvas.toDataURL("image/png");
      const pdf=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
      const pw=pdf.internal.pageSize.getWidth();
      const ph=pdf.internal.pageSize.getHeight();
      const imgW=Math.min(pw-10,(canvas.width/2)*0.2646);
      const imgH=(canvas.height/2)*0.2646;
      const scale=Math.min((pw-10)/imgW,(ph-10)/imgH);
      pdf.addImage(imgData,"PNG",5,5,imgW*scale,imgH*scale);
      pdf.save((meta.title.replace(/\s+/g,"_")||"range_card")+".pdf");
    }catch(e){console.error(e);alert("PDF export failed — try Print instead.");}
    setExporting(false);
  }

  function getNorm(e:React.MouseEvent<Element>){
    const c=svgRef.current!,r=c.getBoundingClientRect();
    return{px:(e.clientX-r.left)/r.width,py:(e.clientY-r.top)/r.height};
  }
  function findHit(px:number,py:number){
    const c=svgRef.current!,r=c.getBoundingClientRect();
    return targets.find(t=>t.polarX>.01&&t.polarY>.01&&Math.sqrt(((t.polarX-px)*r.width)**2+((t.polarY-py)*r.height)**2)<18);
  }
  function onMouseDown(e:React.MouseEvent<Element>){
    if(locked)return;
    const{px,py}=getNorm(e);
    if(tool==="delete"){const h=findHit(px,py);if(h)setTargets(p=>p.map(t=>t.id===h.id?{...EMPTY_ROW(t.ser),ser:t.ser,id:t.id}:t));return;}
    if(tool==="move"){const h=findHit(px,py);if(h)setMoving(h.id);return;}
    if(SYMBOL_MODE[selSym]==="drag"){setDragOrigin({x:px,y:py});setDragCur({x:px,y:py});}
    else{
      const{bearing,rangem}=toBR(px,py,meta.maxRangeM);
      const nextEmpty=targets.findIndex(t=>t.bearing===""&&t.rangem==="");
      if(nextEmpty>=0)setTargets(p=>p.map((t,i)=>i===nextEmpty?{...t,bearing,rangem,symbolType:selSym,polarX:px,polarY:py}:t));
    }
  }
  function onMouseMove(e:React.MouseEvent<Element>){
    const{px,py}=getNorm(e);
    if(tool==="move"&&moving){const{bearing,rangem}=toBR(px,py,meta.maxRangeM);setTargets(p=>p.map(t=>t.id===moving?{...t,polarX:px,polarY:py,bearing,rangem}:t));return;}
    if(tool==="place"&&dragOrigin)setDragCur({x:px,y:py});
  }
  function onMouseUp(e:React.MouseEvent<Element>){
    const{px,py}=getNorm(e);
    if(moving){setMoving(null);return;}
    if(dragOrigin&&tool==="place"&&SYMBOL_MODE[selSym]==="drag"){
      if(Math.sqrt((px-dragOrigin.x)**2+(py-dragOrigin.y)**2)>.015){
        const{bearing,rangem}=toBR(dragOrigin.x,dragOrigin.y,meta.maxRangeM);
        const nextEmpty=targets.findIndex(t=>t.bearing===""&&t.rangem==="");
        if(nextEmpty>=0)setTargets(p=>p.map((t,i)=>i===nextEmpty?{...t,bearing,rangem,symbolType:selSym,polarX:dragOrigin!.x,polarY:dragOrigin!.y,endX:px,endY:py}:t));
      }
      setDragOrigin(null);setDragCur(null);
    }
  }
  function updateRow(id:string,field:keyof TargetRow,val:any){setTargets(p=>p.map(t=>t.id===id?{...t,[field]:val}:t));}

  function gridRefValid(gr:string):boolean|null{if(!gr||!gr.trim())return null;return /^[A-Za-z]{2}\d{6}(\d{2})?$/.test(gr.trim());}


  // ── Draw canvas render ────────────────────────────────────────────────
  const renderDraw=useCallback(()=>{
    const c=drawRef.current;if(!c)return;
    const ctx=c.getContext("2d");if(!ctx)return;
    ctx.clearRect(0,0,c.width,c.height);
    const drawStroke=(s:DrawStroke)=>{
      if(s.points.length<2)return;
      ctx.save();ctx.strokeStyle=s.color;ctx.lineWidth=s.width;
      ctx.lineCap="round";ctx.lineJoin="round";
      const dw=c.width/(window.devicePixelRatio||1),dh=c.height/(window.devicePixelRatio||1);
      ctx.beginPath();ctx.moveTo(s.points[0].x*dw,s.points[0].y*dh);
      for(let i=1;i<s.points.length;i++)ctx.lineTo(s.points[i].x*dw,s.points[i].y*dh);
      ctx.stroke();ctx.restore();
    };
    strokes.forEach(drawStroke);
    if(activeStroke)drawStroke(activeStroke);
  },[strokes,activeStroke]);

  useEffect(()=>{renderDraw();},[renderDraw]);

  // Scale draw overlay canvas for DPR
  useEffect(()=>{
    const c=drawRef.current;if(!c)return;
    const dpr=window.devicePixelRatio||1;
    c.width=700*dpr;c.height=700*dpr;
    const ctx=c.getContext("2d");if(!ctx)return;
    ctx.scale(dpr,dpr);
  },[]);

  function getNormDraw(e:React.MouseEvent<Element>){
    const c=drawRef.current!,r=c.getBoundingClientRect();
    return{px:(e.clientX-r.left)/r.width,py:(e.clientY-r.top)/r.height};
  }

  function onDrawMouseDown(e:React.MouseEvent<Element>){
    if(!drawTool||locked)return;
    isDrawing.current=true;
    const{px,py}=getNormDraw(e);
    if(drawTool==="pen"){
      setActiveStroke({id:uid(),points:[{x:px,y:py}],color:penColor,width:penWidth});
    } else if(drawTool==="erase"){
      // erase strokes whose last point is near click
      const c=drawRef.current!,r=c.getBoundingClientRect();
      setStrokes(prev=>prev.filter(s=>{
        return !s.points.some(p=>Math.sqrt(((p.x-px)*r.width)**2+((p.y-py)*r.height)**2)<penWidth*4);
      }));
    }
  }

  function onDrawMouseMove(e:React.MouseEvent<Element>){
    if(!isDrawing.current||!drawTool)return;
    const{px,py}=getNormDraw(e);
    if(drawTool==="pen"){
      setActiveStroke(prev=>prev?{...prev,points:[...prev.points,{x:px,y:py}]}:null);
    } else if(drawTool==="erase"){
      const c=drawRef.current!,r=c.getBoundingClientRect();
      setStrokes(prev=>prev.filter(s=>{
        return !s.points.some(p=>Math.sqrt(((p.x-px)*r.width)**2+((p.y-py)*r.height)**2)<penWidth*4);
      }));
    }
  }

  function onDrawMouseUp(){
    if(!isDrawing.current)return;
    isDrawing.current=false;
    if(drawTool==="pen"&&activeStroke&&activeStroke.points.length>1){
      setStrokes(prev=>[...prev,activeStroke]);
    }
    setActiveStroke(null);
  }

    const isDrag=SYMBOL_MODE[selSym]==="drag";

  // White card styles (print-ready)
  const cardBg="bg-white";
  const cellBorder="border border-[#b0b8c8]";
  const thCell=`${cellBorder} bg-[#e8ecf3] text-[#2a3244] font-bold text-[10px] text-center px-1 py-1 leading-tight uppercase tracking-wide`;
  const tdCell=`${cellBorder} text-[10px] text-center text-[#111827]`;
  const serCell=`${cellBorder} bg-[#f0f3f8] text-[#4a5568] font-bold text-[10px] text-center`;
  const metaLabel=`font-bold text-[9px] uppercase tracking-widest px-1.5 py-1 ${cellBorder} bg-[#e8ecf3] text-[#4a5568]`;
  const metaValue=`${cellBorder} bg-white`;
  const inputCls=`w-full text-[10px] text-center bg-transparent border-none outline-none ${locked?"text-[#9aabb8] cursor-not-allowed":"text-[#111827]"} py-0.5 px-1`;

  const symGroups=["Targets","Positions","Structures","Obstacles","Signals","Lines"];

  return(
    <div className="flex flex-col bg-[#0a0c0e] text-foreground select-none" style={{height:"100vh",overflow:"hidden"}}>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm flex-shrink-0 z-[200] relative">
        <div className="flex items-center gap-1.5 px-3 py-1.5 flex-wrap">
          {onBack&&(
            <button onClick={onBack} className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-border/60 bg-secondary/30 hover:bg-secondary/60 text-foreground transition-all text-[10px] font-display font-bold uppercase tracking-wide">
              <ArrowLeft className="w-3.5 h-3.5"/>Back
            </button>
          )}
          <div className="w-px h-5 bg-border/60"/>
          <Crosshair className="w-4 h-4 text-primary"/>
          <span className="text-[11px] font-display font-black uppercase tracking-widest">Range Card Builder</span>
          {group&&<span className="text-[10px] text-muted-foreground">— {group.name}</span>}
          {activeCardId&&<span className="text-[9px] bg-emerald-900/20 border border-emerald-700/40 text-emerald-400 px-1.5 py-0.5 rounded font-display uppercase tracking-wide">Saved</span>}
          <div className="flex-1"/>
          {/* Tools */}
          {([{id:"place",label:"Place",icon:<Plus className="w-3 h-3"/>},{id:"move",label:"Move",icon:<Move className="w-3 h-3"/>},{id:"delete",label:"Erase",icon:<Trash2 className="w-3 h-3"/>}] as const).map(t=>(
            <button key={t.id} onClick={()=>setTool(t.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-display font-bold uppercase tracking-wide border transition-colors ${tool===t.id?"bg-primary text-primary-foreground border-primary":"bg-secondary/30 text-muted-foreground border-border/60 hover:text-foreground"}`}>
              {t.icon}{t.label}
            </button>
          ))}
          <div className="w-px h-5 bg-border/60"/>
          {/* Draw tools */}
          <button onClick={()=>setDrawTool(drawTool==="pen"?null:"pen")}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-display font-bold uppercase tracking-wide border transition-colors ${drawTool==="pen"?"bg-amber-500/20 text-amber-400 border-amber-500/40":"bg-secondary/30 text-muted-foreground border-border/60 hover:text-foreground"}`}>
            <Pen className="w-3 h-3"/>Pen
          </button>
          <button onClick={()=>setDrawTool(drawTool==="erase"?null:"erase")}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-display font-bold uppercase tracking-wide border transition-colors ${drawTool==="erase"?"bg-red-500/20 text-red-400 border-red-500/40":"bg-secondary/30 text-muted-foreground border-border/60 hover:text-foreground"}`}>
            <Eraser className="w-3 h-3"/>Erase
          </button>
          {drawTool==="pen"&&(<>
            <input type="color" value={penColor} onChange={e=>setPenColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border border-border/60 bg-transparent p-0" title="Pen colour"/>
            <select value={penWidth} onChange={e=>setPenWidth(+e.target.value)}
              className="text-[10px] bg-secondary/30 border border-border/60 rounded px-1.5 py-1 text-muted-foreground" title="Line width">
              {[1,2,3,5,8].map(w=><option key={w} value={w}>{w}px</option>)}
            </select>
          </>)}
          {strokes.length>0&&(
            <button onClick={()=>{if(confirm("Clear all pen marks?"))setStrokes([]);}}
              className="text-[9px] px-1.5 py-1 rounded border border-border/60 text-[#4a5068] hover:text-red-400 transition-colors">
              Clear Pen
            </button>
          )}
          <div className="w-px h-5 bg-border/60"/>
          {/* Symbol groups */}
          {symGroups.map(grp=>(
            <select key={grp} value={SYMS.find(s=>s.id===selSym&&s.group===grp)?selSym:""} onChange={e=>{if(e.target.value)setSelSym(e.target.value as SymbolType);}}
              className={`text-[10px] border rounded px-1.5 py-1 transition-colors ${SYMS.find(s=>s.id===selSym&&s.group===grp)?"bg-primary/20 border-primary/50 text-primary":"bg-secondary/30 border-border/60 text-muted-foreground"}`}>
              <option value="">{grp}</option>
              {SYMS.filter(s=>s.group===grp).map(s=><option key={s.id} value={s.id}>{s.label.replace(" (drag)","")}</option>)}
            </select>
          ))}
          <span className={`text-[9px] px-1.5 py-0.5 rounded border flex-shrink-0 ${isDrag?"text-amber-400 bg-amber-900/20 border-amber-700/40":"text-emerald-400 bg-emerald-900/20 border-emerald-700/40"}`}>
            {isDrag?"↖ drag":"↖ click"}
          </span>
          <div className="w-px h-5 bg-border/60"/>
          <button onClick={()=>{if(confirm("Clear all?"))setTargets(Array.from({length:12},(_,i)=>EMPTY_ROW(i+1)));}}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-secondary/30 hover:bg-red-900/40 border border-border/60 text-muted-foreground hover:text-red-400 transition-colors">
            <RotateCcw className="w-3 h-3"/>Clear
          </button>
          <button onClick={()=>setLocked(l=>!l)}
            title={locked?"Unlock card for editing":"Lock card — prevents accidental edits"}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] border transition-colors ${locked?"bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold":"bg-secondary/30 text-muted-foreground border-border/60 hover:text-foreground"}`}>
            {locked?<Lock className="w-3 h-3"/>:<Unlock className="w-3 h-3"/>}
            {locked?"Locked":"Lock"}
          </button>
          <button onClick={printCard} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-secondary/30 hover:bg-secondary/60 border border-border/60 text-muted-foreground transition-colors">
            <FileText className="w-3 h-3"/>Print
          </button>
          <button onClick={exportPDF} disabled={exporting} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 transition-colors disabled:opacity-50">
            {exporting?<Loader2 className="w-3 h-3 animate-spin"/>:<Download className="w-3 h-3"/>}
            PDF
          </button>
          {group?.id&&(<>
            <button onClick={()=>setLoadPanel(p=>!p)} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-secondary/30 hover:bg-secondary/60 border border-border/60 text-muted-foreground hover:text-foreground transition-colors">
              <FolderOpen className="w-3 h-3"/>Load
            </button>
            <button onClick={saveCard} disabled={saving} className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary transition-colors disabled:opacity-50">
              {saving?<Loader2 className="w-3 h-3 animate-spin"/>:<Save className="w-3 h-3"/>}
              {activeCardId?"Update":"Save to HQ"}
            </button>
          </>)}
          {saveMsg&&<span className={`text-[10px] flex items-center gap-1 ${saveMsg.ok?"text-emerald-400":"text-red-400"}`}>{saveMsg.ok&&<Check className="w-3 h-3"/>}{saveMsg.text}</span>}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-[#06070a] p-5">

        {/* Load panel */}
        {loadPanel&&(
          <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20">
            <div className="bg-card border border-border rounded-lg shadow-2xl w-96 max-h-[60vh] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-[11px] font-display font-black uppercase tracking-widest text-primary">Saved Range Cards</span>
                <button onClick={()=>setLoadPanel(false)}><X className="w-4 h-4 text-muted-foreground hover:text-foreground"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {savedCards.length===0
                  ?<p className="text-center text-muted-foreground text-[11px] py-8">No saved range cards.</p>
                  :savedCards.map(c=>(
                    <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded hover:bg-secondary/20 border border-border/30 mb-1">
                      <div><p className="text-[11px] font-bold text-foreground">{c.title||"Range Card"}</p><p className="text-[9px] text-muted-foreground">{c.date} · {c.made_out_by}</p></div>
                      <div className="flex gap-1">
                        <button onClick={()=>loadCard(c)} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary"><FolderOpen className="w-3 h-3"/>Load</button>
                        <button onClick={()=>deleteCard(c.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-900/20 border border-border/30"><Trash2 className="w-3 h-3"/></button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* ══ THE CARD — dark theme ══ */}
        <div id="range-card-document" className={`mx-auto ${cardBg} shadow-2xl border border-[#b0b8c8]`} style={{width:"min(900px,100%)",fontFamily:"'Arial',sans-serif"}}>

          {/* Title */}
          <div className="border-b border-[#b0b8c8] py-2 px-4 flex items-center justify-between">
            <input value={meta.title} onChange={e=>!locked&&setMeta(p=>({...p,title:e.target.value}))} readOnly={locked}
              className={`text-[15px] font-black uppercase tracking-[0.2em] bg-transparent border-none outline-none flex-1 ${locked?"text-[#9aabb8] cursor-not-allowed":"text-[#111827]"}`}/>
            <span className="text-[9px] text-[#3a4050] font-mono uppercase tracking-widest">{group?.name||"TAG"}</span>
          </div>

          {/* Top section */}
          <div className="flex" style={{borderBottom:"1px solid #b0b8c8"}}>

            {/* Target table */}
            <div className="flex-1">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={thCell} style={{width:28}}>Ser</th>
                    <th className={thCell} style={{width:76}}>Grid Ref</th>
                    <th className={thCell} style={{width:54}}>Bearing<br/>(°)</th>
                    <th className={thCell} style={{width:46}}>Trgt<br/>Dec</th>
                    <th className={thCell} style={{width:54}}>Range<br/>(m)</th>
                    <th className={thCell} style={{width:58}}>Angle of<br/>Sight (°)</th>
                    <th className={thCell} style={{width:56}}>Elevation<br/>(°)</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.map(t=>{
                    const sym=SYMS.find(s=>s.id===t.symbolType);
                    const hasData=!!(t.bearing||t.rangem||t.gridRef);
                    return(
                      <tr key={t.id} className={hasData?"":"opacity-40"} style={hasData?{background:"#0f1117"}:{}}>
                        <td className={serCell} style={{position:"relative"}}>
                          {hasData&&<span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:sym?.color??"#ef4444",marginRight:3,verticalAlign:"middle"}}/>}
                          {t.ser}
                        </td>
                        {(["gridRef","bearing","tgtDec","rangem","angleOfSight","elevation"] as (keyof TargetRow)[]).map(f=>(
                          <td key={f} className={`${tdCell}${f==="gridRef"&&gridRefValid(t[f] as string)===false?" !bg-red-50 !border-red-300":f==="gridRef"&&gridRefValid(t[f] as string)===true?" !bg-emerald-50":""}`}>
                            <input value={t[f] as string} onChange={e=>updateRow(t.id,f,e.target.value)} readOnly={locked}
                              title={f==="gridRef"?"8-digit grid: AB123456 or 10-digit: AB12345678":""} className={inputCls}/>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Meta block */}
            <div style={{width:182,borderLeft:"1px solid #b0b8c8",flexShrink:0}}>
              <table className="w-full border-collapse">
                <tbody>
                  <tr><td colSpan={2} className={thCell}>Own Position GR</td></tr>
                  <tr><td colSpan={2} className={metaValue}><input value={meta.ownPositionGR} onChange={e=>setMeta(p=>({...p,ownPositionGR:e.target.value}))} className={inputCls+" py-1"}/></td></tr>
                  <tr><td colSpan={2} className={thCell}>Aiming Point</td></tr>
                  <tr><td className={metaLabel}>GR</td><td className={metaValue}><input value={meta.aimingGR} onChange={e=>setMeta(p=>({...p,aimingGR:e.target.value}))} className={inputCls}/></td></tr>
                  <tr><td className={metaLabel}>Bearings</td><td className={metaValue}><input value={meta.aimingBearings} onChange={e=>setMeta(p=>({...p,aimingBearings:e.target.value}))} className={inputCls}/></td></tr>
                  <tr><td className={metaLabel}>Descrip</td><td className={metaValue}><input value={meta.aimingDescrip} onChange={e=>setMeta(p=>({...p,aimingDescrip:e.target.value}))} className={inputCls}/></td></tr>
                  <tr><td className={metaLabel}>Range</td><td className={metaValue}><input value={meta.aimingRange} onChange={e=>setMeta(p=>({...p,aimingRange:e.target.value}))} className={inputCls}/></td></tr>
                  <tr><td colSpan={2} className={thCell}>Made out By</td></tr>
                  <tr><td colSpan={2} className={metaValue}><input value={meta.madeOutBy} onChange={e=>setMeta(p=>({...p,madeOutBy:e.target.value}))} className={inputCls+" py-1"}/></td></tr>
                  <tr><td className={metaLabel}>Date</td><td className={metaValue}><input value={meta.date} onChange={e=>setMeta(p=>({...p,date:e.target.value}))} className={inputCls}/></td></tr>
                  <tr><td className={metaLabel}>Map Sheet</td><td className={metaValue}><input value={meta.mapSheet} onChange={e=>setMeta(p=>({...p,mapSheet:e.target.value}))} className={inputCls}/></td></tr>
                  <tr><td className={metaLabel} style={{fontWeight:900}}>Scale</td><td className={metaValue}><input value={meta.scale} onChange={e=>setMeta(p=>({...p,scale:e.target.value}))} className={inputCls}/></td></tr>
                  <tr><td className={metaLabel}>Max Rng</td><td className={metaValue}><input type="number" value={meta.maxRangeM} onChange={e=>setMeta(p=>({...p,maxRangeM:+e.target.value}))} className={inputCls}/></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Polar chart */}
          <div style={{position:"relative",aspectRatio:"1",borderBottom:"1px solid #b0b8c8"}}>
            <PolarChart targets={targets} maxRangeM={meta.maxRangeM} selSym={selSym} tool={drawTool?"none":tool}
              dragOrigin={drawTool?null:dragOrigin} dragCur={drawTool?null:dragCur}
              onMouseDown={drawTool?(()=>{}) as any:onMouseDown as any} onMouseMove={drawTool?(()=>{}) as any:onMouseMove as any} onMouseUp={drawTool?(()=>{}) as any:onMouseUp as any} svgRef={svgRef}/>
            {/* Draw overlay canvas */}
            <canvas ref={drawRef} width={700} height={700}
              style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",
                cursor:drawTool==="pen"?"crosshair":drawTool==="erase"?"cell":"default",
                pointerEvents:drawTool?"auto":"none",background:"transparent"}}
              onMouseDown={onDrawMouseDown} onMouseMove={onDrawMouseMove}
              onMouseUp={onDrawMouseUp} onMouseLeave={onDrawMouseUp}/>
          </div>

          {/* Symbol key strip */}
          <div className="px-3 py-1.5 border-t border-[#b0b8c8] flex items-start gap-2 flex-wrap">
            <button onClick={()=>setShowLegend(l=>!l)}
              className="text-[9px] px-2 py-0.5 rounded border border-[#b0b8c8] text-[#4a5568] hover:bg-[#f0f3f8] transition-colors flex-shrink-0 mt-0.5">
              {showLegend?"▲ Key":"▼ Key"}
            </button>
            {showLegend&&(
              <div className="flex flex-wrap gap-x-5 gap-y-0.5">
                {SYMS.map(s=>(
                  <div key={s.id} className="flex items-center gap-1">
                    {s.label.includes("drag")
                      ?<div className="w-3 h-0.5 flex-shrink-0 rounded" style={{background:s.color}}/>
                      :<div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:s.color}}/>
                    }
                    <span className="text-[8px] text-[#4a5068]">{s.label.replace(" (drag)","")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between px-4 py-1.5 border-t border-[#b0b8c8]">
            <span className="text-[10px] font-bold text-[#4a5068]">{meta.madeOutBy||"—"}</span>
            <span className="text-[9px] text-[#4a5568] font-mono uppercase tracking-widest">{group?.name||"TAG"}</span>
            <span className="text-[10px] font-bold text-[#4a5068]">{meta.date}</span>
          </div>
        </div>
      </div>

      <style>{`@page{margin:0;size:landscape;}@media print{body>*{display:none!important}#range-card-document{display:block!important;width:100%!important;max-width:none!important;border:none!important;box-shadow:none!important;}}`}</style>
    </div>
  );
}
