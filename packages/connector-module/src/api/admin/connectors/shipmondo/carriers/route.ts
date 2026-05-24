import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { CONNECTOR_MODULE } from "../../../../../modules/connector"
import type ConnectorModuleService from "../../../../../modules/connector/service"

function coerceCountryCode(query: Record<string, unknown> | undefined): string | undefined {
  if (!query || typeof query !== "object") {
    return undefined
  }
  const raw = query.country_code
  if (typeof raw !== "string" || raw.trim().length !== 2) {
    return undefined
  }

  const up = raw.trim().toUpperCase()
  return /^[A-Z]{2}$/.test(up) ? up : undefined
}

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const service = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const q = req.query as Record<string, unknown>
  const countryCode = coerceCountryCode(q)

  const data = await service.fetchShipmondoCarrierProducts({
    countryCode,
  })
  res.status(200).json({ data })
}
