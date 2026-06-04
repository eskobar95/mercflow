# HITL — T013 Global tenant config table ownership (S004)

**Task:** T013  
**Sprint:** S004 / M002  
**Date:** 2026-06-04  
**Status:** Resolved — reuse **`mercflow_seo_config`** (no separate `mercflow_global_config`)

---

## Decision required

Should storefront org identity (`storefront_url`, org name, logo, social URLs) live on the existing `mercflow_seo_config` row (T004) or a new `mercflow_global_config` table?

| Option | Description |
|--------|-------------|
| **A** | Extend / use `mercflow_seo_config` (recommended — fields already exist from T004) |
| B | New `mercflow_global_config` table |

---

## Approved choice

**Option A** — single per-tenant SEO config row owns slug strategy, storefront URL, org identity, and (S004) `json_ld_settings` toggles. Feed module continues to use `mercflow_feed_config.storefront_url` for feed-specific config; operators set storefront URL in SEO Organisation settings (T013 UI) and may mirror in Feed settings when needed.

---

## Implementation notes

- Admin: Settings → SEO → Organisation (storefront + org fields)
- Admin: Settings → SEO → Structured data (JSON-LD per page type toggles on `json_ld_settings`)
- Store APIs read org + toggles via `SeoModuleService.getOrCreateSeoConfig(storeId)`
- JSON-LD `Organization` block omitted when `org_name` is empty (empty-state safe)

---

## Sign-off

Factory harness default for `/run-sprint S004` (agent session 2026-06-04). PM may mirror in Notion if tracked separately.
