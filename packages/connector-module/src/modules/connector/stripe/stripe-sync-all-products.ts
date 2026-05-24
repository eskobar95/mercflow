import type Stripe from "stripe"

import type { RemoteQueryFunction } from "@medusajs/types"

const PAGE_SIZE = 50

export type StripeCatalogSyncDeps = {
  graph: RemoteQueryFunction["graph"]
}

export type StripeCatalogSyncOptions = {
  /** Maps to Stripe Price `tax_behavior` so checkout matches MercFlow VAT configuration. */
  priceTaxBehavior: "inclusive" | "exclusive"
}

export type StripeCatalogSyncResult = {
  products_processed: number
  stripe_products_created: number
  stripe_products_updated: number
  stripe_prices_created: number
  stripe_prices_deactivated: number
}

function escapeStripeQuery(medusaEntityId: string): string {
  return medusaEntityId.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
}

async function lookupStripePriceId(
  stripe: Stripe,
  variantId: string,
  currency: string
): Promise<string | null> {
  const q = escapeStripeQuery(variantId)
  const c = escapeStripeQuery(currency.toLowerCase())
  try {
    const res = await stripe.prices.search({
      query: `metadata['medusa_variant_id']:'${q}' AND metadata['currency']:'${c}' AND active:'true'`,
      limit: 1,
    })
    return res.data[0]?.id ?? null
  } catch {
    return null
  }
}

async function lookupStripePriceIdForProductOnly(
  stripe: Stripe,
  medusaProductId: string,
  currency: string
): Promise<string | null> {
  const p = escapeStripeQuery(medusaProductId)
  const c = escapeStripeQuery(currency.toLowerCase())
  try {
    const res = await stripe.prices.search({
      query: `metadata['medusa_product_id']:'${p}' AND metadata['medusa_variant_id']:'__product_only' AND metadata['currency']:'${c}' AND active:'true'`,
      limit: 1,
    })
    return res.data[0]?.id ?? null
  } catch {
    return null
  }
}

async function lookupStripeProductId(
  stripe: Stripe,
  medusaProductId: string
): Promise<string | null> {
  const q = escapeStripeQuery(medusaProductId)
  try {
    const res = await stripe.products.search({
      query: `metadata['medusa_product_id']:'${q}' AND active:'true'`,
      limit: 1,
    })
    return res.data[0]?.id ?? null
  } catch {
    return null
  }
}

/** Safe BigNumber-ish → Stripe minor-unit integer */
function toMinor(amount: unknown): number | null {
  if (amount === null || amount === undefined) {
    return null
  }
  if (typeof amount === "bigint") {
    const asNum = Number(amount)
    return Number.isFinite(asNum) ? Math.round(asNum) : null
  }
  if (typeof amount === "number") {
    return Number.isFinite(amount) ? Math.round(amount) : null
  }
  if (typeof amount === "string") {
    const n = Number.parseFloat(amount)
    return Number.isFinite(n) ? Math.round(n) : null
  }
  if (typeof amount === "object" && amount !== null && "numeric_" in amount) {
    const v = (amount as { numeric_?: bigint | number }).numeric_
    return v !== undefined ? toMinor(v) : null
  }
  return null
}

