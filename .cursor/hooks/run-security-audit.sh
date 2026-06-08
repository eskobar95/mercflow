#!/usr/bin/env bash
# Factory hook: run security audit when package.json or lockfile changes.
# Logs findings to .factory/logs/diary.md. Does not block by default.

set -euo pipefail

INPUT=$(cat)

# Parse file_path
if command -v jq >/dev/null 2>&1; then
  FILE_PATH=$(printf '%s' "${INPUT}" | jq -r '.file_path // empty' 2>/dev/null || true)
else
  FILE_PATH=$(printf '%s' "${INPUT}" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*: *"//' | sed 's/"$//' || true)
fi

case "${FILE_PATH}" in
  *package.json|*pnpm-lock.yaml|*package-lock.json) ;;
  *) exit 0 ;;
esac

DIARY=".factory/logs/diary.md"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Run pnpm audit if available, fall back to npm — capture output regardless of exit code
if command -v pnpm >/dev/null 2>&1; then
  OUTPUT=$(pnpm audit --audit-level=high 2>&1 | head -40 || true)
elif command -v npm >/dev/null 2>&1; then
  OUTPUT=$(npm audit --audit-level=high 2>&1 | head -40 || true)
else
  exit 0
fi

mkdir -p "$(dirname "${DIARY}")"
{
  printf '\n## Security audit — %s\n\n' "${TIMESTAMP}"
  printf 'Triggered by edit: `%s`\n\n' "${FILE_PATH}"
  printf '```\n%s\n```\n' "${OUTPUT}"
} >> "${DIARY}"

exit 0
