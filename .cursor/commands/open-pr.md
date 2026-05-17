# /open-pr

**Usage:** `/open-pr <feature-branch-name>` or `/open-pr <notion-task-url>`

Open a pull request targeting `development` after Code Review is approved.

## Pre-conditions
- Code Reviewer has issued APPROVED (cycle count does not matter as long as decision is APPROVED)
- No uncommitted changes in the worktree
- All checks pass locally

## What it does
1. Rebases branch on latest `development` (`git rebase origin/development`)
2. Runs `pnpm typecheck && pnpm lint && pnpm test` as a final gate — PR does not open if any fail
3. Creates the PR: `feature/... → development` using the standard template below
4. Copies PR URL to Notion task (`PR URL` field)
5. Updates Notion task `Status → In Review`
6. Adds a comment on the Notion task page (see agent-workflow skill Stage 4)
7. **Does not trigger Bugbot manually** — Bugbot activates automatically on open PRs

## PR creation command

```bash
git fetch origin development
git rebase origin/development

# Run final gates
pnpm typecheck && pnpm lint && pnpm test

# Open PR targeting development
gh pr create \
  --base development \
  --title "{Slice objective} ({package})" \
  --body "$(cat <<'EOF'
## What this does
[One paragraph: the user outcome this slice delivers]

## Notion task
[Link to Notion task]

## PRD
[Link to source PRD]

## Packages touched
- [ ] admin-ui
- [ ] content-module
- [ ] backend
- [ ] design-tokens

## Layers changed
- **DB**: [migration files, new columns/tables — or "no DB changes"]
- **Service**: [new/changed service methods — or "no changes"]
- **API**: [new/changed endpoints — or "no changes"]
- **UI**: [new/changed components or pages — or "no changes"]
- **Tests**: [test files added or updated]

## How to test manually
1. [Step]
2. [Step]
3. Expected result: [...]

## Acceptance criteria
- [ ] [Criterion from task description]
- [ ] [...]

## Security checklist
- [ ] No secrets in code
- [ ] Input validated at API boundary
- [ ] No SQL concatenation

## Notes for reviewer
[Anything Bugbot or the human reviewer should pay extra attention to]
EOF
)"
```

## Instructions
Read and follow `.cursor/skills/agent-workflow/SKILL.md`, then execute **Stage 4: Open PR**.

Branch or task: $input
