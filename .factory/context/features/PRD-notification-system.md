# PRD — Notification System (M012)

> Version 1.0 — 2026-06-11
> Decision basis: user brief (June 2026), CONTEXT.md notification system definition, ADR-007 (fork)
> Architecture decisions: per-tenant SES domain, React Email templates, variable-based admin customization

---

## Problem

MercFlow currently relies on Medusa's built-in notification infrastructure for transactional emails. This creates three critical issues:

1. **Not multi-tenant by design.** Medusa's notification providers are single-instance — they do not natively scope email delivery by tenant. Order confirmations can cross tenant boundaries or fail silently.

2. **No delivery guarantees.** Medusa fires-and-forgets events via its event bus. There is no retry logic, no dead-letter queue, and no visibility into whether an order confirmation was actually delivered.

3. **No per-tenant branding or sending domain.** All tenants share the same `from` address, destroying email deliverability and trust. Merchants cannot have `noreply@their-store.com` as the sender.

4. **Zero admin visibility.** There is no admin interface showing which emails were sent, to whom, and whether they succeeded.

---

## Goals

1. Every order confirmation, shipping update, and order cancellation is reliably delivered — with retries, dead-letter handling, and a delivery log.
2. Each tenant sends from **their own verified domain** (`noreply@merchant-domain.com`) via Amazon SES.
3. Merchants can customize per-tenant variables (logo, brand color, store name, reply-to) without touching template code.
4. Admins have visibility into recent email delivery history and can resend failed emails.
5. New event types (abandoned cart, refund confirmation, welcome) can be added by registering a new template — no new infrastructure work.

---

## Non-goals (explicit)

- **Marketing / campaign emails** — this is transactional only. No bulk sends, no subscriber lists, no unsubscribe management.
- **SMS notifications** — deferred to post-v1.
- **WYSIWYG template editor** — merchants customize variables, not template structure. Full editor is a future milestone.
- **Custom template upload by merchant** — MercFlow owns the template code. Merchants configure variables.
- **Inbound email handling** — send-only system.
- **Multi-provider fallback** (SES + Postmark) — SES only in v1.
- **Resend the SaaS** — MercFlow builds its own equivalent on SES, not using Resend.
- **Per-tenant sub-accounts in AWS** — single AWS account, one SES configuration set per tenant.

---

## Architecture decisions

### Amazon SES: per-tenant domain identity

Each tenant provides a sending domain (e.g. `guapo.dk`). MercFlow registers this domain as an SES identity in our AWS account and returns DKIM + SPF records for the tenant to add to their DNS. Once verified:
- Emails send from `noreply@guapo.dk` (or tenant-configured address)
- SES configuration set per tenant for delivery metrics
- Before verification: fallback to `noreply@mail.mercflow.shop` with visible warning in admin

### React Email templates (JSX → HTML)

Templates live in `packages/notification-module/src/templates/` as `.tsx` files. `@react-email/render` produces HTML at send time. Per-tenant variables are injected as props at render time. Template code is owned by MercFlow — merchants configure variables, not template structure.

### BullMQ queue for reliable delivery

Events from Medusa (`order.placed`, `order.shipment_created`, `order.canceled`) are picked up by Medusa event subscribers in `apps/backend`. The subscriber enqueues a BullMQ job (`mercflow:notifications` queue) instead of calling SES directly. A notification worker processes jobs with:
- 3 retry attempts (exponential backoff: 30s, 5m, 30m)
- Dead-letter queue for permanently failed jobs
- Job ID = `{tenantId}:{eventType}:{entityId}` for idempotency

---

## User journeys

### J001 — Merchant configures their sending domain (onboarding)

**Actor:** MercFlow team / merchant-admin
**Goal:** Set up `noreply@merchant-domain.com` as the sending address

**Steps:**
1. MercFlow team runs onboarding → provisioning script creates tenant and calls `POST /admin/notification-config` with `{ domain: "guapo.dk" }`
2. System registers `guapo.dk` as SES domain identity → returns DKIM records (3 CNAME entries + SPF TXT record)
3. Admin UI → Settings → Email → Domain shows the 4 DNS records with copy-to-clipboard
4. Merchant adds records to their DNS (Cloudflare, Route53, etc.)
5. System polls SES every 15 minutes → marks domain as `verified` when DNS propagates
6. Admin UI shows: ✓ Domain verified — "noreply@guapo.dk" is now your sending address

**Acceptance:**
- DNS records visible in admin immediately after setup
- Verification status updates without manual refresh (polling or webhook)
- Before verified: warning banner + fallback sending domain stated clearly

---

### J002 — Merchant customizes email branding

**Actor:** Merchant-admin
**Goal:** Get their logo, brand color, and store name in all transactional emails

