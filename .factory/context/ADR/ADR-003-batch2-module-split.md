# ADR-003 — Batch 2: separate seo, feed, and inventory modules

**Date:** 2026-06-04
**Status:** accepted

---

## Context

Batch 2 adds SEO infrastructure, shopping feeds, and inventory/PO workflows. Putting everything in `content-module` would blur CMS vs operations vs public SEO output. PRD-batch2 §4 defines three new packages.

---

## Decision

Create three Medusa modules (separate packages), registered in `apps/backend`:

| Package | Owns |
|---------|------|
| `@mercflow/seo-module` | Redirects, sitemap/robots config, slug utility, public `/sitemap.xml`, `/robots.txt` |
| `@mercflow/feed-module` | Feed config, validation, public `/feed/google-shopping.xml` |
| `@mercflow/inventory-module` | Suppliers, POs, receipts, inventory dashboard data, low-stock config |

**Also:**
- Slug utility lives in **seo-module** (or shared util exported from seo-module) per PRD; content-module may gain canonical/brand fields only where PRD says Batch 1 tables.
- JSON-LD / OG / canonical **consume** content-module + Medusa core; generation logic stays out of admin-ui business layer.
- PO receipt **may** update Medusa stock when a task explicitly implements it (PRD §3.9); UI and API must state the boundary (MercFlow record vs Medusa inventory).

---

## Scope

| Kind | Path / pattern |
|------|----------------|
| New packages | `packages/seo-module`, `packages/feed-module`, `packages/inventory-module` |
| Registration | `apps/backend` module config only |
| Admin UI | New pages in `packages/admin-ui` calling module admin routes |

Excluded: `connector-module`, `subscription-module` scope.

---

## Enforcement

| Mechanism | Tool / hook | What it checks |
|-----------|-------------|----------------|
| Code review | Human + harness review | No PO/feed logic dumped into `apps/backend` |
| README | Per-package README in same PR as module | Module boundary documented |

**Local command:** `pnpm typecheck` (includes new packages when added)
**CI command:** `pnpm ci`

---

## How to fix

1. If feature is redirect/sitemap/robots/slug → `seo-module`
2. If feature is product XML feed → `feed-module`
3. If feature is PO/supplier/inventory dashboard → `inventory-module`
4. If feature is rich text/SEO fields on product → `content-module` (existing)

**Related ADRs:** none
**Related PRD journey:** Batch 2 (all sections §3.1–3.11)

---

## Consequences

**Good:**
- Clear ownership; smaller PRs; aligns with vertical slices per module surface

**Bad / trade-offs:**
- Three migration streams and READMEs to maintain
- Cross-module events (slug change → redirect) need explicit subscribers

---

## Alternatives considered

| Option | Why rejected |
|--------|--------------|
| Single `mercflow-ops-module` | God module; harder reviews |
| Everything in content-module | Violates CMS vs SEO vs inventory boundaries in AGENTS.md |
