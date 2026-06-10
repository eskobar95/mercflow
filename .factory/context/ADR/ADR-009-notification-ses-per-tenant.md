# ADR-009 — Notification System: Amazon SES with Per-Tenant Domain Identities

**Date:** 2026-06-11
**Status:** accepted
**Deciders:** Nicklas Eskou, MercFlow tech lead
**PRD:** PRD-notification-system.md (M012)

---

## Context

MercFlow needs a reliable, multi-tenant transactional email system. The primary requirements are:

1. Per-tenant sending domains (`noreply@merchant.com`, not `noreply@shared-platform.com`)
2. Guaranteed delivery with retry logic — not fire-and-forget
3. Template rendering with per-tenant branding variables
4. Admin visibility into delivery history

Four architectural choices were evaluated:

| Area | Options considered |
|------|-------------------|
| Email provider | Amazon SES, Resend (SaaS), Postmark, self-hosted Postal |
| Domain model | Shared platform domain, per-tenant domain from day one, shared-then-BYOD hybrid |
| Queue | BullMQ (Redis), pg-boss (Postgres), Medusa event bus (fire-and-forget) |
| Template engine | React Email, MJML, Handlebars |

---

## Decision

### Email provider: Amazon SES

MercFlow builds its own transactional email layer on top of **Amazon SES** — an internal equivalent of Resend. Rationale:

- Full ownership: no SaaS dependency on a critical production path
- Cost: SES is ~$0.10/1000 emails vs Resend's $20+/month at scale
- Per-tenant domain management is supported natively via SES domain identities
- Already in the AWS ecosystem (no new vendor relationship)

### Domain model: per-tenant SES domain identity from day one

Each tenant provides a sending domain. MercFlow registers it as an SES domain identity in our AWS account and provides DKIM/SPF records. The tenant adds these to their DNS.

**Rejected alternatives:**
- **Shared platform domain forever:** destroys deliverability reputation (one bad actor penalizes all) and brand trust (merchants can't send from their own domain)
- **Shared-then-BYOD hybrid:** defers the harder infrastructure work; per-tenant is the correct model and not significantly more complex to implement

**Fallback (before verification):** Emails sent from `noreply@mail.mercflow.com` until tenant domain is verified. Admin shows clear warning. Emails are never held — order confirmations cannot wait for DNS propagation.

### Queue: BullMQ (existing Redis)

BullMQ is already in the MercFlow stack via Redis. Using it for notification jobs gives:
- Reliable delivery with configurable retry (3 attempts, exponential backoff)
- Dead-letter queue for permanently failed jobs
- Idempotency via job ID (`{tenantId}:{templateKey}:{entityId}`)
- Admin-observable queue (BullBoard or BetterStack alerts on DLQ size)

**Rejected:** Medusa's built-in event bus — fire-and-forget, no retry, not observable.

### Template engine: React Email (JSX → HTML)

Templates as `.tsx` files rendered via `@react-email/render`. Rationale:

- Same toolchain as `packages/admin-ui` (TypeScript, React, JSX)
- Component-based: shared `Layout`, `LineItem`, `AddressBlock` components
- Preview in browser via `@react-email/preview` — no additional tooling
- Type-safe props enforce per-tenant variable injection

**Rejected:** MJML (XML syntax, separate toolchain), Handlebars (no type safety, invites scope creep into merchant-editable templates).

---

## Implementation model

```
Medusa event (order.placed)
  └─ MercFlow subscriber (apps/backend/src/subscribers/)
       └─ notificationService.enqueueEmail({ storeId, templateKey, entityId, data })
            └─ BullMQ job → mercflow:notifications queue
                 └─ Notification worker
                      ├─ resolves EmailConfig (logo, color, from address)
                      ├─ renders React Email template → HTML
                      ├─ calls AWS SES SDK sendEmail
                      └─ writes EmailDelivery log (status, ses_message_id)
```

**SES domain identity per tenant:**
```
1. provision-tenant script: calls SES CreateEmailIdentity(domain)
2. SES returns DkimAttributes (3 CNAME records + SPF TXT)
3. Records stored in EmailConfig + shown in admin UI
4. SES verifies domain when DNS records propagate (SES polls DNS)
5. EmailConfig.ses_domain_status updated to 'verified'
```

---

## Scope and enforcement

**New module:** `packages/notification-module/` — owns `EmailConfig`, `EmailDelivery` models, SES wrapper, template registry, BullMQ enqueue helper.

**No cross-module email sending:** Other modules (`connector-module`, `inventory-module`) must NOT call SES directly. All email goes through `notificationService.enqueueEmail()`.

**Enforcement (CI):** Add `no-direct-ses` lint rule or comment in `TECHSPEC.md`. Reviewer checklist item: `rg "ses.sendEmail\|SESClient" packages/ --ignore notification-module` must return 0.

**RLS:** Both `email_configs` and `email_deliveries` tables must have `store_id NOT NULL` + RLS policy (`store_id = current_setting('app.tenant_id', true)`).

---

## Consequences

**Gains:**
- Reliable order confirmation delivery for all tenants
- Per-tenant sending domain from day one — correct brand presentation
- Full delivery visibility in admin
- No SaaS cost at email volume

**Accepted tradeoffs:**
- AWS SES domain verification requires DNS access from each tenant (1–48h propagation)
- MercFlow must maintain `mail.mercflow.com` as a verified fallback sending domain (one-time HITL setup)
- Template updates require a MercFlow code deploy — merchants cannot self-serve template changes in v1
- SES bounce/complaint webhook (SNS) is deferred to v1.1 — delivery status updates are API-level only in v1

---

## How to fix if violated

- **Module calling SES directly (not via notification-module):** Move email sending into `notificationService.enqueueEmail()` and delete the direct SES call.
- **Missing `store_id` on new email table:** Add column + index + RLS policy in a new migration. Verify with `rg "store_id" packages/notification-module/src/models/`.
- **Template with hardcoded tenant data:** Extract to per-tenant props; inject via `getEmailConfig(storeId)` at render time.
