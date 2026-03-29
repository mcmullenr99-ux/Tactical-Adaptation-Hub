import { useTheme } from "@/contexts/ThemeContext";

interface TagLogoProps {
  size?: number;
  className?: string;
  variant?: "helmet" | "skull";
}

/**
 * TAG logo — fully transparent PNG.
 * Dark mode → white lines. Light mode → black lines.
 */
export function TagLogo({ size = 200, className = "", variant = "helmet" }: TagLogoProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const src = variant === "skull"
    ? (isDark ? "/images/tag-skull-dark.png" : "/images/tag-skull-light.png")
    : (isDark ? "/images/tag-logo-dark.png"  : "/images/tag-logo-light.png");

  return (
    <img
      src={src}
      alt="TAG — Tactical Adaptation Group"
      width={size}
      height={size}
      className={["select-none pointer-events-none object-contain", className].join(" ")}
      draggable={false}
    />
  );
}
