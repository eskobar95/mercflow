import { getPlatformDbPool, isPlatformDbConfigured } from "../platform-db/platform-db"
import {
  getPlatformTenantBillingByStoreId,
  updatePlatformTenantBillingStatus,
} from "../platform-db/platform-tenant-billing"
import { getStripePlatformClient } from "../platform-billing/stripe-platform-client"
import type { SuspendTenantResult } from "./types"

async function disableStoreAndRevokeKeys(
  storeId: string,
  operatorEmail: string,
): Promise<{ revoked_api_key_ids: string[] }> {
  const pool = getPlatformDbPool()
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const storeResult = await client.query<{ id: string }>(
      `UPDATE store
       SET is_disabled = true,
           updated_at = NOW()
       WHERE id = $1
         AND deleted_at IS NULL
       RETURNING id`,
      [storeId],
    )

    if (storeResult.rowCount === 0) {
      throw new Error(`Store not found: ${storeId}`)
    }

    const keysResult = await client.query<{ id: string }>(
      `SELECT DISTINCT ak.id
       FROM api_key ak
       INNER JOIN publishable_api_key_sales_channel pasc
         ON pasc.api_key_id = ak.id
         AND pasc.deleted_at IS NULL
       INNER JOIN store s
         ON s.default_sales_channel_id = pasc.sales_channel_id
         AND s.deleted_at IS NULL
       WHERE s.id = $1
         AND ak.type = 'publishable'
         AND ak.revoked_at IS NULL
         AND ak.deleted_at IS NULL`,
      [storeId],
    )

    const revokedApiKeyIds = keysResult.rows.map((row) => row.id)

    if (revokedApiKeyIds.length > 0) {
      await client.query(
        `UPDATE api_key
         SET revoked_at = NOW(),
             revoked_by = $2,
             updated_at = NOW()
         WHERE id = ANY($1::text[])`,
        [revokedApiKeyIds, operatorEmail],
      )
    }

    await client.query("COMMIT")

    return { revoked_api_key_ids: revokedApiKeyIds }
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export async function suspendPlatformTenant(
  storeId: string,
  operatorEmail: string,
): Promise<SuspendTenantResult> {
  if (!isPlatformDbConfigured()) {
    throw new Error("PLATFORM_DATABASE_URL is not configured")
  }

  const partialErrors: string[] = []
  let stripeSubscriptionCanceled = false
  let storeDisabled = false
  let billingStatusUpdated = false
  let revokedApiKeyIds: string[] = []

  const billing = await getPlatformTenantBillingByStoreId(storeId)

  if (billing?.stripe_subscription_id) {
    const stripe = getStripePlatformClient()
    await stripe.subscriptions.cancel(billing.stripe_subscription_id)
    stripeSubscriptionCanceled = true
  } else {
    stripeSubscriptionCanceled = true
  }

  try {
    const disableResult = await disableStoreAndRevokeKeys(storeId, operatorEmail)
    storeDisabled = true
    revokedApiKeyIds = disableResult.revoked_api_key_ids
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to disable store and revoke API keys"
    console.error(`Suspend tenant partial failure for ${storeId}: ${message}`)
    partialErrors.push(message)
  }

  try {
    const updated = await updatePlatformTenantBillingStatus(storeId, {
      subscription_status: "canceled",
    })
    billingStatusUpdated = updated
    if (!updated) {
      partialErrors.push(`No platform_tenant_billing row found for store ${storeId}`)
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update platform_tenant_billing subscription status"
    console.error(`Suspend tenant partial failure for ${storeId}: ${message}`)
    partialErrors.push(message)
  }

  return {
    store_id: storeId,
    revoked_api_key_ids: revokedApiKeyIds,
    stripe_subscription_canceled: stripeSubscriptionCanceled,
    store_disabled: storeDisabled,
    billing_status_updated: billingStatusUpdated,
    partial_errors: partialErrors,
  }
}
