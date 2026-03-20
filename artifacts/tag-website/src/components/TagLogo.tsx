interface TagLogoProps {
  size?: number;
  className?: string;
}

/**
 * TAG circular badge logo — GBRS / military patch style.
 *
 * Three bold letters "T  A  G" wrap a 300° arc. textLength forces them to
 * fill the full arc so the huge gaps between the letters look exactly like
 * the GBRS GROUP ring — the glyph bodies ARE the circular border.
 *
 * Geometry (centre 100,100, baseline radius r=70):
 *   cap-height at font-size 36 ≈ 26 px  →  caps reach r=96 (outer edge)
 *   ring inner edge = baseline r=70
 *   300° arc:  junction points at 150° CW (135,161) and 210° CW (65,161)
 *     main  M 65,161 A 70,70 0 1,1 135,161  (300°, large-arc sweep=1)
 *     bottom M 65,161 A 70,70 0 0,1 135,161  (60°, small-arc sweep=1)
 *   arc lengths:  300° → 366 px   60° → 73 px
 */
export function TagLogo({ size = 200, className = "" }: TagLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="TAG — Tactical Adaptation Group"
    >
      <defs>
        {/* 300° clockwise arc over the top */}
        <path id="tl-ring" d="M 65,161 A 70,70 0 1,1 135,161" />
        {/* 60° clockwise arc through the bottom */}
        <path id="tl-bot"  d="M 65,161 A 70,70 0 0,1 135,161" />
      </defs>

      {/* ── Outer guide hairline ─────────────────────────────────── */}
      <circle cx="100" cy="100" r="96"
        fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.25" />

      {/*
       * ── LETTER-RING ───────────────────────────────────────────────
       * "TAG" textLength=366 fills the full 300° arc (366 px).
       * lengthAdjust="spacing" leaves glyphs at natural width; all
       * extra space becomes inter-glyph gaps (~147 px each):
       *   T — near lower-left  (7–8 o'clock)
       *   A — at top centre    (12 o'clock)   ← centre of text = arc mid
       *   G — near lower-right (4–5 o'clock)
       * Font 36 → cap-height ≈26 px; baseline r=70 → caps reach r=96.
       */}
      <text
        fill="currentColor"
        fontFamily="Rajdhani, sans-serif"
        fontWeight="700"
        fontSize="36"
      >
        <textPath
          href="#tl-ring"
          startOffset="50%"
          textAnchor="middle"
          textLength="366"
          lengthAdjust="spacing"
        >
          TAG
        </textPath>
      </text>

      {/* Short tick marks at the two junction points, closing the ring */}
      {/* Lower-left junction (65,161): tick from outer to inner edge */}
      <line
        x1="65" y1="161"
        x2="79" y2="148"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"
      />
      {/* Lower-right junction (135,161) */}
      <line
        x1="135" y1="161"
        x2="121" y2="148"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"
      />

      {/* ── Inner separator rings ────────────────────────────────── */}
      <circle cx="100" cy="100" r="57"
        fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="100" cy="100" r="52"
        fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />

      {/*
       * ── Crosshair ticks ───────────────────────────────────────────
       * N/S/E/W: from r=24 (outside centre circle) to r=50 (inside sep)
       *   N: y 50→76   S: y 124→150   E: x 124→150   W: x 50→76
       */}
      <line x1="100" y1="50"  x2="100" y2="76"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="100" y1="124" x2="100" y2="150"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="50"  y1="100" x2="76"  y2="100"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="124" y1="100" x2="150" y2="100"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />

      {/* ── Centre target ring ───────────────────────────────────── */}
      <circle cx="100" cy="100" r="20"
        fill="none" stroke="currentColor" strokeWidth="1.6" />

      {/* ── Centre "T" lettermark ────────────────────────────────── */}
      <text
        x="100" y="112"
        textAnchor="middle"
        fontFamily="Rajdhani, sans-serif"
        fontWeight="700"
        fontSize="28"
        fill="currentColor"
      >T</text>

      {/*
       * ── EST. 2025 — bottom 60° arc ───────────────────────────────
       * Same clockwise sweep through the bottom; text extends inward
       * (toward centre) and reads left-to-right. textLength="60" keeps
       * it tight in the narrow 73 px sector.
       */}
      <text
        fill="currentColor"
        fontFamily="Rajdhani, sans-serif"
        fontWeight="700"
        fontSize="10"
      >
        <textPath
          href="#tl-bot"
          startOffset="50%"
          textAnchor="middle"
          textLength="60"
          lengthAdjust="spacing"
        >
          EST. 2025
        </textPath>
      </text>
    </svg>
  );
}
