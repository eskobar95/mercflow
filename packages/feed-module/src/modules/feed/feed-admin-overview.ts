import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { loadProductContentForFeed } from "./content-loader"
import { buildFeedPublicUrl } from "./build-feed-public-url"
import { getFeedCacheUpdatedAt } from "./feed-cache"
import { loadCatalogFromQuery, resolveSalesChannelIdsForStore } from "./feed-generator-service"
import { countFeedItems, validateFeedCatalog } from "./feed-validation"
import type FeedConfigService from "./service"
import type { FeedConfigRecord, FeedCatalogProduct } from "./types"

type RemoteQueryGraph = Parameters<typeof loadCatalogFromQuery>[0]

async function loadCatalogForStore(
  scope: MedusaContainer,
  storeId: string
): Promise<FeedCatalogProduct[]> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: RemoteQueryGraph
  }
  const salesChannelIds = await resolveSalesChannelIdsForStore(query.graph, storeId)
  return loadCatalogFromQuery(query.graph, salesChannelIds)
}

async function loadContentMap(
  scope: MedusaContainer,
  storeId: string,
  products: FeedCatalogProduct[],
  locale: string
): Promise<Map<string, { seo_description: string | null; image_url: string | null }>> {
  const map = new Map<string, { seo_description: string | null; image_url: string | null }>()
  for (const product of products) {
    const content = await loadProductContentForFeed(scope, storeId, product.id, locale)
    map.set(product.id, content)
  }
  return map
}

export type FeedAdminOverview = {
  product_count: number
  variant_count: number
  validation_issue_count: number
  last_updated_at: string | null
  feed_url: string | null
}

export async function buildFeedAdminOverview(input: {
  scope: MedusaContainer
  storeId: string
  config: FeedConfigRecord | null
  locale?: string
}): Promise<FeedAdminOverview> {
  const locale = input.locale ?? "en"
  const products = await loadCatalogForStore(input.scope, input.storeId)
  const contentMap = await loadContentMap(
    input.scope,
    input.storeId,
    products,
    locale
  )
  const issues = validateFeedCatalog({
    config: input.config,
    products,
    contentByProductId: contentMap,
  })
  const counts = countFeedItems(input.config, products)

  return {
    product_count: counts.product_count,
    variant_count: counts.variant_count,
    validation_issue_count: issues.length,
    last_updated_at: getFeedCacheUpdatedAt(input.storeId),
    feed_url: buildFeedPublicUrl(input.config?.storefront_url ?? null),
  }
}

export async function buildFeedValidationReport(input: {
  scope: MedusaContainer
  feedConfigService: FeedConfigService
  storeId: string
  locale?: string
}): Promise<{
  issues: ReturnType<typeof validateFeedCatalog>
  summary: {
    products_checked: number
    products_with_issues: number
    issue_count: number
  }
}> {
  const locale = input.locale ?? "en"
  const config = await input.feedConfigService.get(input.storeId)
  const products = await loadCatalogForStore(input.scope, input.storeId)
  const contentMap = await loadContentMap(
    input.scope,
    input.storeId,
    products,
    locale
  )
  const issues = validateFeedCatalog({
    config,
    products,
    contentByProductId: contentMap,
  })
  const productIds = new Set(issues.map((row) => row.product_id))

  return {
    issues,
    summary: {
      products_checked: products.filter((p) => p.status === "published").length,
      products_with_issues: productIds.size,
      issue_count: issues.length,
    },
  }
}
