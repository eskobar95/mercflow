# Sprints — MercFlow

> One row per sprint. Status: `planned` | `active` | `done` | `blocked`
> Branch model: `feature/S00x/T00x-slug` → PR → `development`
> Updated: 2026-06-04 (S004 merged to `development` — PR #62 `e9f0c6f`)
> Updated: 2026-06-04 (`/run-sprint S004` — branch `feature/S004/metadata-json-ld-og-canonical`)
> Updated: 2026-06-04 (S003 merged to `development` — PR #60 `b2e1d90`; closeout `.factory/logs/sprints/S003-closeout-2026-06-04.md`)
> Updated: 2026-06-04 (S003 done on feature branch; merged with development planning hygiene)
> Updated: 2026-06-04 (merged `origin/development` + S006 branch)
> Updated: 2026-06-09 (S010–S012 added — M007 Medusa Fork Setup)

| ID | Milestone | Goal | Tasks | Status |
|----|-----------|------|-------|--------|
| S001 | M000 | Tenancy + RLS + rate limiting (sequential, no parallelism) | T001, T002, T003 | done |
| S002 | M001 | seo-module foundation + Nordic slug + 301 redirects | T004, T005, T006, T007 | done |
| S003 | M001 | Sitemap + robots.txt + tenant public route middleware | T008, T009, T010, T011, T012 | done |
| S004 | M002 | Global config + JSON-LD + OG + canonical | T013, T014, T015, T016 | done |
| S005 | M003 | feed-module + Google Shopping XML + admin UI | T017, T018, T019 | done |
| S006 | M004 | inventory-module + supplier register + PO create | T020, T021, T022 | done |
| S007 | M004 | PO receive flow + inventory dashboard | T023, T024 | done |
| S008 | M005 | Improved order list + order detail + pick list | T025, T026 | done |
| S009 | M006 | Hetzner infra + observability + provisioning + API hardening | T027, T028, T030, T031, T032 (T029 cancelled — Neon snapshots + Hetzner VPS backup) | done |
| S010 | M007 | Fork workspace + shared package (parallel A: T033, T034) | T033, T034 | active |
| S011 | M007 | Dashboard removal + core table store_id (parallel B/C: T035, T036) | T035, T036 | planned |
| S012 | M007 | Startup tenant wiring | T037 | planned |

---

---

## S010–S012 — M007 Medusa Fork Setup

- **S010:** T033 (fork workspace) og T034 (shared package) kører i parallelt — ingen indbyrdes afhængighed.
- **S011:** T035 (dashboard removal) og T036 (core store_id) kører i parallelt — begge blokkeret af T033.
- **S012:** T037 (tenant wiring) — blokkeret af T036 (core tables skal eksistere).

---

## Parallel execution notes (S001–S009)

- **S002 + S005 + S008** can start simultaneously after S001 (M000) is done — no interdependencies.
- **S006** can also start after S001 in parallel with S002/S005/S008.
- **S003** starts after S002 (needs seo-module foundation from T004) — **ready now** (S002 merged 2026-06-04).
- **S004** merged 2026-06-04 (PR #62 `e9f0c6f`) — JSON-LD, OG, canonical store APIs + admin settings.
- **S007** starts after S006 (needs PO table from T020, T022).
- **S009** starts after Batch 2 is stable on `development`. Parallel groups:
  - **Group A** (all independent, start simultaneously): T027 (Docker Compose + Prometheus/Grafana), T028 (Observability), T031 (Pagination + error shape), T032 (Store route versioning)
  - **Group B** (after T027 deployed): T030 (Provisioning — also blocked by T032 merged). ~~T029~~ cancelled — use Neon snapshots + Hetzner Server Backup per `infra/RUNBOOK.md`.
