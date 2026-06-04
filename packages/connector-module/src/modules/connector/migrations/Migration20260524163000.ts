import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: MER-40 — Plunk connector admin slice: surface last connection test outcome on list + detail.
 * Changes:
 *   - `connector_config.connection_status` (nullable text: ok | error)
 *   - `connector_config.last_test_message` (nullable text — human-readable result, no secrets)
 * Reversible: Yes — drops columns in down().
 */
export class Migration20260524163000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE "connector_config" ADD COLUMN IF NOT EXISTS "connection_status" text null;`
    )
    this.addSql(
      `ALTER TABLE "connector_config" ADD COLUMN IF NOT EXISTS "last_test_message" text null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "connector_config" DROP COLUMN IF EXISTS "last_test_message";`)
    this.addSql(`ALTER TABLE "connector_config" DROP COLUMN IF EXISTS "connection_status";`)
  }
}
