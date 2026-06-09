import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const here = dirname(fileURLToPath(import.meta.url))
const migrationPath = join(
  here,
  "../src/modules/metafield/migrations/Migration20260610120000CreateMetafieldDefinitions.ts"
)

describe("Migration20260610120000CreateMetafieldDefinitions", (): void => {
  it("creates metafield_definitions with unique index and RLS policies", (): void => {
    const source = readFileSync(migrationPath, "utf8")
    expect(source).toContain("metafield_definitions")
    expect(source).toContain("MIGRATION DECISION LOG")
    expect(source).toContain("IDX_metafield_definitions_store_owner_ns_key")
    expect(source).toContain("store_id IS NULL")
    expect(source).toContain("current_setting('app.tenant_id', true)")
    expect(source).toContain("metafield_definitions_insert")
    expect(source).toContain("WITH CHECK (store_id = current_setting('app.tenant_id', true))")
  })
})
