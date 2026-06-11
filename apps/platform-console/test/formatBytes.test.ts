import { describe, expect, it } from "vitest"

import { formatBytes } from "../src/lib/formatBytes"
import { formatDuration } from "../src/lib/formatDuration"

describe("formatBytes", () => {
  it("formats kilobytes and megabytes", () => {
    expect(formatBytes(1024)).toBe("1.0 KB")
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB")
  })

  it("returns dash for null", () => {
    expect(formatBytes(null)).toBe("—")
  })
})

describe("formatDuration", () => {
  it("formats minutes and hours", () => {
    expect(formatDuration(90)).toBe("1m")
    expect(formatDuration(3700)).toBe("1h 1m")
  })
})
