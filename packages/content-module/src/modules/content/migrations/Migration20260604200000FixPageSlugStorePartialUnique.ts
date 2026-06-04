import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: T001 follow-up — DBs that ran Migration20260604120000 before page index fix kept
 *   legacy IDX_page_slug_locale_unique and a non-partial store-scoped unique.
 * Changes: Drop legacy partial (slug, locale); replace full store unique with partial
 *   (slug, locale, store_id) WHERE deleted_at IS NULL.
 * Reversible: Yes — down() restores Migration20260525203000 page index shape.
 * Generated via: Hand-authored (idempotent DROP/CREATE).
 */
export class Migration20260604200000FixPageSlugStorePartialUnique extends Migration {
  override async up(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_page_slug_locale_unique";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_page_slug_locale_store_unique";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_page_slug_locale_store_unique" ON "page" ("slug", "locale", "store_id") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_page_slug_locale_store_unique";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_page_slug_locale_unique" ON "page" ("slug", "locale") WHERE deleted_at IS NULL;`
    )
  }
}
