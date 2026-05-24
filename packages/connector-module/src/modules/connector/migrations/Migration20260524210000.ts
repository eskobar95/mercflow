import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: MER-38 — Stripe connector admin: VAT toggle + masked credential previews without decrypt on read.
 * Changes:
 *   - `connector_config.vat_mode` (text, default inclusive)
 *   - `connector_config.secret_key_last4`, `publishable_key_last4`, `webhook_secret_last4` (nullable text)
 * Reversible: Yes — drops columns in down().
 */
export class Migration20260524210000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE "connector_config" ADD COLUMN IF NOT EXISTS "vat_mode" text not null default 'inclusive';`
    )
    this.addSql(`ALTER TABLE "connector_config" DROP CONSTRAINT IF EXISTS "connector_config_vat_mode_check";`)
    this.addSql(
      `ALTER TABLE "connector_config" ADD CONSTRAINT "connector_config_vat_mode_check" CHECK ("vat_mode" in ('inclusive', 'exclusive'));`
    )
    this.addSql(
      `ALTER TABLE "connector_config" ADD COLUMN IF NOT EXISTS "secret_key_last4" text null;`
    )
    this.addSql(
      `ALTER TABLE "connector_config" ADD COLUMN IF NOT EXISTS "publishable_key_last4" text null;`
    )
    this.addSql(
      `ALTER TABLE "connector_config" ADD COLUMN IF NOT EXISTS "webhook_secret_last4" text null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `ALTER TABLE "connector_config" DROP CONSTRAINT IF EXISTS "connector_config_vat_mode_check";`
    )
    this.addSql(`ALTER TABLE "connector_config" DROP COLUMN IF EXISTS "webhook_secret_last4";`)
    this.addSql(`ALTER TABLE "connector_config" DROP COLUMN IF EXISTS "publishable_key_last4";`)
    this.addSql(`ALTER TABLE "connector_config" DROP COLUMN IF EXISTS "secret_key_last4";`)
    this.addSql(`ALTER TABLE "connector_config" DROP COLUMN IF EXISTS "vat_mode";`)
  }
}
