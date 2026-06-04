import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: T001 follow-up — databases that ran Migration20260604120000 before product_attr_link
 *   unique index included store_id need the composite unique rebuilt.
 * Changes: Drop IDX_product_attr_link_product_attribute_unique; add
 *   IDX_product_attr_link_product_attribute_store_unique on (product_id, attribute_id, store_id).
 * Reversible: Yes — down() restores the two-column unique.
 * Generated via: Hand-authored (idempotent IF NOT EXISTS / IF EXISTS).
 */
export class Migration20260604183000ProductAttrLinkStoreUnique extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `DROP INDEX IF EXISTS "IDX_product_attr_link_product_attribute_unique";`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_attr_link_product_attribute_store_unique" ON "product_attr_link" ("product_id", "attribute_id", "store_id");`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `DROP INDEX IF EXISTS "IDX_product_attr_link_product_attribute_store_unique";`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_attr_link_product_attribute_unique" ON "product_attr_link" ("product_id", "attribute_id");`
    )
  }
}
