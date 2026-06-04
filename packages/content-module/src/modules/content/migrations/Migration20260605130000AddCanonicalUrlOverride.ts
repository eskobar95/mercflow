import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: S004 / T016 — manual canonical URL override per product/category locale (PRD J007)
 * Changes: product_content.canonical_url_override, category_content.canonical_url_override (text, nullable)
 * Reversible: Yes — down() drops both columns
 * Fields derived from: .factory/planning/tasks.md T016
 * Generation: hand-authored SQL aligned with DML model.text().nullable()
 */
export class Migration20260605130000AddCanonicalUrlOverride extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "product_content" add column if not exists "canonical_url_override" text null;`
    )
    this.addSql(
      `alter table if exists "category_content" add column if not exists "canonical_url_override" text null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "product_content" drop column if exists "canonical_url_override";`
    )
    this.addSql(
      `alter table if exists "category_content" drop column if exists "canonical_url_override";`
    )
  }
}
