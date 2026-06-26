# PRD — MercFlow Production Infrastructure

> Version 1.0 — 2026-06-08
> Prerequisite: Batch 2 modules complete on `development`
> Infra ADR: ADR-006 (Hetzner + Docker Compose + Traefik + Redis + Portainer)
> Tenancy model: ADR-004 (shared Neon DB, `store_id` row isolation)

---

## Problem

MercFlow has no defined, reproducible production environment. The Hetzner server is available but unconfigured. There is no:

- Reverse proxy or SSL handling — domains cannot be routed to tenants
- Redis — Medusa's event bus and rate-limiting counters have no backing store
- Observability — errors are invisible until a customer complains
- Automated backups — a server loss would destroy all tenant data
- Ops visibility — routine checks require SSH access

As a result, MercFlow cannot onboard a second tenant with reasonable operational confidence. Guapo runs as the only tenant, but even for Guapo there is no defined runbook, no alerting, and no documented recovery procedure.

---

## Goals

1. All MercFlow services run reproducibly on the Hetzner VPS via Docker Compose.
2. Traefik routes per-tenant domains with automatic SSL (Let's Encrypt).
3. Redis is available for Medusa event bus and rate-limiting (ADR-005).
4. Sentry captures and tags errors by `store_id` (tenant).
5. BetterStack alerts on downtime per tenant domain and aggregates logs.
6. Daily automated backups reach Hetzner Object Storage (S3) and are restorable.
7. Portainer gives ops visibility without SSH.
8. A provisioning script onboards a new tenant (Store + Sales Channel + Publishable Key + Admin user) in under 5 minutes.
9. Neon allowed-IP policy updated to Hetzner egress IP (ADR-005 interim security gate).
10. Infrastructure is fully documented — a second person can operate it without the original author.

---

## Non-goals (v1)

- CI/CD auto-deploy pipeline (GitHub Actions → Hetzner) — post-MVP
- Kubernetes or container orchestration beyond Docker Compose
- Horizontal scaling / load balancing (single VPS is sufficient for MVP)
- Self-service tenant signup (no UI, no Stripe billing — see future PRD)
- Storefront deployment automation (storefront-kit is a separate initiative)
- Neon Private Link (target state; interim is IP allowlist)
- Per-tenant resource quotas or rate-limit overrides
- Multi-region or disaster-recovery failover

---

## Success metrics

| Metric | Target |
|--------|--------|
| New tenant provisioned from scratch | < 5 minutes |
| SSL cert provisioned for new domain | Automatic on first request |
| Sentry error surfaced with `store_id` tag | 100 % of unhandled errors |
| BetterStack alert on tenant domain downtime | < 2 min detection |
| Daily backup stored in S3 | 100 % of days; restorable in test |
| Neon allowed-IP policy active | Before second tenant onboarded |
| Full runbook written | Before second tenant onboarded |

---

## Users

**MercFlow operator (internal)** — the person (currently one person: Nicklas) who runs the platform. Needs to onboard tenants, restart services, investigate errors, and verify backups without requiring deep Hetzner/Docker expertise every time.

**Future tenants (indirect)** — non-technical beauty/frisør salon owners. They never touch the infrastructure, but their uptime, data integrity, and domain SSL depend on it.

**Not for:** tenant end-users (customers placing orders). That reliability is a consequence of this PRD being done correctly.

---

## User journeys

### J001 — Deploy MercFlow to Hetzner from scratch

**Problem:** The Hetzner server is an empty VPS. No services are running.
**Goal:** Full MercFlow stack running, Traefik routing, Guapo accessible, Portainer reachable.
**Steps:**
1. Operator SSHes into Hetzner VPS, clones `mercflow` monorepo.
2. Copies `.env.example` → `.env.production`, fills in secrets (Neon connection string, Sentry DSN, BetterStack token, S3 credentials).
3. Runs `docker compose up -d` from `infra/` directory.
4. Traefik starts, provisions SSL cert for configured domain.
5. Medusa backend + worker start, connect to Neon.
6. Operator opens Portainer → sees all containers green.
7. Operator opens Guapo admin URL → login works.

**Tasks:** T-INFRA-001, T-INFRA-002

---

### J002 — Provision a new tenant

**Problem:** A new beauty salon is ready to onboard. No infrastructure exists for them yet.
**Goal:** Tenant has a running Medusa store, admin login, and SSL-enabled domain in under 5 minutes.
**Steps:**
1. Operator ensures DNS CNAME for `shop.salon-name.dk` points to Hetzner IP.
2. Operator runs: `pnpm provision-tenant --name "Salon Maria" --domain shop.salon-maria.dk --email maria@salon-maria.dk`
3. Script creates: Medusa Store, Sales Channel, Publishable API Key, Admin user with generated password.
4. Script appends Traefik routing rule for the new domain.
5. Operator restarts Traefik (or it hot-reloads) → SSL cert provisioned automatically.
6. Operator sends login URL + credentials to customer manually.
7. Customer logs into MercFlow admin → sees their own store only.

**Tasks:** T-INFRA-003

---

### J003 — Investigate a tenant error

**Problem:** A tenant reports something is broken. Operator needs to find the cause.
**Goal:** Error found in Sentry in < 2 minutes, with tenant context.
**Steps:**
1. Operator opens Sentry → filters by `store_id = store_XXXXX`.
2. Error shows stack trace, request context, environment.
3. If log context is needed: operator opens BetterStack → filters by `store_id` tag.
4. Fix deployed → Sentry marks issue resolved.

**Tasks:** T-INFRA-002 (Sentry + BetterStack setup)

---

### J004 — Verify backup and restore

**Problem:** Operator needs confidence that a server loss is recoverable.
**Goal:** Daily backup stored in S3; restore procedure tested and documented.
**Steps:**
1. Cron container runs `pg_dump` daily at 02:00 UTC → uploads to Hetzner Object Storage via rclone.
2. Operator receives BetterStack alert if backup job fails.
3. To restore: operator runs documented `scripts/restore-backup.sh <date>` → pg_restore to Neon.
4. Restore tested manually once per month (documented in runbook).

**Tasks:** T-INFRA-004

---

## System overview

```
Hetzner VPS
├── docker-compose.yml
│   ├── traefik          ← SSL, routing (labels or file provider)
│   ├── medusa-backend   ← HTTP server (apps/backend)
│   ├── medusa-worker    ← BullMQ worker (apps/backend --worker)
│   ├── redis            ← event bus + rate-limit counters
│   ├── portainer        ← container management UI
│   └── backup-cron      ← daily pg_dump → S3
│
├── infra/
│   ├── traefik/         ← static + dynamic config, acme.json
│   └── backup/          ← rclone config, backup.sh
│
└── scripts/
    └── provision-tenant.ts   ← CLI: creates Store + tenant admin

External services (cloud):
├── Neon              ← PostgreSQL (allowed-IP: Hetzner VPS)
├── Sentry            ← error tracking (tagged by store_id)
├── BetterStack       ← logs + uptime
└── Hetzner Object Storage  ← S3-compatible, backups + media
```

---

## Deliverables (v1)

1. `infra/docker-compose.yml` — full stack: Traefik, Medusa backend + worker, Redis, Portainer, backup-cron
2. `infra/traefik/` — static config, dynamic routing rules, ACME config
3. `infra/.env.example` — all required env vars documented (no real values)
4. `infra/backup/` — `backup.sh` (pg_dump + rclone upload), `restore-backup.sh`
5. `scripts/provision-tenant.ts` — CLI provisioning script
6. `infra/RUNBOOK.md` — deploy, restart, onboard tenant, restore backup, update certs
7. Neon allowed-IP updated to Hetzner VPS egress IP (ops task, no code)
8. Sentry project created with `store_id` tag in error context
9. BetterStack workspace with per-tenant uptime checks and log source

---

## Open questions

- **Floating IP:** Should a Hetzner Floating IP be provisioned now to stabilise the egress IP for Neon allowlist? Recommended yes — prevents allowlist churn if VPS is replaced.
- **Medusa build in Docker:** Build `apps/backend` in CI and push image to GitHub Container Registry, or build on the VPS? CI-built image is safer (reproducible); VPS build is simpler for MVP.
- **Portainer access control:** Who besides Nicklas should have Portainer access? Document in runbook.
- **Neon Private Link timing:** When does Hetzner + Neon Private Link become available? Track as a follow-up ops task.
