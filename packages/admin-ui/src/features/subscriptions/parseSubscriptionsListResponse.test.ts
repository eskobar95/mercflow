import { describe, expect, it } from "vitest"

import { parseSubscriptionsListEnvelope } from "@/features/subscriptions/parseSubscriptionsListResponse"

describe("parseSubscriptionsListEnvelope", (): void => {
  it("parses MercFlow admin subscription list payloads", (): void => {
    const parsed = parseSubscriptionsListEnvelope({
      data: [
        {
          id: "sub_1",
          store_id: "store_1",
          customer_id: "cus_1",
          product_id: "prod_1",
          variant_id: "pv_1",
          interval: "monthly",
          status: "active",
          stripe_subscription_id: null,
          current_period_start: "2026-05-01T00:00:00.000Z",
          current_period_end: "2026-06-01T00:00:00.000Z",
          next_renewal_at: "2026-06-01T00:00:00.000Z",
          cancelled_at: null,
          pause_requested_at: null,
          customer_display: "Ada Customer",
          product_label: "Tea — Monthly",
        },
      ],
      count: 1,
      limit: 50,
      offset: 0,
    })

    expect(parsed).not.toBeNull()
    expect(parsed?.data[0]?.interval).toBe("monthly")
    expect(parsed?.data[0]?.customer_display).toBe("Ada Customer")
  })
})
