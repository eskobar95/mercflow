# ADR-018 — Self-hosted PostgreSQL on Hetzner (replaces Neon)

**Date:** 2026-07-04
**Status:** accepted
**Supersedes:** Neon database provider sections in ADR-006 and ADR-004 (database provider only — tenancy model unchanged)

---

## Context

MercFlow production used **Neon** (Frankfurt) as the shared PostgreSQL provider (ADR-004, ADR-006). Neon compute and plan costs exceeded the value for MercFlow's current tenant count and load profile.

MercFlow also requires **Row Level Security (RLS)** with a dedicated `mercflow_app` role (`NOBYPASSRLS`) and a separate `mercflow_owner` role (`BYPASSRLS`) for Platform Console routes (ADR-005, STACK.md). Neon's default owner role has `BYPASSRLS`, which blocks defence-in-depth tenant isolation unless custom roles are carefully configured on a managed service we do not fully control.

T029 (automated pg_dump → Hetzner Object Storage) was cancelled when Neon snapshots covered database backup. Moving off Neon **requires** vendor-independent backups.

---

## Decision

**Self-hosted PostgreSQL 16 + pgvector** on a **dedicated Hetzner VPS** with attached volume. The existing **app server** (CPX32, Docker Compose) connects over Hetzner private networking only.

### Architecture

| Component | Location | Role |
|---|---|---|
| `medusa-backend`, `medusa-worker`, Redis, Traefik | App VPS (existing CPX32) | Application stack — unchanged except `DATABASE_URL` |
| PostgreSQL 16 + pgvector | Dedicated DB VPS (CX22 + volume) | Primary data store |
| `backup` cron container | DB VPS (`infra/db/docker-compose.yml`) | Daily `pg_dump` → Hetzner Object Storage |
| Hetzner Object Storage | Cloud | Off-site backup retention (30 days default) |
| Hetzner Server Backup | Both VPS | Disk-level snapshots (infra recovery) |

**Not in scope:** Kubernetes/k3s, Postgres on the app VPS as the permanent production layout, Neon branching for dev/staging.

### Database roles

| Role | BYPASSRLS | Used by |
|---|---|---|
| `mercflow_migration` | yes (superuser for migrations only) | `pnpm migration:run`, one-off admin |
| `mercflow_app` | **no** | Medusa backend, worker — tenant RLS enforced |
| `mercflow_owner` | yes | Platform Console `/platform/*` — intentional cross-tenant reads |

Connection strings:

- App stack: `DATABASE_URL` → `mercflow_app@<db-private-ip>:5432/mercflow`
- Platform Console: `PLATFORM_DATABASE_URL` → `mercflow_owner@<db-private-ip>:5432/mercflow`
- Migrations (operator/CI): direct URL with `mercflow_migration` — never used by running Medusa processes

### Network

- DB VPS firewall: **only app VPS private IP** on port 5432
- Postgres listens on private network interface
- No public internet exposure of PostgreSQL

### Backup

- **Daily 02:00 UTC:** full `pg_dump` compressed → Hetzner Object Storage via rclone (`infra/backup/`)
- **Retention:** 30 days (`BACKUP_RETENTION_DAYS`)
- **Alert:** BetterStack if no upload within 26 hours (operator configures heartbeat)
- **Restore test:** manual HITL monthly — `scripts/restore-backup.sh`

### Dev / staging

- **Local:** root `docker-compose.yml` — Postgres 16 + pgvector (same extension as prod)
- **Staging:** separate DB on Hetzner or local Docker — not Neon branches

---

## Scope

| Kind | Path |
|---|---|
| DB server Compose | `infra/db/docker-compose.yml` |
| Role setup | `infra/db/setup-roles.sh`, `infra/db/init/` |
| Backup | `infra/backup/`, `scripts/restore-backup.sh` |
| App env | `infra/.env.example`, `infra/docker-compose.yml` |
| Runbook | `infra/RUNBOOK.md` § Database, Backup, Cutover |
| Cutover | Neon `pg_dump` → restore on Hetzner — documented in runbook |

---

## Enforcement

| Mechanism | What it checks |
|---|---|
| `infra/.env.example` | `DATABASE_URL` documented; no `NEON_*` vars in production template |
| `apps/backend/src/scripts/test-rls-medusa.ts` | RLS enforced for `mercflow_app` before prod cutover |
| Backup cron logs | Daily file in Object Storage |
| HITL restore test | Monthly restore to scratch DB |

---

## How to fix

1. **Medusa cannot connect:** verify DB VPS firewall allows app VPS private IP; check `DATABASE_URL` uses `mercflow_app`.
2. **RLS not enforced:** confirm connecting role is `mercflow_app` (not `mercflow_migration` or `mercflow_owner`) in backend/worker env.
3. **Backup missing:** `docker compose -f infra/db/docker-compose.yml logs backup`; verify S3 credentials in `infra/db/.env`.
4. **Migration fails:** use `mercflow_migration` URL for `pnpm migration:run`, not `mercflow_app`.

---

## Consequences

**Good:**

- Lower and predictable monthly cost vs Neon at current scale
- Full control over RLS roles (`NOBYPASSRLS` on app role)
- pgvector available without vendor constraints
- Vendor-independent SQL backups (T029)
- DB isolated from app CPU/RAM contention

**Bad / trade-offs:**

- MercFlow owns backup, restore, and Postgres upgrades
- No Neon branching or managed PITR — WAL/PITR is a future enhancement
- Two VPS to operate (app + db)
- Cutover requires planned downtime (5–15 minutes)

---

## Alternatives considered

| Option | Why rejected |
|---|---|
| Stay on Neon (cheaper tier) | Still higher cost; BYPASSRLS friction; vendor lock-in |
| Postgres on app VPS (Compose) | RAM/IO contention; SPOF; harder to scale DB independently |
| k3s + Postgres operator | Operational complexity without scaling benefit at current size |
| Managed Hetzner Postgres | Not available; would still be external SaaS cost |
