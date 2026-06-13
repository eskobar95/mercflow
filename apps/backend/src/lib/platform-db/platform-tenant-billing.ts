import { getPlatformDbPool } from "./platform-db"

export type PlatformTenantBillingRow = {
  store_id: string
  clerk_org_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  stripe_price_id: string
  plan_tier: string
  billing_interval: string
  billing_currency: string
  subscription_status: string
  current_period_end: Date | null
  created_at: Date
  updated_at: Date
}

export type UpsertPlatformTenantBillingInput = {
  store_id: string
  clerk_org_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  stripe_price_id: string
  plan_tier: string
  billing_interval: string
  billing_currency: string
  subscription_status: string
  current_period_end?: Date | null
}

export async function upsertPlatformTenantBilling(
  input: UpsertPlatformTenantBillingInput,
): Promise<void> {
  const client = await getPlatformDbPool().connect()

  try {
    await client.query(
      `INSERT INTO platform_tenant_billing (
         store_id,
         clerk_org_id,
         stripe_customer_id,
         stripe_subscription_id,
         stripe_price_id,
         plan_tier,
         billing_interval,
         billing_currency,
         subscription_status,
         current_period_end,
         created_at,
         updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       ON CONFLICT (store_id) DO UPDATE SET
         clerk_org_id = EXCLUDED.clerk_org_id,
         stripe_customer_id = EXCLUDED.stripe_customer_id,
         stripe_subscription_id = EXCLUDED.stripe_subscription_id,
         stripe_price_id = EXCLUDED.stripe_price_id,
         plan_tier = EXCLUDED.plan_tier,
         billing_interval = EXCLUDED.billing_interval,
         billing_currency = EXCLUDED.billing_currency,
         subscription_status = EXCLUDED.subscription_status,
         current_period_end = EXCLUDED.current_period_end,
         updated_at = NOW()`,
      [
        input.store_id,
        input.clerk_org_id,
        input.stripe_customer_id,
        input.stripe_subscription_id,
        input.stripe_price_id,
        input.plan_tier,
        input.billing_interval,
        input.billing_currency,
        input.subscription_status,
        input.current_period_end ?? null,
      ],
    )
  } finally {
    client.release()
  }
}

export async function getPlatformTenantBillingByStoreId(
  storeId: string,
): Promise<PlatformTenantBillingRow | null> {
  const client = await getPlatformDbPool().connect()

  try {
    const result = await client.query<PlatformTenantBillingRow>(
      `SELECT
         store_id,
         clerk_org_id,
         stripe_customer_id,
         stripe_subscription_id,
         stripe_price_id,
         plan_tier,
         billing_interval,
         billing_currency,
         subscription_status,
         current_period_end,
         created_at,
         updated_at
       FROM platform_tenant_billing
       WHERE store_id = $1
       LIMIT 1`,
      [storeId],
    )

    return result.rows[0] ?? null
  } finally {
    client.release()
  }
}
