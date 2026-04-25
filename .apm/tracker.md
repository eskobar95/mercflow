---
title: MercFlow Batch 2
---

## Task Tracking

**Stage 1:**

| Task | Status | Agent | Branch |
|------|--------|-------|--------|
| 1.1 | Ready | platform-agent | |
| 1.2 | Waiting: 1.1 | seo-module-agent | |
| 1.3 | Waiting: 1.1, 1.2 | feed-module-agent | |
| 1.4 | Waiting: 1.1 | inventory-module-agent | |
| 1.5 | Waiting: 1.1 | admin-ui-agent | |

**Stage 2:**

| Task | Status | Agent | Branch |
|------|--------|-------|--------|
| 2.1 | Waiting: 1.2, 1.1 | seo-module-agent | |
| 2.2 | Waiting: 2.1, 1.1 | seo-module-agent | |
| 2.3 | Waiting: 2.2, 1.1 | seo-module-agent | |
| 2.4 | Waiting: 2.2, 2.3, 1.5 | admin-ui-agent | |

**Stage 3:**

| Task | Status | Agent | Branch |
|------|--------|-------|--------|
| 3.1 | Waiting: 1.2, 2.3 | seo-module-agent | |
| 3.2 | Waiting: 1.3, 3.1, 1.1 | feed-module-agent | |
| 3.3 | Waiting: 3.1, 3.2, 1.5 | admin-ui-agent | |
| 3.4 | Waiting: 3.1, 3.2 | qa-docs-agent | |

**Stage 4:**

| Task | Status | Agent | Branch |
|------|--------|-------|--------|
| 4.1 | Waiting: 1.4, 1.1 | inventory-module-agent | |
| 4.2 | Waiting: 4.1 | inventory-module-agent | |
| 4.3 | Waiting: 4.2 | inventory-module-agent | |
| 4.4 | Waiting: 4.1, 4.2, 1.5 | admin-ui-agent | |
| 4.5 | Waiting: 4.2, 4.3, 4.4 | admin-ui-agent | |

**Stage 5:**

| Task | Status | Agent | Branch |
|------|--------|-------|--------|
| 5.1 | Waiting: 2.4, 3.3, 4.5 | qa-docs-agent | |
| 5.2 | Waiting: 5.1, 3.4 | qa-docs-agent | |
| 5.3 | Waiting: 5.2, 2.4, 3.3, 4.5 | qa-docs-agent | |

## Worker Tracking

| Agent | Instance | Notes |
|-------|----------|-------|
| platform-agent | 1 | |
| seo-module-agent | 1 | |
| feed-module-agent | 1 | |
| inventory-module-agent | 1 | |
| admin-ui-agent | 1 | |
| qa-docs-agent | 1 | |

## Version Control

| Repository | Base Branch | Branch Convention | Commit Convention |
|------------|-------------|-------------------|-------------------|
| mercflow (monorepo root) | `main` | Short kebab-case feature branches describing the work; no APM stage or task numbers in branch names. | [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): short description` (English). Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `migration` (migrations only). |

## Working Notes

- `.gitignore` tracks `.apm/plan.md`, `.apm/spec.md`, `.apm/tracker.md`, and `.apm/memory/index.md`; Task Logs, bus files, and worktrees under `.apm/` remain untracked.
