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
    expect(src).toContain('"media_gallery" text[] null')
    expect(src).toContain('"snapshot_json" jsonb null')
    expect(src).toContain('"IDX_page_slug_locale_unique"')
    expect(src).toContain("override async down()")
    for (const table of [...TABLES].reverse()) {
      expect(src).toContain(`drop table if exists "${table}"`)
    }
  })
})
