---
name: harness
description: Lead agent playbook — mandatory parallel Task subagents, revision loop, tasks.md + per-task diary logging
---

# Harness skill

You are the **lead agent** for a sprint. You **orchestrate only** — you do not implement task code yourself unless every subagent in a group failed and user explicitly asks you to rescue one task.

## Inputs

- Sprint ID (e.g. `S001`) from `/run-sprint` or user
- `.factory/planning/tasks.md`
- `.factory/context/TECHSPEC.md`
- `.factory/planning/sprints.md`

## Preflight (before any dispatch)

Run this checklist; stop and report if failing:

- [ ] Sprint exists in `sprints.md`
- [ ] Git branch `dev` exists — if not, tell user to run `/bootstrap-branches`
- [ ] At least one runnable task for this sprint (or report "nothing to run")
- [ ] Set sprint **Status** to `active` in `sprints.md`
- [ ] List runnable tasks by parallel group; list **HITL** tasks as skipped until user confirms

Print to user:

```markdown
## Harness preflight — S[id]
**Runnable:** T001, T002 (group A) | **HITL skipped:** T005 | **Blocked:** none
**Next:** Dispatching group A (2 subagents in parallel)
```

## Task format (parse from tasks.md)

- `## T[id] — [title]`
- **Sprint**, **Milestone**, **Status**, **Mode** (`AFK` | `HITL`), **Parallel group**, **Blocked by**, **Branch**
- Slice objective, layers, acceptance criteria, out of scope, context, definition of done

Status: `todo` | `in-progress` | `blocked` | `done`

## Dependency graph

1. Filter tasks for active **Sprint**
2. Skip `done`
3. Group by **Parallel group** (A, B, C…)
4. Runnable when: `todo`, blockers satisfied, **Mode: AFK**
5. **HITL** → skip unless `**HITL approved:**` present; else log as `skipped`, do not dispatch
6. Run groups in order: A → B → C …

## Mandatory subagent dispatch (non-negotiable)

For each parallel group with **N** runnable AFK tasks:

1. **One user-visible message** must launch **N Task tool calls** — one per task — in the **same turn** (parallel dispatch).
2. Set `run_in_background: true` on each Task unless the environment requires foreground (then still launch all N in one turn without waiting between launches).
3. Use `subagent_type: generalPurpose` (or `best-of-n-runner` only if user configured isolated worktrees).
4. **Do not** implement T00x yourself in the lead session while subagents are running.
5. **Wait** for all tasks in the group to complete before starting the next group.
6. If only **one** task in a group, still use Task tool (do not inline-implement as lead).

### Task tool prompt template

```text
You are a Factory task worker for [Txxx] sprint [Sxxx].

Read .factory/planning/tasks.md section ## Txxx and .factory/context/TECHSPEC.md.
Follow .cursor/rules and factory skills under skills/harness/.

Branch: [exact Branch from task metadata].
Create/checkout branch from dev, implement, commit, push.

Run in order:
1. skills/harness/implement/SKILL.md
2. skills/harness/verify/SKILL.md — if FAIL, retry implement once (revision 1)
3. skills/harness/review/SKILL.md — if FAIL, retry implement once (revision 2 max)
4. skills/harness/close/SKILL.md — only if verify + review PASS
5. skills/harness/fix-ci/SKILL.md — until PR checks green (max 3 iterations)

Max 2 full revision cycles (implement→verify→review). If still failing, blocked.

Return ONLY this YAML block:

task_id: Txxx
status: done | blocked | error
branch: ...
pr_url: ...
revision_cycles: N
blocker: ... or none
summary: one line
verify: pass | fail
review_phase1: pass | fail
review_phase2_thermo: pass | fail
ci: pass | fail | local-only | n/a
ci_iterations: N
unblocked_tasks: T00y, ... or none
error_reason: ... (only if status: error)
```

### After each subagent returns (lead duties)

Process results **in task ID order** for consistency:

1. Parse YAML from subagent output
2. **If YAML missing or malformed:** treat as `status: error`, set task `blocked`, run log-task with `error_reason`, continue other tasks
3. Update `.factory/planning/tasks.md` (status, PR, blocker) — `done` only if `status: done` AND `ci: pass` or `ci: local-only`
4. **Required:** run `skills/harness/log-task/SKILL.md` with parsed fields
5. Optional: `log-task` with `started` when setting `in-progress` before dispatch
6. Re-evaluate **Blocked by** for downstream tasks

### Single-task mode

When invoked via `/run-task Txxx` (not full sprint):

- Run preflight for one task only
- Dispatch one Task subagent
- Same post-processing and log-task rules

## Per-task pipeline (inside subagent)

| Step | Skill | On fail |
|------|-------|---------|
| implement | implement | retry once |
| verify | verify | → implement (cycle 1) |
| review | review + thermo-nuclear | → implement (cycle 2 max) |
| close | close | blocked if PR fails |
| fix-ci | fix-ci | blocked if checks fail after 3 iterations |

## Revision loop

Max **2** full cycles per task. Then `blocked` + log-task + continue other tasks in group if independent.

## Group completion

When all tasks in group A are terminal (`done` or `blocked`):

```markdown
## Group A complete
| Task | Status | PR |
|------|--------|-----|
| T001 | done | … |
```

Proceed to group B only when A has no pending `in-progress` / `todo` AFK work left.

## Sprint completion

When no runnable AFK work remains:

1. Set sprint status `done` or `blocked` in `sprints.md`
2. Run `skills/harness/retro/SKILL.md` (synthesizes sprint; per-task lines already in diary)
3. Print sprint summary to user

## Rules

- Never push to `staging` or `main`
- Task PRs target `dev` only
- Never skip `log-task` on terminal task states during `/run-sprint`

## Skills referenced

- `skills/harness/implement/SKILL.md`
- `skills/harness/verify/SKILL.md`
- `skills/harness/review/SKILL.md`
- `skills/harness/thermo-nuclear-code-quality-review/SKILL.md`
- `skills/harness/close/SKILL.md`
- `skills/harness/fix-ci/SKILL.md`
- `skills/harness/hitl-checkpoint/SKILL.md` (via `/hitl-checkpoint`, not subagent)
- `skills/harness/log-task/SKILL.md` (**lead only, after each task**)
- `skills/harness/retro/SKILL.md`
