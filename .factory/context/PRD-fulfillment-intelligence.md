# PRD — Fulfillment Intelligence (M010)

> Version 1.0 — 2026-06-10
> Based on: User brief (June 2026), Shopify emballage analysis, MercFlow order flow (M005), connector-module (Shipmondo)
> Prerequisites: M009 (product dimensions on variant form), M007 (packaging-module follows fork architecture)

---

## Problem

When a merchant picks and packs an order today, they must manually decide which box or envelope to use. There is no system in MercFlow that:

1. Lets the merchant register their available packaging types (sizes, max weight).
2. Suggests the optimal packaging for a given order's contents based on product dimensions.
3. Auto-fills the packaging dimensions when generating a Shipmondo shipping label.

This means every packing decision is made from memory, and Shipmondo labels are filled manually with box dimensions — creating friction and mistakes that delay fulfillment.

---

## Goals

1. A merchant can define and manage their own **Packaging catalog** — a set of named packaging types with physical dimensions and max weight.
2. During order fulfillment, the system **suggests the smallest viable packaging** from the catalog that fits all ordered items (based on variant dimensions set in M009).
3. The merchant can **accept or override** the suggestion before finalizing the shipment.
4. The selected packaging dimensions are **auto-populated** in the Shipmondo label generation flow — no manual entry.
5. Packaging catalog is **tenant-scoped** (store_id + RLS) — each merchant manages their own packaging.

---

## Non-goals (explicit)

- **Automatic order splitting across multiple packages** — v1 assumes one package per order. Multi-package shipments deferred.
- **3D bin-packing algorithm** — v1 uses a simple volume + max-weight check. True 3D spatial fitting deferred.
- **Carrier-agnostic packaging** — v1 integrates with Shipmondo only. GLS, PostNord deferred.
- **Automatic label creation without merchant review** — merchant always reviews and confirms packaging before label is generated.
- **Packaging cost tracking** — cost of packaging materials not tracked in v1.
- **Shopify-style preset library** — MercFlow ships no default catalog. Merchant creates their own.

---

## User journeys

### J001 — Merchant creates their packaging catalog

**Actor:** Merchant-admin
**Goal:** Register the 4 box types they use daily

**Steps:**
1. Navigate to Admin → Settings → Packaging
2. Click "Add packaging type"
3. Fill in: Name = "Small box", Type = Box, Length = 15 cm, Width = 10 cm, Height = 8 cm, Max weight = 500 g
4. Save → appears in list with preview of dimensions
5. Repeat for Envelope (30×22×1 cm), Medium box (25×20×15 cm, 2 kg), Large box (40×30×25 cm, 5 kg)

**Acceptance:** All fields required. Duplicate name within store is blocked. Packaging types are tenant-scoped (store_id). No other tenant sees them.

---

### J002 — System suggests packaging when merchant fulfills an order

**Actor:** Merchant-admin (fulfillment flow)
**Goal:** Know which box to grab before even opening the warehouse shelves

**Steps:**
1. Open order (status: "Ready to fulfill")
2. See "Suggested packaging" widget in the fulfillment section:
   *"Suggested: Small box (15×10×8 cm) — fits 2 items, 320 g total"*
3. Accept suggestion → "Confirmed: Small box"
4. If no suitable packaging: *"No packaging in your catalog fits this order — consider splitting or using a custom package"*

**Acceptance:** Suggestion calculated from sum of variant volumes × quantity and sum of variant weights × quantity. Smallest catalog entry where `packaging_volume ≥ total_item_volume × 1.2 AND packaging_max_weight ≥ total_weight` wins. Falls back to "no suggestion" if none qualifies.

---

### J003 — Merchant overrides packaging suggestion

**Actor:** Merchant-admin
**Goal:** Use a different box because the suggested one is out of stock today

**Steps:**
1. Fulfillment widget shows: *"Suggested: Small box"*
2. Merchant clicks "Change" → dropdown shows all active catalog entries
3. Selects "Medium box"
4. Override is recorded per shipment

**Acceptance:** Override stored on the fulfillment record in component state. Suggestions always recalculated fresh. Override does not modify the catalog.

---

### J004 — Shipmondo label generated with packaging dimensions

**Actor:** Merchant-admin
**Goal:** Skip manual box-dimension entry in Shipmondo

**Steps:**
1. After confirming packaging (J002 or J003), click "Generate label"
2. Shipmondo label request is pre-filled with: length, width, height, weight from confirmed packaging
3. Merchant reviews Shipmondo label preview — dimensions already populated
4. Confirm → label generated

