# /run-task [task-id]

Run **one** task through the full harness pipeline (implement → verify → review → close → fix-ci).

## Usage

```text
/run-task T003
```

## When to use

- Re-run a failed or blocked task
- Run a single task without full sprint
- After `/hitl-checkpoint T003` approved a HITL task

## Procedure

1. Load `skills/harness/harness/SKILL.md` — **single-task mode**:
   - Skip sprint-wide group dispatch
   - Preflight: `dev` exists, task is runnable (`todo`, blockers satisfied, HITL approved if was HITL)
2. Launch **one** Task subagent with harness prompt for `T003` only
3. Lead: update `tasks.md`, `log-task`, report result

## Prerequisites

- Task **Status:** `todo` (or `blocked` with user ack to retry)
- **Mode:** `AFK`, or `HITL` with `**HITL approved:**` line present
- Git branch `dev` exists

## Do not

- Run entire sprint (use `/run-sprint`)
