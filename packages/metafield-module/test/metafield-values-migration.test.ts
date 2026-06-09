import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, "../src/modules/metafield/migrations")

describe("metafield values migrations", (): void => {
  it("creates metafield_value with typed columns and unique constraint", (): void => {
    const source = readFileSync(
      join(migrationsDir, "Migration20260610120200CreateMetafieldValues.ts"),
      "utf8"
    )
    expect(source).toContain('"metafield_values"')
    expect(source).toContain('"value_json"')
    expect(source).toContain('"value_number"')
    expect(source).toContain('"value_boolean"')
    expect(source).toContain('"locale" text not null default \'en\'')
    expect(source).toContain('"store_id", "definition_id", "owner_id", "locale"')
  })

  it("enables RLS on metafield_value using app.tenant_id", (): void => {
    const source = readFileSync(
      join(migrationsDir, "Migration20260610120300EnableRlsMetafieldValues.ts"),
      "utf8"
    )
    expect(source).toContain("ENABLE ROW LEVEL SECURITY")
    expect(source).toContain("current_setting('app.tenant_id', true)")
  })
})
