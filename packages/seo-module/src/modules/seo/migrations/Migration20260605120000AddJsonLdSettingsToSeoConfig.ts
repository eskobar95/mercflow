import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: S004 / T014 — per-tenant JSON-LD enable toggles by page type (PRD J005)
 * Changes: mercflow_seo_config.json_ld_settings (jsonb, nullable)
 * Reversible: Yes — down() drops column
 * Fields derived from: .factory/planning/tasks.md T014
 * Generation: hand-authored SQL aligned with DML model.json_ld_settings
 */
export class Migration20260605120000AddJsonLdSettingsToSeoConfig extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "mercflow_seo_config" add column if not exists "json_ld_settings" jsonb null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "mercflow_seo_config" drop column if exists "json_ld_settings";`
    )
  }
}
