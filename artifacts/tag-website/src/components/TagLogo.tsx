interface TagLogoProps {
  size?: number;
  className?: string;
}

/**
 * TAG circular badge — Circle-Text / military coin style.
 *
 * The three letters T, A, G each physically form 1/3 of the circle ring.
 * Each letter sits on its own 120° arc segment so the letter body IS the
 * curved ring wall, not text floating near a circle.
 *
 * Layout (viewBox 200×200, centre 100,100, baseline r = 60):
 *   cap-height at font-size 46 ≈ 32 px → caps reach r = 92 (near outer edge)
 *
 *   Three 120° clockwise arcs meeting at the equilateral-triangle vertices:
 *     Top vertex       (100, 40)   →  0°
 *     Lower-right      (152, 130)  →  120°
 *     Lower-left       (48,  130)  →  240°
 *
 *   A  arc  :  (48,130)  → CW →  (152,130)  over the top   — A is at 12 o'clock
 *   G  arc  :  (152,130) → CW →  (100,40)   lower-right
 *   T  arc  :  (100,40)  → CW →  (48,130)   lower-left
 *
 *   Each arc length: r × 120° × π/180 = 60 × 2.094 = 125.7 px ≈ 126 px
 *   textLength="126" + lengthAdjust="spacing" stretches the SPACING so the
 *   single glyph body sits naturally in its 120° segment.
 *
 * Display the logo at ≥ 100 px to appreciate the curved-letter effect.
 */
export function TagLogo({ size = 200, className = "" }: TagLogoProps) {
  const cx = 100, cy = 100, r = 60;

  // Equilateral-triangle vertices on the circle (CW from top, 0°/120°/240°)
  const pt = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
  };
  const top  = pt(0);    // (100, 40)
  const br   = pt(120);  // lower-right
  const bl   = pt(240);  // lower-left

  const arc = (from: {x:number;y:number}, to: {x:number;y:number}) =>
    `M ${from.x.toFixed(1)},${from.y.toFixed(1)} A ${r},${r} 0 0,1 ${to.x.toFixed(1)},${to.y.toFixed(1)}`;

  // Arc paths — each is exactly 120° CW
  const arcA = arc(bl,  br);   // lower-left → over top → lower-right  (A at 12 o'clock)
  const arcG = arc(br,  top);  // lower-right → lower-left sector       (G at 4 o'clock)
  const arcT = arc(top, bl);   // top → lower-left sector               (T at 8 o'clock)

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
        <path id="tag-a" d={arcA} />
        <path id="tag-g" d={arcG} />
        <path id="tag-t" d={arcT} />
      </defs>

      {/* ── Outer hairline guide ring ─────────────────────────────── */}
      <circle cx={cx} cy={cy} r="94"
        fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.25" />

      {/*
       * ── THREE LETTER ARCS ────────────────────────────────────────
       * Each letter is centred in its 120° segment via startOffset/textAnchor.
       * textLength="126" = arc length so the letter body spans the full segment.
       * lengthAdjust="spacing" keeps the glyph at natural width; all extra
       * space becomes padding before/after the character (no glyph distortion).
       * font-size 46 → cap-height ≈ 32 px → letter body fills the ring wall.
       */}
      <text fill="currentColor"
        fontFamily="Rajdhani, sans-serif" fontWeight="700" fontSize="46">
        <textPath href="#tag-a" startOffset="50%" textAnchor="middle"
          textLength="126" lengthAdjust="spacing">A</textPath>
      </text>

      <text fill="currentColor"
        fontFamily="Rajdhani, sans-serif" fontWeight="700" fontSize="46">
        <textPath href="#tag-g" startOffset="50%" textAnchor="middle"
          textLength="126" lengthAdjust="spacing">G</textPath>
      </text>

      <text fill="currentColor"
        fontFamily="Rajdhani, sans-serif" fontWeight="700" fontSize="46">
        <textPath href="#tag-t" startOffset="50%" textAnchor="middle"
          textLength="126" lengthAdjust="spacing">T</textPath>
      </text>

      {/* Small junction dots where the three arcs meet */}
      <circle cx={top.x} cy={top.y} r="2.5"
        fill="currentColor" opacity="0.5" />
      <circle cx={br.x}  cy={br.y}  r="2.5"
        fill="currentColor" opacity="0.5" />
      <circle cx={bl.x}  cy={bl.y}  r="2.5"
        fill="currentColor" opacity="0.5" />

      {/* ── Inner separator rings ────────────────────────────────── */}
      <circle cx={cx} cy={cy} r="45"
        fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="41"
        fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />

      {/* ── Crosshair ticks (r 17 → 38) ─────────────────────────── */}
      <line x1="100" y1="62"  x2="100" y2="83"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="100" y1="117" x2="100" y2="138"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="62"  y1="100" x2="83"  y2="100"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="117" y1="100" x2="138" y2="100"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />

      {/* ── Centre target ring ───────────────────────────────────── */}
      <circle cx={cx} cy={cy} r="15"
        fill="none" stroke="currentColor" strokeWidth="1.5" />

      {/* ── EST. 2025 centred inside the lower portion ───────────── */}
      <text x="100" y="118"
        textAnchor="middle"
        fontFamily="Rajdhani, sans-serif" fontWeight="600" fontSize="9"
        fill="currentColor" letterSpacing="1.5">EST. 2025</text>
    </svg>
  );
}
