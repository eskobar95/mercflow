import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const here = dirname(fileURLToPath(import.meta.url))
const migrationPath = join(
  here,
  "migrations/Migration20260604240000CreateMercflowInventoryBatch2.ts"
)

describe("Migration20260604240000CreateMercflowInventoryBatch2", (): void => {
  it("creates supplier and PO tables with RLS", (): void => {
    const source = readFileSync(migrationPath, "utf8")
    expect(source).toContain("mercflow_supplier")
    expect(source).toContain("mercflow_purchase_order")
    expect(source).toContain("tenant_isolation")
    expect(source).toContain("MIGRATION DECISION LOG")
  })
})
