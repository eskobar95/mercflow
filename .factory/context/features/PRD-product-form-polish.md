# PRD — Product Form Polish (M009)

> Version 1.0 — 2026-06-10
> Based on: Shopify product create/view browser test (June 2026), CONTEXT.md, existing MercFlow admin-ui patterns
> Prerequisite: M008 Metafields (standard library + product form infrastructure)

---

## Problem

The MercFlow product form is a functional Medusa port, but several friction points make daily merchant workflows slower and more error-prone than they need to be:

1. **No unsaved-state signal.** Merchants navigate away and silently lose work. There is no "unsaved changes" indicator on the page or browser tab title.

2. **Variant UX is complex by default.** The current variant interface exposes the full Medusa variant grid immediately. Shopify's approach — a single "Add options" CTA that reveals complexity only when needed — dramatically reduces friction for simple products.

3. **SEO preview is always empty.** The SEO section renders a preview widget even when no title or description has been entered, creating a confusing blank box. Shopify only renders the preview once there is content.

4. **Physical vs digital product is not surfaced.** Medusa's `product_variant` has fulfillment-related flags, but there is no visible toggle that distinguishes "this product ships physically" from "this is a digital download". Shipping fields (weight, dimensions) are irrelevant for digital products and should collapse.

5. **Product dimensions are hidden.** Medusa's `product_variant` already has `length`, `width`, `height`, and `weight` columns but the MercFlow admin form does not expose them. These are a hard prerequisite for M010 (packaging bin-packing calculation).

---

## Goals

1. Merchants see a clear "unsaved changes" indicator when the product form has been modified but not saved.
2. Variant options are added via a single "Add options" CTA. The full variant grid only appears after at least one option is defined.
3. The SEO preview widget shows a contextual help text ("Fill in title and description to preview…") until fields are populated, then transitions to a live snippet preview.
4. A **"Physical product"** toggle (on by default) collapses all shipping-related fields (weight, dimensions, origin country, HS code) when turned off.
5. Product variant dimensions (L×W×H + weight) are exposed on the product form — required for M010 packaging calculations.

---

## Non-goals (explicit)

- **AI text generation** ("Generer tekst") — deferred to M011 (requires AI provider integration decisions).
- **Sales channels & publishing widget** — deferred to a dedicated milestone.
- **Markets / multi-market publishing** — out of scope.
- **Keyboard shortcut system** — nice-to-have, not in v1.
- **3D model / video media** — current media support (images) not changing in M009.
- **Variant-level metafields** — deferred per M008 non-goals.
- **Bulk variant edit table** — deferred.

---

## User journeys

### J001 — Merchant adds variants with "Add options" CTA

**Actor:** Merchant-admin
**Goal:** Create a T-shirt with sizes S, M, L without understanding Medusa's variant model

**Steps:**
1. Open "Create product"
2. See Variants section with single CTA: *"Add options like size or color"*
3. Click CTA → inline form expands: option name = "Size", values = "S, M, L"
4. Save → variant grid appears with 3 rows (S / M / L), each with price + inventory fields
5. Optionally add a second option ("Color") → grid expands to S×M×L × color

**Acceptance:** Variant section starts collapsed. Grid renders only after first option is added. No "Default Title" variant shown for simple products.

---

### J002 — Merchant navigates away with unsaved changes

**Actor:** Merchant-admin
**Goal:** Not lose work when accidentally clicking away

**Steps:**
1. Fill in product title and price
2. Click "Products" in sidebar without saving
3. Browser shows native confirmation: *"You have unsaved changes. Leave anyway?"*

**Acceptance:** Page `<title>` reflects unsaved state (`• Unsaved — Product title`). Navigation away triggers browser `beforeunload`. Saving clears the indicator.

---

### J003 — Merchant fills SEO fields and sees live preview

**Actor:** Merchant-admin
**Goal:** Understand how the product will appear in Google before saving

