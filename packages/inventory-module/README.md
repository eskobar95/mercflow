# @mercflow/inventory-module

MercFlow Medusa v2 module for inventory visibility, purchase orders, supplier records, and related order-operations extensions. This package is introduced in Batch 2 as a **scaffold**; schema and APIs follow the inventory vertical slices.

## Responsibility

- Own purchasing and inventory-domain persistence and services (per active PRD).
- Keep Medusa stock and core order entities as the system of record unless a task explicitly introduces integration.

## Does not belong here

- Product merchandising content — `@mercflow/content-module`.
- SEO or feed output — `@mercflow/seo-module`, `@mercflow/feed-module`.

## Local development

```bash
pnpm --filter @mercflow/inventory-module typecheck
pnpm --filter @mercflow/inventory-module test
```

## Module key

Registered as `mercflow_inventory`.
