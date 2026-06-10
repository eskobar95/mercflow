import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationPath = join(
  __dirname,
  "../src/modules/packaging/migrations/Migration20260610200000CreatePackagingTypes.ts"
)

describe("Migration20260610200000CreatePackagingTypes", (): void => {
  it("creates packaging_types with tenant RLS on app.tenant_id", (): void => {
    const source = readFileSync(migrationPath, "utf8")
    expect(source).toContain('"packaging_types"')
    expect(source).toContain("packaging_types_tenant_isolation")
    expect(source).toContain("current_setting('app.tenant_id', true)")
    expect(source).toContain("MIGRATION DECISION LOG")
    expect(source).toContain("IDX_packaging_types_store_name")
  })
})
