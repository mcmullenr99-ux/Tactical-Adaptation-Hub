# BUG: New Layout Not Appearing — Recognition→Customisation Tab

**Status:** UNRESOLVED  
**First reported:** 2026-03-28  
**Page:** `tactical-adaptation-hub.pages.dev/portal/milsim`

---

## Symptoms
- Tab still shows as "Recognition" instead of "Customisation"
- New ORBAT sub-tab not visible inside the tab
- New Awards / Qualifications / ORBAT sub-tab layout not rendering
- User sees old version of the page even after hard refresh

## What We Know For Certain
- The code changes ARE in the deployed bundle — GitHub commit history confirms
- The Cloudflare build IS using the latest commit
- The JS bundle hash has changed across builds confirming new code is served
- This is likely blocked by the white page crash (BUG-1) — if the page crashes before rendering, the new layout never gets a chance to show

## Likely Root Cause
**Dependent on BUG-1 (white-page-crash.md)** — fix the crash first, then verify if layout appears correctly.

## Attempted Fixes (ALL FAILED)
| Commit | What was tried | Result |
|--------|---------------|--------|
| `4d3643ef` | Rename Recognition→Customisation, add ORBAT sub-tab | Code deployed but not visible due to crash |
| `638bd8c7` | Move ORBAT to standalone Customisation section | Same |
| `bb669ca9` | Correct label + Pro badge + ORBAT only in Customisation | Same |

## Next Step
1. Resolve white page crash (see `white-page-crash.md`) first
2. Once page loads, verify Customisation tab and sub-tabs appear
3. If still not appearing after crash is fixed, investigate separately
