---
name: hitl-checkpoint
description: Human checkpoint for HITL tasks — record approval and unblock for harness dispatch
---

# HITL checkpoint skill

Run when user invokes `/hitl-checkpoint T00x` after reviewing design, mockup, or arch decision.

## Prerequisites

- Task exists in `.factory/planning/tasks.md` with **Mode:** HITL
- User has stated approval (or changes to apply before run)

## Procedure

1. Read task section — confirm **HITL reason** in context
2. Show user: slice objective, acceptance criteria, HITL reason
3. On approval:
   - Add under task metadata: `**HITL approved:** YYYY-MM-DD — [one-line note]`
   - Set **Status:** `todo` (ready for harness)
   - Optionally change **Mode:** to `AFK` if no further human gate needed mid-task
4. Append brief entry to `.factory/logs/diary.md`:

```markdown
---

## HITL approved — T[id] — [date]
**Approver:** human
**Note:** [what was approved]
**Next:** /run-task T[id] or /run-sprint S[id]
```

5. If user rejects or requests changes:
   - Keep **Mode:** HITL, **Status:** `blocked`
   - Add `**Blocker:** HITL — [what must change]`
   - Do not dispatch until re-approved

## Output

```markdown
## HITL checkpoint — T[id]
**Result:** approved | rejected
**Ready for harness:** yes | no
**Next:** /run-task T[id]
```

## Do not

- Implement code in this skill (planning/gate only)
- Approve without explicit user confirmation in conversation
