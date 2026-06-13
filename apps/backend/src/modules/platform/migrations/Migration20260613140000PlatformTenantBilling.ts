import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: T089 — Platform billing foundation (PRD-platform-billing-retrofit.md J001, ADR-015)
 * Changes:
 *   - New table: platform_tenant_billing (store_id PK, Stripe IDs, plan tier/interval/currency, subscription status)
 * Reversible: Yes — down() drops platform_tenant_billing
 * Generated via: Hand-authored per tasks.md T089 field definitions (not a Medusa DML module)
 * Fields derived from: PRD-platform-billing-retrofit.md platform_tenant_billing section
 */
export class Migration20260613140000PlatformTenantBilling extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "platform_tenant_billing" (
        "store_id" text not null,
        "clerk_org_id" text not null,
        "stripe_customer_id" text not null,
        "stripe_subscription_id" text not null,
        "stripe_price_id" text not null,
        "plan_tier" text not null,
        "billing_interval" text not null,
        "billing_currency" text not null,
        "subscription_status" text not null,
        "current_period_end" timestamptz null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "platform_tenant_billing_pkey" primary key ("store_id")
      );
    `)

    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_platform_tenant_billing_stripe_customer_id" ON "platform_tenant_billing" ("stripe_customer_id");`,
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_platform_tenant_billing_stripe_subscription_id" ON "platform_tenant_billing" ("stripe_subscription_id");`,
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_platform_tenant_billing_subscription_status" ON "platform_tenant_billing" ("subscription_status");`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "platform_tenant_billing" cascade;`)
  }
}
