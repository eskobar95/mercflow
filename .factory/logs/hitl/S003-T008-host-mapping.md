# HITL — T008 Host → store_id mapping (S003)

**Task:** T008  
**Sprint:** S003 / M001  
**Date:** 2026-06-04  
**Status:** Resolved — option **A** implemented and merged

---

## Decision required

How should public MercFlow routes resolve `store_id` from the HTTP `Host` header?

| Option | Description |
|--------|-------------|
| **A** | Lookup hostname against `mercflow_seo_config.storefront_url` (recommended) |
| B | Dedicated `mercflow_tenant_host` table |
| C | Env-based mapping (single-tenant dev) |

---

## Approved choice

**Option A** — strip `storefront_url` to hostname, index-backed lookup, 60s positive cache in `tenant-resolver.ts`. Unknown hosts return 404; failed lookups are not negatively cached. Updating `storefront_url` via admin SEO config clears resolver cache.

---

## Implementation evidence

- PR #60 merged as `b2e1d90`
- Middleware: `mercflowPublicTenantMiddleware` on `/sitemap.xml`, `/robots.txt`, `/feed/*`
- Tests: `packages/seo-module/test/tenant-resolver.test.ts`

---

## Sign-off

Recorded in Factory execution (agent session 2026-06-04). Notion task HITL field remains source for PM if duplicated there.
