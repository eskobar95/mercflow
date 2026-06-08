---
name: adr-lookup
description: Find and apply ADRs when hooks, CI, or lint reference a rule — read why, scope, enforcement, and how to fix
---

# ADR lookup skill

Load when an error message, hook rejection, or review mentions an **ADR** (e.g. `ADR-012`, architecture lint). ADRs record **why** a rule exists and **how** to fix violations — not just what failed.

Inspired by enforcement loops where agents iterate: fail → read ADR → fix → re-run checks.

## When to use

- Hook or lint output references `ADR-NNN` or architecture rule name
- Implement/review agent unsure **why** a pattern is forbidden
- New code touches modules covered by existing ADRs
- `/align` or `/to-prd` needs to align with prior decisions

## When not to use

- No ADR exists for the failure → fix the immediate error; propose new ADR only if decision meets ADR bar (hard to reverse, surprising, real trade-off)

## Inputs

- ADR id or keyword from error message
- `.factory/context/ADR/` — all accepted ADRs
- `.factory/context/TECHSPEC.md` — ADR log table
- Changed files from `git diff` or task scope

## Procedure

1. **Resolve ADR**
   - Parse id from error (`ADR-012`) or search ADR titles in `.factory/context/ADR/`
   - Read full file: Context, Decision, **Scope**, **Enforcement**, **How to fix**

2. **Check scope**
   - Compare changed files against ADR Scope table
   - If out of scope, note mismatch — may be false positive or ADR needs update

3. **Run enforcement locally**
   - Use command from ADR **Enforcement** section (must match CI)
   - Capture output for fix iteration

4. **Apply fix**
   - Follow **How to fix** steps in ADR order
   - Do not bypass rule without updating ADR (requires human approval)

5. **Cross-reference**
   - Related PRD journey (if any)
   - Related BDD spec in `.factory/specs/`

## Output format

```markdown
## ADR lookup — ADR-NNN

**Title:** [from ADR]
**Applies to this change:** yes | no | partial
**Why (one line):** [from Decision]
**Enforcement:** `[command]`
**Fix applied:** [summary of changes]
**Re-run result:** pass | fail — [details]
**Follow-up:** none | propose ADR update | new ADR needed
```

## Pairs with

- `skills/harness/implement/SKILL.md` — after hook rejection
- `skills/harness/verify/SKILL.md` — before marking verify pass on architecture-sensitive tasks
- `skills/planning/align/SKILL.md` — when creating ADRs with Enforcement sections

## Do not

- Ignore ADR because fix is inconvenient — escalate to human for ADR change
- Duplicate ADR content in chat — cite path and section headers
