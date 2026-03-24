# TAG — Shared Data Consistency Log
> **Purpose:** Every time a shared constant, entity field, or data structure is used across multiple pages/components, it is logged here. Before editing anything listed below, check this file to know EXACTLY what else will be affected.
> **Rule:** If you add, rename, or remove a value from any section below — update this log in the same commit.

---

## 📁 Source of Truth File
**`src/lib/milsimConstants.ts`**
This is the canonical file for all shared lookup data. Import from here, never redeclare locally.

---

## 🪖 BRANCH + UNIT TYPE TAXONOMY

### Canonical Source
`src/lib/milsimConstants.ts` — `BRANCHES`, `UNIT_TYPES_BY_BRANCH`, `ALL_UNIT_TYPES`, `BRANCH_ICONS`

### Branches (enum)
| Value | Icon |
|---|---|
| Army | 🪖 |
| Marines | ⚓ |
| Air Force | ✈️ |
| Navy | 🚢 |
| Special Operations | 🎯 |
| Multi-Branch | 🌐 |

### Database Field
`MilsimGroup.branch` (string, enum enforced at schema level)
`MilsimGroup.unit_type` (string, free-form within branch context)

### Pages / Components that READ or WRITE Branch + Unit Type
| File | Role | Notes |
|---|---|---|
| `src/pages/MilsimRegistry.tsx` | Filter + display | Pill-row branch filter; unit type dropdown context-aware |
| `src/pages/MilsimRegister.tsx` | Write (registration form) | Step 2 — branch pills then dynamic unit type |
| `src/pages/MilsimGroup.tsx` | Display (public profile) | Shows branch badge + unit type pill |
| `src/pages/portal/MilsimManage.tsx` | Write (edit group info) | InfoTab — branch pills + context-aware unit type select |
| `src/pages/portal/AdminPanel.tsx` | Display (group list) | Should show branch as metadata column — check on next review |
| `functions/milsimGroups.ts` | Backend API | Passes branch + unitType through to DB on create/update |

### If You Add a New Branch
1. Add to `BRANCHES` array in `milsimConstants.ts`
2. Add its unit types to `UNIT_TYPES_BY_BRANCH`
3. Add its icon to `BRANCH_ICONS`
4. ✅ All pages auto-update (they import from constants)
5. Update the table above in this file

### If You Rename a Branch
1. Update `milsimConstants.ts`
2. Run a DB migration to update existing `MilsimGroup` records with the old value
3. Update this log

---

## 🎮 GAMES LIST

### Canonical Source
`src/lib/milsimConstants.ts` — `GAMES_LIST`

### Current Values
Arma 3, Arma Reforger, DCS World, Squad, Hell Let Loose, Post Scriptum, Insurgency: Sandstorm, GHPC, Foxhole, Ground Branch, Ready or Not, Escape from Tarkov, Other

### Pages / Components that READ or WRITE Games
| File | Role |
|---|---|
| `src/pages/MilsimRegistry.tsx` | Filter dropdown |
| `src/pages/MilsimRegister.tsx` | Multi-select pill toggle (Step 2) |
| `src/pages/portal/MilsimManage.tsx` | Multi-select pill toggle (InfoTab) |
| `src/pages/MilsimGroup.tsx` | Display on public profile |
| `src/pages/OpsCalendar.tsx` | May filter events by game — check when updating |

---

## 🌍 COUNTRIES LIST

### Canonical Source
`src/lib/milsimConstants.ts` — `COUNTRIES_LIST`

### Pages / Components
| File | Role |
|---|---|
| `src/pages/MilsimRegistry.tsx` | Filter dropdown |
| `src/pages/MilsimRegister.tsx` | Select (Step 2) |
| `src/pages/portal/MilsimManage.tsx` | Select (InfoTab) |
| `src/pages/MilsimGroup.tsx` | Display |
| `src/pages/UserPublicProfile.tsx` | User nationality — uses separate `countries.ts` lib, not milsimConstants |

