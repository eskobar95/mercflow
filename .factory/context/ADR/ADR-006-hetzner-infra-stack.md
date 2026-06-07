# ADR-006 — Production infrastructure stack (Hetzner)

**Date:** 2026-06-08
**Status:** accepted
**Supersedes:** Railway references in ADR-005 (interim network policy section)

---

## Context

MercFlow requires a production compute environment to run the shared Medusa backend and workers for all tenants. ADR-005 referenced Railway as a possible hosting provider during planning. The decision has since been made to use a Hetzner VPS instead — a server is already available.

The goals for the infrastructure stack are:

1. Reproducible, version-controlled deployment (no snowflake servers)
2. Per-tenant domain routing with automatic SSL
3. Observability: errors, logs, uptime — all tenant-tagged
4. Automated backups that survive a full VPS loss
5. Ops visibility without requiring SSH access for routine tasks
6. A provisioning script that onboards a new tenant in under 5 minutes

---

## Decision

**Hetzner VPS** as compute. **Docker Compose** as the deployment unit. The following service stack:

| Service | Image / provider | Role |
|---|---|---|
| `medusa-backend` | `apps/backend` (built from monorepo) | Medusa HTTP server |
| `medusa-worker` | `apps/backend` worker mode | Async job processing (BullMQ) |
| `traefik` | `traefik:v3` | Reverse proxy, SSL (Let's Encrypt ACME), per-tenant routing |
| `redis` | `redis:7-alpine` | Medusa event bus + rate-limiting counters |
| `portainer` | `portainer/portainer-ce` | Container dashboard (no SSH required) |
| `backup` | Custom cron + `pg_dump` + rclone | Daily pg_dump → Hetzner Object Storage |

**Neon** remains the database provider (ADR-004). Not self-hosted.

**Hetzner Object Storage** (S3-compatible) is used for:
- Medusa media asset uploads
- Automated daily PostgreSQL backups (pg_dump via cron container → rclone → S3)

**Sentry** (cloud, free tier → team plan) for error tracking — every error tagged with `store_id`.

**BetterStack** (cloud, free tier → team plan) for:
- Log ingestion from all containers
- Uptime checks per tenant domain (alert on 5xx or timeout)

### Tenant domain routing

Traefik routes incoming requests based on `Host` header:

```
shop.customer-a.dk  →  medusa-backend (store resolved by host middleware)
shop.customer-b.dk  →  medusa-backend (same instance, different store_id)
admin.mercflow.io   →  medusa-backend /admin/*
```

SSL certificates are provisioned automatically via Let's Encrypt ACME (HTTP-01 challenge). Each tenant domain must have a CNAME pointing to the Hetzner server IP before onboarding.

### Neon network policy (updated from ADR-005)

- **Interim:** Hetzner VPS egress IP added to Neon project `allowed_ips`. `block_public_connections: false` during transition, `true` once IP is confirmed stable.
- **Target:** Neon Private Link between Hetzner and Neon — eliminates public internet exposure of connection string.

Railway is no longer referenced as a hosting provider. ADR-005 rate-limiting section remains valid; Redis is the counter backend.

### Tenant onboarding MVP

A CLI provisioning script (`scripts/provision-tenant.ts` or similar) that accepts:

```
--shop-name     "Salon Maria"
--domain        shop.salon-maria.dk
--admin-email   maria@salon-maria.dk
```

And creates:
1. Medusa `Store` entity
2. Medusa `SalesChannel` linked to the store
3. Medusa `PublishableApiKey` for the storefront
4. Medusa admin user with the given email + generated password
5. Traefik routing rule for the domain (via dynamic config file or label)

Target: under 5 minutes end-to-end. No UI, no self-service — MercFlow team runs it manually per customer.

---

## Scope

| Kind | Path / pattern |
|------|----------------|
| Docker Compose | `apps/backend/docker-compose.yml` (or repo root) |
| Traefik config | `infra/traefik/` |
| Backup script | `infra/backup/` |
| Provisioning script | `scripts/provision-tenant.ts` |
| Env template | `.env.example` (update with new infra vars) |

---

## Enforcement

| Mechanism | What it checks |
|---|---|
| `.env.example` | All new infra env vars documented without real values |
| `guard-secrets.sh` | No connection strings or API keys in committed files |
| Backup verification | Weekly manual restore test from S3 backup |
| Portainer | Confirm all containers healthy after deploy |

---

## How to fix

1. **Container crash loop:** Check Portainer → container logs → fix and `docker compose up -d`.
2. **SSL cert not provisioning:** Verify DNS CNAME points to Hetzner IP; check Traefik ACME log.
3. **Neon connection refused:** Verify Hetzner egress IP is in Neon `allowed_ips`; check Redis is up (Medusa startup depends on it).
4. **Backup missing:** Check cron container logs; verify rclone config has correct Hetzner Object Storage credentials.

---

## Consequences

**Good:**
- Full control over compute — no vendor lock-in, cheaper at scale than managed cloud
- Docker Compose is simple to understand and operate; no Kubernetes overhead
- Portainer + BetterStack give ops visibility without SSH
- Traefik handles SSL and routing declaratively — no manual Nginx config per tenant

**Bad / trade-offs:**
- Hetzner VPS is a single point of failure (no auto-scaling, no multi-region) — acceptable for MVP; revisit at 50+ tenants
- Manual Neon IP allowlist update required if VPS IP changes (floating IP recommended)
- CI/CD auto-deploy is post-MVP — deploys require manual `docker compose pull && up -d` or Portainer webhook

---

## Alternatives considered

| Option | Why rejected |
|--------|--------------|
| Railway | No Hetzner server to manage; egress IP instability; higher cost at scale |
| Kubernetes (k3s on Hetzner) | Significant operational complexity for MVP stage |
| DigitalOcean / Render | Hetzner server already available; no reason to add vendor |
| Self-hosted PostgreSQL | Neon already in use (ADR-004); managed backups + branching are valuable |
