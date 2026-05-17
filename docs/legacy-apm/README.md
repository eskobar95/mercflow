# Legacy APM + Paperclip archive

This directory preserves documentation and planning artifacts from the original
APM (Agent Project Manager) and Paperclip orchestration system used in MercFlow
before May 2026.

**These files are read-only historical reference. Do not use them for active
project management.**

## What replaced this system

| Legacy | Replacement |
|---|---|
| `.apm/plan.md` + `tracker.md` | Notion — MercFlow / Issue Tracker / Tasks |
| `.apm/spec.md` | Notion — PRDs database |
| Paperclip sync / batch reports | Notion — Feature Requests + Product Roadmap |
| APM commands (`.cursor/commands/apm-*.md`) | Cursor commands: `/po-grill`, `/start-task`, `/review-code`, `/open-pr`, `/tech-lead-plan` |
| Paperclip agent orchestration | `mercflow-os` repo — Cloudflare Worker + Cursor SDK agents |

## Contents

- `apm/` — original `.apm/` directory (plan, spec, tracker, memory)
- `paperclip/` — original `.paperclip/` directory (agents, commands, rules, sync reports)

## Key decisions preserved here

- Batch 2 work scope (SEO, feeds, inventory, admin UI) is in `apm/plan.md`
- Paperclip sync workflow and runbook are in `paperclip/RUNBOOK-APM-PAPERCLIP.md`
- Original task tracker state (MER-1 through MER-33) is in `apm/tracker.md`
