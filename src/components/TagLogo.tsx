interface TagLogoProps {
  size?: number;
  className?: string;
  variant?: "helmet" | "skull";
}

export function TagLogo({ size = 200, className = "", variant = "helmet" }: TagLogoProps) {
  const src = variant === "skull" ? "/images/tag-skull.png" : "/images/tag-logo.png";

  return (
    <img
      src={src}
      alt="TAG"
      width={size}
      height={size}
      className={["select-none pointer-events-none object-contain bg-transparent", className].join(" ")}
      draggable={false}
    />
  );
}
