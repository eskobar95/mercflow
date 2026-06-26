# PRD — Platform Console (M014)

> Version 1.0 — 2026-06-11
> Based on: /align session June 2026, CONTEXT.md, ADR-009, ADR-010
> Architecture decision: separate React+Vite app, Google OAuth, cross-tenant visibility

---

## Problem

The MercFlow team has no internal tool to operate the platform. As the number of tenants grows, the following operations happen manually via DB queries, SSH, or cloud consoles:

1. **Tenant provisioning** is done via a CLI script with no UI feedback or history.
2. **Queue health is invisible.** If BullMQ DLQ fills up with failed order confirmations, nobody knows until a merchant complains.
3. **Cross-tenant email issues** cannot be diagnosed — delivery history is scoped per tenant in Store Admin.
4. **System health** (Hetzner CPU, Neon connections, Redis memory) requires SSH + cloud dashboards.
5. **No audit trail** of who provisioned what and when.

As MercFlow scales beyond Guapo, operating the platform without an internal tool becomes untenable.

---

## Goals

1. MercFlow team can provision a new tenant, view all tenants, and suspend/delete a tenant — from a UI, with audit trail.
2. All BullMQ queues are visible in real time: job counts, DLQ size, failed job details, manual retry.
3. Email delivery health visible across all tenants (aggregate bounce rate, DLQ size, SES domain status per tenant).
4. System health dashboard: Hetzner server metrics, Neon connection pool, Redis memory.
5. Access restricted to MercFlow team via Google OAuth (Google Workspace domain).

---

## Non-goals (explicit)

- **Merchant-facing** — Platform Console is never accessible to tenants.
- **Revenue analytics / billing** — MercFlow billing (Stripe subscriptions for merchants) is deferred.
- **WYSIWYG template editing** — notification templates are code-owned.
- **Automated incident response** — alerts go to BetterStack; Platform Console is for human investigation.
- **Mobile** — internal ops tool, desktop only.
- **Multi-region management** — single Hetzner region in v1.

---

## Architecture

**Separate React + Vite app** at `apps/platform-console/`. Deployed to `console.mercflow.shop` (not public — IP allowlist or VPN in production).

**Auth:** Google OAuth via `better-auth` or equivalent — only `@mercflow.shop` Google Workspace accounts can log in. JWT stored in httpOnly cookie.

**Backend access:** Platform Console has its own set of admin API routes prefixed `/platform/` — these routes bypass tenant RLS (run as `mercflow_owner` role or use `BYPASSRLS`). Separate from `/admin/` routes used by Store Admin.

**No `store_id` filter** on Platform Console API calls — they intentionally see all tenants' data.

---

## User journeys

### J001 — Operator provisions a new tenant

**Actor:** MercFlow team member
**Goal:** Onboard a new merchant in under 5 minutes

**Steps:**
1. Navigate to Platform Console → Tenants → "Provision new tenant"
2. Fill form: shop name, domain, admin email, currency, timezone
3. Click "Provision" → UI shows progress log (Store created → Sales Channel → API Key → Admin user → Email config initialised)
4. Completion: shows tenant summary with store_id, admin login URL, publishable API key
5. Entry added to audit log: provisioned by `nicklas@mercflow.shop` at timestamp

**Acceptance:** Provisioning calls existing `provision-tenant` script internally. Full progress visible. Copy-to-clipboard on credentials. Audit log entry created.

---

### J002 — Operator monitors BullMQ queue health

**Actor:** MercFlow team member
**Goal:** Check if any queues have backed up after a deploy

**Steps:**
1. Platform Console → Queues
2. Dashboard shows all 5 queues: notifications, subscriptions, feed-invalidation, sitemap, webhooks
3. Each queue: active jobs, waiting, completed (last 24h), failed, DLQ size
4. DLQ size > 0 → highlighted in red
5. Click "notifications" → job list; click failed job → error message + stack trace + retry button

**Acceptance:** Real-time data (polling every 10s). Manual retry enqueues job again. DLQ jobs show full error detail.

---

### J003 — Operator investigates failed order confirmation emails

**Actor:** MercFlow team member responding to merchant complaint
**Goal:** Find why a specific customer didn't receive order confirmation

**Steps:**
1. Platform Console → Email → search by email address or order ID
2. Row shows: tenant, recipient, template, status (Failed), error message, sent_at
3. Click → full detail: SES error code, retry attempts, store SES domain status
4. If SES domain not verified: link to tenant's domain setup in Store Admin

