import type { Context } from "@medusajs/types"
import { MedusaService } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import { MercflowFeedConfig } from "./models/feed-config"
import { runWithTenantScope } from "./tenant-scope"
import type { FeedConfigRecord, UpdateFeedConfigInput } from "./types"

const DEFAULT_CONDITION = "new"

function normalizeIdList(value: unknown, field: string): string[] {
  if (value === undefined) {
    return []
  }
  if (!Array.isArray(value)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${field} must be an array of product or category ids`
    )
  }
  for (const entry of value) {
    if (typeof entry !== "string" || entry.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `${field} must contain non-empty string ids`
      )
    }
  }
  return value as string[]
}

function toFeedConfigRecord(row: Record<string, unknown>): FeedConfigRecord {
  return {
    id: String(row.id),
    store_id: String(row.store_id),
    storefront_url:
      row.storefront_url === null || row.storefront_url === undefined
        ? null
        : String(row.storefront_url),
    excluded_product_ids: normalizeIdList(
      row.excluded_product_ids ?? [],
      "excluded_product_ids"
    ),
    excluded_category_ids: normalizeIdList(
      row.excluded_category_ids ?? [],
      "excluded_category_ids"
    ),
    default_condition: String(row.default_condition ?? DEFAULT_CONDITION),
  }
}

class FeedConfigService extends MedusaService({
  MercflowFeedConfig,
}) {
  /**
   * Runs `fn` in a transaction with `app.store_id` set for PostgreSQL RLS (ADR-005).
   */
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

  /**
   * Returns feed configuration for the tenant, or null when none exists yet.
   */
  async get(storeId: string): Promise<FeedConfigRecord | null> {
    return this.withTenant(storeId, async (context: Context) => {
      const rows = await this.listMercflowFeedConfigs(
        { store_id: storeId },
        {},
        context
      )
      const row = rows[0]
      if (!row) {
        return null
      }
      return toFeedConfigRecord(row as Record<string, unknown>)
    })
  }

  /**
   * Creates or updates feed configuration for the tenant (one row per store_id).
   */
  async update(
    storeId: string,
    config: UpdateFeedConfigInput
  ): Promise<FeedConfigRecord> {
    if (config.default_condition !== undefined) {
      const trimmed = config.default_condition.trim()
      if (trimmed.length === 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "default_condition must not be empty"
        )
      }
    }

    return this.withTenant(storeId, async (context: Context) => {
      const rows = await this.listMercflowFeedConfigs(
        { store_id: storeId },
        {},
        context
      )
      const existing = rows[0] as Record<string, unknown> | undefined

      const payload: Record<string, unknown> = { store_id: storeId }

      if (config.storefront_url !== undefined) {
        payload.storefront_url = config.storefront_url
      }
      if (config.excluded_product_ids !== undefined) {
        payload.excluded_product_ids = normalizeIdList(
          config.excluded_product_ids,
          "excluded_product_ids"
        ) as unknown as Record<string, unknown>
      }
      if (config.excluded_category_ids !== undefined) {
        payload.excluded_category_ids = normalizeIdList(
          config.excluded_category_ids,
          "excluded_category_ids"
        ) as unknown as Record<string, unknown>
      }
      if (config.default_condition !== undefined) {
        payload.default_condition = config.default_condition.trim()
      }

      if (!existing) {
        const created = await this.createMercflowFeedConfigs([
          {
            store_id: storeId,
            storefront_url: config.storefront_url ?? null,
            excluded_product_ids: (config.excluded_product_ids ??
              []) as unknown as Record<string, unknown>,
            excluded_category_ids: (config.excluded_category_ids ??
              []) as unknown as Record<string, unknown>,
            default_condition:
              config.default_condition?.trim() ?? DEFAULT_CONDITION,
          },
        ])
        const row = Array.isArray(created)
          ? created[0]
          : created
        if (!row) {
          throw new MedusaError(
            MedusaError.Types.UNEXPECTED_STATE,
            "Failed to create feed config"
          )
        }
        return toFeedConfigRecord(row as Record<string, unknown>)
      }

      const updated = await this.updateMercflowFeedConfigs({
        id: String(existing.id),
        ...payload,
      })
      const row = Array.isArray(updated) ? updated[0] : updated
      if (!row) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Failed to update feed config"
        )
      }
      return toFeedConfigRecord(row as Record<string, unknown>)
    })
  }
}

export default FeedConfigService
