import { describe, expect, it } from "vitest"

import {
  canonicalSubscriptionUiStatus,
  subscriptionCanCancel,
  subscriptionCanPause,
  subscriptionCanResume,
  subscriptionStatusLabel,
} from "@/features/subscriptions/subscriptionUi"

describe("canonicalSubscriptionUiStatus", (): void => {
  it("normalises mixed-case strings", (): void => {
    expect(canonicalSubscriptionUiStatus("Active")).toBe("active")
    expect(canonicalSubscriptionUiStatus("paused")).toBe("paused")
    expect(canonicalSubscriptionUiStatus("past_due")).toBe("past_due")
    expect(canonicalSubscriptionUiStatus("Past Due")).toBe("past_due")
  })
})

describe("subscriptionStatusLabel", (): void => {
  it("returns human-readable labels", (): void => {
    expect(subscriptionStatusLabel("active")).toBe("Active")
    expect(subscriptionStatusLabel("past_due")).toBe("Past Due")
  })
})

describe("subscription action guards", (): void => {
  it("allows pause only for active subscriptions", (): void => {
    expect(subscriptionCanPause("active")).toBe(true)
    expect(subscriptionCanPause("paused")).toBe(false)
  })

  it("allows resume only for paused subscriptions", (): void => {
    expect(subscriptionCanResume("paused")).toBe(true)
    expect(subscriptionCanResume("active")).toBe(false)
  })

  it("allows cancel for active, paused, and past due subscriptions", (): void => {
    expect(subscriptionCanCancel("active")).toBe(true)
    expect(subscriptionCanCancel("paused")).toBe(true)
    expect(subscriptionCanCancel("past_due")).toBe(true)
    expect(subscriptionCanCancel("cancelled")).toBe(false)
  })
})
