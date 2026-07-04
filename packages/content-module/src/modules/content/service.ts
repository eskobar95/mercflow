import type { Context } from "@medusajs/types"
import { MedusaService } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import type { AdminPageCreateBody, AdminPagePatchBody } from "./http-schemas"
import { Article } from "./models/article"
import { CategoryContent } from "./models/category-content"
import { CmsGlobal } from "./models/cms-global"
import { CmsRedirect } from "./models/cms-redirect"
import { MediaAsset } from "./models/media-asset"
import { Page } from "./models/page"
import { PageBlock } from "./models/page-block"
import { PageVersion } from "./models/page-version"
import { ProductAttrLink } from "./models/product-attr-link"
import { ProductAttribute } from "./models/product-attribute"
import { ProductContent } from "./models/product-content"
import type {
  AdminPageListRow,
  ArticleRecord,
  CategoryContentRecord,
  CmsPageRecord,
  CreateArticleInput,
  ProductContentRecord,
  ResolvedCategoryContent,
  ResolvedProductContent,
  StorePublishedPagePayload,
  UpdateArticleInput,
  UpsertCategoryContentInput,
  UpsertProductContentInput,
} from "./types"
import { runWithTenantScope } from "./tenant-scope"
import { slugifyTitleToArticleSegment } from "./utils/transliterate-nordic-slug"

const SEO_DESCRIPTION_MAX = 160
const SEO_TITLE_MAX = 255

