import { describe, expect, it, vi } from "vitest"

import PackagingModuleService from "../src/modules/packaging/service"
import type { PackagingTypeRecord } from "../src/modules/packaging/types"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"

describe("PackagingModuleService.upsertShipmentPackaging", (): void => {
  it("creates a row with dimensions snapshot from the live packaging type", async (): Promise<void> => {
    const packagingType: PackagingTypeRecord = {
      id: "pkg_small",
      store_id: STORE_A,
      name: "Small box",
      type: "box",
      length_mm: 200,
      width_mm: 150,
      height_mm: 100,
      max_weight_g: 1000,
      is_active: true,
      created_at: new Date("2026-06-10T12:00:00.000Z"),
      updated_at: new Date("2026-06-10T12:00:00.000Z"),
      deleted_at: null,
    }

    const listPackagingTypesSpy = vi
      .spyOn(
        PackagingModuleService.prototype as {
          listMercflowPackagingTypes: () => Promise<PackagingTypeRecord[]>
        },
        "listMercflowPackagingTypes"
      )
      .mockResolvedValue([packagingType])
    const listShipmentSpy = vi
      .spyOn(
        PackagingModuleService.prototype as unknown as {
          listMercflowShipmentPackagings: () => Promise<unknown[]>
        },
        "listMercflowShipmentPackagings"
      )
      .mockResolvedValue([])
    const createSpy = vi
      .spyOn(
        PackagingModuleService.prototype as unknown as {
          createMercflowShipmentPackagings: (arg: unknown, ctx: unknown) => Promise<unknown>
        },
        "createMercflowShipmentPackagings"
      )
      .mockResolvedValue({
        id: "sp_new",
        store_id: STORE_A,
        fulfillment_id: "ful_01ABC",
        packaging_type_id: "pkg_small",
        dimensions_snapshot_json: {
          name: "Small box",
          length_mm: 200,
          width_mm: 150,
          height_mm: 100,
          max_weight_g: 1000,
        },
        created_at: new Date("2026-06-10T12:00:00.000Z"),
        updated_at: new Date("2026-06-10T12:00:00.000Z"),
        deleted_at: null,
      })

    const svc = Object.create(PackagingModuleService.prototype) as PackagingModuleService
    vi.spyOn(svc, "withTenant").mockImplementation(async (_storeId, fn) =>
      fn({ transactionManager: {} })
    )

    const row = await svc.upsertShipmentPackaging({
      storeId: STORE_A,
      fulfillmentId: "ful_01ABC",
      packagingTypeId: "pkg_small",
    })

    expect(listPackagingTypesSpy).toHaveBeenCalled()
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        store_id: STORE_A,
        fulfillment_id: "ful_01ABC",
        packaging_type_id: "pkg_small",
        dimensions_snapshot_json: {
          name: "Small box",
          length_mm: 200,
          width_mm: 150,
          height_mm: 100,
          max_weight_g: 1000,
        },
      }),
      expect.anything()
    )
    expect(row.dimensions_snapshot_json).toEqual({
      name: "Small box",
      length_mm: 200,
      width_mm: 150,
      height_mm: 100,
      max_weight_g: 1000,
    })

    listPackagingTypesSpy.mockRestore()
    listShipmentSpy.mockRestore()
    createSpy.mockRestore()
  })

  it("rejects unknown packaging_type_id for the tenant", async (): Promise<void> => {
    const listPackagingTypesSpy = vi
      .spyOn(
        PackagingModuleService.prototype as {
          listMercflowPackagingTypes: () => Promise<PackagingTypeRecord[]>
        },
        "listMercflowPackagingTypes"
      )
      .mockResolvedValue([])

    const svc = Object.create(PackagingModuleService.prototype) as PackagingModuleService
    vi.spyOn(svc, "withTenant").mockImplementation(async (_storeId, fn) =>
      fn({ transactionManager: {} })
    )

    await expect(
      svc.upsertShipmentPackaging({
        storeId: STORE_A,
        fulfillmentId: "ful_01ABC",
        packagingTypeId: "pkg_missing",
      })
    ).rejects.toThrow('Packaging type "pkg_missing" not found for this store')

    listPackagingTypesSpy.mockRestore()
  })
})
