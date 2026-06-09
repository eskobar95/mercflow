# PRD — Metafields (M008)

> Version 1.1 — 2026-06-10 (updated: two-tier presentation pattern from Shopify browser test)
> Based on: Shopify product UI analysis (June 2026), CONTEXT.md Metafields definition, ADR-007 fork ownership
> Prerequisite: M007 Medusa Fork Setup (or parallel execution — metafield-module is a new package with no fork dependency)

---

## Problem

MercFlow merchants have no way to attach tenant-defined structured data to their products or categories without writing code. This creates three concrete pain points:

1. **Guapo's data is orphaned.** `brand`, `product_product_brand_brand`, ingredients, and similar columns live in legacy Guapo-specific tables that are not part of any MercFlow module. These cannot be administered through the MercFlow admin and are invisible to other tenants.

2. **Industry-specific product data is hardcoded or absent.** A skincare shop needs SPF level, skin type, and active ingredients. A fashion shop needs material, fit type, and wash instructions. Today, these fields either don't exist or are ad-hoc hacks. Every new field requires a migration and a developer.

3. **No structured way to extend entities.** Medusa's core product/variant/category data model covers commerce primitives. The content-module covers rich editorial content. Neither covers merchant-defined structured attributes that drive filtering, feeds, and customer decision-making.

Shopify's reference standard (observed June 2026, browser-tested): two-layer system — merchant-defined definitions (applied to all products or constrained to a category) plus a curated taxonomy-driven suggestion layer that auto-surfaces relevant fields when a category is chosen. Category metafields are injected **inline** into the product form (not a separate tab) with a two-tier display: 5 primary fields as always-visible inputs + 16 secondary fields as expandable `+ [name]` chips. The category field itself shows an `N metafelter` badge as immediate feedback.

---

## Goals

1. A merchant-admin can create, edit, and delete metafield **definitions** for products and categories from the admin UI — no code required.
2. Definitions are tenant-scoped: Guapo's definitions are invisible to any other MercFlow tenant.
3. When editing a product or category, the relevant metafield values are visible and editable inline.
4. MercFlow ships a **standard definition library** per industry vertical (skincare, fashion, food). Merchant activates definitions from the library in one click.
5. Definitions are addressable by `namespace` + `key` so storefronts can reliably fetch them via the store API.
6. The metafield system is **extensible**: new value types can be added without a breaking schema change.
7. Guapo's legacy `brand` and ingredients data can be migrated to metafield values with no storefront breakage.

---

## Non-goals (explicit)

