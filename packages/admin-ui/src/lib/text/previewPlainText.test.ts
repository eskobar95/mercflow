import { describe, expect, it } from "vitest"

import { previewPlainText } from "@/lib/text/previewPlainText"

describe("previewPlainText", () => {
  it("returns null for empty input", (): void => {
    expect(previewPlainText(null, 100)).toBeNull()
    expect(previewPlainText("   ", 100)).toBeNull()
  })

  it("strips HTML tags without using innerHTML", (): void => {
    expect(previewPlainText("<p>Hello <strong>world</strong></p>", 100)).toBe(
      "Hello world",
    )
  })

  it("truncates long plain text with ellipsis", (): void => {
    const long = "a".repeat(50)
    const out = previewPlainText(long, 20)
    expect(out).toBe(`${"a".repeat(19)}…`)
  })

  it("does not execute script tags in markup", (): void => {
    const out = previewPlainText('<img src=x onerror="alert(1)">Preview', 100)
    expect(out).toBe("Preview")
  })
})
