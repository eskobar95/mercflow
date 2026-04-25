# Continuous integration (CI)

## What runs in GitHub Actions

The workflow at `.github/workflows/ci.yml` runs on pushes to `main` and on pull requests.

Jobs:

- **`check`**: `pnpm install --frozen-lockfile`, then `pnpm lint`, `pnpm test`, `pnpm typecheck`, `pnpm build`
- **`backend-integration`**: PostgreSQL 16 (service) med `POSTGRES_HOST_AUTH_METHOD=trust` i CI (ingen hemmeligheder i repo) + `pnpm --filter @mercflow/backend db:migrate`, derefter backend `typecheck` + `build`
- **`admin-ui-e2e`**: installs Playwright browsers, then `pnpm --filter @mercflow/admin-ui test:e2e` (Vite dev server is started by Playwright)

## Local CI replica

From the repository root:

```bash
pnpm ci
```

(`pnpm ci` already runs `pnpm install --frozen-lockfile` before lint, test, typecheck, and build.)

## Enabling “required checks” on `main`

Repository settings can’t be fully captured in git, but the intended merge gate is:

- Require PR reviews (no direct pushes) for `main`
- Require the following checks to be green (names as shown in GitHub):
  - `Lint, test, typecheck, build`
  - `Backend (Postgres + migrations)`
  - `Admin UI (Playwright smoke)`

`CODEOWNERS` is used to route review for sensitive areas (workflows, backend, content module, migrations).
