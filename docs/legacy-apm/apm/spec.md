---

## title: MercFlow Batch 2

modified: Spec creation by the Planner.

# APM Spec

## Overview

MercFlow Batch 2 extends the existing Medusa v2 distribution with functional SEO infrastructure, Google Shopping feed output, purchase order workflows, inventory visibility, and improved order operations. The core problem is that standard Medusa does not provide the operational SEO, feed, purchasing, and inventory tooling needed by serious Nordic shops without custom work. The essential scope is the full Batch 2 PRD: redirects, sitemap, robots, structured data, Open Graph, canonical URLs, Nordic slugging, Google Shopping XML, suppliers, purchase orders, inventory dashboard, low stock visibility, order notes, timeline, and pick lists. Success means a functional internal version usable by Guapo while remaining generic MercFlow infrastructure that can support a second shop without Guapo-specific assumptions.

## Workspace

The working project is the single MercFlow git repository at `c:\Users\Nicklas\Github\mercflow`. The authoritative Batch 2 requirements source is `.cursor/docs/PRD-batch2.md`; no newer notes or specifications were identified by the User. Batch 1 context is available in `.apm/archives/batch-1` and confirms the existing admin UI, design-token, content-module, and i18n foundations. Current working targets are `packages/admin-ui`, `packages/content-module`, `packages/design-tokens`, `apps/backend`, and new packages under `packages/*` for Batch 2 modules. Root `AGENTS.md` exists and contains project execution standards; its Batch 1 admin-only scope must be updated during Rules work to reflect Batch 2's SEO, feed, inventory, order, and backend-served storefront-output scope.

---

> **Notes:** The repository is on `main` and has an unrelated existing modification in `.cursor/commands/apm-2-initiate-manager.md`; that change is not part of Batch 2 planning. The active `.apm` root was empty when planning began, while `.apm/archives/batch-1` contained archived Batch 1 artifacts. Batch 2 intentionally broadens the old Batch 1 admin-layer boundary, but it preserves the hard constraints against Medusa core edits, Guapo production configuration, direct third-party source changes, and non-token UI styling.

## Source Requirements

`.cursor/docs/PRD-batch2.md` is the authoritative product requirement document for Batch 2. It defines the required feature areas, database tables, API routes, and intended work order. This Spec records clarifications and project-level decisions layered on top of that PRD.

Batch 1 source context remains relevant for boundaries and existing foundations:


| Source                          | Role                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `.apm/archives/batch-1/spec.md` | Prior decisions about Medusa vs MercFlow content boundaries, locale handling, admin UX, migrations, and upgrade posture. |
| `.cursor/docs/PRD.md`           | Original MercFlow product vision and Batch 1 positioning.                                                                |
| `AGENTS.md`                     | Current execution standards and project boundaries to preserve and update.                                               |
| Package READMEs                 | Current package responsibilities and run/test conventions.                                                               |


## Product Positioning

MercFlow remains a generic Medusa v2 distribution. Guapo is the first internal validation case, not the product boundary and not a reason to hardcode Guapo-specific configuration, credentials, copy, marketplace assumptions, or production assets.

Batch 2 must produce functional features rather than only backend foundations. The implementation should be usable internally for Guapo and structured so another shop can be configured later without code changes that assume Guapo.

Batch 2 introduces backend-served storefront-touching output, but admin remains the control plane. Merchants configure and preview behavior in admin; crawlers, feed consumers, and storefronts read the generated backend output.

## Package And Module Boundaries

Batch 2 should add three new Medusa modules as the primary domain boundaries:


