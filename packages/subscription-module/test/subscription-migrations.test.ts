import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const __dirname = dirname(fileURLToPath(import.meta.url))
const foundationMigrationPath = join(
  __dirname,
  "../src/modules/subscription/migrations/Migration20260611130000ExpandSubscriptionFoundation.ts"
)

describe("Migration20260611130000ExpandSubscriptionFoundation", (): void => {
  it("creates subscription tables with tenant RLS on app.tenant_id", (): void => {
    const source = readFileSync(foundationMigrationPath, "utf8")
    expect(source).toContain("MIGRATION DECISION LOG")
    expect(source).toContain("subscription_tenant_isolation")
    expect(source).toContain("subscription_config_tenant_isolation")
    expect(source).toContain("subscription_renewal_log_tenant_isolation")
    expect(source).toContain("current_setting('app.tenant_id', true)")
    expect(source).toContain('EXISTS (\n            SELECT 1 FROM "subscription" s')
    expect(source).toContain("IDX_subscription_config_store_unique")
  })
})
