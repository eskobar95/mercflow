# /finish-task

**Usage:** `/finish-task <notion-task-url>`

Clean up the local git worktree after a task has been merged and Status → Done.

## What it does
1. Verifies the Notion task Status is "Done" (aborts if not)
2. Reads the `Feature Branch` field from Notion to confirm the branch name
3. Removes the git worktree: `git worktree remove ../mercflow-worktrees/{task-id}`
4. Prunes stale worktree refs: `git worktree prune`
5. Prunes deleted remote branches: `git fetch --prune`
6. Confirms cleanup complete

## Pre-conditions
- Notion task Status = "Done" (set automatically by on-merge.ts after Tech Lead merges)
- You are NOT inside the worktree directory when running this

## Instructions
Read and follow `.cursor/skills/agent-workflow/SKILL.md`, then execute **Stage 7: Local Cleanup**.

Task URL: $input
