import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: Factory T001 / ADR-004 — shared-instance multi-tenancy; backfill Guapo tenant on all
 *   MercFlow Batch 1 tables and Guapo-custom `medusa` tables; rebuild locale/slug uniques with store_id.
 * Changes:
 *   - MercFlow (11): product_content, category_content, article, page, page_version, page_block,
 *     cms_global, cms_redirect, media_asset, product_attribute, product_attr_link — add store_id NOT NULL
 *   - Guapo-custom (7): brand, product_product_brand_brand, product_review, product_review_image,
 *     product_review_response, product_review_stats, guapo_free_shipping_setting — add store_id when present
 *   - Index rebuilds per tasks.md (slug/locale/scope/from_path/handle composites include store_id)
 * Reversible: Yes — down() drops store_id columns and restores pre-tenancy indexes where applicable
 * Fields derived from: .factory/planning/tasks.md T001, ADR-004 backfill store_id
 */
const GUAPO_BACKFILL_STORE_ID = "store_01KG0VBTT0714XV2CCTEBRVC47"

export class Migration20260604120000AddStoreIdTenancy extends Migration {
  override async up(): Promise<void> {
    this.addMercflowContentStoreIdUp()
    this.addGuapoCustomStoreIdUp()
  }

  override async down(): Promise<void> {
    this.addGuapoCustomStoreIdDown()
    this.addMercflowContentStoreIdDown()
  }

  private addMercflowContentStoreIdUp(): void {
    const storeId = GUAPO_BACKFILL_STORE_ID

    this.addStoreIdColumn("product_content", storeId)
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_content_product_locale_unique";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_content_product_locale_store_unique" ON "product_content" ("product_id", "locale", "store_id");`
    )

    this.addStoreIdColumn("category_content", storeId)
    this.addSql(`DROP INDEX IF EXISTS "IDX_category_content_category_locale_unique";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_category_content_category_locale_store_unique" ON "category_content" ("category_id", "locale", "store_id");`
    )

    this.addStoreIdColumn("article", storeId)
    this.addSql(`DROP INDEX IF EXISTS "IDX_article_slug_locale_unique";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_article_slug_locale_store_unique" ON "article" ("slug", "locale", "store_id");`
    )

    this.addStoreIdColumn("page", storeId)
    this.addSql(`DROP INDEX IF EXISTS "IDX_page_slug_locale_unique";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_page_slug_locale_store_unique" ON "page" ("slug", "locale", "store_id") WHERE deleted_at IS NULL;`
    )

    this.addStoreIdColumn("page_version", storeId)
    this.addStoreIdColumn("page_block", storeId)

    this.addStoreIdColumn("cms_global", storeId)
    this.addSql(`DROP INDEX IF EXISTS "IDX_cms_global_scope_unique";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cms_global_scope_store_unique" ON "cms_global" ("scope", "store_id");`
    )

    this.addStoreIdColumn("cms_redirect", storeId)
    this.addSql(`DROP INDEX IF EXISTS "IDX_cms_redirect_from_path";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cms_redirect_from_path_store_unique" ON "cms_redirect" ("from_path", "store_id");`
    )

    this.addStoreIdColumn("media_asset", storeId)

