import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  clearPlatformPlansCache,
  fetchPlatformPlans,
  validatePlatformPriceId,
} from "../src/lib/platform-billing/fetch-platform-plans"

vi.mock("../src/lib/platform-billing/stripe-platform-client", () => ({
  getStripePlatformClient: vi.fn(),
}))

import { getStripePlatformClient } from "../src/lib/platform-billing/stripe-platform-client"

describe("fetchPlatformPlans", () => {
  const mockStripe = {
    prices: {
      list: vi.fn(),
    },
  }

  beforeEach(() => {
    clearPlatformPlansCache()
    vi.mocked(getStripePlatformClient).mockReturnValue(mockStripe as never)
    mockStripe.prices.list.mockReset()
  })

  afterEach(() => {
    clearPlatformPlansCache()
    vi.clearAllMocks()
  })

  it("returns active MercFlow platform prices for the requested currency", async () => {
    mockStripe.prices.list.mockResolvedValue({
      data: [
        {
          id: "price_standard_month",
          active: true,
          currency: "dkk",
          unit_amount: 29900,
          metadata: { mercflow_platform: "true", mercflow_interval: "month" },
          recurring: { interval: "month" },
          product: {
            name: "MercFlow Standard",
            metadata: { mercflow_tier: "standard" },
          },
        },
        {
          id: "price_pro_month",
          active: true,
          currency: "dkk",
          unit_amount: 59900,
          metadata: { mercflow_platform: "true", mercflow_interval: "month" },
          recurring: { interval: "month" },
          product: {
            name: "MercFlow Pro",
            metadata: { mercflow_tier: "pro" },
          },
        },
        {
          id: "price_eur_only",
          active: true,
          currency: "eur",
          unit_amount: 3900,
          metadata: { mercflow_platform: "true", mercflow_interval: "month" },
          recurring: { interval: "month" },
          product: {
            name: "MercFlow Standard",
            metadata: { mercflow_tier: "standard" },
          },
        },
      ],
      has_more: false,
    })

    const result = await fetchPlatformPlans("dkk")

    expect(result.plans).toHaveLength(2)
    expect(result.plans[0]).toEqual({
      tier: "pro",
      name: "MercFlow Pro",
      interval: "month",
      currency: "dkk",
      amount: 59900,
      price_id: "price_pro_month",
    })
    expect(result.plans[1]).toEqual({
      tier: "standard",
      name: "MercFlow Standard",
      interval: "month",
      currency: "dkk",
      amount: 29900,
      price_id: "price_standard_month",
    })
  })

  it("uses in-memory cache for repeated currency requests", async () => {
    mockStripe.prices.list.mockResolvedValue({
      data: [
        {
          id: "price_standard_month",
          active: true,
          currency: "dkk",
          unit_amount: 29900,
          metadata: { mercflow_platform: "true", mercflow_interval: "month" },
          recurring: { interval: "month" },
          product: {
            name: "MercFlow Standard",
            metadata: { mercflow_tier: "standard" },
          },
        },
      ],
      has_more: false,
    })

    await fetchPlatformPlans("dkk")
    await fetchPlatformPlans("dkk")

    expect(mockStripe.prices.list).toHaveBeenCalledTimes(1)
  })
})

describe("validatePlatformPriceId", () => {
  const mockStripe = {
    prices: {
      retrieve: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.mocked(getStripePlatformClient).mockReturnValue(mockStripe as never)
    mockStripe.prices.retrieve.mockReset()
  })

  it("accepts active MercFlow platform prices", async () => {
    mockStripe.prices.retrieve.mockResolvedValue({
      id: "price_standard_month",
      active: true,
      currency: "dkk",
      unit_amount: 29900,
      metadata: { mercflow_platform: "true", mercflow_interval: "month" },
      recurring: { interval: "month" },
      product: {
        name: "MercFlow Standard",
        metadata: { mercflow_tier: "standard" },
      },
    })

    const plan = await validatePlatformPriceId("price_standard_month")

    expect(plan.price_id).toBe("price_standard_month")
    expect(plan.tier).toBe("standard")
  })

  it("rejects inactive prices", async () => {
    mockStripe.prices.retrieve.mockResolvedValue({
      id: "price_old",
      active: false,
      currency: "dkk",
      unit_amount: 29900,
      metadata: { mercflow_platform: "true" },
      product: {},
    })

    await expect(validatePlatformPriceId("price_old")).rejects.toThrow(
      "Price is not active",
    )
  })

  it("rejects prices without mercflow_platform metadata", async () => {
    mockStripe.prices.retrieve.mockResolvedValue({
      id: "price_other",
      active: true,
      currency: "dkk",
      unit_amount: 1000,
      metadata: {},
      product: {},
    })

    await expect(validatePlatformPriceId("price_other")).rejects.toThrow(
      "Price is not a valid MercFlow platform plan",
    )
  })
})
