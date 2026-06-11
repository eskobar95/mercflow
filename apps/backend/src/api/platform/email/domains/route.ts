import type { MedusaResponse } from "@medusajs/framework/http"

import type { PlatformAuthRequest } from "../../../../lib/platform-auth/clerk-platform-auth-middleware"
import { listPlatformEmailDomains } from "../../../../lib/platform-db/email-domains"
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

  try {
    const domains = await listPlatformEmailDomains()

    res.status(200).json({
      email_domains: domains.map((row) => ({
        store_id: row.store_id,
        domain: row.domain,
        from_email: row.from_email,
        ses_domain_status: row.ses_domain_status,
        ses_identity_arn: row.ses_identity_arn,
        updated_at: row.updated_at,
      })),
      count: domains.length,
    })
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to list email domains",
    })
  }
}
