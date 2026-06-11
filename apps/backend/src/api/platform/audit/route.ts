import type { MedusaResponse } from "@medusajs/framework/http"

import type { PlatformAuthRequest } from "../../../lib/platform-auth/clerk-platform-auth-middleware"
import { listPlatformAuditLog } from "../../../lib/platform-db/audit-log"
import {
  platformAuditQuerySchema,
  resolvePlatformListLimit,
  resolvePlatformListOffset,
  sendPlatformZodError,
} from "../../../lib/platform-http/list-query"
import {
  requirePlatformDatabase,
  requirePlatformOperator,
} from "../../../lib/platform-http/require-platform-operator"

export async function GET(
  req: PlatformAuthRequest,
  res: MedusaResponse,
): Promise<void> {
  if (!requirePlatformOperator(req, res)) {
    return
  }

  if (!requirePlatformDatabase(res)) {
    return
  }

  const parsed = platformAuditQuerySchema.safeParse(req.query ?? {})
  if (!parsed.success) {
    sendPlatformZodError(res, parsed.error)
    return
  }

  const limit = resolvePlatformListLimit(parsed.data.limit)
  const offset = resolvePlatformListOffset(parsed.data.offset)

  try {
    const { entries, count } = await listPlatformAuditLog({
      limit,
      offset,
      from: parsed.data.from,
      to: parsed.data.to,
    })

    res.status(200).json({
      audit_entries: entries.map((row) => ({
        id: row.id,
        operator_email: row.operator_email,
        action: row.action,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        metadata: row.metadata,
        created_at: row.created_at,
      })),
      count,
      limit,
      offset,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list audit log"

    if (message.includes("platform_audit_log") && message.includes("does not exist")) {
      res.status(503).json({
        message:
          "platform_audit_log table is not available yet. Run migrations from T068 tenant management.",
      })
      return
    }

    res.status(500).json({ message })
  }
}
