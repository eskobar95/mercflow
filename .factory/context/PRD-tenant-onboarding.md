# PRD — Tenant Onboarding (M019)

> Version 1.0 — 2026-06-13
> Based on: /align session June 2026, CONTEXT.md
> Scope: Invitation-based self-service onboarding — signup flow, Stripe platform billing, auto-provisioning

---

## Problem

MercFlow is a multi-tenant SaaS platform, but tenant onboarding is currently a manual, operator-executed CLI process:

1. Operator runs `pnpm provision-tenant` via SSH on the Hetzner server
2. Operator manually creates a Clerk user, assigns org membership
3. Operator manually adds Traefik domain routing
4. No Stripe platform billing — tenants are not billed for using MercFlow

This approach does not scale beyond internal use. It also means there is no self-contained "MercFlow is a product you can sign up for" experience — even for vetted merchants invited by the team.

The goal is to build the complete self-service infrastructure (signup, billing, provisioning) while controlling access via an invitation gate in Platform Console. When MercFlow is ready to go fully public, the gate is removed — no infrastructure rebuild needed.

---

## Goals

1. An operator in Platform Console can invite a new merchant by entering their email — a time-limited invite link is sent automatically.
2. A merchant who receives an invite follows a guided signup flow: Clerk account creation, store details, domain input, Stripe billing setup.
3. Provisioning is automated: Medusa Store, Sales Channel, Publishable API Key, Clerk Admin org membership, and Traefik domain routing are all created programmatically on signup completion.
4. Stripe platform billing: a MercFlow subscription (monthly fee) is created in Stripe for the new tenant at the end of the signup flow.
5. Platform Console shows invite status (sent / redeemed / expired) and tenant status live.
6. Invitation gate: `/signup` is accessible only with a valid invite token (hybrid model). When ready to go public, the gate is removed with a single config flag.

---

## Non-goals (explicit)

- **Marketing site or public landing page** — out of scope. No `mercflow.shop/pricing` page. Merchants are invited, not self-discovered.
- **Multi-user tenant (team members)** — v1: one admin user per tenant. Team member invites are a separate task (M013 Settings → Team).
- **Custom domain SSL automation beyond Traefik** — Traefik handles Let's Encrypt. Operator verifies DNS pointing. No automated DNS record creation in v1.
- **Self-service plan changes or billing management** — merchant can see their plan in Settings. Changes go through Platform Console (operator-assisted) in v1.
- **Trial periods** — merchant is on paid plan from day one. A manual override in Platform Console can suppress billing for internal tenants.
- **White-label platform** — MercFlow branding in onboarding UI in v1.

---

## Architecture

### Invite system

New table in `apps/backend` (not a module — platform-level schema):

```
platform_invite
├── id
├── email                    text
├── token                    text (UUID, time-limited, single-use)
├── status                   enum: pending | redeemed | expired | revoked
├── invited_by               text (operator user ID)
├── created_at
├── expires_at               (72h from creation)
├── redeemed_at              (nullable)
├── tenant_id                text (nullable — set on redemption)
```

**Token generation:** `crypto.randomUUID()` — stored hashed in DB, sent raw in invite URL.

**Invite link:** `https://admin.mercflow.shop/signup?invite=[token]`

### Signup flow (new `apps/onboarding/` or sub-route of `apps/platform-console/`)

Page sequence:

```
/signup?invite=[token]
  Step 1: Verify invite token (API call, shows error if invalid/expired)
  Step 2: Create account (Clerk SignUp component — email + password)
  Step 3: Store details (store name, currency, country, timezone)
  Step 4: Domain (enter subdomain or custom domain)
  Step 5: Stripe billing (Stripe Payment Element for platform subscription)
  Step 6: Provisioning in progress (animated — < 60s)
  Step 7: Done — "Your store is ready" → redirect to Store Admin
```

### Auto-provisioning service

Called on Step 5 completion (billing confirmed). Runs as a BullMQ job (`provision-tenant` queue):

```
1. Create Medusa Store (name, currency, country)
2. Create Medusa Sales Channel (default)
3. Create Medusa Publishable API Key (linked to sales channel)
4. Create Clerk Org (store_id as external ID)
5. Add merchant's Clerk user to Org as admin
6. Set JWT template claim: org_id → store_id
7. Add Traefik routing rule for tenant domain (Traefik API or Docker label update)
8. Create Stripe platform subscription (platform fee) for this tenant
9. Mark platform_invite.status → redeemed; set tenant_id
10. Emit 'tenant.provisioned' event → notification email ("Your store is ready", M012)
```

**Idempotency:** Each step is individually idempotent. If the job is retried after a partial failure, completed steps are detected and skipped.

### Platform Console additions

- **"Tenants" view** — existing; add "Invite" button
- **Invite modal** — email input, optional note, "Send invite" CTA
- **Invite list tab** — shows pending, redeemed, expired invites; revoke action
- **Tenant row** — shows provision status (provisioning / active / suspended)

### Invitation gate

`/signup` returns `403` without a valid `?invite=` token. Middleware in `apps/onboarding/` (or wherever the signup route lives) checks token validity before rendering any step.

Gate removal: single env var `MERCFLOW_PUBLIC_SIGNUP=true` disables the token check. No code changes needed to open to public.

---

## User journeys

### J001 — Operator invites a new merchant

