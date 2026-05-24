import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

import { sendZodError } from "../../../../http/zod-error"
import { CONNECTOR_MODULE } from "../../../../../modules/connector"
import type ConnectorModuleService from "../../../../../modules/connector/service"

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
})

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const q = querySchema.safeParse(req.query ?? {})
  if (!q.success) {
    sendZodError(res, q.error)
    return
  }

  const svc = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const payments = await svc.stripeListPaymentsAdmin(q.data.limit)
  res.status(200).json({
    data: {
      payments: payments.map((p) => ({
        id: p.id,
        amountMinor: p.amount_minor,
        currency: p.currency,
        status: p.status,
        customerLabel: p.customerLabel,
        createdEpoch: p.created_epoch,
      })),
    },
  })
}
