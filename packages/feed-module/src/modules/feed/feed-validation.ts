import type { FeedCatalogProduct, FeedCatalogVariant, FeedConfigRecord } from "./types"

export type FeedValidationIssue = {
  product_id: string
  product_title: string | null
  variant_id: string | null
  variant_sku: string | null
  missing_fields: string[]
}

export type FeedValidationContent = {
  seo_description: string | null
  image_url: string | null
}

function productExcluded(product: FeedCatalogProduct, config: FeedConfigRecord): boolean {
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

function variantHasPrice(variant: FeedCatalogVariant): boolean {
  for (const row of variant.prices) {
    const currency = row.currency_code?.trim()
    if (!currency) {
      continue
    }
    const amount = row.amount
    if (typeof amount === "number" && Number.isFinite(amount) && amount >= 0) {
      return true
    }
    if (typeof amount === "string") {
      const n = Number.parseFloat(amount)
      if (Number.isFinite(n) && n >= 0) {
        return true
      }
    }
  }
  return false
}

function collectProductLevelMissing(
  product: FeedCatalogProduct,
  config: FeedConfigRecord | null,
  content: FeedValidationContent
): string[] {
  const missing: string[] = []
  if (!config?.storefront_url?.trim()) {
    missing.push("storefront_url")
  }
  if (!product.handle?.trim()) {
    missing.push("handle")
  }
  const title = product.title?.trim()
  if (!title) {
    missing.push("title")
  }
  const description =
    content.seo_description?.trim() ||
    product.description?.trim() ||
    title ||
    ""
  if (!description) {
    missing.push("description")
  }
  const image = content.image_url?.trim() || product.thumbnail?.trim() || ""
  if (!image) {
    missing.push("image_link")
  }
  return missing
}

function collectVariantMissing(variant: FeedCatalogVariant): string[] {
  const missing: string[] = []
  if (!variant.sku?.trim()) {
    missing.push("sku")
  }
  if (!variantHasPrice(variant)) {
    missing.push("price")
  }
  return missing
}

/**
 * Lists products/variants that would be omitted or invalid in the Google Shopping feed.
 */
export function validateFeedCatalog(input: {
  config: FeedConfigRecord | null
  products: FeedCatalogProduct[]
  contentByProductId: Map<string, FeedValidationContent>
}): FeedValidationIssue[] {
  const issues: FeedValidationIssue[] = []
  const config = input.config

  for (const product of input.products) {
    if (product.status !== "published") {
      continue
    }
    if (config && productExcluded(product, config)) {
      continue
    }

    const content =
      input.contentByProductId.get(product.id) ?? {
        seo_description: null,
        image_url: null,
      }
    const productMissing = collectProductLevelMissing(product, config, content)

    if (product.variants.length === 0) {
      if (productMissing.length > 0) {
        issues.push({
          product_id: product.id,
          product_title: product.title,
          variant_id: null,
          variant_sku: null,
          missing_fields: [...new Set([...productMissing, "variant"])],
        })
      }
      continue
    }

    for (const variant of product.variants) {
      const variantMissing = collectVariantMissing(variant)
      const combined = [...new Set([...productMissing, ...variantMissing])]
      if (combined.length === 0) {
        continue
      }
      issues.push({
        product_id: product.id,
        product_title: product.title,
        variant_id: variant.id,
        variant_sku: variant.sku,
        missing_fields: combined,
      })
    }
  }

  return issues
}

export function countFeedItems(
  config: FeedConfigRecord | null,
  products: FeedCatalogProduct[]
): { product_count: number; variant_count: number } {
  let productCount = 0
  let variantCount = 0

  for (const product of products) {
    if (product.status !== "published") {
      continue
    }
    if (config && productExcluded(product, config)) {
      continue
    }
    if (!product.handle?.trim()) {
      continue
    }

    let variantsInFeed = 0
    for (const variant of product.variants) {
      if (!variant.sku?.trim() || !variantHasPrice(variant)) {
        continue
      }
      variantsInFeed += 1
    }
    if (variantsInFeed === 0) {
      continue
    }
    productCount += 1
    variantCount += variantsInFeed
  }

  return { product_count: productCount, variant_count: variantCount }
}
