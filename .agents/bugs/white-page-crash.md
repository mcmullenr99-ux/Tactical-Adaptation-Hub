# BUG: White Page Crash — /portal/milsim

**Status:** UNRESOLVED  
**First reported:** 2026-03-28  
**Page:** `tactical-adaptation-hub.pages.dev/portal/milsim`

---

## Symptoms
- Page loads as completely white — nothing renders
- Happens on hard refresh
- Qualifications sub-tab also crashes when navigated to

## What We Know For Certain
- Build compiles clean — no TypeScript/esbuild errors
- JS bundle serves correctly from Cloudflare CDN
- It is a **runtime JS crash** before or during React mount
- Asking Ryan to check browser console has been tried and is NOT a valid next step
- The 522 on the custom domain is a SEPARATE DNS issue — do not conflate

## Attempted Fixes (ALL FAILED — do not retry these)
| Commit | What was tried | Result |
|--------|---------------|--------|
| `c4d5a48d` | TabErrorBoundary around CustomisationTab | Did not fix |
| `91679eae` | PageErrorBoundary in MilsimManage | Did not fix |
| `1a424b24` | Move tab useState before group fetch | Did not fix |
| `2ea02b45` | Persist active tab in localStorage | Did not fix |
| `03544d48` | Persist active tab in URL | Did not fix |
| `e09f3315` | Reset "recognition" tab from localStorage | Did not fix |
| `32bd5a69` | Remove PersistQueryClientProvider entirely | Did not fix |
| Multiple | Various localStorage/tab state fixes | Did not fix |

## Current Debug State
- Commit `62d80572`: Root-level error boundary added to `main.tsx` — will render crash message on screen instead of white page
- **Next step:** Wait for Ryan to load the page and report what the red error screen says — that is the ONLY way to know the actual cause
- Do NOT make any more speculative code changes until the actual error message is known

## Rules
- ❌ Do NOT ask Ryan to check browser console
- ❌ Do NOT guess another cause without the error message from the boundary
- ❌ Do NOT retry any of the failed fixes above
- ✅ Wait for Ryan to see the red error screen and paste what it says
