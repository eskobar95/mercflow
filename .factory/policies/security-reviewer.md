# Security Reviewer — project focus areas

Instructions for Cursor's Security Reviewer agent on this project.
Commit this file and update as the architecture evolves.

## Project identity

- App type: Multi-tenant SaaS — Medusa v2 distribution (MercFlow) + platform console
- Sensitive data: Tenant store data, payment data (Stripe), PII (customer orders), API keys, Clerk org tokens
- Auth provider: Clerk (admin UI + platform console) — `clerk-admin-auth-middleware` + `clerk-platform-auth-middleware`

## Priority focus areas

### 1. Tenant / data isolation
- Every DB query must be scoped to the authenticated tenant (`store_id`, `org_id`, etc.)
- Row-Level Security policies must be present on all tenant-owned tables
- No cross-tenant data leakage in API responses

### 2. Authentication boundaries
- All protected routes must verify the session/JWT before doing work
- Server Actions must validate auth — do not rely on client-side guards
- API routes in `app/api/` must use the auth helper, not raw cookie reads

### 3. Input validation
- All inbound data (body, query params, headers) must be validated with Zod or equivalent
- Reject unknown fields on mutation endpoints
- Do not pass raw `req.body` into DB queries

### 4. Webhook verification
- All webhook endpoints must verify signatures (HMAC or provider SDK)
- Use constant-time comparison for signature checks
- Log rejected webhooks; do not leak reason to caller

### 5. Secrets
- No secrets in source code, logs, or error messages
- `.env` and `*.pem` must never be committed (enforced by git hook)
- Server-only secrets must never be imported into Client Components

## Exclude from review

<!-- Files the Security Reviewer should skip -->
- `packages/medusa-fork/**` — upstream vendor code, not project-owned
- `*.test.ts`, `*.spec.ts` — test fixtures may use dummy values
- `migrations/**` — schema files reviewed separately

## Severity thresholds

| Finding | Action |
|---------|--------|
| Tenant isolation bypass | Block merge immediately |
| Auth missing on protected route | Block merge |
| Unvalidated input on mutation | Block merge |
| Missing webhook signature check | Block merge |
| Hardcoded secret | Block merge (also triggers security incident) |
| Overly verbose error message | Warning — fix before release |
| Missing rate limiting | Warning — track as follow-up task |
