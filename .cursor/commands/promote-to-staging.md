# /promote-to-staging

**Usage:** `/promote-to-staging <sprint-name-or-notion-sprint-url>`

You are the Tech Lead. A sprint is complete and you must promote `development` → `staging`.

## Pre-conditions (verify all before opening PR)

1. Fetch all tasks in this sprint from Notion — every task must have `Status = Done`
2. If any task is not Done: stop and report which tasks are incomplete
3. Fetch `development` and `staging` from origin — confirm development is ahead of staging
4. Check CI status on `development`: `gh run list --branch development --limit 5`
   - If any runs failed: run `/devops-check` first, resolve before promoting
5. Confirm there are no open PRs from `feature/...` → `development` that are approved but not merged

## Open the staging promotion PR

```bash
git fetch origin development staging

gh pr create \
  --base staging \
  --head development \
  --title "chore: promote sprint {N} to staging" \
  --body "$(cat <<'EOF'
## Sprint {N} — staging promotion

### Tasks included
{list each Notion task title + URL}

### User-facing changes
{one line per capability shipped}

### What to verify on staging
{acceptance criteria from sprint tasks — copy from Notion}

### Smoke test checklist
- [ ] Admin UI loads and is navigable
- [ ] Key user flows for each sprint task work end-to-end
- [ ] No console errors in browser on staging
- [ ] No unhandled exceptions in backend logs on staging
- [ ] API endpoints return correct shapes (spot check with curl)

### DevOps sign-off
- [ ] CI passes on this PR
- [ ] No new warnings introduced in pipeline
- [ ] Build times within normal range

### Rollback plan
If staging has a blocking issue: revert the specific commit on development
and re-promote. Do not hotfix directly on staging.
EOF
)"
```

## After staging PR is merged

1. **Close the sprint in Notion** — update the Dates end to today if it finished early:
   - Fetch the Notion Sprint page
   - If today is before the sprint's `Dates.end`: update `Dates.end` to today's date
   - This automatically triggers the `/sprints/ended` webhook → closes the GitHub Milestone

2. Add a comment on the Notion Sprint page:

```
Agent: Tech Lead
Action: Promoted to staging

PR: {staging-pr-url}
Merged: {timestamp}
Status: Smoke tests pending

Tasks in this promotion:
- {task 1 title} — {notion url}
- {task 2 title} — {notion url}
```

2. Monitor CI on the staging PR reactively — run `/devops-check` if anything fails
3. When staging smoke tests pass: run `/promote-to-main`

## Instructions
Read and follow `.cursor/skills/agent-workflow/SKILL.md` (Stage 7) and `.cursor/skills/tech-lead/SKILL.md`.

Sprint: $input
