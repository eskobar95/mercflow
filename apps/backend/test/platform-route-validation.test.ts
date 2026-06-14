import { describe, expect, it, vi } from "vitest"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { POST as createInvite } from "../src/api/platform/invites/route"
import { POST as setupSignupBilling } from "../src/api/platform/signup/billing/setup/route"

vi.mock("../src/lib/platform-db/platform-invites", () => ({
  createPlatformInvite: vi.fn(),
  listPlatformInvites: vi.fn(),
  toPublicInvite: vi.fn(),
  validatePlatformInviteToken: vi.fn(),
}))

vi.mock("../src/lib/platform-invites/send-invite-email", () => ({
  buildPlatformInviteUrl: vi.fn(() => "https://signup.test/invite"),
  sendPlatformInviteEmail: vi.fn(),
}))

vi.mock("../src/lib/platform-tenants/audit-log", () => ({
  writePlatformAuditLog: vi.fn(),
}))

vi.mock("../src/lib/platform-db/platform-db", () => ({
  isPlatformDbConfigured: vi.fn(() => true),
}))

vi.mock("../src/lib/platform-billing/stripe-platform-client", () => ({
  isStripePlatformConfigured: vi.fn(() => true),
}))

function mockResponse(): MedusaResponse {
  const json = vi.fn()
  const status = vi.fn(() => ({ json }))
  return { status, json } as unknown as MedusaResponse
}

describe("POST /platform/invites validation", () => {
  it("rejects invalid email with MedusaError before business logic", async () => {
    const req = {
      body: { email: "not-an-email" },
      platformOperator: { userId: "user_1", email: "ops@mercflow.shop" },
      scope: {},
    } as MedusaRequest & { platformOperator: { userId: string; email: string } }

    await expect(createInvite(req, mockResponse())).rejects.toThrow(MedusaError)
  })
})

describe("POST /platform/signup/billing/setup validation", () => {
  it("rejects missing price_id with MedusaError before business logic", async () => {
    const req = {
      body: {
        invite_token: "token-123",
        email: "hello@example.com",
        store_name: "Kaffehuset",
      },
    } as MedusaRequest

    await expect(setupSignupBilling(req, mockResponse())).rejects.toThrow(MedusaError)
  })
})
