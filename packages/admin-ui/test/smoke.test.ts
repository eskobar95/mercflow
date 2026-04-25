import { describe, expect, it } from "vitest"

describe("admin-ui", (): void => {
  it("runs under the jsdom environment", (): void => {
    expect(typeof document).toBe("object")
    expect(typeof window).toBe("object")
  })
})
