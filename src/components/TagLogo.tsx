import { useContext } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";

interface TagLogoProps {
  size?: number;
  className?: string;
  variant?: "helmet" | "skull";
}

export function TagLogo({ size = 200, className = "", variant = "helmet" }: TagLogoProps) {
  const ctx = useContext(ThemeContext);
  const isDark = ctx ? ctx.theme !== "light" : true;

  const src = variant === "skull" ? "/images/tag-skull.png" : "/images/tag-logo.png";

  return (
    <img
      src={src}
      alt="TAG"
      width={size}
      height={size}
      style={{ filter: isDark ? "invert(1)" : "none" }}
      className={["select-none pointer-events-none object-contain bg-transparent", className].join(" ")}
      draggable={false}
    />
  );
}
