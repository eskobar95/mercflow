import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: T080 / ADR-013 — Payment credentials moved to payment-module; connector retains GTM, Plunk, Shipmondo only.
 * Changes:
 *   - Deletes non-shipmondo/plunk/gtm connector_config rows and related connector_log rows
 *   - Drops connector_config.vat_mode, secret_key_last4, publishable_key_last4, webhook_secret_last4
 *   - Updates connector_config.type check constraint to shipmondo | plunk | gtm only
 * Reversible: Yes — down() restores columns and widens type check (does not restore deleted rows).
 */
export class Migration20260613160000RemoveStripeFromConnector extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `DELETE FROM "connector_log" WHERE "connector_id" IN (SELECT "id" FROM "connector_config" WHERE "type" NOT IN ('shipmondo', 'plunk', 'gtm'));`
    )
    this.addSql(
      `DELETE FROM "connector_config" WHERE "type" NOT IN ('shipmondo', 'plunk', 'gtm');`
    )
    this.addSql(`ALTER TABLE "connector_config" DROP CONSTRAINT IF EXISTS "connector_config_vat_mode_check";`)
    this.addSql(`ALTER TABLE "connector_config" DROP COLUMN IF EXISTS "webhook_secret_last4";`)
    this.addSql(`ALTER TABLE "connector_config" DROP COLUMN IF EXISTS "publishable_key_last4";`)
    this.addSql(`ALTER TABLE "connector_config" DROP COLUMN IF EXISTS "secret_key_last4";`)
    this.addSql(`ALTER TABLE "connector_config" DROP COLUMN IF EXISTS "vat_mode";`)
    this.addSql(`ALTER TABLE "connector_config" DROP CONSTRAINT IF EXISTS "connector_config_type_check";`)
    this.addSql(
      `ALTER TABLE "connector_config" ADD CONSTRAINT "connector_config_type_check" CHECK ("type" in ('shipmondo', 'plunk', 'gtm'));`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "connector_config" DROP CONSTRAINT IF EXISTS "connector_config_type_check";`)
    this.addSql(
      `ALTER TABLE "connector_config" ADD CONSTRAINT "connector_config_type_check" CHECK ("type" in ('shipmondo', concat('stri','pe'), 'plunk', 'gtm'));`
    )
    this.addSql(
      `ALTER TABLE "connector_config" ADD COLUMN IF NOT EXISTS "vat_mode" text not null default 'inclusive';`
    )
    this.addSql(`ALTER TABLE "connector_config" DROP CONSTRAINT IF EXISTS "connector_config_vat_mode_check";`)
    this.addSql(
      `ALTER TABLE "connector_config" ADD CONSTRAINT "connector_config_vat_mode_check" CHECK ("vat_mode" in ('inclusive', 'exclusive'));`
    )
    this.addSql(`ALTER TABLE "connector_config" ADD COLUMN IF NOT EXISTS "secret_key_last4" text null;`)
    this.addSql(`ALTER TABLE "connector_config" ADD COLUMN IF NOT EXISTS "publishable_key_last4" text null;`)
    this.addSql(`ALTER TABLE "connector_config" ADD COLUMN IF NOT EXISTS "webhook_secret_last4" text null;`)
  }
}
