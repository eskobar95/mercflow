import type { Context } from "@medusajs/types"
import { MedusaService } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import {
  appendHistoryEntry,
  defaultRobotsStructuredConfig,
  normalizeRobotsStructured,
} from "./robots-service"
import type {
  MercflowRobotsConfigRecord,
  RobotsChangeHistoryEntry,
  RobotsStructuredConfig,
  UpsertRobotsConfigInput,
} from "./robots-types"
import { MercflowRobotsConfig } from "./models/mercflow-robots-config"
import { MercflowSitemapConfig } from "./models/mercflow-sitemap-config"
import type {
  MercflowSitemapConfigRecord,
  SitemapPageTypeSettings,
  UpsertSitemapConfigInput,
} from "./sitemap-types"
import { parseJsonLdSettings, jsonLdSettingsToStorage } from "./json-ld-settings"
import type { UpsertSeoConfigInput } from "./types"
import { MercflowRedirect } from "./models/mercflow-redirect"
import { MercflowSeoConfig } from "./models/mercflow-seo-config"
import { runWithTenantScope } from "./tenant-scope"
import type {
  CreateRedirectInput,
  MercflowRedirectRecord,
  MercflowSeoConfigRecord,
  RedirectType,
  SlugStrategy,
} from "./types"
import { categoryPublicPathFromHandle, normalizeRedirectPath, productPublicPathFromHandle } from "./utils/paths"

const DEFAULT_SLUG_STRATEGY: SlugStrategy = "nordic"

