---
name: align
description: Grill-style alignment against .factory context and codebase — sharpen language, update CONTEXT.md and ADRs (Matt Pocock grill-with-docs pattern)
---

# Align skill

Pressure-test a **macro idea or plan** before writing PRD or tasks. This is Factory's codebase-aware equivalent of `/grill-with-docs`.

## When to use

- New feature or product direction; ambiguity in scope or terminology
- Before `/to-prd` or `/to-backlog`
- When `.factory/context/CONTEXT.md` or ADRs may be stale

## When not to use

- Tasks already written and approved → use `/run-sprint`
- Pure code fix with clear spec → skip to harness
- No repo yet → still use align, but glossary starts empty

## Inputs

- User's macro idea, brief, or partial plan
- `.factory/context/CONTEXT.md` (create from template if missing)
- `.factory/context/PRD.md`, `TECHSPEC.md`, `STACK.md` if they exist
- `.factory/context/ADR/` — read existing ADRs
- Codebase: `package.json`, key modules, README

## Behavior (grill-with-docs rules)

1. **One question at a time** — narrow, grounded in docs or code
2. **Steer actively** — user leads scope; agent does not explode into 50 low-fidelity questions
3. **Low-fidelity → grill**; **high-fidelity → stop** and suggest prototype or `/to-backlog` slice
4. **Challenge language** against `CONTEXT.md` — sharpen fuzzy terms
5. **Cross-reference code** when terms should match implementation
6. **Update docs inline** as decisions land:
   - `.factory/context/CONTEXT.md` — shared glossary per bounded context
   - `.factory/context/ADR/` — only when decision is hard to reverse, surprising without context, and a real trade-off

## CONTEXT.md updates

Add or refine entries:

```markdown
## [Term]
**Meaning:** …
**Not:** … (disambiguation)
**Example scenario:** …
```

## ADR creation

Filename: `.factory/context/ADR/ADR-NNN-short-title.md`

Use template sections: Context, Decision, **Scope**, **Enforcement**, **How to fix**, Consequences.

When the decision affects code structure, always fill **Enforcement** (tool + command) and **How to fix** so hooks and agents can link back to this ADR.

## Session end

Do **not** write full PRD or tasks in this skill. Output:

```markdown
## Align complete

**Updated:** CONTEXT.md, [ADR-00x | none]
**Open decisions:** [list or none — resolve before to-prd if blocking]
**Suggested next skills/commands:**
- `/to-prd` — when problem/goals/stack are clear
- `/to-backlog` — if PRD already exists
- `/handoff [focus]` — if context window is large; reference `.factory/` paths only
```

## Do not

- Implement production code
- Duplicate full PRD content in chat — write to files
- Plan horizontal layers ("build all schema first") — note vertical slices for backlog step

## Pairs with

- `skills/planning/to-prd/SKILL.md`
- `skills/planning/adr-lookup/SKILL.md`
- `skills/productivity/handoff/SKILL.md`
