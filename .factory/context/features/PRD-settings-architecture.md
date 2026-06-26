# PRD — Settings Architecture (M016)

> Version 1.0 — 2026-06-12
> Based on: /align session June 2026 (Settings deep-dive), Shopify settings gap analysis, CONTEXT.md
> Supersedes: Settings section of PRD-admin-shell-navigation.md (M013)
> Prerequisite: M013 (AdminShell + sidebar collapse) shipped or in progress

---

## Problem

MercFlow's current Settings is a flat card-landing page with 8 undifferentiated sections
(`General`, `Email`, `Shipping`, `Payments`, `Custom Data`, `SEO`, `Integrations`,
`Store details`). This design has four problems:

1. **Wrong mental model.** Sections are grouped by technical ownership (module), not by
   how a merchant thinks. A merchant looks for "Stripe" under Payments, not Integrations.
   She looks for "politikker" under something called "Butik", not "Store details".

2. **No persistent sub-navigation.** When inside a settings section, the merchant has no
   quick way to jump to a sibling section — she must go back to the cards landing page.
   Deep settings pages feel isolated.

3. **Critical settings don't exist yet.** Politikker (GDPR-required), Skatter, Kasse,
   Kundekonti, Returregler, Team are all absent. The current 8 sections are incomplete.

4. **Apps/integrations model is wrong.** Connector config for Stripe and Shipmondo lives
   in a generic "Integrations" section instead of surfacing contextually where the
   merchant expects it (Stripe under Betalinger, Shipmondo under Forsendelse).

---

## Goals

1. Settings has a **persistent secondary sidebar sub-navigation** (Model A) — always visible
   when the merchant is anywhere under `/settings/*`. Group labels + sub-items.
2. `/settings` **auto-redirects** to `/settings/general` — no settings landing/overview page.
3. Settings sections follow the **merchant's mental model** grouped into 7 domains.
4. Each section that currently exists is mapped to the correct new URL and group.
5. **Apps model** (Scenario B): a global `/settings/apps` overview page shows all connected
   apps with status; configuration happens contextually within the relevant section.
6. Existing pages are **moved/renamed**, not removed. No functionality deleted.

---

## Non-goals (explicit)

- **Building new feature pages** — this milestone moves and reorganises existing pages,
  and provides placeholder pages for sections not yet implemented. Actual feature work
  (e.g., Politikker rich-text editor, Skatter region config) is separate milestones.
- **Global search across settings** — deferred.
- **Settings onboarding prompts** (e.g., "Email domain not verified" banner) — separate.
- **Dark mode** — explicitly out of scope per project rules.
- **Role-based settings hiding** — deferred to Platform Console milestone.

---

## Navigation structure (canonical)

> **Language:** UI labels are **English** (code identifiers, displayed text). Danish terms
> used elsewhere in this PRD (Butik, Salg, Forsendelse…) are planning shorthand — not
> the strings rendered in the sidebar. `SETTINGS_NAV_GROUPS` config uses English.
> i18n is out of scope for M016.

```
Settings (persistent sidebar sub-nav while on any /settings/* route)
│
├── Store
│   ├── General           /settings/general
│   ├── Policies          /settings/policies
│   └── SEO               /settings/seo
│
├── Sales
│   ├── Payments          /settings/payments          (Stripe config surfaces here)
│   ├── Taxes             /settings/taxes
│   └── Checkout          /settings/checkout
│
├── Shipping
│   ├── Profiles          /settings/shipping
│   ├── Packaging         /settings/shipping/packaging
│   └── Carriers          /settings/shipping/carriers (Shipmondo config surfaces here)
│
├── Customers
│   ├── Accounts          /settings/customer-accounts
│   └── Returns           /settings/returns
│
├── Communication
│   ├── Email             /settings/email
│   └── Notifications     /settings/notifications
│
├── Team
│   └── Users             /settings/team
│
├── Apps
│   └── Overview          /settings/apps
│
└── Developers
    └── Custom data       /settings/custom-data
```

---

## URL migrations (existing → new)

| Current path | New canonical path | Notes |
|---|---|---|
| `/settings` | `/settings/general` (redirect) | Remove card landing page |
| `/settings/general` | `/settings/general` | Unchanged |
| `/settings/email` | `/settings/email` | Unchanged |
| `/settings/shipping/packaging` | `/settings/shipping/packaging` | Unchanged |
| `/settings/shipping/carriers` | `/settings/shipping/carriers` | Unchanged |
| `/settings/payments` | `/settings/payments` | Unchanged |
| `/settings/custom-data` | `/settings/custom-data` | Move group to Developers |
| `/settings/seo` | `/settings/seo` | Move group to Store |
| `/settings/connectors` | `/settings/apps` | Rename Integrations → Apps overview |
| `/settings/store-details` | `/settings/general` or `/settings/policies` | Merge into Store sub-sections |
| — | `/settings/policies` | New (placeholder) |
| — | `/settings/taxes` | New (placeholder) |
| — | `/settings/checkout` | New (placeholder) |
| — | `/settings/customer-accounts` | New (placeholder) |
| — | `/settings/returns` | New (placeholder) |
| — | `/settings/notifications` | New (placeholder) |
| — | `/settings/team` | New (placeholder → existing TeamSettingsPage) |

---

## User journeys

### J001 — Merchant configures Stripe from Betalinger

**Actor:** Merchant-admin (first-time setup)
**Goal:** Find Stripe configuration without knowing it was in "Integrations" before

