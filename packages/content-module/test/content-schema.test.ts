import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import * as models from "../src/models/index"

const __dirname = dirname(fileURLToPath(import.meta.url))

const TABLES = [
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

describe("content module CMS schema", (): void => {
  it("exports one DML model per table from src/models/index.ts", (): void => {
    const exported = Object.keys(models).sort()
    expect(exported.length).toBe(TABLES.length)
  })

  it("includes store_id on every content DML model", (): void => {
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
  })

  it("creates every table in the single foundation migration", (): void => {
    const path = join(
      __dirname,
      "../src/modules/content/migrations/Migration20260517203000.ts"
    )
    const src = readFileSync(path, "utf8")
    expect(src).toContain('drop table if exists "product_content"')
    expect(src).toContain('drop table if exists "category_content"')
    for (const table of TABLES) {
      expect(src).toContain(`create table if not exists "${table}"`)
    }
    expect(src).toContain("override async down()")
    for (const table of [...TABLES].reverse()) {
      expect(src).toContain(`drop table if exists "${table}"`)
    }
  })
})
