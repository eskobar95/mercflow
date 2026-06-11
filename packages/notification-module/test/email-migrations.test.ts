import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const __dirname = dirname(fileURLToPath(import.meta.url))
const emailConfigsMigrationPath = join(
  __dirname,
  "../src/modules/notification/migrations/Migration20260611100000CreateEmailConfigs.ts"
)
const emailConfigsDnsRecordsMigrationPath = join(
  __dirname,
  "../src/modules/notification/migrations/Migration20260611120000AddEmailConfigsDnsRecords.ts"
)
const emailDeliveriesMigrationPath = join(
  __dirname,
  "../src/modules/notification/migrations/Migration20260611110000CreateEmailDeliveries.ts"
)

describe("Migration20260611100000CreateEmailConfigs", (): void => {
  it("creates email_configs with tenant RLS on app.tenant_id", (): void => {
    const source = readFileSync(emailConfigsMigrationPath, "utf8")
    expect(source).toContain('"email_configs"')
    expect(source).toContain("email_configs_tenant_isolation")
    expect(source).toContain("current_setting('app.tenant_id', true)")
    expect(source).toContain("MIGRATION DECISION LOG")
    expect(source).toContain("IDX_email_configs_store_unique")
  })
})

describe("Migration20260611120000AddEmailConfigsDnsRecords", (): void => {
  it("adds dns_records jsonb column to email_configs", (): void => {
    const source = readFileSync(emailConfigsDnsRecordsMigrationPath, "utf8")
    expect(source).toContain('"dns_records"')
    expect(source).toContain("jsonb")
    expect(source).toContain("MIGRATION DECISION LOG")
  })
})

describe("Migration20260611110000CreateEmailDeliveries", (): void => {
  it("creates email_deliveries with idempotency_key unique index and RLS", (): void => {
    const source = readFileSync(emailDeliveriesMigrationPath, "utf8")
    expect(source).toContain('"email_deliveries"')
    expect(source).toContain("email_deliveries_tenant_isolation")
    expect(source).toContain("current_setting('app.tenant_id', true)")
    expect(source).toContain("MIGRATION DECISION LOG")
    expect(source).toContain("IDX_email_deliveries_idempotency_key")
  })
})
