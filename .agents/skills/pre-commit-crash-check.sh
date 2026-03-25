#!/bin/bash
# ============================================================
# PRE-COMMIT CRASH CHECK  v4
# Focused on the specific crash patterns we've actually hit.
# ============================================================

ERRORS=0
FILES=()

if [ "$#" -gt 0 ]; then FILES=("$@")
else
  while IFS= read -r f; do FILES+=("$f"); done \
    < <(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(tsx|ts)$')
fi

[ "${#FILES[@]}" -eq 0 ] && { echo "✅ No .tsx/.ts files to check."; exit 0; }
echo "🔍 Crash-checking ${#FILES[@]} file(s)..."

for FILE in "${FILES[@]}"; do
  RESOLVED=""
  for CANDIDATE in "fetched/$FILE" "$FILE"; do
    [ -f "$CANDIDATE" ] && { RESOLVED="$CANDIDATE"; break; }
  done
  [ -z "$RESOLVED" ] && { echo "  ⚠️  Cannot find: $FILE — skipping"; continue; }

  BASENAME=$(basename "$RESOLVED")
  ISSUES=()
  CONTENT=$(cat "$RESOLVED")

  # ── CHECK 1: @workspace imports WITHOUT a vite alias ─────────────────
  WS=$(echo "$CONTENT" | grep -E "from '@workspace/|from \"@workspace/" | grep -v "object-storage-web" || true)
  [ -n "$WS" ] && ISSUES+=("❌ Unknown @workspace import (no vite alias): $WS")

  # ── CHECK 2: Critical component imports that we know can be missing ──
  CRITICAL_COMPONENTS=("OrbatBuilder")
  for COMP in "${CRITICAL_COMPONENTS[@]}"; do
    if echo "$CONTENT" | grep -qE "<${COMP}[ />]|<${COMP}$"; then
      if ! echo "$CONTENT" | grep -qE "import.*\b${COMP}\b|from.*\b${COMP}\b"; then
        ISSUES+=("❌ <$COMP> used in JSX but not imported")
      fi
    fi
  done

  # ── CHECK 3: Hooks we know cause crashes when missing ────────────────
  for HOOK in useAuth useToast; do
    if echo "$CONTENT" | grep -qE "= ${HOOK}\(|const.*${HOOK}\("; then
      if ! echo "$CONTENT" | grep -qE "import.*\b${HOOK}\b"; then
        ISSUES+=("❌ '${HOOK}()' called but not imported")
      fi
    fi
  done

  # ── CHECK 4: Lucide icons known missing in v0.400 ────────────────────
  for ICON in IdCard CircleUser UserRoundCog SquareTerminal; do
    if echo "$CONTENT" | grep -qE "import.*\b${ICON}\b.*lucide-react"; then
      ISSUES+=("❌ lucide icon '$ICON' missing in v0.400 — use a substitute")
    fi
  done

  # ── CHECK 5: dangerouslySetInnerHTML without sanitization ────────────
  if echo "$CONTENT" | grep -q "dangerouslySetInnerHTML"; then
    if ! echo "$CONTENT" | grep -qE "DOMPurify|sanitize|asSVG|milsymbol|// safe"; then
      ISSUES+=("⚠️  dangerouslySetInnerHTML present — confirm content is safe/sanitized")
    fi
  fi

  # ── CHECK 6: Calling .map() on fields that could be null ─────────────
  for NULLFIELD in "group\.orbat" "group\.sops" "group\.description" "group\.logoUrl"; do
    if echo "$CONTENT" | grep -qE "${NULLFIELD}\.map\("; then
      ISSUES+=("⚠️  ${NULLFIELD}.map() — this field is nullable, add null guard")
    fi
  done

  # ── CHECK 7: Duplicate variable declarations (const/let same name) ───
  # Extract all const/let declaration names, find duplicates
  DECL_NAMES=$(echo "$CONTENT" | grep -oE '(const|let) [a-zA-Z_][a-zA-Z0-9_]*' | awk '{print $2}' | sort | uniq -d)
  if [ -n "$DECL_NAMES" ]; then
    for DUP in $DECL_NAMES; do
      # Ignore common loop vars and legitimate re-use patterns
      case "$DUP" in i|j|k|e|el|key|idx|ref|res|err|data|item|node|row|col|x|y|t|v|s|now|DAY|gameList|gameCount|inactive|needed|parts|rosterUserIds|validOps|r|u|score|status|narrative) continue ;; esac
      ISSUES+=("❌ Duplicate variable declaration: '$DUP' declared more than once — will cause TS/build error")
    done
  fi

  # ── Report ─────────────────────────────────────────────────────────
  if [ "${#ISSUES[@]}" -eq 0 ]; then
    echo "  ✅ $BASENAME"
  else
    echo "  🚨 $BASENAME — ${#ISSUES[@]} issue(s):"
    for I in "${ISSUES[@]}"; do echo "       $I"; done
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "🚨 $ERRORS file(s) flagged. Fix before pushing."
  exit 1
else
  echo "✅ All clear — safe to commit."
  exit 0
fi
