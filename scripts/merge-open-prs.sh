#!/usr/bin/env bash
# Merge PR #38 (pages) and PR #23 (subscriptions) onto latest development.
# Run from repo root after: chmod +x .cursor/hooks/*.sh scripts/merge-open-prs.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

chmod +x .cursor/hooks/guard-branches.sh .cursor/hooks/guard-secrets.sh 2>/dev/null || true

git fetch origin development

echo "=== PR #38: feature/content-module/pages-crud ==="
git checkout feature/content-module/pages-crud
git merge origin/development -m "merge: sync development (articles + security) into pages-crud" || {
  echo "Merge conflicts — resolve, then: git add -A && git commit"
  exit 1
}
pnpm install
pnpm --filter @mercflow/content-module test
pnpm --filter @mercflow/admin-ui typecheck
pnpm --filter @mercflow/content-module typecheck
git push origin feature/content-module/pages-crud
echo "PR #38 branch pushed. Open GitHub → Squash merge PR #38."

echo "=== PR #23: feature/admin-ui/subscription-overview ==="
git checkout feature/admin-ui/subscription-overview
git merge origin/development -m "merge: sync development into subscription-overview" || {
  echo "Conflicts likely in packages/admin-ui/src/router.tsx"
  echo "Keep BOTH: article routes + page routes from development/pages, AND subscriptions route from this branch."
  exit 1
}

# If router conflict: ensure subscriptions block exists after customers:
#   path: "subscriptions" -> SubscriptionsListPage
# And article routes use ArticlesListPage / ArticleEditPage (not ContentArticlesPage).

pnpm install
pnpm typecheck
git push origin feature/admin-ui/subscription-overview
echo "PR #23 branch pushed. Open GitHub → ready for review → merge."

echo "Done."
