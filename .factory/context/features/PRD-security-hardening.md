# PRD — Security Hardening (M021)

> Version 1.0 — 2026-06-14
> Based on: /align session June 2026, pnpm audit output, codebase scan
> Gate: Must ship before first external (paying) tenant is onboarded

---

## Problem

MercFlow has three categories of security gaps that must be closed before external tenants are onboarded:

1. **Zero Zod validation on platform API routes.** All 20 `/platform/*` routes accept arbitrary request bodies and URL params without validation. A malformed or malicious payload can reach service logic unchecked — creating risk for injection, unexpected state mutations, and poor error surfaces for legitimate callers.

2. **No rate limiting anywhere.** Invite, signup, and billing endpoints are completely open to abuse: credential stuffing on signup, invite-token enumeration, and billing plan polling without any throttle.

3. **Unresolved CVEs in transitive dependencies.** `pnpm audit` reports 1 high + 10 moderate CVEs (all transitive — no MercFlow-owned package is directly vulnerable). The high CVE (`esbuild <0.28.1`) is in the build-tool chain; the moderates include runtime packages (`react-router`, `qs`, `vite`) that could be exploitable in a production context.

Additionally: one `innerHTML` assignment in `previewPlainText.ts` needs to be verified as sanitized.

---

## Goals

1. `pnpm audit --audit-level=high` → 0 results before milestone closes.
2. Every POST/PATCH `/platform/*` route validates request body with Zod before business logic runs. Every parameterised route validates URL params.
3. Rate limiting active on invite, signup, and billing plan endpoints.
4. `previewPlainText.ts` `innerHTML` usage is either sanitized with DOMPurify or replaced with a safe DOM API.
5. `gitleaks detect --source . --staged` → 0 secrets detected.
6. All existing tests remain green.

---

## Non-goals (explicit)

- **Full penetration test** — this is the minimum bar for first external tenant, not a comprehensive security audit.
- **Auth system changes** — Clerk + Medusa JWT is working correctly; not in scope.
- **RLS audit** — RLS was established in M000–M007; a full re-audit is out of scope (spot-check new M017–M020 tables only).
- **OWASP Top 10 full coverage** — targeted fixes only; not a broad OWASP remediation.
- **Moderate CVEs in dev-only tools** — `vite`, `vitest`, `esbuild` dev-server CORS issue is not exploitable in production builds; upgrade if a safe path exists, document as accepted risk if not.
- **New features** — no new user-facing functionality in this milestone.

---

## Architecture

### Layer 1 — Zod validation on platform routes

Introduce a shared helper in `apps/backend/src/lib/platform-http/validateBody.ts`:

```ts
export function validateBody<T>(schema: ZodSchema<T>, req: MedusaRequest): T {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      result.error.issues.map(i => i.message).join(', ')
    )
  }
  return result.data
}
```

Routes with a request body call `validateBody(schema, req)` as the first line of the handler. Read-only routes (GET) validate URL params with `z.string().min(1)` where applicable.

**Routes requiring body validation (POST/PATCH):**
- `POST /platform/invites` — `{ email: z.string().email() }`
- `POST /platform/invites/:id/revoke` — params: `{ id: z.string().min(1) }`
- `POST /platform/signup/billing/setup` — `{ price_id: z.string().startsWith('price_'), invite_token: z.string() }`
- `POST /platform/provision` — `{ payment_intent_id: z.string(), invite_token: z.string() }`
- `POST /platform/admin/tenants/:store_id/suspend` — params: `{ store_id: z.string().min(1) }`
- All remaining POST routes with a body

### Layer 2 — Rate limiting

Use `express-rate-limit` (or Medusa-compatible middleware) at the route group level. Configure in `apps/backend/src/lib/platform-http/rateLimits.ts`:

| Endpoint group | Window | Max requests | Strategy |
|---|---|---|---|
| `POST /platform/invites` | 15 min | 10 per IP | Prevent invite spam |
| `POST /platform/signup/*` | 15 min | 20 per IP | Prevent signup abuse |
| `GET /platform/billing/plans` | 1 min | 30 per IP | Cache-backed anyway, belt + suspenders |
| `POST /platform/provision` | 15 min | 5 per IP | Prevent provision flooding |

