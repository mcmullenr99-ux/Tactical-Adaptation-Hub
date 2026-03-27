interface TagLogoProps {
  size?: number;
  className?: string;
}

/**
 * TAG logo — white-on-transparent PNG, works on any background natively.
 */
export function TagLogo({ size = 200, className = "" }: TagLogoProps) {
  return (
    <img
      src="/images/tag-logo.png"
      alt="TAG — Tactical Adaptation Group"
      width={size}
      height={size}
      className={["select-none pointer-events-none object-contain", className].join(" ")}
      draggable={false}
    />
  );
}
