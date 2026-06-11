# ADR-011 — Authentication Strategy: Clerk for Store Admin + Platform Console

**Date:** 2026-06-11
**Status:** accepted
**Deciders:** Nicklas Eskou (founder)
**Context:** `/align` session June 2026, `/to-backlog` auth discussion

---

## Context

MercFlow has three distinct authentication actors that must not share session context:

| Layer | Actor | Scope |
|-------|-------|-------|
| 1 | **Platform Console** operators | MercFlow team — cross-tenant visibility, operator actions |
| 2 | **Store Admin** merchants | Per-store admin — scoped by `store_id`, multi-store capable |
| 3 | **Customers** | End-customers per store — managed by Medusa native auth |

Previous architecture used Medusa's built-in JWT admin auth for Layer 2 and had no solution for Layer 1. Medusa's auth is single-tenant and cannot represent "one merchant managing multiple stores".

**Constraints driving the decision:**

1. **No Google Cloud project setup** — no manual OAuth client management in GCP console. Provider setup must be abstracted.
2. **Multi-store capability** — one merchant identity can be admin of multiple MercFlow stores.
3. **RLS integration** — JWT must carry `store_id` so `SET LOCAL app.tenant_id` can be populated without an extra DB lookup per request.
4. **Cost** — free tier must support MVP scale (< 100 tenant stores, < 20 admins per store).

---

## Decision

**Use Clerk** for Layer 1 (Platform Console) and Layer 2 (Store Admin).  
**Keep Medusa native auth** for Layer 3 (customers).

---

## Implementation

### Clerk application structure

| Clerk App | Used by | Auth features |
|-----------|---------|---------------|
| `mercflow-store-admin` | Store Admin merchants | Organizations (org = store), Google + email login |
| `mercflow-platform` | Platform Console operators | Email login, application-level email domain check (`@mercflow.shop`) |

**These are two separate Clerk applications** — session tokens are not interchangeable.

### Store Admin: Organization = Store

Each MercFlow `store_id` corresponds to one Clerk Organization. The Clerk JWT `org_id` claim maps 1:1 to `store_id`:

```
Clerk Organization:
  id:    "org_01JX..."         → store_id in MercFlow RLS
  name:  "Guapo"
  roles: admin (merchant), member (staff)
```

**JWT template** (configured in Clerk dashboard):
```json
{
  "store_id": "{{org.id}}",
  "user_id":  "{{user.id}}",
  "role":     "{{org.role}}"
}
```

The `store_id` JWT claim is used by the Medusa fork's admin route middleware to call `SET LOCAL app.tenant_id = '{{store_id}}'` before each request — replacing the current Medusa admin JWT flow.

**Multi-store:** A merchant is a member of multiple Clerk orgs. The `activeOrganizationId` in the Clerk session represents the active store context. The admin-ui sends this org_id as part of the auth header, the middleware uses it to scope all queries.

### Medusa fork change: replace admin JWT middleware

**File:** `packages/medusa-fork/medusa/src/api/middlewares/authenticate-admin-token.ts` (or equivalent)

Replace:
```ts
// Old: Medusa's own JWT validation
const token = verifyMedusaAdminToken(req.headers.authorization)
```

With:
```ts
// New: Clerk JWT validation
import { createClerkClient } from "@clerk/backend"
const { userId, orgId } = await clerkClient.verifyToken(token)
if (!orgId) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "No active organization")
TenantContext.run(orgId, next) // orgId = store_id
```

The `TenantContext.run(orgId, ...)` call activates the existing `TenantIsolationSubscriber` — no RLS changes needed.

### Platform Console: separate Clerk app + email restriction

```ts
// apps/platform-console/src/middleware/auth.ts
const ALLOWED_DOMAIN = process.env.PLATFORM_ALLOWED_EMAIL_DOMAIN // = "mercflow.shop"

export function requireOperator(user: ClerkUser) {
  if (!user.primaryEmailAddress?.emailAddress.endsWith(`@${ALLOWED_DOMAIN}`)) {
    throw new UnauthorizedError()
  }
}
```

The Clerk `mercflow-platform` app uses the same Google social provider configuration — no Google Cloud project management needed (Clerk handles OAuth credentials internally).

### Customer auth (Medusa native — unchanged)

Medusa's customer JWT auth remains untouched. Customers authenticate against `/store/auth` and receive Medusa customer tokens. `store_id` on the customer record + RLS handles isolation. Clerk is never involved.

---

## Pricing

| Stage | Clerk cost | Trigger to upgrade |
|-------|------------|-------------------|
| MVP (< 100 stores) | **$0/month** — Hobby free tier | Exceed 100 MROs |
| Growth (100–1,000 stores) | ~$1/month per store above 100 | At 100th paying tenant |
| Enterprise | Custom | SAML/SCIM enterprise customers |

The free tier includes: 50,000 MRUs, 100 MROs, 20 members/org, custom JWT templates, 3 social providers.

---

## Scope

- **Applies to:** `packages/medusa-fork/medusa/` (admin middleware), `packages/admin-ui/` (Clerk provider), `apps/platform-console/` (Clerk provider), `apps/backend/` (env vars)
- **Does not apply to:** `packages/*/` MercFlow module services (they use `TenantContext.getStoreId()` which is populated upstream by the middleware), storefront customer auth

---

## Enforcement

```bash
# Verify no Medusa admin JWT functions remain after T064
rg "verifyToken\|verifyJwt\|medusa-admin-token" packages/medusa-fork/ --type ts
# Should return 0 matches for the old Medusa validation; Clerk validation should be the only path

# Verify all /admin routes require org context
# JWT templates must include "store_id" claim in Clerk dashboard (manual verification — HITL)
```

---

## Consequences

**Positive:**
- No Google Cloud project to manage — social providers configured in Clerk dashboard only.
- Multi-store capability built into the auth layer (not custom code).
- JWT `store_id` claim eliminates per-request DB lookup for tenant resolution.
- Free until 100 tenant stores — significant runway.

**Negative / risks:**
- Clerk is an external dependency — outage = admin login unavailable (Clerk SLA: 99.99% uptime on Pro; acceptable on free for MVP).
- Medusa admin middleware must be modified in fork — one-time effort, low risk.
- Existing Guapo admin user must be migrated to Clerk org (manual HITL step on T064).

**Future migration path:**
Neon Auth (Better Auth managed) is the preferred v2 migration target once their Organization JWT claims are stable. The Medusa fork middleware change is the same shape — swap `@clerk/backend` for `better-auth` token verification. User data can be exported from Clerk and imported to Neon Auth.

---

## Alternatives considered

| Alternative | Rejected because |
|-------------|-----------------|
| **Medusa native admin JWT** | Cannot represent multi-store (one merchant = multiple stores) |
| **Google OAuth directly** | Requires Google Cloud project management — explicitly rejected by user |
| **Neon Auth (Better Auth)** | Organization JWT claims marked "under development" — not production-ready for RLS |
| **Better Auth self-hosted** | More setup than Clerk free tier provides for same result; evaluate after Neon Auth matures |
| **Simple JWT allowlist** | Doesn't scale to multi-store; no invite flows; no social providers |
