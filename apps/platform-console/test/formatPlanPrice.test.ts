import { describe, expect, it } from "vitest"

import { formatPlanPrice, formatTierLabel } from "../src/lib/formatPlanPrice"

describe("formatPlanPrice", () => {
  it("formats DKK monthly prices", () => {
    expect(formatPlanPrice(29900, "dkk", "month")).toBe("299 kr/md")
  })

  it("formats DKK annual prices", () => {
    expect(formatPlanPrice(299000, "dkk", "year")).toBe("2990 kr/år")
  })

  it("formats EUR monthly prices", () => {
    expect(formatPlanPrice(3900, "eur", "month")).toBe("€39/mo")
  })

  it("formats EUR annual prices", () => {
    expect(formatPlanPrice(39000, "eur", "year")).toBe("€390/yr")
  })
})

describe("formatTierLabel", () => {
  it("capitalizes known tiers", () => {
    expect(formatTierLabel("standard")).toBe("Standard")
    expect(formatTierLabel("pro")).toBe("Pro")
  })
})
