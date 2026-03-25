/**
 * Outsider Preview Mode
 * When active: strips mod/admin/commander nav items and shows a
 * persistent banner. Persisted in sessionStorage so it survives
 * page navigations but clears on tab close.
 */
import { useState, useEffect } from "react";

const KEY = "tag_outsider_mode";

export function useOutsiderMode() {
  const [active, setActive] = useState<boolean>(() => {
    try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; }
  });

  const enter = () => {
    try { sessionStorage.setItem(KEY, "1"); } catch {}
    setActive(true);
  };

  const exit = () => {
    try { sessionStorage.removeItem(KEY); } catch {}
    setActive(false);
  };

  // Sync across tabs in same session
  useEffect(() => {
    const handler = () => {
      try { setActive(sessionStorage.getItem(KEY) === "1"); } catch {}
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return { active, enter, exit };
}
