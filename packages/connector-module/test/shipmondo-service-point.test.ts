import { describe, expect, it } from "vitest"

import { shouldAutoSelectShipmondoServicePoint } from "../src/modules/connector/shipmondo-service-point"

describe("shouldAutoSelectShipmondoServicePoint", (): void => {
  it("returns true when service point is null", (): void => {
    expect(shouldAutoSelectShipmondoServicePoint(null)).toBe(true)
  })

  it("returns true when service point is blank", (): void => {
    expect(shouldAutoSelectShipmondoServicePoint("   ")).toBe(true)
  })

  it("returns false when service point is set", (): void => {
    expect(shouldAutoSelectShipmondoServicePoint("95892")).toBe(false)
  })
})
