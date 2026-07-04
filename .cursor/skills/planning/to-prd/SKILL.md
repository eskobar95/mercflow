---
name: to-prd
description: Write PRD and TECHSPEC from aligned understanding — no tasks yet (Matt Pocock to-prd pattern)
---

# To-PRD skill

Turn aligned understanding into **product and technical spec files**. Does not create milestones or tasks.

## Prerequisites

- `/align` completed or user provided explicit brief
- Factory installed; `.factory/` exists

## Outputs

| File | Action |
|------|--------|
| `.factory/context/PRD.md` | **Update** existing (never recreate) — or create if absent |
| `.factory/context/features/[feature-slug].md` | **Preferred** for feature-scoped work (keeps root PRD clean) |
| `.factory/context/TECHSPEC.md` | Update existing or create if absent |
| `.factory/context/STACK.md` | Update existing or create if absent |

**PRD rule:** One canonical PRD per product/feature. Always check if a PRD already exists before writing. If it does: update the relevant sections (goals, journeys, non-goals) — do **not** create a new file.

Use templates: `templates/PRD.md`, `templates/TECHSPEC.md`.

## Procedure

1. **Check existing PRDs first:**
   - `ls .factory/context/` — is there a root `PRD.md`?
   - `ls .factory/context/features/` — is there an existing feature PRD?
   - If yes: load it and update; do not create a duplicate
2. Read `.factory/context/CONTEXT.md` and ADRs — terminology must match
3. Read repo: `package.json`, structure, env example
4. Ask **at most 1–2** blocking questions; otherwise document assumptions in TECHSPEC
5. Write/update PRD — tight v1 scope; define **User journeys** (J001, J002…) with problem, goal, steps; extras → non-goals or open questions
6. Write/update TECHSPEC — include `pnpm typecheck`, `lint`, `test` commands; note BDD runner if any
7. Add or update **ADR** for the primary architectural choice — include **Scope**, **Enforcement**, **How to fix**

## Quality bar

- Success metrics are measurable
- Non-goals explicit
- At least one **User journey** (J001) for the primary v1 flow
- Architectural ADRs include enforcement command (local = CI)
- No invented secrets or API keys

## Output to user

```markdown
## To-PRD complete

**Files:** PRD.md, TECHSPEC.md, STACK.md
**ADRs touched:** [list]
**Suggested next:** `/to-backlog` then `/run-sprint S001`
```

## Do not

- Write `tasks.md` or milestones (that's `to-backlog`)
- Implement code

## Pairs with

- `skills/planning/to-backlog/SKILL.md`
- `skills/planning/adr-lookup/SKILL.md`
