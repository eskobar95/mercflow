import type Stripe from "stripe"

import { getStripePlatformClient } from "./stripe-platform-client"

export type PlatformPlan = {
  tier: string
  name: string
  interval: string
  currency: string
  amount: number
  price_id: string
}

export type PlatformPlansResponse = {
  plans: PlatformPlan[]
}

const PLANS_CACHE_TTL_MS = 60_000

type PlansCacheEntry = {
  expiresAt: number
  plans: PlatformPlan[]
}

const plansCache = new Map<string, PlansCacheEntry>()

function isMercflowPlatformPrice(price: Stripe.Price): boolean {
  return price.metadata?.mercflow_platform === "true"
}

function isExpandedProduct(
  product: Stripe.Product | Stripe.DeletedProduct | string | null | undefined,
): product is Stripe.Product {
  return (
    product !== null &&
    product !== undefined &&
    typeof product !== "string" &&
    !("deleted" in product && product.deleted === true)
  )
}

function readProductTier(
  product: Stripe.Product | Stripe.DeletedProduct | string | null | undefined,
): string | null {
  if (!isExpandedProduct(product)) {
    return null
  }

  const tier = product.metadata?.mercflow_tier
  return typeof tier === "string" && tier.length > 0 ? tier : null
}

function readPriceInterval(price: Stripe.Price): string | null {
  const interval = price.metadata?.mercflow_interval ?? price.recurring?.interval
  return typeof interval === "string" && interval.length > 0 ? interval : null
}

function readProductName(
  product: Stripe.Product | Stripe.DeletedProduct | string | null | undefined,
): string {
  if (!isExpandedProduct(product)) {
    return "MercFlow Plan"
  }

  return product.name ?? "MercFlow Plan"
}

function mapPriceToPlan(price: Stripe.Price): PlatformPlan | null {
  if (!isMercflowPlatformPrice(price) || !price.active) {
    return null
  }

  const product = price.product
  const tier = readProductTier(product)
  const interval = readPriceInterval(price)

  if (!tier || !interval || price.unit_amount === null) {
    return null
  }

  return {
    tier,
    name: readProductName(product),
    interval,
    currency: price.currency,
    amount: price.unit_amount,
    price_id: price.id,
  }
}

async function fetchActivePlatformPricesFromStripe(): Promise<Stripe.Price[]> {
  const stripe = getStripePlatformClient()
  const prices: Stripe.Price[] = []
  let startingAfter: string | undefined

  do {
    const page = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"],
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })

    prices.push(...page.data)
    startingAfter = page.has_more ? page.data[page.data.length - 1]?.id : undefined
  } while (startingAfter)

  return prices
}

export function clearPlatformPlansCache(): void {
  plansCache.clear()
}

export async function fetchPlatformPlans(currency: string): Promise<PlatformPlansResponse> {
  const normalizedCurrency = currency.trim().toLowerCase()
  const cached = plansCache.get(normalizedCurrency)
  const now = Date.now()

  if (cached && cached.expiresAt > now) {
    return { plans: cached.plans }
  }

  const allPrices = await fetchActivePlatformPricesFromStripe()
  const plans = allPrices
    .map(mapPriceToPlan)
    .filter((plan): plan is PlatformPlan => plan !== null)
    .filter((plan) => plan.currency === normalizedCurrency)
    .sort((left, right) => {
      const tierCompare = left.tier.localeCompare(right.tier)
      if (tierCompare !== 0) {
        return tierCompare
      }

      return left.interval.localeCompare(right.interval)
    })

  plansCache.set(normalizedCurrency, {
    expiresAt: now + PLANS_CACHE_TTL_MS,
    plans,
  })

  return { plans }
}

export async function validatePlatformPriceId(priceId: string): Promise<PlatformPlan> {
  const stripe = getStripePlatformClient()
  const price = await stripe.prices.retrieve(priceId, {
    expand: ["product"],
  })

  if (!price.active) {
    throw new Error("Price is not active")
  }

  const plan = mapPriceToPlan(price)
  if (!plan) {
    throw new Error("Price is not a valid MercFlow platform plan")
  }

  return plan
}
