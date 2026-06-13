import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationPath = join(
  __dirname,
  "../src/modules/payment/migrations/Migration20260613120000CreatePaymentProviderConfig.ts"
)

describe("Migration20260613120000CreatePaymentProviderConfig", (): void => {
  it("creates payment_provider_config with tenant RLS on app.tenant_id", (): void => {
    const source = readFileSync(migrationPath, "utf8")
    expect(source).toContain("MIGRATION DECISION LOG")
    expect(source).toContain('"payment_provider_config"')
    expect(source).toContain("payment_provider_config_tenant_isolation")
    expect(source).toContain("current_setting('app.tenant_id', true)")
    expect(source).toContain("IDX_payment_provider_config_store_provider_unique")
    expect(source).toContain("'stripe', 'mobilepay', 'klarna'")
    expect(source).toContain("'test', 'live'")
  })
})
