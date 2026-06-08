# Technical specification — MercFlow

> Aligns with `.cursor/docs/PRD-batch2.md` (product) and `.factory/context/PRD.md` (after `/to-prd`). Updated during `/align`.

---

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Runtime | Node.js | Medusa v2 backend in `apps/backend` |
| Framework | Medusa v2 modules + Vite admin | Not Next.js |
| Language | TypeScript (strict) | No `any` |
| Package manager | pnpm 9 | Workspace monorepo |
| Database | PostgreSQL | Migrations per MercFlow module |
| Admin UI | React 18 + Vite + Radix | `packages/admin-ui` |
| Rich text | TipTap v2 | JSON in content-module |
| CI | GitHub Actions | `ci.yml`, `security.yml` |

---

## Constraints

- Never modify Medusa core or `node_modules` — extend via MercFlow packages only.
- Design values only from `packages/design-tokens`.
- Migrations: DML-generated, decision log in file, reversible `down()`; immutable once committed.
- Locale-aware content: `?locale=` on MercFlow content APIs matches Medusa Admin locale codes (BCP-47); do not hardcode production language lists.
- **Notion:** read-only intake for planning; Factory files are SSOT during `/to-prd`, `/to-backlog`, `/run-sprint` (see ADR-001).
- **SaaS multi-tenancy (ADR-004):** Shared Neon DB, one Medusa instance, `store_id` column on every MercFlow module table. All service methods filter by `store_id`. Tenant resolved from JWT (admin) or `Host` header (public routes). Batch 1 tables require backfill migration before any Batch 2 feature ships. Verify with `rg "store_id" packages/*/src/models/` — every model must match.
- Guapo-specific production config/credentials stay out of MercFlow packages.
- Batch 2 public routes must return correct status, `Content-Type`, and cache behavior; test XML/text as output.
- **List endpoints (PRD-api-hardening, T031):** Every `GET /admin/[resource]` handler in MercFlow modules must apply `limit = Math.min(query.limit ?? 50, 100)`. No unbounded queries.
- **Error shape (PRD-api-hardening, T031):** All MercFlow route error paths must use `MedusaError` — never raw `Error` or plain JSON objects. Shape: `{ message, type, code }`.
- **Store route versioning (PRD-api-hardening, T032):** All MercFlow store-facing routes (`/store/seo/*`, `/store/feed/*`, `/store/sitemap*`, etc.) must be mounted under `/v1/` **before the first non-Guapo tenant is provisioned**. Old paths must 301-redirect to `/v1/` equivalents during transition.

---

## Integrations

| Service | Purpose | Where |
|---------|---------|--------|
| Stripe | Payments config | `connector-module` |
| Shipmondo | Shipping rules config | `connector-module` |
| Plunk | Email | `connector-module` |
| GTM | Analytics tag | `connector-module` |

Storefront consumes SEO/feed/metadata via backend public routes — not configured in MercFlow admin-ui alone.

---

## Repository layout

```
mercflow/
├── apps/backend/           # Registers modules; thin re-exports only
├── packages/
│   ├── admin-ui/
│   ├── content-module/
│   ├── connector-module/
│   ├── subscription-module/
│   ├── design-tokens/
│   ├── seo-module/         # Batch 2 (planned)
│   ├── feed-module/        # Batch 2 (planned)
│   └── inventory-module/   # Batch 2 (planned)
├── .factory/context/       # PRD, TECHSPEC, CONTEXT, ADR
├── .factory/planning/      # milestones, sprints, tasks (Factory harness)
├── .cursor/docs/           # PRD-batch2.md (product draft until /to-prd)
└── docs/                   # PRD.md, ARCHITECTURE.md (project ADRs)
```

---

## Branch model (MercFlow)

MercFlow uses **`development`** as the integration branch, not Factory kit default `dev`.

```
main
  └── staging
        └── development          ← all feature PRs target here
              └── feature/[sprint]/[task-id]-[slug]
```

See ADR-002. Protected branches for agents: `main`, `staging`, `development` (`.cursor/hooks/guard-branches.sh`).

---

## Commands (project scripts)

| Script | Command | When |
|--------|---------|------|
| Typecheck | `pnpm typecheck` | Every task |
| Lint | `pnpm lint` | Every task |
| Test | `pnpm test` | Every task |
| Build | `pnpm build` | Before milestone / large UI change |
| CI parity | `pnpm ci` | Pre-PR |
| Migrations | `pnpm migration:run` | After schema change (local only unless instructed) |
| Audit | `pnpm audit --audit-level=high` | PR checklist |

---

## Testing

| Script | Command | Notes |
|--------|---------|-------|
| Unit/integration | `pnpm test` | Vitest monorepo root |
| Module-focused | `pnpm test <path>` | Narrowest scope first |

BDD: optional under `.factory/specs/` — link to PRD journeys when used.

---

## Batch 2 — technical additions (planned)

| Module | Responsibility |
|--------|----------------|
| `seo-module` | Redirects, sitemap/robots config, slug utility, public `GET /sitemap.xml`, `GET /robots.txt` |
| `feed-module` | `GET /feed/google-shopping.xml`, feed config, validation report |
| `inventory-module` | Suppliers, POs, receipts, inventory dashboard aggregates, low-stock config |

**Suggested implementation order** (from PRD-batch2 §5): slug utility → seo foundation → redirects → sitemap → robots → structured data / OG / canonical → feed → suppliers → POs → inventory dashboard → order flow improvements.

**Out of scope Batch 2:** wildcard/regex redirects, Amazon/Pricerunner feeds, EDI, auto low-stock ordering, GLS labels (Batch 3).

---

## ADR log

| ID | Date | Decision | Status |
|----|------|----------|--------|
| [ADR-001](ADR/ADR-001-notion-read-only-factory-execution.md) | 2026-06-04 | Notion read-only intake; Factory owns execution | accepted |
| [ADR-002](ADR/ADR-002-development-integration-branch.md) | 2026-06-04 | Integration branch is `development` (not `dev`) | accepted |
| [ADR-003](ADR/ADR-003-batch2-module-split.md) | 2026-06-04 | Batch 2: separate seo / feed / inventory modules | accepted |
| [ADR-004](ADR/ADR-004-shared-instance-multi-tenancy.md) | 2026-06-04 | SaaS multi-tenancy — shared Neon DB, `store_id` row isolation | accepted |
| [ADR-005](ADR/ADR-005-security-rls-rate-limiting.md) | 2026-06-04 | Security: RLS on MercFlow tables + rate limiting + Neon IP policy | accepted |
| [ADR-006](ADR/ADR-006-hetzner-infra-stack.md) | 2026-06-08 | Production infra: Hetzner + Docker Compose + Traefik + Redis + Portainer | accepted |
| PRD-api-hardening | 2026-06-08 | API hardening: pagination max, error shape, /v1/ store route versioning — see PRD-api-hardening.md | accepted |

---

## Security notes

- Secrets in env only; validate admin APIs with Zod.
- Webhook HMAC where applicable.
- No secrets in logs; `guard-secrets.sh` on shell commands.
