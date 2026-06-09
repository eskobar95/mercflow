import type {
  EventSubscriber,
  TransactionEventArgs,
} from "@medusajs/framework/mikro-orm/core"

import { TenantContext } from "./tenant-context"

/**
 * MikroORM EventSubscriber that injects `SET LOCAL app.tenant_id` into
 * every new database transaction.
 *
 * PostgreSQL's `SET LOCAL` scopes the setting to the current transaction;
 * it is automatically cleared on COMMIT or ROLLBACK — no cleanup needed.
 *
 * Registration: call `registerTenantSubscriber(em)` once per MikroORM
 * EntityManager instance (i.e. once per Medusa module) during application
 * startup. See `register-tenant-subscriber.ts`.
 *
 * When there is no active tenant (cron jobs, CLI, migrations) the hook
 * is a no-op, meaning queries run without RLS restrictions. That is
 * intentional: platform-level jobs need cross-tenant visibility.
 */
export class TenantIsolationSubscriber implements EventSubscriber {
  async afterTransactionStart(args: TransactionEventArgs): Promise<void> {
    const storeId = TenantContext.getStoreId()
    if (!storeId) {
      return
    }

    // Pass args.transaction (the Knex trx) as the connection context so that
    // set_config runs on the SAME physical connection that MikroORM already
    // bound to this transaction — not on a fresh pooled connection.
    //
    // set_config(key, value, is_local=true) behaves like SET LOCAL:
    // the value is automatically reset when the transaction ends.
    await args.em
      .getConnection()
      .execute(
        "SELECT set_config('app.tenant_id', ?, true)",
        [storeId],
        "run",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args.transaction as any,
      )
  }
}
