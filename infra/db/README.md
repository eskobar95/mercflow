# MercFlow database server (production)

Dedicated Hetzner VPS running PostgreSQL 16 with the **pgvector** extension. Tenant isolation uses PostgreSQL RLS via the `mercflow_app` role (`NOBYPASSRLS`). Platform Console uses `mercflow_owner` (`BYPASSRLS`).

See [ADR-018](../../.factory/context/ADR/ADR-018-self-hosted-postgresql.md) for the full decision record.

## What belongs here

- PostgreSQL 16 + pgvector on a **separate** VPS from the Medusa app stack
- Role setup (`mercflow_migration`, `mercflow_app`, `mercflow_owner`)
- Daily `pg_dump` backup to Hetzner Object Storage

## What does not belong here

- Medusa backend, Redis, Traefik — those live on the app VPS (`infra/docker-compose.yml`)
- Application migrations — run from the monorepo root with `pnpm migration:run`
- Kubernetes / k3s

## Server sizing (starting point)

| Resource | Recommendation |
|---|---|
| Server | Hetzner CX22 or CPX22 |
| Volume | 20–40 GB (Postgres data) |
| Network | Hetzner private network between app VPS and DB VPS |

Enable **Hetzner Server Backup** on the DB VPS for disk-level recovery in addition to Object Storage SQL dumps.

## First-time setup

### 1. Provision VPS + private network

1. Create a DB VPS in the same Hetzner project/region as the app server.
2. Attach a volume mounted at `/mnt/postgres` (optional — Compose named volume is sufficient for MVP).
3. Join both VPS to a Hetzner private network.
4. Firewall on DB VPS: **TCP 5432 from app VPS private IP only**. SSH from operator IPs only.

### 2. Deploy Postgres + backup

```bash
git clone https://github.com/eskobar95/mercflow.git /opt/mercflow-db
cd /opt/mercflow-db/infra/db

cp .env.example .env
# Edit .env — generate passwords: openssl rand -hex 32

docker compose up -d
./setup-roles.sh
```

### 3. Configure app server

On the **app VPS**, copy `infra/.env.example` to `infra/.env` and set:

- **`DATABASE_URL`** — connection for the `mercflow_app` role (Medusa backend + worker)
- **`PLATFORM_DATABASE_URL`** — connection for the `mercflow_owner` role (Platform Console)

Use the DB VPS private IP as host. Passwords live in `infra/db/.env` on the database server — never commit real values to git.

Restart Medusa after updating env:

```bash
docker compose -f infra/docker-compose.yml --env-file infra/.env restart medusa-backend medusa-worker
```

### 4. Migrations

Run from an operator machine or CI with network access to the DB (migration superuser). Export the migration connection string from `infra/db/.env.example` into your shell, then:

```bash
pnpm migration:run
```

Never point running Medusa processes at `mercflow_migration`.

## Roles

| Role | BYPASSRLS | Purpose |
|---|---|---|
| `mercflow_migration` | yes | Migrations, one-off admin (`setup-roles.sh` connects as this user) |
| `mercflow_app` | **no** | Production Medusa backend + worker |
| `mercflow_owner` | yes | Platform Console `/platform/*` |

Verify RLS after cutover:

```bash
pnpm --filter @mercflow/backend exec -- tsx src/scripts/test-rls-medusa.ts
```

## Backup

The `backup` service runs daily at **02:00 UTC** (`infra/backup/crontab`).

Manual run:

```bash
docker compose exec backup /backup.sh
```

Restore (operator workstation):

```bash
./scripts/restore-backup.sh 2026-07-04
```

Configure a BetterStack heartbeat alert if no Object Storage upload within 26 hours.

## Neon cutover (one-time)

1. Enable backup on Hetzner **before** cutover; confirm one manual dump reaches Object Storage.
2. On app server: scale Medusa to stopped or maintenance mode.
3. `pg_dump` from Neon (direct endpoint, not pooler for consistency):
   ```bash
   pg_dump "$NEON_DATABASE_URL" | gzip > mercflow-neon-final.sql.gz
   ```
4. Restore on Hetzner DB:
   ```bash
   gunzip -c mercflow-neon-final.sql.gz | psql "$DATABASE_URL_MIGRATION"
   ```
5. Run `./setup-roles.sh` if restoring into a fresh cluster (roles may already exist from dump).
6. Update app `DATABASE_URL` / `PLATFORM_DATABASE_URL` to Hetzner private IP.
7. `pnpm migration:run` (applies any pending migrations).
8. Verify health + RLS tests; re-enable traffic.
9. Keep Neon read-only for 7 days, then decommission.

Expected downtime: **5–15 minutes** if dump/restore was rehearsed on staging.

## Local development

Root `docker-compose.yml` runs Postgres 16 + pgvector with a single `mercflow` superuser — sufficient for local dev. Production role separation is enforced only on the DB VPS.
