# ADR-008: Metafield Storage Model

**Status:** Accepted  
**Date:** 2026-06-10  
**PRD:** `.factory/context/PRD-metafields.md`

---

## Context

M008 introduces tenant-defined metafield definitions and values on products and categories. The primary architectural decision is how to store typed values (text, number, boolean, date, json, lists) in a way that:

1. Does not require a schema migration when a new type is added.
2. Allows efficient querying by owner (all metafields for product X).
3. Is readable without a separate type-dispatch layer in every query.
4. Stays within PostgreSQL capabilities we already use.
5. Maintains RLS via `store_id` (ADR-005).

Three options were considered:

### Option A — Single `value` text column + type coercion in application

Every value stored as text. Application code parses based on definition type.

- Pro: simplest schema, trivially extensible.
- Con: loses PostgreSQL type safety; range queries on numbers/dates are awkward; JSON values require manual escaping.

### Option B — Typed columns (selected)

`MetafieldValue` has separate nullable columns: `value_text`, `value_json`, `value_number`, `value_boolean`. Each value row populates exactly one. The `type` on the linked definition determines which column is canonical.

- Pro: PostgreSQL can query/sort by native types. JSON stored as `jsonb` (indexable). Clean mapping to TypeScript types.
- Con: slightly wider table; application must write to the correct column based on definition type.

### Option C — EAV with separate per-type tables

Separate tables: `metafield_text_values`, `metafield_number_values`, etc.

- Pro: clean per-type indexing.
- Con: 5–7 join tables; complex query path; too much complexity for the value gained at this scale.

---

## Decision

**Use Option B: typed columns on a single `MetafieldValue` table.**

Columns: `value_text TEXT`, `value_json JSONB`, `value_number NUMERIC`, `value_boolean BOOLEAN`.

Mapping by `ValueType`:

| ValueType | Column used |
|-----------|-------------|
| `single_line_text`, `multi_line_text`, `url`, `color`, `date`, `date_time` | `value_text` |
| `json`, `list.*`, `rich_text` | `value_json` |
| `number_integer`, `number_decimal` | `value_number` |
| `boolean` | `value_boolean` |

All other columns for that row are NULL.

---

## `is_primary` — two-tier form presentation

**Decision (added v1.1, based on Shopify browser test 2026-06-10):** `MetafieldDefinition` carries a boolean `is_primary` (default `false`).

On the product/category admin form, definitions are rendered in two tiers:
- `is_primary = true` → always rendered as a visible text/select input when the form loads
- `is_primary = false` → rendered as a `+ [name]` chip; clicking expands it to an inline input

The category field also renders a badge `N metafelter` immediately after a category is selected, giving the merchant instant feedback on how many definitions will be injected.

Standard library seeds must include `is_primary` per definition. Skincare vertical example:
- Primary (5): Materiale, Aldersgruppe, Kosmetisk funktion, Pakketype, Målkøn
- Secondary chips (16): Spf-niveau, Duft, Velegnet til hudtype, Dispensertype, Ingrediensoprindelse, etc.

Merchant can toggle `is_primary` per definition in the Settings → Custom data definition form.

---

## Standard library seeds (`is_standard = true`, `store_id = NULL`)

Standard library definitions (Shopify-inspired, MercFlow-curated per vertical) are seeded with `store_id = NULL` and `is_standard = true`. They are the catalog merchants can browse.

When a merchant "activates" a standard definition, a new tenant-owned copy is created with `store_id = <tenant_id>`, `is_standard = false`. The original seed is never modified.

**RLS policy for definitions:**
```sql
CREATE POLICY metafield_definitions_tenant_isolation
  ON metafield_definitions
  USING (
    store_id IS NULL   -- library seeds readable by all authenticated callers
    OR store_id = current_setting('app.tenant_id', true)
  );
```

Standard seeds are INSERT-only from migrations — never from API routes. Admin routes only ever create/update/delete rows where `store_id = calling_tenant_id`.

**RLS policy for values:**
```sql
CREATE POLICY metafield_values_tenant_isolation
  ON metafield_values
  USING (store_id = current_setting('app.tenant_id', true));
```

Values are always tenant-owned; no library equivalent.

---

## Consequences

### What we gain

- Native PostgreSQL types enable range queries (e.g. `value_number > 30` for SPF ≥ 30 filter).
- `value_json` as `JSONB` allows GIN indexing for future list-contains queries.
- Adding a new scalar type (e.g. `color`, `url`) requires no migration — just extend the enum and map to `value_text`.
- Clean TypeScript mapping: service methods receive/return typed value objects, not raw strings.

### What we accept

- Application layer is responsible for writing to the correct column and returning the correct typed output.
- Rows with a non-matching populated column are considered corrupt; the service must validate on write.
- If a truly new "bucket" type is needed (e.g., binary blob), a new column + migration is required — acceptable given the rare occurrence.

---

## Scope

This ADR applies to: `packages/metafield-module/src/models/`

**Enforcement:** `pnpm typecheck` (TypeScript strict). Migration linter verifies RLS policies are present (`pnpm migration:lint` if implemented).

**How to fix a violation:** If a value row has multiple non-null typed columns, the write code is incorrect — add a unit test in `metafield-module` that asserts only one column is populated per row.

---

## Alternatives not taken

- **JSONB for everything** (a popular choice in flexible schema systems): rejected because it makes number range queries harder and adds a layer of JSON-schema validation on every read.
- **Medusa's existing `product_attribute` table** (from content-module): not suitable — it is a structural MercFlow field, not a tenant-defined key/value system. Metafields require a definition layer that `product_attribute` does not have.
