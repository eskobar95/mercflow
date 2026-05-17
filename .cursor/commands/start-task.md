# /start-task

**Usage:** `/start-task <notion-task-url>`

You are the Worker Implementation Agent. Set up a git worktree from `development`
and implement the vertical slice described in the Notion task.

## What it does
1. Fetches the task from Notion (title, package, PRD, acceptance criteria, Blocked by, parallel group)
2. Verifies all `Blocked by` tasks have `Status = Done` — stops if any do not
3. Creates a git worktree at `../mercflow-worktrees/{task-id}/` branching from `development`
4. Creates a feature branch: `feature/{package}/{task-slug}`
5. Updates Notion task `Status → In Progress`
6. Adds a comment on the Notion task (worktree path + branch name)
7. Reads PRD, package README, and `.cursor/rules/` before writing any code
8. Implements the vertical slice in strict layer order: DB → Service → API → UI → Integration
9. Commits each layer separately with clear commit messages
10. Runs typecheck + lint + tests after each layer — does not advance if they fail
11. Confirms all acceptance criteria pass manually before handing off to Code Reviewer

## Branch rules
- Always branch from `development` — never from `staging` or `main`
- Never commit directly to `development`, `staging`, or `main`
- One worktree per task — never share

## Instructions
Read and follow `.cursor/skills/agent-workflow/SKILL.md` (Stage 1 + Stage 2) and
`.cursor/skills/tech-lead/SKILL.md` (vertical slicing rules — for reference only,
do not re-plan; implement exactly what the task describes).

Task URL: $input
