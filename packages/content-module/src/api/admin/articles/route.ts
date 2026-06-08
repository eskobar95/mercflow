import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  resolveAdminListLimit,
  resolveAdminListOffset,
} from "../../http/admin-list-limit"
import { sendZodError } from "../../http/zod-error"
import { CONTENT_MODULE } from "../../../modules/content"
import {
  articleAdminListQuerySchema,
  articlePostBodySchema,
} from "../../../modules/content/http-schemas"
import type ContentModuleService from "../../../modules/content/service"
import { articleRecordToAdminJson } from "../../http/article-json"

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

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const query = articleAdminListQuerySchema.safeParse(req.query ?? {})
  if (!query.success) {
    sendZodError(query.error)
  }

  const limit = Math.min(resolveAdminListLimit(query.data.limit), 100)
  const offset = resolveAdminListOffset(query.data.offset)

  const contentService = req.scope.resolve(CONTENT_MODULE) as ContentModuleService
  const { articles, count } = await contentService.listArticlesForAdmin({
    locale: query.data.locale,
    limit,
    offset,
  })
  res.status(200).json({
    articles: articles.map((row) => articleRecordToAdminJson(row)),
    count,
    limit,
    offset,
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = articlePostBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const publishedAt = parsePublishedAtInput(parsed.data.published_at)

  const contentService = req.scope.resolve(CONTENT_MODULE) as ContentModuleService
  const row = await contentService.createArticle({
    title: parsed.data.title,
    slug: parsed.data.slug ?? null,
    body_json: parsed.data.body_json,
    locale: parsed.data.locale,
    status: parsed.data.status,
    published_at: publishedAt,
  })

  res.status(201).json({ article: articleRecordToAdminJson(row) })
}
