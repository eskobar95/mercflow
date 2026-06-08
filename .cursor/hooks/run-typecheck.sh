#!/usr/bin/env bash
# Factory hook: typecheck after agent edits a TypeScript file.
# Exit 2 → Cursor blocks next action (hooks contract).

set -euo pipefail

INPUT=$(cat)

# Parse file_path — prefer jq, fall back to grep
if command -v jq >/dev/null 2>&1; then
  FILE_PATH=$(printf '%s' "${INPUT}" | jq -r '.file_path // empty' 2>/dev/null || true)
else
  FILE_PATH=$(printf '%s' "${INPUT}" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*: *"//' | sed 's/"$//' || true)
fi

[[ -z "${FILE_PATH}" ]] && exit 0

case "${FILE_PATH}" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Factory typecheck hook: pnpm not found — skipping" >&2
  exit 0
fi

# Run project typecheck script if defined, otherwise fall back to tsc --noEmit
if pnpm run typecheck --if-present 2>&1; then
  exit 0
fi

# Explicit fallback — tsc directly
if pnpm exec tsc --noEmit 2>&1; then
  exit 0
fi

echo "Typecheck failed. Fix TypeScript errors before continuing." >&2
exit 2
