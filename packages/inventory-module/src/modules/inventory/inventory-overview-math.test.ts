import { describe, expect, it } from "vitest"

import {
  computeAvailable,
  computeIncomingForLine,
  isLowStock,
} from "./inventory-overview-math"

describe("inventory-overview-math", (): void => {
  it("computeAvailable subtracts reserved from stocked", (): void => {
    expect(computeAvailable(20, 3)).toBe(17)
  })

  it("computeIncomingForLine returns remaining open PO qty", (): void => {
    expect(computeIncomingForLine(100, 94)).toBe(6)
    expect(computeIncomingForLine(50, 50)).toBe(0)
  })

  it("isLowStock compares available to threshold", (): void => {
    expect(isLowStock(4, 5)).toBe(true)
    expect(isLowStock(5, 5)).toBe(false)
  })
})
