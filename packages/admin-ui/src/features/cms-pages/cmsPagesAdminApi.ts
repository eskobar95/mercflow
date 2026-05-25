import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

export type CmsPageType = "homepage" | "landing" | "content"
export type CmsPageStatus = "draft" | "published"

export type CmsPageAdminRow = {
  id: string
  slug: string
  title: string
  page_type: CmsPageType
  status: CmsPageStatus
  locale: string
  block_count: number
  updated_at?: string
}

export type CmsPageCreateBody = {
  title: string
  slug: string
  page_type: CmsPageType
  status: CmsPageStatus
  locale: string
}

export type CmsPagePatchBody = Partial<{
  title: string
  slug: string
  page_type: CmsPageType
  status: CmsPageStatus
}>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function readPageType(value: unknown): CmsPageType | undefined {
  if (value === "homepage" || value === "landing" || value === "content") {
    return value
  }
  return undefined
}

function readStatus(value: unknown): CmsPageStatus | undefined {
  if (value === "draft" || value === "published") {
    return value
  }
  return undefined
}

function parsePageRow(value: unknown): CmsPageAdminRow | null {
  if (!isRecord(value)) {
    return null
  }
  const id = readString(value.id)
  const slug = readString(value.slug)
  const title = readString(value.title)
  const locale = readString(value.locale)
  const page_type = readPageType(value.page_type)
  const status = readStatus(value.status)
  const block_count = typeof value.block_count === "number" ? value.block_count : undefined
  if (!id || !slug || !title || !locale || !page_type || !status || block_count === undefined) {
    return null
  }
  return {
    id,
    slug,
    title,
    page_type,
    status,
    locale,
    block_count,
    updated_at: readString(value.updated_at),
  }
}

function adminPagesBaseUrl(): string {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }
  return `${base}/admin/pages`
}

export async function fetchCmsPagesList(options: {
  locale?: string
  limit?: number
  offset?: number
}): Promise<{ pages: CmsPageAdminRow[]; count: number }> {
  const locale = options.locale ?? "en"
  const limit = options.limit ?? 50
  const offset = options.offset ?? 0
  const params = new URLSearchParams()
  params.set("locale", locale)
  params.set("limit", String(limit))
  params.set("offset", String(offset))

  const url = `${adminPagesBaseUrl()}?${params.toString()}`
  const response = await fetch(url, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(json)) {
    return { pages: [], count: 0 }
  }
  const rawPages = json.pages
  const pages: CmsPageAdminRow[] = []
  if (Array.isArray(rawPages)) {
    for (const row of rawPages) {
      const parsed = parsePageRow(row)
      if (parsed) {
        pages.push(parsed)
      }
    }
  }
  const count = typeof json.count === "number" ? json.count : pages.length
  return { pages, count }
}

export async function fetchCmsPageById(pageId: string): Promise<CmsPageAdminRow | null> {
  const url = `${adminPagesBaseUrl()}/${encodeURIComponent(pageId)}`
  const response = await fetch(url, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(json)) {
    return null
  }
  return parsePageRow(json.page)
}

export async function createCmsPage(body: CmsPageCreateBody): Promise<CmsPageAdminRow> {
  const url = adminPagesBaseUrl()
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
  if (!isRecord(json)) {
    throw new TypeError("Invalid create page response")
  }
  const row = parsePageRow(json.page)
  if (!row) {
    throw new TypeError("Invalid create page payload")
  }
  return row
}

export async function patchCmsPage(pageId: string, body: CmsPagePatchBody): Promise<CmsPageAdminRow> {
  const url = `${adminPagesBaseUrl()}/${encodeURIComponent(pageId)}`
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
  if (!isRecord(json)) {
    throw new TypeError("Invalid patch page response")
  }
  const row = parsePageRow(json.page)
  if (!row) {
    throw new TypeError("Invalid patch page payload")
  }
  return row
}

export async function deleteCmsPage(pageId: string): Promise<void> {
  const url = `${adminPagesBaseUrl()}/${encodeURIComponent(pageId)}`
  const response = await fetch(url, {
    method: "DELETE",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
}
