import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const modelDir = join(__dirname, "../src/modules/seo/models")

describe("seo-module DML models", (): void => {
  it("includes store_id on mercflow tables", (): void => {
    for (const file of ["mercflow-seo-config.ts", "mercflow-redirect.ts"]) {
      expect(readFileSync(join(modelDir, file), "utf8")).toContain("store_id:")
    }
  })
})