Store: in-memory (acceptable for single-node Hetzner deployment). Upgrade to Redis-backed if horizontal scaling is introduced.

### Layer 3 — CVE remediation

**High (fix):**
- `esbuild <0.28.1` via `tsx@4.22.4` → bump `tsx` to `>=4.23.0` (ships esbuild `>=0.28.1`). Add to root `package.json` devDependencies.

**Moderate — safe upgrades:**
- `react-router` — bump to latest patch in platform-console
- `vite` — bump to latest `5.x` in admin-ui + platform-console
- `qs` + `ajv` + `ws` — via Medusa fork: check if bumping `@medusajs/deps` resolves; if not add `pnpm.overrides` for the specific CVE package versions

**Moderate — accepted risk (dev-only):**
- `vitest` esbuild CORS issue — dev server only, not exploitable in CI/CD or production builds. Document in `infra/SECURITY.md` as accepted risk with version note.
- `brace-expansion` ReDoS — assess if any user input reaches glob expansion; likely not. Document as accepted if no path found.

### Layer 4 — `innerHTML` fix

`packages/admin-ui/src/lib/text/previewPlainText.ts`: replace `div.innerHTML = markup` with either:
- `DOMPurify.sanitize(markup)` before assignment (if HTML must be parsed), or
- `div.textContent = markup` if the intent is plain-text extraction (safer, no HTML parsing)

Determine intent from call sites before choosing.

---

## User journeys

### J001 — Malformed invite request is rejected cleanly

**Actor:** External caller (invalid payload)
**Goal:** System rejects bad input before reaching service logic

**Steps:**
1. `POST /platform/invites` with body `{ email: "not-an-email" }`
2. Zod schema rejects → `validateBody` throws `MedusaError(INVALID_DATA, "Invalid email")`
3. Medusa error handler returns `400 { message: "Invalid email" }`

**Acceptance:** No stack trace in response. Service layer never called.

---

### J002 — Invite endpoint rate limit blocks abuse

**Actor:** Automated script hitting `/platform/invites`
**Goal:** Limit is enforced after threshold

**Steps:**
1. Script sends 11 POST requests to `/platform/invites` within 15 minutes from same IP
2. 11th request receives `429 Too Many Requests`
3. Legitimate operator retrying after 15 minutes succeeds normally

**Acceptance:** 11th request within window → 429. Retry after window resets → 201.

---

### J003 — `pnpm audit --audit-level=high` passes in CI

**Actor:** CI pipeline (pre-merge check)
**Goal:** No high or critical CVEs in dependency tree

**Steps:**
1. PR opened for any M021 task
2. CI runs `pnpm audit --audit-level=high`
3. Returns exit code 0

**Acceptance:** CI green on audit step. Documented accepted risks in `infra/SECURITY.md`.

---

## Deliverables

| Area | Deliverable |
|------|-------------|
| `apps/backend` | `validateBody` helper + applied to all 20 platform routes |
| `apps/backend` | Rate limiting middleware on 4 endpoint groups |
| `apps/backend` | `tsx` bumped → esbuild high CVE resolved |
| `apps/backend` | `pnpm.overrides` for remaining patchable moderate CVEs |
| `packages/admin-ui` | `previewPlainText.ts` innerHTML replaced with safe alternative |
| `infra/SECURITY.md` | Document accepted-risk CVEs with rationale + versions |
| CI | `pnpm audit --audit-level=high` step added to pipeline |

---

## Success metrics

| Metric | Target |
|--------|--------|
| `pnpm audit --audit-level=high` | 0 results |
| Platform routes without Zod body validation | 0 |
| Rate limiting on invite/signup/billing/provision | ✓ |
| `gitleaks detect --source . --staged` | 0 secrets |
| `previewPlainText.ts` innerHTML | removed or sanitized |
| Existing tests | green |

---

## Open questions

| # | Question | Decision |
|---|----------|----------|
| OQ-01 | `express-rate-limit` compatible with Medusa's router? | Verify in T093 spike — if not, implement as Medusa middleware class |
| OQ-02 | `qs`/`ajv` in Medusa fork transitive chain — use `pnpm.overrides` or bump fork dep? | Prefer bumping fork dep first; fall back to overrides if version conflict |
| OQ-03 | `previewPlainText.ts` — HTML parsing intent or plain text? | Determine from call sites in T094 |
