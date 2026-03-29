import { useContext } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";

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
  // Use context directly with fallback — never crashes even outside provider
  const ctx = useContext(ThemeContext);
  const isDark = ctx ? ctx.theme !== "light" : true;

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
