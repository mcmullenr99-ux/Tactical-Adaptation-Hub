import { useEffect, useRef } from "react";
import type { RefObject } from "react";

type FireMode = "fullAuto" | "burst" | "semi";

/** Toggles SVG group opacity directly — zero React re-renders */
function useFlash(ref: RefObject<SVGGElement | null>, mode: FireMode, delay: number) {
  useEffect(() => {
    let alive = true;
    let h: ReturnType<typeof setTimeout>;
    const show = () => ref.current?.setAttribute("opacity", "1");
    const hide = () => ref.current?.setAttribute("opacity", "0");
    hide();

    const semi = () => {
      if (!alive) return;
      show();
      h = setTimeout(() => { hide(); h = setTimeout(semi, 900 + Math.random() * 2600); }, 80 + Math.random() * 55);
    };

    const burst = (n = 3) => {
      if (!alive) return;
      if (n === 0) { h = setTimeout(() => burst(3), 1800 + Math.random() * 3400); return; }
      show();
      h = setTimeout(() => { hide(); h = setTimeout(() => burst(n - 1), 80); }, 85);
    };

    const auto = (rem: number) => {
      if (!alive) return;
      if (rem <= 0) { h = setTimeout(() => auto(4 + Math.floor(Math.random() * 14)), 450 + Math.random() * 1800); return; }
      show();
      h = setTimeout(() => { hide(); h = setTimeout(() => auto(rem - 1), 55 + Math.random() * 65); }, 65 + Math.random() * 45);
    };

    h = setTimeout(() => {
      if (!alive) return;
      if (mode === "semi")      semi();
      else if (mode === "burst") burst();
      else                       auto(5 + Math.floor(Math.random() * 12));
    }, delay);

    return () => { alive = false; clearTimeout(h); hide(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function UavHudScene() {
  /* Defender refs — called unconditionally in fixed order */
  const d0 = useRef<SVGGElement>(null);
  const d1 = useRef<SVGGElement>(null);
  const d2 = useRef<SVGGElement>(null);
  const d3 = useRef<SVGGElement>(null);
  /* Attacker refs */
  const a0 = useRef<SVGGElement>(null);
  const a1 = useRef<SVGGElement>(null);
  const a2 = useRef<SVGGElement>(null);
  const a3 = useRef<SVGGElement>(null);
  const a4 = useRef<SVGGElement>(null);

  /* Defenders: gate (full-auto), north wall (burst), south wall (semi), tower (semi) */
  useFlash(d0, "fullAuto", 600);
  useFlash(d1, "burst",    1400);
  useFlash(d2, "semi",     350);
  useFlash(d3, "semi",     2100);

  /* Attackers: centre (full-auto), north edge (semi), south edge (burst),
     far-north (semi), far-south (burst) */
  useFlash(a0, "fullAuto", 100);
  useFlash(a1, "semi",     850);
  useFlash(a2, "burst",    480);
  useFlash(a3, "semi",     1700);
  useFlash(a4, "burst",    2500);

  /* cx / cy pairs — defenders on compound east wall, attackers at treeline edge */
  const DEF = [
    { cx: 285, cy: 147, ref: d0 },
    { cx: 285, cy:  86, ref: d1 },
    { cx: 285, cy: 214, ref: d2 },
    { cx: 248, cy:  44, ref: d3 },
  ];
  const ATK = [
    { cx: 425, cy: 140, ref: a0 },
    { cx: 422, cy:  76, ref: a1 },
    { cx: 424, cy: 204, ref: a2 },
    { cx: 428, cy:  44, ref: a3 },
    { cx: 426, cy: 255, ref: a4 },
  ];

  return (
    <svg
      viewBox="0 0 1100 300"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="uav-flash" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="uav-inf" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="uav-hot" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* AC-130 orbit — 120s bank */}
      <g className="uav-orbit" style={{ transformOrigin: "550px 150px" }}>

        {/* Cold ground */}
        <rect width="1100" height="300" fill="#020202" />

        {/* Faint warm earth patches */}
        <ellipse cx="180" cy="200" rx="100" ry="55" fill="rgba(255,255,255,0.009)" />
        <ellipse cx="370" cy="130" rx="80"  ry="45" fill="rgba(255,255,255,0.007)" />

        {/* ── ROADS ── */}
        <rect x="0"   y="138" width="440" height="18" fill="#070707" />
        <rect x="195" y="0"   width="14"  height="138" fill="#070707" />
        <rect x="195" y="156" width="14"  height="144" fill="#070707" />

        {/* ── COMPOUND (x 26–288) ── */}
        <rect x="26" y="26" width="262" height="260"
          fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.3" strokeDasharray="6,4" />
        {/* Gate gap east wall */}
        <rect x="286" y="138" width="4" height="18" fill="#020202" />

        {/* Guard towers */}
        {([
          [19,19],[282,19],[19,270],[282,270],
        ] as [number,number][]).map(([x,y],i)=>(
          <g key={`tw${i}`}>
            <rect x={x} y={y} width="16" height="16" fill="#191919" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8"/>
            <circle cx={x+8} cy={y+8} r="4" fill="rgba(255,255,255,0.20)"/>
          </g>
        ))}

        {/* Buildings — zoomed-out scale */}
        {([
          [44,  42,  58,44, 0.055, true ],
          [122, 38,  50,40, 0.028, false],
          [193, 42,  55,42, 0.042, true ],
          [48,  162, 60,46, 0.038, true ],
          [142, 166, 54,44, 0.030, false],
          [218, 165, 48,40, 0.022, false],
        ] as [number,number,number,number,number,boolean][]).map(([x,y,w,h,heat,win],i)=>(
          <g key={`bld${i}`}>
            <rect x={x} y={y} width={w} height={h} fill="#111" stroke="rgba(255,255,255,0.13)" strokeWidth="0.7"/>
            <rect x={x+2} y={y+2} width={w-4} height={h-4} fill={`rgba(255,255,255,${heat})`}/>
            {win && <>
              <rect x={x+6}  y={y+8} width={13} height={9} fill="rgba(255,255,255,0.14)"/>
              <rect x={x+26} y={y+8} width={13} height={9} fill="rgba(255,255,255,0.12)"/>
            </>}
          </g>
        ))}

        {/* ── KILL ZONE (x 290–420) — open ground ── */}
        {/* Prone casualties */}
        <ellipse cx="335" cy="148" rx="5" ry="2.5" fill="rgba(255,255,255,0.28)" filter="url(#uav-inf)"/>
        <ellipse cx="365" cy="158" rx="4" ry="2"   fill="rgba(255,255,255,0.22)" filter="url(#uav-inf)"/>
        {/* Burned-out vehicle */}
        <rect x="388" y="130" width="42" height="20" rx="2" fill="rgba(255,255,255,0.07)"/>
        <ellipse cx="400" cy="140" rx="5" ry="5" fill="rgba(255,255,255,0.12)"/>

        {/* ── TREELINE (x 415 →) ── */}

        {/* Solid deep-forest interior */}
        <rect x="490" y="0" width="610" height="300" fill="#030303"/>

        {/* Warm clearings inside the forest */}
        <ellipse cx="620" cy="80"  rx="55" ry="30" fill="rgba(255,255,255,0.011)"/>
        <ellipse cx="800" cy="200" rx="70" ry="40" fill="rgba(255,255,255,0.009)"/>
        <ellipse cx="950" cy="120" rx="50" ry="28" fill="rgba(255,255,255,0.008)"/>

        {/* Mid-depth tree layer (x 455–498) */}
        {([
          [462,8,22,15],[480,0,18,13],[494,18,20,14],
          [464,32,20,13],[480,43,18,12],[496,30,16,11],
          [460,58,22,15],[476,68,20,13],[490,56,18,12],
          [464,83,20,14],[480,93,18,12],[494,80,16,11],
          [460,108,22,15],[477,118,19,13],[492,106,17,12],
          [464,133,20,14],[480,143,18,12],[496,130,16,11],
          [462,158,22,15],[478,168,20,13],[492,156,18,12],
          [464,182,20,14],[480,193,18,12],[496,180,16,11],
          [460,208,22,15],[477,218,19,13],[492,206,17,12],
          [464,233,20,14],[480,243,18,12],[494,231,16,11],
          [460,256,22,15],[477,266,20,13],[492,254,18,12],
          [464,278,20,14],[480,288,18,12],[494,276,16,11],
        ] as [number,number,number,number][]).map(([cx,cy,rx,ry],i)=>(
          <ellipse key={`mt${i}`} cx={cx} cy={cy} rx={rx} ry={ry} fill="#040404"/>
        ))}

        {/* Front-edge canopy (x 415–462) — attackers peek through gaps */}
        {([
          [418,6,20,13],[434,0,18,12],[450,8,20,14],
          [420,20,18,12],[436,15,16,11],[452,22,18,12],
          // gap around A3.cy≈44
          [416,32,16,11],[433,28,14,10],[450,36,15,10],
          [418,54,17,12],[435,58,15,10],[452,50,16,11],
          [416,64,18,12],[432,70,16,11],
          // gap around A1.cy≈76
          [418,84,17,12],[434,89,15,10],[452,81,16,11],
          [416,98,18,12],[432,106,16,11],[448,101,15,10],
          [418,116,17,12],[434,123,15,10],[450,118,16,11],
          // gap around A0.cy≈140
          [416,130,16,11],[432,127,14,10],
          [418,150,17,12],[434,156,15,10],[452,148,16,11],
          [416,166,18,12],[432,173,16,11],[448,166,15,10],
          [418,182,17,12],[434,188,15,10],
          // gap around A2.cy≈204
          [416,194,16,11],[432,192,14,10],
          [418,214,17,12],[434,220,15,10],[450,212,16,11],
          [416,230,18,12],[432,236,16,11],
          [418,242,17,12],[434,246,14,10],
          // gap around A4.cy≈255
          [416,260,16,11],[432,264,15,10],[448,256,15,10],
          [418,274,18,12],[434,280,16,11],[450,272,15,10],
          [416,288,17,12],[432,294,15,10],
        ] as [number,number,number,number][]).map(([cx,cy,rx,ry],i)=>(
          <ellipse key={`fe${i}`} cx={cx} cy={cy} rx={rx} ry={ry} fill="#030303"/>
        ))}

        {/* Compound-side vegetation */}
        {([
          [12,115,14,9],[15,130,11,7],[12,170,13,9],[10,185,11,7],
          [118,300,18,11],[138,295,14,9],[210,298,16,10],[228,293,12,8],
        ] as [number,number,number,number][]).map(([cx,cy,rx,ry],i)=>(
          <ellipse key={`cv${i}`} cx={cx} cy={cy} rx={rx} ry={ry} fill="#040404"/>
        ))}

        {/* ── INFANTRY BODIES (always-on thermal signatures) ── */}
        {DEF.map((d,i)=>(
          <g key={`db${i}`} filter="url(#uav-inf)">
            <circle cx={d.cx} cy={d.cy} r="3.5" fill="white"/>
            <circle cx={d.cx} cy={d.cy} r="7.5" fill="rgba(255,255,255,0.18)"/>
          </g>
        ))}
        {ATK.map((a,i)=>(
          <g key={`ab${i}`} filter="url(#uav-inf)">
            <circle cx={a.cx} cy={a.cy} r="3.5" fill="white"/>
            <circle cx={a.cx} cy={a.cy} r="7.5" fill="rgba(255,255,255,0.18)"/>
          </g>
        ))}

        {/* ── MUZZLE FLASH LAYERS (ref-controlled, start hidden) ── */}
        {DEF.map((d,i)=>(
          <g key={`df${i}`} ref={d.ref} opacity="0" filter="url(#uav-flash)">
            <circle cx={d.cx} cy={d.cy} r="11" fill="rgba(255,255,255,0.92)"/>
            <circle cx={d.cx} cy={d.cy} r="22" fill="rgba(255,255,255,0.28)"/>
          </g>
        ))}
        {ATK.map((a,i)=>(
          <g key={`af${i}`} ref={a.ref} opacity="0" filter="url(#uav-flash)">
            <circle cx={a.cx} cy={a.cy} r="11" fill="rgba(255,255,255,0.92)"/>
            <circle cx={a.cx} cy={a.cy} r="22" fill="rgba(255,255,255,0.28)"/>
          </g>
        ))}

      </g>
    </svg>
  );
}