**Actor:** Operator (MercFlow team) in Platform Console
**Goal:** Onboard a new merchant who expressed interest

**Steps:**
1. Platform Console → Tenants → "Invite merchant"
2. Modal: enter merchant email (e.g. `hello@newshop.dk`)
3. Optionally: add internal note ("Referred by Guapo")
4. Click "Send invite" → system creates `platform_invite` record + sends invite email via SES
5. Invite appears in list: status "Pending", expires in 72h
6. Operator can revoke before redemption if needed

**Acceptance:** Invite email sent within 30s. Token single-use and expires at 72h. Invite visible in Platform Console.

---

### J002 — Merchant completes signup

**Actor:** New merchant (received invite email)
**Goal:** Set up their MercFlow store

**Steps:**
1. Merchant receives email: "You've been invited to MercFlow" — clicks "Set up your store"
2. `/signup?invite=[token]` — invite validated; step 1 passes
3. Step 2: creates Clerk account (email + password)
4. Step 3: enters store name ("Kaffehuset"), currency (DKK), country (Denmark), timezone (Europe/Copenhagen)
5. Step 4: enters domain — options: `[subdomain].mercflow.shop` or custom domain
6. Step 5: Stripe billing — enters card, sees plan details (e.g. "MercFlow Starter — 299 DKK/month"), clicks "Start subscription"
7. Step 6: "Setting up your store…" (progress steps visible)
8. Step 7: "Your store is ready!" — "Open Store Admin" button → `https://kaffehuset.mercflow.shop`

**Acceptance:** All provisioning steps completed within 60s. Store Admin accessible with Clerk login immediately after. `platform_invite.status` → redeemed.

---

### J003 — Provisioning completes automatically

**Actor:** BullMQ `provision-tenant` worker
**Goal:** Create all infrastructure for the new tenant

**Steps:**
1. Job triggered by Stripe `customer.subscription.created` webhook
2. Reads `platform_invite` for context (store name, domain, Clerk user ID)
3. Creates: Medusa Store → Sales Channel → Publishable API Key → Clerk Org → Traefik rule
4. Each step logged to `platform_audit_log`
5. On any step failure: job retried (BullMQ exponential backoff, max 3 attempts)
6. On final failure: operator notified via Platform Console alert + Slack/email

**Acceptance:** All 8 provisioning steps succeed idempotently. Any retry does not duplicate resources. Audit log has a row per step with outcome.

---

### J004 — Operator monitors onboarding health in Platform Console

**Actor:** Operator
**Goal:** Ensure a recently invited merchant successfully provisioned

**Steps:**
1. Platform Console → Tenants → finds merchant by email
2. Status column: "Active" (green) — provisioning complete
3. Clicks row → Tenant detail: store ID, Clerk org ID, domain, plan, creation date
4. Invites tab: shows invite redemption time

**Acceptance:** Tenant detail shows all provisioning data. No manual DB inspection needed to verify status.

---

## Deliverables

| Area | Deliverable |
|------|-------------|
| `apps/backend` | `platform_invite` table + CRUD routes `/platform/invites` |
| `apps/worker` | `provision-tenant` BullMQ queue + provisioning job with idempotent steps |
| `apps/backend` | Stripe platform billing webhook handler (`customer.subscription.created`, `customer.subscription.deleted`) |
| `apps/platform-console` | "Invite merchant" modal + invite list tab in Tenants view |
| `apps/onboarding/` (new) | 7-step signup flow (Clerk SignUp, store details, domain, Stripe Payment Element, progress, done) |
| `apps/onboarding/` | Invite token validation middleware (invitation gate) |
| `packages/notification-module` | "Welcome to MercFlow" email template (onboarding completion) |

---

## Success metrics

| Metric | Target |
|--------|--------|
| Provisioning time (invite redeemed → store accessible) | < 60s p95 |
| Provisioning success rate on first attempt | ≥ 98% |
| Stripe platform subscription created before store is accessible | Yes (billing is part of the flow, not optional) |
| Duplicate stores/channels for same invite | 0 (idempotency) |
| Manual SSH steps required to onboard a new tenant | 0 (after M019) |

---

## Open questions

| # | Question | Decision |
|---|----------|----------|
| OQ-01 | Where does the signup app live — sub-route of `admin.mercflow.shop` or separate app? | **Separate route under the onboarding app** — `admin.mercflow.shop/signup` served from a minimal Vite app or sub-route of the main admin shell. Decision: co-located in `apps/platform-console/` signup sub-route for simplicity in v1; extract to own app if routing gets complex. |
| OQ-02 | Custom domain in signup — does the merchant need to add DNS records first, or is this a post-signup step? | **Post-signup step.** During signup, merchant enters desired domain as a preference. Traefik routing is added but SSL only activates once DNS points to Hetzner. Admin Settings → Domains shows DNS record requirements after provisioning. |
| OQ-03 | Stripe platform billing — who is the Stripe account (MercFlow's Stripe, or per-tenant)? | **MercFlow's Stripe account** for platform billing. Per-tenant Stripe accounts are configured in `payment-module` (M017) for the merchant's own store payments — these are separate. |
| OQ-04 | Free plan / internal tenants (e.g. Guapo) — do they go through the billing step? | **Operator override in Platform Console.** An "Internal tenant" flag suppresses the Stripe billing step and marks the subscription as manually managed. Guapo and other internal tenants use this path. |
