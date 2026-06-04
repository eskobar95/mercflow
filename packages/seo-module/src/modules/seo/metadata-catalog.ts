import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/types"
import { MedusaError } from "@medusajs/utils"

import { CONTENT_MODULE } from "@mercflow/content-module"

import { resolveSalesChannelIdsForStore } from "./catalog-loader"
import type { CategoryBreadcrumbItem } from "./json-ld-service"
import { categoryPublicUrl, productPublicUrl } from "./json-ld-service"

type RemoteQueryGraph = (input: {
  entity: string
  fields: string[]
  filters?: Record<string, unknown>
}) => Promise<{ data?: unknown }>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export type LoadedProductForMetadata = {
  id: string
  title: string
  handle: string
  description: string | null
  thumbnail: string | null
  sku: string | null
  price: string | null
  currency: string | null
  availability: "InStock" | "OutOfStock" | null
}

export type LoadedCategoryForMetadata = {
  id: string
  name: string
  handle: string
  description: string | null
}

type ContentReader = {
  withTenant: <T>(storeId: string, fn: () => Promise<T>) => Promise<T>
  retrieveProductContentForLocale: (
    productId: string,
    locale: string,
    options?: { storeId?: string }
  ) => Promise<{
    seo_title: string | null
    seo_description: string | null
    seo_og_image_id: string | null
    canonical_url_override: string | null
  } | null>
  retrieveCategoryContentForLocale: (
    categoryId: string,
    locale: string
  ) => Promise<{
    seo_title: string | null
    seo_description: string | null
    seo_og_image_id: string | null
    canonical_url_override: string | null
  } | null>
}

function toMinor(amount: unknown): number | null {
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return Math.round(amount)
  }
  if (typeof amount === "string") {
    const n = Number.parseFloat(amount)
    return Number.isFinite(n) ? Math.round(n) : null
  }
  return null
}

function formatPriceMajor(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2)
}

async function loadProductInStore(
  graph: RemoteQueryGraph,
  salesChannelIds: string[],
  productId: string
): Promise<LoadedProductForMetadata> {
  const page = await graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "description",
      "status",
      "thumbnail",
      "variants.id",
      "variants.sku",
      "variants.manage_inventory",
      "variants.inventory_quantity",
      "variants.prices.amount",
      "variants.prices.currency_code",
    ],
    filters: {
      id: productId,
      sales_channels: { id: salesChannelIds },
    },
  })
  const row = Array.isArray(page.data) ? page.data[0] : null
  if (!isRecord(row) || typeof row.id !== "string") {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Product "${productId}" not found`)
  }
  if (row.status !== "published") {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Product "${productId}" not found`)
  }
  const title = typeof row.title === "string" ? row.title : ""
  const handle = typeof row.handle === "string" ? row.handle.trim() : ""
  if (!handle) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Product "${productId}" not found`)
  }

  let sku: string | null = null
  let price: string | null = null
  let currency: string | null = null
  let availability: "InStock" | "OutOfStock" | null = null

  const variants = row.variants
  if (Array.isArray(variants) && variants.length > 0) {
    const first = variants[0]
    if (isRecord(first)) {
      sku = typeof first.sku === "string" ? first.sku : null
      const manageInventory = first.manage_inventory
      const qty =
        typeof first.inventory_quantity === "number" ? first.inventory_quantity : 0
      if (manageInventory === false) {
        availability = "InStock"
      } else {
        availability = qty > 0 ? "InStock" : "OutOfStock"
      }
      const prices = first.prices
      if (Array.isArray(prices)) {
        for (const priceRow of prices) {
          if (!isRecord(priceRow)) {
            continue
          }
          const code =
            typeof priceRow.currency_code === "string"
              ? priceRow.currency_code.trim()
              : ""
          const minor = toMinor(priceRow.amount)
          if (code && minor !== null && minor >= 0) {
            currency = code.toUpperCase()
            price = formatPriceMajor(minor)
            break
          }
        }
      }
    }
  }

  return {
    id: row.id,
    title,
    handle,
    description: typeof row.description === "string" ? row.description : null,
    thumbnail: typeof row.thumbnail === "string" ? row.thumbnail : null,
    sku,
    price,
    currency,
    availability,
  }
}

async function loadCategoryInStore(
  graph: RemoteQueryGraph,
  salesChannelIds: string[],
  categoryId: string
): Promise<LoadedCategoryForMetadata> {
  const page = await graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "description", "is_active", "is_internal"],
    filters: {
      id: categoryId,
      products: { sales_channels: { id: salesChannelIds } },
    },
  })
  const row = Array.isArray(page.data) ? page.data[0] : null
  if (!isRecord(row) || typeof row.id !== "string") {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Category "${categoryId}" not found`)
  }
  if (row.is_active === false || row.is_internal === true) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Category "${categoryId}" not found`)
  }
  const handle = typeof row.handle === "string" ? row.handle.trim() : ""
  const name = typeof row.name === "string" ? row.name : ""
  if (!handle) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Category "${categoryId}" not found`)
  }
  return {
    id: row.id,
    name,
    handle,
    description: typeof row.description === "string" ? row.description : null,
  }
}

