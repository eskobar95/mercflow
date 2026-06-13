# ADR-014 — Tenant Onboarding: Hybrid Invitation-Based Model

**Date:** 2026-06-13
**Status:** Accepted
**Deciders:** Nicklas Eskou, AI Factory (/align session June 2026)
**Related PRD:** PRD-tenant-onboarding.md (M019)

---

## Context

MercFlow is a multi-tenant SaaS platform. Tenant onboarding is currently a manual CLI + SSH process run by the MercFlow operator. As more merchants are onboarded, this does not scale.

The question is: do we build a fully public signup flow, or an invitation-based model?

The constraints:
- MercFlow is not yet ready for fully public launch (no marketing site, no support automation, limited team bandwidth)
- The team has specific merchants in mind who should be onboarded in the near term
- The platform should be architecturally ready to go public without rebuilding the signup flow

---

## Decision

Build full self-service infrastructure (signup flow, Stripe platform billing, auto-provisioning) with an **invitation gate**:

- `/signup` requires a valid `?invite=` token issued from Platform Console
- Gate is a single env flag (`MERCFLOW_PUBLIC_SIGNUP=true`) — flipping it disables the token check
- Operator controls who gets invited; Platform Console shows invite status

This is the "hybrid" model: the UX is complete self-service, but access is operator-controlled.

---

## Options considered

### Option A — Build full public signup (no gate)
Signup is open to anyone. No invite token required.

**Rejected for now:** No marketing funnel to bring in the right merchants. Risk of bot signups or trial abuse. Team cannot handle open support volume yet. Can be flipped to this model by removing the gate (one env var).

### Option B — Keep manual CLI provisioning
Maintain the current `pnpm provision-tenant` script. No signup UI.

**Rejected:** Does not scale. Every new merchant requires SSH access, manual Clerk setup, and manual billing. No path to self-service.

### Option C — Invitation-based self-service (chosen)
Full signup flow + Stripe billing + auto-provisioning, gated by Platform Console invites.

**Chosen:** Scales to dozens of tenants with operator control. Full self-service infrastructure is built from day one. No rearchitecting when going fully public — just remove the gate.

---

## Consequences

**Positive:**
- Operator workload per onboarding drops from ~30 min (SSH + manual) to ~30 seconds (send invite).
- Merchants experience a polished, guided flow — not a manual handoff.
- Platform Console becomes the control surface for tenant lifecycle (invite, provision, suspend, billing).
- Going public is a config change, not a feature.

**Negative / mitigations:**
- Merchants cannot sign up without operator action. Acceptable during controlled rollout. The gate is explicit and removable.
- Stripe platform billing adds complexity to the signup flow. Mitigated by Stripe Payment Element (handles all card UI) and idempotent provisioning job.

---

## Scope

Applies to all new tenant onboarding in MercFlow. Existing tenants (Guapo) are flagged as "internal" — not required to go through the invite flow. Internal tenants bypass Stripe billing step.

---

## Enforcement

```bash
# Verify invite gate middleware exists on /signup route
rg "invite" apps/onboarding/src/middleware --include="*.ts"

# Verify MERCFLOW_PUBLIC_SIGNUP env var controls gate
rg "PUBLIC_SIGNUP" apps/onboarding/src
```

---

## How to go fully public

1. Set `MERCFLOW_PUBLIC_SIGNUP=true` in the production environment.
2. Remove `?invite=` requirement from signup middleware.
3. Add rate limiting + CAPTCHA on `/signup` (to protect from bots).
4. Marketing site links to `/signup` directly.

No code architectural changes are required.
