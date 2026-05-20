# /open-pr

**Usage:** `/open-pr <feature-branch-name>` or `/open-pr <notion-task-url>`

Open a pull request after Code Review is approved.

## What it does
1. Verifies branch is rebased on latest `development` (`git fetch && git rebase origin/development`)
2. Runs `pnpm typecheck && pnpm lint && pnpm test` as a final gate
3. Creates the PR targeting `development` (`gh pr create --base development ...`)
4. Copies the PR URL back to the Notion task (`PR URL` field)
5. Updates Notion task Status → "In Review"
6. Notes that Bugbot will activate automatically — do not trigger it manually

## Pre-conditions
- Code Reviewer has issued APPROVED
- No open changes on the worktree
- All checks pass locally

## Instructions
Read and follow `.cursor/skills/agent-workflow/SKILL.md`, then execute **Stage 4: Open PR**.

Branch or task: $input