> ⚠️ NOTE: `src/lib/countries.ts` is a **separate** file used for User nationality fields. Do NOT merge them — milsimConstants.ts is for group/milsim-specific data only.

---

## 🗣️ LANGUAGES LIST

### Canonical Source
`src/lib/milsimConstants.ts` — `LANGUAGES_LIST`

### Pages / Components
| File | Role |
|---|---|
| `src/pages/MilsimRegistry.tsx` | Filter dropdown |
| `src/pages/MilsimRegister.tsx` | Select (Step 2) |
| `src/pages/portal/MilsimManage.tsx` | Select (InfoTab) |
| `src/pages/MilsimGroup.tsx` | Display |

---

## ⭐ REPUTATION / SERVICE FILES

### Canonical Source
`functions/reputation.ts` (backend) + `src/pages/portal/MilsimManage.tsx` ReputationTab

### Score Fields
| Field | Type | Range | Notes |
|---|---|---|---|
| activity | number | 1–10 | Participation in ops/events |
| attitude | number | 1–10 | Teamwork, professionalism |
| experience | number | 1–10 | Tactical skill |
| discipline | number | 1–10 | SOP compliance |
| overall_vote | enum | commend / neutral / flag | Visible on public profile |
| blacklisted | bool | — | Blacklist flag — highly visible |
| blacklist_reason | string | — | Public reason |
| notes | string | — | Commander notes |

### Grade thresholds (computed server-side)
| Grade | Score Range |
|---|---|
| ELITE | 85–100 |
| TRUSTED | 70–84 |
| STANDARD | 50–69 |
| CAUTION | 35–49 |
| HIGH RISK | 0–34 |
| BLACKLISTED | override (any score) |
| UNRATED | no reviews yet |

### Pages / Components that READ Reputation
| File | Role |
|---|---|
| `src/pages/portal/MilsimManage.tsx` → ReputationTab | Write: commanders submit reviews |
| `src/pages/UserPublicProfile.tsx` | Display: service history visible on profile |
| `src/pages/MilsimRegistry.tsx` | May eventually show grade badge on group cards |
| `src/pages/MilsimGroup.tsx` | Roster view may show grade badge next to members |

---

## 🏗️ ENTITY SCHEMA FIELDS (MilsimGroup)

Last confirmed schema — `entities/MilsimGroup.json`
| Field | Type | Notes |
|---|---|---|
| name | string | |
| slug | string | URL identifier |
| tag_line | string | |
| description | string | |
| discord_url | string | |
| website_url | string | |
| logo_url | string | |
| sops | string | SOP markdown |
| orbat | string | ORBAT JSON |
| status | enum | pending / approved / rejected |
| owner_id | string | |
| owner_username | string | |
| visibility | enum | public / private |
| games | string[] | Must match GAMES_LIST values |
| country | string | Must match COUNTRIES_LIST values |
| language | string | Must match LANGUAGES_LIST values |
| branch | string | Must match BRANCHES enum |
| unit_type | string | Must be valid for the selected branch |
| tags | string[] | Free tags |

---

## 📋 CHANGE LOG

### 2026-03-24 — Initial taxonomy implementation
- Created `src/lib/milsimConstants.ts` as single source of truth
- Added `branch` field to `MilsimGroup` entity schema
- `BRANCHES`: Army, Marines, Air Force, Navy, Special Operations, Multi-Branch
- Each branch has specific `UNIT_TYPES_BY_BRANCH` list (replaces old flat 13-item list)
- Updated files: `MilsimRegistry.tsx`, `MilsimRegister.tsx`, `MilsimManage.tsx` (InfoTab)
- Added `ReputationTab` (Service Files) to `MilsimManage.tsx`
- Removed local constant redeclarations from all 3 pages — they now import from constants
- `MilsimGroup.tsx` public profile — ⚠️ branch badge display added to GroupCard in Registry; confirm MilsimGroup.tsx public profile page also shows branch (review next session)

---

> Last updated: 2026-03-24
> Maintained by: TAG Lead Developer Agent
