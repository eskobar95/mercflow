# Sprints — MercFlow

> One row per sprint. Status: `planned` | `active` | `done` | `blocked`
> Branch model: `feature/S00x/T00x-slug` → PR → `development`
> Updated: 2026-06-04 (S004 merged to `development` — PR #62 `e9f0c6f`)
> Updated: 2026-06-04 (`/run-sprint S004` — branch `feature/S004/metadata-json-ld-og-canonical`)
> Updated: 2026-06-04 (S003 merged to `development` — PR #60 `b2e1d90`; closeout `.factory/logs/sprints/S003-closeout-2026-06-04.md`)
> Updated: 2026-06-04 (S003 done on feature branch; merged with development planning hygiene)
> Updated: 2026-06-04 (merged `origin/development` + S006 branch)
> Updated: 2026-06-09 (S010–S012 added — M007 Medusa Fork Setup)
> Updated: 2026-06-10 (S022 done — M011 merged PR #94, #95 to `development`)
> Updated: 2026-06-10 (S021 follow-up merged — PR #93 `b891b26` local Shipmondo E2E)
> Updated: 2026-06-10 (S019–S020 done — PRs #88–#90)
> Updated: 2026-06-10 (S021 done — PR #91 T053 Shipmondo label + packaging autofill)
> Updated: 2026-06-10 (S018 merged to `development` — PRs #86 `6d89f1b`, #87 `b0ade41`)
> Updated: 2026-06-11 (S027–S034 added — M013 Admin Shell, M014 Platform Console, M015 Subscription System; ADR-011 Clerk auth)
> Updated: 2026-06-11 (S027 done — T064 Clerk auth + AppShell; PR #96 merged `3fe6dc0`)
> Updated: 2026-06-11 (S024 merged to `development` — PR #104 `33a98d2`, PR #103 `eea674c`)
> Updated: 2026-06-11 (S029 T067 done — PR #107; local smoke + production checklist in platform-console README)

> Updated: 2026-06-11 (S025 done — T059 PR #108, T061 PR #109; `/run-sprint S025`)

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
| S010 | M007 | Fork workspace + shared package (parallel A: T033, T034) | T033, T034 | done |
| S011 | M007 | Dashboard removal + core table store_id (parallel B/C: T035, T036) | T035, T036 | done |
| S012 | M007 | Startup tenant wiring | T037 | done |
| S013 | M008 | metafield-module engine: definitions + values | T038, T039 | done |
| S014 | M008 | Standard library seeds + activation + store API + category constraints | T040, T043, T044 | done |
| S015 | M008 | Admin UI: Custom Data settings + product form metafields | T041, T042 | done |
| S016 | M008 | Polish: standard library browse dialog | T045 | done |
| S017 | M009 | Unsaved state indicator + SEO lazy preview polish | T046, T048 | done |
| S018 | M009 | Variant UX progressive CTA + physical product toggle + dimension fields | T047, T049 | done |
| S019 | M010 | packaging-module: model, migration, RLS, service, admin API | T050 | done |
| S020 | M010 | Settings → Packaging UI + Order fulfillment suggestion widget | T051, T052 | done |
| S021 | M010 | Shipmondo connector: packaging dimensions auto-fill (HITL) | T053 | done |
| S022 | M011 | Persist + restore confirmed packaging per fulfillment | T054, T055 | done |
| S023 | M012 | notification-module foundation: models, migrations, RLS, service, admin API | T056 | done |
| S024 | M012 | SES domain identity (HITL) + BullMQ worker infrastructure | T057, T058 | done |
| S025 | M012 | order-confirmation template + order.placed subscriber + domain admin UI | T059, T061 | done |
| S026 | M012 | Remaining templates + branding UI + delivery history UI | T060, T062, T063 | planned |
| S027 | M013 | Clerk auth integration (Store Admin) + AppShell + sidebar (HITL) | T064 | done |
| S028 | M013 | Settings landing page + route reorganisation + breadcrumbs | T065, T066 | planned |
| S029 | M014 | Platform Console scaffold + Clerk auth + /platform/ backend skeleton (HITL) | T067 | done |
| S030 | M014 | Tenant management + BullMQ queue monitor (parallel) | T068, T069 | planned |
| S031 | M014 | Email health + system metrics + audit log UI | T070 | planned |
| S032 | M015 | subscription-module foundation: models, migrations, RLS, service, admin API | T071 | planned |
| S033 | M015 | BullMQ renewal worker + subscription admin UI (parallel) | T072, T073 | planned |
| S034 | M015 | Customer Club Stripe setup (HITL) + per-product member price UI (parallel) | T074, T075 | planned |

---

---

## S013–S016 — M008 Metafields

- **S013:** T038 (definitions) og T039 (values) — done (PR #77, #76).
- **S014:** T040 group A; T043 + T044 group B parallel — done (PR #78, #81, #80).
- **S015:** T041 group A → T042 group B — done (PR #79 `34bc047`, PR #82 `80b4855`).
- **S016:** T045 — done (PR #83).

---

## S010–S012 — M007 Medusa Fork Setup

- **S010:** T033 (fork workspace) og T034 (shared package) kører i parallelt — ingen indbyrdes afhængighed.
- **S011:** T035 (dashboard removal) og T036 (core store_id) kører i parallelt — begge blokkeret af T033.
- **S012:** T037 (tenant wiring) — blokkeret af T036 (core tables skal eksistere).

---

## S017–S018 — M009 Product Form Polish

- **S017:** T046 (unsaved state) og T048 (SEO preview) — done (PR #84 `622ad70`, PR #85 `f71c460`).
- **S018:** T047 (variant UX) og T049 (physical toggle + dimensioner) — done (PR #86 `6d89f1b`, PR #87 `b0ade41`).

---

## S023–S026 — M012 Notification System

- **S023:** T056 (module foundation) — solo; prerequisite for alt i M012.
- **S024:** done — T057 (PR #104 `33a98d2`) + T058 (PR #103 `eea674c`) merged to `development` 2026-06-11. PR #103 required merge conflict resolution after #104.
- **S025:**
  - Group A: T059 (order-confirmation template + `order.placed` subscriber) — runnable (T058 merged).
  - Group B: T061 (Admin UI — Domain tab) — runnable (T057 merged).
  - T059 og T061 er indbyrdes uafhængige og kører parallelt i S025.
- **S026:**
  - Group A: T060 (øvrige templates + subscribers) — blokkeret af T059.
  - Group A: T062 (branding UI + preview) + T063 (delivery history UI) — begge kun blokkeret af T056 (done efter S023); kan starte tidligt i S026.
  - T060, T062, T063 kører parallelt.

---

## S019–S021 — M010 Fulfillment Intelligence

- **S019:** T050 (packaging-module) — solo prerequisite for alt i M010.
- **S020:**
  - Group A: T051 (Settings UI) og T052 (fulfillment widget) kører parallelt — begge blokkeret af T050, uafhængige af hinanden.
- **S021:** T053 (Shipmondo pre-fill) — done (PR #91, follow-up PR #93 `b891b26` merged).
- **M010 Fulfillment Intelligence:** complete (S019–S021).

---

## S022 — M011 Fulfillment Packaging Persistence

- **S022:** T054 (model + API) → T055 (order detail UI) — sequential; T055 blocked by T054.
- **PRD:** OQ-01 in `PRD-fulfillment-intelligence.md` — `shipment_packaging` join table in packaging-module.

---

## S027–S028 — M013 Admin Shell & Navigation

- **S027:** T064 (Clerk auth + AppShell + sidebar) — solo, **HITL**. Operatøren opretter Clerk `mercflow-store-admin` + `mercflow-platform` apps og leverer API keys. Medusa admin JWT-middleware erstattes i fork.
- **S028 group A:** T065 (settings landing + sub-nav + route reorganisation) og T066 (breadcrumbs + detail page wiring) — parallelt; begge blokkeret af T064, indbyrdes uafhængige.

---

## S029–S031 — M014 Platform Console

- **S029:** T067 (console scaffold + Clerk + /platform/ backend) — solo, **HITL**. Kræver `mercflow-platform` Clerk app (oprettet i S027 HITL) + Hetzner IP allowlist.
- **S030 group A:** T068 (tenant management + audit log) og T069 (BullMQ queue monitor) — parallelt; begge blokkeret af T067, indbyrdes uafhængige.
- **S031:** T070 (email health + system metrics + audit log UI) — solo; blokkeret af T067 (backend routes); kan starte tidligt i S031 da T068/T069 er parallelle i S030.

---

## S032–S034 — M015 Subscription System

- **S032:** T071 (subscription-module foundation) — solo; prerequisite for alt i M015.
- **S033 group A:** T072 (BullMQ renewal worker) og T073 (subscription admin UI) — parallelt; begge blokkeret af T071, indbyrdes uafhængige.
- **S034 group A:** T074 (Customer Club Stripe + settings UI — **HITL**) og T075 (per-produkt Club-pris) — parallelt; begge blokkeret af T071. T075 er AFK og kan starte straks T071 er done.

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
