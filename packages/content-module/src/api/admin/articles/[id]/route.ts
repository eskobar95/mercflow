import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { sendZodError } from "../../../http/zod-error"
import { CONTENT_MODULE } from "../../../../modules/content"
import { articlePatchBodySchema } from "../../../../modules/content/http-schemas"
import type ContentModuleService from "../../../../modules/content/service"
import { articleRecordToAdminJson } from "../../../http/article-json"

function parsePublishedAtInput(
  value: string | null | undefined
): Date | null | undefined {
  if (value === undefined) {
    return undefined
  }
  if (value === null) {
    return null
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    return undefined
  }
  return d
}

/**
 * GET /admin/articles/:id
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const articleId = req.params.id
  if (!articleId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing article id")
  }

  const contentService = req.scope.resolve(CONTENT_MODULE) as ContentModuleService
  const row = await contentService.retrieveArticleById(articleId)
  if (!row) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Article "${articleId}" not found`)
  }
  res.status(200).json({ article: articleRecordToAdminJson(row) })
}

/**
 * PATCH /admin/articles/:id
 */
export const PATCH = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const articleId = req.params.id
  if (!articleId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing article id")
  }

  const parsed = articlePatchBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(res, parsed.error)
    return
  }

  const publishedAt = parsePublishedAtInput(parsed.data.published_at)

  const contentService = req.scope.resolve(CONTENT_MODULE) as ContentModuleService
  const row = await contentService.updateArticle(articleId, {
    title: parsed.data.title,
    slug: parsed.data.slug,
    body_json: parsed.data.body_json,
    locale: parsed.data.locale,
    status: parsed.data.status,
    published_at: publishedAt,
  })

  res.status(200).json({ article: articleRecordToAdminJson(row) })
}

/**
 * DELETE /admin/articles/:id — soft delete.
 */
export const DELETE = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const articleId = req.params.id
  if (!articleId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing article id")
  }

  const contentService = req.scope.resolve(CONTENT_MODULE) as ContentModuleService
  await contentService.deleteArticle(articleId)
  res.status(204).send()
}
