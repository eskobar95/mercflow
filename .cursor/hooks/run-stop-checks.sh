#!/usr/bin/env bash
# Factory stop hook: run pnpm lint at end of agent turn.
# If lint fails, emits followup_message so the agent auto-corrects before stopping.
# Also scans staged/unstaged diff for common secret patterns.
#
# Cursor stop hook contract:
#   stdin: JSON { status, loop_count }
#   stdout: JSON { followup_message? }  — empty {} = all good
#   exit 0 always (errors communicated via followup_message)

set -euo pipefail

INPUT=$(cat)

# Skip if agent was aborted
if command -v jq >/dev/null 2>&1; then
  STATUS=$(printf '%s' "${INPUT}" | jq -r '.status // empty' 2>/dev/null || true)
  LOOP=$(printf '%s' "${INPUT}" | jq -r '.loop_count // 0' 2>/dev/null || true)
else
  STATUS=$(printf '%s' "${INPUT}" | grep -o '"status"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*: *"//' | sed 's/"$//' || true)
  LOOP=0
fi

[[ "${STATUS}" == "aborted" ]] && echo '{}' && exit 0

# Prevent infinite loop — give up after 3 cycles of this hook auto-correcting
if [[ "${LOOP}" -ge 3 ]]; then
  echo '{}' && exit 0
fi

MESSAGES=()

# ── 1. Lint ──────────────────────────────────────────────────────────────────
if command -v pnpm >/dev/null 2>&1; then
  LINT_OUT=$(pnpm lint 2>&1 | tail -30 || true)
  LINT_EXIT=${PIPESTATUS[0]:-0}
  if [[ "${LINT_EXIT}" -ne 0 ]]; then
    MESSAGES+=("**Lint failed.** Fix the errors below before finishing:\n\`\`\`\n${LINT_OUT}\n\`\`\`")
  fi
fi

# ── 2. Secret scan ───────────────────────────────────────────────────────────
DIFF=$(git diff --cached 2>/dev/null || true)
DIFF+=$'\n'
DIFF+=$(git diff 2>/dev/null || true)

SECRET_HITS=()
SECRET_PATTERNS=(
  'sk-[a-zA-Z0-9]{20,}'           # OpenAI / Anthropic keys
  'AKIA[0-9A-Z]{16}'               # AWS access key
  'ghp_[a-zA-Z0-9]{36}'           # GitHub PAT
  'glpat-[a-zA-Z0-9\-_]{20,}'     # GitLab PAT
  'Bearer [a-zA-Z0-9\-_\.]{30,}'  # Generic bearer token
  'password\s*=\s*["\x27][^"]{4,}'  # password = "..."
  'DATABASE_URL\s*=\s*postgres'    # DB connection string
)

for pattern in "${SECRET_PATTERNS[@]}"; do
  hit=$(printf '%s' "${DIFF}" | grep -oE "${pattern}" | head -3 || true)
  [[ -n "${hit}" ]] && SECRET_HITS+=("  \`${hit}\` (pattern: ${pattern})")
done

if [[ ${#SECRET_HITS[@]} -gt 0 ]]; then
  MESSAGES+=("**Possible secret detected in diff.** Review before committing:\n$(printf '%s\n' "${SECRET_HITS[@]}")")
fi

# ── Output ───────────────────────────────────────────────────────────────────
if [[ ${#MESSAGES[@]} -eq 0 ]]; then
  echo '{}'
else
  COMBINED=$(printf '%s\n\n' "${MESSAGES[@]}")
  # JSON-escape newlines and quotes for followup_message
  ESCAPED=$(printf '%s' "${COMBINED}" | sed 's/\\/\\\\/g; s/"/\\"/g' | awk '{printf "%s\\n", $0}' | tr -d '\n')
  printf '{"followup_message": "%s"}' "${ESCAPED}"
fi

exit 0
