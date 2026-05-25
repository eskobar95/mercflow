import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: Notion MER-32 — CMS pages CRUD requires unique `(slug, locale)` among active rows
 *   so slug management and storefront resolution stay deterministic.
 * Changes:
 *   - Partial unique index on `page (slug, locale)` where `deleted_at` is null
 * Reversible: Yes — down() drops the index
 * Generated via: Hand-authored (aligns with DML `Page` in `models/page.ts`)
 */
export class Migration20260525203000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_page_slug_locale_unique" ON "page" ("slug", "locale") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_page_slug_locale_unique";`)
  }
}
