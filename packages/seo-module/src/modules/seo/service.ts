import type { Context } from "@medusajs/types"
import { MedusaService } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

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

class SeoModuleService extends MedusaService({
  MercflowSeoConfig,
  MercflowRedirect,
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
}

export default SeoModuleService
