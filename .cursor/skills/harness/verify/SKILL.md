---
name: verify
description: Run typecheck, lint, and test — return structured pass/fail for harness
---

# Verify skill

Run project quality scripts and return a **structured** result for harness. Fix failures only if harness sent you back from implement with revision; otherwise report only.

## Prerequisites

- Implementation committed on task branch
- `package.json` scripts exist (from TECHSPEC or discover):

| Check | Command (prefer) | Fallback |
|-------|------------------|----------|
| Typecheck | `pnpm typecheck` | `pnpm exec tsc --noEmit` |
| Lint | `pnpm lint` | `pnpm exec eslint .` |
| Test | `pnpm test --run` | `pnpm test:unit --run` |

> **`--run` is mandatory in agent/subagent context.** Without it Vitest starts in watch mode and the subagent hangs indefinitely.

Read `.factory/context/TECHSPEC.md` **Commands** table for project-specific commands.

## Procedure

1. `git status` — ensure on correct task branch
2. Read task block in `.factory/planning/tasks.md` — note **PRD journey**, **BDD scenarios**, **ADRs**
3. Run typecheck → capture stdout/stderr
4. Run lint → capture output
5. Run tests (see **Focused test strategy** below) → capture output

## Focused test strategy

Prefer narrowest relevant suite before full run — saves context and matches changed files:

1. If task specifies **BDD scenarios** → run those first (path from TECHSPEC **Testing → BDD**)
2. Else if task lists test files in **Layers in scope → Tests** → run those paths only
3. Else if `git diff --name-only origin/dev...HEAD` shows changed files → map to co-located tests (`*.test.ts`, `*.spec.ts`)
4. If focused pass → run full `pnpm test --run` only when TECHSPEC or harness requires it
5. On architecture/lint failure mentioning **ADR-NNN** → load `skills/planning/adr-lookup/SKILL.md` before retry

Example focused commands:

```bash
pnpm exec vitest run src/features/checkout/checkout.test.ts
pnpm exec cucumber-js .factory/specs/J001-checkout.feature
```

## Pass/fail rules

- **PASS:** all three exit code 0
- **FAIL:** any non-zero exit or missing script (treat missing script as fail with note)

## Output format (required)

Harness parses this block:

```markdown
## Verify — T[id]

**Result:** PASS | FAIL

### Typecheck
- **Status:** pass | fail
- **Details:** [first 20 lines of errors or "ok"]

### Lint
- **Status:** pass | fail
- **Details:** [summary]

### Test
- **Status:** pass | fail
- **Details:** [failed test names / counts]

### Recommended action
[If FAIL: specific fix hints for implement agent. If PASS: proceed to review.]
```

## Do not

- Open PR or merge branches
- Skip tests without documenting reason in Recommended action
- Mark task done in tasks.md
