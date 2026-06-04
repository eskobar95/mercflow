import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import { buildGoogleShoppingXml } from "./feed-xml"
import type FeedConfigService from "./service"
import type {
  FeedCatalogProduct,
  FeedCatalogVariant,
  FeedConfigRecord,
  GoogleShoppingFeedItem,
} from "./types"

const DEFAULT_LOCALE = "en"
const CATALOG_PAGE_SIZE = 50

type RemoteQueryGraph = (input: {
  entity: string
  fields: string[]
  filters?: Record<string, unknown>
  pagination?: { take: number; skip: number }
}) => Promise<{ data?: unknown; metadata?: { take?: number } }>

export type FeedGeneratorDeps = {
  feedConfigService: FeedConfigService
  loadCatalog: (storeId: string) => Promise<FeedCatalogProduct[]>
  loadContentForProduct: (
    storeId: string,
    productId: string,
    locale: string
  ) => Promise<{
    seo_description: string | null
    image_url: string | null
  }>
  loadBrandName: (storeId: string, productId: string) => Promise<string | null>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function trimBaseUrl(url: string): string {
  return url.replace(/\/+$/, "")
}

function buildProductLink(storefrontUrl: string, handle: string): string {
  const base = trimBaseUrl(storefrontUrl)
  const path = handle.startsWith("/") ? handle : `/${handle}`
  return `${base}${path}`
}

function toMinor(amount: unknown): number | null {
  if (amount === null || amount === undefined) {
    return null
  }
  if (typeof amount === "number") {
    return Number.isFinite(amount) ? Math.round(amount) : null
  }
  if (typeof amount === "string") {
    const n = Number.parseFloat(amount)
    return Number.isFinite(n) ? Math.round(n) : null
  }
  return null
}

function formatPrice(amountMinor: number, currencyCode: string): string {
  const major = amountMinor / 100
  return `${major.toFixed(2)} ${currencyCode.toUpperCase()}`
}

function pickVariantPrice(variant: FeedCatalogVariant): { amount: number; currency: string } | null {
  for (const row of variant.prices) {
    const currency = row.currency_code?.trim()
    if (!currency) {
      continue
    }
    const minor = toMinor(row.amount)
    if (minor !== null && minor >= 0) {
      return { amount: minor, currency }
    }
  }
  return null
}

function variantAvailability(variant: FeedCatalogVariant): GoogleShoppingFeedItem["availability"] {
  if (variant.manage_inventory === false) {
    return "in stock"
  }
  const qty = variant.inventory_quantity
  if (typeof qty === "number" && qty > 0) {
    return "in stock"
  }
  return "out of stock"
}

function productExcluded(
  product: FeedCatalogProduct,
  config: FeedConfigRecord
): boolean {
  if (config.excluded_product_ids.includes(product.id)) {
    return true
  }
  for (const categoryId of product.category_ids) {
    if (config.excluded_category_ids.includes(categoryId)) {
      return true
    }
  }
  return false
}

function parseCatalogRow(row: unknown): FeedCatalogProduct | null {
  if (!isRecord(row)) {
    return null
  }
  const id = typeof row.id === "string" ? row.id : null
  if (!id) {
    return null
  }
  const status = typeof row.status === "string" ? row.status : null
  if (status !== "published") {
    return null
  }

  const categoryIds: string[] = []
  const categories = row.categories
  if (Array.isArray(categories)) {
    for (const cat of categories) {
      if (isRecord(cat) && typeof cat.id === "string") {
        categoryIds.push(cat.id)
      }
    }
  }

  const variantsRaw = row.variants
  const variants: FeedCatalogVariant[] = []
  if (Array.isArray(variantsRaw)) {
    for (const variantRow of variantsRaw) {
      if (!isRecord(variantRow)) {
        continue
      }
      const variantId = typeof variantRow.id === "string" ? variantRow.id : null
      if (!variantId) {
        continue
      }
      const pricesRaw = variantRow.prices
      const prices: FeedCatalogVariant["prices"] = []
      if (Array.isArray(pricesRaw)) {
        for (const priceRow of pricesRaw) {
          if (!isRecord(priceRow)) {
            continue
          }
          prices.push({
            amount:
              typeof priceRow.amount === "number" || typeof priceRow.amount === "string"
                ? priceRow.amount
                : null,
            currency_code:
              typeof priceRow.currency_code === "string" ? priceRow.currency_code : null,
          })
        }
      }
      variants.push({
        id: variantId,
        sku: typeof variantRow.sku === "string" ? variantRow.sku : null,
        manage_inventory:
          typeof variantRow.manage_inventory === "boolean"
            ? variantRow.manage_inventory
            : null,
        inventory_quantity:
          typeof variantRow.inventory_quantity === "number"
            ? variantRow.inventory_quantity
            : null,
        prices,
      })
    }
  }

  return {
    id,
    title: typeof row.title === "string" ? row.title : null,
    handle: typeof row.handle === "string" ? row.handle : null,
    description: typeof row.description === "string" ? row.description : null,
    status,
    thumbnail: typeof row.thumbnail === "string" ? row.thumbnail : null,
    category_ids: categoryIds,
    variants,
  }
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

export async function loadCatalogFromQuery(
  graph: RemoteQueryGraph,
  salesChannelIds: string[]
): Promise<FeedCatalogProduct[]> {
  if (salesChannelIds.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No sales channels found for this store — cannot build feed catalogue"
    )
  }

  const products: FeedCatalogProduct[] = []
  let skip = 0

  while (true) {
    const page = await graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "description",
        "status",
        "thumbnail",
        "categories.id",
        "variants.id",
        "variants.sku",
        "variants.manage_inventory",
        "variants.inventory_quantity",
        "variants.prices.amount",
        "variants.prices.currency_code",
      ],
      filters: {
        sales_channels: {
          id: salesChannelIds,
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
      const parsed = parseCatalogRow(row)
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

export class FeedGeneratorService {
  constructor(private readonly deps: FeedGeneratorDeps) {}

  async generate(storeId: string, locale: string = DEFAULT_LOCALE): Promise<string> {
    const config = await this.deps.feedConfigService.get(storeId)
    if (!config?.storefront_url) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Feed is not configured for this store (missing storefront_url)"
      )
    }

    const storefrontUrl = config.storefront_url
    const catalog = await this.deps.loadCatalog(storeId)
    const items: GoogleShoppingFeedItem[] = []

    for (const product of catalog) {
      if (productExcluded(product, config)) {
        continue
      }
      const handle = product.handle?.trim()
      if (!handle) {
        continue
      }

      const content = await this.deps.loadContentForProduct(storeId, product.id, locale)
      const description =
        content.seo_description?.trim() ||
        product.description?.trim() ||
        product.title?.trim() ||
        ""
      const title = product.title?.trim() || handle
      const link = buildProductLink(storefrontUrl, handle)
      const imageLink =
        content.image_url?.trim() || product.thumbnail?.trim() || null
      const brand = await this.deps.loadBrandName(storeId, product.id)

      for (const variant of product.variants) {
        const sku = variant.sku?.trim()
        if (!sku) {
          continue
        }
        const priceRow = pickVariantPrice(variant)
        if (!priceRow) {
          continue
        }

        items.push({
          id: sku,
          title,
          description,
          link,
          image_link: imageLink,
          price: formatPrice(priceRow.amount, priceRow.currency),
          availability: variantAvailability(variant),
          brand,
          condition: config.default_condition,
        })
      }
    }

    return buildGoogleShoppingXml({
      channelTitle: "Google Shopping Feed",
      channelLink: trimBaseUrl(storefrontUrl),
      channelDescription: "Product feed",
      items,
    })
  }
}

export function createFeedGeneratorFromScope(
  scope: MedusaContainer,
  feedConfigService: FeedConfigService,
  contentLoader: FeedGeneratorDeps["loadContentForProduct"],
  brandLoader: FeedGeneratorDeps["loadBrandName"]
): FeedGeneratorService {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: RemoteQueryGraph
  }

  return new FeedGeneratorService({
    feedConfigService,
    loadCatalog: async (storeId: string) => {
      const salesChannelIds = await resolveSalesChannelIdsForStore(query.graph, storeId)
      return loadCatalogFromQuery(query.graph, salesChannelIds)
    },
    loadContentForProduct: contentLoader,
    loadBrandName: brandLoader,
  })
}
