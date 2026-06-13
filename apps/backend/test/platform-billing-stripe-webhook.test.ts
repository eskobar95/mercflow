import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { handleStripePlatformWebhookEvent } from "../src/lib/platform-billing/stripe-platform-webhook"

vi.mock("../src/lib/platform-billing/resolve-stripe-store-id", async () => {
  const actual = await vi.importActual<
    typeof import("../src/lib/platform-billing/resolve-stripe-store-id")
  >("../src/lib/platform-billing/resolve-stripe-store-id")

  return {
    ...actual,
    resolveStoreIdFromSubscription: vi.fn(),
    readSubscriptionIdFromInvoice: vi.fn(),
  }
})

vi.mock("../src/lib/platform-db/redeem-platform-invite", () => ({
  findTenantIdByInviteTokenHash: vi.fn(),
}))

vi.mock("../src/lib/platform-db/platform-tenant-billing", () => ({
  updatePlatformTenantBillingStatus: vi.fn(),
}))

vi.mock("../src/lib/platform-billing/write-billing-audit-log", () => ({
  writeBillingAuditLog: vi.fn(),
}))

vi.mock("../src/lib/platform-billing/stripe-platform-client", () => ({
  getStripePlatformClient: vi.fn(),
}))

import { getStripePlatformClient } from "../src/lib/platform-billing/stripe-platform-client"
import {
  readSubscriptionIdFromInvoice,
  resolveStoreIdFromSubscription,
} from "../src/lib/platform-billing/resolve-stripe-store-id"
import { updatePlatformTenantBillingStatus } from "../src/lib/platform-db/platform-tenant-billing"
import { writeBillingAuditLog } from "../src/lib/platform-billing/write-billing-audit-log"

describe("handleStripePlatformWebhookEvent", () => {
  const mockStripe = {
    subscriptions: {
      retrieve: vi.fn(),
    },
    customers: {
      retrieve: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.mocked(getStripePlatformClient).mockReturnValue(mockStripe as never)
    vi.mocked(resolveStoreIdFromSubscription).mockReset()
    vi.mocked(readSubscriptionIdFromInvoice).mockReset()
    vi.mocked(updatePlatformTenantBillingStatus).mockReset()
    vi.mocked(writeBillingAuditLog).mockReset()
    mockStripe.subscriptions.retrieve.mockReset()
    mockStripe.customers.retrieve.mockReset()
    vi.mocked(updatePlatformTenantBillingStatus).mockResolvedValue(true)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("updates billing status on customer.subscription.updated", async () => {
    vi.mocked(resolveStoreIdFromSubscription).mockResolvedValue({
      storeId: "store_01",
      source: "subscription_metadata",
    })

    const result = await handleStripePlatformWebhookEvent({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          status: "past_due",
          current_period_end: 1_735_689_600,
          metadata: { store_id: "store_01" },
        },
      },
    } as never)

    expect(result).toEqual({ handled: true, action: "billing_status_synced" })
    expect(updatePlatformTenantBillingStatus).toHaveBeenCalledWith("store_01", {
      subscription_status: "past_due",
      current_period_end: new Date(1_735_689_600 * 1000),
    })
    expect(writeBillingAuditLog).toHaveBeenCalledWith({
      action: "billing_status_changed",
      entity_id: "store_01",
      metadata: expect.objectContaining({
        stripe_event_type: "customer.subscription.updated",
        subscription_status: "past_due",
        resolution_source: "subscription_metadata",
      }),
    })
  })

  it("sets canceled status on customer.subscription.deleted", async () => {
    vi.mocked(resolveStoreIdFromSubscription).mockResolvedValue({
      storeId: "store_01",
      source: "subscription_metadata",
    })

    const result = await handleStripePlatformWebhookEvent({
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_123",
          status: "canceled",
          metadata: { store_id: "store_01" },
        },
      },
    } as never)

    expect(result).toEqual({ handled: true, action: "billing_status_synced" })
    expect(updatePlatformTenantBillingStatus).toHaveBeenCalledWith("store_01", {
      subscription_status: "canceled",
      current_period_end: null,
    })
    expect(writeBillingAuditLog).toHaveBeenCalled()
  })

  it("sets past_due on invoice.payment_failed", async () => {
    vi.mocked(readSubscriptionIdFromInvoice).mockReturnValue("sub_123")
    mockStripe.subscriptions.retrieve.mockResolvedValue({
      id: "sub_123",
      status: "past_due",
      metadata: { store_id: "store_01" },
    })
    vi.mocked(resolveStoreIdFromSubscription).mockResolvedValue({
      storeId: "store_01",
      source: "subscription_metadata",
    })

    const result = await handleStripePlatformWebhookEvent({
      type: "invoice.payment_failed",
      data: {
        object: {
          id: "in_123",
          subscription: "sub_123",
        },
      },
    } as never)

    expect(result).toEqual({ handled: true, action: "billing_status_synced" })
    expect(updatePlatformTenantBillingStatus).toHaveBeenCalledWith("store_01", {
      subscription_status: "past_due",
      current_period_end: null,
    })
    expect(writeBillingAuditLog).toHaveBeenCalledWith({
      action: "billing_status_changed",
      entity_id: "store_01",
      metadata: expect.objectContaining({
        stripe_event_type: "invoice.payment_failed",
        subscription_status: "past_due",
      }),
    })
  })

  it("sets active on invoice.paid", async () => {
    vi.mocked(readSubscriptionIdFromInvoice).mockReturnValue("sub_123")
    mockStripe.subscriptions.retrieve.mockResolvedValue({
      id: "sub_123",
      status: "active",
      current_period_end: 1_735_689_600,
      metadata: { store_id: "store_01" },
    })
    vi.mocked(resolveStoreIdFromSubscription).mockResolvedValue({
      storeId: "store_01",
      source: "subscription_metadata",
    })

    const result = await handleStripePlatformWebhookEvent({
      type: "invoice.paid",
      data: {
        object: {
          id: "in_123",
          subscription: "sub_123",
        },
      },
    } as never)

    expect(result).toEqual({ handled: true, action: "billing_status_synced" })
    expect(updatePlatformTenantBillingStatus).toHaveBeenCalledWith("store_01", {
      subscription_status: "active",
      current_period_end: new Date(1_735_689_600 * 1000),
    })
  })
})
