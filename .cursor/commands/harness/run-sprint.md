# /run-sprint [sprint-id]

Execute sprint tasks via **lead harness** + **parallel Task subagents**. Updates `tasks.md` and **per-task** `diary.md` entries.

## Usage

```text
/run-sprint S001
```

## Prerequisites

- `.factory/planning/tasks.md` with sprint tasks and **Parallel group** / **Mode**
- Branch `dev` exists (run `/bootstrap-branches` if not)
- HITL tasks approved via `/hitl-checkpoint` before dispatch
- Factory harness at `.cursor/skills/factory/harness/`
- Cursor 3.3+ with **Task** tool (subagents)

Task pipeline per subagent: **implement → verify → review → close → fix-ci** (PR CI must pass)

## Lead agent obligations

The session running this command is the **lead**. It MUST:

1. Run harness **preflight** checklist
2. Dispatch each parallel group with **multiple Task calls in one turn** (`run_in_background: true`)
3. **Not** implement AFK tasks inline in the lead session
4. After each subagent: update `tasks.md` + run **log-task** → append `.factory/logs/diary.md`
5. After all groups: run **retro** (sprint summary in diary)

## Procedure

1. Load `skills/harness/harness/SKILL.md` — follow exactly
2. Preflight → print runnable / HITL / blocked
3. For each group A, B, C…: parallel Task dispatch → wait → process results → log-task each
4. Retro + composer summary

## Logs updated

| File | When |
|------|------|
| `tasks.md` | Each task state change |
| `sprints.md` | active → done/blocked |
| `diary.md` | Each task done/blocked/skipped (+ optional started) |
| `diary.md` | Sprint retro at end |

## Composer summary (required)

```markdown
## Sprint S[id] run finished

| Metric | Value |
|--------|-------|
| Tasks done | n |
| Tasks blocked | n |
| Diary entries | n task + 1 retro |

**PRs:** [links]
**Diary:** .factory/logs/diary.md
**Next:** /run-sprint S00y | /milestone-review M00x
```

## Failure handling

- One task blocked: continue independent tasks in same group
- All tasks in group blocked: stop; ask user before next group

## Do not

- Merge to staging/main
- Skip log-task on terminal states
