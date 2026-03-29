import { useState, useEffect } from "react";

interface TagLogoProps {
  size?: number;
  className?: string;
  variant?: "helmet" | "skull";
}

/**
 * TAG logo — fully transparent PNG.
 * Dark mode → white lines. Light mode → black lines.
 * Reads theme from <html> class to avoid any context dependency issues.
 */
export function TagLogo({ size = 200, className = "", variant = "helmet" }: TagLogoProps) {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const base = "/";

  const src = variant === "skull"
    ? (isDark ? `${base}images/tag-skull-dark.png` : `${base}images/tag-skull-light.png`)
    : (isDark ? `${base}images/tag-logo-dark.png`  : `${base}images/tag-logo-light.png`);

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
