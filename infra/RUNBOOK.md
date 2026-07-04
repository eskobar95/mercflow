# MercFlow infrastructure runbook

Production stack: **Hetzner app VPS** + Docker Compose (`infra/docker-compose.yml`). Database: **self-hosted PostgreSQL 16 + pgvector** on a dedicated DB VPS (`infra/db/`). See [ADR-018](../.factory/context/ADR/ADR-018-self-hosted-postgresql.md).

## Prerequisites

- DNS A records → Hetzner app VPS IP:
  - `api.mercflow.shop`
  - `grafana.mercflow.shop`
  - `portainer.mercflow.shop`
- DB VPS on Hetzner private network; firewall allows **5432 only from app VPS private IP**
- `infra/.env` on app server and `infra/db/.env` on DB server (no real values in git)
- Hetzner Object Storage bucket for database backups

## First deploy

### DB server (once)

```bash
git clone https://github.com/eskobar95/mercflow.git /opt/mercflow-db
cd /opt/mercflow-db/infra/db
cp .env.example .env
# Edit passwords + S3 credentials

docker compose up -d
./setup-roles.sh
docker compose exec backup /backup.sh   # verify first backup reaches Object Storage
```

See `infra/db/README.md` for role details and Neon cutover steps.

### App server

```bash
git clone https://github.com/eskobar95/mercflow.git /opt/mercflow
cd /opt/mercflow
git checkout development

cp infra/.env.example infra/.env
# Edit infra/.env — DATABASE_URL (mercflow_app), PLATFORM_DATABASE_URL (mercflow_owner), secrets

touch infra/traefik/acme.json && chmod 600 infra/traefik/acme.json

docker compose -f infra/docker-compose.yml --env-file infra/.env build
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d
```

Migrations (operator machine with DB network access, **mercflow_migration** role):

```bash
# Export migration superuser connection from infra/db/.env.example, then:
pnpm migration:run
```

## Verify deploy

| Check | URL / command |
| --- | --- |
| Health | `curl -sf https://api.mercflow.shop/health` |
| Admin | `https://api.mercflow.shop/app` |
| RLS | `pnpm --filter @mercflow/backend exec -- tsx src/scripts/test-rls-medusa.ts` |
| Portainer | `https://portainer.mercflow.shop` |
| Grafana | `https://grafana.mercflow.shop` |
| DB backup | Object Storage — file `mercflow-backup-YYYY-MM-DD-*.sql.gz` |
| Containers (app) | `docker compose -f infra/docker-compose.yml ps` — all healthy |
| Containers (db) | `docker compose -f infra/db/docker-compose.yml ps` — postgres + backup healthy |

## Restart services

```bash
cd /opt/mercflow
docker compose -f infra/docker-compose.yml --env-file infra/.env restart medusa-backend medusa-worker
```

Full app stack restart:

```bash
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d
```

## Update after code merge

```bash
cd /opt/mercflow
git pull origin development
docker compose -f infra/docker-compose.yml --env-file infra/.env build medusa-backend medusa-worker
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d medusa-backend medusa-worker
```

Run migrations when schema changes:

```bash
# Export migration superuser connection from infra/db/.env.example, then:
pnpm migration:run
```

## SSL / ACME

- Certificates stored in `infra/traefik/acme.json` (gitignored, `chmod 600`).
- Routing uses Traefik **file provider** (`infra/traefik/dynamic/routes.yml`) — not Docker labels — for compatibility with Docker Engine 29+.
- When `DOMAIN` changes, update hostnames in `routes.yml` and restart Traefik.
- If cert fails: confirm DNS points to VPS, port 80 reachable, check `docker compose logs traefik`.
- Renewal is automatic via Traefik.

## BetterStack logs (T028)

**Production (recommended):** Better Stack **Vector** on the app VPS — ships all Docker container logs + metrics.

```bash
SOURCE_TOKEN=$(grep ^BETTERSTACK_SOURCE_TOKEN= /opt/mercflow/infra/.env | cut -d= -f2-)
curl -sSL "https://telemetry.betterstack.com/setup-vector/docker/${SOURCE_TOKEN}" -o /tmp/setup-vector.sh
yes | bash /tmp/setup-vector.sh
usermod -aG docker vector && systemctl restart vector
```

Verify: Better Stack → **Live tail** — filter by host `mercflow` or container name `medusa-backend`.

**Alternative (Medusa only):** `infra/observability/docker-logging.override.yml` — syslog driver. Do not combine with Vector (duplicate logs).

Set `BETTERSTACK_SOURCE_TOKEN` in `infra/.env`.

## BetterStack uptime

Create a monitor in Better Stack → **Uptime** → **Create monitor**:

- URL: `https://api.mercflow.shop/health`
- Interval: 60s

Optional **backup heartbeat**: alert if no new Object Storage file within 26 hours after 02:00 UTC.

## Observability (T028)

Sentry initializes via `apps/backend/src/instrumentation.ts` when `SENTRY_DSN` is set.
`sentryStoreIdMiddleware` tags errors with `store_id`.

### Notification DLQ monitoring (T058)

The BullMQ notification worker retries failed `send-email` jobs three times (30s exponential backoff), then moves exhausted jobs to the dead-letter queue `mercflow:notifications:dead` and sets `email_deliveries.status = dead_letter`.

**Better Stack:** add an uptime or custom metric alert when the DLQ queue depth is greater than zero (Redis key prefix `bull:mercflow:notifications:dead`).

**Local check:**

```bash
redis-cli -u "$REDIS_URL" LLEN bull:mercflow:notifications:dead:wait
```

