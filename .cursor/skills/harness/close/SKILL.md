---
name: close
description: Self-review diff, open PR to dev, update tasks.md, unblock parallel groups
---

# Close skill

Finalize **one** task: self-review, PR to `dev`, update planning files.

## Prerequisites

- Implement, verify, and review returned PASS for this task
- Branch pushed to origin (push if not)

## Self-review (pre-PR)

1. `git diff dev...HEAD` — read full diff
2. Confirm no secrets, debug logs, or unrelated files
3. Note any **tech debt** intentionally left (must be in Out of scope or documented)

## Pull request

- **Base:** `dev`
- **Head:** task branch `feature/[sprint]/[task-id]-[slug]`
- **Title:** `feat([scope]): [task title]` or conventional type matching change

### PR description template

```markdown
## Task T[id] — [title]

**Sprint:** S[id] | **Milestone:** M[id]

### What was built
[Bullet list tied to slice objective]

### Acceptance criteria
- [x] [criterion 1]
- [x] [criterion 2]

### Self-review
- [What you checked in the diff]
- [Thermo-nuclear: PASS or summary of structural findings addressed]
- [Any risks or limitations]

### Tech debt / follow-ups
- [None] or [ticket-style bullets for out-of-scope discoveries]

### Verify summary
Typecheck: pass | Lint: pass | Tests: pass
```

Create PR via `gh pr create` if GitHub CLI available; otherwise instruct user with title/body.

## Fix CI (required before done)

After PR exists, run `skills/harness/fix-ci/SKILL.md`:

1. Poll `gh pr checks` until pass or max 3 fix iterations
2. Task is **not done** if CI still failing — set `blocked` with failing check names
3. Include `ci: pass | fail` in harness YAML

If repo has no GitHub Actions, fix-ci runs local verify as fallback and notes `ci: local-only`.

## Update tasks.md

In `.factory/planning/tasks.md` for this task:

- Set `**Status:** done` only when **CI green** (or local-only pass)
- Optional: add `**PR:** #123` under metadata

## Unblock next work

1. List tasks whose **Blocked by** includes this task ID
2. If all blockers for a task are now `done`, ensure its status is `todo` (not `blocked`)
3. Report to harness which **Parallel group** tasks are now runnable

## Output

Return YAML for **lead harness** (see `skills/harness/harness/SKILL.md`). Lead runs `log-task`; subagent does not append diary.

```markdown
## Close — T[id]

**Status:** done
**PR:** [URL or number]
**Unblocked tasks:** T00y, T00z | none
```

Include in harness YAML: `pr_url`, `unblocked_tasks`, `review_phase1`, `review_phase2_thermo`, `ci`, `ci_iterations`.

## Do not

- Merge the PR (human or CI policy may auto-merge to dev per project setup)
- Merge to `staging` or `main`
- Delete branch until after merge (project git rules)
- Append `.factory/logs/diary.md` (lead `log-task` skill does this)
