#!/usr/bin/env bash
# Factory beforeShellExecution hook: block dangerous git operations.
#
# Cursor contract:
#   stdin: JSON { command, ... }
#   stdout: JSON { permission: "allow"|"deny", message? }
#   exit 0 always

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
  # JSON-escape
  ESCAPED=$(printf '%s' "${msg}" | sed 's/\\/\\\\/g; s/"/\\"/g')
  printf '{"permission":"deny","message":"%s"}' "${ESCAPED}"
  exit 0
}

# ── Block: force push to protected branches ──────────────────────────────────
if printf '%s' "${CMD}" | grep -qE 'git push.*(--force|-f)'; then
  if printf '%s' "${CMD}" | grep -qE '(dev|staging|main)'; then
    deny "Force push to a protected branch (dev/staging/main) is blocked by Factory. Use a feature branch PR instead."
  fi
fi

# ── Block: direct commit/push to protected branches ─────────────────────────
if printf '%s' "${CMD}" | grep -qE '^git (commit|push)'; then
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)
  case "${CURRENT_BRANCH}" in
    main|staging|dev)
      deny "Direct commit/push to '${CURRENT_BRANCH}' is blocked by Factory (rules/git.mdc). Checkout a feature branch: feature/[sprint]/[task-id]-[slug]"
      ;;
  esac
fi

# ── Block: reset --hard without explicit confirmation ───────────────────────
if printf '%s' "${CMD}" | grep -qE 'git reset --hard (HEAD|origin)'; then
  deny "git reset --hard is blocked by Factory to prevent accidental data loss. Use 'git stash' or confirm intent manually."
fi

printf '{"permission":"allow"}'
exit 0