**Steps:**
1. Admin → Settings → Email → Branding
2. Fill: Logo URL (hotlinked), Store display name, Brand color (hex picker), Reply-to email, Support email
3. Click "Preview" → live rendered HTML preview of order confirmation with their variables
4. Save → all future emails use these variables

**Acceptance:**
- Preview renders real HTML in a scrollable panel
- All 5 configurable variables present in preview
- Logo URL validated (must be HTTPS)
- Brand color applied to header, CTA button, footer accent

---

### J003 — Customer receives order confirmation automatically

**Actor:** Customer (triggered by Medusa `order.placed` event)
**Goal:** Customer gets a well-formatted order confirmation within 30 seconds of placing order

**Steps:**
1. Customer completes checkout
2. Medusa fires `order.placed` event
3. MercFlow event subscriber picks it up → enqueues BullMQ job `send-email:order-confirmation:{orderId}`
4. Worker processes job: resolves tenant config, renders React Email template with order data + tenant variables, calls SES `sendEmail`
5. Delivery logged to `email_deliveries` table: `{ tenant_id, order_id, to, template, status: 'sent', sent_at }`
6. Customer receives email from `noreply@guapo.dk` with logo, order summary, line items, shipping address, and support contact

**Acceptance:**
- Email arrives within 30 seconds of `order.placed` event (p95)
- Duplicate protection: same `{tenantId}:order-confirmation:{orderId}` job not re-processed
- If SES call fails: BullMQ retries (30s, 5m, 30m); after 3 failures → dead-letter queue

---

### J004 — Merchant sees email delivery history + resends

**Actor:** Merchant-admin
**Goal:** Verify order confirmations went out; resend one that failed

**Steps:**
1. Admin → Settings → Email → Delivery history
2. Table: recipient, template type, order ID (linked), status (Sent / Failed / Pending), sent_at, open/click rate (future)
3. Click row → detail: full log, error message if failed, "Resend" button
4. Click "Resend" → new job enqueued, new delivery record created

**Acceptance:**
- Delivery history shows last 500 emails, paginated
- Status reflects actual SES delivery event (via SNS → webhook), or API-level success/failure as fallback
- Resend creates new delivery record; does not overwrite original

---

### J005 — Shipping update email sent automatically

**Actor:** Customer (triggered by Medusa `order.shipment_created` event)
**Goal:** Customer knows their order has shipped with tracking info

**Steps:**
1. Admin marks order as fulfilled + enters tracking number in Shipmondo flow
2. Medusa fires `order.shipment_created` (or MercFlow connector fires equivalent)
3. BullMQ job enqueued → email sent with: carrier name, tracking number, tracking link, expected delivery window (if available)

**Acceptance:**
- Tracking link is included if tracking number is present
- Email sent only once per shipment (idempotency key: `{tenantId}:shipping-update:{shipmentId}`)

---

## v1 Template set

| Template key | Trigger | Critical |
|---|---|---|
| `order-confirmation` | `order.placed` | ✓ |
| `shipping-update` | `order.shipment_created` | ✓ |
| `order-cancellation` | `order.canceled` | ✓ |
| `customer-welcome` | `customer.created` | — |

> Rich text and HTML structure is MercFlow-owned. Merchants configure variables (logo, color, name).

---

## Deliverables

### `@mercflow/notification-module` (`packages/notification-module/`)

**DML models:**

```
EmailConfig
├── id
├── store_id            NOT NULL — one config per tenant
├── domain              text — e.g. "guapo.dk"
├── from_email          text — e.g. "noreply@guapo.dk"
├── from_name           text — e.g. "Guapo"
├── reply_to            text — e.g. "support@guapo.dk"
├── logo_url            text (HTTPS)
├── brand_color         text — hex e.g. "#1A1A1A"
├── support_email       text
├── ses_domain_status   enum: 'pending' | 'verified' | 'failed'
├── ses_identity_arn    text — SES identity ARN from AWS
└── fallback_from       text — used when ses_domain_status != 'verified'

EmailDelivery
├── id
├── store_id            NOT NULL — RLS policy
├── template_key        text — e.g. "order-confirmation"
├── to_email            text
├── entity_id           text — order_id, shipment_id, etc.
├── idempotency_key     text UNIQUE — {tenantId}:{template}:{entityId}
├── status              enum: 'queued' | 'sent' | 'failed' | 'dead_letter'
├── error_message       text (nullable)
├── sent_at             timestamp (nullable)
└── ses_message_id      text (nullable) — SES message ID for tracking
```

