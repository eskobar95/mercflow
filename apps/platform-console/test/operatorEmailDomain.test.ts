import { describe, expect, it } from "vitest"

import { isAllowedOperatorEmail } from "../src/lib/operatorEmailDomain"

describe("isAllowedOperatorEmail", () => {
  it("allows mercflow.shop addresses", () => {
    expect(isAllowedOperatorEmail("ops@mercflow.shop", "mercflow.shop")).toBe(
      true,
    )
  })

  it("rejects other domains", () => {
    expect(isAllowedOperatorEmail("ops@gmail.com", "mercflow.shop")).toBe(false)
    expect(isAllowedOperatorEmail(null, "mercflow.shop")).toBe(false)
  })
})
