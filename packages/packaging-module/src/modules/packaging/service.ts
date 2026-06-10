import type { Context } from "@medusajs/types"
import { MedusaService } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import { MercflowPackagingType, MercflowShipmentPackaging } from "./models"
import { buildDimensionsSnapshotFromPackagingType } from "./dimensions-snapshot"
import { suggestPackagingFromCatalog } from "./suggest-packaging"
import { runWithTenantScope } from "./tenant-scope"
import type {
  CreatePackagingTypeInput,
  PackagingTypeKind,
  PackagingTypeRecord,
  SuggestPackagingItem,
  SuggestPackagingResult,
  ShipmentPackagingRecord,
  UpdatePackagingTypeInput,
  UpsertShipmentPackagingInput,
  VariantDimensionLoader,
} from "./types"
import type { DimensionsSnapshot } from "./types"
import { PACKAGING_TYPE_KINDS } from "./types"

function isDuplicateKeyError(error: unknown): boolean {
  return error instanceof Error && error.message.toLowerCase().includes("duplicate key")
}

function isPackagingTypeKind(value: string): value is PackagingTypeKind {
  return (PACKAGING_TYPE_KINDS as readonly string[]).includes(value)
}

function toPackagingTypeRecord(row: Record<string, unknown>): PackagingTypeRecord {
  const type = typeof row.type === "string" ? row.type : ""
  if (!isPackagingTypeKind(type)) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Packaging type "${String(row.id)}" has invalid type "${type}"`
    )
  }

  return {
    id: String(row.id),
    store_id: String(row.store_id),
    name: String(row.name),
    type,
    length_mm: Number(row.length_mm),
    width_mm: Number(row.width_mm),
    height_mm: Number(row.height_mm),
    max_weight_g: Number(row.max_weight_g),
    is_active: Boolean(row.is_active),
    created_at: row.created_at as string | Date,
    updated_at: row.updated_at as string | Date,
    deleted_at: (row.deleted_at as string | Date | null | undefined) ?? null,
  }
}

function unwrapCreated<T>(result: T | T[]): T {
  return Array.isArray(result) ? result[0]! : result
}

function assertPositiveDimension(field: string, value: number): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 1) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${field} must be a positive integer`
    )
  }
}

function parseDimensionsSnapshot(value: unknown): DimensionsSnapshot {
  if (value === null || typeof value !== "object") {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Shipment packaging has invalid dimensions_snapshot_json"
    )
  }
  const row = value as Record<string, unknown>
  return {
    name: String(row.name),
    length_mm: Number(row.length_mm),
    width_mm: Number(row.width_mm),
    height_mm: Number(row.height_mm),
    max_weight_g: Number(row.max_weight_g),
  }
}

function toShipmentPackagingRecord(row: Record<string, unknown>): ShipmentPackagingRecord {
  return {
    id: String(row.id),
    store_id: String(row.store_id),
    fulfillment_id: String(row.fulfillment_id),
    packaging_type_id: String(row.packaging_type_id),
    dimensions_snapshot_json: parseDimensionsSnapshot(row.dimensions_snapshot_json),
    created_at: row.created_at as string | Date,
    updated_at: row.updated_at as string | Date,
    deleted_at: (row.deleted_at as string | Date | null | undefined) ?? null,
  }
}