class ContentModuleService extends MedusaService({
  ProductContent,
  CategoryContent,
  Article,
  Page,
  PageVersion,
  PageBlock,
  CmsGlobal,
  CmsRedirect,
  MediaAsset,
  ProductAttribute,
  ProductAttrLink,
}) {
  /**
   * Runs `fn` in a transaction with `app.store_id` set for PostgreSQL RLS (T002 / ADR-005).
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

  private assertSeoDescriptionLength(value: string | null | undefined): void {
    if (value != null && value.length > SEO_DESCRIPTION_MAX) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `seo_description must not exceed ${SEO_DESCRIPTION_MAX} characters`
      )
    }
  }

  private assertSeoTitleLength(value: string | null | undefined): void {
    if (value != null && value.length > SEO_TITLE_MAX) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `seo_title must not exceed ${SEO_TITLE_MAX} characters`
      )
    }
  }

  private normalizeBodyJson(
    value: unknown
  ): Record<string, unknown> | null {
    if (value === undefined) {
      return null
    }
    if (value === null) {
      return null
    }
    if (typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>
    }
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "body content must be a JSON object when provided"
    )
  }

  /**
   * Returns resolved CMS row for one product locale, or null when no `product_content` row exists.
   */
  async findByProductId(
    productId: string,
    locale: string,
    storeId: string
  ): Promise<ResolvedProductContent | null> {
    return this.retrieveProductContentForLocale(productId, locale, { storeId })
  }

  /**
   * Reads category CMS fields for `category_content` keyed by category id + locale (MER-27).
   */
  async findByCategoryId(
    categoryId: string,
    locale: string,
    storeId: string
  ): Promise<ResolvedCategoryContent | null> {
    return this.retrieveCategoryContentForLocale(categoryId, locale, { storeId })
  }

  async retrieveProductContentForLocale(
    productId: string,
    locale: string,
    options?: { storeId?: string }
  ): Promise<ResolvedProductContent | null> {
    const query = async (context: Context = {}): Promise<ResolvedProductContent | null> => {
      const rows = await this.listProductContents(
        {
          product_id: productId,
          locale,
        },
        {},
        context
      )
      const row = rows[0]
      if (!row) {
        return null
      }
      return this.resolveProductRow(row as ProductContentRecord)
    }

    if (options?.storeId) {
      return this.withTenant(options.storeId, query)
    }

    return query()
  }

  async upsertProductContent(
    productId: string,
    locale: string,
    data: UpsertProductContentInput,
    storeId: string
  ): Promise<ResolvedProductContent> {
    this.assertSeoDescriptionLength(data.seo_description ?? null)
    this.assertSeoTitleLength(data.seo_title ?? null)

    return this.withTenant(storeId, async (context) => {
      const rows = await this.listProductContents(
        {
          product_id: productId,
          locale,
        },
        {},
        context
      )
      const existing = rows[0] as ProductContentRecord | undefined

      const payload: Partial<ProductContentRecord> = {}

      if (data.description_rich !== undefined) {
        payload.body_json = this.normalizeBodyJson(data.description_rich)
      }
      if (data.seo_title !== undefined) {
        payload.seo_title = data.seo_title
      }
      if (data.seo_description !== undefined) {
        payload.seo_description = data.seo_description
      }
      if (data.seo_og_image_id !== undefined) {
        payload.og_image_url = data.seo_og_image_id
      }
      if (data.canonical_url_override !== undefined) {
        payload.canonical_url_override = data.canonical_url_override
      }

      let row: ProductContentRecord
      if (!existing) {
        const created = await this.createProductContents(
          {
            store_id: storeId,
            product_id: productId,
            locale,
            body_json: payload.body_json ?? null,
            seo_title: payload.seo_title ?? null,
            seo_description: payload.seo_description ?? null,
            og_image_url: payload.og_image_url ?? null,
            canonical_url_override: payload.canonical_url_override ?? null,
            version: 1,
          },
          context
        )
        row = Array.isArray(created)
          ? (created[0] as ProductContentRecord)
          : (created as ProductContentRecord)
      } else {
        const prevVersion =
          typeof existing.version === "number" && !Number.isNaN(existing.version)
            ? existing.version
            : 0
        const updated = await this.updateProductContents(
          {
            id: existing.id,
            ...payload,
            version: prevVersion + 1,
          },
          context
        )
        row = Array.isArray(updated)
          ? (updated[0] as ProductContentRecord)
          : (updated as ProductContentRecord)
      }

      return this.resolveProductRow(row)
    })
  }

  private resolveProductRow(row: ProductContentRecord): ResolvedProductContent {
    return {
      id: row.id,
      product_id: row.product_id,
      locale: row.locale,
      version: row.version,
      description_rich: row.body_json,
      seo_title: row.seo_title,
      seo_description: row.seo_description,
      seo_og_image_id: row.og_image_url,
      media_gallery: null,
      canonical_url_override: row.canonical_url_override ?? null,
    }
  }

  async retrieveCategoryContentForLocale(
    categoryId: string,
    locale: string,
    options?: { storeId?: string }
  ): Promise<ResolvedCategoryContent | null> {
    const query = async (context: Context = {}): Promise<ResolvedCategoryContent | null> => {
      const rows = await this.listCategoryContents(
        {
          category_id: categoryId,
          locale,
        },
        {},
        context
      )
      const row = rows[0]
      if (!row) {
        return null
      }
      return this.resolveCategoryRow(row as CategoryContentRecord)
    }

    if (options?.storeId) {
      return this.withTenant(options.storeId, query)
    }

    return query()
  }

  async upsertCategoryContent(
    categoryId: string,
    locale: string,
    data: UpsertCategoryContentInput,
    storeId: string
  ): Promise<ResolvedCategoryContent> {
    this.assertSeoDescriptionLength(data.seo_description ?? null)
    this.assertSeoTitleLength(data.seo_title ?? null)

    return this.withTenant(storeId, async (context) => {
      const rows = await this.listCategoryContents(
        {
          category_id: categoryId,
          locale,
        },
        {},
        context
      )
      const existing = rows[0] as CategoryContentRecord | undefined

      const payload: Partial<CategoryContentRecord> = {}

      if (data.description_rich !== undefined) {
        payload.body_json = this.normalizeBodyJson(data.description_rich)
      }
      if (data.seo_title !== undefined) {
        payload.seo_title = data.seo_title
      }
      if (data.seo_description !== undefined) {
        payload.seo_description = data.seo_description
      }
      if (data.seo_og_image_id !== undefined) {
        payload.og_image_url = data.seo_og_image_id
      }
      if (data.banner_image_id !== undefined) {
        payload.banner_image_url = data.banner_image_id
      }
      if (data.canonical_url_override !== undefined) {
        payload.canonical_url_override = data.canonical_url_override
      }

      let row: CategoryContentRecord
      if (!existing) {
        const created = await this.createCategoryContents(
          {
            store_id: storeId,
            category_id: categoryId,
            locale,
            body_json: payload.body_json ?? null,
            seo_title: payload.seo_title ?? null,
            seo_description: payload.seo_description ?? null,
            og_image_url: payload.og_image_url ?? null,
            banner_image_url: payload.banner_image_url ?? null,
            canonical_url_override: payload.canonical_url_override ?? null,
          },
          context
        )
        row = Array.isArray(created)
          ? (created[0] as CategoryContentRecord)
          : (created as CategoryContentRecord)
      } else {
        const updated = await this.updateCategoryContents(
          {
            id: existing.id,
            ...payload,
          },
          context
        )
        row = Array.isArray(updated)
          ? (updated[0] as CategoryContentRecord)
          : (updated as CategoryContentRecord)
      }

      return this.resolveCategoryRow(row)
    })
  }

  private resolveCategoryRow(row: CategoryContentRecord): ResolvedCategoryContent {
    return {
      id: row.id,
      category_id: row.category_id,
      locale: row.locale,
      version: row.version,
      cms_status: row.status,
      description_rich: row.body_json,
      seo_title: row.seo_title,
      seo_description: row.seo_description,
      seo_og_image_id: row.og_image_url,
      banner_image_id: row.banner_image_url,
      canonical_url_override: row.canonical_url_override ?? null,
    }
  }

  private toArticleRecord(row: unknown): ArticleRecord {
    const r = row as ArticleRecord
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      body_json: r.body_json,
      locale: r.locale,
      status: r.status,
      published_at: r.published_at ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
      deleted_at: r.deleted_at,
    }
  }

  private async allocateUniqueArticleSlug(
    baseSlug: string,
    locale: string,
    excludeArticleId?: string
  ): Promise<string> {
    for (let n = 1; n < 5000; n += 1) {
      const candidate = n === 1 ? baseSlug : `${baseSlug}-${n}`
      const rows = await this.listArticles({ slug: candidate, locale })
      const taken = rows.some((row) => (row as ArticleRecord).id !== excludeArticleId)
      if (!taken) {
        return candidate
      }
    }
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Unable to allocate a unique article slug"
    )
  }

  async createArticle(input: CreateArticleInput): Promise<ArticleRecord> {
    const locale = input.locale ?? "en"
    const title = input.title.trim()
    if (!title) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Article title is required")
    }
    const status = input.status ?? "draft"
    const bodyJson = this.normalizeBodyJson(input.body_json ?? null)

    const baseSlug =
      input.slug != null && input.slug.trim().length > 0
        ? slugifyTitleToArticleSegment(input.slug)
        : slugifyTitleToArticleSegment(title)
    const slug = await this.allocateUniqueArticleSlug(baseSlug, locale)

    let publishedAt: Date | null = null
    if (input.published_at !== undefined && input.published_at !== null) {
      publishedAt = input.published_at
    } else if (status === "published") {
      publishedAt = new Date()
    }

    const created = await this.createArticles({
      title,
      slug,
      body_json: bodyJson,
      locale,
      status,
      published_at: publishedAt,
    })
    const row = Array.isArray(created) ? created[0] : created
    return this.toArticleRecord(row)
  }

  async updateArticle(articleId: string, input: UpdateArticleInput): Promise<ArticleRecord> {
    const existingRows = await this.listArticles({ id: articleId })
    const existing = existingRows[0] as ArticleRecord | undefined
    if (!existing) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Article "${articleId}" not found`)
    }

    const nextLocale = input.locale ?? existing.locale
    let nextTitle = existing.title
    if (input.title !== undefined) {
      const trimmed = input.title.trim()
      if (!trimmed) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Article title cannot be empty")
      }
      nextTitle = trimmed
    }

    let nextSlug = existing.slug
    if (input.slug !== undefined && input.slug !== null && input.slug.trim().length > 0) {
      nextSlug = slugifyTitleToArticleSegment(input.slug)
    } else if (input.title !== undefined) {
      nextSlug = slugifyTitleToArticleSegment(nextTitle)
    }
    if (nextSlug !== existing.slug || nextLocale !== existing.locale) {
      nextSlug = await this.allocateUniqueArticleSlug(nextSlug, nextLocale, existing.id)
    }

    let nextBody = existing.body_json
    if (input.body_json !== undefined) {
      nextBody = this.normalizeBodyJson(input.body_json)
    }

    let nextStatus = existing.status
    if (input.status !== undefined) {
      nextStatus = input.status
    }

    let nextPublishedAt =
      input.published_at !== undefined ? input.published_at : existing.published_at

    if (input.status === "draft") {
      nextPublishedAt = null
    } else if (input.status === "published" && nextPublishedAt === null) {
      nextPublishedAt = new Date()
    } else if (
      input.status === undefined &&
      nextStatus === "published" &&
      nextPublishedAt === null
    ) {
      nextPublishedAt = new Date()
    }

    const updated = await this.updateArticles({
      id: existing.id,
      title: nextTitle,
      slug: nextSlug,
      body_json: nextBody,
      locale: nextLocale,
      status: nextStatus,
      published_at: nextPublishedAt,
    })
    const row = Array.isArray(updated) ? updated[0] : updated
    return this.toArticleRecord(row)
  }

  async publishArticle(articleId: string, publishedAt?: Date | null): Promise<ArticleRecord> {
    const existingRows = await this.listArticles({ id: articleId })
    const existing = existingRows[0] as ArticleRecord | undefined
    if (!existing) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Article "${articleId}" not found`)
    }
    const at = publishedAt === undefined ? new Date() : publishedAt
    const updated = await this.updateArticles({
      id: existing.id,
      status: "published",
      published_at: at,
    })
    const row = Array.isArray(updated) ? updated[0] : updated
    return this.toArticleRecord(row)
  }

  async deleteArticle(articleId: string): Promise<void> {
    const existingRows = await this.listArticles({ id: articleId })
    const existing = existingRows[0] as ArticleRecord | undefined
    if (!existing) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Article "${articleId}" not found`)
    }
    await this.softDeleteArticles(existing.id)
  }

  async listArticlesForAdmin(options?: {
    locale?: string
    limit?: number
    offset?: number
  }): Promise<{ articles: ArticleRecord[]; count: number }> {
    const filters = options?.locale ? { locale: options.locale } : {}
    const [rows, count] = await this.listAndCountArticles(filters, {
      order: { created_at: "DESC" },
      skip: options?.offset ?? 0,
      take: options?.limit ?? 50,
    })
    return {
      articles: rows.map((row) => this.toArticleRecord(row)),
      count,
    }
  }

  async retrieveArticleById(articleId: string): Promise<ArticleRecord | null> {
    const rows = await this.listArticles({ id: articleId })
    const row = rows[0] as ArticleRecord | undefined
    return row ? this.toArticleRecord(row) : null
  }

  async findPublishedArticleBySlug(
    slug: string,
    locale: string
  ): Promise<ArticleRecord | null> {
    const rows = await this.listArticles({ slug, locale, status: "published" })
    const row = rows[0] as ArticleRecord | undefined
    return row ? this.toArticleRecord(row) : null
  }

  async listPublishedArticles(locale: string): Promise<ArticleRecord[]> {
    const rows = await this.listArticles(
      { locale, status: "published" },
      { order: { published_at: "DESC" } }
    )
    return rows.map((row) => this.toArticleRecord(row))
  }

  /**
   * Public storefront path segment used in `cms_redirect` when a page slug changes.
   * Aligns with `GET /store/pages/:slug` (leading slash, `/pages/` prefix).
   */
  storePathForPageSlug(slug: string): string {
    return `/pages/${slug}`
  }

  private async assertPageSlugAvailableForLocale(
    slug: string,
    locale: string,
    excludePageId: string | undefined,
    context: Context = {}
  ): Promise<void> {
    const rows = await this.listPages({ slug, locale }, {}, context)
    const conflict = rows.find((row) => row.id !== excludePageId)
    if (conflict) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `A page with slug "${slug}" already exists for locale "${locale}"`
      )
    }
  }

  private async countBlocksForPageId(pageId: string, context: Context = {}): Promise<number> {
    const versions = await this.listPageVersions(
      { page_id: pageId },
      { order: { version: "DESC" }, take: 1 },
      context
    )
    const head = versions[0]
    if (!head) {
      return 0
    }
    const blocks = await this.listPageBlocks({ page_version_id: head.id }, {}, context)
    return blocks.length
  }

  private async toAdminPageRow(row: CmsPageRecord, context: Context = {}): Promise<AdminPageListRow> {
    return {
      ...row,
      block_count: await this.countBlocksForPageId(row.id, context),
    }
  }

  /**
   * Persists a redirect from the old public path to the new one. Intended to run
   * inside the same DB transaction as the page slug update.
   */
  async createRedirectFromSlugChange(
    oldSlug: string,
    newSlug: string,
    context: Context = {}
  ): Promise<void> {
    if (oldSlug === newSlug) {
      return
    }
    await this.createCmsRedirects(
      [
        {
          from_path: this.storePathForPageSlug(oldSlug),
          to_path: this.storePathForPageSlug(newSlug),
        },
      ],
      context
    )
  }

  async adminCreatePage(input: AdminPageCreateBody): Promise<AdminPageListRow> {
    await this.assertPageSlugAvailableForLocale(input.slug, input.locale, undefined, {})
    const created = await this.createPages([
      {
        slug: input.slug,
        title: input.title,
        page_type: input.page_type,
        status: input.status,
        locale: input.locale,
      },
    ])
    const row = (Array.isArray(created) ? created[0] : created) as CmsPageRecord
    return this.toAdminPageRow(row, {})
  }

  async adminUpdatePage(
    id: string,
    patch: AdminPagePatchBody
  ): Promise<{ page: AdminPageListRow; changed: boolean }> {
    const existingRows = await this.listPages({ id })
    const current = existingRows[0] as CmsPageRecord | undefined
    if (!current) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Page "${id}" not found`)
    }

    const nextSlug = patch.slug ?? current.slug
    const slugChanged = nextSlug !== current.slug

    const payload: Record<string, unknown> = {}
    if (patch.title !== undefined) {
      payload.title = patch.title
    }
    if (patch.slug !== undefined) {
      payload.slug = patch.slug
    }
    if (patch.page_type !== undefined) {
      payload.page_type = patch.page_type
    }
    if (patch.status !== undefined) {
      payload.status = patch.status
    }

    if (Object.keys(payload).length === 0) {
      const page = await this.toAdminPageRow(current, {})
      return { page, changed: false }
    }

    if (slugChanged) {
      await this.assertPageSlugAvailableForLocale(nextSlug, current.locale, id, {})
      const baseRepo = (
        this as unknown as {
          baseRepository_: {
            transaction: <T>(
              task: (transactionManager: unknown) => Promise<T>,
              options?: Record<string, unknown>
            ) => Promise<T>
          }
        }
      ).baseRepository_
      await baseRepo.transaction(async (transactionManager: unknown) => {
        const sharedContext: Context = { transactionManager }
        await this.assertPageSlugAvailableForLocale(
          nextSlug,
          current.locale,
          id,
          sharedContext
        )
        await this.createRedirectFromSlugChange(current.slug, nextSlug, sharedContext)
        await this.updatePages([{ id, ...payload }], sharedContext)
      })
    } else {
      await this.updatePages([{ id, ...payload }])
    }

    const updatedRows = await this.listPages({ id })
    const row = updatedRows[0] as CmsPageRecord
    const page = await this.toAdminPageRow(row, {})
    return { page, changed: true }
  }

  async adminSoftDeletePage(id: string): Promise<void> {
    const existingRows = await this.listPages({ id })
    if (!existingRows.length) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Page "${id}" not found`)
    }
    await this.softDeletePages(id)
  }

  async adminListPages(params: {
    locale: string
    limit: number
    offset: number
  }): Promise<{ pages: AdminPageListRow[]; count: number }> {
    const [rows, count] = await this.listAndCountPages(
      { locale: params.locale },
      {
        skip: params.offset,
        take: params.limit,
        order: { updated_at: "DESC" },
      }
    )
    const pages = await Promise.all(
      (rows as CmsPageRecord[]).map((row) => this.toAdminPageRow(row, {}))
    )
    return { pages, count }
  }

  async adminRetrievePage(id: string): Promise<AdminPageListRow | null> {
    const rows = await this.listPages({ id })
    const row = rows[0] as CmsPageRecord | undefined
    if (!row) {
      return null
    }
    return this.toAdminPageRow(row, {})
  }

  async findPublishedPageForStorefront(
    slug: string,
    locale: string
  ): Promise<StorePublishedPagePayload | null> {
    const rows = await this.listPages({ slug, locale, status: "published" })
    const row = rows[0] as CmsPageRecord | undefined
    if (!row) {
      return null
    }
    return {
      title: row.title,
      slug: row.slug,
      page_type: row.page_type,
      status: row.status,
      blocks: [],
    }
  }
}

export default ContentModuleService
