# MercFlow — Accepted-risk CVE register

Per [ADR-016](../.factory/context/ADR/ADR-016-security-hardening-api-validation.md):

| Severity | Policy |
|---|---|
| Critical / High | **Fix** — `pnpm audit --audit-level=high` must exit 0 before merge |
| Moderate (production path) | **Fix if safe** — bump or override; document if deferred |
| Moderate (dev-only) | **Accept with documentation** — list below with revisit sprint |

**Gate command:** `pnpm audit --audit-level=high` (exit 0 required)

**Secret scan:** `gitleaks detect --source . --staged` (also runs in `.github/workflows/security.yml`)

---

## pnpm.overrides (active)

Root `package.json` overrides applied to resolve transitive CVEs where direct deps could not be bumped safely:

| Override | CVE / GHSA | Rationale |
|---|---|---|
| `esbuild >=0.28.1` | GHSA-gv7w-rqvm-qjhr | High-severity esbuild Deno integrity issue; pulled by `tsx` and `vite`. Node-only runtime; patched via override until vite@6 migration. |
| `qs >=6.15.2` | GHSA-q8mj-m7cp-5q26 | Express/body-parser transitive; production query parsing path. |
| `ws >=8.20.1` | GHSA-58qx-3vcg-4xpx | WebSocket client transitive memory disclosure. |

---

## Accepted moderate-risk CVEs

| Package | Version (lockfile) | CVE / GHSA | Severity | Path | Classification | Why accepted | Revisit |
|---|---|---|---|---|---|---|---|
| `vite` | 5.4.21 | GHSA-4w7w-66w2-5vf9 | moderate | vitest, admin-ui/platform-console dev | **dev-only** | Path traversal in optimized-deps `.map` handling requires a running Vite dev server. Production uses `vite build` static output only. Fix requires vite@6 migration. | S048 (vite@6) |
| `prismjs` | 1.29.0 | GHSA-x7hr-w5r2-h6wg | moderate | `@react-email/code-block` → notification-module | **production (low exposure)** | DOM clobbering in syntax-highlighted email preview blocks. Email HTML is server-rendered, not served as interactive admin UI. Bump blocked on `@react-email/components@0.0.31` pin. | S048 |
| `i18next-http-backend` | 2.4.2 | GHSA-q89c-q3h5-w34g | moderate | `@medusajs/dashboard` via medusa-fork admin-bundler | **dev-only / unused** | MercFlow replaces Medusa dashboard with `@mercflow/admin-ui`. Bundler dep remains in fork but is not served in production. | M022 (fork cleanup) |
| `uuid` | 9.0.1 | GHSA-w5hq-g745-h8pq | moderate | `@medusajs/telemetry`, `bullmq` via medusa-fork | **production (low exploitability)** | Buffer bounds check in v3/v5/v6 when caller supplies `buf`. MercFlow does not pass attacker-controlled buffers to uuid v3/v5/v6 APIs. Major bump to uuid@11 needs fork validation. | M022 |
| `react-router` | 6.30.3 | GHSA-2j2x-hqr9-3h42 | moderate | `@medusajs/draft-order`, `@medusajs/dashboard` via medusa-fork | **dev-only / unused** | Open redirect via protocol-relative URL in same-origin redirect. MercFlow admin uses `react-router-dom@6.30.4` in `admin-ui` and `platform-console`; fork dashboard bundle is not production-served. | M022 |
| `ajv` | 6.15.0 | GHSA-2g4f-4pwh-qvx6 | moderate | eslint via `@eslint/eslintrc` | **dev-only** | ReDoS with `$data` option in schema validation. ESLint config schemas do not enable `$data`. Override to ajv@8 breaks ESLint (`defaultMeta` crash). | S048 |
| `brace-expansion` | 5.0.5 | GHSA-jxxr-4gwj-5jf2 | moderate | eslint, rimraf, react-doctor dev tooling | **dev-only** | ReDoS in glob expansion during lint/test/CI only. No production runtime path. | S048 |

---

## Resolved in T093 (S047)

| Package | Action | CVE cleared |
|---|---|---|
| `tsx` | Bumped to `^4.22.4` (latest; `>=4.23.0` not yet published) | esbuild high via tsx |
| `esbuild` | Override `>=0.28.1` | GHSA-gv7w-rqvm-qjhr (high) |
| `react-router-dom` | `6.30.4` in admin-ui + platform-console | GHSA-2j2x-hqr9-3h42 (MercFlow apps) |
| `vite` | `^5.4.21` in admin-ui + platform-console | latest 5.x patch |
| `qs` | Override `>=6.15.2` | GHSA-q8mj-m7cp-5q26 |
| `ws` | Override `>=8.20.1` | GHSA-58qx-3vcg-4xpx |

---

## How to revisit

1. Run `pnpm audit` and compare against this table.
2. For each expired row, attempt direct dep bump first; use `pnpm.overrides` only as last resort (comment CVE in this file).
3. Remove rows when lockfile no longer reports the advisory.
4. Update `.github/workflows/security.yml` ALLOWED list if CI exceptions are no longer needed.
