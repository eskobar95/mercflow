import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import { CONTENT_MODULE } from "@mercflow/content-module"

import {
  categoryPublicPathFromHandle,
  productPublicPathFromHandle,
} from "./utils/paths"

const CATALOG_PAGE_SIZE = 50
const DEFAULT_LOCALE = "en"

type RemoteQueryGraph = (input: {
  entity: string
  fields: string[]
  filters?: Record<string, unknown>
  pagination?: { take: number; skip: number }
}) => Promise<{ data?: unknown; metadata?: { take?: number } }>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export type SitemapCatalogProduct = {
  id: string
  handle: string
  updated_at: string | null
  category_ids: string[]
}

export type SitemapCatalogCategory = {
  id: string
  handle: string
  updated_at: string | null
}

export type SitemapCatalogPage = {
  id: string
  slug: string
  locale: string
  updated_at: string | null
}

export async function resolveSalesChannelIdsForStore(
  graph: RemoteQueryGraph,
  storeId: string
): Promise<string[]> {
  const page = await graph({
    entity: "sales_channel",
    fields: ["id"],
    filters: {
      store: {
        id: storeId,
      },
    },
  })
  const rows = Array.isArray(page.data) ? page.data : []
  const ids: string[] = []
  for (const row of rows) {
    if (isRecord(row) && typeof row.id === "string" && row.id.length > 0) {
      ids.push(row.id)
    }
  }
  return ids
}

function parseProductRow(row: unknown): SitemapCatalogProduct | null {
  if (!isRecord(row)) {
    return null
  }
  const id = typeof row.id === "string" ? row.id : null
  const handle = typeof row.handle === "string" ? row.handle.trim() : ""
  const status = typeof row.status === "string" ? row.status : null
  if (!id || !handle || status !== "published") {
    return null
  }
  const category_ids: string[] = []
  const categories = row.categories
  if (Array.isArray(categories)) {
    for (const cat of categories) {
      if (isRecord(cat) && typeof cat.id === "string") {
        category_ids.push(cat.id)
      }
    }
  }
  const updated_at =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : typeof row.updated_at === "string"
        ? row.updated_at
        : null
  return { id, handle, updated_at, category_ids }
}

function parseCategoryRow(row: unknown): SitemapCatalogCategory | null {
  if (!isRecord(row)) {
    return null
  }
  const id = typeof row.id === "string" ? row.id : null
  const handle = typeof row.handle === "string" ? row.handle.trim() : ""
  if (row.is_active === false || row.is_internal === true) {
    return null
  }
  if (!id || !handle) {
    return null
  }
  const updated_at =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : typeof row.updated_at === "string"
        ? row.updated_at
        : null
  return { id, handle, updated_at }
}

export async function loadPublishedProducts(
  graph: RemoteQueryGraph,
  salesChannelIds: string[]
): Promise<SitemapCatalogProduct[]> {
  if (salesChannelIds.length === 0) {
    return []
  }
  const products: SitemapCatalogProduct[] = []
  let skip = 0
  while (true) {
    const page = await graph({
      entity: "product",
      fields: ["id", "handle", "status", "updated_at", "categories.id"],
      filters: {
        sales_channels: { id: salesChannelIds },
      },
      pagination: { take: CATALOG_PAGE_SIZE, skip },
    })
    const rows = Array.isArray(page.data) ? page.data : []
    if (rows.length === 0) {
      break
    }
    skip += rows.length
    for (const row of rows) {
      const parsed = parseProductRow(row)
      if (parsed) {
        products.push(parsed)
      }
    }
    const take = page.metadata?.take ?? CATALOG_PAGE_SIZE
    if (rows.length < take) {
      break
    }
  }
  return products
}

export async function loadCategories(
  graph: RemoteQueryGraph,
  salesChannelIds: string[]
): Promise<SitemapCatalogCategory[]> {
  if (salesChannelIds.length === 0) {
    return []
  }
  const categories: SitemapCatalogCategory[] = []
  let skip = 0
  while (true) {
    const page = await graph({
      entity: "product_category",
      fields: ["id", "handle", "updated_at", "is_active", "is_internal"],
      filters: {
        products: {
          sales_channels: { id: salesChannelIds },
        },
      },
      pagination: { take: CATALOG_PAGE_SIZE, skip },
    })
    const rows = Array.isArray(page.data) ? page.data : []
    if (rows.length === 0) {
      break
    }
    skip += rows.length
    for (const row of rows) {
      const parsed = parseCategoryRow(row)
      if (parsed) {
        categories.push(parsed)
      }
    }
    const take = page.metadata?.take ?? CATALOG_PAGE_SIZE
    if (rows.length < take) {
      break
    }
  }
  return categories
}

type ContentPageReader = {
  withTenant: <T>(storeId: string, fn: () => Promise<T>) => Promise<T>
  listPages: (
    filters: Record<string, unknown>,
    config?: Record<string, unknown>,
    context?: unknown
  ) => Promise<Array<Record<string, unknown>>>
  storePathForPageSlug: (slug: string) => string
}

export async function loadPublishedPages(
  scope: MedusaContainer,
  storeId: string
): Promise<SitemapCatalogPage[]> {
  const contentService = scope.resolve(CONTENT_MODULE) as ContentPageReader
  return contentService.withTenant(storeId, async () => {
    const rows = await contentService.listPages(
      { status: "published" },
      { order: { updated_at: "DESC" } }
    )
    const pages: SitemapCatalogPage[] = []
    for (const row of rows) {
      if (!isRecord(row)) {
        continue
      }
      const id = typeof row.id === "string" ? row.id : null
      const slug = typeof row.slug === "string" ? row.slug.trim() : ""
      const locale =
        typeof row.locale === "string" && row.locale.trim().length > 0
          ? row.locale.trim()
          : DEFAULT_LOCALE
      if (!id || !slug) {
        continue
      }
      const updated_at =
        row.updated_at instanceof Date
          ? row.updated_at.toISOString()
          : typeof row.updated_at === "string"
            ? row.updated_at
            : null
      pages.push({ id, slug, locale, updated_at })
    }
    return pages
  })
}

export function buildAbsoluteLoc(storefrontUrl: string, path: string): string {
  const base = storefrontUrl.replace(/\/+$/, "")
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalizedPath}`
}

export function productPath(handle: string): string {
  return productPublicPathFromHandle(handle)
}

export function categoryPath(handle: string): string {
  return categoryPublicPathFromHandle(handle)
}

export async function loadSitemapCatalog(
  scope: MedusaContainer,
  storeId: string
): Promise<{
  products: SitemapCatalogProduct[]
  categories: SitemapCatalogCategory[]
  pages: SitemapCatalogPage[]
}> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: RemoteQueryGraph
  }
  const salesChannelIds = await resolveSalesChannelIdsForStore(query.graph, storeId)
  if (salesChannelIds.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No sales channels found for this store — cannot build sitemap"
    )
  }
  const [products, categories, pages] = await Promise.all([
    loadPublishedProducts(query.graph, salesChannelIds),
    loadCategories(query.graph, salesChannelIds),
    loadPublishedPages(scope, storeId),
  ])
  return { products, categories, pages }
}
