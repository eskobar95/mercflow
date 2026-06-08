#!/usr/bin/env bash
# Factory beforeShellExecution: block git add/commit of env and credential files.
# Exit 0 with permission deny JSON.

set -euo pipefail

INPUT=$(cat)

if command -v jq >/dev/null 2>&1; then
  CMD=$(printf '%s' "${INPUT}" | jq -r '.command // empty' 2>/dev/null || true)
else
  CMD=$(printf '%s' "${INPUT}" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*: *"//' | sed 's/"$//' || true)
fi

[[ -z "${CMD}" ]] && printf '{"permission":"allow"}' && exit 0

deny() {
  local msg="$1"
  ESCAPED=$(printf '%s' "${msg}" | sed 's/\\/\\\\/g; s/"/\\"/g')
  printf '{"permission":"deny","message":"%s"}' "${ESCAPED}"
  exit 0
}

# Only inspect git add / git commit commands
case "${CMD}" in
  git\ add*|git\ commit*) ;;
  *) printf '{"permission":"allow"}' && exit 0 ;;
esac

# Block sensitive paths (word boundary / path segment)
BLOCKED_PATTERNS=(
  '\.env'
  '\.env\.'
  'credentials\.json'
  'secrets\.json'
  '\.pem'
  '\.p12'
  'id_rsa'
  'id_ed25519'
)

for pat in "${BLOCKED_PATTERNS[@]}"; do
  if printf '%s' "${CMD}" | grep -qE "${pat}"; then
    deny "Factory blocked git command targeting sensitive file pattern (${pat}). Use .env.example with placeholder names only."
  fi
done

printf '{"permission":"allow"}'
exit 0
