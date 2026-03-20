interface TagLogoProps {
  size?: number;
  className?: string;
}

/**
 * TAG circular badge logo.
 *
 * Design intent: the letter bodies of "TACTICAL ADAPTATION GROUP" ARE the outer
 * ring — exactly like GBRS, military patches, and the RH-style circular logos
 * the client referenced. textLength forces the 25 chars to span a 270° arc so
 * the glyphs (font-size 20, cap-height ≈ 14 px) fill from the inner separator
 * ring outward to the edge of the circle, with generous inter-glyph gaps.
 *
 * Geometry (centre 100,100):
 *   text baseline    r = 80   (caps reach outward to ≈ r 94)
 *   junction points  (43, 157) and (157, 157)  — 135° each side of the bottom
 *   main arc         270° CW over top → M 43,157 A 80,80 0 1,1 157,157
 *   bottom arc        90° CW through bottom → M 43,157 A 80,80 0 0,1 157,157
 *   arc lengths      270°=377 px   90°=126 px
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
        {/* 270° arc — lower-left → clockwise over top → lower-right */}
        <path id="tag-main" d="M 43,157 A 80,80 0 1,1 157,157" />
        {/* 90° arc  — lower-left → clockwise through bottom → lower-right */}
        <path id="tag-bot"  d="M 43,157 A 80,80 0 0,1 157,157" />
      </defs>

      {/* ── Outer guide hairline ─────────────────────────────────────── */}
      <circle cx="100" cy="100" r="95"
        fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.2" />

      {/*
       * ── LETTER-BODY RING ──────────────────────────────────────────────
       * font-size 20  →  cap height ≈ 14 px
       * baseline at r=80; caps reach outward to r≈94 (fills the ring)
       * textLength="370" across 377 px arc = 14.8 px per character
       * lengthAdjust="spacing" keeps glyphs natural, only opens the gaps
       * → letters are the ring; white space between is the "background"
       */}
      <text
        fill="currentColor"
        fontFamily="Rajdhani, sans-serif"
        fontWeight="700"
        fontSize="20"
      >
        <textPath
          href="#tag-main"
          startOffset="50%"
          textAnchor="middle"
          textLength="370"
          lengthAdjust="spacing"
        >
          TACTICAL ADAPTATION GROUP
        </textPath>
      </text>

      {/* ── Inner separator rings ─────────────────────────────────────── */}
      <circle cx="100" cy="100" r="64"
        fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="100" cy="100" r="59"
        fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />

      {/*
       * ── Crosshair ticks ──────────────────────────────────────────────
       * From r=27 (outside centre circle) to r=57 (inside separator ring)
       *   N: y = 100-57=43  to  100-27=73
       *   S: y = 100+27=127 to  100+57=157
       *   W: x = 100-57=43  to  100-27=73
       *   E: x = 100+27=127 to  100+57=157
       */}
      <line x1="100" y1="43"  x2="100" y2="73"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="100" y1="127" x2="100" y2="157"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="43"  y1="100" x2="73"  y2="100"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="127" y1="100" x2="157" y2="100"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

      {/* ── Centre target ring ────────────────────────────────────────── */}
      <circle cx="100" cy="100" r="22"
        fill="none" stroke="currentColor" strokeWidth="1.6" />

      {/* ── Centre "T" lettermark ─────────────────────────────────────── */}
      <text
        x="100" y="114"
        textAnchor="middle"
        fontFamily="Rajdhani, sans-serif"
        fontWeight="700"
        fontSize="34"
        fill="currentColor"
      >T</text>

      {/*
       * ── EST. 2025 — bottom 90° arc ────────────────────────────────────
       * Clockwise path at the bottom: travel direction is left→right at the
       * lowest point, so text extends inward (toward centre) — it reads
       * correctly and sits between the separator ring and the outer letter ring
       * in the lower sector.
       * textLength="108" across 126 px arc  (9-char "EST. 2025")
       */}
      <text
        fill="currentColor"
        fontFamily="Rajdhani, sans-serif"
        fontWeight="700"
        fontSize="11"
      >
        <textPath
          href="#tag-bot"
          startOffset="50%"
          textAnchor="middle"
          textLength="108"
          lengthAdjust="spacing"
        >
          EST. 2025
        </textPath>
      </text>
    </svg>
  );
}
