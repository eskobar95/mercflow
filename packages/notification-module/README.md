# @mercflow/notification-module

MercFlow Medusa v2 module for transactional email configuration, delivery logging, and BullMQ enqueue (M012 foundation — T056).

## Responsibility

- Per-tenant email configuration (`email_configs`) — domain, branding, SES identity metadata
- Delivery audit log (`email_deliveries`) with idempotency keys and status
- `NotificationService` — config CRUD, `enqueueEmail()` to BullMQ queue `mercflow:notifications`, delivery listing, resend
- Admin API for config, branding updates, delivery history, and resend
- SES client **stub interface only** (real AWS integration in T057/T058)

Does **not** belong here: React Email templates (T058), Medusa event subscribers (T062), admin UI (T063), real SES domain setup (T057).

## Field definitions — `email_configs`

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | Medusa `model.id()` |
| `store_id` | text NOT NULL | Tenant discriminator; RLS; unique per store |
| `domain` | text nullable | Merchant sending domain (T057) |
| `from_email` | text nullable | Verified from address |
| `from_name` | text nullable | Display name |
| `reply_to` | text nullable | Reply-to header |
| `logo_url` | text nullable | Branding logo URL |
| `brand_color` | text nullable | Hex color for templates |
| `support_email` | text nullable | Support contact |
| `ses_domain_status` | enum NOT NULL default `pending` | `pending` \| `verified` \| `failed` |
| `ses_identity_arn` | text nullable | SES identity ARN (T057) |
| `fallback_from` | text nullable | Default `noreply@mail.mercflow.com` on create |
| `deleted_at` | timestamptz nullable | Soft delete |

Unique: `(store_id)` where `deleted_at IS NULL`.

## Field definitions — `email_deliveries`

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | Medusa `model.id()` |
| `store_id` | text NOT NULL | Tenant discriminator; RLS |
| `template_key` | text NOT NULL | e.g. `order-confirmation` |
| `to_email` | text NOT NULL | Recipient |
| `entity_id` | text NOT NULL | Related entity (order id, etc.) |
| `idempotency_key` | text NOT NULL UNIQUE | `{storeId}:{templateKey}:{entityId}` |
| `status` | enum NOT NULL default `queued` | `queued` \| `sent` \| `failed` \| `dead_letter` |
| `error_message` | text nullable | Last error |
| `sent_at` | timestamptz nullable | Send timestamp |
| `ses_message_id` | text nullable | SES message id after send |
| `deleted_at` | timestamptz nullable | Soft delete |

## Tenancy

RLS policies `email_configs_tenant_isolation` and `email_deliveries_tenant_isolation`:

```sql
store_id = current_setting('app.tenant_id', true)
```

Module services call `withTenant(storeId, fn)` which sets `app.tenant_id` per transaction (`tenant-scope.ts`).

## BullMQ

| Setting | Value |
|---------|-------|
| Queue | `mercflow:notifications` |
| Job name | `send-email` |
| Job ID | `{storeId}:{templateKey}:{entityId}` |
| Redis | `REDIS_URL` from backend env |

`enqueueEmail()` writes an `email_deliveries` row with `status: queued` before enqueueing. Duplicate job IDs are no-ops (idempotency).

Worker processing, retries, DLQ, and template rendering are implemented in T058.

## SES client (stub)

```typescript
interface ISESClient {
  sendEmail(params: SendEmailParams): Promise<{ messageId: string }>
}
```

`StubSESClient` returns a fake `messageId`. Real `@aws-sdk/client-ses` integration is T057/T058.

## Service methods

- `getEmailConfig(storeId)` — retrieve or create default config
- `updateEmailConfig(storeId, brandingInput)` — update branding fields
- `enqueueEmail({ storeId, templateKey, to, entityId, data })` — idempotent BullMQ enqueue + delivery row
- `listDeliveries(storeId, { limit?, offset? })`
- `resendEmail(deliveryId, storeId)` — new delivery row + enqueue with resend idempotency key

## Admin API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/notification-config` | Get or create email config (`?store_id=`) |
| PUT | `/admin/notification-config/branding` | Update logo, color, from_name, reply_to, support_email |
| GET | `/admin/email-deliveries` | List deliveries (`?limit&offset&store_id=`) |
| POST | `/admin/email-deliveries/:id/resend` | Resend a delivery (202 Accepted) |

PUT branding body (Zod-validated):

```json
{
  "logo_url": "https://cdn.example/logo.png",
  "brand_color": "#1A2B3C",
  "from_name": "Guapo Store",
  "reply_to": "hello@example.com",
  "support_email": "support@example.com"
}
```

## Migration workflow

From repo root (with `DATABASE_URL` set):

```bash
pnpm --filter @mercflow/notification-module db:migrate
pnpm migration:run
```

Rollback this module only:

```bash
pnpm --filter @mercflow/notification-module db:rollback
```

Each migration file includes a decision log comment at the top.

## Tests

```bash
pnpm --filter @mercflow/notification-module test
```

- `test/enqueue-email-idempotency.test.ts` — duplicate BullMQ job is no-op
- `test/email-migrations.test.ts` — migration source assertions
- `test/tenancy-rls-db.integration.test.ts` — RLS + cross-tenant isolation (requires `DATABASE_URL`)

## Registration

`apps/backend/medusa-config.ts`:

```typescript
{
  resolve: "@mercflow/notification-module",
}
```

Backend admin routes re-export from `@mercflow/notification-module/mercflow-admin-*-api` subpaths.
