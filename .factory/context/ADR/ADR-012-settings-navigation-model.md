# ADR-012 — Settings Navigation Model

> Date: 2026-06-12
> Status: accepted
> Related: PRD-settings-architecture.md (M016), PRD-admin-shell-navigation.md (M013)

---

## Context

MercFlow's Settings section has grown to 8+ pages. The current implementation uses a
flat card-based landing page at `/settings` — a merchant must go back to that page to
navigate between settings sections. Two models were considered:

**Option A — Persistent secondary sidebar (Shopify/Linear pattern):**
`/settings` auto-redirects to `/settings/general`. A secondary left sidebar with grouped
sub-items is always visible while anywhere under `/settings/*`.

**Option B — Settings overview page (card grid):**
`/settings` shows a grid of cards, one per section. Navigation between sections requires
returning to the overview.

The current implementation is Option B (shipped in M013). This ADR supersedes it for
the Settings section.

---

## Decision

**Option A — Persistent secondary sidebar + auto-redirect.**

`/settings` redirects to `/settings/general` immediately. No settings overview/landing page.

Settings sections are grouped into 7 merchant-mental-model domains:

```
Store         (General, Policies, SEO)
Sales         (Payments, Taxes, Checkout)
Shipping      (Profiles, Packaging, Carriers)
Customers     (Accounts, Returns)
Communication (Email, Notifications)
Team          (Users)
Apps          (Overview — global connector status)
Developers    (Custom data — metafield definitions)
```

> UI labels are English. Danish conceptual terms (Butik, Salg…) exist in planning
> docs only and must not appear in code or rendered UI.

App integrations (Stripe, Shipmondo, Plunk, GTM) configure contextually within their
relevant section (Betalinger, Fragtlabels, etc.) and are surfaced as a global status
overview at `/settings/apps`. This is the "Scenario B" apps model.

---

## Rationale

- **Mental model match.** Merchants navigate by task ("I want to configure shipping"), not
  by module ("I need the connector-module Shipmondo page"). Grouping by merchant domain
  eliminates mapping overhead.
- **Reduced round-trips.** Persistent sidebar lets a merchant switch from Email to
  Notifikationer in one click, without returning to an overview page. Shopify and Linear
  both use this pattern for settings.
- **Completeness signal.** The sidebar group headers (Butik, Salg, etc.) make the full
  settings surface discoverable at a glance — more efficient than a card grid that
  requires scrolling.
- **Apps overview as audit tool.** A global `/settings/apps` page where operators can
  see all connector statuses in one view satisfies the "what is connected?" question
  without making it the primary navigation path for each connector.

---

## Scope

- Applies to: `packages/admin-ui` — `SettingsShell` component, `router.tsx`, `settingsNav.ts`
- Does NOT apply to: main sidebar (M013 AppShell), Platform Console settings

---

## Consequences

1. `SettingsPage.tsx` (card grid) is removed and replaced by `SettingsShell` (layout with sidebar).
2. `settingsSections.ts` / `SETTINGS_LANDING_SECTIONS` is replaced by `settingsNav.ts` /
   `SETTINGS_NAV_GROUPS`.
3. A new `SettingsShell` layout route wraps all `/settings/*` children.
4. `/settings` renders a redirect to `/settings/general` (React Router `<Navigate>` or index redirect).
5. `/settings/connectors` and `/settings/store-details` get 301-style redirects to their
   new canonical paths.
6. New sections without feature pages get `SettingsPlaceholderPage`.

---

## Enforcement

```bash
# Verify no settings page uses the old card-landing config
rg "SETTINGS_LANDING_SECTIONS" packages/admin-ui/src/

# Verify /settings redirect exists
rg "settings.*general.*redirect\|Navigate.*general" packages/admin-ui/src/router.tsx

# Verify SettingsShell wraps settings routes
rg "SettingsShell" packages/admin-ui/src/router.tsx
```

CI: `pnpm typecheck && pnpm lint && pnpm react-doctor:admin-ui:ci` must pass.

---

## How to fix violations

| Violation | Fix |
|-----------|-----|
| Import of `SETTINGS_LANDING_SECTIONS` | Replace with `SETTINGS_NAV_GROUPS` from `@/config/settingsNav` |
| Settings route NOT wrapped in `SettingsShell` | Add `SettingsShell` as the layout element for `path: "settings"` in router |
| `/settings` route renders a page (not redirect) | Replace with `<Navigate to="/settings/general" replace />` |
| Old connector paths not redirected | Add redirect entries in router for `/settings/connectors` and `/settings/store-details` |
