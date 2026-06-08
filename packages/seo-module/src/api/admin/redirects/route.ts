import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  resolveAdminListLimit,
  resolveAdminListOffset,
} from "../../http/admin-list-limit"
import { sendZodError } from "../../http/zod-error"
import { resolveAdminStoreId } from "../../http/resolve-admin-store-id"
import { SEO_MODULE } from "../../../modules/seo"
import {
  adminListQuerySchema,
  redirectBodySchema,
} from "../../../modules/seo/http-schemas"
import type SeoModuleService from "../../../modules/seo/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const query = req.query ?? {}
  const parsed = adminListQuerySchema.safeParse({
    limit: query.limit,
    offset: query.offset,
  })
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const limit = Math.min(resolveAdminListLimit(parsed.data.limit), 100)
  const offset = resolveAdminListOffset(parsed.data.offset)

  const storeId = resolveAdminStoreId(req)
  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  const { redirects, count } = await seoService.listRedirects(storeId, { limit, offset })
  const withChain = await Promise.all(
    redirects.map(async (row) => ({
      ...row,
      has_chain_warning: await seoService.redirectHasChainIssue(storeId, row),
    }))
  )
  res.status(200).json({
    redirects: withChain,
    count,
    limit,
    offset,
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveAdminStoreId(req)
  const body = redirectBodySchema.safeParse(req.body ?? {})
  if (!body.success) {
    sendZodError(body.error)
  }
  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  const redirect = await seoService.upsertRedirect(storeId, body.data)
  const has_chain_warning = await seoService.redirectHasChainIssue(storeId, redirect)
  res.status(201).json({ redirect: { ...redirect, has_chain_warning } })
}
