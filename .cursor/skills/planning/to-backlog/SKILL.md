---
name: to-backlog
description: Break PRD into milestones, sprints, and vertical-slice tasks with AFK/HITL and parallel groups (Matt Pocock to-issues pattern)
---

# To-backlog skill

Convert an existing PRD/TECHSPEC into **milestones, sprints, and atomic tasks** in `.factory/planning/`.

## Prerequisites

- `.factory/context/PRD.md` and `TECHSPEC.md` populated (`/to-prd` or equivalent)
- User approves breakdown granularity before final write (propose first, then write)

## Outputs

| File | Content |
|------|---------|
| `.factory/planning/milestones.md` | M001+, dependencies, sprint mapping |
| `.factory/planning/sprints.md` | S001+ table |
| `.factory/planning/tasks.md` | T001+ per `templates/tasks.md` |

## Vertical slices (required)

Each task is a **tracer bullet** through the stack — not horizontal phases.

| Bad (horizontal) | Good (vertical) |
|------------------|-----------------|
| "Build schema" | "User can create X end-to-end" |
| "Build API" then "Build UI" | "User sees first validation error end-to-end" |

Include DB/API/UI/Tests in **Layers in scope** only when that slice needs them.

## AFK vs HITL

Every task must set:

- **Mode: AFK** — agent can implement without further human input
- **Mode: HITL** — needs human checkpoint (design review, arch decision, product call)

Prefer AFK when possible. HITL tasks must say **HITL reason** in context section.

## Parallel groups and dependencies

- **Parallel group:** A, B, C… — same letter runs in parallel when blockers satisfied
- **Blocked by:** `none` or `T00x` list
- One task = one PR to `dev`
- Branch: `feature/[sprint]/[task-id]-[slug]`

## Procedure

1. Read PRD (especially **User journeys** J001…), TECHSPEC, CONTEXT.md, ADRs
2. Map each task to a **PRD journey** id; note **BDD scenarios** when `.factory/specs/` files exist or should be created
3. Propose milestone + task breakdown in Composer (table: ID, title, journey, mode, group)
4. **Wait for user approval** on granularity and dependencies
5. Write milestones.md, sprints.md, tasks.md — include `PRD journey`, `BDD scenarios`, `ADRs` fields per task template
6. Summarize parallel groups for first sprint

## Output to user

```markdown
## To-backlog complete

- **Milestones:** n | **Sprints:** n | **Tasks:** n
- **AFK:** n | **HITL:** n

**S001 parallel groups:**
- A: T001, T002
- B: T003 (blocked by T001)

**Next:** Create `dev` branch → `/run-sprint S001`
```

## Do not

- Implement code
- Create tasks without sprint/milestone IDs
- Skip user approval step on first breakdown for a milestone
