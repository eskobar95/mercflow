import { describe, expect, it } from "vitest"

import { orderNotePostBodySchema } from "../modules/inventory/http-schemas"

describe("orderNotePostBodySchema", () => {
  it("rejects empty content", () => {
    const parsed = orderNotePostBodySchema.safeParse({ content: "" })
    expect(parsed.success).toBe(false)
  })

  it("accepts valid note body", () => {
    const parsed = orderNotePostBodySchema.safeParse({
      content: "Pack fragile items together.",
      created_by: "user_01",
    })
    expect(parsed.success).toBe(true)
  })
})
