# /start-task

**Usage:** `/start-task <notion-task-url>`

Set up a git worktree and feature branch for a Notion task, then begin implementation.

## What it does
1. Fetches the task from Notion (title, package, PRD link, acceptance criteria)
2. Creates a git worktree at `../mercflow-worktrees/{task-id}/`
3. Creates a feature branch: `feature/{package}/{task-slug}`
4. Updates Notion task Status → "In Progress"
5. Begins implementation as the Worker Agent following the vertical slice methodology

## Instructions
Read and follow `.cursor/skills/agent-workflow/SKILL.md`, then execute **Stage 1: Setup** followed by **Stage 2: Implementation**.

Also read `.cursor/skills/po-orchestrator/SKILL.md` for vertical slicing principles, and the relevant package rule from `.cursor/rules/` before writing code.

Task URL: $input
