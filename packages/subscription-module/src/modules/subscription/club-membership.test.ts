import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { describe, expect, it, vi } from "vitest"
import type Stripe from "stripe"

import {
  handleClubMembershipStripeEvent,
  isCustomerInClubMembersGroup,
} from "./club-membership"
import type { SubscriptionConfigRecord } from "./types"

const CONFIG: SubscriptionConfigRecord = {
  id: "scfg_1",
  store_id: "store_01KG0VBTT0714XV2CCTEBRVC47",
  club_enabled: true,
  club_stripe_product_id: "prod_club",
  club_price_monthly: 89,
  club_price_annual: 890,
  club_fallback_discount_pct: 10,
  club_name: "VIP Klub",
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
}

function makeScope(overrides: {
  groups?: Array<{ id: string; name?: string; metadata?: Record<string, unknown> }>
  accountHolders?: Array<{ customer_id?: string; data?: { id?: string } }>
  groupCustomers?: Array<{ customer_id: string; customer_group_id: string }>
}): {
  resolve: (key: string) => unknown
} {
  const groupCustomers = overrides.groupCustomers ?? []

  return {
    resolve: (key: string): unknown => {
      if (key === ContainerRegistrationKeys.REMOTE_QUERY) {
        return {
          graph: vi.fn(async ({ entity }: { entity: string }) => {
            if (entity === "customer_group") {
              return { data: overrides.groups ?? [{ id: "cgrp_club", metadata: { mercflow_club_role: "club_members" } }] }
            }
            if (entity === "account_holder") {
              return {
                data: overrides.accountHolders ?? [
                  { customer_id: "cus_medusa", data: { id: "cus_stripe" } },
                ],
              }
            }
            return { data: [] }
          }),
        }
      }
      if (key === Modules.CUSTOMER) {
        return {
          listCustomerGroupCustomers: vi.fn(async (filters: {
            customer_id?: string
            customer_group_id?: string
          }) =>
            groupCustomers.filter(
              (row) =>
                row.customer_id === filters.customer_id &&
                row.customer_group_id === filters.customer_group_id
            )
          ),
          addCustomerToGroup: vi.fn(async () => undefined),
          removeCustomerFromGroup: vi.fn(async () => undefined),
        }
      }
      return {}
    },
  }
}

describe("handleClubMembershipStripeEvent", (): void => {
  it("adds customer to club_members on subscription.created", async (): Promise<void> => {
    const scope = makeScope({ groupCustomers: [] })
    const event = {
      type: "customer.subscription.created",
      data: {
        object: {
          customer: "cus_stripe",
          items: { data: [{ price: { product: "prod_club" } }] },
        },
      },
    } as Stripe.Event

    const result = await handleClubMembershipStripeEvent(scope as never, event, CONFIG)

    expect(result.action).toBe("added")
    expect(result.customer_id).toBe("cus_medusa")
  })

  it("skips add when customer is already in club_members group", async (): Promise<void> => {
    const scope = makeScope({
      groupCustomers: [{ customer_id: "cus_medusa", customer_group_id: "cgrp_club" }],
    })
    const event = {
      type: "customer.subscription.created",
      data: {
        object: {
          customer: "cus_stripe",
          items: { data: [{ price: { product: "prod_club" } }] },
        },
      },
    } as Stripe.Event

    const result = await handleClubMembershipStripeEvent(scope as never, event, CONFIG)

    expect(result.action).toBe("skipped")
  })

  it("removes customer from club_members on subscription.deleted", async (): Promise<void> => {
    const scope = makeScope({
      groupCustomers: [{ customer_id: "cus_medusa", customer_group_id: "cgrp_club" }],
    })
    const event = {
      type: "customer.subscription.deleted",
      data: {
        object: {
          customer: "cus_stripe",
          items: { data: [{ price: { product: "prod_club" } }] },
        },
      },
    } as Stripe.Event

    const result = await handleClubMembershipStripeEvent(scope as never, event, CONFIG)

    expect(result.action).toBe("removed")
    expect(result.customer_id).toBe("cus_medusa")
  })

  it("ignores subscriptions for non-club Stripe products", async (): Promise<void> => {
    const scope = makeScope({})
    const event = {
      type: "customer.subscription.created",
      data: {
        object: {
          customer: "cus_stripe",
          items: { data: [{ price: { product: "prod_other" } }] },
        },
      },
    } as Stripe.Event

    const result = await handleClubMembershipStripeEvent(scope as never, event, CONFIG)

    expect(result.action).toBe("ignored")
  })
})

describe("isCustomerInClubMembersGroup", (): void => {
  it("returns true when membership link exists", async (): Promise<void> => {
    const scope = makeScope({
      groupCustomers: [{ customer_id: "cus_1", customer_group_id: "cgrp_1" }],
    })
    const inGroup = await isCustomerInClubMembersGroup(scope as never, "cus_1", "cgrp_1")
    expect(inGroup).toBe(true)
  })
})
