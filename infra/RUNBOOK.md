# MercFlow infrastructure runbook

## Observability (T028)

Sentry initializes via `apps/backend/src/instrumentation.ts` when `SENTRY_DSN` is set.
`sentryStoreIdMiddleware` tags errors with `store_id`.

BetterStack: set `BETTERSTACK_SOURCE_TOKEN` in `infra/.env`, apply
`infra/observability/docker-logging.override.yml` after T027 stack deploy.
Configure uptime monitors in BetterStack UI using `infra/observability/uptime-checks.example.json`.
