import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: T079 / PRD-payment-module M017 — per-tenant payment provider credentials with test/live mode.
 * Changes:
 *   - New table: payment_provider_config (store_id, provider enum, test/live keys, mode enum)
 *   - RLS policy payment_provider_config_tenant_isolation on app.tenant_id
 * Reversible: Yes — down() drops policy and table
 * Fields derived from: PRD-payment-module.md, ADR-013
 */
export class Migration20260613120000CreatePaymentProviderConfig extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "payment_provider_config" (` +
        `"id" text not null, ` +
        `"store_id" text not null, ` +
        `"provider" text check ("provider" in ('stripe', 'mobilepay', 'klarna')) not null default 'stripe', ` +
        `"test_secret_key" text null, ` +
        `"test_publishable_key" text null, ` +
        `"test_webhook_secret" text null, ` +
        `"live_secret_key" text null, ` +
        `"live_publishable_key" text null, ` +
        `"live_webhook_secret" text null, ` +
        `"mode" text check ("mode" in ('test', 'live')) not null default 'test', ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "payment_provider_config_pkey" primary key ("id")` +
        `);`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_provider_config_deleted_at" ON "payment_provider_config" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_provider_config_store_id" ON "payment_provider_config" ("store_id");`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_provider_config_store_provider_unique" ON "payment_provider_config" ("store_id", "provider") WHERE deleted_at IS NULL;`
    )

    this.addSql(`ALTER TABLE "payment_provider_config" ENABLE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "payment_provider_config" FORCE ROW LEVEL SECURITY;`)
    this.addSql(
      `DROP POLICY IF EXISTS payment_provider_config_tenant_isolation ON "payment_provider_config";`
    )
    this.addSql(`
      CREATE POLICY payment_provider_config_tenant_isolation ON "payment_provider_config"
        USING (store_id = current_setting('app.tenant_id', true))
        WITH CHECK (store_id = current_setting('app.tenant_id', true));
    `)
  }

  override async down(): Promise<void> {
    this.addSql(
      `DROP POLICY IF EXISTS payment_provider_config_tenant_isolation ON "payment_provider_config";`
    )
    this.addSql(`ALTER TABLE "payment_provider_config" NO FORCE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "payment_provider_config" DISABLE ROW LEVEL SECURITY;`)
    this.addSql(`drop table if exists "payment_provider_config" cascade;`)
  }
}