**Service methods:**
- `setupDomain(storeId, domain)` → registers SES domain identity, returns DNS records
- `checkDomainStatus(storeId)` → polls SES, updates `ses_domain_status`
- `updateEmailConfig(storeId, variables)` → logo, color, names
- `getEmailConfig(storeId)` → for worker template rendering
- `enqueueEmail({ storeId, templateKey, to, entityId, data })` → idempotent enqueue to BullMQ
- `listDeliveries({ storeId, limit, offset })` → delivery history
- `resendEmail(deliveryId, storeId)` → re-enqueues job

**Admin API routes:**
```
GET    /admin/notification-config              → EmailConfig for tenant
POST   /admin/notification-config/domain      → { domain } → DNS records
GET    /admin/notification-config/domain/status → { status, records }
PUT    /admin/notification-config/branding    → logo_url, brand_color, etc.
GET    /admin/notification-config/preview/:template → rendered HTML
GET    /admin/email-deliveries                → paginated delivery history
POST   /admin/email-deliveries/:id/resend     → re-enqueue
```

**RLS:**
```sql
CREATE POLICY email_config_tenant_isolation ON email_configs
  USING (store_id = current_setting('app.tenant_id', true));

CREATE POLICY email_delivery_tenant_isolation ON email_deliveries
  USING (store_id = current_setting('app.tenant_id', true));
```

### BullMQ notification worker (`apps/backend/src/workers/notification-worker.ts`)

- Queue name: `mercflow:notifications`
- Job name: `send-email`
- Processor: resolves `EmailConfig` → renders React Email template → calls AWS SES SDK `sendEmail`
- Concurrency: 5 (configurable via `NOTIFICATION_WORKER_CONCURRENCY` env)
- Retry: `{ attempts: 3, backoff: { type: 'exponential', delay: 30_000 } }`
- On exhausted: move to dead-letter queue `mercflow:notifications:dead`

### Medusa event subscribers (`apps/backend/src/subscribers/`)

```
order-placed.subscriber.ts      → order.placed      → enqueueEmail(order-confirmation)
order-shipped.subscriber.ts     → order.shipment_created → enqueueEmail(shipping-update)
order-canceled.subscriber.ts    → order.canceled    → enqueueEmail(order-cancellation)
customer-created.subscriber.ts  → customer.created  → enqueueEmail(customer-welcome)
```

Each subscriber: resolves `store_id` from entity → calls `notificationService.enqueueEmail(...)`.

### React Email templates (`packages/notification-module/src/templates/`)

```
order-confirmation.tsx
shipping-update.tsx
order-cancellation.tsx
customer-welcome.tsx
shared/
  layout.tsx       — header (logo, brand color), footer (support email, store name)
  line-item.tsx    — product image, name, variant, quantity, price
  address-block.tsx
```

Per-tenant variables passed as props: `{ logoUrl, brandColor, storeName, supportEmail, replyTo }`.

### Admin UI (`packages/admin-ui`)

**Settings → Email** (new settings section):
- **Domain tab**: domain input, DNS record table (CNAME × 3 + TXT), verification status badge, polling every 30s when pending
- **Branding tab**: logo URL input, store name, brand color picker, reply-to, support email, "Preview" button → modal with rendered HTML
- **Delivery history tab**: paginated table (recipient, template, entity link, status badge, timestamp, "Resend" button)

---

## Success metrics

| Metric | Target |
|--------|--------|
| Order confirmation delivery time | < 30s p95 from `order.placed` |
| Delivery success rate | > 99% (excluding invalid email addresses) |
| Zero cross-tenant email delivery | 100% (idempotency key + RLS) |
| Domain verification setup time | < 15 min (DNS propagation excluded) |
| Dead-letter jobs alerted within | 5 min (BetterStack alert on dead-letter queue size > 0) |

---

## Open questions

| # | Question | Decision |
|---|----------|----------|
| OQ-01 | SES bounce/complaint handling — SNS webhook to update `email_deliveries.status`? | Yes — register SES notification topic → MercFlow `POST /webhooks/ses` endpoint updates delivery status. Defer to v1.1 if delivery history is admin-only (no customer-facing bounce management). |
| OQ-02 | Domain fallback behavior before verification: send from shared domain or queue and hold? | **Send from shared** (`noreply@mail.mercflow.shop`) with clear admin warning. Do not hold — order confirmations cannot wait for DNS propagation. |
| OQ-03 | Where does the BullMQ worker run — same process as HTTP server or separate? | **Same process** in v1 (simpler ops). Extract to `apps/worker` if queue processing becomes a bottleneck. |
| OQ-04 | `mercflow.shop` SES domain — needs to be set up in AWS before any tenant can use fallback sending. | **Infrastructure prerequisite** (HITL): MercFlow team verifies `mail.mercflow.shop` in SES before M012 ships. **Done** 2026-06-11 (eu-north-1). |