class PackagingModuleService extends MedusaService({
  MercflowPackagingType,
  MercflowShipmentPackaging,
}) {
  async withTenant<T>(
    storeId: string,
    fn: (context: Context) => Promise<T>
  ): Promise<T> {
    const baseRepo = (
      this as unknown as {
        baseRepository_: Parameters<typeof runWithTenantScope>[0]
      }
    ).baseRepository_
    return runWithTenantScope(baseRepo, storeId, fn)
  }

  async listPackagingTypes(
    storeId: string,
    options?: { limit?: number; offset?: number; includeDeleted?: boolean }
  ): Promise<{ packaging_types: PackagingTypeRecord[]; count: number }> {
    return this.withTenant(storeId, async (context) => {
      const filters: Record<string, unknown> = { store_id: storeId }
      if (!options?.includeDeleted) {
        filters.deleted_at = null
      }

      const [rows, count] = await this.listAndCountMercflowPackagingTypes(
        filters,
        {
          order: { name: "ASC" },
          skip: options?.offset ?? 0,
          take: options?.limit ?? 50,
        },
        context
      )

      return {
        packaging_types: rows.map((row) =>
          toPackagingTypeRecord(row as unknown as Record<string, unknown>)
        ),
        count,
      }
    })
  }

  async retrievePackagingType(
    storeId: string,
    packagingTypeId: string
  ): Promise<PackagingTypeRecord | null> {
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowPackagingTypes(
        { id: packagingTypeId, store_id: storeId },
        {},
        context
      )
      const row = rows[0]
      if (!row) {
        return null
      }
      return toPackagingTypeRecord(row as unknown as Record<string, unknown>)
    })
  }

  async createPackagingType(
    storeId: string,
    input: CreatePackagingTypeInput
  ): Promise<PackagingTypeRecord> {
    assertPositiveDimension("length_mm", input.length_mm)
    assertPositiveDimension("width_mm", input.width_mm)
    assertPositiveDimension("height_mm", input.height_mm)
    assertPositiveDimension("max_weight_g", input.max_weight_g)

    return this.withTenant(storeId, async (context) => {
      try {
        const created = unwrapCreated(
          await this.createMercflowPackagingTypes(
            {
              store_id: storeId,
              name: input.name.trim(),
              type: input.type,
              length_mm: input.length_mm,
              width_mm: input.width_mm,
              height_mm: input.height_mm,
              max_weight_g: input.max_weight_g,
              is_active: input.is_active ?? true,
            },
            context
          )
        )
        return toPackagingTypeRecord(created as unknown as Record<string, unknown>)
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Packaging type name "${input.name}" already exists for this store`
          )
        }
        throw error
      }
    })
  }

  async updatePackagingType(
    storeId: string,
    packagingTypeId: string,
    input: UpdatePackagingTypeInput
  ): Promise<PackagingTypeRecord> {
    if (input.length_mm !== undefined) {
      assertPositiveDimension("length_mm", input.length_mm)
    }
    if (input.width_mm !== undefined) {
      assertPositiveDimension("width_mm", input.width_mm)
    }
    if (input.height_mm !== undefined) {
      assertPositiveDimension("height_mm", input.height_mm)
    }
    if (input.max_weight_g !== undefined) {
      assertPositiveDimension("max_weight_g", input.max_weight_g)
    }

    return this.withTenant(storeId, async (context) => {
      const existing = await this.listMercflowPackagingTypes(
        { id: packagingTypeId, store_id: storeId },
        {},
        context
      )
      if (!existing[0]) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Packaging type "${packagingTypeId}" not found`
        )
      }

      const payload: Record<string, unknown> = {}
      if (input.name !== undefined) payload.name = input.name.trim()
      if (input.type !== undefined) payload.type = input.type
      if (input.length_mm !== undefined) payload.length_mm = input.length_mm
      if (input.width_mm !== undefined) payload.width_mm = input.width_mm
      if (input.height_mm !== undefined) payload.height_mm = input.height_mm
      if (input.max_weight_g !== undefined) payload.max_weight_g = input.max_weight_g
      if (input.is_active !== undefined) payload.is_active = input.is_active

      try {
        const updated = unwrapCreated(
          await this.updateMercflowPackagingTypes(payload, { id: packagingTypeId }, context)
        )
        return toPackagingTypeRecord(updated as unknown as Record<string, unknown>)
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Packaging type name "${input.name ?? ""}" already exists for this store`
          )
        }
        throw error
      }
    })
  }

  async deletePackagingType(storeId: string, packagingTypeId: string): Promise<void> {
    await this.withTenant(storeId, async (context) => {
      const existing = await this.listMercflowPackagingTypes(
        { id: packagingTypeId, store_id: storeId },
        {},
        context
      )
      if (!existing[0]) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Packaging type "${packagingTypeId}" not found`
        )
      }
      await this.softDeleteMercflowPackagingTypes(packagingTypeId)
    })
  }

  async suggestPackaging(
    storeId: string,
    items: SuggestPackagingItem[],
    loadVariantDimensions: VariantDimensionLoader
  ): Promise<SuggestPackagingResult> {
    const variantIds = [...new Set(items.map((item) => item.variantId))]
    const variants = await loadVariantDimensions(variantIds)

    return this.withTenant(storeId, async (context) => {
      const catalogRows = await this.listMercflowPackagingTypes(
        { store_id: storeId, deleted_at: null, is_active: true },
        {},
        context
      )
      const catalog = catalogRows.map((row) =>
        toPackagingTypeRecord(row as unknown as Record<string, unknown>)
      )

      const result = suggestPackagingFromCatalog(catalog, items, variants)
      return {
        suggested: result.suggested,
        total_volume_mm3: result.total_volume_mm3,
        total_weight_g: result.total_weight_g,
      }
    })
  }

  async retrieveShipmentPackaging(
    storeId: string,
    fulfillmentId: string
  ): Promise<ShipmentPackagingRecord | null> {
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowShipmentPackagings(
        { store_id: storeId, fulfillment_id: fulfillmentId, deleted_at: null },
        {},
        context
      )
      const row = rows[0]
      if (!row) {
        return null
      }
      return toShipmentPackagingRecord(row as unknown as Record<string, unknown>)
    })
  }

  async upsertShipmentPackaging(
    input: UpsertShipmentPackagingInput
  ): Promise<ShipmentPackagingRecord> {
    const { storeId, fulfillmentId, packagingTypeId } = input

    return this.withTenant(storeId, async (context) => {
      const packagingTypeRows = await this.listMercflowPackagingTypes(
        { id: packagingTypeId, store_id: storeId, deleted_at: null },
        {},
        context
      )
      if (!packagingTypeRows[0]) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Packaging type "${packagingTypeId}" not found for this store`
        )
      }

      const packagingType = toPackagingTypeRecord(
        packagingTypeRows[0] as unknown as Record<string, unknown>
      )
      const snapshot = buildDimensionsSnapshotFromPackagingType(packagingType)

      const existingRows = await this.listMercflowShipmentPackagings(
        { store_id: storeId, fulfillment_id: fulfillmentId, deleted_at: null },
        {},
        context
      )
      const existing = existingRows[0]

      if (existing) {
        const updated = unwrapCreated(
          await this.updateMercflowShipmentPackagings(
            {
              packaging_type_id: packagingTypeId,
              dimensions_snapshot_json: snapshot,
            },
            { id: String(existing.id) },
            context
          )
        )
        return toShipmentPackagingRecord(updated as unknown as Record<string, unknown>)
      }

      const created = unwrapCreated(
        await this.createMercflowShipmentPackagings(
          {
            store_id: storeId,
            fulfillment_id: fulfillmentId,
            packaging_type_id: packagingTypeId,
            dimensions_snapshot_json: snapshot,
          },
          context
        )
      )
      return toShipmentPackagingRecord(created as unknown as Record<string, unknown>)
    })
  }

  async deleteShipmentPackaging(storeId: string, fulfillmentId: string): Promise<void> {
    await this.withTenant(storeId, async (context) => {
      const existingRows = await this.listMercflowShipmentPackagings(
        { store_id: storeId, fulfillment_id: fulfillmentId, deleted_at: null },
        {},
        context
      )
      const existing = existingRows[0]
      if (!existing) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Shipment packaging for fulfillment "${fulfillmentId}" not found`
        )
      }
      await this.softDeleteMercflowShipmentPackagings(String(existing.id))
    })
  }
}

export default PackagingModuleService
