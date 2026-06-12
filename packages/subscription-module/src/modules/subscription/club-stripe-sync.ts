import type Stripe from "stripe"
import { MedusaError } from "@medusajs/utils"

import {
  CLUB_MEMBERSHIP_CURRENCY,
  CLUB_STRIPE_PRODUCT_METADATA_KEY,
  CLUB_STRIPE_STORE_METADATA_KEY,
} from "./club-constants"

export type SyncClubStripeProductInput = {
  storeId: string
  clubName: string
  monthlyAmountMajor: number
  annualAmountMajor: number
  existingProductId: string | null
}

function toMinorUnits(amountMajor: number): number {
  if (!Number.isFinite(amountMajor) || amountMajor <= 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Club membership price must be a positive number"
    )
  }
  return Math.round(amountMajor * 100)
}

async function deactivateRecurringPrices(
  stripe: Stripe,
  productId: string,
  interval: "month" | "year"
): Promise<void> {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  })

  for (const price of prices.data) {
    if (price.recurring?.interval === interval) {
      await stripe.prices.update(price.id, { active: false })
    }
  }
}

async function ensureRecurringPrice(
  stripe: Stripe,
  productId: string,
  amountMajor: number,
  interval: "month" | "year"
): Promise<void> {
  const targetMinor = toMinorUnits(amountMajor)
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  })

  const matching = prices.data.find(
    (price) =>
      price.recurring?.interval === interval &&
      price.currency === CLUB_MEMBERSHIP_CURRENCY &&
      price.unit_amount === targetMinor
  )

  if (matching !== undefined) {
    return
  }

  await deactivateRecurringPrices(stripe, productId, interval)

  await stripe.prices.create({
    product: productId,
    currency: CLUB_MEMBERSHIP_CURRENCY,
    unit_amount: targetMinor,
    recurring: { interval },
    nickname: interval === "month" ? "Club monthly" : "Club annual",
  })
}

/**
 * Creates or updates the Stripe Product + recurring Prices for Customer Club membership.
 */
export async function syncClubStripeProduct(
  stripe: Stripe,
  input: SyncClubStripeProductInput
): Promise<string> {
  const metadata = {
    [CLUB_STRIPE_PRODUCT_METADATA_KEY]: "true",
    [CLUB_STRIPE_STORE_METADATA_KEY]: input.storeId,
  }

  let productId = input.existingProductId

  if (productId === null || productId.trim() === "") {
    const created = await stripe.products.create({
      name: input.clubName,
      metadata,
      active: true,
    })
    productId = created.id
  } else {
    await stripe.products.update(productId, {
      name: input.clubName,
      metadata,
      active: true,
    })
  }

  await ensureRecurringPrice(stripe, productId, input.monthlyAmountMajor, "month")
  await ensureRecurringPrice(stripe, productId, input.annualAmountMajor, "year")

  return productId
}
