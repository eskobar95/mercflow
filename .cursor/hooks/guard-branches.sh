#!/usr/bin/env bash
# MercFlow branch guard — beforeShellExecution hook
# Contract: stdin = JSON context, stdout = JSON {}, exit 0 = allow

PROTECTED="main staging development"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

for branch in $PROTECTED; do
  if [ "$CURRENT_BRANCH" = "$branch" ]; then
    echo "⚠️  guard-branches: on protected branch '$branch' — do not git commit directly here." >&2
    break
  fi
done

echo '{}'
exit 0
