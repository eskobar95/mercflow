# PRD — Admin Shell & Navigation (M013)

> Version 1.0 — 2026-06-11
> Based on: /align session June 2026, CONTEXT.md, Shopify admin navigation reference
> Prerequisite: M012 (Settings → Email must exist before navigation reorganisation)

---

## Problem

The MercFlow Store Admin has grown organically — each feature milestone added its own pages and settings without a unified navigation hierarchy. The result:

1. **No clear information architecture.** Merchants cannot predict where to find things. SEO settings, email settings, packaging, metafields, and integrations are scattered without logical grouping.
2. **Settings is a flat list.** All settings pages share one level — there is no distinction between frequently-used settings (General, Email) and infrequently-used ones (SEO infrastructure, API keys).
3. **No breadcrumb context.** Deep pages (e.g., a single order's detail) give no indication of location in the hierarchy.
4. **Sidebar does not communicate product structure.** Products, Categories, and Inventory are logically one domain but may not be visually grouped.
5. **Mobile/narrow viewport is not handled.** The sidebar collapses but no hamburger/drawer exists for narrow screens.

---

## Goals

1. A sidebar navigation that groups all features into a clear, predictable hierarchy — first-time users can find any feature within 2 clicks.
2. All settings pages are organised under a single Settings section with logical sub-groups (General, Email, Shipping, Payments, Data, Integrations).
3. Breadcrumbs on all detail pages (Order #1234 → Orders).
4. Sidebar collapses to icon-only mode on medium viewports; drawer on mobile.
5. Active state clearly shows current location in hierarchy.

---

## Non-goals (explicit)

- **New feature pages** — this milestone moves and reorganises existing pages. No new functionality added to any page.
- **Dashboard/Home analytics** — placeholder home screen only; full analytics is a separate milestone.
- **Marketing section** — deferred (no marketing features built yet).
- **User permissions / role-based navigation hiding** — deferred to M014+ (Platform Console introduces roles).
- **Dark mode** — explicitly out of scope per project rules.

---

## Target navigation structure

```
Sidebar
├── Home                          ← dashboard placeholder
├── Orders
│   ├── Orders
│   └── Drafts (if applicable)
├── Products
│   ├── Products
│   ├── Categories
│   └── Inventory
├── Customers
├── Content
│   ├── Articles
│   ├── Pages
│   └── Media
└── Settings
    ├── General          (store name, currency, timezone, contact email)
    ├── Email            (M012 — domain, branding, delivery)
    ├── Shipping
    │   ├── Packaging    (M010 — packaging catalog)
    │   └── Carriers     (Shipmondo / connector-module)
    ├── Payments         (Stripe — connector-module)
    ├── Custom Data      (M008 — metafield definitions)
    ├── SEO              (M001-M002 — sitemap, robots, redirects)
    ├── Integrations     (connector-module — GTM, Plunk, etc.)
    └── Store details    (domain, branding, legal)
```

---

## User journeys

### J001 — Merchant finds Email settings from anywhere in admin

**Actor:** Merchant-admin
**Goal:** Locate Settings → Email without knowing where it was before the redesign

**Steps:**
1. Merchant is on Products page
2. Clicks "Settings" in sidebar → Settings landing page with sub-section cards
3. Sees "Email" card with description "Sending domain, branding, delivery history"
4. Clicks → `/settings/email`

**Acceptance:** Settings landing page exists with cards for all sub-sections. Each card has icon, title, one-line description. No more than 2 clicks from any page to any settings page.

---

### J002 — Merchant navigates Order detail and returns to list

**Actor:** Merchant-admin
**Goal:** Open an order, view details, return to list with context preserved

**Steps:**
1. Merchant is on Orders list with active filters (last 7 days, status: unfulfilled)
2. Clicks order row → Order detail page
3. Breadcrumb shows: `Orders / #1234`
4. Clicks "Orders" in breadcrumb → returns to list (filters preserved via URL state)

**Acceptance:** Breadcrumbs present on all detail pages. Breadcrumb links work. List filters survive navigation via URL params.

---

### J003 — Sidebar collapses on medium viewport

**Actor:** Merchant-admin on laptop (1024–1280px viewport)
**Goal:** More screen space for content without losing navigation

**Steps:**
1. Merchant clicks collapse toggle (chevron icon) on sidebar
2. Sidebar shrinks to icon-only rail (48px wide)
3. Hovering icon shows tooltip with section name
4. Clicking icon navigates to section
5. Toggle expands sidebar back to full width

**Acceptance:** Collapse state persisted in localStorage. No layout shift on page navigation. Icons are recognisable without labels.

---

### J004 — Merchant finds Packaging settings via Shipping sub-section

**Actor:** Merchant-admin (new to MercFlow)
**Goal:** Find the packaging catalog without knowing it's under Shipping

**Steps:**
1. Merchant opens Settings
2. Sees "Shipping" card → clicks
3. Settings → Shipping shows two sub-items: "Packaging" and "Carriers"
4. Clicks "Packaging" → `/settings/packaging`

**Acceptance:** Settings has two-level navigation for sections with sub-items (Shipping, Payments). Sub-items visible without expanding — shown as indented list under parent card or as a settings sidebar sub-nav.

---

## Deliverables

### `packages/admin-ui` — navigation components

**`AppShell` component** (new or refactored):
- Sidebar with grouped navigation items
- Collapse/expand toggle — persisted in localStorage
- Mobile drawer (hamburger at < 768px)
- `NavGroup` component: label + icon + children items
- `NavItem` component: icon, label, active state, badge (for notification count — future)
- Settings section uses `NavGroup` with sub-items

**Settings landing page** (`/settings`):
- Grid of cards — one per settings sub-section
- Card: icon, title, description, link
- Sections: General, Email, Shipping (→ Packaging + Carriers), Payments, Custom Data, SEO, Integrations, Store details

**Breadcrumb component**:
- Used on all detail pages and second-level pages
- `<Breadcrumb items={[{ label: 'Orders', href: '/orders' }, { label: '#1234' }]} />`
- Respects URL params on list links

**Route reorganisation**:
- Existing pages moved to correct URL paths if needed (e.g., SEO settings to `/settings/seo`)
- 301 redirects from old paths where applicable

---

## Success metrics

| Metric | Target |
|--------|--------|
| Any feature findable in ≤ 2 clicks from sidebar | 100% (manual smoke test) |
| Settings landing page has card for every settings section | 100% |
| Breadcrumbs on all detail pages | 100% |
| Sidebar collapse/expand works on 1024–1280px | Verified |
| `pnpm react-doctor:admin-ui` 0 issues | 100% |

---

## Open questions

| # | Question | Decision |
|---|----------|----------|
| OQ-01 | Home/dashboard page content for v1? | Placeholder with "Welcome to MercFlow" + quick-action cards (Create product, View orders, Configure email). Full analytics deferred. |
| OQ-02 | Settings sub-navigation: sidebar sub-nav or breadcrumb-style? | Sidebar sub-nav (indented items under parent) — consistent with Shopify pattern. |
