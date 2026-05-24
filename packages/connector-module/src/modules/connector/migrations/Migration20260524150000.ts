import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: MER-25 — surface last connection test time on `GET /admin/connectors`.
 * Changes:
 *   - `connector_config.last_tested_at` (nullable timestamptz)
 * Reversible: Yes — drops column in down().
 */
export class Migration20260524150000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE "connector_config" ADD COLUMN IF NOT EXISTS "last_tested_at" timestamptz null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "connector_config" DROP COLUMN IF EXISTS "last_tested_at";`)
  }
}
