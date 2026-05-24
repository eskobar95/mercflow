import type Stripe from "stripe"

import type { RemoteQueryFunction } from "@medusajs/types"

const PAGE_SIZE = 50

export type StripeCatalogSyncDeps = {
  graph: RemoteQueryFunction["graph"]
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

/**
 * Full catalog sync: upserts Stripe Products by `metadata.medusa_product_id` and one active Price per
 * (variant × currency).
 */
export async function syncMercflowCatalogToStripe(
  stripe: Stripe,
  deps: StripeCatalogSyncDeps
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

      const variantPricing = pickVariantPrices(p.variants)

      for (const row of variantPricing) {
        const existingPriceId = await lookupStripePriceId(stripe, row.variantId, row.currency)

        if (existingPriceId) {
          const pi = await stripe.prices.retrieve(existingPriceId)
          const sameAmount = pi.unit_amount === row.amount

          if (sameAmount && pi.currency === row.currency.toLowerCase() && pi.active) {
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
          metadata: {
            medusa_product_id: pid,
            medusa_variant_id: row.variantId,
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
