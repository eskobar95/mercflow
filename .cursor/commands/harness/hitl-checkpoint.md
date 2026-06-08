# /hitl-checkpoint [task-id]

Approve or reject a **HITL** task before harness implements it.

## Usage

```text
/hitl-checkpoint T005
```

State your approval or requested changes in the same message.

## Loads

`skills/harness/hitl-checkpoint/SKILL.md`

## After approval

```text
/run-task T005
```

## Do not

- Use for AFK tasks (they run without checkpoint)
