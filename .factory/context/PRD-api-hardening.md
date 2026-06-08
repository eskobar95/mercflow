# PRD — MercFlow API Hardening

> Version 1.0 — 2026-06-08
> Scope: MercFlow-owned routes only — not Medusa core routes
> Prerequisite for T032: S009 (Hetzner infra) deployed; T030 (provisioning) ready to use
> Related: PRD-infra.md, ADR-005

---

## Problem

MercFlow's custom API routes have three latent issues that become active failures as the platform scales:

1. **Unbounded list endpoints** — `GET /admin/redirects`, `GET /admin/purchase-orders`, and similar list routes have no enforced `limit` cap. A growing dataset will cause memory spikes and slow responses without warning. This can affect Guapo today.

2. **Inconsistent error shapes** — Medusa returns `{ message, type, code }`. Some MercFlow route handlers return plain `MedusaError` objects; others may return raw shapes. Storefront clients that parse error responses need a single predictable format.

3. **Unversioned store routes** — `/store/seo/*`, `/store/feed/*`, `/store/sitemap*`, and all other MercFlow public store routes carry no version prefix. Once a second storefront connects and is built against these paths, any breaking change hits all tenants simultaneously with no gradual migration path.

---

## Goals

1. All MercFlow list endpoints enforce a max of 100 records per request — no unbounded queries.
2. All MercFlow route error responses follow Medusa's `{ message, type, code }` envelope.
3. All MercFlow store-facing routes (not admin) are accessible under a `/v1/` prefix before the first non-Guapo storefront connects.
4. Old unversioned store route paths redirect to `/v1/` equivalents with 301 during a transition window.

---

## Non-goals

- Versioning Medusa's own routes — out of scope and out of reach.
- Versioning admin routes — admin UI is MercFlow-controlled; storefront clients do not consume admin routes directly.
- Idempotency keys — deferred to the self-service onboarding PRD (Stripe billing, `POST /provision-tenant`).
- Response envelope for success payloads (Pattern 10) — Medusa handles this for core entities; MercFlow routes that return MercFlow-owned resources should follow Medusa's shape, but full audit is a post-M007 concern.

---

## Success metrics

- `rg "\.limit\b" packages/*/src/api` — every list handler has an explicit limit cap.
- `rg "MedusaError" packages/*/src/api` — every error path uses `MedusaError`.
- Manual smoke: `GET /v1/store/seo/json-ld/product/test-id` returns a response on the deployed backend.
- Manual smoke: `GET /store/seo/json-ld/product/test-id` redirects to `/v1/` equivalent with 301.

---

## Users

| User | How they are affected |
|---|---|
| Storefront developer (Guapo or tenant) | Consumes `/store/*` routes — needs stable versioned URLs |
| MercFlow operator | Monitors backend — needs bounded queries and consistent error logs |
| Agent | Implements and verifies — needs measurable acceptance criteria |

---

## User journeys

### J001 — Storefront connects to a versioned MercFlow API

**Problem:** Developer builds a Guapo or tenant storefront and hardcodes MercFlow store routes. A future breaking change silently breaks the integration.

**Goal:** Developer connects to `/v1/store/seo/*` and knows that path is a stable contract.

**Steps:**
1. Developer reads MercFlow store route docs (or `apps/backend` route files).
2. Developer sees all store routes under `/v1/store/`.
3. Developer points storefront at `/v1/store/seo/json-ld/product/:id`.
4. MercFlow team can later introduce `/v2/` for breaking changes without disrupting `/v1/` consumers.

---

### J002 — Operator investigates a slow list endpoint

**Problem:** `GET /admin/redirects` takes 8 seconds because the table has 40 000 rows and no limit is applied.

**Goal:** All list endpoints are bounded — no query fetches more than 100 rows without explicit pagination.

**Steps:**
1. Admin UI requests page 1 of redirects with default limit.
2. Route handler applies `limit = Math.min(query.limit ?? 50, 100)`.
3. Response returns 50 rows + `count` + `offset` for the next page.
4. Unbounded query is impossible regardless of UI behaviour.

---

## Deliverables

| ID | Description | Blocks |
|---|---|---|
| T031 | Pagination max enforcement + error shape audit on all MercFlow list routes | Nothing — runs parallel with S009 |
| T032 | `/v1/` prefix on all MercFlow store routes + 301 redirects from old paths | T030 (provisioning) — must be done before first non-Guapo tenant |

---

## Open questions

None — decisions resolved during `/align` 2026-06-08.

---

## Out of scope for this PRD

- Admin route versioning
- Idempotency (self-service onboarding PRD)
- Medusa core route changes
- Full response envelope audit (post-M007 concern)
