# ADR-016 — Security Hardening: API Validation + Rate Limiting + CVE Policy

**Date:** 2026-06-14
**Status:** Accepted
**Deciders:** Nicklas Eskou, AI Factory (/align session June 2026)
**Related PRD:** PRD-security-hardening.md (M021)

---

## Context

Prior to M021, MercFlow had three compounding security gaps:

1. **Zero Zod validation on 20 `/platform/*` routes** — all platform API routes accepted arbitrary request bodies without schema validation. Discovered in a codebase scan June 2026.
2. **No rate limiting anywhere** — invite, signup, and billing endpoints were open to enumeration and abuse attacks.
3. **CVEs in transitive deps** — `pnpm audit` reported 1 high + 10 moderate CVEs. None in MercFlow-owned packages, but production-path packages (`react-router`, `qs`, `vite`) were affected.

The project is preparing to onboard external paying tenants. These gaps are not acceptable at that threshold.

---

## Decision

### 1. `validateBody` helper as the single Zod integration point

A shared `validateBody(schema, req)` function in `apps/backend/src/lib/platform-http/validateBody.ts` is the canonical way to validate platform route inputs. It throws `MedusaError(INVALID_DATA, ...)` on failure — Medusa's error handler converts this to a 400 with a clean message. No stack traces in responses.

Every POST/PATCH platform route calls `validateBody` as its first line. Every parameterised route validates URL params inline with `z.string().min(1)`.

### 2. Express-compatible rate limiting at route group level

Rate limits are applied as middleware at the route group level (not per-route) using `express-rate-limit` or a Medusa-compatible equivalent. Limits defined in `apps/backend/src/lib/platform-http/rateLimits.ts`. In-memory store is acceptable for single-node Hetzner deployment; Redis-backed store is added when horizontal scaling is introduced.

### 3. CVE remediation policy

| Severity | Policy |
|---|---|
| Critical / High | **Fix** — mandatory before closing M021. Upgrade the direct dep that pulls in the vulnerable transitive. Use `pnpm.overrides` only as a last resort if the direct dep cannot be bumped. |
| Moderate (production path) | **Fix if safe** — bump if a non-breaking upgrade exists. Document rationale if deferred. |
| Moderate (dev-only) | **Accept with documentation** — dev server vulnerabilities (esbuild CORS, vitest) are not exploitable in production builds. Document in `infra/SECURITY.md` with version + rationale. |

Gate: `pnpm audit --audit-level=high` must return exit code 0 before M021 closes.

---

## Options considered

### Option A — Per-route ad-hoc Zod validation (rejected)
Each route author writes their own Zod schema and parse call. No shared helper.

**Rejected:** Inconsistent error shapes. Easy to forget on new routes. No single enforcement point for linting/auditing.

### Option B — `validateBody` shared helper (chosen)
Single function, single error type, enforced by convention + code review.

**Chosen:** Consistent 400 responses. Auditable via `rg "validateBody"`. Matches existing MedusaError conventions.

### Option C — OpenAPI schema generation + validation middleware (rejected)
Generate schemas from OpenAPI spec, validate automatically.

**Rejected:** Over-engineered for the current 20-route surface. Adds toolchain complexity. Not compatible with Medusa's router without a non-trivial adapter.

---

## Consequences

**Positive:**
- All platform routes have documented, typed input contracts
- Rate limiting prevents invite enumeration and signup abuse before first external tenant
- `pnpm audit --audit-level=high` → 0 is a CI-checkable gate

**Negative / mitigations:**
- 20 routes need Zod schemas added — one-time effort, ~2h implementation
- `pnpm.overrides` for transitive CVEs can mask future version conflicts — mitigated by documenting each override with a comment and the CVE reference

---

## Scope

Applies to all routes under `apps/backend/src/api/platform/`. New platform routes added after M021 must use `validateBody` from day one. Enforced via code review; a future lint rule can automate this.

---

## Enforcement

```bash
# All platform POST/PATCH routes must call validateBody
rg "validateBody" apps/backend/src/api/platform/ -l
# Count should match number of POST/PATCH route files

# No high/critical CVEs
pnpm audit --audit-level=high
# Must exit 0

# No secrets in staged files
gitleaks detect --source . --staged
```

---

## How to fix a violation

**If a platform route has no `validateBody` call:**
→ Import `validateBody` from `@/lib/platform-http/validateBody`, define a Zod schema for the body/params, call as first line of handler.

**If `pnpm audit --audit-level=high` fails:**
→ Identify the vulnerable package and its direct-dep parent. Bump the parent. If blocked by Medusa fork constraints, add `pnpm.overrides` with a comment: `# CVE-XXXX-XXXXX: override until medusa-fork bumps <package>`.

**If a new moderate CVE appears post-M021:**
→ Assess: production-path or dev-only? Production-path → fix within one sprint. Dev-only → add to `infra/SECURITY.md` accepted-risk list with expiry date.
