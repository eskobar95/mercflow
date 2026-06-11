import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: T071 / PRD-subscription-system M015 — replace Batch 1 read-only subscription scaffold with full foundation models.
 * Changes:
 *   - Drop legacy subscription columns (cycle_weeks, discount_percent) and recreate subscription with store_id, interval, billing period fields, RLS.
 *   - New table: subscription_renewal_log (scoped via subscription_id join RLS).
 *   - New table: subscription_config (per-store club settings, store_id RLS).
 * Reversible: Yes — down() drops new tables and restores legacy subscription shape.
 * Fields derived from: .factory/planning/tasks.md T071, PRD-subscription-system.md
 */
export class Migration20260611130000ExpandSubscriptionFoundation extends Migration {
  override async up(): Promise<void> {
    this.addSql(`drop table if exists "subscription" cascade;`)

    this.addSql(
      `create table if not exists "subscription" (` +
        `"id" text not null, ` +
        `"store_id" text not null, ` +
        `"customer_id" text not null, ` +
        `"product_id" text not null, ` +
        `"variant_id" text not null, ` +
        `"interval" text check ("interval" in ('weekly', 'biweekly', 'monthly', 'quarterly')) not null default 'monthly', ` +
        `"status" text check ("status" in ('active', 'paused', 'cancelled', 'past_due', 'pending_payment')) not null default 'active', ` +
        `"stripe_subscription_id" text null, ` +
        `"current_period_start" timestamptz not null, ` +
        `"current_period_end" timestamptz not null, ` +
        `"next_renewal_at" timestamptz not null, ` +
        `"cancelled_at" timestamptz null, ` +
        `"pause_requested_at" timestamptz null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "subscription_pkey" primary key ("id")` +
        `);`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_deleted_at" ON "subscription" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_store_id" ON "subscription" ("store_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_customer_id" ON "subscription" ("customer_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_store_status" ON "subscription" ("store_id", "status") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_store_customer" ON "subscription" ("store_id", "customer_id") WHERE deleted_at IS NULL;`
    )

    this.addSql(`ALTER TABLE "subscription" ENABLE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "subscription" FORCE ROW LEVEL SECURITY;`)
    this.addSql(`DROP POLICY IF EXISTS subscription_tenant_isolation ON "subscription";`)
    this.addSql(`
      CREATE POLICY subscription_tenant_isolation ON "subscription"
        USING (store_id = current_setting('app.tenant_id', true))
        WITH CHECK (store_id = current_setting('app.tenant_id', true));
    `)

    this.addSql(
      `create table if not exists "subscription_renewal_log" (` +
        `"id" text not null, ` +
        `"subscription_id" text not null, ` +
        `"order_id" text not null, ` +
        `"amount" numeric not null, ` +
        `"currency" text not null, ` +
        `"status" text check ("status" in ('success', 'failed', 'skipped')) not null default 'success', ` +
        `"stripe_payment_intent_id" text null, ` +
        `"error_message" text null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "subscription_renewal_log_pkey" primary key ("id")` +
        `);`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_renewal_log_deleted_at" ON "subscription_renewal_log" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_renewal_log_subscription_id" ON "subscription_renewal_log" ("subscription_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_renewal_log_subscription_created" ON "subscription_renewal_log" ("subscription_id", "created_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(`ALTER TABLE "subscription_renewal_log" ENABLE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "subscription_renewal_log" FORCE ROW LEVEL SECURITY;`)
    this.addSql(
      `DROP POLICY IF EXISTS subscription_renewal_log_tenant_isolation ON "subscription_renewal_log";`
    )
    this.addSql(`
      CREATE POLICY subscription_renewal_log_tenant_isolation ON "subscription_renewal_log"
        USING (
          EXISTS (
            SELECT 1 FROM "subscription" s
            WHERE s.id = subscription_id
              AND s.store_id = current_setting('app.tenant_id', true)
              AND s.deleted_at IS NULL
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM "subscription" s
            WHERE s.id = subscription_id
              AND s.store_id = current_setting('app.tenant_id', true)
              AND s.deleted_at IS NULL
          )
        );
    `)

    this.addSql(
      `create table if not exists "subscription_config" (` +
        `"id" text not null, ` +
        `"store_id" text not null, ` +
        `"club_enabled" boolean not null default false, ` +
        `"club_stripe_product_id" text null, ` +
        `"club_price_monthly" numeric null, ` +
        `"club_price_annual" numeric null, ` +
        `"club_fallback_discount_pct" numeric null, ` +
        `"club_name" text null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "subscription_config_pkey" primary key ("id")` +
        `);`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_config_store_id" ON "subscription_config" ("store_id");`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_subscription_config_store_unique" ON "subscription_config" ("store_id") WHERE deleted_at IS NULL;`
    )

    this.addSql(`ALTER TABLE "subscription_config" ENABLE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "subscription_config" FORCE ROW LEVEL SECURITY;`)
    this.addSql(`DROP POLICY IF EXISTS subscription_config_tenant_isolation ON "subscription_config";`)
    this.addSql(`
      CREATE POLICY subscription_config_tenant_isolation ON "subscription_config"
        USING (store_id = current_setting('app.tenant_id', true))
        WITH CHECK (store_id = current_setting('app.tenant_id', true));
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP POLICY IF EXISTS subscription_config_tenant_isolation ON "subscription_config";`)
    this.addSql(`ALTER TABLE "subscription_config" NO FORCE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "subscription_config" DISABLE ROW LEVEL SECURITY;`)
    this.addSql(`drop table if exists "subscription_config" cascade;`)

    this.addSql(
      `DROP POLICY IF EXISTS subscription_renewal_log_tenant_isolation ON "subscription_renewal_log";`
    )
    this.addSql(`ALTER TABLE "subscription_renewal_log" NO FORCE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "subscription_renewal_log" DISABLE ROW LEVEL SECURITY;`)
    this.addSql(`drop table if exists "subscription_renewal_log" cascade;`)

    this.addSql(`DROP POLICY IF EXISTS subscription_tenant_isolation ON "subscription";`)
    this.addSql(`ALTER TABLE "subscription" NO FORCE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "subscription" DISABLE ROW LEVEL SECURITY;`)
    this.addSql(`drop table if exists "subscription" cascade;`)

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
}
