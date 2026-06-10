import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import {
  METAFIELD_LIBRARY_NAMESPACE,
  STANDARD_LIBRARY_SEEDS,
} from "../src/modules/metafield/standard-library-seeds"

const here = dirname(fileURLToPath(import.meta.url))
const migrationPath = join(
  here,
  "../src/modules/metafield/migrations/Migration20260610120400SeedStandardLibraryDefinitions.ts"
)

describe("Migration20260610120400SeedStandardLibraryDefinitions", (): void => {
  it("seeds skincare and fashion library rows idempotently", (): void => {
    const source = readFileSync(migrationPath, "utf8")
    expect(source).toContain("MIGRATION DECISION LOG")
    expect(source).toContain("ON CONFLICT (\"id\") DO UPDATE")
    expect(source).toContain(METAFIELD_LIBRARY_NAMESPACE)
    expect(source).toContain("is_standard")
    expect(source).toContain("STANDARD_LIBRARY_SEEDS")
    expect(source).toContain("seedValidations")
  })

  it("includes primary skincare fields from ADR-008", (): void => {
    const primarySkincare = STANDARD_LIBRARY_SEEDS.filter(
      (seed) => seed.vertical === "skincare" && seed.is_primary
    )
    expect(primarySkincare.map((seed) => seed.name)).toEqual([
      "Materiale",
      "Aldersgruppe",
      "Kosmetisk funktion",
      "Pakketype",
      "Målkøn",
    ])
  })
})
