import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

import {
  resolveAdminListLimit,
  resolveAdminListOffset,
} from "../../../../http/admin-list-limit"
import { sendZodError } from "../../../../http/zod-error"
import { CONNECTOR_MODULE } from "../../../../../modules/connector"
import type ConnectorModuleService from "../../../../../modules/connector/service"

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const q = querySchema.safeParse(req.query ?? {})
  if (!q.success) {
    sendZodError(q.error)
  }

  const limit = Math.min(resolveAdminListLimit(q.data.limit), 100)
  const offset = resolveAdminListOffset(q.data.offset)

  const svc = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const fetchLimit = Math.min(offset + limit, 100)
  const payments = await svc.stripeListPaymentsAdmin(fetchLimit)
  const paged = payments.slice(offset, offset + limit)

  res.status(200).json({
    data: {
      payments: paged.map((p) => ({
        id: p.id,
        amountMinor: p.amount_minor,
        currency: p.currency,
        status: p.status,
        customerLabel: p.customerLabel,
        createdEpoch: p.created_epoch,
      })),
      count: payments.length,
      limit,
      offset,
    },
  })
}