- **Customer and order metafields** — deferred to M009 or later.
- **Variant-level metafields** — deferred; products are the initial scope. Variant metafields follow the same pattern once products are proven.
- **Metaobjects** (Shopify's structured reference objects) — not in scope. Flat key-value extensions only.
- **Shopify product taxonomy import** — MercFlow will seed a standard library manually curated for its verticals, not a GS1-compatible hierarchy.
- **Nested/relational definitions** — no foreign-key reference metafields (product_reference, collection_reference) in v1. Plain scalar and list types only.
- **Public taxonomy suggestion API** — automatic "3 suggestions available" banner based on category selection is Sprint 4 polish, not Sprint 1.
- **content-module SEO and rich text fields** — those are structural MercFlow fields, not tenant-defined. Never duplicate them.
- **Variant, order, customer, page-level metafields** — all deferred.

---

## User journeys

### J001 — Merchant creates a custom product metafield definition

**Actor:** Merchant-admin (e.g. Guapo)
**Goal:** Add "Active ingredients" as a multi-line text field to all products

**Steps:**
1. Navigate to Admin → Settings → Custom data
2. Select "Products" from entity list
3. Click "Add definition"
4. Fill in: Name = "Active ingredients", Namespace = `custom`, Key = `active_ingredients`, Type = `multi_line_text`, Optional description
5. Click "Save"
6. Confirm definition appears in the "All products" tab with 0 usage count

**Acceptance:** Definition is stored with `store_id` (tenant-scoped). Other tenants cannot see it.

---

### J002 — Merchant fills metafield values on a product

**Actor:** Merchant-admin
**Goal:** Enter "Niacinamide 10%, Zinc 1%" for a serum product

**Steps:**
1. Open product "Vitamin C Serum" in admin
2. Scroll to "Product metafields" section (below variants)
3. See "Active ingredients" field (pinned or in list)
4. Type value and save product
5. Value is persisted and visible on next product load

**Acceptance:** Value is stored scoped to `(product_id, store_id, namespace, key)`. Empty fields show placeholder. Section shows "No definitions added yet" when no definitions exist.

---

### J003 — Merchant activates definitions from standard library

**Actor:** Merchant-admin (skincare shop)
**Goal:** Quickly add SPF level, skin type, and cosmetic function fields without manual setup

**Steps:**
1. Navigate to Admin → Settings → Custom data → Products
2. Click "Browse standard library"
3. Filter by vertical: "Skincare"
4. See suggested definitions: SPF Level (number), Skin Type (list of text), Cosmetic Function (list of text), Active Ingredients (multi-line text), etc.
5. Select desired definitions and click "Activate"
6. Definitions appear in "All products" tab, ready to fill on products

**Acceptance:** Standard definitions are seeded in DB (not hardcoded); they are activated as tenant-specific definitions with `namespace = "mercflow_standard"`. Merchant can edit or delete activated definitions.

---

### J004 — Merchant creates a category-scoped metafield definition

**Actor:** Merchant-admin
**Goal:** Add "Recommended application method" specifically to products in the "Sunscreen" category

**Steps:**
1. Navigate to Admin → Settings → Custom data → Products
2. Switch to "By category" tab
3. Click "Add definition"
4. Fill in definition details; select category constraint = "Sunscreen"
5. Save
6. Open a product with category = "Sunscreen" — field appears in "Category metafields" section
7. Open a product with a different category — field does NOT appear

**Acceptance:** Definition stored with `category_constraint_id`. Only products whose category (or ancestor) matches see this field on the product form.

---

### J005 — Storefront fetches metafield values via API

**Actor:** Tenant's storefront (Next.js)
**Goal:** Display "Active ingredients" on the product page

**Steps:**
1. `GET /store/v1/products/:handle?fields=metafields.custom.active_ingredients`
2. Response includes `metafields: [{ namespace: "custom", key: "active_ingredients", value: "Niacinamide 10%, Zinc 1%", type: "multi_line_text" }]`

**Acceptance:** Store route authenticated via publishable_api_key scoped to tenant. No cross-tenant metafield values in any response.

---

### J006 — Merchant fills category-level metafield values

**Actor:** Merchant-admin
**Goal:** Add a "Category description" rich-text on the "Skincare" category for SEO

**Steps:**
1. Open category "Skincare" in admin
2. See "Category metafields" section
3. Fill "Category description" with rich text value
4. Save

**Acceptance:** Value stored scoped to `(category_id, store_id, namespace, key)`.

---

## Deliverables

### Backend — `@mercflow/metafield-module`

New Medusa module at `packages/metafield-module/`.

**DML models:**

```
MetafieldDefinition
├── id
├── store_id        NOT NULL — RLS policy
├── owner_type      enum: 'product' | 'category'
├── namespace       text — e.g. "custom", "mercflow_standard"
├── key             text — e.g. "active_ingredients"
├── name            text — display label
├── description     text (nullable)
├── type            enum: ValueType (see below)
├── validations     json (nullable) — type-specific rules
├── pinned_position int (nullable) — lower = shown first on form
├── is_required     boolean default false
├── is_primary      boolean default false — true = always visible as text input; false = shown as expandable chip
├── category_constraint_id  text (nullable FK → Medusa category)
└── is_standard     boolean default false — true = from MercFlow library

MetafieldValue
├── id
├── store_id         NOT NULL — RLS policy
├── definition_id    FK → MetafieldDefinition
├── owner_id         text — product/category ID
├── owner_type       enum: 'product' | 'category'
├── value_text       text (nullable)    — used by: text, multi_line_text, url, color, date, date_time
├── value_json       jsonb (nullable)   — used by: list.*, json, rich_text (TipTap JSON)
├── value_number     numeric (nullable) — used by: number_integer, number_decimal
├── value_boolean    boolean (nullable) — used by: boolean
└── locale           text (nullable)    — for future i18n; defaults to null (locale-agnostic)
```

**ValueType enum (v1):**
```
single_line_text
multi_line_text
number_integer
number_decimal
boolean
date
date_time
color
url
json
list.single_line_text
list.number_integer
```

**Service methods:**
- `createDefinition(input, storeId)` — validates namespace+key uniqueness per (owner_type, store_id)
- `updateDefinition(id, input, storeId)`
- `deleteDefinition(id, storeId)` — cascades MetafieldValue rows
- `listDefinitions({ ownerType, storeId, categoryConstraintId? })`
- `upsertValue(input, storeId)` — create or update by (definition_id, owner_id)
- `deleteValue(id, storeId)`
- `listValues({ ownerType, ownerId, storeId })` — returns typed values with definition metadata
- `activateStandardDefinitions(verticalId, storeId)` — copies library defs as tenant definitions

**Admin API routes:**
```
GET    /admin/metafield-definitions        ?owner_type=product&category_id=
POST   /admin/metafield-definitions
GET    /admin/metafield-definitions/:id
PUT    /admin/metafield-definitions/:id
DELETE /admin/metafield-definitions/:id
GET    /admin/metafield-definitions/standard-library  ?vertical=skincare
POST   /admin/metafield-definitions/activate-standard

GET    /admin/metafield-values  ?owner_type=product&owner_id=
POST   /admin/metafield-values/batch   — upsert array of values in one call
DELETE /admin/metafield-values/:id
```

**Store API route (public, v1):**
```
GET /store/v1/metafields?owner_type=product&owner_id=
```
Authenticated by publishable API key (standard Medusa middleware). Returns only pinned or explicitly requested definitions.

**Migrations:**
- M001: `metafield_definitions` table + `store_id` + RLS + unique constraint `(store_id, owner_type, namespace, key)`
- M002: `metafield_values` table + `store_id` + RLS + unique constraint `(store_id, definition_id, owner_id)`
- M003: Seed standard definitions for `skincare` and `fashion` verticals (idempotent, inserts with `is_standard = true` and `store_id = NULL`, readable by any tenant as the library catalog). Seeds include `is_primary` flag per definition (skincare example: Materiale, Aldersgruppe, Kosmetisk funktion, Pakketype, Målkøn = primary; SPF-niveau, Duft, Hudtype, etc. = secondary chips)

**Assumptions:**
- Standard library definitions have `store_id = NULL` and `is_standard = true`. RLS policy for library reads: `store_id IS NULL OR store_id = current_setting('app.tenant_id', true)`. Activated copies are regular tenant-owned definitions.
- `category_constraint_id` stores the Medusa category ID (plain text). The frontend resolves the display name.
- All admin routes protected by Medusa admin JWT middleware.
- No bulk import/export in v1.

---

### Admin UI

**Settings → Custom Data** (`/settings/custom-data`):
- Entity sidebar: Products, Categories (Variants/Orders/Customers greyed out with "Coming soon")
- Entity page has tabs: "All [entity type]" | "By category" (only for Products)
- Table: definition name, type badge, "Used in N products/categories", actions (edit, delete)
- "Add definition" button → slide-over/modal: name, namespace (pre-filled "custom"), key (auto-generated from name, editable), type picker, validations (dynamic per type), "Primary field" toggle (`is_primary`), pinned position (integer), optional: link to category
- "Browse standard library" button → modal with vertical filter + checklist → "Activate selected"

**Product page — Metafields sections** (below Variants):

- **"Product metafields" section:** shows `is_primary = true` definitions as always-visible text inputs. Remaining definitions are shown as `+ [name]` chips at the bottom — clicking a chip expands it into an input inline. "Add definition" shortcut link to Settings.
- **"Category metafields" section:** injected inline (same page, not a tab) when product has a category assigned. Section header shows the category badge e.g. *"Solcreme i Hudpleje"* and the count badge *"21 metafelter"* is shown on the Kategori field itself as immediate feedback after a category is selected. Definitions are split identically: `is_primary = true` → always-visible inputs; `is_primary = false` → `+ chip` row.
- **Auto-save:** metafield values saved on product form save (not separately).
- **No category, no section:** when no category is set, the "Category metafields" section is hidden entirely (no empty state shown).

**Category page — Metafields section:**
- "Category metafields" section: shows definitions with `owner_type = 'category'`.

---

## Success metrics

| Metric | Target |
|--------|--------|
| Merchant can create a definition end-to-end | < 2 minutes |
| Standard library activation (select + activate) | < 30 seconds |
| Store API response with metafields | < 200ms p95 |
| Zero cross-tenant metafield rows returned | 100% (test-covered) |
| Guapo brand + ingredients data migrated to metafields | Done before M008 closes |

---

## Open questions

| # | Question | Decision |
|---|----------|----------|
| OQ-01 | Standard library `store_id = NULL` — does the RLS policy need a separate `app_user` bypass for seeded rows, or does a `SECURITY DEFINER` function handle library reads? | **Resolved:** Policy exception only — `USING (store_id IS NULL OR store_id = current_setting('app.tenant_id', true))`. Migrations run as `neondb_owner` (BYPASSRLS), so seeds are inserted without a runtime bypass. Write policy is separate: `WITH CHECK (store_id = current_setting('app.tenant_id', true))` — tenants can never write `store_id = NULL` rows via API. No `SECURITY DEFINER` function needed. |
| OQ-02 | Namespace free-form or enum? | **Resolved:** Free-form text. Default `"custom"` for merchant-created, `"mercflow_standard"` for activated library definitions. |
| OQ-03 | Pinning UX: drag-to-reorder or priority number? | **Resolved (deferred to S016 polish):** Simple integer `pinned_position` editable in definition form. Drag-to-reorder is out of scope v1. |
| OQ-04 | Should `MetafieldValue.locale` be NOT NULL from day one (defaulting to `en`)? | **Resolved:** Yes — `locale TEXT NOT NULL DEFAULT 'en'`. Avoids a breaking migration when i18n is added. Unique constraint includes locale: `(store_id, definition_id, owner_id, locale)`. |

---

## Out of scope (confirmed)

- Variant metafields (M009 candidate)
- Customer / order / page metafields
- Metaobject / structured reference types
- Shopify GS1 taxonomy integration
- Auto-suggestion banner based on category selection (Sprint 4 polish only)
- Bulk import / export of definitions or values
- Webhook/event on metafield value change (future)
