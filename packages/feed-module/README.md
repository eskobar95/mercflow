# @mercflow/feed-module

MercFlow Medusa v2 module for shopping and catalog feeds (for example Google Shopping XML). Batch 2 introduces this package as a **scaffold**; DML models, migrations, and routes are added in dedicated slices.

## Responsibility

- Own feed configuration, generation, and validation logic scoped to product/catalog exports.
- Remain merchant-agnostic: no hardcoded storefront URLs or Guapo-specific feed presets.

## Does not belong here

- SEO redirects, sitemap, or robots — use `@mercflow/seo-module`.
- Core product editing workflows — Medusa admin and `@mercflow/content-module` for content fields.

## Local development

```bash
pnpm --filter @mercflow/feed-module typecheck
pnpm --filter @mercflow/feed-module test
```

## Module key

Registered as `mercflow_feed`.
