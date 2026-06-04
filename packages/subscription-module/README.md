/**
 * `@mercflow/subscription-module` persists recurring commerce subscriptions and exposes
 * read-only admin HTTP handlers for MercFlow operators.
 *
 * **Scope**
 * - DML entity `subscription` synced with the Guapo/MercFlow Postgres table.
 * - No subscription lifecycle workflows in MercFlow Core — storefront + jobs own writes.
 *
 * **Admin routes**
 * - `GET /admin/subscriptions` — paginated overview with hydrated customer / variant labels.
 * - `GET /admin/subscriptions/:id`
 * - `GET /admin/customers/:customer_id/subscriptions`
 *
 * **Local migration tooling**
 *
 * ```bash
 * cd packages/subscription-module
 * # Set DATABASE_URL in the shell to your local Postgres connection string.
 * pnpm db:generate # when DML changes
 * pnpm db:migrate  # forwards (run via backend in CI)
 * ```
 */
