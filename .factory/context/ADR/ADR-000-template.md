# ADR-NNN — [Short decision title]

> Architectural Decision Record. Create only when all three are true:
> 1. Hard to reverse
> 2. Surprising without context
> 3. Result of a real trade-off

**Date:** YYYY-MM-DD
**Status:** accepted | superseded | deprecated
**Supersedes:** ADR-NNN | —
**Superseded by:** ADR-NNN | —

---

## Context

[What situation forced this decision? What constraints existed?]

---

## Decision

[What did we choose, and why?]

---

## Scope

Which parts of the codebase this decision applies to:

| Kind | Path / pattern |
|------|----------------|
| Files | `src/**/*.ts`, `app/**/*.tsx` |
| Modules | `src/services/*`, `src/db/*` |
| Excluded | `**/*.test.ts`, `e2e/*` |

---

## Enforcement

How this decision is **automatically** checked (not optional):

| Mechanism | Tool / hook | What it checks |
|-----------|-------------|----------------|
| Import boundaries | `eslint` / custom rule | Service layer cannot import from UI |
| CI | same script as local hook | Parity with git hooks |
| Hook | `.cursor/hooks/run-*.sh` | Runs on commit / edit |

**Local command:** `[e.g. pnpm lint:architecture]`
**CI command:** `[same as local — must match]`

> What you cannot enforce, you cannot rely on. If no tool exists yet, note `manual` and open a follow-up task.

---

## How to fix

When an agent or developer hits a violation:

1. Read this ADR — understand **why**, not just the error message
2. [Step-by-step fix pattern]
3. [Example: refactor import path / return plain DTO instead of ORM entity]
4. Re-run: `[enforcement command]`

**Related ADRs:** ADR-NNN | none
**Related PRD journey:** [J001 — User can …] | none

---

## Consequences

**Good:**
- [Benefit]

**Bad / trade-offs:**
- [Cost or limitation]

---

## Alternatives considered

| Option | Why rejected |
|--------|-------------|
| [Alt A] | [Reason] |

---

<!-- Filename: ADR-NNN-short-title.md — stored in .factory/context/ADR/ -->
