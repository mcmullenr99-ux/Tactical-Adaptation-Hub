#!/bin/bash
# ============================================================
# SAFE COMMIT — crash-checks, rebuilds dist, then commits+pushes
# Usage: bash .agents/skills/safe-commit.sh "commit message"
# ============================================================

set -e

MSG="${1:-chore: update}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SAFE COMMIT: $MSG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Auto-setup GitHub remote if missing
if ! git remote get-url github &>/dev/null; then
  echo "⚠️  GitHub remote missing — adding it now..."
  source .agents/.env 2>/dev/null || true
  git remote add github "https://mcmullenr99-ux:${GITHUB_TOKEN}@github.com/mcmullenr99-ux/Tactical-Adaptation-Hub.git"
  echo "✅ GitHub remote added."
fi

# Run crash check on staged files
bash "$(dirname "$0")/pre-commit-crash-check.sh"
CHECK_STATUS=$?

if [ "$CHECK_STATUS" -ne 0 ]; then
  echo ""
  echo "🛑 COMMIT BLOCKED — crash check failed. Fix issues above first."
  exit 1
fi

# Rebuild dist (Cloudflare serves pre-built dist — MUST rebuild on every change)
echo ""
echo "🔨 Rebuilding dist..."
node /app/node_modules/vite/dist/node/cli.js build 2>&1 | tail -8
echo "✅ Dist rebuilt."

# Stage dist too
git add dist/

echo ""
echo "📦 Committing..."
git commit -m "$MSG"

echo "🚀 Pushing to GitHub (main + base44-deploy)..."
git push github HEAD:main
git push github HEAD:base44-deploy

echo ""
echo "✅ Done. Cloudflare Pages will deploy in ~60 seconds."
