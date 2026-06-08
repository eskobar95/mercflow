import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sendZodError } from "../../../http/zod-error"
import { resolveAdminStoreId } from "../../../http/resolve-admin-store-id"
import { buildFeedValidationReport } from "../../../../modules/feed/feed-admin-overview"
import { feedValidateQuerySchema } from "../../../../modules/feed/http-schemas"
import { FEED_MODULE } from "../../../../modules/feed"
import type FeedConfigService from "../../../../modules/feed/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveAdminStoreId(req)
  const query = feedValidateQuerySchema.safeParse(req.query)
  if (!query.success) {
    sendZodError(query.error)
  }

  const feedConfigService = req.scope.resolve(FEED_MODULE) as FeedConfigService
  const report = await buildFeedValidationReport({
    scope: req.scope,
    feedConfigService,
    storeId,
    locale: query.data.locale,
  })

  res.status(200).json({
    validation: report,
  })
}