**Acceptance:** Shipmondo `POST /shipments` payload includes `length`, `width`, `height`, `weight` from confirmed packaging type (converted to Shipmondo's expected units). Merchant can still edit dimensions in Shipmondo if needed.

---

### J005 — Merchant edits or deletes a packaging type

**Actor:** Merchant-admin
**Goal:** Remove a box size they no longer use

**Steps:**
1. Navigate to Settings → Packaging
2. Click Edit on "Small box" → update dimensions → Save
3. Click Delete → confirm → removed from catalog
4. Future orders show "Packaging removed — please re-select" where this type was used

**Acceptance:** Soft-delete: `deleted_at` timestamp. Historical fulfillment records retain dimension snapshot. Deleted types not shown in suggestion dropdown.

---

## Deliverables

### Backend — `@mercflow/packaging-module`

New Medusa module at `packages/packaging-module/`.

**DML model:**

```
PackagingType
├── id
├── store_id          NOT NULL — RLS policy
├── name              text — e.g. "Small box"
├── type              enum: 'box' | 'envelope' | 'bag' | 'tube' | 'other'
├── length_mm         int NOT NULL — stored in mm for integer precision
├── width_mm          int NOT NULL
├── height_mm         int NOT NULL
├── max_weight_g      int NOT NULL — max gross weight in grams
├── is_active         boolean default true
└── deleted_at        timestamp (nullable) — soft delete
```

> Dimensions stored in **mm** (integer). UI displays in cm (÷10). Weight stored in **g** (integer).

**Service methods:**
- `createPackagingType(input, storeId)`
- `updatePackagingType(id, input, storeId)`
- `deletePackagingType(id, storeId)` — soft delete
- `listPackagingTypes({ storeId, includeDeleted? })`
- `suggestPackaging({ items: [{variantId, quantity}], storeId })` → `PackagingType | null`
  - Queries `product_variant.length/width/height/weight` from Medusa fork
  - `totalVolumeMm3 = sum(L × W × H × qty) × 1.2` (volume buffer factor)
  - `totalWeightG = sum(weight_g × qty)`
  - Returns smallest qualifying `PackagingType` sorted by volume ascending

**Admin API routes:**
```
GET    /admin/packaging-types
POST   /admin/packaging-types
GET    /admin/packaging-types/:id
PUT    /admin/packaging-types/:id
DELETE /admin/packaging-types/:id

POST   /admin/packaging-types/suggest
       body: { items: [{ variant_id, quantity }] }
       → { suggested: PackagingType | null, total_volume_mm3, total_weight_g }
```

**RLS policy:**
```sql
CREATE POLICY packaging_types_tenant_isolation
  ON packaging_types
  USING (store_id = current_setting('app.tenant_id', true));
```

---

### Admin UI (`packages/admin-ui`)

**Settings → Packaging** (`/settings/packaging`):
- Table: name, type badge, dimensions (L×W×H cm), max weight, active status, edit/delete actions
- "Add packaging type" button → slide-over: name, type picker, dimension inputs (cm → stored as mm), max weight (g/kg), active toggle
- Empty state: *"No packaging types added yet. Add your first box, envelope, or bag."*
- Settings sidebar link: "Packaging" under Shipping section

**Order fulfillment widget** (added to existing order detail page):
- Location: Fulfillment section, above "Generate label" button
- Calls `POST /admin/packaging-types/suggest` with order line items
- Loading: skeleton while request resolves
- Success: packaging name + dimensions + utilisation indicator (`Math.round(totalVol / packagingVol × 100)%`)
- Override: "Change" button → dropdown of all active catalog entries
- No suggestion: contextual message + link to packaging settings
- Confirmed packaging ID passed to Shipmondo label generation

**Shipmondo connector update** (`packages/connector-module`):
- `generateLabel(fulfillmentId, packagingTypeId)` — resolves `PackagingType` from packaging-module service
- Injects dimensions (mm → cm / g → kg per Shipmondo spec) into `POST /shipments` payload
- Fallback: if `packagingTypeId` is null, label is generated without dimensions (no error)

---

## Packaging suggestion algorithm (v1)

Simple greedy algorithm — not a full 3D bin-packing solver:

```
1. For each item: fetch variant.length_mm, .width_mm, .height_mm, .weight_g (× quantity)
2. totalVolumeMm3 = sum(L × W × H × qty) × 1.2   // 1.2× buffer for packing inefficiency
3. totalWeightG   = sum(weight_g × qty)
4. candidates = catalog.filter(p =>
     (p.length_mm * p.width_mm * p.height_mm) >= totalVolumeMm3
     AND p.max_weight_g >= totalWeightG
     AND p.is_active AND p.deleted_at IS NULL
   )
5. Return candidates.sort((a, b) => volume(a) - volume(b))[0]  // smallest that fits
```

**Known approximation:** Does not account for item stacking orientation. The 1.2× buffer compensates in most practical cases. V2 can replace with a 3D packing algorithm.

---

## Success metrics

| Metric | Target |
|--------|--------|
| Merchant can create 5 packaging types | < 5 minutes total |
| Packaging suggestion latency | < 300ms p95 |
| Zero cross-tenant packaging data | 100% (test-covered) |
| Shipmondo label dimensions match confirmed packaging | Verified by integration test |
| Merchant accepts suggested packaging without override | > 70% of fulfillments (UX signal) |

---

## Open questions

| # | Question | Decision |
|---|----------|----------|
| OQ-01 | Where is confirmed packaging stored per fulfillment? On Medusa `fulfillment` entity (needs fork change) or MercFlow-owned join table? | **Prefer (b):** new `packaging_module.shipment_packaging` join table (`fulfillment_id`, `packaging_type_id`, `dimensions_snapshot_json`). Avoids touching Medusa core fulfillment entity. |
| OQ-02 | Should `suggestPackaging` be exposed to storefront? | V1: admin-only. Storefront exposure deferred. |
| OQ-03 | Volume buffer factor — hardcoded or per-tenant config? | V1: hardcoded 1.2× constant in service. Per-tenant config deferred. |
