# MercFlow infrastructure runbook

Production stack: Hetzner VPS + Docker Compose (`infra/docker-compose.yml`). Database: Neon Frankfurt (`withered-salad-42833300`).

## Prerequisites

- DNS A records → Hetzner IP `46.225.226.143`:
  - `api.mercflow.shop`
  - `grafana.mercflow.shop`
  - `portainer.mercflow.shop`
- Neon project **allowed IPs** includes Hetzner egress IP (and your dev IP for local migrations).
- `infra/.env` on the server with all vars from `infra/.env.example` (no real values in git).

## First deploy

```bash
# On the VPS (as root or deploy user with docker access)
git clone https://github.com/eskobar95/mercflow.git /opt/mercflow
cd /opt/mercflow
git checkout development   # or the release branch after T027 merges

cp infra/.env.example infra/.env
# Edit infra/.env — set NEON_DATABASE_URL, secrets, GRAFANA_ADMIN_PASSWORD, SENTRY_DSN

touch infra/traefik/acme.json && chmod 600 infra/traefik/acme.json

docker compose -f infra/docker-compose.yml --env-file infra/.env build
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d
```

Migrations run against Neon from your machine or once on the server:

```bash
# From laptop (Neon allowlist must include your IP)
pnpm migration:run
```

## Verify deploy

| Check | URL / command |
| --- | --- |
| Health | `curl -sf https://api.mercflow.shop/health` |
| Admin | `https://api.mercflow.shop/app` |
| Portainer | `https://portainer.mercflow.shop` |
| Grafana | `https://grafana.mercflow.shop` (login `admin` + `GRAFANA_ADMIN_PASSWORD`) |
| Containers | `docker compose -f infra/docker-compose.yml ps` — all healthy |

Grafana → **MercFlow** folder → **MercFlow overview** dashboard should show CPU/RAM within ~2 minutes.

## Restart services

```bash
cd /opt/mercflow
docker compose -f infra/docker-compose.yml --env-file infra/.env restart medusa-backend medusa-worker
```

Full stack restart:

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

## SSL / ACME

- Certificates stored in `infra/traefik/acme.json` (gitignored, `chmod 600`).
- Routing uses Traefik **file provider** (`infra/traefik/dynamic/routes.yml`) — not Docker labels — for compatibility with Docker Engine 29+.
- When `DOMAIN` changes, update hostnames in `routes.yml` and restart Traefik.
- If cert fails: confirm DNS points to VPS, port 80 reachable, check `docker compose logs traefik`.
- Renewal is automatic via Traefik.

## BetterStack logs (T028)

**Production (recommended):** Better Stack **Vector** on the VPS — ships all Docker container logs + metrics.

```bash
# One-time on the VPS (requires BETTERSTACK_SOURCE_TOKEN in infra/.env)
SOURCE_TOKEN=$(grep ^BETTERSTACK_SOURCE_TOKEN= /opt/mercflow/infra/.env | cut -d= -f2-)
curl -sSL "https://telemetry.betterstack.com/setup-vector/docker/${SOURCE_TOKEN}" -o /tmp/setup-vector.sh
yes | bash /tmp/setup-vector.sh
usermod -aG docker vector && systemctl restart vector
```

Verify: Better Stack → **Live tail** — filter by host `mercflow` or container name `medusa-backend`.

**Alternative (Medusa only):** `infra/observability/docker-logging.override.yml` — syslog driver with source token in RFC5424 tag. Do not combine with Vector (duplicate logs).

Set `BETTERSTACK_SOURCE_TOKEN` in `infra/.env`.

## BetterStack uptime

Create a monitor in Better Stack → **Uptime** → **Create monitor**:

- URL: `https://api.mercflow.shop/health`
- Interval: 60s

Or use API with `BETTERSTACK_UPTIME_API_TOKEN` (see `infra/observability/uptime-checks.example.json`).

## Observability (T028)

Sentry initializes via `apps/backend/src/instrumentation.ts` when `SENTRY_DSN` is set.
`sentryStoreIdMiddleware` tags errors with `store_id`.

## Backup & restore

MercFlow production does **not** use Hetzner Object Storage or a pg_dump cron (T029 cancelled).
Two managed layers cover database and VPS separately.

### What each layer protects

| Layer | Protects | Does not protect |
| --- | --- | --- |
| **Neon** (snapshots + PITR) | PostgreSQL data — products, orders, content, modules | VPS files, Docker, Traefik certs |
| **Hetzner Server Backup** | Whole VPS disk — Compose, `infra/.env`, `acme.json`, Portainer/Grafana data | Neon database (external) |

### Enable (one-time)

**Neon — database**