async function loadCategoryAncestors(
  graph: RemoteQueryGraph,
  categoryId: string
): Promise<Array<{ id: string; name: string; handle: string }>> {
  const chain: Array<{ id: string; name: string; handle: string }> = []
  let currentId: string | null = categoryId
  const visited = new Set<string>()

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId)
    const page = await graph({
      entity: "product_category",
      fields: ["id", "name", "handle", "parent_category.id"],
      filters: { id: currentId },
    })
    const row = Array.isArray(page.data) ? page.data[0] : null
    if (!isRecord(row) || typeof row.id !== "string") {
      break
    }
    const handle = typeof row.handle === "string" ? row.handle.trim() : ""
    const name = typeof row.name === "string" ? row.name : handle
    if (handle) {
      chain.unshift({ id: row.id, name, handle })
    }
    const parent = row.parent_category
    currentId =
      isRecord(parent) && typeof parent.id === "string" && parent.id.length > 0
        ? parent.id
        : null
  }

  return chain
}

export async function loadProductForMetadata(
  scope: MedusaContainer,
  storeId: string,
  productId: string
): Promise<LoadedProductForMetadata> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: RemoteQueryGraph
  }
  const salesChannelIds = await resolveSalesChannelIdsForStore(query.graph, storeId)
  if (salesChannelIds.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Product "${productId}" not found`)
  }
  return loadProductInStore(query.graph, salesChannelIds, productId)
}

export async function loadCategoryForMetadata(
  scope: MedusaContainer,
  storeId: string,
  categoryId: string
): Promise<LoadedCategoryForMetadata> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: RemoteQueryGraph
  }
  const salesChannelIds = await resolveSalesChannelIdsForStore(query.graph, storeId)
  if (salesChannelIds.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Category "${categoryId}" not found`)
  }
  return loadCategoryInStore(query.graph, salesChannelIds, categoryId)
}

export async function loadCategoryBreadcrumbs(
  scope: MedusaContainer,
  _storeId: string,
  categoryId: string,
  storefrontUrl: string
): Promise<CategoryBreadcrumbItem[]> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: RemoteQueryGraph
  }
  const ancestors = await loadCategoryAncestors(query.graph, categoryId)
  return ancestors.map((row) => ({
    name: row.name,
    url: categoryPublicUrl(storefrontUrl, row.handle),
  }))
}

export async function loadProductContentFields(
  scope: MedusaContainer,
  storeId: string,
  productId: string,
  locale: string
): Promise<{
  seo_title: string | null
  seo_description: string | null
  image_url: string | null
  canonical_url_override: string | null
}> {
  const contentService = scope.resolve(CONTENT_MODULE) as ContentReader
  const productModule = scope.resolve(Modules.PRODUCT) as IProductModuleService

  return contentService.withTenant(storeId, async () => {
    const resolved = await contentService.retrieveProductContentForLocale(
      productId,
      locale,
      { storeId }
    )
    const products = await productModule.listProducts({ id: productId }, { take: 1 })
    const thumbnail = products[0]?.thumbnail ?? null
    const ogRaw = resolved?.seo_og_image_id ?? null
    const image_url =
      ogRaw && /^https?:\/\//i.test(ogRaw.trim())
        ? ogRaw.trim()
        : typeof thumbnail === "string"
          ? thumbnail
          : null
    return {
      seo_title: resolved?.seo_title ?? null,
      seo_description: resolved?.seo_description ?? null,
      image_url,
      canonical_url_override: resolved?.canonical_url_override ?? null,
    }
  })
}

export async function loadCategoryContentFields(
  scope: MedusaContainer,
  storeId: string,
  categoryId: string,
  locale: string
): Promise<{
  seo_title: string | null
  seo_description: string | null
  image_url: string | null
  canonical_url_override: string | null
}> {
  const contentService = scope.resolve(CONTENT_MODULE) as ContentReader

  return contentService.withTenant(storeId, async () => {
    const resolved = await contentService.retrieveCategoryContentForLocale(
      categoryId,
      locale
    )
    const ogRaw = resolved?.seo_og_image_id ?? null
    const image_url =
      ogRaw && /^https?:\/\//i.test(ogRaw.trim()) ? ogRaw.trim() : null
    return {
      seo_title: resolved?.seo_title ?? null,
      seo_description: resolved?.seo_description ?? null,
      image_url,
      canonical_url_override: resolved?.canonical_url_override ?? null,
    }
  })
}

export function productPageUrl(storefrontUrl: string, handle: string): string {
  return productPublicUrl(storefrontUrl, handle)
}
