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
| Server | Hetzner **CX33** (8 GB) minimum for 10–20 shops; CPX32+ for stable CPU |
| Volume | 20–40 GB (Postgres data) |
| Network | Hetzner private network between app VPS and DB VPS |

## First-time setup

### 1. Provision VPS + private network

1. Create a DB VPS in the same Hetzner project/region as the app server.
2. Join both VPS to a Hetzner private network (`mercflow-private`, e.g. `10.0.0.0/16`).
3. Firewall on DB VPS: **TCP 5432 from app VPS private IP only**; **TCP 22 from operator IP**.
4. Enable **Hetzner Server Backup** on the DB VPS.

### 2. Deploy Postgres (+ optional backup)

```bash
git clone https://github.com/eskobar95/mercflow.git /opt/mercflow-db
cd /opt/mercflow-db/infra/db

cp .env.example .env
# Edit .env — or run ./bootstrap.sh to generate passwords automatically

./bootstrap.sh
# Postgres only. With S3: docker compose --profile backup up -d
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

Object Storage backups are **optional**. Enable when S3 credentials are ready:

```bash
docker compose --profile backup up -d
```

The `backup` service runs daily at **02:00 UTC** (`infra/backup/crontab`).

Manual run:

```bash
docker compose --profile backup exec backup /backup.sh
```

Restore (operator workstation):

```bash
./scripts/restore-backup.sh 2026-07-04
```

Configure a BetterStack heartbeat alert if no Object Storage upload within 26 hours.

## Neon cutover (one-time)

Production cutover completed 2026-07-05. For future migrations or staging:

```bash
export NEON_DATABASE_URL='postgresql://...'
export JUMP_HOST=root@46.225.226.143   # when DB SSH is only via app VPS
./scripts/cutover-neon-to-hetzner.sh
```

**Neon runs PostgreSQL 18** — use `pg_dump` from a PG18 client with `--no-owner --no-acl`, and strip `transaction_timeout` when restoring to PG16.

Steps:
1. Hetzner Server Backup enabled on DB VPS
2. `./bootstrap.sh` on mercflow-db
3. Run cutover script (or manual pg_dump → restore)
4. Update app `DATABASE_URL` / `PLATFORM_DATABASE_URL` to DB private IP
5. Restart Medusa; verify health + admin login
6. Keep Neon read-only 7 days, then decommission

Expected downtime: **5–15 minutes**.

## Local development

Root `docker-compose.yml` runs Postgres 16 + pgvector with a single `mercflow` superuser — sufficient for local dev. Production role separation is enforced only on the DB VPS.
