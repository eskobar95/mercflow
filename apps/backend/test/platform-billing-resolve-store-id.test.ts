import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  readInviteTokenHash,
  readStoreIdFromMetadata,
  resolveStoreIdFromSubscription,
} from "../src/lib/platform-billing/resolve-stripe-store-id"

describe("resolveStoreIdFromSubscription", () => {
  const warn = vi.fn()
  const findTenantIdByInviteTokenHash = vi.fn()

  beforeEach(() => {
    warn.mockReset()
    findTenantIdByInviteTokenHash.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("resolves store_id from subscription metadata first", async () => {
    const result = await resolveStoreIdFromSubscription(
      {
        id: "sub_1",
        metadata: { store_id: "store_primary" },
      } as never,
      {
        metadata: { store_id: "store_customer" },
      } as never,
      { findTenantIdByInviteTokenHash, warn },
    )

    expect(result).toEqual({
      storeId: "store_primary",
      source: "subscription_metadata",
    })
    expect(findTenantIdByInviteTokenHash).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })

  it("falls back to customer metadata when subscription metadata is missing", async () => {
    const result = await resolveStoreIdFromSubscription(
      {
        id: "sub_1",
        metadata: {},
      } as never,
      {
        metadata: { store_id: "store_customer" },
      } as never,
      { findTenantIdByInviteTokenHash, warn },
    )

    expect(result).toEqual({
      storeId: "store_customer",
      source: "customer_metadata",
    })
    expect(findTenantIdByInviteTokenHash).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })

  it("falls back to invite_token_hash and logs a warning", async () => {
    findTenantIdByInviteTokenHash.mockResolvedValue("store_invite")

    const result = await resolveStoreIdFromSubscription(
      {
        id: "sub_1",
        metadata: { invite_token_hash: "hash_123" },
      } as never,
      null,
      { findTenantIdByInviteTokenHash, warn },
    )

    expect(result).toEqual({
      storeId: "store_invite",
      source: "invite_token_hash",
    })
    expect(findTenantIdByInviteTokenHash).toHaveBeenCalledWith("hash_123")
    expect(warn).toHaveBeenCalledWith(
      "Stripe webhook resolved tenant via invite_token_hash fallback for subscription sub_1",
    )
  })

  it("returns null when no resolution path matches", async () => {
    const result = await resolveStoreIdFromSubscription(
      {
        id: "sub_1",
        metadata: {},
      } as never,
      null,
      { findTenantIdByInviteTokenHash, warn },
    )

    expect(result).toBeNull()
  })
})

describe("metadata readers", () => {
  it("reads store_id and invite_token_hash from metadata", () => {
    expect(readStoreIdFromMetadata({ store_id: "store_01" })).toBe("store_01")
    expect(readInviteTokenHash({ invite_token_hash: "hash_01" })).toBe("hash_01")
    expect(readStoreIdFromMetadata({})).toBeNull()
    expect(readInviteTokenHash(undefined)).toBeNull()
  })
})
