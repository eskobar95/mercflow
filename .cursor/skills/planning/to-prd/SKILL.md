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

| File | Content |
|------|---------|
| `.factory/context/PRD.md` | Problem, goals, non-goals, **user journeys**, success metrics, deliverables |
| `.factory/context/TECHSPEC.md` | Stack, constraints, integrations, branch model, scripts, ADR log |
| `.factory/context/STACK.md` | Short bullet mirror of stack |

Use templates: `templates/PRD.md`, `templates/TECHSPEC.md`.

## Procedure

1. Read `.factory/context/CONTEXT.md` and ADRs — terminology must match
2. Read repo: `package.json`, structure, env example
3. Ask **at most 1–2** blocking questions; otherwise document assumptions in TECHSPEC
4. Write PRD — tight v1 scope; define **User journeys** (J001, J002…) with problem, goal, steps; extras → non-goals or open questions
5. Write TECHSPEC — include `pnpm typecheck`, `lint`, `test` commands; note BDD runner if any
6. Add or update **ADR-001** for the primary architectural choice — include **Scope**, **Enforcement**, **How to fix** (see `templates/ADR.md`)

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
