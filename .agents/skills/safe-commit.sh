#!/bin/bash
# ============================================================
# SAFE COMMIT — crash-checks all staged files, then commits+pushes
# Usage: bash .agents/skills/safe-commit.sh "commit message"
# ============================================================

set -e

MSG="${1:-chore: update}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SAFE COMMIT: $MSG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Run crash check on staged files
bash "$(dirname "$0")/pre-commit-crash-check.sh"
CHECK_STATUS=$?

if [ "$CHECK_STATUS" -ne 0 ]; then
  echo ""
  echo "🛑 COMMIT BLOCKED — crash check failed. Fix issues above first."
  exit 1
fi

echo ""
echo "📦 Committing..."
git commit -m "$MSG"

echo "🚀 Pushing to main + base44-deploy..."
git push github HEAD:main
git push github HEAD:base44-deploy

echo ""
echo "✅ Done. Cloudflare Pages will build in ~1-2 mins."
