#!/usr/bin/env bash
# Pull article API + integration files from development (if missing after a raw git merge).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
REF="origin/development"
FILES=(
  packages/content-module/src/api/admin/articles/route.ts
  packages/content-module/src/api/admin/articles/[id]/route.ts
  packages/content-module/src/api/store/articles/route.ts
  packages/content-module/src/api/store/articles/[slug]/route.ts
  packages/content-module/src/api/http/article-json.ts
  packages/content-module/src/integrations/mercflow-admin-articles-route.ts
  packages/content-module/src/integrations/mercflow-admin-articles-id-route.ts
  packages/content-module/src/integrations/mercflow-store-articles-route.ts
  packages/content-module/src/integrations/mercflow-store-articles-slug-route.ts
  packages/content-module/test/api/admin-articles-routes.test.ts
  packages/content-module/test/api/store-articles-routes.test.ts
  packages/content-module/test/services/article-crud.test.ts
  packages/content-module/test/utils/transliterate-nordic-slug.test.ts
  apps/backend/src/api/admin/articles/route.ts
  apps/backend/src/api/admin/articles/[id]/route.ts
  apps/backend/src/api/store/articles/route.ts
  apps/backend/src/api/store/articles/[slug]/route.ts
)
for f in "${FILES[@]}"; do
  mkdir -p "$(dirname "$f")"
  git show "$REF:$f" > "$f"
  echo "synced $f"
done
