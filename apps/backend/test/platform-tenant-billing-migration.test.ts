import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const migrationPath = join(
  __dirname,
  "../src/modules/platform/migrations/Migration20260613140000PlatformTenantBilling.ts",
)

describe("Migration20260613140000PlatformTenantBilling", (): void => {
  it("creates platform_tenant_billing with required indexes and decision log", (): void => {
    const source = readFileSync(migrationPath, "utf8")
    expect(source).toContain("MIGRATION DECISION LOG")
    expect(source).toContain('"platform_tenant_billing"')
    expect(source).toContain('"store_id" text not null')
    expect(source).toContain('"clerk_org_id" text not null')
    expect(source).toContain('"stripe_customer_id" text not null')
    expect(source).toContain('"stripe_subscription_id" text not null')
    expect(source).toContain('"stripe_price_id" text not null')
    expect(source).toContain('"plan_tier" text not null')
    expect(source).toContain('"billing_interval" text not null')
    expect(source).toContain('"billing_currency" text not null')
    expect(source).toContain('"subscription_status" text not null')
    expect(source).toContain('"current_period_end" timestamptz null')
    expect(source).toContain("IDX_platform_tenant_billing_stripe_customer_id")
    expect(source).toContain("IDX_platform_tenant_billing_stripe_subscription_id")
    expect(source).toContain("override async down()")
    expect(source).toContain('drop table if exists "platform_tenant_billing"')
  })
})