1. [Neon console](https://console.neon.tech/app/projects/withered-salad-42833300) → branch `production` → **Backup & Restore**
2. **Edit schedule** → daily snapshot (retention per your Neon plan)
3. PITR window (e.g. 6 hours on Scale) is already available under **Restore from history**

**Hetzner — VPS**

1. [Hetzner Cloud](https://console.hetzner.cloud/) → server `mercflow` (Nuremberg, `46.225.226.143`)
2. **Backups** → **Enable** (~20% of server price; automatic disk snapshots)

### Restore — database (Neon)

Use when data was corrupted or deleted; VPS is fine.

1. Neon → `production` → **Backup & Restore**
2. **Restore from history** — pick timestamp within PITR window → **Preview data** → **Restore**
3. Or **Restore from a snapshot** — pick a daily snapshot → restore to same branch or a new branch for testing
4. If you restored to a **new branch**, update `NEON_DATABASE_URL` in server `infra/.env` and restart Medusa:

```bash
cd /opt/mercflow
docker compose -f infra/docker-compose.yml --env-file infra/.env restart medusa-backend medusa-worker
```

5. Verify: `curl -sf https://api.mercflow.shop/health` and spot-check admin data.

### Restore — VPS (Hetzner)

Use when the server is broken, compromised, or needs full rollback; database is in Neon and survives VPS loss.

1. Hetzner → `mercflow` → **Backups** → select snapshot → **Restore**
2. Confirm DNS still points to `46.225.226.143` (IP unchanged after restore)
3. SSH in, verify containers: `docker compose -f /opt/mercflow/infra/docker-compose.yml ps`
4. Verify health and admin login; Neon connection requires allowlist still includes VPS IP

## Tenant provisioning (T030)

Provision a new MercFlow tenant (Medusa store, sales channel, publishable API key, admin user, Traefik route).

### Prerequisites

- Secret **admin API token** for an existing super-admin (`MEDUSA_ADMIN_API_TOKEN`)
- **Neon `DATABASE_URL`** on the operator machine (store creation uses `medusa exec` — Medusa v2.14 has no `POST /admin/stores`)
- DNS for the tenant domain will point to the Hetzner VPS **after** provisioning

### Command

From repo root (copy vars into your shell or `apps/backend/.env`):

```bash
export MEDUSA_BACKEND_URL=https://api.mercflow.shop
export MEDUSA_ADMIN_API_TOKEN=...paste from Medusa admin settings...
export DATABASE_URL=<neon-pooler-url>

pnpm provision-tenant \
  --name "Salon Maria" \
  --domain shop.salon-maria.dk \
  --email maria@salon-maria.dk \
  --currency dkk
```

Output includes **store ID**, **publishable API key**, **admin password** (stdout only — not written to disk), and the Traefik file path under `infra/traefik/dynamic/tenants/`.

**URL model:** All tenants use the **shared platform admin** at `https://api.mercflow.shop/app` (`MEDUSA_BACKEND_URL` + `/app`). The tenant domain is for **storefront**, **store API**, and **public MercFlow routes** (`/health`, feeds, sitemap). Traefik redirects `/app` and `/admin` on tenant hosts to the platform admin.

### After provisioning

1. Create DNS **A record** for the tenant domain → `46.225.226.143`
2. Deploy Traefik config to the VPS (`git pull` in `/opt/mercflow` or rsync `infra/traefik/dynamic/tenants/`)
3. Wait for Let's Encrypt (first request to `https://<tenant-domain>/health`)
4. Confirm tenant admin login at `https://api.mercflow.shop/app` (not on the tenant domain)
5. Copy credentials to the customer through a secure channel

### Idempotency

Re-running with the same `--domain` fails if a Traefik route file already contains `Host(\`<domain>\`)`.

### Re-open T029 (Object Storage pg_dump) only if

- You need vendor-independent SQL dumps outside Neon, or
- Compliance requires off-platform backup files you control directly.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Medusa crash loop | `docker compose logs medusa-backend` — check `NEON_DATABASE_URL`, Neon allowlist, Redis |
| `EADDRINUSE` locally | `lsof -i :9000` and kill stale process |
| Worker not processing | Confirm `medusa-worker` healthy; check `REDIS_URL` and `MEDUSA_WORKER_MODE=worker` |
| Grafana empty | Wait 2 min; check Prometheus targets at `http://prometheus:9090/targets` from Grafana network |
| Neon connection timeout | Update [Neon allowlist](https://console.neon.tech/app/projects/withered-salad-42833300) with current VPS IP |

## Security

- Never commit `infra/.env` or `infra/traefik/acme.json`.
- Rotate `JWT_SECRET`, `COOKIE_SECRET`, and admin passwords if exposed.
- Restrict Portainer/Grafana access to trusted operators.