## Backup & restore

Two layers cover database and VPS infrastructure.

### What each layer protects

| Layer | Protects | Does not protect |
| --- | --- | --- |
| **pg_dump → Object Storage** (daily 02:00 UTC) | PostgreSQL data — products, orders, content, modules | Misconfigured firewall, leaked secrets |
| **Hetzner Server Backup** (app + DB VPS) | Whole VPS disk — Compose, `.env`, Traefik certs, Postgres volume | Logical corruption already in DB (combine with pg_dump) |

### Enable (one-time)

**Object Storage — database SQL dumps**

1. Hetzner Cloud → Object Storage → create bucket (e.g. `mercflow-backups`)
2. Create access key; add to `infra/db/.env` (`HETZNER_S3_*`)
3. Deploy DB stack; run manual backup: `docker compose exec backup /backup.sh`
4. Confirm file in bucket; configure BetterStack alert on missed upload

**Hetzner Server Backup — VPS disks**

1. Enable on **app VPS** and **DB VPS** (~20% of server price each)

### Restore — database (Object Storage)

Use when data was corrupted or deleted.

1. Identify backup date: `mercflow-backup-YYYY-MM-DD-HHMMSS.sql.gz` in Object Storage
2. On operator machine (requires `rclone`, `psql`, S3 credentials):

```bash
# Migration superuser connection — see infra/db/.env.example
export HETZNER_S3_ACCESS_KEY=...
export HETZNER_S3_SECRET_KEY=...
export HETZNER_S3_BUCKET=mercflow-backups
export HETZNER_S3_ENDPOINT=https://nbg1.your-objectstorage.com

./scripts/restore-backup.sh 2026-07-04
```

3. Restart Medusa on app VPS
4. Verify: `curl -sf https://api.mercflow.shop/health` and RLS test script

### Restore — VPS (Hetzner)

Use when the server is broken or compromised. **Restore database from Object Storage after VPS restore** if the Postgres volume is stale or missing.

1. Hetzner → server → **Backups** → select snapshot → **Restore**
2. Confirm DNS still points to app VPS IP
3. SSH in, verify containers on both VPS
4. If DB data missing: run `restore-backup.sh` from latest Object Storage dump

## Neon cutover (one-time migration)

See `infra/db/README.md` § Neon cutover. Summary:

1. Rehearse dump/restore on staging DB
2. Maintenance window: stop Medusa traffic
3. Final `pg_dump` from Neon → restore on Hetzner DB
4. Update `DATABASE_URL` / `PLATFORM_DATABASE_URL` on app VPS
5. Run migrations + RLS verification
6. Re-enable traffic; keep Neon read-only 7 days; decommission

## Tenant provisioning (T030)

Provision a new MercFlow tenant (Medusa store, sales channel, publishable API key, admin user, Traefik route).

### Prerequisites

- Secret **admin API token** for an existing super-admin (`MEDUSA_ADMIN_API_TOKEN`)
- **`DATABASE_URL`** with **mercflow_migration** role on operator machine (store creation uses `medusa exec`)
- DNS for the tenant domain will point to the Hetzner app VPS **after** provisioning

### Command

From repo root:

```bash
export MEDUSA_BACKEND_URL=https://api.mercflow.shop
export MEDUSA_ADMIN_API_TOKEN=...paste from Medusa admin settings...
# Migration DB connection — see infra/db/.env.example

pnpm provision-tenant \
  --name "Salon Maria" \
  --domain shop.salon-maria.dk \
  --email maria@salon-maria.dk \
  --currency dkk
```

### After provisioning

1. Create DNS **A record** for the tenant domain → app VPS IP
2. Deploy Traefik config to the VPS (`git pull` in `/opt/mercflow`)
3. Wait for Let's Encrypt (first request to `https://<tenant-domain>/health`)
4. Confirm tenant admin login at `https://api.mercflow.shop/app`

## Platform Console access (T067)

Production routes live in `infra/traefik/dynamic/platform-console.yml`:

- `console.mercflow.shop` — static Platform Console UI (IP allowlist enforced)
- `api.mercflow.shop/platform/*` — operator API (same allowlist)

Before first deploy:

1. Add operator workstation `/32` CIDRs to `platform-console-ipallowlist.sourceRange`.
2. Set `PLATFORM_CLERK_SECRET_KEY`, `PLATFORM_DATABASE_URL` (`mercflow_owner`), and `PLATFORM_CORS` in `infra/.env`.
3. Containerise `apps/platform-console` and register the `platform-console` compose service (scaffold documents Traefik only).

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Medusa crash loop | `docker compose logs medusa-backend` — check `DATABASE_URL`, DB firewall, Redis |
| `EADDRINUSE` locally | `lsof -i :9000` and kill stale process |
| Worker not processing | Confirm `medusa-worker` healthy; check `REDIS_URL` and `MEDUSA_WORKER_MODE=worker` |
| DB connection timeout | Verify app VPS private IP in DB firewall; ping DB private IP from app VPS |
| RLS leak / cross-tenant data | Confirm backend uses `mercflow_app` (not migration/owner role) |
| Backup missing | `docker compose -f infra/db/docker-compose.yml logs backup`; check S3 credentials |
| Notification DLQ growing | Inspect worker logs; fix SES/template errors |

## Security

- Never commit `infra/.env`, `infra/db/.env`, or `infra/traefik/acme.json`.
- Rotate `JWT_SECRET`, `COOKIE_SECRET`, and DB passwords if exposed.
- Restrict Portainer/Grafana access to trusted operators.
- PostgreSQL must not be reachable from the public internet.
