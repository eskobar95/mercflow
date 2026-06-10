import { describe, expect, it } from "vitest"

import { metafieldValueToDraftString, parseMetafieldDraftValue } from "./metafieldValueForm"

describe("metafieldValueForm", (): void => {
  it("round-trips single_line_text values", (): void => {
    const draft = metafieldValueToDraftString("single_line_text", "Hello")
    expect(draft).toBe("Hello")
    const parsed = parseMetafieldDraftValue("single_line_text", draft)
    expect(parsed).toEqual({ ok: true, value: "Hello" })
  })

  it("parses list.single_line_text from newline-separated draft", (): void => {
    const parsed = parseMetafieldDraftValue("list.single_line_text", "alpha\nbeta\n")
    expect(parsed).toEqual({ ok: true, value: ["alpha", "beta"] })
  })

  it("rejects empty drafts", (): void => {
    const parsed = parseMetafieldDraftValue("number_integer", "   ")
    expect(parsed.ok).toBe(false)
  })
})
