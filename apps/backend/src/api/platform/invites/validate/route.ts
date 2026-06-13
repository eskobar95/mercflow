import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { validatePlatformInviteToken } from "../../../../lib/platform-db/platform-invites"
import { validatePlatformInviteQuerySchema } from "../../../../lib/platform-invites/validators"
import { sendPlatformZodError } from "../../../../lib/platform-http/list-query"
import { requirePlatformDatabase } from "../../../../lib/platform-http/require-platform-operator"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  if (!requirePlatformDatabase(res)) {
    return
  }

  const parsed = validatePlatformInviteQuerySchema.safeParse(req.query ?? {})
  if (!parsed.success) {
    sendPlatformZodError(res, parsed.error)
    return
  }

  try {
    const result = await validatePlatformInviteToken(parsed.data.token)

    res.status(200).json({
      valid: result.valid,
      email: result.email,
      store_name: result.store_name,
    })
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to validate invite token",
    })
  }
}
