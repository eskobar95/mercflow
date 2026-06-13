import { describe, expect, it, vi } from "vitest"

import { isPublicSignupEnabled } from "../src/lib/signupEnv"

describe("isPublicSignupEnabled", () => {
  it("returns false by default", () => {
    vi.stubEnv("VITE_MERCFLOW_PUBLIC_SIGNUP", "")
    expect(isPublicSignupEnabled()).toBe(false)
  })

  it("returns true when env flag is set", () => {
    vi.stubEnv("VITE_MERCFLOW_PUBLIC_SIGNUP", "true")
    expect(isPublicSignupEnabled()).toBe(true)
  })
})
