# @mercflow/platform-console

Internal MercFlow operator tool (React + Vite). Cross-tenant visibility for provisioning, queue health, email delivery, system metrics, and audit history.

**Not for merchants.** Deployed at `console.mercflow.shop` in production with Traefik IP allowlist (see `infra/traefik/dynamic/platform-console.yml`).

## Responsibility

- Operator authentication via Clerk app `mercflow-platform` (separate from `mercflow-store-admin`)
- Application-level restriction to `@mercflow.shop` email addresses
- UI shell with sidebar sections: Tenants, Queues, Email, System, Audit
- Calls backend `/platform/*` routes (BYPASSRLS connection on the server)

## What does not belong here

- Store Admin merchant flows (`packages/admin-ui`)
- Tenant-scoped `/admin/*` APIs
- Direct database access from the browser

## Run locally

```bash
# From repo root
pnpm install

# Terminal 1 — backend (port 9000)
pnpm dev:backend

# Terminal 2 — platform console (port 5174)
pnpm --filter @mercflow/platform-console dev
```

Copy `.env.example` to `.env.local` and set:

| Variable | Source |
|----------|--------|
| `VITE_PLATFORM_CLERK_PUBLISHABLE_KEY` | Clerk → mercflow-platform → API Keys |
| `VITE_PLATFORM_BACKEND_URL` | `http://localhost:9000` (default) |

Backend (`apps/backend/.env`) also needs:

| Variable | Purpose |
|----------|---------|
| `PLATFORM_CLERK_SECRET_KEY` | Verify operator JWTs on `/platform/*` |
| `PLATFORM_DATABASE_URL` | `mercflow_owner` (BYPASSRLS) connection for platform queries |
| `PLATFORM_CORS` | `http://localhost:5174` in dev |

### Clerk JWT template (mercflow-platform)

Add `email` to the session token so the backend can enforce `@mercflow.shop`:

```json
{
  "email": "{{user.primary_email_address}}"
}
```

## Test

```bash
pnpm --filter @mercflow/platform-console test
pnpm --filter @mercflow/platform-console typecheck
```

## Production access

1. DNS: `console.mercflow.shop` → Hetzner VPS
2. Update `infra/traefik/dynamic/platform-console.yml` `sourceRange` with operator IPs
3. Deploy static console build behind the `platform-console` Traefik service (compose service TBD)
