---
name: handoff
description: Compact session into a temp handoff doc for a fresh agent — reference .ai artifacts, do not duplicate (Matt Pocock handoff pattern)
---

# Handoff skill

Summarize the **current conversation** so another agent (or session) can continue without re-reading the full thread.

## When to use

- Context window filling (~60k+ tokens) mid-align or mid-plan
- Switching from planning session to implementation session
- Fire-and-forget tangent (bugfix) while main session continues
- DIY sub-agent: plan in new session → hand back learnings

## Invocation

User: `/handoff` or `/handoff [what next session focuses on]`

If argument provided, scope the doc to that focus instead of entire thread.

## Save location

```bash
mktemp -t handoff-XXXXXX.md
```

- Save under **OS temp**, not project workspace
- Read the path from `mktemp` before writing (file exists but empty)

## Do not duplicate

Reference by path only — do not paste full content:

- `.factory/context/PRD.md`, `TECHSPEC.md`, `CONTEXT.md`
- `.factory/planning/tasks.md`, `milestones.md`
- `.factory/context/ADR/*`
- Branches, PR URLs, commit SHAs

Handoff is the **glue** between artifacts.

## Required sections

```markdown
# Handoff — [date]

## Goal of next session
[From user argument or inferred]

## State of play
- Done: …
- In progress: …
- Blocked: …

## Open decisions
- [ ] …

## Artifacts (paths only)
- PRD: .factory/context/PRD.md
- …

## Suggested skills / commands
- `/to-backlog` — …
- `/run-sprint S001` — …
- skills/harness/implement — …
```

## Security

Redact API keys, tokens, cookies, credentials from handoff body.

## Do not

- Copy entire PRD or tasks.md into handoff
- Save handoff inside repo unless user explicitly asks
