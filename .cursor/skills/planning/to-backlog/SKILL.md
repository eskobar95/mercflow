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

## Engine assignment and task sizing

Every task must have an `**Engine:**` field. **The engine determines the sizing** — do not apply the same granularity to both.

### Engine: cursor — slice small

Cursor subagents have a bounded context window and a max 2-revision loop. Tasks must be completable in one focused pass.

| Signals → cursor | Sizing |
|------------------|--------|
| UI changes, config, boilerplate | ≤3 core files, ≤4h |
| Mechanical refactor (rename, extract, migrate) | Single concern |
| HITL tasks (always cursor) | — |
| Isolated service/utility with clear interface | Well-defined boundary |
| Default when unclear | Prefer cursor + small |

Write cursor tasks as **vertical slices**: one end-to-end behaviour, not a horizontal layer.

### Engine: pi — feature-level, do NOT over-slice

Pi runs its own internal decomposition via `/harness-plan`. Giving Pi a micro-task wastes the harness overhead. Give Pi a **feature objective** — Pi will break it into layers, plan, execute, and review internally.

| Signals → pi | Pi handles internally |
|--------------|----------------------|
| Touches >3 interconnected layers (DB → service → API → UI) | Decomposition via harness/planning agents |
| Complex algorithm or non-trivial business logic | Hypothesis + adversary review |
| High regression risk across multiple modules | Isolated evaluator + adversary subagents |
| Requires deep codebase understanding (Graphify) | planning/stack-researcher + implementation-researcher |
| Estimated >4-6h for a Cursor subagent | Internal plan-packet + repair loop |
| Architectural change that warrants an ADR | Plan debate gate |

**Pi task format** — write the **objective + layers + acceptance criteria**, not micro-steps:

```markdown
## T003 — Payment webhook handler

**Engine:** pi
**Objective:** Implement Stripe webhook receiver with idempotency, retry, and audit log. See ADR-004.
**Layers in scope:** webhook receiver → idempotency service → event handlers → DB schema → integration tests
**Acceptance criteria:**
- Handles payment_intent.succeeded + payment_intent.payment_failed
- Idempotency key stored; duplicate events silently ignored
- Max 3 retries with exponential backoff, dead-letter after exhaustion
- Integration test covers happy path + duplicate + timeout
**Out of scope:** UI, refund flow, email notifications
**ADR refs:** ADR-004
```

Pi decomposes this internally. Do NOT split this into "DB task", "service task", "API task" — that is the Cursor pattern, not the Pi pattern.

### Quick reference

| | cursor | pi |
|--|--------|----|
| Task scope | 1 bounded behaviour | 1 feature / capability |
| Slice granularity | Vertical micro-slice | Feature objective |
| Internal decomposition | You do it in tasks.md | Pi does it in /harness-plan |
| Review | thermo + check-compiler | Evaluator + adversary subagents |
| HITL | Allowed | Never (AFK only) |
| Parallel execution | Yes (same group) | Sequential (one Pi session at a time) |

Set in tasks.md as `**Engine:** cursor` or `**Engine:** pi`.

## Linear sync (when `linear.enabled: true`)

After writing tasks.md, check `factory.config.yaml linear.enabled`.

If `true`: load and run `skills/productivity/linear-sync/SKILL.md` to create Linear issues for all new tasks.

Each created task gets a `**Linear:** LIN-NNN` field added to its metadata in tasks.md.

## Output to user

```markdown
## To-backlog complete

- **Milestones:** n | **Sprints:** n | **Tasks:** n
- **AFK:** n | **HITL:** n | **Engine cursor:** n | **Engine pi:** n

**S001 parallel groups:**
- A: T001 (cursor), T002 (pi)
- B: T003 (blocked by T001, cursor)

**Linear:** N issues created (or: linear.enabled: false — skipped)

**Next:** Create integration branch → `/run-sprint S001`
```

## Do not

- Implement code
- Create tasks without sprint/milestone IDs
- Skip user approval step on first breakdown for a milestone
- Assign `Engine: pi` to HITL tasks
