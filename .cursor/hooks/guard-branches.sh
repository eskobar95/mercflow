#!/usr/bin/env bash
# MercFlow branch guard — beforeShellExecution hook
# Contract: stdin = JSON context, stdout = JSON {}, exit 0 = allow
#
# Reads the current branch and warns in terminal output if on a protected branch,
# but does NOT block shell execution (protection is enforced at commit time).

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
