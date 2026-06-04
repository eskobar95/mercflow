# Sprints — MercFlow Batch 2

> One row per sprint. Status: `planned` | `active` | `done` | `blocked`
> Branch model: `feature/S00x/T00x-slug` → PR → `development`
> Updated: 2026-06-04

| ID | Milestone | Goal | Tasks | Status |
|----|-----------|------|-------|--------|
| S001 | M000 | Tenancy + RLS + rate limiting (sequential, no parallelism) | T001, T002, T003 | planned |
| S002 | M001 | seo-module foundation + Nordic slug + 301 redirects | T004, T005, T006, T007 | planned |
| S003 | M001 | Sitemap + robots.txt + tenant public route middleware | T008, T009, T010, T011, T012 | planned |
| S004 | M002 | Global config + JSON-LD + OG + canonical | T013, T014, T015, T016 | planned |
| S005 | M003 | feed-module + Google Shopping XML + admin UI | T017, T018, T019 | planned |
| S006 | M004 | inventory-module + supplier register + PO create | T020, T021, T022 | planned |
| S007 | M004 | PO receive flow + inventory dashboard | T023, T024 | planned |
| S008 | M005 | Improved order list + order detail + pick list | T025, T026 | planned |

---

## Parallel execution notes

- **S002 + S005 + S008** can start simultaneously after S001 (M000) is done — no interdependencies.
- **S006** can also start after S001 in parallel with S002/S005/S008.
- **S003** starts after S002 (needs seo-module foundation from T004).
- **S004** starts after S003 (needs T008 tenant middleware + T004 foundation).
- **S007** starts after S006 (needs PO table from T020, T022).
