import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import type { ArticleAdminRecord, ArticleStatus } from "./types"

export const DEFAULT_ARTICLE_LOCALE = "en"

function assertRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError("Expected object JSON")
  }
  return value as Record<string, unknown>
}

export function parseArticleAdminRecord(value: unknown): ArticleAdminRecord {
  const r = assertRecord(value)
  const id = r.id
  const slug = r.slug
  const title = r.title
  const locale = r.locale
  const status = r.status
  if (
    typeof id !== "string" ||
    typeof slug !== "string" ||
    typeof title !== "string" ||
    typeof locale !== "string" ||
    (status !== "draft" && status !== "published")
  ) {
    throw new TypeError("Invalid article payload")
  }
  const published_at =
    r.published_at === null || r.published_at === undefined
      ? null
      : typeof r.published_at === "string"
        ? r.published_at
        : null
  return {
    id,
    slug,
    title,
    body_json: r.body_json,
    locale,
    status: status as ArticleStatus,
    published_at,
    created_at: typeof r.created_at === "string" ? r.created_at : undefined,
    updated_at: typeof r.updated_at === "string" ? r.updated_at : undefined,
  }
}

export type SaveArticleBody = {
  title: string
  slug?: string | null
  body_json?: unknown
  locale?: string
  status?: ArticleStatus
  published_at?: string | null
}

function articlesListPath(locale?: string): string {
  const params = new URLSearchParams()
  if (locale) {
    params.set("locale", locale)
  }
  const qs = params.toString()
  return qs.length > 0 ? `/admin/articles?${qs}` : "/admin/articles"
}

export async function listArticlesAdmin(locale?: string): Promise<ArticleAdminRecord[]> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const url = `${base}${articlesListPath(locale)}`
  const response = await fetch(url, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const root = assertRecord(json)
  const rows = root.articles
  if (!Array.isArray(rows)) {
    throw new TypeError("Invalid API response: missing articles array")
  }
  return rows.map((row) => parseArticleAdminRecord(row))
}

export async function getArticleAdmin(articleId: string): Promise<ArticleAdminRecord> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const url = `${base}/admin/articles/${encodeURIComponent(articleId)}`
  const response = await fetch(url, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const root = assertRecord(json)
  if (!("article" in root)) {
    throw new TypeError("Invalid API response: missing article")
  }
  return parseArticleAdminRecord(root.article)
}

export async function createArticleAdmin(body: SaveArticleBody): Promise<ArticleAdminRecord> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const url = `${base}/admin/articles`
  const response = await fetch(url, {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const root = assertRecord(json)
  if (!("article" in root)) {
    throw new TypeError("Invalid API response: missing article")
  }
  return parseArticleAdminRecord(root.article)
}

export async function updateArticleAdmin(
  articleId: string,
  body: SaveArticleBody
): Promise<ArticleAdminRecord> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const url = `${base}/admin/articles/${encodeURIComponent(articleId)}`
  const response = await fetch(url, {
    method: "PATCH",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const root = assertRecord(json)
  if (!("article" in root)) {
    throw new TypeError("Invalid API response: missing article")
  }
  return parseArticleAdminRecord(root.article)
}

export async function deleteArticleAdmin(articleId: string): Promise<void> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const url = `${base}/admin/articles/${encodeURIComponent(articleId)}`
  const response = await fetch(url, {
    method: "DELETE",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
}
