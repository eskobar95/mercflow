# Factory diary

> One entry per session. Most recent first.

---

## 2026-06-04 — `/run-sprint S007` (T023 + T024 implementation)

**Branch:** `feature/S007/T023-po-receive-flow` @ worktree `../mercflow-worktrees/S007-T023`

### HITL — PO receipt vs Medusa stock (T023)

- Decision log: `.factory/logs/hitl/S007-po-stock-boundary.md`
- **MercFlow receipt only** — no automatic Medusa stock mutation; UI/API expose `stock_applied: false`

### Delivered

- **T023:** `POST /admin/purchase-orders/:id/receive`, `GET /admin/purchase-orders/:id`, receive admin page, list row action
- **T024:** `GET /admin/inventory-overview`, movements + `GET/PATCH /admin/inventory-config`, inventory overview table + movement sheet
- Tests: 14 passing in `@mercflow/inventory-module`; typecheck + lint green

### Gate

**Yellow** — movement history lists PO receipts only; Medusa sale/manual_adjustment events deferred (documented in README).

### PR

https://github.com/eskobar95/mercflow/pull/61 → `development`

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
- Harness: finish S003 (T008–T012)

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
