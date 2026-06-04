# ADR-005 — Security: RLS, rate limiting, and Neon network policy

**Date:** 2026-06-04
**Status:** accepted

---

## Context

Analysis of the Neon `development` branch (project `young-waterfall-54245022`) revealed three security gaps that must be addressed before onboarding a second tenant or exposing public routes in production:

1. **No Row Level Security (RLS)** on any table — application layer is the only isolation.
2. **Neon project has `block_public_connections: false` and an empty IP allowlist** — DB accepts connections from any IP on the internet.
3. **No rate limiting** on public MercFlow routes (`/sitemap.xml`, `/robots.txt`, `/feed/*`, store API).

---

## Decision

### 1. Row Level Security (RLS)

**Phased approach:**

- **Phase 1 (before second tenant):** Enable RLS on all MercFlow module tables after `store_id` migration. Policy: `USING (store_id = current_setting('app.store_id', true))`. Application sets `SET LOCAL app.store_id = ?` in a transaction wrapper before any query.
- **Phase 2 (hardening):** Add `FORCE ROW LEVEL SECURITY` for the application role so RLS cannot be bypassed even with superuser-like queries from the app.
- **Medusa core tables** (product, order, cart, etc.): RLS is not applied — Medusa manages these through its own mechanisms (sales channels, regions, publishable API keys). Do not add RLS to Medusa-owned tables.

**Why not skip RLS and rely on application alone?**
A single missing `store_id` filter in a service method would silently expose cross-tenant data. RLS is a defence-in-depth layer that catches coding mistakes at the DB level.

### 2. Neon network policy

- **Set `block_public_connections: true`** on the Neon project when Railway (or other hosting) supports private networking / Neon private link.
- **Interim (before private link):** add Railway egress IPs to `allowed_ips` on the Neon project. This reduces attack surface while private networking is set up.
- Connection string must never appear in client-side code, admin-ui bundles, or public repos.

### 3. Rate limiting

**Public routes** (`GET /sitemap.xml`, `GET /robots.txt`, `GET /feed/google-shopping.xml`):
- Implement a Medusa middleware with per-IP rate limiting: **60 requests/minute** per IP (configurable env var).
- Return `429 Too Many Requests` with `Retry-After` header.
- Use Redis (or Neon-backed table as fallback) for request counters.

**Admin routes** (`/admin/*`):
- Medusa's built-in auth rate limiting covers login attempts. Verify it is enabled and configured.
- Add per-`store_id` rate limit on write operations if abuse becomes a concern (Phase 2).

**Store API** (`/store/*`):
- Per-`publishable_api_key` rate limiting: **300 requests/minute** (configurable).
- Covers storefront → backend traffic.

---

## Scope

| Kind | Path / pattern |
|------|----------------|
| RLS | All MercFlow module tables in `packages/*/src/models/` |
| Network | Neon project settings (infrastructure, not code) |
| Rate limiting | `apps/backend/src/middlewares/` or equivalent |

Excluded: Medusa core tables (RLS not applied); Neon branching (not used per ADR-004).

---

## Enforcement

| Mechanism | Tool / hook | What it checks |
|-----------|-------------|----------------|
| Migration review | Harness `harness/review` | New module table migration enables RLS + adds policy |
| Network | Manual + ops runbook | Neon `block_public_connections` set before second tenant |
| Rate limiting | Integration test | `429` returned after N+1 request in test |

**Local command (RLS check):** `SELECT relname FROM pg_class JOIN pg_namespace ON relnamespace = pg_namespace.oid WHERE nspname = 'public' AND relkind = 'r' AND relrowsecurity = false AND relname NOT LIKE 'mikro_orm%' AND relname NOT LIKE 'link_module%';`
— must return only Medusa core tables and empty MercFlow rows.

**Local command (rate limit smoke):** `for i in $(seq 1 65); do curl -o /dev/null -s -w "%{http_code}\n" http://localhost:9000/sitemap.xml; done | sort | uniq -c`
— must show `429` after 60 requests.

---

## How to fix

1. **Missing RLS on new table:** add `ALTER TABLE <t> ENABLE ROW LEVEL SECURITY; CREATE POLICY tenant_isolation ON <t> USING (store_id = current_setting('app.store_id', true));` in the same migration as `store_id` column.
2. **Rate limit bypass:** increase counter TTL or add Redis cluster; do not raise the limit without explicit approval.
3. **Public Neon connections:** add Railway static egress IPs to Neon project `allowed_ips` → escalate to private link.

**Related ADRs:** ADR-004 (store_id isolation)
**Related PRD section:** "Security" (add after this ADR is accepted)

---

## Consequences

**Good:**
- Defence in depth: DB-level isolation catches application bugs
- Rate limiting protects Neon compute cost and prevents abuse of public XML routes
- IP restriction limits blast radius of leaked connection string

**Bad / trade-offs:**
- RLS requires `SET LOCAL app.store_id` in every transaction — adds boilerplate to service base class
- `block_public_connections` requires Railway private networking (infra change, not code)
- Redis adds infrastructure dependency for rate limiting (Neon-backed fallback available but slower)

---

## Alternatives considered

| Option | Why rejected |
|--------|--------------|
| Application-only tenant isolation | Single code mistake exposes cross-tenant data |
| Neon branching per tenant | Rejected in ADR-004 |
| Cloudflare WAF for rate limiting | Viable for public routes — consider as Phase 2 enhancement |
