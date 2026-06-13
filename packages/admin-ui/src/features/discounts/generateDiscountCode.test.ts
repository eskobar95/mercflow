import { describe, expect, it } from "vitest"

import { generateDiscountCode } from "./generateDiscountCode"

describe("generateDiscountCode", () => {
  it("returns an 8-character uppercase alphanumeric code", () => {
    const code = generateDiscountCode()
    expect(code).toHaveLength(8)
    expect(code).toMatch(/^[A-Z0-9]{8}$/)
  })
})
