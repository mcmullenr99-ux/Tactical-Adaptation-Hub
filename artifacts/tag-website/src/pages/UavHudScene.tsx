export function UavHudScene() {
  return (
    <svg
      viewBox="0 0 1200 320"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Infantry bloom */}
        <filter id="inf-glow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Vehicle / fire bloom */}
        <filter id="hot-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Subtle building warmth */}
        <filter id="warm-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" />
        </filter>
        {/* Target reticle pulsing */}
        <filter id="tgt-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── Orbiting scene — 120s bank ── */}
      <g className="uav-orbit" style={{ transformOrigin: "600px 160px" }}>

        {/* Cold ground */}
        <rect width="1200" height="320" fill="#020202" />

        {/* Warm ground patches — sun-baked earth / residual heat */}
        <ellipse cx="170"  cy="100" rx="95"  ry="55"  fill="rgba(255,255,255,0.011)" />
        <ellipse cx="600"  cy="200" rx="140" ry="70"  fill="rgba(255,255,255,0.009)" />
        <ellipse cx="980"  cy="120" rx="120" ry="65"  fill="rgba(255,255,255,0.010)" />
        <ellipse cx="430"  cy="310" rx="80"  ry="35"  fill="rgba(255,255,255,0.007)" />

        {/* ══ ROADS ══ */}
        {/* Main E-W artery */}
        <rect x="0"   y="148" width="1200" height="20" fill="#070707" />
        {/* Village N-S road */}
        <rect x="218" y="0"   width="16"   height="148" fill="#070707" />
        <rect x="218" y="168" width="16"   height="152" fill="#070707" />
        {/* Compound gate approach */}
        <rect x="565" y="0"   width="14"   height="148" fill="#070707" />
        <rect x="565" y="168" width="14"   height="152" fill="#070707" />
        {/* Industrial spur */}
        <rect x="870" y="148" width="14"   height="100" fill="#070707" />
        {/* Compound inner road */}
        <rect x="365" y="168" width="210"  height="10"  fill="#050505" />

        {/* ══ VILLAGE / TOWN (left zone, x 30–210) ══ */}
        {/* Building V1 */}
        <rect x="35"  y="48"  width="65" height="45" fill="#111" stroke="rgba(255,255,255,0.13)" strokeWidth="0.7" />
        <rect x="37"  y="50"  width="61" height="41" fill="rgba(255,255,255,0.045)" />
        {/* Light on — hot room inside */}
        <rect x="52"  y="60"  width="18" height="12" fill="rgba(255,255,255,0.12)" />

        {/* Building V2 */}
        <rect x="120" y="38"  width="50" height="38" fill="#0f0f0f" stroke="rgba(255,255,255,0.10)" strokeWidth="0.7" />
        <rect x="122" y="40"  width="46" height="34" fill="rgba(255,255,255,0.03)" />

        {/* Building V3 — larger, active */}
        <rect x="32"  y="115" width="80" height="55" fill="#121212" stroke="rgba(255,255,255,0.14)" strokeWidth="0.7" />
        <rect x="34"  y="117" width="76" height="51" fill="rgba(255,255,255,0.06)" />
        {/* Warm windows */}
        <rect x="40"  y="124" width="14" height="10" fill="rgba(255,255,255,0.18)" />
        <rect x="65"  y="124" width="14" height="10" fill="rgba(255,255,255,0.15)" />

        {/* Building V4 */}
        <rect x="135" y="108" width="55" height="42" fill="#0e0e0e" stroke="rgba(255,255,255,0.09)" strokeWidth="0.7" />
        <rect x="137" y="110" width="51" height="38" fill="rgba(255,255,255,0.025)" />

        {/* Building V5 — south of road */}
        <rect x="38"  y="196" width="70" height="48" fill="#111" stroke="rgba(255,255,255,0.12)" strokeWidth="0.7" />
        <rect x="40"  y="198" width="66" height="44" fill="rgba(255,255,255,0.04)" />

        {/* Building V6 */}
        <rect x="135" y="200" width="58" height="40" fill="#0f0f0f" stroke="rgba(255,255,255,0.09)" strokeWidth="0.7" />

        {/* Market stalls — small hotspots */}
        {[
          [130, 155], [148, 148], [162, 157], [175, 150], [155, 163],
        ].map(([x, y], i) => (
          <g key={`stall-${i}`}>
            <rect x={x - 7} y={y - 5} width="14" height="10" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
            {/* Person at stall */}
            <circle cx={x} cy={y + 8} r="2.5" fill="rgba(255,255,255,0.55)" />
          </g>
        ))}

        {/* ══ MAIN COMPOUND (center, x 280–680) ══ */}

        {/* Outer perimeter wall */}
        <rect x="275" y="42" width="410" height="255"
          fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.4" strokeDasharray="6,4" />

        {/* Gate gaps */}
        <rect x="472" y="42"  width="46" height="3"  fill="#020202" />
        <rect x="472" y="294" width="46" height="3"  fill="#020202" />

        {/* Guard towers — 4 corners */}
        {[
          [268, 35], [679, 35], [268, 290], [679, 290],
        ].map(([x, y], i) => (
          <g key={`tower-${i}`}>
            <rect x={x} y={y} width="18" height="18" fill="#1c1c1c" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
            <circle cx={x + 9} cy={y + 9} r="4.5" fill="rgba(255,255,255,0.22)" />
          </g>
        ))}

        {/* Inner compound wall */}
        <rect x="350" y="78" width="295" height="175"
          fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="0.8" strokeDasharray="3,5" />

        {/* HQ building — hottest, most activity */}
        <rect x="380" y="88"  width="125" height="95" fill="#161616" stroke="rgba(255,255,255,0.20)" strokeWidth="0.9" />
        <rect x="382" y="90"  width="121" height="91" fill="rgba(255,255,255,0.07)" />
        {/* Hot interior corridor */}
        <rect x="432" y="90"  width="14"  height="91" fill="rgba(255,255,255,0.05)" />
        {/* Open doorway glow */}
        <rect x="432" y="178" width="22"  height="5"  fill="rgba(255,255,255,0.25)" />

        {/* Barracks East */}
        <rect x="530" y="88"  width="95"  height="58" fill="#121212" stroke="rgba(255,255,255,0.13)" strokeWidth="0.8" />
        <rect x="532" y="90"  width="91"  height="54" fill="rgba(255,255,255,0.04)" />
        {/* Sleeping warm spots */}
        {[545, 565, 585, 605].map((x, i) => (
          <rect key={i} x={x} y={101} width="12" height="8" fill="rgba(255,255,255,0.09)" rx="1" />
        ))}

        {/* Armory / Storage — cool (no people) */}
        <rect x="293" y="90"  width="68"  height="52" fill="#0b0b0b" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
        <rect x="295" y="92"  width="64"  height="48" fill="rgba(255,255,255,0.015)" />

        {/* Garage / Vehicle bay */}
        <rect x="293" y="185" width="75"  height="55" fill="#111" stroke="rgba(255,255,255,0.11)" strokeWidth="0.8" />
        {/* Vehicle inside */}
        <rect x="300" y="198" width="58"  height="28" fill="rgba(255,255,255,0.13)" rx="1.5" />
        <ellipse cx="316" cy="212" rx="7" ry="7" fill="rgba(255,255,255,0.45)" filter="url(#warm-blur)" />

        {/* South barracks */}
        <rect x="385" y="210" width="175" height="50" fill="#111" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
        <rect x="387" y="212" width="171" height="46" fill="rgba(255,255,255,0.035)" />

        {/* Helipad — circle with H */}
        <circle cx="617" cy="232" r="22" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" />
        <circle cx="617" cy="232" r="18" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
        <text x="617" y="237" textAnchor="middle" fontSize="14" fontFamily="monospace" fontWeight="bold"
          fill="rgba(255,255,255,0.18)">H</text>

        {/* Burning barrel — pulsing bright hotspot */}
        <g filter="url(#hot-glow)">
          <circle cx="470" cy="190" r="5" fill="rgba(255,255,255,0.9)">
            <animate attributeName="r" values="4;7;5;8;4" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.85;1;0.75;1;0.85" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="470" cy="185" r="8" fill="rgba(255,255,255,0.25)">
            <animate attributeName="r" values="7;12;9;13;7" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.15;0.25;0.1;0.3" dur="2.2s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Parked vehicle near gate — hot engine */}
        <g filter="url(#hot-glow)">
          <rect x="535" y="194" width="60" height="26" rx="2" fill="rgba(255,255,255,0.17)" />
          <ellipse cx="553" cy="207" rx="8" ry="8" fill="rgba(255,255,255,0.55)" />
        </g>

        {/* ══ INDUSTRIAL ZONE (right, x 720–1070) ══ */}

        {/* Industrial perimeter fence */}
        <rect x="720" y="52" width="355" height="230"
          fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeDasharray="4,6" />

        {/* Warehouse 1 — large */}
        <rect x="738" y="65"  width="145" height="85" fill="#0e0e0e" stroke="rgba(255,255,255,0.12)" strokeWidth="0.9" />
        <rect x="740" y="67"  width="141" height="81" fill="rgba(255,255,255,0.035)" />
        {/* Roof seams */}
        {[780, 820, 855].map((x, i) => (
          <line key={i} x1={x} y1="67" x2={x} y2="148" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" />
        ))}

        {/* Warehouse 2 */}
        <rect x="745" y="190" width="120" height="72" fill="#0d0d0d" stroke="rgba(255,255,255,0.10)" strokeWidth="0.9" />
        <rect x="747" y="192" width="116" height="68" fill="rgba(255,255,255,0.025)" />

        {/* Generator — very hot exhaust */}
        <g filter="url(#hot-glow)">
          <rect x="908" y="82" width="35" height="28" fill="rgba(255,255,255,0.20)" rx="2" />
          <ellipse cx="925" cy="78" rx="10" ry="6" fill="rgba(255,255,255,0.35)">
            <animate attributeName="rx" values="10;14;10;12;10" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.35;0.2;0.3;0.15;0.35" dur="3s" repeatCount="indefinite" />
          </ellipse>
          {/* Exhaust trail */}
          <ellipse cx="925" cy="66" rx="8" ry="10" fill="rgba(255,255,255,0.12)">
            <animate attributeName="ry" values="10;18;12;20;10" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.12;0.05;0.09;0.04;0.12" dur="3s" repeatCount="indefinite" />
          </ellipse>
        </g>

        {/* Motor pool — 3 parked vehicles */}
        {[
          [955, 195, true],
          [955, 228, false],
          [1020, 210, false],
        ].map(([x, y, hot], i) => (
          <g key={`moto-${i}`} filter={hot ? "url(#hot-glow)" : undefined}>
            <rect x={x as number} y={(y as number) - 10} width="52" height="24" rx="1.5"
              fill={`rgba(255,255,255,${hot ? 0.18 : 0.08})`} />
            <ellipse cx={(x as number) + 14} cy={y as number}
              rx="7" ry="7"
              fill={`rgba(255,255,255,${hot ? 0.5 : 0.2})`} />
          </g>
        ))}

        {/* ══ VEGETATION ══ */}
        {[
          [252, 68,  22, 14], [232, 82,  16, 11], [265, 55,  14, 9 ],
          [258, 220, 18, 12], [240, 235, 14, 9 ],
          [700, 62,  20, 13], [718, 75,  14, 9 ],
          [700, 220, 18, 12], [685, 238, 14, 9 ],
          [95,  34,  28, 16], [70,  50,  18, 11],
          [60,  255, 22, 14], [82,  272, 15, 10],
          [175, 272, 20, 13], [195, 258, 14, 9 ],
          [1090, 68, 25, 15], [1110, 80, 16, 10],
          [1080, 225,22, 13], [1100,240, 14, 9 ],
          [1150, 120,20, 12], [1165,135, 14, 9 ],
        ].map(([cx, cy, rx, ry], i) => (
          <ellipse key={`veg-${i}`} cx={cx} cy={cy} rx={rx} ry={ry} fill="#040404" />
        ))}

        {/* ══ INFANTRY SIGNATURES ══ */}

        {/* 1. N perimeter guard → east */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" />
          <circle r="8" fill="rgba(255,255,255,0.18)" />
          <animateMotion dur="24s" repeatCount="indefinite" calcMode="linear"
            path="M 685,48 L 278,48 L 278,50 L 685,50 Z" />
        </g>

        {/* 2. S perimeter guard → west */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" />
          <circle r="8" fill="rgba(255,255,255,0.18)" />
          <animateMotion dur="24s" repeatCount="indefinite" begin="-12s" calcMode="linear"
            path="M 278,295 L 685,295 L 685,293 L 278,293 Z" />
        </g>

        {/* 3. E perimeter guard → south */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" />
          <circle r="8" fill="rgba(255,255,255,0.18)" />
          <animateMotion dur="18s" repeatCount="indefinite" calcMode="linear"
            path="M 687,45 L 687,298 L 685,298 L 685,45 Z" />
        </g>

        {/* 4. W perimeter guard → north */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" />
          <circle r="8" fill="rgba(255,255,255,0.18)" />
          <animateMotion dur="18s" repeatCount="indefinite" begin="-9s" calcMode="linear"
            path="M 276,298 L 276,45 L 278,45 L 278,298 Z" />
        </g>

        {/* 5–6. Inner compound pair patrol — circuit */}
        <g filter="url(#inf-glow)">
          <circle cx="-7" cy="0" r="3" fill="white" />
          <circle cx="4"  cy="0" r="3" fill="white" />
          <circle cx="-7" cy="0" r="7" fill="rgba(255,255,255,0.14)" />
          <circle cx="4"  cy="0" r="7" fill="rgba(255,255,255,0.14)" />
          <animateMotion dur="20s" repeatCount="indefinite" calcMode="linear"
            path="M 360,95 L 640,95 L 640,275 L 360,275 Z" />
        </g>

        {/* 7. Second pair on inner circuit — offset */}
        <g filter="url(#inf-glow)">
          <circle cx="-6" cy="0" r="3" fill="white" />
          <circle cx="5"  cy="0" r="3" fill="white" />
          <animateMotion dur="20s" repeatCount="indefinite" begin="-10s" calcMode="linear"
            path="M 360,95 L 640,95 L 640,275 L 360,275 Z" />
        </g>

        {/* 8. HQ standing guard — tiny jitter */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" />
          <circle r="8"   fill="rgba(255,255,255,0.2)" />
          <animateMotion dur="5s" repeatCount="indefinite" calcMode="linear"
            path="M 437,185 L 442,185 L 442,190 L 437,190 Z" />
        </g>

        {/* 9. Runner — fast diagonal across compound */}
        <g filter="url(#inf-glow)">
          <circle r="3" fill="white" />
          <circle r="6" fill="rgba(255,255,255,0.15)" />
          <animateMotion dur="8s" repeatCount="indefinite" begin="-3s" calcMode="linear"
            path="M 293,100 L 650,260 L 650,258 L 293,98 Z" />
        </g>

        {/* 10. Village patrol N-S road */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" />
          <circle r="8"   fill="rgba(255,255,255,0.18)" />
          <animateMotion dur="14s" repeatCount="indefinite" calcMode="linear"
            path="M 226,25 L 226,145 L 228,145 L 228,25 Z" />
        </g>

        {/* 11. Village patrol S-N road (other side) */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" />
          <circle r="8"   fill="rgba(255,255,255,0.18)" />
          <animateMotion dur="14s" repeatCount="indefinite" begin="-7s" calcMode="linear"
            path="M 222,168 L 222,305 L 220,305 L 220,168 Z" />
        </g>

        {/* 12. Industrial guard W-E warehouse */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" />
          <circle r="8"   fill="rgba(255,255,255,0.18)" />
          <animateMotion dur="16s" repeatCount="indefinite" calcMode="linear"
            path="M 730,157 L 1060,157 L 1060,155 L 730,155 Z" />
        </g>

        {/* 13. Industrial guard E-W return */}
        <g filter="url(#inf-glow)">
          <circle r="3" fill="white" />
          <circle r="7" fill="rgba(255,255,255,0.15)" />
          <animateMotion dur="12s" repeatCount="indefinite" begin="-4s" calcMode="linear"
            path="M 870,175 L 870,260 L 872,260 L 872,175 Z" />
        </g>

        {/* 14. Road approach — figure walking toward compound from east */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" />
          <circle r="8"   fill="rgba(255,255,255,0.18)" />
          <animateMotion dur="28s" repeatCount="indefinite" begin="-8s" calcMode="linear"
            path="M 1180,158 L 690,158 L 690,156 L 1180,156 Z" />
        </g>

        {/* 15. ★ TARGETED figure — has target acquisition box + pulsing reticle */}
        <g filter="url(#tgt-glow)">
          {/* Target acquisition brackets */}
          <path d="M -14,-14 L -8,-14 M -14,-14 L -14,-8" stroke="white" strokeWidth="1.2" fill="none" />
          <path d="M 14,-14 L 8,-14  M 14,-14 L 14,-8"  stroke="white" strokeWidth="1.2" fill="none" />
          <path d="M -14,14  L -8,14  M -14,14  L -14,8"  stroke="white" strokeWidth="1.2" fill="none" />
          <path d="M 14,14   L 8,14   M 14,14   L 14,8"   stroke="white" strokeWidth="1.2" fill="none" />
          {/* Acquisition box */}
          <rect x="-14" y="-14" width="28" height="28" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.7">
            <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.8s" repeatCount="indefinite" />
          </rect>
          {/* Hot body */}
          <circle r="4" fill="white" />
          <circle r="9" fill="rgba(255,255,255,0.25)" />
          <animateMotion dur="30s" repeatCount="indefinite" begin="-6s" calcMode="linear"
            path="M 690,52 L 690,298 L 692,298 L 692,52 Z" />
        </g>

        {/* ══ MOVING VEHICLE on main road ══ */}
        <g filter="url(#hot-glow)">
          {/* Truck body */}
          <rect x="-35" y="-14" width="70" height="28" rx="2.5" fill="rgba(255,255,255,0.16)" />
          {/* Cab / engine — hot */}
          <rect x="-35" y="-14" width="22" height="28" rx="2" fill="rgba(255,255,255,0.22)" />
          {/* Engine bloom */}
          <ellipse cx="-22" cy="0" rx="9" ry="9" fill="rgba(255,255,255,0.55)" />
          <animateMotion dur="22s" repeatCount="indefinite" begin="-10s" calcMode="linear"
            path="M 1200,158 L 0,158" />
        </g>

      </g>
    </svg>
  );
}
