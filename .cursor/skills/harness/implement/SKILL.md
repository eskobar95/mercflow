---
name: implement
description: Implement a single atomic task — branch, code within scope, follow TECHSPEC and rules
---

# Implement skill

Implement **one** task from `.factory/planning/tasks.md`. Do not run verify/review/close in the same turn unless harness asked for full pipeline.

## Before coding

1. Read the full task section (`## T[id]`)
2. Read `.factory/context/TECHSPEC.md`, `.factory/context/PRD.md`, and `.factory/context/CONTEXT.md` (glossary — use correct domain terms)
3. Read **Context for implementing agent** and explore cited files
4. Confirm base branch exists: `dev` (if missing, user runs `/bootstrap-branches`)

## Git workflow

```bash
git fetch origin
git checkout dev
git pull origin dev
git checkout -b feature/[sprint]/[task-id]-[slug]
```

Use exact **Branch** from task metadata.

### Parallel groups — rebase before push

If another task in the same **Parallel group** may have merged to `dev` while you worked:

```bash
git fetch origin dev
git rebase origin/dev
# resolve conflicts if any; run verify locally
git push --force-with-lease origin HEAD
```

Only rebase **your task branch**, never `dev`/`staging`/`main`.

## Implementation rules

- **Slice objective** is the north star — stop when acceptance criteria are satisfiable
- **Layers in scope** — only touch listed layers; if DB says "no changes", do not add migrations
- **Out of scope** — do not implement listed items (note in PR if discovered dependency)
- Follow `.cursor/rules` (base, nextjs, drizzle, git as applicable)
- English for code, comments, and commit messages
- Conventional commits; logical small commits allowed, squash optional at PR

## Security

- No secrets in code; use env vars documented in TECHSPEC
- Validate API inputs at boundaries
- Server-only credentials in Route Handlers / Server Actions / server modules

## Tests

- Add/update tests per **Tests** in layers and acceptance criteria
- Do not delete failing tests to green CI without fixing behavior

## Output to harness

```markdown
## Implement — T[id]

**Status:** complete | partial | blocked
**Branch:** feature/...
**Files changed:** [summary]
**Notes:** [assumptions, follow-ups outside scope]
**Blockers:** [if any — else none]
```

## Subagent mode

When dispatched by harness Task tool, you are part of a longer pipeline — do not open PR or write diary. Return control to implement → verify → review → close chain; harness collects final YAML.

## Do not

- Open PR (close skill does that)
- Run full milestone CI
- Refactor unrelated files
- Mark task `done` in tasks.md (close skill does that)