| Package                     | Responsibility                                                                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/seo-module`       | Redirects, sitemap configuration, robots configuration, slug utility, canonical URL generation, Open Graph generation, and JSON-LD generation services.                                                            |
| `packages/feed-module`      | Google Shopping XML configuration, generation, validation reporting, caching/invalidation support, and public feed route implementation.                                                                           |
| `packages/inventory-module` | Supplier register, purchase orders, purchase order lines, receipt history, incoming/received quantities, low stock configuration, inventory dashboard data, internal order notes, and order operations extensions. |


`packages/content-module` remains the owner of Batch 1 rich content and SEO content fields: `description_rich`, `seo_title`, `seo_description`, `seo_og_image_id`, media gallery, and category banner data. Batch 2 modules may read that content through stable service/API boundaries, but must not duplicate the same meaningful fields in new tables.

`apps/backend` remains the Medusa app that registers MercFlow modules and exposes route integration points. It should not become a dumping ground for business logic.

`packages/admin-ui` owns admin control surfaces, previews, list views, forms, and workflow UI for Batch 2. It should consume admin routes and services through the existing fetch/client patterns unless implementation research establishes a better project-local pattern.

## SEO Infrastructure

The SEO module must provide operational SEO tooling that Medusa does not provide out of the box:

- 301 redirect management.
- Sitemap control and `GET /sitemap.xml`.
- Robots.txt control and `GET /robots.txt`.
- Structured data / JSON-LD generation services.
- Open Graph and social meta generation services.
- Canonical URL calculation and override support where content fields require it.
- Nordic slug generation rules.

Redirect behavior is intentionally simple: known old URLs should return 301 redirects to their correct new URLs after a relevant product or category URL changes, or after a manual redirect is created. Batch 2 does not include wildcard redirects or regex-based redirects.

Redirects should be available through admin list/search/filter/create/delete flows, CSV import, and redirect-chain warnings. Automatic redirect creation should target product and category URL changes once the implementation has verified the correct Medusa event and data access patterns.

Sitemap and robots output must be served by the backend. Admin controls the configuration, preview, last-updated visibility, and manual regeneration. On-demand generation with caching and manual regenerate is acceptable for Batch 2; heavier background job infrastructure is not required at the start.

JSON-LD, Open Graph, and canonical data must be generated from Medusa core data plus MercFlow content data. There must be no manual JSON editor in Batch 2; the system generates structured output from controlled fields.

## Slug Generation

Batch 2 changes the PRD's original Nordic slug rule for `ø`:


| Character          | Output                                           |
| ------------------ | ------------------------------------------------ |
| `ø` / `Ø`          | `o`                                              |
| `æ` / `Æ`          | `ae`                                             |
| `å` / `Å`          | `aa`                                             |
| `é`, `è`, `ê`      | `e`                                              |
| Spaces             | `-`                                              |
| Special characters | Removed where they cannot be represented safely. |


The slugging feature should be generic and configurable in admin. The default strategy should use the rules above unless implementation research reveals a Medusa compatibility issue that requires explicit User review.

Existing slugs should not be changed automatically. Bulk regeneration is an explicit admin action and should create redirects for changed known URLs.

## Google Shopping XML Feed

Batch 2 includes one feed format: Google Shopping XML. It may be usable by other platforms, but the product and UI should call it Google Shopping XML rather than a multi-platform integration.

The backend must serve the feed at `GET /feed/google-shopping.xml`. Admin must provide a feed overview, feed URL, product/category exclusion controls where supported by the data model, and validation reporting for missing required fields.

The feed should draw from Medusa catalog, variant, pricing, inventory, and MercFlow content data. `content-module` remains the source for SEO descriptions and media gallery data; `feed-module` owns export configuration, validation, and XML generation.

No external platform connection is required in Batch 2. There is no Google Merchant Center, Meta, TikTok, Amazon, Pricerunner, or paid feed-management integration in scope.

## Inventory And Purchase Orders

Batch 2 must implement a functional purchase order flow with supplier registry, PO list/detail/create flows, line items, ordered quantities, purchase prices, expected delivery dates, supplier references, notes, statuses, and receipt history.

PO statuses are:

```text
draft -> ordered -> partially_received -> received -> cancelled
```

In the first functional version, PO receipt does not mutate Medusa inventory levels. MercFlow records ordered, incoming, received, and variance history in its own module. The UI must make this boundary clear so operators understand that received PO quantities are recorded in MercFlow and not automatically applied to Medusa stock yet.

The architecture should leave room for a later Medusa inventory mutation step through Medusa inventory workflows, but Batch 2 completion does not depend on that mutation.

The inventory dashboard should calculate and display operational inventory views from Medusa data plus MercFlow PO data:

- Stocked quantity from Medusa where available.
- Reserved quantity from Medusa where available.
- Available quantity as a live calculation.
- Incoming quantity from open Purchase Orders.
- Low stock thresholds from MercFlow configuration.
- Movement/history views that can include Medusa inventory events and MercFlow PO receipt events where available.

## Order Operations

Medusa remains the owner of core order, payment, fulfillment, and customer data. Batch 2 improves the admin operations experience on top of Medusa order data rather than replacing the order domain.

MercFlow may store internal order notes and other operational extension data in a MercFlow-owned table/module. Internal notes are not customer-facing messages.

The improved order flow should include better list filtering/search, status badges, order detail clarity, internal notes, timeline-style operational visibility where data is available, and a print-friendly pick list. Shipping label generation, carrier integration, and automatic tracking emails are not included.

## Admin Experience

Batch 2 admin UI should be simple, functional, smooth, and consistent with the Batch 1 design system. The goal is work-ready operator tooling before advanced dashboards.

SEO and Feeds may share a navigation area because both relate to discovery and marketing output. Inventory should feel like an extension of inventory operations with relevant subpages. Orders should remain Orders and be improved in place rather than treated as an unrelated domain.

All new admin UI must use design tokens from `packages/design-tokens`, existing layout/list primitives where appropriate, explicit loading and error states, accessible controls, keyboard-friendly tables/actions, and clear empty states.

## Public And Admin API Surface

The Batch 2 PRD defines the baseline routes:


| Route                                     | Purpose                          |
| ----------------------------------------- | -------------------------------- |
| `GET /sitemap.xml`                        | Dynamic sitemap output.          |
| `GET /robots.txt`                         | Dynamic robots.txt output.       |
| `GET /feed/google-shopping.xml`           | Google Shopping XML feed output. |
| `GET /admin/redirects`                    | Redirect list/search/filter.     |
| `POST /admin/redirects`                   | Create manual redirect.          |
| `GET /admin/purchase-orders`              | Purchase order list.             |
| `POST /admin/purchase-orders`             | Create purchase order.           |
| `POST /admin/purchase-orders/:id/receive` | Record PO receipt.               |
| `GET /admin/inventory-overview`           | Inventory dashboard data.        |


Additional admin routes may be added where needed for configuration, previews, validation reports, suppliers, order notes, and pick lists, but route-path or response-shape decisions that materially change the public API contract require explicit review.

Public crawler/feed routes must return correct content types and stable output formats. Admin routes must validate request bodies with Zod or equivalent project-approved validation before service calls.

## Validation And Completion Criteria

Batch 2 is complete when the full PRD scope is implemented to a functional internal standard and verified locally. Required validation categories are:

- Admin smoke coverage for all new admin areas and primary flows.
- Backend route tests for XML, text, JSON, and redirect output where applicable.
- Service tests for validation, edge cases, slugging, feed validation, PO status/receipt rules, and redirect behavior.
- Local migration generation and migration run for new modules.
- Manual Guapo-style scenario covering redirects, sitemap, robots, feed validation/output, PO creation/receipt, inventory dashboard visibility, order notes, and pick list.
- README updates for every new package and app-level integration area touched.

External platform validation against Google Merchant Center, Meta, TikTok, carrier systems, payment systems, or production/staging databases is not required for Batch 2.

## Out Of Scope

Batch 2 does not include:

- Nordic payment modules such as MobilePay or Klarna.
- GLS/DAO shipping label integration.
- Page builder or blog.
- Dark mode.
- Automated low-stock ordering.
- EDI or supplier integration.
- Amazon or Pricerunner feeds.
- Paid feed-management tooling.
- Public open-source release work.
- Production or staging migrations unless explicitly requested in the current task.

## Documentation Requirements

New packages must include package-local README files before or alongside code. Existing package/app READMEs must be updated when their responsibilities or integration points change.

Documentation must explain:

- Which module owns which data.
- How SEO infrastructure reads Medusa and MercFlow content data.
- How storefront-output routes are generated and cached.
- How Google Shopping XML validation works.
- How PO receipt relates to Medusa inventory in Batch 2.
- What is intentionally not included in Batch 2.