**Steps:**
1. Merchant clicks "Settings" in main sidebar
2. `/settings` redirects to `/settings/general` — sees General settings page
3. Secondary settings sidebar is visible — merchant sees "Salg" group with "Betalinger" sub-item
4. Clicks Betalinger → `/settings/payments`
5. Stripe configuration section is visible on the page
6. Merchant configures Stripe API keys

**Acceptance:** Stripe config is reachable via Settings → Salg → Betalinger. The old
`/settings/connectors` Stripe card is no longer the primary entry point.

---

### J002 — Merchant navigates between settings sections without backtracking

**Actor:** Merchant-admin
**Goal:** Jump from Email settings to Notifikationer without returning to a landing page

**Steps:**
1. Merchant is on `/settings/email` (EmailSettingsPage)
2. Secondary settings sidebar shows Kommunikation group with Email (active) + Notifikationer
3. Merchant clicks Notifikationer → `/settings/notifications` directly
4. Active state in sidebar updates — no full page reload of sidebar

**Acceptance:** Secondary sidebar persists across all `/settings/*` routes. Sub-items
within the active group are visible without expanding. No round-trip through a landing page.

---

### J003 — Merchant views Apps overview to check which connectors are active

**Actor:** Merchant-admin
**Goal:** Get a quick overview of which apps are connected and which have errors

**Steps:**
1. Merchant clicks "Apps" in secondary settings sidebar → `/settings/apps`
2. Sees a list of all connector-module apps (Stripe, Shipmondo, Plunk, GTM)
3. Each app shows: name, description, status badge (Connected / Error / Not configured)
4. Clicking an app's "Configure" link navigates to the contextual settings page
   (Stripe → `/settings/payments`, Shipmondo → `/settings/shipping/carriers`)

**Acceptance:** `/settings/apps` overview page exists. Connector status is visible without
navigating to each section individually. Links go to contextual config, not a modal.

---

### J004 — Merchant on a placeholder page understands what's coming

**Actor:** Merchant-admin trying to access Politikker
**Goal:** Understand that Politikker settings exist but are not yet implemented

**Steps:**
1. Merchant clicks Settings → Butik → Politikker
2. Lands on `/settings/policies` — placeholder page
3. Page shows: section title, brief description of what will be here, "Coming soon" callout
4. Merchant is not confused — clearly a planned feature, not a broken page

**Acceptance:** All new sections without feature pages show a clean placeholder.
No 404s. Breadcrumb/sidebar still works correctly.

---

## Deliverables

### `packages/admin-ui` — settings shell

**`SettingsShell` component** (new):
- Renders a two-column layout: secondary sidebar (left) + `<Outlet />` (right)
- Used as a React Router layout route for all `/settings/*` paths
- Secondary sidebar renders `SETTINGS_NAV_GROUPS` config
- Active group auto-expands; active item highlighted
- Replaces `SettingsPage.tsx` (card landing) as the settings entry point

**`SETTINGS_NAV_GROUPS` config** (replaces `SETTINGS_LANDING_SECTIONS`):
- Typed config: `{ group: string, items: { label, path, icon }[] }[]`
- Single source of truth for sidebar + redirect logic
- Exported from `@/config/settingsNav.ts`

**`/settings` redirect:**
- Router index route for `settings/` redirects to `/settings/general`
- `SettingsPage.tsx` (card grid) is removed

**Placeholder page component:**
- Reusable `SettingsPlaceholderPage` accepting `title` + `description` props
- Used for: Politikker, Skatter, Kasse, Kundekonti, Returregler, Notifikationer

**Route updates in `router.tsx`:**
- Add `/settings` layout route using `SettingsShell`
- Add all new placeholder routes
- Add redirect from `/settings` → `/settings/general`
- Add redirect from `/settings/connectors` → `/settings/apps`
- Add redirect from `/settings/store-details` → `/settings/general`

**`/settings/apps` overview page** (`AppsOverviewSettingsPage`):
- Lists all connector-module connectors with status
- Status derived from connector-module API (`GET /admin/connectors`)
- Links to contextual config pages
- Replaces `ConnectorsPage.tsx` as the primary connector overview

---

## Success metrics

| Metric | Target |
|---|---|
| `/settings` redirects to `/settings/general` in < 50ms | Verified |
| Secondary settings sidebar visible on all `/settings/*` routes | 100% |
| All existing settings pages accessible via new sidebar | 100% |
| No 404s on any settings route (old or new) | 100% |
| `/settings/apps` shows status for all 4 connectors | Verified |
| `pnpm react-doctor:admin-ui` — 0 issues | 100% |
| `pnpm typecheck` passes with 0 errors | Verified |

---

## Open questions

| # | Question | Decision |
|---|----------|----------|
| OQ-01 | Where does Custom Data (metafields) live in the new grouping? | **Resolved:** Own group — "Udviklere" — with Custom Data (`/settings/custom-data`) as sub-item. |
| OQ-02 | Secondary sidebar: does it collapse independently or does it share the main sidebar collapse state? | Assume independent — settings sidebar is always full-width within its panel. |
| OQ-03 | Politikker placeholder vs. immediate rich-text implementation — should this milestone include the actual Politikker page? | Separate milestone. This PRD covers navigation shell only. |

---

## Dependencies

| Dependency | Status |
|---|---|
| M013 AdminShell (main sidebar, collapse, breadcrumbs) | In progress / prerequisite |
| M012 Email settings (EmailSettingsPage at `/settings/email`) | Done — referenced |
| connector-module GET /admin/connectors status API | Must expose status field for Apps overview |
