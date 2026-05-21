# /open-pr

**Usage:** `/open-pr <feature-branch-name>` or `/open-pr <notion-task-url>`

Open a pull request after Code Review is approved.

## What it does
1. Verifies branch is rebased on latest `development` (`git fetch && git rebase origin/development`)
2. Runs `pnpm typecheck && pnpm lint && pnpm test` as a final gate
3. Reads the Notion task `ID` field (e.g. `MER-25`) and prefixes PR title: `[MER-25] feat(...)`
4. Creates the PR targeting `development` (`gh pr create --base development ...`)
5. Copies PR URL to Notion task `PR URL` field
6. Updates Notion task Status → "In Review"
7. Posts `@Bugbot run` comment on the PR
8. Updates Notion task Status → "Ready to Merge"
9. The automated pipeline now takes over: Bugbot → Tech Lead Merge Agent → Done

## Pre-conditions
- Code Reviewer has issued APPROVED
- No open changes on the worktree
- All checks pass locally

## After this command runs
You are done until you see Notion Status → "Done".
Run `/finish-task <notion-task-url>` to clean up the local worktree.

## Instructions
Read and follow `.cursor/skills/agent-workflow/SKILL.md`, then execute **Stage 4: Open PR**.

Branch or task: $input
