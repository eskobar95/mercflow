# HITL — M000 Neon IP allowlist (T003)

**Status:** open  
**Owner:** human (Nicklas)  
**Blocks:** M000 Green gate  
**ADR:** [ADR-005](../../context/ADR/ADR-005-security-rls-rate-limiting.md)

---

## Why

Neon project `young-waterfall-54245022` (MercFlow development) should not accept database connections from arbitrary IPs. Rate limiting (merged in PR #53) protects HTTP routes; the allowlist protects the database if a connection string leaks.

---

## Steps (Neon console)

1. Open [Neon project Settings → IP Allow](https://console.neon.tech/app/projects/young-waterfall-54245022/settings/ip-allow).
2. Collect **Railway static egress IPs** for the environment that runs `apps/backend` (production/staging as applicable).
   - Railway: Project → Service → Settings → Networking → note documented egress IPs (or enable static egress if not already).
3. Add each egress IP to Neon **Allowed IPs** (CIDR if Railway documents a range).
4. Optional hardening (when Railway supports it): enable **Block public connections** + private link — do not enable block until app connectivity is verified.
5. Record completion below and check T003 HITL box in `tasks.md`.

---

## Completion record

| Field | Value |
|-------|-------|
| Completed by | |
| Date | |
| IPs added | |
| Environments | e.g. Railway production, staging |
| Notes | e.g. private link planned Q3 |

---

## Agent cannot complete

This step requires Neon console access and Railway networking confirmation. Code for rate limiting is already merged; no further PR is required for T003 middleware.