    this.addStoreIdColumn("product_attribute", storeId)
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_attribute_handle_unique";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_attribute_handle_store_unique" ON "product_attribute" ("handle", "store_id");`
    )

    this.addStoreIdColumn("product_attr_link", storeId)
    this.addSql(
      `DROP INDEX IF EXISTS "IDX_product_attr_link_product_attribute_unique";`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_attr_link_product_attribute_store_unique" ON "product_attr_link" ("product_id", "attribute_id", "store_id");`
    )
  }

  private addMercflowContentStoreIdDown(): void {
    this.addSql(
      `DROP INDEX IF EXISTS "IDX_product_attr_link_product_attribute_store_unique";`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_attr_link_product_attribute_unique" ON "product_attr_link" ("product_id", "attribute_id");`
    )
    this.dropStoreIdColumn("product_attr_link")
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_attribute_handle_store_unique";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_attribute_handle_unique" ON "product_attribute" ("handle");`
    )
    this.dropStoreIdColumn("product_attribute")

    this.dropStoreIdColumn("media_asset")

    this.addSql(`DROP INDEX IF EXISTS "IDX_cms_redirect_from_path_store_unique";`)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_cms_redirect_from_path" ON "cms_redirect" ("from_path");`
    )
    this.dropStoreIdColumn("cms_redirect")

    this.addSql(`DROP INDEX IF EXISTS "IDX_cms_global_scope_store_unique";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cms_global_scope_unique" ON "cms_global" ("scope");`
    )
    this.dropStoreIdColumn("cms_global")

    this.dropStoreIdColumn("page_block")
    this.dropStoreIdColumn("page_version")

    this.addSql(`DROP INDEX IF EXISTS "IDX_page_slug_locale_store_unique";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_page_slug_locale_unique" ON "page" ("slug", "locale") WHERE deleted_at IS NULL;`
    )
    this.dropStoreIdColumn("page")

    this.addSql(`DROP INDEX IF EXISTS "IDX_article_slug_locale_store_unique";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_article_slug_locale_unique" ON "article" ("slug", "locale");`
    )
    this.dropStoreIdColumn("article")

    this.addSql(`DROP INDEX IF EXISTS "IDX_category_content_category_locale_store_unique";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_category_content_category_locale_unique" ON "category_content" ("category_id", "locale");`
    )
    this.dropStoreIdColumn("category_content")

    this.addSql(`DROP INDEX IF EXISTS "IDX_product_content_product_locale_store_unique";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_content_product_locale_unique" ON "product_content" ("product_id", "locale");`
    )
    this.dropStoreIdColumn("product_content")
  }

  private addGuapoCustomStoreIdUp(): void {
    const storeId = GUAPO_BACKFILL_STORE_ID
    const tables = [
      "brand",
      "product_product_brand_brand",
      "product_review",
      "product_review_image",
      "product_review_response",
      "product_review_stats",
      "guapo_free_shipping_setting",
    ] as const

    for (const table of tables) {
      this.addSql(`
        DO $migration$
        BEGIN
          IF to_regclass('public."${table}"') IS NOT NULL THEN
            ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "store_id" text;
            UPDATE "${table}" SET "store_id" = '${storeId}' WHERE "store_id" IS NULL;
            ALTER TABLE "${table}" ALTER COLUMN "store_id" SET NOT NULL;
            CREATE INDEX IF NOT EXISTS "IDX_${table}_store_id" ON "${table}" ("store_id");
          END IF;
        END
        $migration$;
      `)
    }
  }

  private addGuapoCustomStoreIdDown(): void {
    const tables = [
      "guapo_free_shipping_setting",
      "product_review_stats",
      "product_review_response",
      "product_review_image",
      "product_review",
      "product_product_brand_brand",
      "brand",
    ] as const

    for (const table of tables) {
      this.addSql(`
        DO $migration$
        BEGIN
          IF to_regclass('public."${table}"') IS NOT NULL THEN
            DROP INDEX IF EXISTS "IDX_${table}_store_id";
            ALTER TABLE "${table}" DROP COLUMN IF EXISTS "store_id";
          END IF;
        END
        $migration$;
      `)
    }
  }

  private addStoreIdColumn(table: string, storeId: string): void {
    this.addSql(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "store_id" text;`)
    this.addSql(
      `UPDATE "${table}" SET "store_id" = '${storeId}' WHERE "store_id" IS NULL;`
    )
    this.addSql(`ALTER TABLE "${table}" ALTER COLUMN "store_id" SET NOT NULL;`)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_${table}_store_id" ON "${table}" ("store_id");`
    )
  }

  private dropStoreIdColumn(table: string): void {
    this.addSql(`DROP INDEX IF EXISTS "IDX_${table}_store_id";`)
    this.addSql(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "store_id";`)
  }
}
