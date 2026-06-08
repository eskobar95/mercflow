import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

import {
  resolveAdminListLimit,
  resolveAdminListOffset,
} from "../../../../http/admin-list-limit"
import { sendZodError } from "../../../../http/zod-error"
import { CONNECTOR_MODULE } from "../../../../../modules/connector"
import type ConnectorModuleService from "../../../../../modules/connector/service"

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

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
  const listParsed = listQuerySchema.safeParse(req.query ?? {})
  if (!listParsed.success) {
    sendZodError(listParsed.error)
  }

  const limit = Math.min(resolveAdminListLimit(listParsed.data.limit), 100)
  const offset = resolveAdminListOffset(listParsed.data.offset)

  const service = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const countryCode = coerceCountryCode(req.query as Record<string, unknown>)

  const data = await service.fetchShipmondoCarrierProducts({
    countryCode,
  })
  const items = Array.isArray(data) ? data : []
  const paged = items.slice(offset, offset + limit)

  res.status(200).json({
    data: paged,
    count: items.length,
    limit,
    offset,
  })
}