**Steps:**
1. Product form loads — SEO section shows: *"Add a title and description to preview how this product will appear in search results"*
2. Merchant types SEO title → preview snippet updates live
3. Description fills → full Google snippet renders (URL / Title / Description)
4. Character count indicator turns red when over limit (60 chars title, 160 chars description)

**Acceptance:** Empty state is instructional text, not a blank preview box. Preview renders live on keystroke (debounced 300ms). Character counters present.

---

### J004 — Merchant creates a digital product (no shipping)

**Actor:** Merchant-admin
**Goal:** Create a PDF download product without irrelevant shipping fields cluttering the form

**Steps:**
1. Create product
2. In the Shipping section: toggle *"Physical product"* → OFF
3. All shipping fields collapse: weight, dimensions, origin country, HS code disappear
4. Save — product saved with `requires_shipping = false` on variants

**Acceptance:** Toggle default is ON. Toggle OFF collapses shipping section with animation. Medusa `requires_shipping` flag set accordingly on all variants.

---

### J005 — Merchant fills product dimensions (prerequisite for M010)

**Actor:** Merchant-admin
**Goal:** Enter product box dimensions so the packaging calculator (M010) can suggest the right packaging

**Steps:**
1. Open product → Shipping section (Physical product = ON)
2. See dimension inputs: Length (cm), Width (cm), Height (cm), Weight (g/kg)
3. Fill values per variant (or use "Apply to all variants" shortcut for identical sizes)
4. Save → values persisted to `product_variant.length`, `.width`, `.height`, `.weight`

**Acceptance:** Dimension fields are on the variant level (matching Medusa's schema). "Apply to all variants" button propagates values with confirmation. Fields hidden when "Physical product" = OFF.

---

## Deliverables

### Admin UI changes (`packages/admin-ui`)

**Variant section refactor:**
- Initial state: empty with single `+ Add options like size or color` CTA-button
- Clicking CTA → inline option builder: name input + comma-separated values input
- After first option saved: variant grid appears
- Subsequent options addable with `+ Add another option`
- Existing variant edit/delete/price/inventory UX preserved once grid is rendered

**Unsaved state:**
- Track form dirty state via React Hook Form `isDirty`
- Page `<title>` updated to prepend `• ` when dirty
- `beforeunload` handler when dirty; cleanup on unmount and successful save

**SEO section:**
- Conditional render: if `seoTitle || seoDescription` → snippet preview; else → instructional empty state
- Character count badge on title (60) and description (160 char soft limit)
- Live update on keystroke (debounced 300ms)

**Physical product toggle:**
- Toggle in Shipping section header (default ON)
- Controlled collapse of: weight, length, width, height, origin country, HS code
- Maps to `product.variants[].requires_shipping` — set all variants when toggled at product level

**Dimension fields:**
- Added to Shipping section when Physical = ON
- Per variant: `length_cm`, `width_cm`, `height_cm`, `weight_g`
- Unit selectors where needed; stored to Medusa's existing variant fields
- "Apply to all variants" button with confirmation when variants have existing differing values
- Read/write via Medusa Admin JS SDK `product_variant.length/width/height/weight`

### Backend — no new module

All dimension fields (`length`, `width`, `height`, `weight`) and `requires_shipping` already exist on `product_variant` in Medusa. No migration required.

---

## Success metrics

| Metric | Target |
|--------|--------|
| Time to create product with 3 size variants | < 2 min (from title to saved) |
| Zero accidental data loss on navigation | 100% (unsaved warning fires) |
| SEO preview renders when fields are non-empty | 100% |
| Dimension fields persisted correctly | Verified by unit test (write + read round-trip) |

---

## Open questions

| # | Question | Decision |
|---|----------|----------|
| OQ-01 | Medusa stores `length`/`width`/`height` on variant — verify unit convention in fork (mm? cm?) before implementing. | Implementing agent must check Medusa fork before any unit conversion logic. Do not convert in DB; apply in UI only. |
| OQ-02 | "Apply to all variants" — show confirmation when variants have different existing values? | Yes — show confirmation listing how many variants will be overwritten. |
