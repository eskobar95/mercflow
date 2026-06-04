import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: MER-36 — Persist Shipmondo shipping rule settings (markup, free-shipping threshold, enabled products) per task slice.
 * Changes: connector_config.rules_json (jsonb, nullable).
 * Reversible: Yes — down() drops rules_json column.
 * Generated via: Model change + handwritten migration after incorrect full-table scaffold from CLI (replaced with ALTER ONLY).
 */
export class Migration20260524223000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "connector_config" ADD COLUMN IF NOT EXISTS "rules_json" jsonb null;`)
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "connector_config" DROP COLUMN IF EXISTS "rules_json";`)
  }
}
