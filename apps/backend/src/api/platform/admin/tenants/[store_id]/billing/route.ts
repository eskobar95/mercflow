import type { MedusaResponse } from "@medusajs/framework/http"

import type { PlatformAuthRequest } from "../../../../../../lib/platform-auth/clerk-platform-auth-middleware"
import { getPlatformTenantBillingByStoreId } from "../../../../../../lib/platform-db/platform-tenant-billing"
import { isPlatformDbConfigured } from "../../../../../../lib/platform-db/platform-db"
import { getPlatformTenantById } from "../../../../../../lib/platform-tenants/list-tenants"

type PlatformTenantBillingResponse = {
  store_id: string
  clerk_org_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  stripe_price_id: string
  plan_tier: string
  billing_interval: string
  billing_currency: string
  subscription_status: string
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export async function GET(
  req: PlatformAuthRequest,
  res: MedusaResponse,
): Promise<void> {
  if (!req.platformOperator) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  if (!isPlatformDbConfigured()) {
    res.status(503).json({
      message:
        "Platform database is not configured. Set PLATFORM_DATABASE_URL on the backend.",
    })
    return
  }

  const storeId = req.params.store_id
  if (typeof storeId !== "string" || storeId.trim() === "") {
    res.status(400).json({ message: "Missing store id" })
    return
  }

  try {
    const tenant = await getPlatformTenantById(storeId)
    if (tenant === null) {
      res.status(404).json({ message: `Tenant not found: ${storeId}` })
      return
    }

    const billing = await getPlatformTenantBillingByStoreId(storeId)
    if (billing === null) {
      res.status(200).json({ billing: null })
      return
    }

    const payload: PlatformTenantBillingResponse = {
      store_id: billing.store_id,
      clerk_org_id: billing.clerk_org_id,
      stripe_customer_id: billing.stripe_customer_id,
      stripe_subscription_id: billing.stripe_subscription_id,
      stripe_price_id: billing.stripe_price_id,
      plan_tier: billing.plan_tier,
      billing_interval: billing.billing_interval,
      billing_currency: billing.billing_currency,
      subscription_status: billing.subscription_status,
      current_period_end:
        billing.current_period_end !== null
          ? billing.current_period_end.toISOString()
          : null,
      created_at: billing.created_at.toISOString(),
      updated_at: billing.updated_at.toISOString(),
    }

    res.status(200).json({ billing: payload })
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to load tenant billing",
    })
  }
}
