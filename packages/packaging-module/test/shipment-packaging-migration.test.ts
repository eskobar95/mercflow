import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationPath = join(
  __dirname,
  "../src/modules/packaging/migrations/Migration20260610210000CreateShipmentPackaging.ts"
)

describe("Migration20260610210000CreateShipmentPackaging", (): void => {
  it("creates shipment_packaging with tenant RLS on app.tenant_id", (): void => {
    const source = readFileSync(migrationPath, "utf8")
    expect(source).toContain('"shipment_packaging"')
    expect(source).toContain("shipment_packaging_tenant_isolation")
    expect(source).toContain("current_setting('app.tenant_id', true)")
    expect(source).toContain("MIGRATION DECISION LOG")
    expect(source).toContain("IDX_shipment_packaging_store_fulfillment")
    expect(source).toContain("dimensions_snapshot_json")
  })
})
