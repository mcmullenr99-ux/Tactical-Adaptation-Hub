export function UavHudScene() {
  return (
    <svg
      viewBox="0 0 900 280"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="inf-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="veh-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Whole scene rotates — simulates AC-130 banking orbit */}
      <g className="uav-orbit" style={{ transformOrigin: "450px 140px" }}>

        {/* Ground — cold black */}
        <rect width="900" height="280" fill="#020202" />

        {/* Faint warm earth patches — heat absorbed by terrain */}
        <ellipse cx="180" cy="70"  rx="90"  ry="50"  fill="rgba(255,255,255,0.013)" />
        <ellipse cx="720" cy="200" rx="110" ry="60"  fill="rgba(255,255,255,0.010)" />
        <ellipse cx="80"  cy="210" rx="60"  ry="35"  fill="rgba(255,255,255,0.008)" />

        {/* Roads — slightly warmer than ground, dark asphalt */}
        <rect x="0"   y="130" width="900" height="18" fill="#080808" />
        <rect x="200" y="0"   width="14"  height="130" fill="#080808" />
        <rect x="200" y="148" width="14"  height="132" fill="#080808" />

        {/* Compound perimeter wall / fence */}
        <rect
          x="298" y="48" width="308" height="220"
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1.2"
          strokeDasharray="5,4"
        />

        {/* Guard towers — corner posts */}
        {[
          [291, 41], [598, 41], [291, 260], [598, 260],
        ].map(([x, y], i) => (
          <g key={i}>
            <rect x={x} y={y} width="16" height="16" fill="#181818" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" />
            {/* Heat seeping from guard inside */}
            <circle cx={x + 8} cy={y + 8} r="4" fill="rgba(255,255,255,0.18)" />
          </g>
        ))}

        {/* Gate opening — south road enters compound */}
        <rect x="430" y="266" width="45" height="4" fill="#020202" />

        {/* Main HQ building */}
        <rect x="388" y="78" width="115" height="90" fill="#131313" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
        <rect x="390" y="80" width="111" height="86" fill="rgba(255,255,255,0.055)" />
        {/* Hot internal corridor strip */}
        <rect x="440" y="80" width="12" height="86" fill="rgba(255,255,255,0.04)" />

        {/* East barracks */}
        <rect x="530" y="85" width="85" height="55" fill="#0f0f0f" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
        <rect x="532" y="87" width="81" height="51" fill="rgba(255,255,255,0.035)" />

        {/* West storage */}
        <rect x="315" y="88" width="58" height="48" fill="#0e0e0e" stroke="rgba(255,255,255,0.10)" strokeWidth="0.8" />
        <rect x="317" y="90" width="54" height="44" fill="rgba(255,255,255,0.025)" />

        {/* South barracks */}
        <rect x="368" y="196" width="160" height="52" fill="#111" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
        <rect x="370" y="198" width="156" height="48" fill="rgba(255,255,255,0.03)" />

        {/* Vehicle 1 — hot engine, parked near barracks */}
        <g filter="url(#veh-glow)">
          <rect x="508" y="152" width="56" height="24" rx="1.5" fill="rgba(255,255,255,0.15)" />
          <ellipse cx="524" cy="164" rx="7" ry="7" fill="rgba(255,255,255,0.55)" />
        </g>

        {/* Vehicle 2 — colder, engine off */}
        <rect x="334" y="152" width="46" height="22" rx="1" fill="rgba(255,255,255,0.07)" />
        <ellipse cx="350" cy="163" rx="5" ry="5" fill="rgba(255,255,255,0.22)" />

        {/* Trees / cold vegetation clusters */}
        {[
          [235, 95, 20, 13], [215, 112, 15, 10], [258, 80, 13, 9],
          [690, 85, 22, 14], [710, 100, 14, 10],
          [140, 55, 28, 16], [160, 72, 18, 12],
          [165, 205, 22, 14], [145, 220, 16, 11],
          [760, 185, 20, 13], [775, 200, 14, 9],
          [800, 60,  18, 11], [820, 50,  12, 8],
          [60,  55,  16, 10], [50,  180, 14, 9],
        ].map(([cx, cy, rx, ry], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill="#050505" />
        ))}

        {/* ── Infantry thermal signatures ──
            Each is a bright white core + soft halo.
            animateMotion paths follow patrol routes in scene space.
        */}

        {/* Guard 1 — north perimeter, east-to-west */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" />
          <circle r="8" fill="rgba(255,255,255,0.18)" />
          <animateMotion dur="22s" repeatCount="indefinite" calcMode="linear"
            path="M 602,55 L 302,55 L 302,57 L 602,57 Z" />
        </g>

        {/* Guard 2 — south perimeter, west-to-east */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" />
          <circle r="8" fill="rgba(255,255,255,0.18)" />
          <animateMotion dur="22s" repeatCount="indefinite" begin="-11s" calcMode="linear"
            path="M 302,265 L 602,265 L 602,263 L 302,263 Z" />
        </g>

        {/* Guard 3 — east perimeter, north-to-south */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" />
          <circle r="8" fill="rgba(255,255,255,0.18)" />
          <animateMotion dur="16s" repeatCount="indefinite" calcMode="linear"
            path="M 607,52 L 607,268 L 609,268 L 609,52 Z" />
        </g>

        {/* Guard 4 — west perimeter, south-to-north */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" />
          <circle r="8" fill="rgba(255,255,255,0.18)" />
          <animateMotion dur="16s" repeatCount="indefinite" begin="-8s" calcMode="linear"
            path="M 300,268 L 300,52 L 298,52 L 298,268 Z" />
        </g>

        {/* Guard 5 — inside compound near HQ door */}
        <g filter="url(#inf-glow)">
          <circle r="3" fill="white" />
          <circle r="7" fill="rgba(255,255,255,0.15)" />
          <animateMotion dur="12s" repeatCount="indefinite" begin="-4s" calcMode="linear"
            path="M 448,170 L 500,170 L 500,185 L 448,185 Z" />
        </g>

        {/* Guard 6 — near vehicle, small jitter / standing guard */}
        <g filter="url(#inf-glow)">
          <circle r="3" fill="white" />
          <circle r="7" fill="rgba(255,255,255,0.15)" />
          <animateMotion dur="6s" repeatCount="indefinite" calcMode="linear"
            path="M 498,147 L 503,147 L 503,150 L 498,150 Z" />
        </g>

        {/* Inf 7 — approaching along road from west */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" />
          <circle r="8" fill="rgba(255,255,255,0.18)" />
          <animateMotion dur="30s" repeatCount="indefinite" begin="-12s" calcMode="linear"
            path="M 30,139 L 298,139 L 298,141 L 30,141 Z" />
        </g>

        {/* Inf 8 — leaving compound south, toward camera on road */}
        <g filter="url(#inf-glow)">
          <circle r="3.5" fill="white" />
          <circle r="8" fill="rgba(255,255,255,0.18)" />
          <animateMotion dur="18s" repeatCount="indefinite" begin="-6s" calcMode="linear"
            path="M 452,268 L 452,280 L 454,280 L 454,268 Z" />
        </g>

      </g>
    </svg>
  );
}
