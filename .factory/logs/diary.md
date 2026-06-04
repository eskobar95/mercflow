# Factory diary

> One entry per session. Most recent first.

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
