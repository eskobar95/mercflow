import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import type { PlatformAuthRequest } from "../../../../lib/platform-auth/clerk-platform-auth-middleware"
import { isPlatformDbConfigured } from "../../../../lib/platform-db/platform-db"
import { writePlatformAuditLog } from "../../../../lib/platform-tenants/audit-log"
import { provisionPlatformTenant } from "../../../../lib/platform-tenants/provision-tenant-service"
import type { ProvisionProgressEvent } from "../../../../lib/platform-tenants/types"
import { provisionTenantBodySchema } from "../../../../lib/platform-tenants/validators"

function writeSseEvent(
  res: MedusaResponse,
  event: string,
  data: unknown,
): void {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

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

  const parsed = provisionTenantBodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid request body",
      errors: parsed.error.flatten(),
    })
    return
  }

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8")
  res.setHeader("Cache-Control", "no-cache, no-transform")
  res.setHeader("Connection", "keep-alive")
  res.flushHeaders?.()

  try {
    const result = await provisionPlatformTenant(
      parsed.data,
      (progress: ProvisionProgressEvent) => {
        writeSseEvent(res, "progress", progress)
      },
    )

    await writePlatformAuditLog(req.scope, {
      operator_email: operator.email,
      action: "provision_tenant",
      entity_type: "tenant",
      entity_id: result.store_id,
      metadata: {
        name: parsed.data.name,
        domain: parsed.data.domain,
        email: parsed.data.email,
        currency: parsed.data.currency,
        timezone: parsed.data.timezone ?? null,
        sales_channel_id: result.sales_channel_id,
      },
    })

    writeSseEvent(res, "complete", result)
    res.end()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Tenant provisioning failed"
    writeSseEvent(res, "error", { message })
    res.end()
  }
}
