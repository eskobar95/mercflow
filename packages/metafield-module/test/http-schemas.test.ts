import { describe, expect, it } from "vitest"

import { metafieldValuesBatchBodySchema, metafieldValuesListQuerySchema } from "../src/modules/metafield/http-schemas"

describe("metafield values http schemas", (): void => {
  it("rejects batch upsert over 50 items", (): void => {
    const values = Array.from({ length: 51 }, (_, index) => ({
      definition_id: "mfd_1",
      owner_id: "prod_1",
      owner_type: "product" as const,
      value: `v${index}`,
    }))
    const parsed = metafieldValuesBatchBodySchema.safeParse({ values })
    expect(parsed.success).toBe(false)
  })

  it("accepts list query with owner_type and owner_id", (): void => {
    const parsed = metafieldValuesListQuerySchema.safeParse({
      owner_type: "product",
      owner_id: "prod_1",
    })
    expect(parsed.success).toBe(true)
  })
})
