import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import type { PlatformAuthRequest } from "../../../../../../lib/platform-auth/clerk-platform-auth-middleware"
import { isPlatformDbConfigured } from "../../../../../../lib/platform-db/platform-db"
import { writePlatformAuditLog } from "../../../../../../lib/platform-tenants/audit-log"
import { getPlatformTenantById } from "../../../../../../lib/platform-tenants/list-tenants"
import { suspendPlatformTenant } from "../../../../../../lib/platform-tenants/suspend-tenant"
import { suspendTenantBodySchema } from "../../../../../../lib/platform-tenants/validators"

export async function POST(
  req: PlatformAuthRequest & MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const operator = req.platformOperator
  if (!operator) {
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

  const parsed = suspendTenantBodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid request body",
      errors: parsed.error.flatten(),
    })
    return
  }

  try {
    const existing = await getPlatformTenantById(storeId)
    if (existing === null) {
      res.status(404).json({ message: `Tenant not found: ${storeId}` })
      return
    }

    if (existing.is_disabled) {
      res.status(409).json({ message: "Tenant is already suspended" })
      return
    }

    const result = await suspendPlatformTenant(storeId, operator.email)

    await writePlatformAuditLog(req.scope, {
      operator_email: operator.email,
      action: "suspend_tenant",
      entity_type: "tenant",
      entity_id: storeId,
      metadata: {
        reason: parsed.data.reason,
        revoked_api_key_ids: result.revoked_api_key_ids,
        stripe_subscription_canceled: result.stripe_subscription_canceled,
        store_disabled: result.store_disabled,
        billing_status_updated: result.billing_status_updated,
        partial_errors: result.partial_errors,
      },
    })

    res.status(200).json({
      tenant: {
        ...existing,
        is_disabled: result.store_disabled ? true : existing.is_disabled,
      },
      revoked_api_key_ids: result.revoked_api_key_ids,
      stripe_subscription_canceled: result.stripe_subscription_canceled,
      store_disabled: result.store_disabled,
      billing_status_updated: result.billing_status_updated,
      partial_success: result.partial_errors.length > 0,
      errors: result.partial_errors,
    })
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to suspend tenant",
    })
  }
}
