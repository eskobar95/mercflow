import { expect, it } from "vitest"

/**
 * Smokes the Vitest project wiring for this package. Deep token-shape tests can be
 * expanded once the test runner also pre-builds `dist/` or uses a shared alias strategy.
 */
it("exposes a Vitest smoke check", (): void => {
  expect(1 + 1).toBe(2)
})
