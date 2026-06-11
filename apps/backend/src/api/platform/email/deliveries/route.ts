import type { MedusaResponse } from "@medusajs/framework/http"

import type { PlatformAuthRequest } from "../../../../lib/platform-auth/clerk-platform-auth-middleware"
import { parseSesError } from "../../../../lib/platform-email/ses-error-catalog"
import { listPlatformEmailDeliveries } from "../../../../lib/platform-db/email-deliveries"
import {
  platformEmailDeliveriesQuerySchema,
  resolvePlatformListLimit,
  resolvePlatformListOffset,
  sendPlatformZodError,
} from "../../../../lib/platform-http/list-query"
import {
  requirePlatformDatabase,
  requirePlatformOperator,
} from "../../../../lib/platform-http/require-platform-operator"

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

  const parsed = platformEmailDeliveriesQuerySchema.safeParse(req.query ?? {})
  if (!parsed.success) {
    sendPlatformZodError(res, parsed.error)
    return
  }

  const limit = resolvePlatformListLimit(parsed.data.limit)
  const offset = resolvePlatformListOffset(parsed.data.offset)

  try {
    const { deliveries, count } = await listPlatformEmailDeliveries({
      query: parsed.data.q,
      limit,
      offset,
    })

    res.status(200).json({
      email_deliveries: deliveries.map((row) => {
        const sesError = parseSesError(row.error_message)
        return {
          id: row.id,
          store_id: row.store_id,
          template_key: row.template_key,
          to_email: row.to_email,
          entity_id: row.entity_id,
          status: row.status,
          error_message: row.error_message,
          sent_at: row.sent_at,
          ses_message_id: row.ses_message_id,
          created_at: row.created_at,
          ses_error_code: sesError.code,
          ses_error_description: sesError.description,
        }
      }),
      count,
      limit,
      offset,
    })
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to list email deliveries",
    })
  }
}
