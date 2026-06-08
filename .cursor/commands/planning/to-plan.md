# /to-plan

**Full planning pipeline** in one flow: align lightly → PRD → backlog. Use when scope is small or you want speed over separate sessions.

## Usage

```text
/to-plan
```

Include your macro idea in the message.

## Equivalent to

1. `skills/planning/align/SKILL.md` — abbreviated (only blocking ambiguities, update CONTEXT.md if needed)
2. `skills/planning/to-prd/SKILL.md`
3. `skills/planning/to-backlog/SKILL.md` — propose tasks, ask one approval, then write files

## When to prefer split commands

| Use split | Reason |
|-----------|--------|
| `/align` then `/to-prd` then `/to-backlog` | Large scope, many ADRs, risk of dumb zone (>120k context) |
| `/handoff` between steps | Preserve quality between sessions |

## Outputs

Same as running all three planning steps — see `/to-backlog` summary format.

## Deprecated alias

`/po-breakdown` → use `/to-plan` (kept as stub in `commands/po-breakdown.md`).
