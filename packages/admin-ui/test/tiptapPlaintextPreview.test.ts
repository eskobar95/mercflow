import { describe, expect, it } from "vitest"

import { plaintextPreviewFromTiptapJson } from "@/lib/tiptap"

describe("plaintextPreviewFromTiptapJson", () => {
  it("truncates plaintext with ellipsis", (): void => {
    const json = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "a".repeat(80) }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "b".repeat(80) }],
        },
      ],
    }
    const out = plaintextPreviewFromTiptapJson(json, 100)
    expect(out.endsWith("…")).toBe(true)
    expect(out.length).toBeLessThanOrEqual(101)
  })

  it("returns empty for empty paragraphs", (): void => {
    expect(
      plaintextPreviewFromTiptapJson(
        { type: "doc", content: [{ type: "paragraph" }] },
        50
      )
    ).toBe("")
  })
})
