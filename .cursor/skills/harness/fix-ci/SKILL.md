---
name: fix-ci
description: Wait for PR CI checks, fix failures iteratively until green — run after PR is opened
---

# Fix CI skill

Run **after** `close` opens a PR. Task is not `done` until PR checks are green (or max iterations exhausted → `blocked`).

## Prerequisites

- PR exists for task branch → `dev`
- `gh` CLI authenticated
- Local branch pushed

## Workflow

1. Resolve PR: `gh pr view --head <branch> --json number,url,statusCheckRollup` or use `pr_url` from close
2. Poll checks (wait up to 3 min for first results):

```bash
gh pr checks <number> --json name,bucket,state,workflow,link,description
```

3. If all checks **pass** (or only skipped/neutral) → **PASS**, proceed
4. If any **fail** or **pending** after wait:
   - Extract first actionable failure from check name + description/link
   - Apply smallest fix on task branch
   - Commit, push
   - Re-poll (max **3 fix iterations** per task)
5. After 3 iterations still failing → **FAIL** → task `blocked`, blocker cites failing check

## Common fixes (in order)

| Failure | Fix |
|---------|-----|
| Typecheck | Fix TS errors locally, `pnpm typecheck` |
| Lint | `pnpm lint --fix` or manual fix |
| Test | Fix failing test or implementation |
| Build | Fix import/env/build config |
| Missing migration | Add migration if schema changed |

## Pass criteria

```bash
gh pr checks <number> --json state,bucket | jq -e 'all(.[]; .state == "SUCCESS" or .state == "SKIPPED" or .bucket == "neutral")'
```

If no CI configured on repo, run local verify suite instead and note in output: `ci: local-only`.

## Output format

```markdown
## Fix CI — T[id]

**Result:** PASS | FAIL
**PR:** #123
**Iterations:** 0-3
**Checks:** all green | [failing check names]

### Fixes applied
- [iteration 1: what changed]

### Recommended action
[If FAIL: return to implement with check log excerpt]
```

Include in harness YAML: `ci: pass | fail`, `ci_iterations: N`

## Do not

- Merge PR
- Force-push protected branches
- Mark task done if checks still failing (unless user explicitly waives in conversation)
