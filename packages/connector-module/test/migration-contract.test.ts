import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const migrationPath = fileURLToPath(
  new URL("../src/modules/connector/migrations/Migration20260517180000.ts", import.meta.url)
)

describe("Migration20260517180000 contract", () => {
  it("drops connector_log before connector_config in down()", () => {
    const source = readFileSync(migrationPath, "utf8")
    const downIdx = source.indexOf("override async down")
    expect(downIdx).toBeGreaterThan(-1)
    const downSection = source.slice(downIdx)
    const logDrop = downSection.indexOf("connector_log")
    const configDrop = downSection.indexOf("connector_config")
    expect(logDrop).toBeGreaterThan(-1)
    expect(configDrop).toBeGreaterThan(-1)
    expect(logDrop).toBeLessThan(configDrop)
  })
})
