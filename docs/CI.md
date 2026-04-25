# Continuous integration (CI)

## What runs in GitHub Actions

The workflow at `.github/workflows/ci.yml` runs on pushes to `main` and on pull requests.

Jobs:

- **`check`**: `pnpm install --frozen-lockfile`, then `pnpm lint`, `pnpm test`, `pnpm typecheck`, `pnpm build`
- **`backend-integration`**: Jobbet bruger GitHub-miljøet `backend` (Settings → Environments) med secrets `DATABASE_URL`, `JWT_SECRET` og `COOKIE_SECRET`. `DATABASE_URL` skal pege på den indbyggede Postgres-service i workflow’en (fx `postgres://mercflow@localhost:5432/mercflow` når I bruger trust). Derefter `db:migrate`, backend `typecheck` og `build`.
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
