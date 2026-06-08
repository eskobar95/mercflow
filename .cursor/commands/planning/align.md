# /align

Align on a macro idea **before** writing PRD or tasks. Codebase-aware grilling (Factory equivalent of `grill-with-docs`).

## Usage

```text
/align
```

Provide your macro idea in the same message or reference a brief file.

## Loads

`skills/planning/align/SKILL.md`

## Outputs

- Updates `.factory/context/CONTEXT.md` (glossary)
- May add `.factory/context/ADR/*.md`
- Does **not** write tasks or full PRD

## Next

| Situation | Command |
|-----------|---------|
| New product / feature | `/to-prd` |
| PRD already exists | `/to-backlog` |
| Long session | `/handoff [focus]` |

## Tips (from Matt Pocock)

- **Steer** the conversation — not passive Q&A
- Stop grilling low-fidelity details; prototype or slice instead
- Record decisions in files, not only chat
