# @mercflow/seo-module

MercFlow Medusa v2 module for SEO infrastructure: redirects, sitemap, robots, and structured metadata. Batch 2 adds this package as a **scaffold**; domain models, migrations, and API routes land in subsequent vertical slices.

## Responsibility

- Own SEO-related persistence and services (to be expanded per PRD Batch 2).
- Stay generic for any Medusa v2 adopter: no store-specific URLs, secrets, or Guapo-only assumptions.

## Does not belong here

- Product/category **content** fields (rich text, gallery) — use `@mercflow/content-module`.
- Medusa core patches — extend via this module only.

## Local development

From the monorepo root:

```bash
pnpm --filter @mercflow/seo-module typecheck
pnpm --filter @mercflow/seo-module test
```

Database migrations for this module are generated from DML via `@mercflow/backend` or this package’s `medusa-config` + Medusa CLI, once models exist.

## Module key

Registered as `mercflow_seo` for container resolution and `db:generate` / `db:migrate` tooling.