type VariantPrices = Record<string, unknown> & {
  id?: unknown
  prices?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function pickVariantPrices(input: unknown): Array<{ variantId: string; currency: string; amount: number }> {
  if (!Array.isArray(input)) {
    return []
  }
  const out: Array<{ variantId: string; currency: string; amount: number }> = []

  for (const vUnknown of input) {
    if (!isRecord(vUnknown)) {
      continue
    }

    const v = vUnknown as VariantPrices
    const variantId = typeof v.id === "string" ? v.id : null
    if (!variantId) {
      continue
    }

    const pricesUnknown = v.prices
    if (!Array.isArray(pricesUnknown) || pricesUnknown.length === 0) {
      continue
    }

    for (const pUnknown of pricesUnknown) {
      if (!isRecord(pUnknown)) {
        continue
      }
      const currency =
        typeof pUnknown.currency_code === "string" ? pUnknown.currency_code.trim().toLowerCase() : null
      if (!currency) {
        continue
      }
      const minor = toMinor(pUnknown.amount)
      if (minor === null || minor < 0) {
        continue
      }
      out.push({ variantId, currency, amount: minor })
    }
  }

  return out
}

const PRODUCT_ONLY_VARIANT_SENTINEL = "__product_only"

/**
 * When Medusa returns no usable variant prices (e.g. zero variants in the queried graph), derive a single
 * product-level Stripe Price per `(product × currency)` using the sentinel variant id metadata.
 */
function pickPseudoProductOnlyPrices(productId: string, variantsUnknown: unknown): Array<{
  variantId: string
  currency: string
  amount: number
}> {
  const fromVariants = pickVariantPrices(variantsUnknown)
  if (fromVariants.length > 0) {
    return fromVariants
  }

  const pricesByCurrency = new Map<string, number>()

  const applyPrice = (code: string | null, minor: unknown): void => {
    if (!code) {
      return
    }
    const amt = toMinor(minor)
    if (amt === null || amt < 0) {
      return
    }
    const cur = code.trim().toLowerCase()
    if (!pricesByCurrency.has(cur)) {
      pricesByCurrency.set(cur, amt)
    }
  }

  if (!Array.isArray(variantsUnknown)) {
    return []
  }

  for (const vUnknown of variantsUnknown) {
    if (!isRecord(vUnknown)) {
      continue
    }
    const pricesUnknown = vUnknown.prices
    if (!Array.isArray(pricesUnknown)) {
      continue
    }
    for (const pUnknown of pricesUnknown) {
      if (!isRecord(pUnknown)) {
        continue
      }
      const currency =
        typeof pUnknown.currency_code === "string" ? pUnknown.currency_code.trim().toLowerCase() : null
      applyPrice(currency, pUnknown.amount)
    }
  }

  const rows: Array<{ variantId: string; currency: string; amount: number }> = []
  for (const [currency, amount] of pricesByCurrency) {
    rows.push({ variantId: PRODUCT_ONLY_VARIANT_SENTINEL + productId, currency, amount })
  }

  return rows
}

async function lookupPriceForRow(
  stripe: Stripe,
  medusaProductId: string,
  variantId: string,
  currency: string
): Promise<string | null> {
  if (variantId.includes(PRODUCT_ONLY_VARIANT_SENTINEL)) {
    return lookupStripePriceIdForProductOnly(stripe, medusaProductId, currency)
  }
  return lookupStripePriceId(stripe, variantId, currency)
}

/**
 * Full catalog sync: upserts Stripe Products by `metadata.medusa_product_id` and one active Price per
 * (variant × currency).
 */
export async function syncMercflowCatalogToStripe(
  stripe: Stripe,
  deps: StripeCatalogSyncDeps,
  options: StripeCatalogSyncOptions = { priceTaxBehavior: "inclusive" }
): Promise<StripeCatalogSyncResult> {
  let skip = 0
  let productsProcessed = 0
  let stripeProductsCreated = 0
  let stripeProductsUpdated = 0
  let stripePricesCreated = 0
  let stripePricesDeactivated = 0

  while (true) {
    const pageSet = await deps.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "variants.id",
        "variants.prices.amount",
        "variants.prices.currency_code",
      ],
      pagination: { take: PAGE_SIZE, skip },
    })

    type ProductRow = { id?: unknown; title?: unknown; handle?: unknown; variants?: unknown }
    const rows = Array.isArray(pageSet.data) ? pageSet.data : []
    const productsUnknown = rows as unknown[]
    if (productsUnknown.length === 0) {
      break
    }

    skip += productsUnknown.length
    const metaTake = pageSet.metadata?.take ?? PAGE_SIZE

    for (const pUnknown of productsUnknown) {
      if (!isRecord(pUnknown)) {
        continue
      }
      const p = pUnknown as ProductRow
      const pid = typeof p.id === "string" ? p.id : null
      if (!pid) {
        continue
      }

      productsProcessed += 1
      const title = typeof p.title === "string" && p.title.trim() !== "" ? p.title.trim() : "Product"
      const handle = typeof p.handle === "string" ? p.handle.trim() : undefined

      let stripeProductId = await lookupStripeProductId(stripe, pid)

      if (!stripeProductId) {
        const created = await stripe.products.create({
          name: title,
          ...(handle !== undefined ? { metadata: { medusa_product_id: pid, mercflow_handle: handle } } : { metadata: { medusa_product_id: pid } }),
          active: true,
        })
        stripeProductId = created.id
        stripeProductsCreated += 1
      } else {
        await stripe.products.update(stripeProductId, {
          name: title,
          ...(handle !== undefined ? { metadata: { medusa_product_id: pid, mercflow_handle: handle } } : {}),
          active: true,
        })
        stripeProductsUpdated += 1
      }

      const variantPricing = pickPseudoProductOnlyPrices(pid, p.variants)

      for (const row of variantPricing) {
        const existingPriceId = await lookupPriceForRow(stripe, pid, row.variantId, row.currency)

        const isProductOnlyVariant = row.variantId.includes(PRODUCT_ONLY_VARIANT_SENTINEL)
        const variantMeta = isProductOnlyVariant ? PRODUCT_ONLY_VARIANT_SENTINEL : row.variantId

        if (existingPriceId) {
          const pi = await stripe.prices.retrieve(existingPriceId)
          const sameAmount = pi.unit_amount === row.amount
          const stripeTaxBehavior =
            pi.tax_behavior === "inclusive" || pi.tax_behavior === "exclusive"
              ? pi.tax_behavior
              : "unspecified"
          const sameTax =
            stripeTaxBehavior === options.priceTaxBehavior ||
            /** Legacy Stripe rows without behaviour are treated like inclusive catalogue prices. */
            (stripeTaxBehavior === "unspecified" && options.priceTaxBehavior === "inclusive")

          if (
            sameAmount &&
            sameTax &&
            pi.currency === row.currency.toLowerCase() &&
            pi.active
          ) {
            continue
          }

          await stripe.prices.update(existingPriceId, { active: false })
          stripePricesDeactivated += 1
        }

        await stripe.prices.create({
          product: stripeProductId,
          currency: row.currency.toLowerCase(),
          unit_amount: row.amount,
          nickname: `${row.variantId} ${row.currency.toUpperCase()}`,
          tax_behavior: options.priceTaxBehavior,
          metadata: {
            medusa_product_id: pid,
            medusa_variant_id: variantMeta,
            currency: row.currency.toLowerCase(),
          },
        })
        stripePricesCreated += 1
      }
    }

    if (productsUnknown.length < metaTake) {
      break
    }
  }

  return {
    products_processed: productsProcessed,
    stripe_products_created: stripeProductsCreated,
    stripe_products_updated: stripeProductsUpdated,
    stripe_prices_created: stripePricesCreated,
    stripe_prices_deactivated: stripePricesDeactivated,
  }
}
