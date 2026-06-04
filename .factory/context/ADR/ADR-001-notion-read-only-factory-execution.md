# ADR-001 — Notion read-only; Factory owns execution

**Date:** 2026-06-04
**Status:** accepted

---

## Context

MercFlow historically used Notion (Issue Tracker) for tasks, sprints, and PRDs. Factory introduces `.factory/context` and `.factory/planning` for agent harness execution (`/to-prd`, `/to-backlog`, `/run-sprint`). The team needs one clear rule: Notion explains what was planned; Factory finishes the work without bidirectional sync overhead.

---

## Decision

1. **Notion is read-only intake** at plan start — skim PRDs, Tasks (MER-xx), Sprints for scope and priority only.
2. **Factory workspace is SSOT during execution** — `PRD.md`, `TECHSPEC.md`, `planning/*.md`, `tasks.md` drive branches, harness, and acceptance.
3. **No agent obligation** to update Notion Stage/Status/PR URL during Factory runs unless a human explicitly asks.
4. **Optional traceability:** `Notion: MER-xx` or PRD URL in a task context block in `tasks.md` for human lookup only.

---

## Scope

| Kind | Path / pattern |
|------|----------------|
| Planning skills | `.factory/kit/skills/planning/*` |
| Harness | `/run-sprint`, worktrees, feature branches |
| Context | `.factory/context/*`, `.factory/planning/*` |

Excluded: human-only Notion edits; `mercflow-os` orchestration if it writes Notion separately.

---

## Enforcement

| Mechanism | Tool / hook | What it checks |
|-----------|-------------|----------------|
| Documentation | `CONTEXT.md` § Planning intake | Agent reads before planning |
| Harness | `tasks.md` task IDs (T001…) | Canonical branch naming |

**Local command:** N/A (process ADR)
**CI command:** N/A

---

## How to fix

1. If an agent blocks on missing Notion Stage — read `.factory/planning/tasks.md` instead.
2. If scope is unclear — one Notion skim, then write/update `.factory/context/PRD.md` via `/to-prd`.
3. Do not create duplicate tasks in Notion for every Factory T00x unless PM requests it.

**Related ADRs:** ADR-002
**Related PRD journey:** Batch 2 planning (all)

---

## Consequences

**Good:**
- Agents run without Notion MCP on every step
- Single executable backlog in repo

**Bad / trade-offs:**
- Notion board may drift from Factory `tasks.md` unless humans reconcile occasionally
- `AGENTS.md` still mentions Notion as roadmap SSOT — Factory execution overrides per this ADR

---

## Alternatives considered

| Option | Why rejected |
|--------|--------------|
| Notion SSOT with live sync | Too heavy; blocks agents on Stage updates |
| Factory-only, never open Notion | Loses human planning already in Notion |
