# MercFlow — Security documentation

Operational security notes for the Hetzner deployment (ADR-006) and MercFlow backend hardening (ADR-016).

---

## Platform rate limiting storage

High-risk `/platform/*` endpoint groups are rate-limited per client IP (see `apps/backend/src/lib/platform-http/rateLimits.ts`):

| Endpoint group | Window | Max requests | Key |
|---|---|---|---|
| `POST /platform/invites` | 15 min | 10 | Client IP |
| `POST /platform/signup/*` | 15 min | 20 | Client IP |
| `GET /platform/billing/plans` | 1 min | 30 | Client IP |
| `POST /platform/provision` | 15 min | 5 | Client IP |

**Current store:** in-memory (`InMemoryTtlRateLimitStore` in `apps/backend/src/lib/rate-limit/`). Suitable for the single-node Hetzner deployment.

**Horizontal scaling:** when MercFlow runs multiple backend instances behind Traefik, replace the in-memory store with a Redis-backed shared counter (same key strategy: client IP from `X-Forwarded-For` / socket). BullMQ already requires Redis on the platform stack (ADR-010); reuse that cluster for rate-limit state.

Public SEO/feed routes and store GET routes use separate in-memory limiters configured in `apps/backend/src/api/middlewares.ts`.

---

## Accepted-risk dependency CVEs

See T093 / M021 CVE remediation for the canonical accepted-risk list (dev-only moderate CVEs with version, CVE ID, rationale, and revisit sprint).