**Acceptance:** Cross-tenant search works. SES error codes shown with human-readable descriptions. Direct link to relevant Store Admin settings page.

---

### J004 — Operator views system health

**Actor:** MercFlow team member
**Goal:** Verify system is healthy after a code deployment

**Steps:**
1. Platform Console → System
2. Cards: Hetzner CPU % (last 1h), RAM usage, Neon active connections / max, Redis used memory / max, Traefik request rate (last 5m), error rate
3. All green → proceed; any red → investigate

**Acceptance:** Metrics refreshed every 30s. Data from Hetzner API + Neon API + Redis INFO command.

---

### J005 — Operator suspends a tenant

**Actor:** MercFlow team member
**Goal:** Temporarily block a misbehaving tenant without deleting their data

**Steps:**
1. Platform Console → Tenants → find tenant
2. Click "Suspend" → confirmation modal with reason field
3. Confirm → Medusa Store set to `is_disabled = true` (or equivalent) + Publishable API keys revoked
4. Suspended badge on tenant row; audit log entry created

**Acceptance:** Suspended tenant's storefront returns 503. Store Admin login still works (merchant can contact support). Reason stored in audit log.

---

## Deliverables

### `apps/platform-console/` — new React + Vite app

**Sections:**

| Section | Route | Content |
|---------|-------|---------|
| Tenants | `/tenants` | List all stores, provision form, suspend/delete actions |
| Queues | `/queues` | All BullMQ queues, job counts, DLQ, retry |
| Email | `/email` | Cross-tenant delivery history, SES domain status per tenant |
| System | `/system` | Hetzner + Neon + Redis metrics, uptime |
| Audit log | `/audit` | Timestamped operator actions |

**Auth:** `better-auth` with Google OAuth provider. `GOOGLE_ALLOWED_DOMAIN=mercflow.shop` env var restricts access.

**Styling:** Uses `@mercflow/design-tokens` — consistent visual language without importing Store Admin components.

### Backend — `/platform/` API routes (`apps/backend`)

New route prefix `/platform/` — separate from `/admin/`. Auth middleware verifies Platform Console JWT (separate secret from Medusa admin JWT).

```
GET  /platform/tenants
POST /platform/tenants/provision
PUT  /platform/tenants/:id/suspend
DELETE /platform/tenants/:id

GET  /platform/queues                 → all queue stats
GET  /platform/queues/:name/jobs      → job list with filters
POST /platform/queues/:name/jobs/:id/retry

GET  /platform/email/deliveries       → cross-tenant, searchable
GET  /platform/email/domains          → SES status per tenant

GET  /platform/system/metrics         → aggregated health data

GET  /platform/audit                  → audit log entries
```

**RLS bypass:** Platform routes use a separate DB connection that runs as `mercflow_owner` (BYPASSRLS). Never use `SET LOCAL app.tenant_id` on platform routes — they intentionally see everything.

### `platform_audit_log` table (new, in `apps/backend`)

```
platform_audit_log
├── id
├── operator_email    text (Google OAuth email)
├── action            text (provision_tenant, suspend_tenant, retry_job, etc.)
├── entity_type       text (tenant, queue_job, etc.)
├── entity_id         text
├── metadata          jsonb (snapshot of action params)
└── created_at        timestamp
```

No `store_id` — audit log is platform-level, not tenant-scoped.

---

## Success metrics

| Metric | Target |
|--------|--------|
| New tenant provisioned via UI | < 5 min |
| Queue DLQ status visible within | < 10s of page load |
| Cross-tenant email search returns results | < 500ms p95 |
| Platform Console accessible only to @mercflow.shop Google accounts | 100% |
| All operator actions logged | 100% |

---

## Open questions

| # | Question | Decision |
|---|----------|----------|
| OQ-01 | IP allowlist for console.mercflow.shop (Traefik middleware) or VPN? | **IP allowlist via Traefik** in v1 — add Hetzner VPS egress IP + team members' IPs. VPN is more robust for v2 when team grows. |
| OQ-02 | Hetzner metrics: pull from Hetzner Cloud API or node_exporter + Prometheus? | **Hetzner Cloud API** in v1 (simpler, no additional infra). Switch to Prometheus + Grafana if metrics need more granularity. |
| OQ-03 | Suspension model: `is_disabled` flag on Medusa Store entity, or revoke API keys only? | **Both**: set `is_disabled` on Store entity (fork) + revoke Publishable API Keys. Belt-and-suspenders. |
