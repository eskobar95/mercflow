# /to-backlog

Break PRD into milestones, sprints, and **vertical-slice** tasks (`tasks.md`).

## Usage

```text
/to-backlog
```

## Prerequisites

- `.factory/context/PRD.md` and `TECHSPEC.md` exist
- Prefer `/align` + `/to-prd` first for new work

## Loads

`skills/planning/to-backlog/SKILL.md`

## Outputs

- `.factory/planning/milestones.md`
- `.factory/planning/sprints.md`
- `.factory/planning/tasks.md` (with **Mode:** AFK | HITL per task)

## Approval

Agent proposes task table first; you approve granularity → then files are written.

## Next

```text
/run-sprint S001
```
