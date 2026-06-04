import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import * as models from "../src/models/index"

const __dirname = dirname(fileURLToPath(import.meta.url))

const MERCFLOW_TABLES = [
  "product_content",
  "category_content",
  "article",
  "page",
  "page_version",
  "page_block",
  "cms_global",
  "cms_redirect",
  "media_asset",
  "product_attribute",
  "product_attr_link",
] as const

const GUAPO_CUSTOM_TABLES = [
  "brand",
  "product_product_brand_brand",
  "product_review",
  "product_review_image",
  "product_review_response",
  "product_review_stats",
  "guapo_free_shipping_setting",
] as const

describe("T001 store_id tenancy migration", (): void => {
  it("defines store_id on every MercFlow content DML model", (): void => {
    const modelDir = join(__dirname, "../src/modules/content/models")
    const files = [
      "product-content.ts",
      "category-content.ts",
      "article.ts",
      "page.ts",
      "page-version.ts",
      "page-block.ts",
      "cms-global.ts",
      "cms-redirect.ts",
      "media-asset.ts",
      "product-attribute.ts",
      "product-attr-link.ts",
    ]
    for (const file of files) {
      expect(readFileSync(join(modelDir, file), "utf8")).toContain("store_id:")
    }
    expect(Object.keys(models).length).toBe(MERCFLOW_TABLES.length)
  })

  it("migration backfills, sets NOT NULL, and rebuilds composite uniques", (): void => {
    const path = join(
      __dirname,
      "../src/modules/content/migrations/Migration20260604120000AddStoreIdTenancy.ts"
    )
    const src = readFileSync(path, "utf8")

    expect(src).toContain("MIGRATION DECISION LOG")
    expect(src).toContain("override async down()")

    for (const table of MERCFLOW_TABLES) {
      expect(src).toContain(`addStoreIdColumn("${table}"`)
    }

    expect(src).toContain("IDX_article_slug_locale_store_unique")
    expect(src).toContain("IDX_product_content_product_locale_store_unique")
    expect(src).toContain("IDX_category_content_category_locale_store_unique")
    expect(src).toContain("IDX_cms_global_scope_store_unique")
    expect(src).toContain("IDX_cms_redirect_from_path_store_unique")
    expect(src).toContain('DROP INDEX IF EXISTS "IDX_page_slug_locale_unique"')
    expect(src).toContain("IDX_page_slug_locale_store_unique")
    expect(src).toContain("WHERE deleted_at IS NULL")
    expect(src).toContain("IDX_product_attribute_handle_store_unique")
    expect(src).toContain("IDX_product_attr_link_product_attribute_store_unique")

    const followUp = join(
      __dirname,
      "../src/modules/content/migrations/Migration20260604183000ProductAttrLinkStoreUnique.ts"
    )
    expect(readFileSync(followUp, "utf8")).toContain(
      "IDX_product_attr_link_product_attribute_store_unique"
    )

    for (const table of GUAPO_CUSTOM_TABLES) {
      expect(src).toContain(`"${table}"`)
    }
  })
})