function normalizeIdList(value: unknown, field: string): string[] {
  if (value === undefined || value === null) {
    return []
  }
  if (!Array.isArray(value)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${field} must be an array of string ids`
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

function parsePageTypeSettings(value: unknown): SitemapPageTypeSettings {
  if (value === null || value === undefined) {
    return {}
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "page_type_settings must be an object"
    )
  }
  return value as SitemapPageTypeSettings
}

function parseRobotsStructured(value: unknown): RobotsStructuredConfig {
  return normalizeRobotsStructured(value)
}

function parseChangeHistory(value: unknown): RobotsChangeHistoryEntry[] {
  if (value === null || value === undefined) {
    return []
  }
  if (!Array.isArray(value)) {
    return []
  }
  const out: RobotsChangeHistoryEntry[] = []
  for (const entry of value) {
    if (
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as RobotsChangeHistoryEntry).changed_at === "string" &&
      typeof (entry as RobotsChangeHistoryEntry).summary === "string"
    ) {
      out.push(entry as RobotsChangeHistoryEntry)
    }
  }
  return out
}

class SeoModuleService extends MedusaService({
  MercflowSeoConfig,
  MercflowRedirect,
  MercflowSitemapConfig,
  MercflowRobotsConfig,
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

  private toSeoConfigRecord(row: Record<string, unknown>): MercflowSeoConfigRecord {
    const strategyRaw = row.slug_strategy
    const slug_strategy: SlugStrategy =
      strategyRaw === "omit" ? "omit" : "nordic"
    return {
      id: String(row.id),
      store_id: String(row.store_id),
      storefront_url:
        row.storefront_url === null || row.storefront_url === undefined
          ? null
          : String(row.storefront_url),
      slug_strategy,
      org_name:
        row.org_name === null || row.org_name === undefined ? null : String(row.org_name),
      org_logo_url:
        row.org_logo_url === null || row.org_logo_url === undefined
          ? null
          : String(row.org_logo_url),
      org_social_urls:
        row.org_social_urls === null || row.org_social_urls === undefined
          ? null
          : (row.org_social_urls as Record<string, unknown>),
      json_ld_settings: parseJsonLdSettings(row.json_ld_settings),
      created_at: row.created_at as Date,
      updated_at: row.updated_at as Date,
      deleted_at: (row.deleted_at as Date | null) ?? null,
    }
  }

  private toRedirectRecord(row: Record<string, unknown>): MercflowRedirectRecord {
    const typeRaw = row.type
    const type: RedirectType = typeRaw === "auto" ? "auto" : "manual"
    return {
      id: String(row.id),
      store_id: String(row.store_id),
      from_path: String(row.from_path),
      to_path: String(row.to_path),
      type,
      created_at: row.created_at as Date,
      updated_at: row.updated_at as Date,
      deleted_at: (row.deleted_at as Date | null) ?? null,
    }
  }

  async getSeoConfig(storeId: string): Promise<MercflowSeoConfigRecord | null> {
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowSeoConfigs({ store_id: storeId }, {}, context)
      const row = rows[0]
      return row ? this.toSeoConfigRecord(row as Record<string, unknown>) : null
    })
  }

  async getOrCreateSeoConfig(storeId: string): Promise<MercflowSeoConfigRecord> {
    const existing = await this.getSeoConfig(storeId)
    if (existing) {
      return existing
    }
    return this.withTenant(storeId, async (context) => {
      const created = await this.createMercflowSeoConfigs(
        [
          {
            store_id: storeId,
            slug_strategy: DEFAULT_SLUG_STRATEGY,
          },
        ],
        context
      )
      const row = Array.isArray(created) ? created[0] : created
      return this.toSeoConfigRecord(row as Record<string, unknown>)
    })
  }

  async upsertSeoConfig(
    storeId: string,
    input: UpsertSeoConfigInput
  ): Promise<MercflowSeoConfigRecord> {
    const current = await this.getOrCreateSeoConfig(storeId)
    return this.withTenant(storeId, async (context) => {
      const updated = await this.updateMercflowSeoConfigs(
        {
          id: current.id,
          ...(input.storefront_url !== undefined
            ? { storefront_url: input.storefront_url }
            : {}),
          ...(input.slug_strategy !== undefined
            ? { slug_strategy: input.slug_strategy }
            : {}),
          ...(input.org_name !== undefined ? { org_name: input.org_name } : {}),
          ...(input.org_logo_url !== undefined
            ? { org_logo_url: input.org_logo_url }
            : {}),
          ...(input.org_social_urls !== undefined
            ? { org_social_urls: input.org_social_urls }
            : {}),
          ...(input.json_ld_settings !== undefined
            ? { json_ld_settings: jsonLdSettingsToStorage(input.json_ld_settings) }
            : {}),
        },
        context
      )
      const row = Array.isArray(updated) ? updated[0] : updated
      return this.toSeoConfigRecord(row as Record<string, unknown>)
    })
  }

  async listRedirects(storeId: string): Promise<MercflowRedirectRecord[]> {
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowRedirects(
        { store_id: storeId },
        { order: { created_at: "DESC" } },
        context
      )
      return rows.map((row) => this.toRedirectRecord(row as Record<string, unknown>))
    })
  }

  async findRedirectByFromPath(
    storeId: string,
    fromPath: string
  ): Promise<MercflowRedirectRecord | null> {
    const normalized = normalizeRedirectPath(fromPath)
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowRedirects(
        { store_id: storeId, from_path: normalized },
        { take: 1 },
        context
      )
      const row = rows[0]
      return row ? this.toRedirectRecord(row as Record<string, unknown>) : null
    })
  }

  /**
   * Creates or updates a redirect keyed by `(from_path, store_id)`.
   * Auto-redirect flows use this so repeat handle changes do not hit the unique constraint.
   */
  async upsertRedirect(
    storeId: string,
    input: CreateRedirectInput
  ): Promise<MercflowRedirectRecord> {
    const from_path = normalizeRedirectPath(input.from_path)
    const to_path = normalizeRedirectPath(input.to_path)
    if (from_path === to_path) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "from_path and to_path must differ"
      )
    }

    const existing = await this.findRedirectByFromPath(storeId, from_path)
    if (!existing) {
      return this.createRedirect(storeId, input)
    }

    return this.withTenant(storeId, async (context) => {
      const updated = await this.updateMercflowRedirects(
        {
          id: existing.id,
          to_path,
          type: input.type ?? existing.type,
        },
        context
      )
      const row = Array.isArray(updated) ? updated[0] : updated
      return this.toRedirectRecord(row as Record<string, unknown>)
    })
  }

  async createRedirect(
    storeId: string,
    input: CreateRedirectInput
  ): Promise<MercflowRedirectRecord> {
    const from_path = normalizeRedirectPath(input.from_path)
    const to_path = normalizeRedirectPath(input.to_path)
    if (from_path === to_path) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "from_path and to_path must differ"
      )
    }
    return this.withTenant(storeId, async (context) => {
      const created = await this.createMercflowRedirects(
        [
          {
            store_id: storeId,
            from_path,
            to_path,
            type: input.type ?? "manual",
          },
        ],
        context
      )
      const row = Array.isArray(created) ? created[0] : created
      return this.toRedirectRecord(row as Record<string, unknown>)
    })
  }

  async deleteRedirect(storeId: string, redirectId: string): Promise<void> {
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowRedirects(
        { id: redirectId, store_id: storeId },
        { take: 1 },
        context
      )
      if (!rows[0]) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Redirect ${redirectId} not found`
        )
      }
      await this.deleteMercflowRedirects(redirectId, context)
    })
  }

  /**
   * Returns true when `toPath` is already registered as a redirect source (chain risk).
   */
  async detectRedirectChain(storeId: string, toPath: string): Promise<boolean> {
    const normalized = normalizeRedirectPath(toPath)
    const match = await this.findRedirectByFromPath(storeId, normalized)
    return match !== null
  }

  async recordProductHandleChange(
    storeId: string,
    previousHandle: string,
    nextHandle: string
  ): Promise<MercflowRedirectRecord | null> {
    if (previousHandle === nextHandle) {
      return null
    }
    return this.upsertRedirect(storeId, {
      from_path: productPublicPathFromHandle(previousHandle),
      to_path: productPublicPathFromHandle(nextHandle),
      type: "auto",
    })
  }

  async recordCategoryHandleChange(
    storeId: string,
    previousHandle: string,
    nextHandle: string
  ): Promise<MercflowRedirectRecord | null> {
    if (previousHandle === nextHandle) {
      return null
    }
    return this.upsertRedirect(storeId, {
      from_path: categoryPublicPathFromHandle(previousHandle),
      to_path: categoryPublicPathFromHandle(nextHandle),
      type: "auto",
    })
  }

  async redirectHasChainIssue(
    storeId: string,
    redirect: MercflowRedirectRecord
  ): Promise<boolean> {
    return this.detectRedirectChain(storeId, redirect.to_path)
  }

  private toSitemapConfigRecord(row: Record<string, unknown>): MercflowSitemapConfigRecord {
    return {
      id: String(row.id),
      store_id: String(row.store_id),
      page_type_settings: parsePageTypeSettings(row.page_type_settings),
      excluded_product_ids: normalizeIdList(
        row.excluded_product_ids,
        "excluded_product_ids"
      ),
      excluded_category_ids: normalizeIdList(
        row.excluded_category_ids,
        "excluded_category_ids"
      ),
      excluded_page_ids: normalizeIdList(row.excluded_page_ids, "excluded_page_ids"),
      created_at: row.created_at as Date,
      updated_at: row.updated_at as Date,
      deleted_at: (row.deleted_at as Date | null) ?? null,
    }
  }

  private toRobotsConfigRecord(row: Record<string, unknown>): MercflowRobotsConfigRecord {
    return {
      id: String(row.id),
      store_id: String(row.store_id),
      structured_rules: parseRobotsStructured(row.structured_rules),
      freetext_override:
        row.freetext_override === null || row.freetext_override === undefined
          ? null
          : String(row.freetext_override),
      change_history: parseChangeHistory(row.change_history),
      created_at: row.created_at as Date,
      updated_at: row.updated_at as Date,
      deleted_at: (row.deleted_at as Date | null) ?? null,
    }
  }

  async getSitemapConfig(storeId: string): Promise<MercflowSitemapConfigRecord | null> {
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowSitemapConfigs({ store_id: storeId }, {}, context)
      const row = rows[0]
      return row ? this.toSitemapConfigRecord(row as Record<string, unknown>) : null
    })
  }

  async getOrCreateSitemapConfig(storeId: string): Promise<MercflowSitemapConfigRecord> {
    const existing = await this.getSitemapConfig(storeId)
    if (existing) {
      return existing
    }
    return this.withTenant(storeId, async (context) => {
      const created = await this.createMercflowSitemapConfigs(
        [
          {
            store_id: storeId,
            page_type_settings: {} as Record<string, unknown>,
            excluded_product_ids: [] as unknown as Record<string, unknown>,
            excluded_category_ids: [] as unknown as Record<string, unknown>,
            excluded_page_ids: [] as unknown as Record<string, unknown>,
          },
        ],
        context
      )
      const row = Array.isArray(created) ? created[0] : created
      return this.toSitemapConfigRecord(row as Record<string, unknown>)
    })
  }

  async upsertSitemapConfig(
    storeId: string,
    input: UpsertSitemapConfigInput
  ): Promise<MercflowSitemapConfigRecord> {
    const current = await this.getOrCreateSitemapConfig(storeId)
    return this.withTenant(storeId, async (context) => {
      const updatePayload: Record<string, unknown> = { id: current.id }
      if (input.page_type_settings !== undefined) {
        updatePayload.page_type_settings = input.page_type_settings as Record<string, unknown>
      }
      if (input.excluded_product_ids !== undefined) {
        updatePayload.excluded_product_ids = input.excluded_product_ids as unknown as Record<
          string,
          unknown
        >
      }
      if (input.excluded_category_ids !== undefined) {
        updatePayload.excluded_category_ids = input.excluded_category_ids as unknown as Record<
          string,
          unknown
        >
      }
      if (input.excluded_page_ids !== undefined) {
        updatePayload.excluded_page_ids = input.excluded_page_ids as unknown as Record<
          string,
          unknown
        >
      }
      const updated = await this.updateMercflowSitemapConfigs(updatePayload, context)
      const row = Array.isArray(updated) ? updated[0] : updated
      return this.toSitemapConfigRecord(row as Record<string, unknown>)
    })
  }

  async getRobotsConfig(storeId: string): Promise<MercflowRobotsConfigRecord | null> {
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowRobotsConfigs({ store_id: storeId }, {}, context)
      const row = rows[0]
      return row ? this.toRobotsConfigRecord(row as Record<string, unknown>) : null
    })
  }

  async getOrCreateRobotsConfig(storeId: string): Promise<MercflowRobotsConfigRecord> {
    const existing = await this.getRobotsConfig(storeId)
    if (existing) {
      return existing
    }
    return this.withTenant(storeId, async (context) => {
      const created = await this.createMercflowRobotsConfigs(
        [
          {
            store_id: storeId,
            structured_rules: defaultRobotsStructuredConfig() as unknown as Record<
              string,
              unknown
            >,
            freetext_override: null,
            change_history: [] as unknown as Record<string, unknown>,
          },
        ],
        context
      )
      const row = Array.isArray(created) ? created[0] : created
      return this.toRobotsConfigRecord(row as Record<string, unknown>)
    })
  }

  async upsertRobotsConfig(
    storeId: string,
    input: UpsertRobotsConfigInput
  ): Promise<MercflowRobotsConfigRecord> {
    const current = await this.getOrCreateRobotsConfig(storeId)
    const summary = input.change_summary?.trim() || "Robots configuration updated"
    const nextHistory = appendHistoryEntry(current.change_history, summary)
    return this.withTenant(storeId, async (context) => {
      const robotsPayload: Record<string, unknown> = {
        id: current.id,
        change_history: nextHistory as unknown as Record<string, unknown>,
      }
      if (input.structured_rules !== undefined) {
        robotsPayload.structured_rules = input.structured_rules as unknown as Record<
          string,
          unknown
        >
      }
      if (input.freetext_override !== undefined) {
        robotsPayload.freetext_override = input.freetext_override
      }
      const updated = await this.updateMercflowRobotsConfigs(robotsPayload, context)
      const row = Array.isArray(updated) ? updated[0] : updated
      return this.toRobotsConfigRecord(row as Record<string, unknown>)
    })
  }
}

export default SeoModuleService
