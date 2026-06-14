import { describe, expect, it } from "vitest"
import type { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"
import { z } from "zod"

import {
  platformJobIdParamsSchema,
  platformStoreIdParamsSchema,
  validateBody,
  validateParams,
} from "../src/lib/platform-http/validateBody"

const emailBodySchema = z.object({
  email: z.string().email(),
})

function mockRequest(body: unknown): MedusaRequest {
  return { body } as MedusaRequest
}

describe("validateBody", () => {
  it("returns parsed data for a valid payload", () => {
    const data = validateBody(emailBodySchema, mockRequest({ email: "ops@mercflow.shop" }))
    expect(data.email).toBe("ops@mercflow.shop")
  })

  it("throws MedusaError INVALID_DATA for invalid payload", () => {
    expect(() =>
      validateBody(emailBodySchema, mockRequest({ email: "not-an-email" })),
    ).toThrow(MedusaError)
  })
})

describe("validateParams", () => {
  it("returns parsed params for valid route params", () => {
    const params = validateParams(platformStoreIdParamsSchema, { store_id: "store_123" })
    expect(params.store_id).toBe("store_123")
  })

  it("throws MedusaError INVALID_DATA for missing params", () => {
    expect(() => validateParams(platformJobIdParamsSchema, {})).toThrow(MedusaError)
  })
})
