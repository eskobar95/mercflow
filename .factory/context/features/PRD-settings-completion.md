# PRD — Settings Completion (M022)

> Version 1.0 — 2026-06-14
> Based on: /align session June 2026, PRD-settings-architecture.md (M016), CONTEXT.md
> Prerequisite: M016 (Settings shell + sidebar nav in place)
> Parallel with: M021 (Security Hardening)

---

## Problem

M016 delivered the Settings navigation shell: persistent secondary sidebar, merchant-mental-model groupings, and auto-redirect from `/settings` to `/settings/general`. However, 9 out of 14 settings pages are **placeholder pages** — they exist in the routing table but show no functional content.

A new tenant who onboards via M019/M020 lands in Store Admin with no way to:
- Set their store name, contact details, or timezone
- Configure tax rates for their region
- Set up shipping zones and rates
- Invite team members (employees)
- Configure email branding for their transactional emails
- Connect and configure their apps (Shipmondo, GTM, Plunk)
- Find their API keys or manage webhook endpoints

This blocks any tenant from going live without operator assistance.

---

## Goals

1. All settings pages listed below are fully functional — no placeholders.
2. A new tenant can configure their entire store from Settings without operator help.
3. Every page wraps an existing backend API — no new modules or DB migrations in this milestone.
4. Pages follow the design token system — no hardcoded values, no Tailwind arbitrary values.
5. `pnpm react-doctor:admin-ui` → 0 issues across all new pages.

---

## Non-goals (explicit)

- **New backend modules** — all required APIs already exist (Medusa core, connector-module, payment-module, notification-module, subscription-module).
- **Policies/legal text editor** (`/settings/policies`) — deferred; requires rich text + versioning design.
- **Checkout settings** (`/settings/checkout`) — deferred; Medusa checkout config scope is complex.
- **Customer accounts settings** (`/settings/customer-accounts`) — deferred; B2B flag + account model needs alignment.
- **Returns settings** (`/settings/returns`) — deferred; return policy + automation rules need separate PRD.
- **Dark mode** — explicitly out of scope per project rules.
- **Mobile-first responsive redesign** — admin is desktop-primary; basic responsiveness only.

---

## Pages in scope

### 1. General — `/settings/general`

**What it wraps:** Medusa `GET/POST /admin/stores/:id`

**Fields:**
- Store name (text)
- Contact email (email input, validated)
- Default currency (select — from `GET /admin/currencies`)
- Timezone (select — IANA timezone list)
- Address (street, city, postal code, country)

**UX:** Single-page form with save button. Unsaved changes prompt on navigate-away (reuse pattern from product form).

---

### 2. Taxes — `/settings/taxes`

**What it wraps:** Medusa `GET/POST /admin/tax-regions`, `GET/POST /admin/tax-rates`

**Fields:**
- Tax regions list (country + name + rate %)
- Add/edit/delete tax region
- Override rates per product type (optional in v1 — show if Medusa supports it cleanly)

**UX:** List view + slide-over or inline add form. Shows "No tax regions configured" empty state with add CTA.

---

### 3. Shipping — `/settings/shipping`

**What it wraps:** Medusa `GET/POST /admin/shipping-profiles`, `GET/POST /admin/shipping-options`; Shipmondo config in `connector-module`

**Fields (Profiles tab):**
- Shipping profiles list (name, type)
- Add/edit/delete profile

**Fields (Rates tab):**
- Shipping options list per profile (name, carrier, price, conditions)
- Add/edit/delete option (flat rate, weight-based, free over threshold)

**Note:** Shipmondo credential config lives at `/settings/shipping/carriers` (already scoped in M016) — this page is the zones/rates layer above it.

**UX:** Tab layout: Profiles | Rates. Rates scoped to selected profile.

---

### 4. Carriers — `/settings/shipping/carriers`

**What it wraps:** `connector-module` Shipmondo config (`GET/POST /admin/connectors/shipmondo`)

**Fields:**
- Shipmondo API key (masked input, save + test connection)
- Sender name + address (used on shipping labels)
- Enable/disable toggle

**UX:** Single connector config card. "Test connection" button calls a validation endpoint. Shows "Connected" / "Error" / "Not configured" status badge.

---

### 5. Team — `/settings/team`

**What it wraps:** Clerk Organization Members API (via a MercFlow backend proxy route if not already present)

**Fields:**
- Members list: avatar, name, email, role (Admin / Staff), joined date
- Invite by email (email input + role select → sends Clerk invitation)
- Revoke access (remove from Clerk org)
- Change role (Admin ↔ Staff)

**UX:** Table with row actions (Change role, Revoke). Invite form at top. Empty state: "Your team is just you for now — invite colleagues."

**Backend:** If a Clerk org-members proxy route doesn't exist in `apps/backend`, create it as part of this task (`GET /admin/team/members`, `POST /admin/team/invite`, `DELETE /admin/team/members/:id`). Zod-validated per M021 patterns.

---

### 6. Notifications — `/settings/notifications`

**What it wraps:** `notification-module` branding config + template enable/disable

**Fields:**
- From name (text — e.g. "Guapo Store")
- Reply-to email (email input)
- Logo URL (upload or URL input)
- Brand color (hex color picker)
- Template toggles: Order confirmation, Shipping update, Cancellation — each with enable/disable switch and "Preview" link

**UX:** Form sections (Branding | Templates). Save button. Preview opens a modal with a rendered email preview (use existing React Email renderer if available).

---

