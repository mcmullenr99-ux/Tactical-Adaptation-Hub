interface TagLogoProps {
  size?: number;
  className?: string;
}

export function TagLogo({ size = 200, className = "" }: TagLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="TAG - Tactical Adaptation Group"
    >
      <defs>
        {/*
          Top arc for outer ring text.
          From (9,100) counterclockwise (sweep=0) to (191,100) traces the TOP half.
          At startOffset="50%", text-anchor="middle" → text is centered at the top.
          Text extends outward (upward/away from center), reading left to right.
        */}
        <path
          id="tag-top-arc"
          d="M 9,100 A 91,91 0 0,0 191,100"
        />
      </defs>

      {/* ── Outer guide ring ─────────────────────────────────────────── */}
      <circle
        cx="100" cy="100" r="97"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.25"
      />

      {/* ── Main text ring: TACTICAL · ADAPTATION · GROUP ────────────── */}
      <text
        fill="currentColor"
        fontFamily="Rajdhani, sans-serif"
        fontWeight="700"
        fontSize="13"
        letterSpacing="2.2"
      >
        <textPath
          href="#tag-top-arc"
          startOffset="50%"
          textAnchor="middle"
        >
          TACTICAL · ADAPTATION · GROUP
        </textPath>
      </text>

      {/* ── Inner separator rings ─────────────────────────────────────── */}
      <circle
        cx="100" cy="100" r="76"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="100" cy="100" r="71"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.5"
      />

      {/* ── Crosshair tick marks ─────────────────────────────────────── */}
      {/* North */}
      <line x1="100" y1="24" x2="100" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* South */}
      <line x1="100" y1="162" x2="100" y2="176" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* West */}
      <line x1="24" y1="100" x2="38" y2="100" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* East */}
      <line x1="162" y1="100" x2="176" y2="100" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

      {/* ── Secondary inner rings ─────────────────────────────────────── */}
      <circle
        cx="100" cy="100" r="46"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.35"
      />

      {/* ── Center target circle ─────────────────────────────────────── */}
      <circle
        cx="100" cy="100" r="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      {/* ── Center "T" lettermark ─────────────────────────────────────── */}
      <text
        x="100"
        y="113"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Rajdhani, sans-serif"
        fontWeight="700"
        fontSize="34"
      >
        T
      </text>

      {/* ── EST. 2025 ─────────────────────────────────────────────────── */}
      <text
        x="100"
        y="153"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Rajdhani, sans-serif"
        fontWeight="700"
        fontSize="9"
        letterSpacing="3.5"
      >
        EST. 2025
      </text>

      {/* ── Bottom arc accent line ────────────────────────────────────── */}
      <path
        d="M 68,158 Q 100,168 132,158"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.4"
      />
    </svg>
  );
}
