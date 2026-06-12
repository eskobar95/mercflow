import { describe, expect, it, vi } from "vitest"
import { MedusaError } from "@medusajs/utils"

import {
  CLUB_MEMBERS_GROUP_METADATA_KEY,
  CLUB_MEMBERS_GROUP_METADATA_VALUE,
} from "./club-constants"
import { requireClubEnabled } from "./club-pricing"
import type SubscriptionModuleService from "./service"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"

function createServiceStub(
  getSubscriptionConfig: SubscriptionModuleService["getSubscriptionConfig"]
): SubscriptionModuleService {
  return {
    getSubscriptionConfig,
  } as SubscriptionModuleService
}

describe("requireClubEnabled", (): void => {
  it("throws when subscription config is missing", async (): Promise<void> => {
    const service = createServiceStub(vi.fn().mockResolvedValue(null))

    await expect(requireClubEnabled(service, STORE_A)).rejects.toThrow(MedusaError)
    await expect(requireClubEnabled(service, STORE_A)).rejects.toMatchObject({
      type: MedusaError.Types.INVALID_DATA,
    })
  })

  it("throws when club is disabled", async (): Promise<void> => {
    const service = createServiceStub(
      vi.fn().mockResolvedValue({
        id: "cfg_1",
        store_id: STORE_A,
        club_enabled: false,
        club_stripe_product_id: null,
        club_price_monthly: null,
        club_price_annual: null,
        club_fallback_discount_pct: null,
        club_name: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      })
    )

    await expect(requireClubEnabled(service, STORE_A)).rejects.toThrow(MedusaError)
  })

  it("returns config when club is enabled", async (): Promise<void> => {
    const config = {
      id: "cfg_1",
      store_id: STORE_A,
      club_enabled: true,
      club_stripe_product_id: null,
      club_price_monthly: null,
      club_price_annual: null,
      club_fallback_discount_pct: 10,
      club_name: "VIP Klub",
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    }
    const service = createServiceStub(vi.fn().mockResolvedValue(config))

    await expect(requireClubEnabled(service, STORE_A)).resolves.toEqual(config)
  })
})

describe("club constants", (): void => {
  it("uses stable metadata for club_members group lookup", (): void => {
    expect(CLUB_MEMBERS_GROUP_METADATA_KEY).toBe("mercflow_club_role")
    expect(CLUB_MEMBERS_GROUP_METADATA_VALUE).toBe("club_members")
  })
})
