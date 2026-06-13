import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const __dirname = dirname(fileURLToPath(import.meta.url))

describe("T080 payment migrations", (): void => {
  it("Migration20260613150000 seeds credentials from connector", (): void => {
    const source = readFileSync(
      join(__dirname, "../src/modules/payment/migrations/Migration20260613150000SeedStripeFromConnector.ts"),
      "utf8"
    )
    expect(source).toContain("DELETE FROM \"payment_provider_config\"")
  })

  it("Migration20260613160000 removes legacy payment connector columns", (): void => {
    const source = readFileSync(
      join(
        __dirname,
        "../../connector-module/src/modules/connector/migrations/Migration20260613160000RemoveStripeFromConnector.ts"
      ),
      "utf8"
    )
    expect(source).toContain("DROP COLUMN IF EXISTS \"secret_key_last4\"")
    expect(source).toContain("NOT IN ('shipmondo', 'plunk', 'gtm')")
  })
})
