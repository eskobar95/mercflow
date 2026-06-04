import { describe, expect, it } from "vitest"

import {
  canonicalSubscriptionUiStatus,
  subscriptionStatusLabel,
} from "@/features/subscriptions/subscriptionUi"

describe("canonicalSubscriptionUiStatus", (): void => {
  it("normalises mixed-case strings", (): void => {
    expect(canonicalSubscriptionUiStatus("Active")).toBe("active")
    expect(canonicalSubscriptionUiStatus("ON_HOLD")).toBe("on_hold")
    expect(canonicalSubscriptionUiStatus("On Hold")).toBe("on_hold")
    expect(canonicalSubscriptionUiStatus("paused")).toBe("paused")
  })
})

describe("subscriptionStatusLabel", (): void => {
  it("returns human-readable labels", (): void => {
    expect(subscriptionStatusLabel("active")).toBe("Active")
    expect(subscriptionStatusLabel("on_hold")).toBe("On Hold")
  })
})
