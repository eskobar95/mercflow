import { describe, expect, it } from "vitest"

import {
  resolveAdminListLimit,
  resolveAdminListOffset,
} from "../src/api/http/admin-list-limit"

describe("resolveAdminListLimit", () => {
  it("defaults to 50 when limit is undefined", () => {
    expect(resolveAdminListLimit(undefined)).toBe(50)
  })

  it("caps requested limit at 100", () => {
    expect(resolveAdminListLimit(200)).toBe(100)
    expect(resolveAdminListLimit(500)).toBe(100)
  })

  it("passes through limits within range", () => {
    expect(resolveAdminListLimit(25)).toBe(25)
    expect(resolveAdminListLimit(100)).toBe(100)
  })
})

describe("resolveAdminListOffset", () => {
  it("defaults to 0 when offset is undefined", () => {
    expect(resolveAdminListOffset(undefined)).toBe(0)
  })

  it("returns non-negative offsets", () => {
    expect(resolveAdminListOffset(10)).toBe(10)
    expect(resolveAdminListOffset(0)).toBe(0)
  })
})
