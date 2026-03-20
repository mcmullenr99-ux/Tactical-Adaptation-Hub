interface TagLogoProps {
  size?: number;
  className?: string;
}

/**
 * TAG logo — uses the official PNG asset.
 *
 * Colour-mode behaviour:
 *   Light mode : mix-blend-mode:multiply  — white bg becomes transparent,
 *                black letterforms show against the light page background.
 *   Dark  mode : filter:invert(1) flips to white-on-black,
 *                then mix-blend-mode:screen removes the black rectangle so
 *                only the white glyphs are visible against the dark bg.
 */
export function TagLogo({ size = 200, className = "" }: TagLogoProps) {
  return (
    <img
      src="/images/tag-logo.png"
      alt="TAG — Tactical Adaptation Group"
      width={size}
      height={size}
      className={[
        "select-none pointer-events-none object-contain",
        "[mix-blend-mode:multiply]",
        "dark:invert dark:[mix-blend-mode:screen]",
        className,
      ].join(" ")}
      draggable={false}
    />
  );
}