### 7. Email — `/settings/email`

**What it wraps:** `notification-module` SES domain identity (`GET/POST /admin/notification/domains`)

**Fields:**
- Sending domain (text input — e.g. `mail.mystore.com`)
- Domain verification status badge (Pending / Verified / Failed)
- DNS record guidance (DKIM + SPF records shown after domain entry)
- "Verify now" button (re-checks SES verification status)
- Default from address (e.g. `noreply@mail.mystore.com`)

**UX:** Step-by-step layout — enter domain → copy DNS records → verify. Already mostly implemented in M012; verify this page is complete and polished.

---

### 8. Apps overview — `/settings/apps`

**What it wraps:** `connector-module` connector status (`GET /admin/connectors`)

**Fields:**
- Grid of connector cards: Stripe, Shipmondo, Plunk, GTM
- Each card: logo, name, short description, status badge (Connected / Error / Not configured)
- "Configure" link → navigates to contextual settings page (not a modal)

**UX:** 2-column card grid. Status badges auto-refresh on mount. No config on this page itself.

---

### 9. Developers — `/settings/custom-data` + new `/settings/developers`

**What it wraps:** Medusa `GET /admin/api-keys` (publishable keys), future webhook endpoint management

**Fields (API Keys tab):**
- Publishable API key (created during provisioning — read-only display + copy button)
- Revoke + regenerate option (with confirmation dialog)

**Fields (Webhooks tab — v1 placeholder):**
- "Webhook management coming soon" — informational only in v1

**UX:** Tab layout: API Keys | Webhooks. Copy-to-clipboard on key field.

---

## User journeys

### J001 — New tenant configures store before going live

**Actor:** New merchant (just onboarded)
**Goal:** Complete all required settings without calling support

**Steps:**
1. Lands in Store Admin → Settings → General → fills name, email, currency, timezone → Save
2. Settings → Sales → Taxes → adds Denmark VAT 25% → Save
3. Settings → Shipping → adds "Standard Shipping DK" flat rate → Save
4. Settings → Shipping → Carriers → enters Shipmondo API key → Test connection → Connected
5. Settings → Communication → Notifications → sets from name + logo → Save
6. Settings → Team → invites colleague by email as Staff → invite sent

**Acceptance:** All 6 steps complete without operator assistance. Data persists on page refresh.

---

### J002 — Merchant invites a team member

**Actor:** Merchant-admin
**Goal:** Invite employee to access Store Admin

**Steps:**
1. Settings → Team → "Invite member" → enters email, selects "Staff" role → Send
2. Employee receives Clerk invitation email → accepts → lands in Store Admin
3. Merchant sees employee in team list with "Staff" role badge

**Acceptance:** Clerk invitation sent. Employee can log in within 5 minutes. Merchant sees them in the list.

---

### J003 — Merchant checks which apps are connected

**Actor:** Merchant-admin
**Goal:** Quick overview of integration status without navigating each section

**Steps:**
1. Settings → Apps → sees Stripe (Connected), Shipmondo (Connected), Plunk (Not configured), GTM (Not configured)
2. Clicks "Configure" on Plunk → navigates to `/settings/communication` or a Plunk-specific page
3. Configures Plunk API key

**Acceptance:** Apps overview renders all 4 connectors. Status reflects actual connector config. Navigate-to-config links work.

---

### J004 — Merchant finds their API key for storefront integration

**Actor:** Merchant-admin (technical)
**Goal:** Get publishable API key to configure their storefront

**Steps:**
1. Settings → Developers → API Keys tab
2. Sees publishable key (partially masked) with copy icon
3. Clicks copy → key copied to clipboard

**Acceptance:** Key displayed correctly. Copy works. Matches key created during provisioning.

---

## Deliverables

| Page | Route | Backend wraps |
|------|-------|---------------|
| General | `/settings/general` | Medusa store API |
| Taxes | `/settings/taxes` | Medusa tax-regions + tax-rates API |
| Shipping | `/settings/shipping` | Medusa shipping-profiles + shipping-options |
| Carriers | `/settings/shipping/carriers` | `connector-module` Shipmondo |
| Team | `/settings/team` | Clerk org members (via backend proxy) |
| Notifications | `/settings/notifications` | `notification-module` branding + template toggles |
| Email | `/settings/email` | `notification-module` SES domain identity |
| Apps overview | `/settings/apps` | `connector-module` connector status |
| Developers | `/settings/developers` | Medusa publishable API keys |

All pages: token-backed styling, loading states, error states, empty states, `pnpm react-doctor:admin-ui` 0 issues.

---

## Success metrics

| Metric | Target |
|--------|--------|
| Settings pages still showing placeholder content | 0 |
| New tenant can complete full setup without operator help | ✓ (verified via J001) |
| `pnpm react-doctor:admin-ui` issues introduced | 0 |
| `pnpm typecheck` + `pnpm lint` | green |
| Pages with missing loading or error states | 0 |

---

## Open questions

| # | Question | Decision |
|---|----------|----------|
| OQ-01 | Does a Clerk org-members backend proxy route exist? | Check in T096 — create if missing |
| OQ-02 | Does `/settings/email` need work, or is M012 complete enough? | Verify in T097 — polish only if functional |
| OQ-03 | Plunk config — does it have a settings page route or only connector-module API? | Check connector-module admin routes; add UI if missing |
| OQ-04 | Shipping `connector-module` Shipmondo — does a settings page already exist from Batch 1? | Verify; build if missing |
