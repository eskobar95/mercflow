import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { TENANCY_TABLES } from "../src/modules/content/migrations/Migration20260604220000EnableRlsTenantIsolation"

const migrationDir = dirname(fileURLToPath(import.meta.url))

describe("T002 RLS tenant isolation migration", (): void => {
  it("covers all T001 tenancy tables", (): void => {
    expect(TENANCY_TABLES).toHaveLength(18)
    expect(TENANCY_TABLES).toContain("article")
    expect(TENANCY_TABLES).toContain("product_content")
    expect(TENANCY_TABLES).toContain("brand")
  })

  it("enables FORCE RLS and tenant_isolation policy per table", (): void => {
    const source = readFileSync(
      join(
        migrationDir,
        "../src/modules/content/migrations/Migration20260604220000EnableRlsTenantIsolation.ts"
      ),
      "utf8"
    )
    for (const table of TENANCY_TABLES) {
      expect(source).toContain(`"${table}"`)
    }
    expect(source).toContain("FORCE ROW LEVEL SECURITY")
    expect(source).toContain("tenant_isolation")
    expect(source).toContain("current_setting('app.store_id', true)")
    expect(source).toContain("MIGRATION DECISION LOG")
  })
})
