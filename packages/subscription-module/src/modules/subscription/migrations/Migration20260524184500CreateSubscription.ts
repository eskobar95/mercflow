import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: MER-43 — subscription admin overview; align MercFlow schema with migrated Guapo `subscription` table.
 * Changes:
 *   - New table: subscription (DML: Subscription — customer subscriptions, read-only APIs in this slice)
 * Columns: customer_id, status, cycle_weeks, next_renewal_at, variant_id, discount_percent (+ Medusa-managed timestamps).
 * Reversible: Yes — down() drops subscription table.
 * Note: Generated locally without a live Postgres connection (`medusa db:generate` unavailable in agent env);
 * SQL matches Medusa DML defaults for dated fields (timestamptz) and soft-delete index pattern used by MercFlow modules.
 */
export class Migration20260524184500CreateSubscription extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "subscription" ("id" text not null, "customer_id" text not null, "status" text not null, "cycle_weeks" integer not null, "next_renewal_at" timestamptz null, "variant_id" text not null, "discount_percent" integer null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "subscription_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_deleted_at" ON "subscription" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_customer_id" ON "subscription" ("customer_id") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "subscription" cascade;`)
  }
}
