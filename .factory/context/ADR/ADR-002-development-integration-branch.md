# ADR-002 — Integration branch is `development`

**Date:** 2026-06-04
**Status:** accepted

---

## Context

Factory kit defaults to branch name `dev` (`guard-branches.sh`, `git.mdc`, `/to-backlog` branch examples). MercFlow established **`development`** as the integration branch before Factory adoption. Merging to wrong base branch caused incidents (e.g. PRs targeting `main`).

---

## Decision

- All feature PRs **target `development`**, not `dev` or `main`.
- Promotion path: **`development` → `staging` → `main`** (human / Tech Lead).
- Factory task branches remain `feature/[sprint]/[task-id]-[slug]` off `development`.
- MercFlow project hook `.cursor/hooks/guard-branches.sh` protects `main`, `staging`, `development`.

---

## Scope

| Kind | Path / pattern |
|------|----------------|
| Git workflow | All MercFlow repos |
| PRs | GitHub `base: development` |
| Agent docs | `.factory/context/TECHSPEC.md`, `CONTEXT.md` |

Excluded: upstream `eskobar95/factory` kit defaults (unchanged in submodule).

---

## Enforcement

| Mechanism | Tool / hook | What it checks |
|-----------|-------------|----------------|
| Shell guard | `.cursor/hooks/guard-branches.sh` | Warns on protected branches |
| Agent rules | `AGENTS.md`, `.cursor/rules/agent-workflow.mdc` | PR → development |

**Local command:** `git rev-parse --abbrev-ref HEAD` before commit
**CI command:** PR base branch check (human review)

---

## How to fix

1. Wrong PR base: `gh pr edit <n> --base development`
2. Agent cites Factory `dev`: substitute **`development`** for MercFlow.
3. New task branch: `git checkout development && git pull && git checkout -b feature/S00x/T00x-slug`

**Related ADRs:** ADR-001
**Related PRD journey:** none

---

## Consequences

**Good:**
- Matches existing team habit and `development` CI

**Bad / trade-offs:**
- Factory kit docs still say `dev` — agents must read this ADR
- Kit `guard-branches.sh` in `.factory/kit/` still lists `dev`; MercFlow uses `.cursor/hooks` override

---

## Alternatives considered

| Option | Why rejected |
|--------|--------------|
| Rename branch to `dev` | Breaks remotes, open PRs, team muscle memory |
| Patch factory submodule only | Loses on kit update; project hook is enough |
