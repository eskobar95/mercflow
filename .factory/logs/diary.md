# Factory diary

> One entry per session. Most recent first.

---

## Sprint retro — S026 — 2026-06-11

**Milestone:** M012
**Duration:** session
**Tasks:** 2/3 done, 1 blocked (T060)

### What went well
- T062 og T063 kørt parallelt med grøn CI på begge PRs (#105, #106)
- Email settings shell etableret; branding preview API tilføjet i notification-module (T062)
- Delivery history tab med pagination, resend og expandable errors (T063)

### What failed or slowed down
- T060 ikke dispatchbar — blokeret af T059 (S025, afhænger af T058 worker infrastructure)
- Harness preflight refererer stadig til `dev`; repo bruger `development`
- Parallel T062/T063 risikerer merge-konflikt på EmailSettingsPage — koordiner merge-rækkefølge

### Task log index
| Task | Final status | PR |
|------|--------------|-----|
| T060 | blocked (T059) | — |
| T062 | done | #106 |
| T063 | done | #105 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T062 | 1 | eslint/react-doctor fixes |
| T063 | 1 | initial implementation |

### Harness notes
- Parallel groups used: A (2 subagents: T062 + T063)
- Subagent issues: none — both returned valid YAML with CI pass

### Factory improvement suggestions
| Area | Suggestion | Target file |
|------|------------|-------------|
| skill | Document `development` as base branch in harness preflight | skills/harness/harness/SKILL.md |
| planning | Mark T060 explicitly skipped in S026 run when T059 pending | .factory/planning/sprints.md |

### Next actions
- [ ] Merge PR #105 then #106 (eller rebase T062 på T063) til `development`
- [ ] `/run-sprint S025` eller `/run-task T059` for at unblock T060
- [ ] `/run-task T060` efter T059 merged

---

## Task T063 — Email delivery history UI — 2026-06-11

**Sprint:** S026 | **Milestone:** M012 | **Status:** done
**Branch:** `feature/S026/T063-email-delivery-history-ui`
**PR:** https://github.com/eskobar95/mercflow/pull/105
**Mode:** AFK
**Parallel group:** A

### Outcome
EmailSettingsPage shell with Delivery history tab — paginated table, status badges, expandable errors, resend, and /settings/email route wired.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 1 |

### Unblocked
T064 (already done)

---

## Task T062 — Email branding UI + preview modal — 2026-06-11

**Sprint:** S026 | **Milestone:** M012 | **Status:** done
**Branch:** `feature/S026/T062-email-branding-ui`
**PR:** https://github.com/eskobar95/mercflow/pull/106
**Mode:** AFK
**Parallel group:** A

### Outcome
Email settings branding tab with HTTPS validation, debounced preview, modal HTML preview, and notification-module preview API.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 1 |

### Unblocked
none

---

## 2026-06-04 — Sprint S004 merged to development

**PR:** https://github.com/eskobar95/mercflow/pull/62  
**Merge:** `e9f0c6f` — global config + JSON-LD + OG + canonical (T013–T016)

### Planning sync
- `.factory/planning/sprints.md` — S004 `done`
- `.factory/planning/tasks.md` — T013–T016 `done` + merge SHA
- `.factory/planning/milestones.md` — M002 progress (S004 on `development`)

**HITL:** `.factory/logs/hitl/S004-T013-global-config-table.md` (Option A — `mercflow_seo_config`)

### Merge + cleanup
- Squash-merged after green CI; Bugbot 1/1 resolved (`useSeoStructuredDataSettings` save payload).
- Remote branch `feature/S004/metadata-json-ld-og-canonical` deleted.
- Sync: `git fetch origin --prune && git pull origin development` on `development` @ `e9f0c6f`.
- Worktree removed: `../mercflow-worktrees/S004`.

### Delivered (summary)
- **T013:** Settings → SEO → Organisation; `json_ld_settings` migration
- **T014:** `/store/seo/json-ld/*` + Structured data toggles; publishable-key tenant binding
- **T015:** `/store/seo/og/*` + product `SocialSharePreview`
- **T016:** `canonical_url_override` migration + store canonical routes + product Content tab field

**Gate:** Yellow — category Content tab canonical UI + canonical conflict admin warning deferred.

**Local migration smoke:** `pnpm migration:run` on `development` @ `0570caf` — applied `Migration20260605120000AddJsonLdSettingsToSeoConfig` (seo) and `Migration20260605130000AddCanonicalUrlOverride` (content); exit 0.

---

## 2026-06-04 — `/run-sprint S004` (T013–T016 implementation)

**Branch:** `feature/S004/metadata-json-ld-og-canonical` @ worktree `../mercflow-worktrees/S004` (removed after merge)

### HITL — global config table (T013)

- Decision log: `.factory/logs/hitl/S004-T013-global-config-table.md`
- **Option A** — `mercflow_seo_config` (no `mercflow_global_config`); added `json_ld_settings` jsonb

### Delivered

- **T013:** Admin Settings → SEO → Organisation (storefront, org name/logo, social URLs); extended `PUT /admin/seo-config`
- **T014:** JSON-LD services + store routes (`/store/seo/json-ld/*`); admin Structured data toggles
- **T015:** OG/Twitter meta store routes; `SocialSharePreview` on product Content tab
- **T016:** `canonical_url_override` on product/category content + store canonical routes + admin field on product Content tab
- Migrations: `Migration20260605120000AddJsonLdSettingsToSeoConfig`, `Migration20260605130000AddCanonicalUrlOverride`
- Tests: seo-module 44 tests (incl. tenant binding + store route contract)

### Verification

- CI green on PR #62 (lint/test/typecheck/build, Playwright, backend migrations, React Doctor)
- Code review APPROVED; Bugbot fix in `64c227f`

### Gate (pre-merge)

**Yellow** — category Content tab canonical field deferred (product tab done).

---

## 2026-06-04 — Sprint S007 merged to development

**PR:** https://github.com/eskobar95/mercflow/pull/61  
**Merge:** `0780d33` — PO receive flow + inventory dashboard (T023, T024)

### Planning sync
- `.factory/planning/sprints.md` — S007 `done`
- `.factory/planning/tasks.md` — T023, T024 `done` + merge SHA

**HITL:** `.factory/logs/hitl/S007-po-stock-boundary.md` (MercFlow receipt only; no auto Medusa stock)

**Gate:** Yellow (movement history PO receipts only; see inventory-module README)

---

## 2026-06-04 — `/run-sprint S007` (T023 + T024 implementation)

**Branch:** `feature/S007/T023-po-receive-flow` @ worktree `../mercflow-worktrees/S007-T023`

### HITL — PO receipt vs Medusa stock (T023)

- Decision log: `.factory/logs/hitl/S007-po-stock-boundary.md`
- **MercFlow receipt only** — no automatic Medusa stock mutation; UI/API expose `stock_applied: false`

### Delivered

- **T023:** `POST /admin/purchase-orders/:id/receive`, `GET /admin/purchase-orders/:id`, receive admin page, list row action
- **T024:** `GET /admin/inventory-overview`, movements + `GET/PATCH /admin/inventory-config`, inventory overview table + movement sheet
- Tests: 15 passing in `@mercflow/inventory-module`; typecheck + lint green
- Bugbot: server-side overview sort fix (`75a0782`)

### Gate

**Yellow** — movement history lists PO receipts only; Medusa sale/manual_adjustment events deferred (documented in README).

### PR

https://github.com/eskobar95/mercflow/pull/61 → `development` (rebased on S003 merge `c932800`)

---

## 2026-06-04 — Sprint S003 merged to development

**PR:** https://github.com/eskobar95/mercflow/pull/60 (squash `b2e1d90`, factory diary `c932800`)

**Full closeout:** `.factory/logs/sprints/S003-closeout-2026-06-04.md`  
**HITL T008:** `.factory/logs/hitl/S003-T008-host-mapping.md` (option A — `storefront_url` hostname)

### Merge + cleanup
- Squash-merged to `development` after green CI; Bugbot 9/9 resolved with fix replies.
- Remote branch `cursor/s003-sitemap-robots-tenant-6449` deleted (`gh pr merge --delete-branch`).
- Sync: `git fetch origin --prune && git pull origin development` on `development`.
- Worktree: none on cloud VM; remove `../mercflow-worktrees/{task-id}` locally if used.

### Planning sync
- `.factory/planning/sprints.md` — S003 `done`, merge note
- `.factory/planning/milestones.md` — M001 progress updated (S002 + S003 on `development`)
- `.factory/planning/tasks.md` — T008–T012 execution log + acceptance checked

**Gate:** Green.

---

## 2026-06-04 — Sprint S003 complete (sitemap + robots + tenant middleware)

**Branch:** `cursor/s003-sitemap-robots-tenant-6449` (merged — see above)

### Delivered
- **T008:** Shared `mercflowPublicTenantMiddleware` — Host → `mercflow_seo_config.storefront_url` (option A), 60s cache; wired on `/sitemap.xml`, `/robots.txt`, `/feed/*`; feed shim delegates to seo-module.
- **T009:** `mercflow_sitemap_config`, `SitemapGeneratorService`, `GET /sitemap.xml`, 30s XML cache + catalogue invalidation subscriber.
- **T010:** Admin sitemap config, preview, regenerate + Settings → SEO — Sitemap UI.
- **T011:** `mercflow_robots_config`, `renderRobotsTxt`, `GET /robots.txt` with auto sitemap line.
- **T012:** Admin robots config + Settings → SEO — Robots.txt UI with structured/freetext + history.

### Verification
- `pnpm --filter @mercflow/seo-module typecheck && test` — green
- `pnpm --filter @mercflow/feed-module typecheck && test` — green
- `pnpm --filter @mercflow/admin-ui typecheck` — green

**Gate:** Green (scoped package checks).

**Next:** `/run-sprint S004` (global config + JSON-LD + OG + canonical).

---

## 2026-06-04 — M000 milestone review + planning hygiene (S003 active)

**Branch:** `development`

### Step 2 — `/milestone-review M000`
- Review log: `.factory/logs/milestone-reviews/M000-2026-06-04.md`
- Gate: **Yellow** — code/tests pass; Neon IP allowlist HITL open
- Verification: `pnpm --filter @mercflow/backend test` (7), `pnpm --filter @mercflow/content-module test` (52)
- HITL checklist: `.factory/logs/hitl/M000-neon-allowlist.md`

### Step 3 — Planning hygiene
- `milestones.md`: M000 → `reviewed (yellow)`; DoD checkboxes synced
- `tasks.md`: acceptance/DoD `[x]` on T001–T007, T017–T019, T025–T026; T008 → `in-progress`
- `sprints.md`: S003 → `active`

### Operator
- S003 started by Nicklas (T008 host→store mapping)

### Next
- Human: complete Neon allowlist HITL → M000 Green
- Harness: finish S003 (T008–T012) — completed in PR #60

---

## 2026-06-04 — Development sync + factory close-out

**Branch:** `development` @ `a0200f7` (matches `origin/development`)

### GitHub ↔ local
- `git fetch` + `git checkout development` + `git pull` — up to date with remote
- Recent merges on `development`: #55 SEO (`b378e22`), #58 feed admin, #57 XML, #56 orders, #54 feed scaffold, #53 rate limit, #52 RLS, #50 tenancy backfill

### PR #55 (S002) — post-merge notes
- Merged 2026-06-04 as `b378e22` (from `cursor/s002-seo-infrastructure-0c2f`)
- Bugbot fixes before merge: `upsertRedirect`, `product_category.created` seed, slug strategy on create
- Rebase conflicts with feed/inventory modules resolved (additive registration)
- CI green on final push

### Factory updates (this session)
- `tasks.md`: T001/T002 → `done` with PR #50/#52; T004–T007 merge SHA `b378e22`
- `milestones.md`: M000/M001/M003/M005 → `in progress` with progress notes
- `sprints.md`: S003 marked ready

### Next harness action
- `/run-sprint S003` — T008 (HITL host→store), sitemap, robots

---

## Sprint retro — S002 — 2026-06-04

**Milestone:** M001
**Tasks:** 4/4 done (T004–T007), 0 blocked

### What went well
- SEO module, Nordic slug settings, redirect middleware/subscribers, and admin UI merged in one vertical PR after rebase onto `development` (#55)
- Rebase integrated feed + inventory modules without losing registrations; CI green after lockfile sync

### What failed or slowed down
- Initial branch had merge commit + conflicts with S008/feed; linear rebase in isolated worktree resolved it
- `pnpm-lock.yaml` out of sync with `admin-ui` → `seo-module` dep blocked CI until follow-up commit

### Follow-ups
- **Next:** `/run-sprint S003` (sitemap + robots + tenant middleware T008) — unblocks feed tenant shim note from S005

---

## Task T004–T007 — SEO foundation — 2026-06-04

**Sprint:** S002 | **Status:** done | **PR:** https://github.com/eskobar95/mercflow/pull/55 | **Merge:** `b378e22`

---

## Sprint retro — S005 — 2026-06-04

**Milestone:** M003
**Tasks:** 3/3 done, 0 blocked

### What went well
- Feed vertical slice merged: scaffold → XML feed → admin UI (#54, #57, #58)
- CI green on all PRs after T017 migration export fix

### What failed or slowed down
- T019 WIP briefly on wrong branch; recovered with PR #58
- Full tenant middleware (T008) still pending — feed uses minimal `/feed/*` Host→store_id shim

### Follow-ups
- Replace feed-only tenant shim when S003 T008 lands
- **Next:** S003 (tenant middleware) — S002 merged 2026-06-04

---

## Task T019 — Feed admin UI — 2026-06-04

**Sprint:** S005 | **Status:** done | **PR:** https://github.com/eskobar95/mercflow/pull/58

---

## Task T018 — Google Shopping XML feed — 2026-06-04

**Sprint:** S005 | **Status:** done | **PR:** https://github.com/eskobar95/mercflow/pull/57

---

## Task T017 — feed-module scaffold — 2026-06-04

**Sprint:** S005 | **Status:** done | **PR:** https://github.com/eskobar95/mercflow/pull/54

---

## 2026-06-04 — /align: Batch 2 + Notion intake + Factory SSOT

**Deltagere:** Nicklas Eskou + agent

**Beslutninger:**
- Notion = read-only planning intake; Factory owns execution (ADR-001)
- Integration branch = `development`, not Factory `dev` (ADR-002)
- Batch 2 = three modules: seo, feed, inventory (ADR-003)
- Product PRD draft remains `.cursor/docs/PRD-batch2.md` until `/to-prd` copies to `.factory/context/PRD.md`

**Opdateret:**
- `.factory/context/CONTEXT.md` — Batch 1/2, modules, locales, public routes
- `.factory/context/STACK.md`, `TECHSPEC.md` — created (MercFlow-specific)
- `.factory/context/ADR/` — ADR-001, ADR-002, ADR-003

**Projekttilstand:**
- Batch 1 leveret på `development`; ingen åbne PRs
- `.factory/planning/` mangler stadig — næste: `/to-prd` then `/to-backlog`

**Åbne beslutninger:**
- PO receipt: confirm stock mutation UX in first PO slice (PRD allows it; AGENTS requires explicit task boundary)
- Tech-debt MER-54–57: triage into Factory backlog or defer

**Næste:** `/to-prd` (Batch 2) → `/to-backlog` → `/run-sprint S001`

---

## 2026-06-04 — /align session: projekt-status

**Deltagere:** Nicklas Eskou + agent

**Analyseret:**
- GitHub: `eskobar95/mercflow` — åbne PRs via public API
- Notion Issue Tracker: Tasks, Sprints, Issues databases
- Codebase: alle 4 packages + apps/backend

**Projektets tilstand:**

Sprint 1 (Foundation, 17 maj – 7 juni) er funktionelt færdig. Tasks fra Sprint 2 og 3 er allerede merged til `development`. Faktisk velocity er markant højere end sprint-planen.

**Packages i monorepo:**
- `apps/backend` — Medusa v2-app, thin API re-exports
- `packages/content-module` — CMS/content (artikler, sider, produkt-/kategori-indhold, globals, media)
- `packages/connector-module` — krypterede credentials (Stripe, Shipmondo, Plunk, GTM)
- `packages/admin-ui` — Vite + React 18 admin UI
- `packages/design-tokens` — CSS vars + Tailwind preset
- `packages/subscription-module` — nyt modul (MER-43), subscription tabel

**Åbne PRs:**
- PR #23: MER-43 Subscription overview → `development` (Draft)
- PR #32: MER-36 Shipmondo shipping rules → `development` (Draft)
- PR #38: MER-32 CMS pages CRUD → `development` (Draft)
- PR #39: MER-34 CMS articles CRUD → ~~`main`~~ → `development` (fejl identificeret, fix: `gh pr edit 39 --base development`)
- PR #46: Dependabot vitest 3.2.4 → 4.1.0 → `main`

**Beslutninger og fund:**

1. **PR #39 har forkert base-branch** — target `main` i stedet for `development`. Brugeren bekræftede at det er en fejl. Fix: `gh pr edit 39 --base development`.

2. **Hooks er i stykker** — `.cursor/hooks/guard-branches.sh` og `.cursor/hooks/guard-secrets.sh` er konfigureret som fail-closed, men filerne eksisterer ikke. Alle shell-kommandoer er blokeret for agenter. Skal fixies i Cursor Settings → Hooks.

3. **Sprint-kalender er ude af sync** — Sprint 2 + 3 tasks er allerede færdige. Bør sprint-planen opdateres til at afspejle real velocity?

4. **`.factory/context/` filer var tomme** — CONTEXT.md, PRD.md, STACK.md, TECHSPEC.md eksisterede som tomme filer. CONTEXT.md er nu udfyldt.

5. **Tech-debt backlog** — MER-54–57 (Not Started, ingen sprint assignment): abort-on-unmount, Zod schema duplikater, dead code i connector-module, double-read i plunk connector.

**Åbne beslutninger:**
- Skal sprint-planen opdateres til at afspejle faktisk velocity?
- Skal `paperclip/`-mappen (Walter, Todd, Saul, Jesse personas) dokumenteres i AGENTS.md?
- Skal tech-debt tasks (MER-54–57) assignes til en sprint?

**Næste skill/command:**
- `/to-prd` hvis nye features skal planlægges
- `/to-backlog` for at triage tech-debt tasks ind i et sprint

---

## HITL approved — T027 — 2026-06-08

**Approver:** human (delegated full implementation + deploy to agent)
**Note:** Docker Compose stack on Hetzner — Traefik, Medusa server/worker, Redis, Portainer, Prometheus, Grafana. DNS + Neon Frankfurt + local admin smoke test confirmed.
**Next:** Deploy `feature/S009/T027-hetzner-docker-compose` to VPS; verify `/health` + Grafana; open PR.

## HITL post-deploy — T027 — 2026-06-08

**Approver:** human
**Verified:** Better Stack uptime monitor on `https://api.mercflow.shop/health` (60s); Neon IP allowlist includes Hetzner `46.225.226.143`.
**PR:** https://github.com/eskobar95/mercflow/pull/68 — merged to `development`.
**Unblocks:** T029 (backup), T030 (provision tenant).

## Decision — T029 cancelled — 2026-06-08

**Decider:** human
**Rationale:** Hetzner Object Storage + pg_dump cron is overkill for MVP when Neon daily snapshots + PITR and Hetzner Server Backup on `mercflow` VPS cover database and infrastructure respectively.
**Documentation:** `infra/RUNBOOK.md` § Backup & restore; `tasks.md` T029 → cancelled.
**Next:** T030 tenant provisioning script on `feature/S009/T030-provision-tenant`.

## T030 implementation started — 2026-06-08

**Branch:** `feature/S009/T030-provision-tenant`
**Delivered:** `pnpm provision-tenant` CLI — store via `medusa exec`, sales channel / API key / admin user via Admin API, Traefik file per tenant in `infra/traefik/dynamic/tenants/`.
**Gate:** Unit tests green; backend typecheck green.

## T030 dry-run complete — 2026-06-08

**Tenant:** Salon Maria (test) — `store_01KTMK3806JRVQ00MR856BT302`; domain `shop.salon-maria.dk` not owned; Traefik file deployed to VPS anyway.
**Model:** Admin at `https://api.mercflow.shop/app`; tenant host = storefront/public only.
**Deferred:** DNS health HITL until first real customer domain.

---

## Task T031 — Pagination max + error shape audit — 2026-06-08

**Sprint:** S009 | **Milestone:** M006 | **Status:** done
**Branch:** `feature/S009/T031-pagination-error-shape`
**PR:** https://github.com/eskobar95/mercflow/pull/67
**Mode:** AFK
**Parallel group:** A

### Outcome
List handlers capped at 100; MercFlow API routes audited for MedusaError — merged before this sprint run.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | n/a |
| Review (thermo-nuclear) | n/a |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
none

---

## Task T032 — Store route versioning — 2026-06-08

**Sprint:** S009 | **Milestone:** M006 | **Status:** done
**Branch:** `feature/S009/T032-store-route-versioning`
**PR:** https://github.com/eskobar95/mercflow/pull/66
**Mode:** AFK
**Parallel group:** A

### Outcome
`/v1/` prefix on MercFlow store routes + 301 redirects from unversioned paths — merged before this sprint run.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | n/a |
| Review (thermo-nuclear) | n/a |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
T030

---

## Task T030 — Tenant provisioning script — 2026-06-08

**Sprint:** S009 | **Milestone:** M006 | **Status:** done
**Branch:** `feature/S009/T030-provision-tenant`
**PR:** https://github.com/eskobar95/mercflow/pull/69
**Mode:** AFK
**Parallel group:** B

### Outcome
`pnpm provision-tenant` CLI merged — store via `medusa exec`, Admin API for channel/key/user, Traefik YAML per tenant. Dry-run Salon Maria verified; DNS `/health` deferred (yellow).

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass (GitGuardian false positive; Gitleaks + full CI green) |
| Revision cycles | 2 |

### Unblocked
none

---

## Sprint retro — S009 — 2026-06-08

**Milestone:** M006
**Duration:** session (2026-06-05 – 2026-06-08)
**Tasks:** 5/5 done (T029 cancelled)

### What went well
- Hetzner stack live (`api.mercflow.shop`) with Traefik file provider, observability, Better Stack
- T031/T032 merged early in parallel group A
- T030 dry-run proved end-to-end provisioning against Neon + production API
- T029 scope cut — Neon snapshots + Hetzner VPS backup documented in RUNBOOK

### What failed or slowed down
- GitGuardian false positives on CLI/RUNBOOK placeholders (Gitleaks fixed via allowlist; merge proceeded with external check red)
- Traefik Docker provider incompatible with Docker 29 — switched to file provider
- Test tenant Traefik file removed from repo (VPS-only artifact)

### Task log index
| Task | Final status | See diary section |
|------|--------------|-------------------|
| T027 | done | HITL post-deploy — 2026-06-08 |
| T028 | done | (merged PR #65) |
| T029 | cancelled | Decision — 2026-06-08 |
| T030 | done | Task T030 — 2026-06-08 |
| T031 | done | Task T031 — 2026-06-08 |
| T032 | done | Task T032 — 2026-06-08 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T030 | 2 | Gitleaks allowlist + placeholder softening |

### Harness notes
- Parallel groups A (T031, T032) completed before B (T030)
- T031/T032 verified merged; no re-implementation

### Factory improvement suggestions
| Area | Suggestion | Target file |
|------|------------|-------------|
| CI | Document GitGuardian vs Gitleaks; add `.gitguardian.yml` ignore for CLI docs | infra/RUNBOOK.md |
| skill | Note external secret scanners may block merge despite green repo CI | skills/harness/fix-ci/SKILL.md |

### Next actions
- [ ] `/milestone-review M006`
- [ ] Human: dismiss GitGuardian false positive on PR #69 in dashboard (optional)
- [ ] First real customer domain: verify `GET https://<domain>/health` via Traefik

---

## Task T034 — @mercflow/shared pakke — 2026-06-09

**Sprint:** S010 | **Milestone:** M007 | **Status:** done
**Branch:** `feature/S010/T034-shared-package`
**PR:** https://github.com/eskobar95/mercflow/pull/71
**Mode:** AFK | **Parallel group:** A

### Outcome
Created `@mercflow/shared` with `slugifyForStrategy`; admin-ui decoupled from seo-module; slug tests moved; dual CJS/ESM dist.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 1 |

### Unblocked
none

---

## Sprint retro — S010 — 2026-06-09

**Milestone:** M007
**Duration:** session
**Tasks:** 1/2 done, 1 blocked (T033)

### What went well
- T034 shipped cleanly: `@mercflow/shared` decouples admin-ui from seo-module with dual CJS/ESM build
- CI green on PR #71 after dist artifacts + lint fix for unused `productModule` in RLS test script
- Parallel dispatch worked; T034 completed independently of T033 fork work

### What failed or slowed down
- T033 blocked at HITL gate at sprint start; fork workspace (medusa-fork) not merged in this run
- T034 WIP stashed when branch switched to T033 — required stash pop to resume
- First CI run failed on pre-existing lint error in `test-rls-medusa.ts` on `development` base

### Task log index
| Task | Final status | See diary section |
|------|--------------|-------------------|
| T033 | blocked (HITL/todo) | — (not dispatched this run) |
| T034 | done | Task T034 — 2026-06-09 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T034 | 1 | dist commit + CI build step for shared |

### Harness notes
- Parallel group A: only T034 runnable (T033 HITL skipped at preflight)
- Base branch is `development` (not `dev`)
- Subagent 657f4e44 incomplete; lead fork resumed from stash

### Factory improvement suggestions
| Area | Suggestion | Target file |
|------|------------|-------------|
| skill | Document `development` as base branch in implement/close skills | skills/harness/implement/SKILL.md |
| harness | Warn when parallel tasks stash-switch branches lose untracked package dirs | skills/harness/harness/SKILL.md |

### Next actions
- [ ] `/hitl-checkpoint T033` or confirm HITL approval → `/run-task T033`
- [ ] Merge PR #71 to `development`
- [ ] `/run-sprint S010` again after T033 completes

---

## HITL approved — T033 — 2026-06-09

**Approver:** human
**Note:** Packages: framework, medusa, utils, types, cli; js-sdk npm; zod@^4.x override
**Next:** T033 worker dispatched (supersedes S010 retro blocked state for T033)

---

## Task T033 — Fork workspace — 2026-06-09

**Sprint:** S010 | **Milestone:** M007 | **Status:** done
**Branch:** `feature/S010/T033-medusa-fork-workspace`
**PR:** https://github.com/eskobar95/mercflow/pull/72
**Mode:** AFK (post-HITL) | **Parallel group:** A

### Outcome
Medusa v2.14.1 source in `packages/medusa-fork/` (framework, medusa, utils, types, cli); workspace deps; zod@^4 override; module zod-error migrated.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI (main check) | pass |
| CI iterations | 4 |
| Revision cycles | 0 |

### Unblocked
T035, T036

---

## Task T036 — core table store_id + RLS — 2026-06-09

**Sprint:** S011 | **Milestone:** M007 | **Status:** done
**Branch:** `feature/S011/T036-core-tables-store-id-rls`
**PR:** https://github.com/eskobar95/mercflow/pull/74
**Mode:** AFK | **Parallel group:** C

### Outcome
`store_id` + RLS + triggers on 6 M0 core tables via `tenancy-core` module; `order_line_item` confirmed; `test-rls-medusa.ts` updated.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
T037

---

## Merged to development — S011 — 2026-06-09

| PR | Task | Merge |
|----|------|-------|
| #73 | T035 dashboard removal | `e5cf6ea` |
| #74 | T036 core store_id + RLS | `6001fa3` |

**Next:** `/run-task T037`

---

## Task T037 — started — 2026-06-09

**Sprint:** S012 | **Group:** A | **Branch:** `feature/S012/T037-tenant-startup-wiring`

---

## Task T037 — tenant startup wiring — 2026-06-09

**Sprint:** S012 | **Milestone:** M007 | **Status:** done
**Branch:** `feature/S012/T037-tenant-startup-wiring`
**PR:** https://github.com/eskobar95/mercflow/pull/75
**Mode:** AFK | **Parallel group:** A

### Outcome
TenantIsolationSubscriber registered on module EMs at bootstrap; tenantIsolationMiddleware wired on admin/store routes; README updated.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
none (M007 fork setup complete)

---

## Merged to development — S012 / T037 — 2026-06-09

| PR | Task | Merge |
|----|------|-------|
| #75 | T037 tenant startup wiring | `4bfc586` |

**M007 Medusa Fork Setup:** complete on `development` (T033–T037).

---

## Task T040 — Standard library seeds + activation API — 2026-06-10

**Sprint:** S014 | **Milestone:** M008 | **Status:** done
**Branch:** `feature/S014/T040-metafield-standard-library`
**PR:** https://github.com/eskobar95/mercflow/pull/78
**Merge:** `0c9a02c`
**Mode:** AFK | **Parallel group:** A

### Outcome
Standard library seeds (skincare + fashion), activation service, admin library routes.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
T045

---

## Task T043 — Category form metafields + constraint filter — 2026-06-10

**Sprint:** S014 | **Milestone:** M008 | **Status:** done
**Branch:** `feature/S014/T043-category-form-metafields`
**PR:** https://github.com/eskobar95/mercflow/pull/81
**Merge:** `43d3cb4`
**Mode:** AFK | **Parallel group:** B

### Outcome
Category form metafields section + ancestor-aware category_constraint filter on definitions API.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
none

---

## Task T044 — Store API metafields — 2026-06-10

**Sprint:** S014 | **Milestone:** M008 | **Status:** done
**Branch:** `feature/S014/T044-store-api-metafields`
**PR:** https://github.com/eskobar95/mercflow/pull/80
**Merge:** `e6d6eb8`
**Mode:** AFK | **Parallel group:** B

### Outcome
GET /store/v1/metafields with publishable_api_key auth and cross-tenant isolation tests.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
none

---

## Group B complete (S014)
| Task | Status | PR |
|------|--------|-----|
| T043 | done | https://github.com/eskobar95/mercflow/pull/81 |
| T044 | done | https://github.com/eskobar95/mercflow/pull/80 |

---

## Sprint retro — S014 — 2026-06-10

**Milestone:** M008
**Duration:** session
**Tasks:** 3/3 done, 0 blocked

### What went well
- Group A (T040) then Group B (T043 + T044) parallel dispatch worked; all three PRs CI green on first pass.
- Metafield-module backend slices landed cleanly on top of S013 definitions/values engine.

### What failed or slowed down
- Planning files (`tasks.md` M008 section) were not on `development` — restored during closeout.
- T040 subagent transcript did not return YAML; lead verified PR #78 CI manually.

### Task log index
| Task | Final status | See diary section |
|------|--------------|-------------------|
| T040 | done | Task T040 — 2026-06-10 |
| T043 | done | Task T043 — 2026-06-10 |
| T044 | done | Task T044 — 2026-06-10 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T040 | 0 | — |
| T043 | 0 | — |
| T044 | 0 | — |

### Harness notes
- Parallel groups: A (T040) → B (T043, T044)
- Subagent issues: T040 YAML missing; planning file drift between branches

### Factory improvement suggestions
| Area | Suggestion | Target file |
|------|------------|-------------|
| planning | Keep M008 task rows committed on `development` before `/run-sprint` | `.factory/planning/tasks.md` |
| harness | Lead should commit planning/diary updates on `development` after each sprint group | skills/harness/close/SKILL.md |

### Next actions
- [x] Merge PRs #78, #80, #81 to `development` (2026-06-10)
- [x] `/run-sprint S015` — T041 (group A) + T042 (group B after T041)
- [ ] `/run-sprint S016` — T045 (T040 + T041 merged)

---

## Task T041 — Custom Data settings page — 2026-06-10

**Sprint:** S015 | **Milestone:** M008 | **Status:** done
**Branch:** `feature/S015/T041-custom-data-settings-ui`
**PR:** https://github.com/eskobar95/mercflow/pull/79
**Merge:** `34bc047`
**Mode:** AFK | **Parallel group:** A

### Outcome
Custom Data settings page at `/settings/custom-data` with entity sidebar, definition table, and add/edit/delete slide-over wired to metafield-definitions admin API.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
T042

---

## Task T042 — Product form metafields sections — 2026-06-10

**Sprint:** S015 | **Milestone:** M008 | **Status:** done
**Branch:** `feature/S015/T042-product-form-metafields`
**PR:** https://github.com/eskobar95/mercflow/pull/82
**Merge:** `80b4855`
**Mode:** AFK | **Parallel group:** B

### Outcome
Product form metafields sections with two-tier UI (primary inputs + expandable chips), category-scoped inline section with badge, batch save on product submit.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 1 |

### Unblocked
none

---

## Group A complete (S015)
| Task | Status | PR |
|------|--------|-----|
| T041 | done | https://github.com/eskobar95/mercflow/pull/79 |

## Group B complete (S015)
| Task | Status | PR |
|------|--------|-----|
| T042 | done | https://github.com/eskobar95/mercflow/pull/82 |

---

## Merged to development — S014 + S015 — 2026-06-10

| PR | Task | Merge |
|----|------|-------|
| #78 | T040 standard library | `0c9a02c` |
| #80 | T044 store API metafields | `e6d6eb8` |
| #81 | T043 category form metafields | `43d3cb4` |
| #79 | T041 Custom Data settings UI | `34bc047` |
| #82 | T042 product form metafields | `80b4855` |

**Note:** #79 og #82 krævede merge-konfliktløsning mod `development` (union af metafield types/API mellem S014 og S015 branches).

---

## Sprint retro — S015 — 2026-06-10

**Milestone:** M008
**Duration:** session
**Tasks:** 2/2 done, 0 blocked

### What went well
- Sequential groups A→B: T041 unblocked T042 without rework
- Both PRs CI green; merged to `development` same day
- PRD two-tier metafield UX delivered in settings + product form

### What failed or slowed down
- Merge conflicts on both PRs (add/add i shared metafield-filer mellem S014 og S015)
- Planning files ikke committed på `development` før sprint-run

### Task log index
| Task | Final status | See diary section |
|------|--------------|-------------------|
| T041 | done | Task T041 — 2026-06-10 |
| T042 | done | Task T042 — 2026-06-10 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T041 | 0 | — |
| T042 | 1 | implement retry after review |

### Harness notes
- Parallel groups: A (T041) → B (T042 sequential)
- Merge order: #79 før #82; conflict resolution required on both

### Next actions
- [x] Merge PRs #79, #82 to `development` (2026-06-10)
- [x] `/run-sprint S016` — T045 standard library browse dialog
- [ ] `/milestone-review M008` after S016 merge

---

## Task T045 — Standard library browse dialog — 2026-06-10

**Sprint:** S016 | **Milestone:** M008 | **Status:** done
**Branch:** `feature/S016/T045-standard-library-browse-ui`
**PR:** https://github.com/eskobar95/mercflow/pull/83
**Mode:** AFK
**Parallel group:** A

### Outcome
Standard library browse dialog wired into Custom Data settings — vertical filter, checklist, activate selected via admin API.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
none (M008 feature-complete pending milestone review)

---

## Sprint retro — S016 — 2026-06-10

**Milestone:** M008
**Duration:** session
**Tasks:** 1/1 done, 0 blocked

### What went well
- Single-task sprint completed end-to-end with CI green on first PR push
- Reused T040 backend APIs without module changes
- React Doctor diff score 91/100 on PR changes

### What failed or slowed down
- Background subagent transcript lag; lead verified completion via branch/PR state

### Task log index
| Task | Final status | See diary section |
|------|--------------|-------------------|
| T045 | done | Task T045 — 2026-06-10 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T045 | 0 | — |

### Harness notes
- Parallel groups: A (solo T045)
- Subagent issues: transcript incomplete; implementation + PR completed successfully

### Factory improvement suggestions
| Area | Suggestion | Target file |
|------|------------|-------------|
| skill | Note base branch is `development` not `dev` in implement preflight | skills/harness/implement/SKILL.md |

### Next actions
- [ ] Merge PR #83 to `development`
- [x] Merge PR #83 to `development` (`93bc552` — 2026-06-10)
- [ ] `/milestone-review M008`
- [x] `/run-sprint S017` — T046, T048 (merged PR #84, #85)
- [x] `/run-sprint S018` — T047, T049 (merged PR #86, #87)

---

## Task T047 — Variant UX: progressiv "Add options" CTA → variant grid — 2026-06-10

**Sprint:** S018 | **Milestone:** M009 | **Status:** done
**Branch:** `feature/S018/T047-variant-progressive-ux`
**PR:** https://github.com/eskobar95/mercflow/pull/86
**Merge:** `6d89f1b`
**Mode:** AFK | **Parallel group:** A

### Outcome
Progressive variant UX — Add options CTA, inline builder, grid only after first defined option; no Default Title row for simple products

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

---

## Task T049 — "Physical product" toggle + shipping section collapse + dimension fields — 2026-06-10

**Sprint:** S018 | **Milestone:** M009 | **Status:** done
**Branch:** `feature/S018/T049-physical-toggle-dimensions`
**PR:** https://github.com/eskobar95/mercflow/pull/87
**Merge:** `b0ade41`
**Mode:** AFK | **Parallel group:** A

### Outcome
Physical product toggle with collapsible per-variant shipping dimensions (cm/g), apply-to-all confirmation, persist via variant fields + inventory requires_shipping. Rebased onto T047 merge before merge to `development`.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 1 |

---

## Sprint retro — S018 — 2026-06-10

**Milestone:** M009
**Duration:** session
**Tasks:** 2/2 done, 0 blocked

### What went well
- T047 og T049 merged til `development` (PR #86, #87)
- Merge-konflikt mellem parallel branches løst ved rebase (bevarede T047 progressive UX + T049 shipping)

### What failed or slowed down
- PR #87 havde merge-konflikter efter #86 — forventet for parallel produktform-ændringer

### Task log index
| Task | Final status | Merge |
|------|--------------|-------|
| T047 | done | `6d89f1b` |
| T049 | done | `b0ade41` |

### Next actions
- [ ] `/milestone-review M009`
- [ ] `/run-sprint S019` — T050 (M010 packaging-module)

---

## Task T046 — Unsaved state indicator + `beforeunload` guard — 2026-06-10

**Sprint:** S017 | **Milestone:** M009 | **Status:** done
**Branch:** `feature/S017/T046-unsaved-state-indicator`
**PR:** https://github.com/eskobar95/mercflow/pull/85
**Merge:** `f71c460`
**Mode:** AFK
**Parallel group:** A

### Outcome
Product form shows `•` in document.title when dirty; beforeunload guard with cleanup on save/unmount.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 1 |

### Unblocked
none

---

## Task T048 — SEO section: lazy preview + character counter — 2026-06-10

**Sprint:** S017 | **Milestone:** M009 | **Status:** done
**Branch:** `feature/S017/T048-seo-lazy-preview`
**PR:** https://github.com/eskobar95/mercflow/pull/84
**Merge:** `622ad70`
**Mode:** AFK
**Parallel group:** A

### Outcome
SEO section empty-state instructions, debounced Google snippet preview, inline character counters with red overflow state.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
none

---

## Sprint retro — S017 — 2026-06-10

**Milestone:** M009
**Duration:** session
**Tasks:** 2/2 done, 0 blocked

### What went well
- T046 og T048 kørte parallelt uden konflikter
- Begge PR'er grønne CI på første merge-kandidat

### What failed or slowed down
- none

### Task log index
| Task | Final status | See diary section |
|------|--------------|-------------------|
| T046 | done | Task T046 — 2026-06-10 |
| T048 | done | Task T048 — 2026-06-10 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T046 | 1 | scope fix commit `f21191b` |
| T048 | 0 | — |

### Next actions
- [x] Merge PR #84 + #85 to `development` (`622ad70`, `f71c460` — 2026-06-10)
- [ ] `/run-sprint S018` — T047, T049

---

## Task T053 — Shipmondo connector: packaging dimensions auto-fill — 2026-06-10

**Sprint:** S021 | **Milestone:** M010 | **Status:** done
**Branch:** `feature/S021/T053-shipmondo-packaging-autofill`
**PR:** https://github.com/eskobar95/mercflow/pull/91
**Mode:** HITL
**Parallel group:** A

### Outcome
Shipmondo POST /shipments label flow med packaging autofill (mm→cm, gram), sender settings i rules_json, og Generate label UI på order detail.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
none

---

## Sprint retro — S021 — 2026-06-10

**Milestone:** M010
**Duration:** session
**Tasks:** 1/1 done, 0 blocked

### What went well
- HITL checkpoint godkendt; T053 implementeret og PR #91 grøn CI på første kandidat
- Fuldt pipeline: implement → verify → review → close → fix-ci uden revision loops

### What failed or slowed down
- none

### Task log index
| Task | Final status | See diary section |
|------|--------------|-------------------|
| T053 | done | Task T053 — 2026-06-10 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T053 | 0 | — |

### Harness notes
- Parallel groups used: A (1 task)
- Subagent issues: none

### Factory improvement suggestions
| Area | Suggestion | Target file |
|------|------------|-------------|
| skill | Align implement skill base branch med `development` | skills/harness/implement/SKILL.md |

### Next actions
- [ ] Human: review and merge PR #91 to `development`
- [x] HITL post-merge: sandbox POST /shipments PASS — shipment `58028292`, parcels `weight:2000g, 30×20×10cm` (300×200×100mm input)
- [ ] Deploy PR #91 to `api.mercflow.shop` + fix local backend MikroORM startup for fuld Admin UI E2E
- [ ] `/run-sprint S022` — M011 Shipping Settings (T054, T055)

---

## Task T053 follow-up — Local Shipmondo E2E fixes — 2026-06-10

**Sprint:** S021 | **Milestone:** M010 | **Status:** done
**Branch:** `feature/S021/shipmondo-e2e-local-fixes` (deleted after merge)
**PR:** https://github.com/eskobar95/mercflow/pull/93 — merged `b891b26`
**Mode:** HITL (local E2E validated pre-PR)

### Outcome
Thermo-nuclear optimeringer + harness close: MikroORM utils dedupe, order/connector fixes, reproducible `shipmondo:e2e-setup` seed, planning sync T050–T052 done.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass (typecheck, focused tests, react-doctor:ci 100/100) |
| Review (thermo-nuclear) | pass (blockers fixed pre-PR) |
| Close | PR #93 opened |
| CI | pass (all checks green after Docker Hub rerun) |

### Unblocked
none (M010 complete; next sprint S022 not yet in tasks.md)

### Next actions
- [x] CI green on PR #93
- [x] Merged PR #93 to `development` (`b891b26`)
- [ ] Human: set `E2E_ADMIN_PASSWORD` in `.env` for local `pnpm shipmondo:e2e-setup`
- [ ] `/run-sprint S022` or `/to-backlog` for M011

---

## Sprint retro — M010 Fulfillment Intelligence — 2026-06-10

**Milestone:** M010
**Sprints:** S019, S020, S021
**Tasks:** 4/4 done (T050–T053), 0 blocked

### What went well
- Fuldt vertical slice: packaging-module → settings UI → order widget → Shipmondo label E2E
- PR #93 lukkede lokal dev-gap (MikroORM dedupe, reproducible `shipmondo:e2e-setup`)

### Task log index
| Task | Final status | PR |
|------|--------------|-----|
| T050 | done | #88 |
| T051 | done | #89 |
| T052 | done | #90 |
| T053 | done | #91 + #93 |

### Next actions
- [x] `/to-backlog` — M011 Fulfillment Packaging Persistence (T054, T055 / S022)
- [x] `/run-sprint S022` — start T054

---

## Task T054 — shipment_packaging model, migration, RLS, upsert service, admin API — 2026-06-10

**Sprint:** S022 | **Milestone:** M011 | **Status:** done
**Branch:** `feature/S022/T054-shipment-packaging-model`
**PR:** https://github.com/eskobar95/mercflow/pull/94
**Mode:** AFK
**Parallel group:** A

### Outcome
Added shipment_packaging model with RLS, upsert service with dimension snapshot, GET/PUT admin API, tests, and README.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
T055

---

## Task T055 — persist + restore confirmed packaging on reload — 2026-06-10

**Sprint:** S022 | **Milestone:** M011 | **Status:** done
**Branch:** `feature/S022/T055-order-packaging-persist-ui`
**PR:** https://github.com/eskobar95/mercflow/pull/95
**Mode:** AFK
**Parallel group:** A

### Outcome
Order detail persists packaging choice via shipment-packaging API, restores on reload, and wires persisted id into Shipmondo label flow.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
none

---

## Sprint retro — S022 — 2026-06-10

**Milestone:** M011
**Duration:** session
**Tasks:** 2/2 done, 0 blocked

### What went well
- Sekventiel slice T054→T055 leverede fuld persistence-loop: model/API → admin UI restore/save
- CI grøn på begge PRs (#94, #95) uden revision loops

### What failed or slowed down
- Subagent-transcripts opdaterede langsomt; lead måtte inferere status fra branch/PR/CI
- T055 branched fra `development` før T054 merge — afhængighed håndteres via parallel PRs

### Task log index
| Task | Final status | PR |
|------|--------------|-----|
| T054 | done | #94 |
| T055 | done | #95 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T054 | 0 | — |
| T055 | 0 | — |

### Harness notes
- Parallel groups used: A (sequential dispatch: T054 then T055)
- Subagent issues: transcript lag; implementation completed via shared workspace

### Factory improvement suggestions
| Area | Suggestion | Target file |
|------|------------|-------------|
| skill | Document `development` as base branch (not `dev`) in implement/close skills | skills/harness/implement/SKILL.md |
| skill | Note T055 should rebase on T054 branch when T054 not yet merged | skills/harness/harness/SKILL.md |

### Next actions
- [x] Merge PR #94 then #95 to `development` (`2662cc9`, `115d3fa`)
- [ ] `/milestone-review M011` after merge

---

## Task T056 — notification-module foundation — 2026-06-11

**Sprint:** S023 | **Milestone:** M012 | **Status:** done
**Branch:** `feature/S023/T056-notification-module-foundation`
**PR:** https://github.com/eskobar95/mercflow/pull/97 (merged `d7194a4`)
**Mode:** AFK
**Parallel group:** A

### Outcome
Added `@mercflow/notification-module` with `email_configs`/`email_deliveries`, RLS, `NotificationService`, BullMQ `enqueueEmail` idempotency, admin API routes, tests, and backend registration.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 1 |

### Unblocked
T057, T058, T062, T063

---

## Sprint retro — S023 — 2026-06-11

**Milestone:** M012
**Duration:** session
**Tasks:** 1/1 done, 0 blocked

### What went well
- Solo foundation slice T056 leverede fuld vertical stack: DML, migrations, RLS, service, BullMQ enqueue, admin API, tests, README
- Reference patterns fra `packaging-module` gav hurtig scaffold

### What failed or slowed down
- Første subagent-dispatch hang ~25 min med staged filer uden commit; lead måtte interrupt+resume
- Harness preflight refererer til `dev` branch — projektet bruger `development`

### Task log index
| Task | Final status | PR |
|------|--------------|-----|
| T056 | done | #97 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T056 | 1 | eslint migration-ignore fix i revision 1 |

### Harness notes
- Parallel groups used: A (solo T056)
- Subagent issues: initial stall; completed efter interrupt+resume

### Factory improvement suggestions
| Area | Suggestion | Target file |
|------|------------|-------------|
| skill | Document `development` as base branch (not `dev`) in implement/close/harness preflight | skills/harness/implement/SKILL.md |
| skill | Add subagent stall detection + auto-interrupt efter N min uden transcript output | skills/harness/harness/SKILL.md |

### Next actions
- [x] Merge PR #97 to `development` (`d7194a4`)
- [x] HITL checkpoint T057 — 2026-06-11
- [x] `/run-sprint S024`

---

## HITL approved — T057 — 2026-06-11

**Approver:** human
**Note:** `mail.mercflow.shop` verified in SES (eu-north-1); IAM user `mercflow` with keys in `apps/backend/.env`; production SES (50k/day quota, no sandbox banner). Fallback domain corrected to `mercflow.shop` (not `.com`).
**Next:** `/run-sprint S024` (T057 + T058 parallel)

---

## Task T057 — SES domain identity management — 2026-06-11

**Sprint:** S024 | **Milestone:** M012 | **Status:** done
**Branch:** `cursor/s024-t057-ses-domain-identity-dc6a`
**PR:** https://github.com/eskobar95/mercflow/pull/104
**Mode:** AFK (HITL approved)
**Parallel group:** A

### Outcome
SES domain identity via sesv2 client, setupDomain/checkDomainStatus, dns_records migration, admin domain routes, and 15min BullMQ polling worker

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 2 |

### Unblocked
T061

---

## Task T058 — BullMQ notification worker infrastructure — 2026-06-11

**Sprint:** S024 | **Milestone:** M012 | **Status:** done
**Branch:** `cursor/s024-t058-notification-worker-dc6a`
**PR:** https://github.com/eskobar95/mercflow/pull/103
**Mode:** AFK
**Parallel group:** A

### Outcome
BullMQ notification worker with retry/DLQ, React Email template renderer, backend bootstrap, unit tests, and RUNBOOK DLQ monitoring

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 1 |

### Unblocked
T059

---

## Sprint retro — S024 — 2026-06-11

**Milestone:** M012
**Duration:** session
**Tasks:** 2/2 done, 0 blocked

### What went well
- T057 og T058 kørte parallelt uden merge-konflikter
- HITL checkpoint for T057 var klar inden sprint-start
- Begge PRs med grøn CI (lint, test, typecheck, backend migrations)

### What failed or slowed down
- T057 krævede 2 revision cycles (sesv2 API + dns_records migration)
- PR #103 Playwright smoke hang i pending længe efter øvrige checks var grønne

### Task log index
| Task | Final status | See diary section |
|------|--------------|-------------------|
| T057 | done | Task T057 — 2026-06-11 |
| T058 | done | Task T058 — 2026-06-11 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T057 | 2 | sesv2 client + migration fix |
| T058 | 1 | CI fix iteration 1 |

### Harness notes
- Parallel groups used: A (T057 + T058)
- Subagent issues: none

### Factory improvement suggestions
| Area | Suggestion | Target file |
|------|------------|-------------|
| skill | Document `development` as base branch (not `dev`) in implement/close/harness preflight | skills/harness/implement/SKILL.md |
| command | Note cloud agent branch prefix `cursor/*-dc6a` vs task metadata `feature/S*` | commands/harness/run-sprint.md |

### Next actions
- [x] Merge PR #103 + #104 to `development` (2026-06-11 — #104 `33a98d2`, #103 `eea674c`)
- [x] `/run-sprint S025` — T059 (order-confirmation) + T061 (Domain admin UI)
- [ ] Human: review merged notification infrastructure on `development`

---

## S024 merged to development — 2026-06-11

**PRs:** [#104](https://github.com/eskobar95/mercflow/pull/104) `33a98d2` (T057 SES domain identity), [#103](https://github.com/eskobar95/mercflow/pull/103) `eea674c` (T058 BullMQ worker)

**Note:** #103 merged after conflict resolution with #104 (`apps/backend/package.json`, `pnpm-lock.yaml`).

**Unblocked:** T059, T061 (S025)

---

## Task T059 — order-confirmation template + order.placed subscriber — 2026-06-11

**Sprint:** S025 | **Milestone:** M012 | **Status:** done
**Branch:** `feature/S025/T059-order-confirmation-template`
**PR:** https://github.com/eskobar95/mercflow/pull/108
**Mode:** AFK
**Parallel group:** A

### Outcome
Order-confirmation React Email templates, order.placed subscriber, snapshot + integration tests, and email preview script shipped with all CI checks green.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
T060

---

## Task T061 — Admin UI: Settings → Email → Domain tab — 2026-06-11

**Sprint:** S025 | **Milestone:** M012 | **Status:** done
**Branch:** `feature/S025/T061-email-domain-settings-ui`
**PR:** https://github.com/eskobar95/mercflow/pull/109
**Mode:** AFK
**Parallel group:** B

### Outcome
Email domain tab with DNS setup, copy-to-clipboard records, status polling, and Communications sidebar group.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
none

---

## Sprint retro — S025 — 2026-06-11

**Milestone:** M012
**Duration:** session
**Tasks:** 2/2 done, 0 blocked

### What went well
- Group A (T059) og Group B (T061) kørte sekventielt uden revision loops
- Begge PRs grønne CI på første merge-kandidat (#108, #109)
- T059 unblocked T060 for S026

### What failed or slowed down
- Preflight: `dev` branch mangler — MercFlow bruger `development` (ADR-002)
- Subagents opdaterede tasks.md på feature branches; lead synkede planning på `development`

### Task log index
| Task | Final status | See diary section |
|------|--------------|-------------------|
| T059 | done | Task T059 — 2026-06-11 |
| T061 | done | Task T061 — 2026-06-11 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T059 | 0 | — |
| T061 | 0 | — |

### Harness notes
- Parallel groups used: A (T059), B (T061) — sekventiel per harness regel
- Subagent issues: none

### Factory improvement suggestions
| Area | Suggestion | Target file |
|------|------------|-------------|
| skill | Treat `development` as satisfying preflight `dev` check for MercFlow | skills/harness/harness/SKILL.md |
| command | Note sprint tasks may update tasks.md on feature branches — lead must merge planning sync | commands/harness/run-sprint.md |

### Next actions
- [x] Merge PR #108 + #109 to `development`
- [ ] `/run-sprint S026` — T060 (remaining templates; T062/T063 already done)
- [ ] Human: review order-confirmation email preview + domain setup flow

---

## HITL approved — T067 — 2026-06-11

**Approver:** human
**Note:** Traefik allowlist dokumenteres som del af T067-implementering; Clerk mercflow-platform keys i lokal .env; Hetzner deploy efter PR merge.
**Next:** PR from `feature/S029/T067-platform-console-scaffold`

---

## Task T067 — Platform Console scaffold — 2026-06-11

**Sprint:** S029 | **Milestone:** M014 | **Status:** done
**Branch:** `feature/S029/T067-platform-console-scaffold`
**PR:** https://github.com/eskobar95/mercflow/pull/107
**Mode:** AFK (HITL approved)

### Outcome
Platform Console Vite app (:5174), `/platform/health` with Clerk JWT + platformDb BYPASSRLS check, Traefik IP allowlist scaffold. Local smoke verified (mercflow-platform Clerk, session email claim, Overview health green).

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass (local typecheck + platform-auth tests) |
| Review | pass (session) |
| CI | pending → merge after green |
| Local smoke | pass — DB role mercflow, BYPASSRLS yes |

### Unblocked
T068, T069, T070

### Follow-up (human, post-merge)
Production checklist in `apps/platform-console/README.md` — revert gmail.com override, mercflow.shop domain, Neon `mercflow_owner` role.

**Deferred — do not do yet (2026-06-11):** Traefik operator IPs in `platform-console.yml`, `platform-console` compose service, DNS `console.mercflow.shop`. Wait for explicit go-live HITL after S030+ feature work or a dedicated deploy decision.

---

## Sprint retro — S029 — 2026-06-11

**Milestone:** M014
**Duration:** session (T067 implement + local setup)
**Tasks:** 1/1 done, 0 blocked

### What went well
- End-to-end local smoke: mercflow-platform Clerk, JWT email claim, `/platform/health`, sidebar shell
- Production checklist documented in platform-console README + RUNBOOK

### What failed or slowed down
- Initial local setup reused store-admin Clerk keys (separate user DB)
- `noget@mercflow.shop` test user had no mailbox; gmail.com dev override needed temporarily

### Task log index
| Task | Final status | PR |
|------|--------------|-----|
| T067 | done | #107 |

### Next actions
- [x] Merge PR #107 to `development`
- [x] `/run-sprint S030` — T068 + T069 parallel
- [ ] Human: Hetzner production checklist before console.mercflow.shop

---

## Task T070 — Email health + system metrics + audit log UI — 2026-06-11

**Sprint:** S031 | **Milestone:** M014 | **Status:** done
**Branch:** `feature/S031/T070-platform-email-system-audit`
**PR:** https://github.com/eskobar95/mercflow/pull/111
**Mode:** AFK
**Parallel group:** B

### Outcome
Cross-tenant platform email/system/audit APIs and Platform Console pages with 30s metrics refresh.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 1 |

### Unblocked
T071

---

## Task T068 — Tenant management — 2026-06-11

**Sprint:** S030 | **Milestone:** M014 | **Status:** done
**Branch:** `feature/S030/T068-platform-tenant-management`
**PR:** https://github.com/eskobar95/mercflow/pull/113
**Mode:** AFK
**Parallel group:** A

### Outcome
Platform tenant list, SSE provision, suspend with audit log, and platform-console Tenants UI shipped with green CI.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 1 |

### Unblocked
none (T070 already merged via PR #111)

---

## Task T069 — BullMQ queue monitor — 2026-06-11

**Sprint:** S030 | **Milestone:** M014 | **Status:** done
**Branch:** `feature/S030/T069-platform-queue-monitor`
**PR:** https://github.com/eskobar95/mercflow/pull/112
**Mode:** AFK
**Parallel group:** A

### Outcome
Platform queue monitor with /platform/queues API, live stats, DLQ drill-down, manual retry, and React Query polling UI.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
none

---

## Sprint retro — S030 — 2026-06-11

**Milestone:** M014
**Duration:** session
**Tasks:** 2/2 done, 0 blocked

### What went well
- T067 dependency cleared (PR #107 merged); both parallel tasks shipped in one session
- Group A parallel dispatch completed without cross-branch conflicts
- CI green on both PRs (#112, #113) after merge conflict resolution with T070 (#111)

### What failed or slowed down
- Harness preflight still references `dev` branch; MercFlow uses `development` (ADR-002)
- T068 needed one revision cycle; merge conflicts with S031/T070 required manual resolution

### Task log index
| Task | Final status | See diary section |
|------|--------------|-------------------|
| T068 | done | Task T068 — 2026-06-11 |
| T069 | done | Task T069 — 2026-06-11 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T068 | 1 | review feedback addressed in revision 1 |
| T069 | 0 | — |

### Harness notes
- Parallel groups used: A (T068 + T069)
- Subagent issues: none

### Factory improvement suggestions
| Area | Suggestion | Target file |
|------|------------|-------------|
| skill | Use `development` not `dev` in preflight + close skills | skills/harness/harness/SKILL.md |
| skill | Lead should commit planning sync to development after sprint retro | skills/harness/retro/SKILL.md |

### Next actions
- [x] Merge PR #112 to `development`
- [ ] Merge PR #113 and #114 to `development`
- [ ] `/milestone-review M014` after S030 PRs merged

---

## Sprint retro — S031 — 2026-06-11

**Milestone:** M014
**Duration:** session (T070 harness dispatch)
**Tasks:** 1/1 done, 0 blocked

### What went well
- Solo sprint completed in one subagent pass with CI green on PR #111
- Backend platform routes + three console pages delivered end-to-end

### What failed or slowed down
- One revision cycle (verify/lint fixes before review)
- Harness `dev` vs MercFlow `development` branch naming mismatch (ADR-002)

### Task log index
| Task | Final status | See diary section |
|------|--------------|-------------------|
| T070 | done | Task T070 — 2026-06-11 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T070 | 1 | lint/type fixes in revision 1 |

### Harness notes
- Parallel groups used: B (solo)
- Subagent issues: none

### Factory improvement suggestions
| Area | Suggestion | Target file |
|------|------------|-------------|
| skill | Default integration branch to `development` in implement/close skills | `.cursor/skills/harness/implement/SKILL.md` |
| skill | Preflight should check `development` when `dev` missing | `.cursor/skills/harness/harness/SKILL.md` |

### Next actions
- [x] Merge PR #111 to `development`
- [x] `/run-sprint S032` — T071 subscription-module foundation

---

## Task T071 — `subscription-module` foundation: models, migrations, RLS, service, admin API — 2026-06-11

**Sprint:** S032 | **Milestone:** M015 | **Status:** done
**Branch:** `feature/S032/T071-subscription-module-foundation`
**PR:** https://github.com/eskobar95/mercflow/pull/115
**Mode:** AFK
**Parallel group:** solo

### Outcome
Subscription-module foundation with DML models, RLS migration, tenant-scoped service (7 methods), admin list/detail/pause/cancel/resume API, tests, and README.

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 1 |

### Unblocked
T072, T073, T074

---

## Sprint retro — S032 — 2026-06-11

**Milestone:** M015
**Duration:** session
**Tasks:** 1/1 done, 0 blocked

### What went well
- Solo task completed end-to-end with CI green on first fix-ci iteration
- Existing Batch 1 scaffold expanded cleanly into full foundation without breaking backend registration
- T072, T073, T074 unblocked for S033/S034

### What failed or slowed down
- One revision cycle (tsconfig ESNext alignment for test typecheck)

### Task log index
| Task | Final status | See diary section |
|------|--------------|-------------------|
| T071 | done | Task T071 — 2026-06-11 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T071 | 1 | tsconfig ESNext fix in revision 1 |

### Harness notes
- Parallel groups used: solo
- Subagent issues: none

### Factory improvement suggestions
| Area | Suggestion | Target file |
|------|------------|-------------|
| skill | Default integration branch to `development` in implement/close skills | `.cursor/skills/harness/implement/SKILL.md` |
| skill | Preflight should check `development` when `dev` missing | `.cursor/skills/harness/harness/SKILL.md` |

### Next actions
- [ ] Merge PR #115 to `development`
- [ ] `/run-sprint S033` — T072 + T073 (parallel)
- [ ] `/milestone-review M015` after S034

---

## Task T072 — BullMQ renewal worker — 2026-06-11

**Sprint:** S033 | **Milestone:** M015 | **Status:** done
**Branch:** `feature/S033/T072-subscription-renewal-worker`
**PR:** https://github.com/eskobar95/mercflow/pull/117
**Mode:** AFK
**Parallel group:** A

### Outcome
Added @mercflow/worker with hourly subscription renewal cron, Stripe charge idempotency, failure handling, and domain events on mercflow:subscriptions

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
none

---

## Task T073 — Subscription admin UI — 2026-06-11

**Sprint:** S033 | **Milestone:** M015 | **Status:** done
**Branch:** `feature/S033/T073-subscription-admin-ui`
**PR:** https://github.com/eskobar95/mercflow/pull/116
**Mode:** AFK
**Parallel group:** A

### Outcome
Subscription admin list + detail with pause/cancel/resume, renewal log, optimistic UI, and Customers sidebar nav

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
none

---

## Sprint retro — S033 — 2026-06-11

**Milestone:** M015
**Duration:** session
**Tasks:** 2/2 done, 0 blocked

### What went well
- Parallel group A completed both tasks with zero revision cycles
- T072 worker and T073 admin UI landed independently without merge conflicts
- CI green on first pass for both PRs (#116, #117)

### What failed or slowed down
- Nothing — clean sprint run

### Task log index
| Task | Final status | See diary section |
|------|--------------|-------------------|
| T072 | done | Task T072 — 2026-06-11 |
| T073 | done | Task T073 — 2026-06-11 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T072 | 0 | — |
| T073 | 0 | — |

### Harness notes
- Parallel groups used: A (2 subagents)
- Subagent issues: none

### Factory improvement suggestions
| Area | Suggestion | Target file |
|------|------------|-------------|
| skill | Default integration branch to `development` in implement/close skills | `.cursor/skills/harness/implement/SKILL.md` |
| skill | Preflight should check `development` when `dev` missing | `.cursor/skills/harness/harness/SKILL.md` |

### Next actions
- [ ] Merge PR #116 and #117 to `development`
- [ ] `/run-sprint S034` — T074 (HITL) + T075 (AFK)
- [ ] `/milestone-review M015` after S034

---

## Task T074 — Customer Club Stripe setup — 2026-06-11

**Sprint:** S034 | **Status:** skipped
**Reason:** HITL — awaiting human checkpoint before implement (`/hitl-checkpoint T074`)

---

## Task T075 — Per-product club member price UI — 2026-06-11

**Sprint:** S034 | **Milestone:** M015 | **Status:** done
**Branch:** `feature/S034/T075-product-club-price-ui`
**PR:** https://github.com/eskobar95/mercflow/pull/118
**Mode:** AFK
**Parallel group:** A

### Outcome
Club member price API (price_list upsert/delete) + Product edit Pricing section gated on `club_enabled`

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
none

---

## Sprint retro — S034 — 2026-06-11

**Milestone:** M015
**Duration:** session
**Tasks:** 1/2 done, 0 blocked (1 HITL skipped)

### What went well
- T075 implemented end-to-end with zero revision cycles; CI green on first pass (PR #118)
- Club pricing backend + admin UI integrated with existing subscription-module foundation

### What failed or slowed down
- T074 skipped — HITL checkpoint required for Stripe webhook secrets and live Stripe product setup

### Task log index
| Task | Final status | See diary section |
|------|--------------|-------------------|
| T074 | skipped (HITL) | Task T074 — 2026-06-11 |
| T075 | done | Task T075 — 2026-06-11 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T075 | 0 | — |

### Harness notes
- Parallel groups used: A (1 AFK subagent; 1 HITL skipped)
- Subagent issues: none
- Base branch: `development` (no `dev` branch in repo)

### Factory improvement suggestions
| Area | Suggestion | Target file |
|------|------------|-------------|
| skill | Default integration branch to `development` in implement/close skills | `.cursor/skills/harness/implement/SKILL.md` |
| skill | Preflight should accept `development` when `dev` missing | `.cursor/skills/harness/harness/SKILL.md` |

### Next actions
- [ ] Human: `/hitl-checkpoint T074` then re-run `/run-sprint S034` or `/run-task T074`
- [ ] Merge PR #118 to `development`
- [ ] `/milestone-review M015` after T074 done

---

## HITL approved — T074 — 2026-06-11

**Approver:** human
**Note:** Stripe test credentials supplied for local dev harness. Production model: per-store connector_config (connector-module); env vars are dev fallback only. Implement T074 must resolve secret_key + webhook_secret from connector row via mercflowResolveStripeSecretKey / connector decrypt — not hardcode merchant secrets in env for production paths.
**Next:** `/run-task T074` or `/run-sprint S034`

---

## Task T074 — Customer Club Stripe webhook + settings UI — 2026-06-11

**Sprint:** S034 | **Milestone:** M015 | **Status:** done
**Branch:** `feature/S034/T074-customer-club-stripe-setup`
**PR:** https://github.com/eskobar95/mercflow/pull/119
**Mode:** AFK (HITL approved 2026-06-11)
**Parallel group:** A

### Outcome
Customer Club Stripe webhook (HMAC), club_members group sync, subscription-config API + Settings UI with dynamic Stripe Product creation via connector credentials

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 1 |

### Unblocked
none

---

## Sprint retro — S034 — 2026-06-11 (complete)

**Milestone:** M015
**Duration:** session (2 runs — T075 then T074 after HITL)
**Tasks:** 2/2 done, 0 blocked

### What went well
- T075 club pricing + T074 Customer Club config/webhook both shipped with green CI
- HITL checkpoint clarified connector-module credential model vs env fallback
- T074 CI green on first pass (PR #119)

### What failed or slowed down
- First S034 run skipped T074 pending HITL — resolved via human checkpoint + credential handoff

### Task log index
| Task | Final status | See diary section |
|------|--------------|-------------------|
| T074 | done | Task T074 — 2026-06-11 |
| T075 | done | Task T075 — 2026-06-11 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T074 | 1 | — |
| T075 | 0 | — |

### Harness notes
- Parallel groups used: A
- Base branch: `development` (no `dev` branch)
- Subagent issues: none

### Next actions
- [ ] Merge PR #118 and #119 to `development`
- [ ] `/milestone-review M015`

---

## Task T076 — SettingsShell layout — 2026-06-12

**Sprint:** S035 | **Milestone:** M016 | **Status:** done
**Branch:** `feature/S035/T076-settings-shell`
**PR:** https://github.com/eskobar95/mercflow/pull/120
**Mode:** AFK
**Parallel group:** solo

### Outcome
SettingsShell with 8-group sidebar replaces card landing; `/settings` redirects to `/settings/general`

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
T077, T078

---

## Sprint retro — S035 — 2026-06-12

**Milestone:** M016
**Duration:** session
**Tasks:** 1/1 done, 0 blocked

### What went well
- T076 shipped end-to-end with zero revision cycles; CI green on first pass (PR #120)
- SettingsShell + settingsNav.ts SSOT established per ADR-012

### What failed or slowed down
- nothing

### Task log index
| Task | Final status | See diary section |
|------|--------------|-------------------|
| T076 | done | Task T076 — 2026-06-12 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T076 | 0 | — |

### Harness notes
- Solo sprint — single subagent dispatch
- Base branch: `development`
- Unblocks S036 (T077 + T078 parallel)

### Next actions
- [x] Merge PR #120 to `development`
- [x] `/run-sprint S036` for route remapping + Apps overview

---

## Task T077 — Settings route remapping + placeholders — 2026-06-12

**Sprint:** S036 | **Milestone:** M016 | **Status:** done
**Branch:** `feature/S036/T077-settings-route-remapping`
**PR:** https://github.com/eskobar95/mercflow/pull/122
**Mode:** AFK
**Parallel group:** A

### Outcome
SettingsPlaceholderPage, 6 placeholder routes, path redirects (connectors→apps, store-details→general), updated SETTINGS_NAV_GROUPS icons/paths

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
none

---

## Task T078 — Apps overview connector status — 2026-06-12

**Sprint:** S036 | **Milestone:** M016 | **Status:** done
**Branch:** `feature/S036/T078-settings-apps-overview`
**PR:** https://github.com/eskobar95/mercflow/pull/123
**Mode:** AFK
**Parallel group:** A

### Outcome
/settings/apps overview with connector status badges and configure links; GET /admin/connectors returns status field

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
none

---

## Sprint retro — S036 — 2026-06-12

**Milestone:** M016
**Duration:** session
**Tasks:** 2/2 done, 0 blocked

### What went well
- T077 + T078 shipped in parallel with zero revision cycles; CI green on first pass (PR #122, #123)
- Prerequisite T076 (S035) completed first — unblocked both S036 tasks cleanly

### What failed or slowed down
- S036 was initially blocked until S035 T076 merged; user re-requested sprint 4× before planning files existed on branch

### Task log index
| Task | Final status | See diary section |
|------|--------------|-------------------|
| T077 | done | Task T077 — 2026-06-12 |
| T078 | done | Task T078 — 2026-06-12 |

### Revision loops (aggregate)
| Task | Cycles | Resolved by |
|------|--------|-------------|
| T077 | 0 | — |
| T078 | 0 | — |

### Harness notes
- Parallel group A: 2 subagents dispatched in one turn
- Prerequisite S035 T076 run first (PR #120 merged)
- Base branch: `development`

### Factory improvement suggestions
| Area | Suggestion | Target file |
|------|------------|-------------|
| skill | Auto-detect prerequisite sprint blockers and suggest/run S035 before S036 | `.cursor/skills/harness/harness/SKILL.md` |

### Next actions
- [ ] Merge PR #122 and #123 to `development`
- [ ] Close duplicate PR #121 if superseded by #120
- [ ] `/milestone-review M016` after PRs merged
