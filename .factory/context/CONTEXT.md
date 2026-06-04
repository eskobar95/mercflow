# CONTEXT — shared language

> Domain glossary for MercFlow. Updated during `/align`. Referenced by planning and harness skills.

---

## MercFlow

**Meaning:** An opinionated Medusa v2 distribution built from MercFlow-owned packages and app-level integration points. Not a fork of Medusa — it wraps it.

**Not:** A standalone e-commerce platform or a Guapo-specific product. Guapo is the first internal validation case only.

**Example scenario:** When a new connector (Stripe, Shipmondo) is added, it belongs in `packages/connector-module`, not in `apps/backend`.

---

## Content module

**Meaning:** `@mercflow/content-module` — the MercFlow-owned Medusa module responsible for CMS data: product/category rich text + SEO, articles, pages, page blocks, redirects, globals, media, product attributes.

**Not:** Medusa's own product title/description/slug fields. Those stay in Medusa core UI and APIs.

**Example scenario:** `description_rich` is a content-module field. `title` and `handle` are Medusa core fields. Never duplicate them.

---

## Connector module

**Meaning:** `@mercflow/connector-module` — stores encrypted third-party credentials and config (Stripe, Shipmondo, Plunk, GTM). Exposes admin + store routes for each connector.

**Not:** A payment provider or shipping carrier implementation. It stores and manages config; checkout wiring belongs in the storefront.

---

## Subscription module

**Meaning:** `@mercflow/subscription-module` — new Medusa module (emerged in Sprint 3, MER-43) for `subscription` table: customer subscriptions with status, cycle, renewal, discount. Read-only admin view only in v1; no state machine changes.

**Not:** A billing engine. MercFlow records the subscription state; Stripe handles payments.

---

## Development branch

**Meaning:** The active integration branch. All feature PRs must target `development`. Only Tech Lead promotes `development → staging → main`.

**Not:** A branch agents merge to directly. Always PR → development.

**Decision (2026-06-04):** PR #39 (`feature/content-module/articles-crud`) was found targeting `main` by mistake. Correct base is `development`. Fix: `gh pr edit 39 --base development`.

---

## Sprint plan vs. actual velocity

**Meaning:** The sprint calendar (Sprint 1: 17 May – 7 Jun, Sprint 2: 8 Jun – 5 Jul, Sprint 3: 6 Jul – 16 Aug, Sprint 4: 17 Aug – 13 Sep) was created as a planning artifact. Actual agent velocity has been significantly higher — Sprint 2 and Sprint 3 tasks were completed during Sprint 1.

**Not:** A hard deadline. Sprints are time-boxes for planning, not fixed delivery windows.

**Implication:** Sprint task assignments should be re-evaluated when planning next sprint to avoid sprint-calendar drift.

---

## Vertical slice

**Meaning:** One unit of deliverable work that cuts through DB → Service → API → UI → Tests for a single user-facing outcome. Always committed per layer, always reviewed as a whole slice.

**Not:** A horizontal layer task ("add all DB migrations first, then all services"). Horizontal layers cause merge blockers.

---

## Hooks (Cursor agent hooks)

**Meaning:** Shell hooks configured in Cursor settings that run before agent shell commands. Currently `guard-branches.sh` and `guard-secrets.sh` are configured as fail-closed but **the files do not exist**, which blocks all shell commands for agents.

**Not:** Working infrastructure. This is a known broken state as of 2026-06-04.

**Fix needed:** Either create the hook scripts or remove the hook configuration in Cursor Settings → Hooks.

---

<!-- Add terms below during /align sessions -->
