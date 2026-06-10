import { describe, expect, it } from "vitest"

import { computePackagingUtilisationPercent } from "@/features/packaging/computePackagingUtilisationPercent"

describe("computePackagingUtilisationPercent", (): void => {
  it("rounds total volume divided by packaging volume", (): void => {
    const percent = computePackagingUtilisationPercent(6_000_000, {
      length_mm: 300,
      width_mm: 200,
      height_mm: 150,
    })
    expect(percent).toBe(67)
  })

  it("returns 0 when packaging volume is zero", (): void => {
    expect(
      computePackagingUtilisationPercent(100, {
        length_mm: 0,
        width_mm: 100,
        height_mm: 100,
      }),
    ).toBe(0)
  })
})
