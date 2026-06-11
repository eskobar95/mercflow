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
| `VITE_PLATFORM_BACKEND_URL` | `http://localhost:5174` (uses Vite proxy to backend — see below) |
| `VITE_PLATFORM_ALLOWED_EMAIL_DOMAIN` | `mercflow.shop` in production; see [Local dev overrides](#local-dev-overrides) |

Backend (`apps/backend/.env`) also needs:

| Variable | Purpose |
|----------|---------|
| `PLATFORM_CLERK_SECRET_KEY` | Verify operator JWTs on `/platform/*` (**mercflow-platform** app — not store-admin) |
| `PLATFORM_DATABASE_URL` | `mercflow_owner` (BYPASSRLS) in production; local Docker `mercflow` superuser is OK for dev |
| `PLATFORM_CORS` | `http://localhost:5174` in dev |
| `PLATFORM_ALLOWED_EMAIL_DOMAIN` | `mercflow.shop` in production; see [Local dev overrides](#local-dev-overrides) |

Use **`VITE_PLATFORM_BACKEND_URL=http://localhost:5174`** locally so `/platform/*` calls go through the Vite dev proxy (same origin, no CORS friction). The proxy forwards to `http://localhost:9000`.

### Clerk (mercflow-platform)

Use the **mercflow-platform** Clerk application only. Keys from **mercflow-store-admin** will not find users created in mercflow-platform.

**Configure → Sessions → Customize session token** (not “JWT templates”). Add:

```json
{
  "email": "{{user.primary_email_address}}"
}
```

Save, then sign out and sign in again so `/platform/health` receives the `email` claim.

### Local dev overrides

Production enforces `@mercflow.shop` operator emails. For local smoke tests with a personal Gmail (or other domain), temporarily set **both** files:

```bash
# apps/platform-console/.env.local
VITE_PLATFORM_ALLOWED_EMAIL_DOMAIN=gmail.com

# apps/backend/.env
PLATFORM_ALLOWED_EMAIL_DOMAIN=gmail.com
```

Restart backend and Vite after changing. **Never deploy or commit these values** — revert to `mercflow.shop` before opening a production PR.

Local Docker Postgres (`mercflow` user) has `BYPASSRLS` — sufficient for verifying the health endpoint; production must use a dedicated `mercflow_owner` (or equivalent) Neon role via `PLATFORM_DATABASE_URL`.

## Test

```bash
pnpm --filter @mercflow/platform-console test
pnpm --filter @mercflow/platform-console typecheck
```

## Production access

Deploy and harden **after** PR merge — scaffold is verified locally only until these steps are done.

### Before production checklist

Complete every item before exposing `console.mercflow.shop` or `/platform/*` on Hetzner:

| Step | Action | Where |
|------|--------|--------|
| 1 | Revert operator email domain to **`mercflow.shop`** (remove Gmail/local overrides) | `apps/platform-console/.env.local`, `apps/backend/.env`, `infra/.env` |
| 2 | Use **mercflow-platform** Clerk keys only (never store-admin keys) | Clerk Dashboard → mercflow-platform → API Keys; `PLATFORM_CLERK_*` + `VITE_PLATFORM_CLERK_*` |
| 3 | Session token includes **`email`** claim | Clerk → Configure → Sessions → Customize session token |
| 4 | Set **`PLATFORM_DATABASE_URL`** to Neon role with **BYPASSRLS** (`mercflow_owner`) | `infra/.env` on VPS — not the tenant-scoped `mercflow_app` connection |
| 5 | Set **`PLATFORM_CORS=https://console.mercflow.shop`** | `infra/.env` |
| 6 | Add operator workstation **/32 IPs** to Traefik allowlist | `infra/traefik/dynamic/platform-console.yml` → `platform-console-ipallowlist.sourceRange` |
| 7 | DNS **`console.mercflow.shop`** → Hetzner VPS | DNS provider |
| 8 | Deploy static console build + enable **`platform-console`** compose service | `infra/docker-compose.yml` (service TBD post-scaffold) |
| 9 | Verify login with real **`@mercflow.shop`** account and `/platform/health` shows BYPASSRLS | Browser + `curl` with Clerk JWT |

Traefik IP allowlist is **not enforced in local dev** (no Traefik). It applies only when `platform-console.yml` is deployed on Hetzner.

See also `infra/RUNBOOK.md` — **Platform Console access (T067)**.

### Infrastructure (summary)

1. DNS: `console.mercflow.shop` → Hetzner VPS
2. Update `infra/traefik/dynamic/platform-console.yml` `sourceRange` with operator IPs
3. Deploy static console build behind the `platform-console` Traefik service (compose service TBD)
