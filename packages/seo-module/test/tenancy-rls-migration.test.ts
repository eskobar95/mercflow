import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

describe("seo-module RLS migration", (): void => {
  it("enables tenant_isolation on mercflow seo tables", (): void => {
    const source = readFileSync(
      join(
        __dirname,
        "../src/modules/seo/migrations/Migration20260604141000EnableRlsMercflowSeo.ts"
      ),
      "utf8"
    )
    expect(source).toContain("mercflow_seo_config")
    expect(source).toContain("mercflow_redirect")
    expect(source).toContain("tenant_isolation")
    expect(source).toContain("current_setting('app.store_id', true)")
  })
})
