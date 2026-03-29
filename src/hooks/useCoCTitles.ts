/**
 * useCoCTitles — fetches all public groups and builds a lookup map:
 * callsign (lowercase) → { shortTitle, fullTitle, groupName, displayTag }
 *
 * Used to show CoC badge next to usernames across Forum, comments, messages.
 */
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

interface CoCEntry {
  id: string;
  title: string;
  roster_id: string;
  callsign: string;
  sort_order: number;
}

export interface CoCTitle {
  shortTitle: string;
  fullTitle: string;
  groupName: string;
  displayTag: string;
}

let _cache: Record<string, CoCTitle> | null = null;
let _fetchPromise: Promise<Record<string, CoCTitle>> | null = null;

async function buildCoCMap(): Promise<Record<string, CoCTitle>> {
  if (_cache) return _cache;
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = (async () => {
    try {
      const groups = await apiFetch<any[]>("/api/milsim-groups");
      const map: Record<string, CoCTitle> = {};
      for (const g of groups ?? []) {
        const coc: CoCEntry[] = Array.isArray(g.chain_of_command) ? g.chain_of_command : [];
        for (const pos of coc) {
          if (!pos.callsign) continue;
          const shortTitle = pos.title.replace(/\(.*?\)/g, "").trim();
          map[pos.callsign.toLowerCase()] = {
            shortTitle,
            fullTitle: pos.title,
            groupName: g.name,
            displayTag: `${shortTitle} of ${g.name}`,
          };
        }
      }
      _cache = map;
      return map;
    } catch {
      _cache = {};
      return {};
    }
  })();

  return _fetchPromise;
}

export function invalidateCoCCache() {
  _cache = null;
  _fetchPromise = null;
}

export function useCoCTitles() {
  const [map, setMap] = useState<Record<string, CoCTitle>>(_cache ?? {});

  useEffect(() => {
    if (_cache) { setMap(_cache); return; }
    buildCoCMap().then(m => setMap(m));
  }, []);

  function getCoCTitle(callsign: string): CoCTitle | null {
    return map[callsign?.toLowerCase()] ?? null;
  }

  return { getCoCTitle };
}
