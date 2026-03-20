export function UavHudScene() {
  return (
    <svg
      viewBox="0 0 1100 300"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="inf-glow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="hot-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="tgt-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Orbiting scene — AC-130 120s bank */}
      <g className="uav-orbit" style={{ transformOrigin: "550px 150px" }}>

        {/* Cold ground */}
        <rect width="1100" height="300" fill="#020202" />

        {/* Faint warm earth patches */}
        <ellipse cx="140" cy="90"  rx="80"  ry="50"  fill="rgba(255,255,255,0.010)" />
        <ellipse cx="560" cy="190" rx="130" ry="65"  fill="rgba(255,255,255,0.008)" />
        <ellipse cx="940" cy="110" rx="100" ry="55"  fill="rgba(255,255,255,0.009)" />

        {/* ── ROADS ── (patrol paths stay on these) */}
        {/* Main E-W artery */}
        <rect x="0"   y="138" width="1100" height="18" fill="#070707" />
        {/* Village N-S road */}
        <rect x="200" y="0"   width="15"   height="138" fill="#070707" />
        <rect x="200" y="156" width="15"   height="144" fill="#070707" />
        {/* Compound gate spur (N and S) */}
        <rect x="538" y="0"   width="12"   height="138" fill="#060606" />
        <rect x="538" y="156" width="12"   height="144" fill="#060606" />

        {/* ── VILLAGE (left, x 28–185) ── */}
        {/* V1 */}
        <rect x="30"  y="42"  width="68" height="48" fill="#111" stroke="rgba(255,255,255,0.13)" strokeWidth="0.7" />
        <rect x="32"  y="44"  width="64" height="44" fill="rgba(255,255,255,0.048)" />
        <rect x="44"  y="54"  width="18" height="12" fill="rgba(255,255,255,0.13)" />

        {/* V2 */}
        <rect x="118" y="38"  width="54" height="40" fill="#0f0f0f" stroke="rgba(255,255,255,0.10)" strokeWidth="0.7" />
        <rect x="120" y="40"  width="50" height="36" fill="rgba(255,255,255,0.028)" />

        {/* V3 */}
        <rect x="30"  y="108" width="75" height="52" fill="#121212" stroke="rgba(255,255,255,0.12)" strokeWidth="0.7" />
        <rect x="32"  y="110" width="71" height="48" fill="rgba(255,255,255,0.055)" />
        <rect x="40"  y="120" width="15" height="10" fill="rgba(255,255,255,0.16)" />
        <rect x="64"  y="120" width="15" height="10" fill="rgba(255,255,255,0.13)" />

        {/* V4 */}
        <rect x="125" y="104" width="52" height="44" fill="#0e0e0e" stroke="rgba(255,255,255,0.09)" strokeWidth="0.7" />
        <rect x="127" y="106" width="48" height="40" fill="rgba(255,255,255,0.022)" />

        {/* V5 south of road */}
        <rect x="32"  y="183" width="66" height="46" fill="#111" stroke="rgba(255,255,255,0.11)" strokeWidth="0.7" />
        <rect x="34"  y="185" width="62" height="42" fill="rgba(255,255,255,0.038)" />

        {/* V6 */}
        <rect x="122" y="187" width="55" height="38" fill="#0f0f0f" stroke="rgba(255,255,255,0.08)" strokeWidth="0.7" />

        {/* ── COMPOUND (centre, x 255–685) ── */}
        {/* Outer perimeter */}
        <rect x="250" y="40" width="392" height="234"
          fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.3" strokeDasharray="6,4" />

        {/* Gate openings */}
        <rect x="432" y="40"  width="50" height="4"  fill="#020202" />
        <rect x="432" y="270" width="50" height="4"  fill="#020202" />

        {/* Guard towers x4 */}
        {([
          [243, 33], [636, 33], [243, 262], [636, 262],
        ] as [number,number][]).map(([x, y], i) => (
          <g key={`tw-${i}`}>
            <rect x={x} y={y} width="17" height="17" fill="#1b1b1b" stroke="rgba(255,255,255,0.24)" strokeWidth="0.8" />
            <circle cx={x + 8.5} cy={y + 8.5} r="4.5" fill="rgba(255,255,255,0.22)" />
          </g>
        ))}

        {/* Inner compound wall */}
        <rect x="328" y="72" width="280" height="172"
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" strokeDasharray="3,5" />

        {/* HQ building */}
        <rect x="352" y="82"  width="118" height="90" fill="#151515" stroke="rgba(255,255,255,0.18)" strokeWidth="0.9" />
        <rect x="354" y="84"  width="114" height="86" fill="rgba(255,255,255,0.065)" />
        <rect x="400" y="84"  width="14"  height="86" fill="rgba(255,255,255,0.045)" />
        <rect x="400" y="168" width="22"  height="5"  fill="rgba(255,255,255,0.28)" />

        {/* Barracks East */}
        <rect x="497" y="82"  width="90"  height="55" fill="#111" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
        <rect x="499" y="84"  width="86"  height="51" fill="rgba(255,255,255,0.035)" />
        {[512, 533, 554, 572].map((x, i) => (
          <rect key={i} x={x} y={95} width="12" height="8" fill="rgba(255,255,255,0.08)" rx="1" />
        ))}

        {/* Armory / cold storage */}
        <rect x="266" y="84"  width="64"  height="50" fill="#0b0b0b" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />
        <rect x="268" y="86"  width="60"  height="46" fill="rgba(255,255,255,0.014)" />

        {/* Garage */}
        <rect x="266" y="175" width="72"  height="54" fill="#111" stroke="rgba(255,255,255,0.11)" strokeWidth="0.8" />
        <rect x="283" y="188" width="50"  height="26" fill="rgba(255,255,255,0.12)" rx="1.5" />
        <ellipse cx="298" cy="201" rx="7" ry="7" fill="rgba(255,255,255,0.42)" filter="url(#hot-glow)" />

        {/* South barracks */}
        <rect x="358" y="200" width="165" height="48" fill="#111" stroke="rgba(255,255,255,0.11)" strokeWidth="0.8" />
        <rect x="360" y="202" width="161" height="44" fill="rgba(255,255,255,0.030)" />

        {/* Helipad */}
        <circle cx="590" cy="220" r="22" fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="1.2" />
        <circle cx="590" cy="220" r="17" fill="rgba(255,255,255,0.012)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        <text x="590" y="225" textAnchor="middle" fontSize="13" fontFamily="monospace" fontWeight="bold"
          fill="rgba(255,255,255,0.16)">H</text>

        {/* Burning barrel */}
        <g filter="url(#hot-glow)">
          <circle cx="442" cy="185" r="5" fill="rgba(255,255,255,0.9)">
            <animate attributeName="r" values="4;7;5;8;4" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.85;1;0.75;1;0.85" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="442" cy="180" r="9" fill="rgba(255,255,255,0.22)">
            <animate attributeName="r" values="8;13;10;14;8" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.25;0.1;0.2;0.08;0.25" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Parked vehicle near E barracks */}
        <g filter="url(#hot-glow)">
          <rect x="497" y="148" width="58" height="24" rx="2" fill="rgba(255,255,255,0.15)" />
          <ellipse cx="514" cy="160" rx="7.5" ry="7.5" fill="rgba(255,255,255,0.52)" />
        </g>

        {/* ── INDUSTRIAL ZONE (right, x 710–1060) ── */}
        <rect x="710" y="48" width="340" height="220"
          fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" strokeDasharray="4,6" />

        {/* Warehouse 1 */}
        <rect x="726" y="60"  width="140" height="82" fill="#0e0e0e" stroke="rgba(255,255,255,0.11)" strokeWidth="0.9" />
        <rect x="728" y="62"  width="136" height="78" fill="rgba(255,255,255,0.032)" />
        {[766, 806, 842].map((x, i) => (
          <line key={i} x1={x} y1="62" x2={x} y2="142" stroke="rgba(255,255,255,0.055)" strokeWidth="0.6" />
        ))}

        {/* Warehouse 2 */}
        <rect x="730" y="182" width="118" height="68" fill="#0d0d0d" stroke="rgba(255,255,255,0.09)" strokeWidth="0.9" />
        <rect x="732" y="184" width="114" height="64" fill="rgba(255,255,255,0.022)" />

        {/* Generator — pulsing exhaust */}
        <g filter="url(#hot-glow)">
          <rect x="888" y="76" width="34" height="26" fill="rgba(255,255,255,0.20)" rx="2" />
          <ellipse cx="905" cy="72" rx="9" ry="5" fill="rgba(255,255,255,0.32)">
            <animate attributeName="rx" values="9;13;9;11;9" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.32;0.15;0.28;0.12;0.32" dur="3.2s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="905" cy="60" rx="7" ry="11" fill="rgba(255,255,255,0.10)">
            <animate attributeName="ry" values="11;20;13;22;11" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.10;0.04;0.08;0.03;0.10" dur="3.2s" repeatCount="indefinite" />
          </ellipse>
        </g>

        {/* Motor pool — 3 parked vehicles (stationary) */}
        {([
          [940, 182, true],
          [940, 210, false],
          [1000, 196, false],
        ] as [number,number,boolean][]).map(([x, y, hot], i) => (
          <g key={`veh-${i}`} filter={hot ? "url(#hot-glow)" : undefined}>
            <rect x={x} y={y - 9} width="50" height="22" rx="1.5"
              fill={`rgba(255,255,255,${hot ? 0.17 : 0.07})`} />
            <ellipse cx={x + 13} cy={y} rx="6" ry="6"
              fill={`rgba(255,255,255,${hot ? 0.48 : 0.18})`} />
          </g>
        ))}

        {/* Vegetation */}
        {([
          [230, 62,  20, 13], [212, 78,  14, 10], [248, 50,  13, 8 ],
          [230, 210, 17, 11], [215, 225, 13, 8 ],
          [672, 58,  19, 12], [688, 72,  13, 8 ],
          [672, 210, 17, 11], [658, 226, 12, 8 ],
          [88,  30,  26, 15], [65,  46,  17, 10],
          [55,  248, 20, 13], [78,  264, 14, 9 ],
          [165, 262, 18, 12], [182, 248, 13, 8 ],
          [1070, 62, 22, 14], [1088, 78, 14, 9 ],
          [1065, 214,20, 12], [1082,228, 13, 8 ],
        ] as [number,number,number,number][]).map(([cx, cy, rx, ry], i) => (
          <ellipse key={`veg-${i}`} cx={cx} cy={cy} rx={rx} ry={ry} fill="#040404" />
        ))}

        {/* ══ INFANTRY ══
            All paths follow roads or perimeter lines only — no cross-building routes. */}

        {/* 1. N compound perimeter — E→W */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" /><circle r="8" fill="rgba(255,255,255,0.17)" />
          <animateMotion dur="26s" repeatCount="indefinite" calcMode="linear"
            path="M 642,45 L 252,45 L 252,47 L 642,47 Z" />
        </g>

        {/* 2. S compound perimeter — W→E */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" /><circle r="8" fill="rgba(255,255,255,0.17)" />
          <animateMotion dur="26s" repeatCount="indefinite" begin="-13s" calcMode="linear"
            path="M 252,278 L 642,278 L 642,276 L 252,276 Z" />
        </g>

        {/* 3. W compound perimeter — N→S */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" /><circle r="8" fill="rgba(255,255,255,0.17)" />
          <animateMotion dur="19s" repeatCount="indefinite" calcMode="linear"
            path="M 253,42 L 253,280 L 255,280 L 255,42 Z" />
        </g>

        {/* 4. Inner compound pair patrol — along inner wall circuit */}
        <g filter="url(#inf-glow)">
          <circle cx="-7" cy="0" r="3" fill="white" /><circle cx="5" cy="0" r="3" fill="white" />
          <circle cx="-7" cy="0" r="7" fill="rgba(255,255,255,0.13)" />
          <circle cx="5"  cy="0" r="7" fill="rgba(255,255,255,0.13)" />
          <animateMotion dur="22s" repeatCount="indefinite" calcMode="linear"
            path="M 335,78 L 613,78 L 613,248 L 335,248 Z" />
        </g>

        {/* 5. Second pair — offset on same circuit */}
        <g filter="url(#inf-glow)">
          <circle cx="-6" cy="0" r="3" fill="white" /><circle cx="5" cy="0" r="3" fill="white" />
          <animateMotion dur="22s" repeatCount="indefinite" begin="-11s" calcMode="linear"
            path="M 335,78 L 613,78 L 613,248 L 335,248 Z" />
        </g>

        {/* 6. HQ door guard — tiny jitter */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" /><circle r="8" fill="rgba(255,255,255,0.2)" />
          <animateMotion dur="5s" repeatCount="indefinite" calcMode="linear"
            path="M 408,177 L 414,177 L 414,183 L 408,183 Z" />
        </g>

        {/* 7. Village N-S road — walks north side */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" /><circle r="8" fill="rgba(255,255,255,0.17)" />
          <animateMotion dur="15s" repeatCount="indefinite" calcMode="linear"
            path="M 207,20 L 207,136 L 209,136 L 209,20 Z" />
        </g>

        {/* 8. Village N-S road — walks south side */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" /><circle r="8" fill="rgba(255,255,255,0.17)" />
          <animateMotion dur="15s" repeatCount="indefinite" begin="-7s" calcMode="linear"
            path="M 212,158 L 212,292 L 210,292 L 210,158 Z" />
        </g>

        {/* 9. Industrial fence patrol — E-W */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" /><circle r="8" fill="rgba(255,255,255,0.17)" />
          <animateMotion dur="18s" repeatCount="indefinite" calcMode="linear"
            path="M 714,155 L 1046,155 L 1046,153 L 714,153 Z" />
        </g>

        {/* 10. ★ TARGETED figure — E compound perimeter with acquisition box */}
        <g filter="url(#tgt-glow)">
          <path d="M -14,-14 L -8,-14 M -14,-14 L -14,-8" stroke="white" strokeWidth="1.2" fill="none" />
          <path d="M  14,-14 L  8,-14 M  14,-14 L  14,-8" stroke="white" strokeWidth="1.2" fill="none" />
          <path d="M -14, 14 L -8, 14 M -14, 14 L -14,  8" stroke="white" strokeWidth="1.2" fill="none" />
          <path d="M  14, 14 L  8, 14 M  14, 14 L  14,  8" stroke="white" strokeWidth="1.2" fill="none" />
          <rect x="-14" y="-14" width="28" height="28" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.7">
            <animate attributeName="opacity" values="1;0.35;1" dur="1.8s" repeatCount="indefinite" />
          </rect>
          <circle r="4" fill="white" /><circle r="9" fill="rgba(255,255,255,0.22)" />
          <animateMotion dur="19s" repeatCount="indefinite" begin="-5s" calcMode="linear"
            path="M 643,42 L 643,280 L 641,280 L 641,42 Z" />
        </g>

      </g>
    </svg>
  );
}
