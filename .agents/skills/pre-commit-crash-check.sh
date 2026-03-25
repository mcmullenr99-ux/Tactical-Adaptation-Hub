#!/bin/bash
# ============================================================
# PRE-COMMIT CRASH CHECK  v5
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

  # CHECK 1: @workspace imports
  WS=$(echo "$CONTENT" | grep -E "from '@workspace/|from \"@workspace/" | grep -v "object-storage-web" || true)
  [ -n "$WS" ] && ISSUES+=("❌ Unknown @workspace import: $WS")

  # CHECK 2: Critical component imports
  for COMP in "OrbatBuilder"; do
    if echo "$CONTENT" | grep -qE "<${COMP}[ />]|<${COMP}$"; then
      if ! echo "$CONTENT" | grep -qE "import.*\b${COMP}\b|from.*\b${COMP}\b"; then
        ISSUES+=("❌ <$COMP> used in JSX but not imported")
      fi
    fi
  done

  # CHECK 3: Hooks
  for HOOK in useAuth useToast; do
    if echo "$CONTENT" | grep -qE "= ${HOOK}\(|const.*${HOOK}\("; then
      if ! echo "$CONTENT" | grep -qE "import.*\b${HOOK}\b"; then
        ISSUES+=("❌ '${HOOK}()' called but not imported")
      fi
    fi
  done

  # CHECK 4: Lucide icons missing in v0.400
  for ICON in IdCard CircleUser UserRoundCog SquareTerminal; do
    if echo "$CONTENT" | grep -qE "import.*\b${ICON}\b.*lucide-react"; then
      ISSUES+=("❌ lucide icon '$ICON' missing in v0.400")
    fi
  done

  # CHECK 5: dangerouslySetInnerHTML
  if echo "$CONTENT" | grep -q "dangerouslySetInnerHTML"; then
    if ! echo "$CONTENT" | grep -qE "DOMPurify|sanitize|asSVG|milsymbol|// safe"; then
      ISSUES+=("⚠️  dangerouslySetInnerHTML — confirm sanitized")
    fi
  fi

  # CHECK 6: .map() on nullable fields
  for NULLFIELD in "group\.orbat" "group\.sops" "group\.description" "group\.logoUrl"; do
    if echo "$CONTENT" | grep -qE "${NULLFIELD}\.map\("; then
      ISSUES+=("⚠️  ${NULLFIELD}.map() — nullable field, add null guard")
    fi
  done

  # CHECK 7: Duplicate declarations
  DECL_NAMES=$(echo "$CONTENT" | grep -oE '(const|let) [a-zA-Z_][a-zA-Z0-9_]*' | awk '{print $2}' | sort | uniq -d)
  if [ -n "$DECL_NAMES" ]; then
    for DUP in $DECL_NAMES; do
      case "$DUP" in i|j|k|e|el|key|idx|ref|res|err|data|item|node|row|col|x|y|t|v|s|now|DAY|gameList|gameCount|inactive|needed|parts|rosterUserIds|validOps|r|u|score|status|narrative|add|emptyForm|load|maxV|pct|q|quals|rank|remove|role|setF|submit|typeDef|updated|form|f|b|m|a|o|c|p|d|n|count|label|w|h|params) continue ;; esac
      ISSUES+=("❌ Duplicate declaration: '$DUP'")
    done
  fi

  # CHECK 8: milsimConstants used but not imported
  for CONST in "BRANCHES" "UNIT_TYPES_BY_BRANCH"; do
    if echo "$CONTENT" | grep -qE "\b${CONST}\b" && ! echo "$CONTENT" | grep -qE "import.*\b${CONST}\b|const ${CONST}"; then
      ISSUES+=("❌ '${CONST}' used but not imported from @/lib/milsimConstants")
    fi
  done
  if echo "$CONTENT" | grep -qE "\bMC_GAMES\b" && ! echo "$CONTENT" | grep -qE "const MC_GAMES|GAMES_LIST as MC_GAMES"; then
    ISSUES+=("❌ 'MC_GAMES' used but not defined — import GAMES_LIST as MC_GAMES")
  fi

  # Report
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
