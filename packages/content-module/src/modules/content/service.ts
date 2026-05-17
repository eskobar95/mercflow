import { MedusaService } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

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
  CategoryContentRecord,
  ProductContentRecord,
  ResolvedCategoryContent,
  ResolvedProductContent,
  UpsertCategoryContentInput,
  UpsertProductContentInput,
} from "./types"

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
      "description_rich must be a JSON object when provided"
    )
  }

  async retrieveProductContentForLocale(
    productId: string,
    locale: string
  ): Promise<ResolvedProductContent | null> {
    const rows = await this.listProductContents({
      product_id: productId,
      locale,
    })
    const row = rows[0]
    if (!row) {
      return null
    }
    return this.resolveProductRow(row as ProductContentRecord)
  }

  async upsertProductContent(
    productId: string,
    locale: string,
    data: UpsertProductContentInput
  ): Promise<ResolvedProductContent> {
    this.assertSeoDescriptionLength(data.seo_description ?? null)
    this.assertSeoTitleLength(data.seo_title ?? null)

    const rows = await this.listProductContents({
      product_id: productId,
      locale,
    })
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

    let row: ProductContentRecord
    if (!existing) {
      const created = await this.createProductContents({
        product_id: productId,
        locale,
        body_json: payload.body_json ?? null,
        seo_title: payload.seo_title ?? null,
        seo_description: payload.seo_description ?? null,
        og_image_url: payload.og_image_url ?? null,
      })
      row = Array.isArray(created)
        ? (created[0] as ProductContentRecord)
        : (created as ProductContentRecord)
    } else {
      const updated = await this.updateProductContents({
        id: existing.id,
        ...payload,
      })
      row = Array.isArray(updated)
        ? (updated[0] as ProductContentRecord)
        : (updated as ProductContentRecord)
    }

    return this.resolveProductRow(row)
  }

  private resolveProductRow(row: ProductContentRecord): ResolvedProductContent {
    return {
      id: row.id,
      product_id: row.product_id,
      locale: row.locale,
      description_rich: row.body_json,
      seo_title: row.seo_title,
      seo_description: row.seo_description,
      seo_og_image_id: row.og_image_url,
      media_gallery: null,
    }
  }

  async retrieveCategoryContentForLocale(
    categoryId: string,
    locale: string
  ): Promise<ResolvedCategoryContent | null> {
    const rows = await this.listCategoryContents({
      category_id: categoryId,
      locale,
    })
    const row = rows[0]
    if (!row) {
      return null
    }
    return this.resolveCategoryRow(row as CategoryContentRecord)
  }

  async upsertCategoryContent(
    categoryId: string,
    locale: string,
    data: UpsertCategoryContentInput
  ): Promise<ResolvedCategoryContent> {
    this.assertSeoDescriptionLength(data.seo_description ?? null)
    this.assertSeoTitleLength(data.seo_title ?? null)

    const rows = await this.listCategoryContents({
      category_id: categoryId,
      locale,
    })
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

    let row: CategoryContentRecord
    if (!existing) {
      const created = await this.createCategoryContents({
        category_id: categoryId,
        locale,
        body_json: payload.body_json ?? null,
        seo_title: payload.seo_title ?? null,
        seo_description: payload.seo_description ?? null,
        og_image_url: payload.og_image_url ?? null,
        banner_image_url: payload.banner_image_url ?? null,
      })
      row = Array.isArray(created)
        ? (created[0] as CategoryContentRecord)
        : (created as CategoryContentRecord)
    } else {
      const updated = await this.updateCategoryContents({
        id: existing.id,
        ...payload,
      })
      row = Array.isArray(updated)
        ? (updated[0] as CategoryContentRecord)
        : (updated as CategoryContentRecord)
    }

    return this.resolveCategoryRow(row)
  }

  private resolveCategoryRow(
    row: CategoryContentRecord
  ): ResolvedCategoryContent {
    return {
      id: row.id,
      category_id: row.category_id,
      locale: row.locale,
      description_rich: row.body_json,
      seo_title: row.seo_title,
      seo_description: row.seo_description,
      seo_og_image_id: row.og_image_url,
      banner_image_id: row.banner_image_url,
    }
  }
}

export default ContentModuleService
