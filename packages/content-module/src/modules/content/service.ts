import { MedusaService } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import {
  getDescriptionForLocale,
  getLocaleString,
  parseDescriptionRichMap,
  parseLocaleStringField,
  serializeDescriptionRichMap,
  serializeLocaleStringMap,
  setDescriptionForLocale,
  setLocaleString,
} from "./locale-maps"
import { CategoryContent } from "./models/category-content"
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

class ContentModuleService extends MedusaService({
  ProductContent,
  CategoryContent,
}) {
  private assertSeoDescriptionLength(value: string | null | undefined): void {
    if (value != null && value.length > SEO_DESCRIPTION_MAX) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `seo_description must not exceed ${SEO_DESCRIPTION_MAX} characters`
      )
    }
  }

  async retrieveProductContentForLocale(
    productId: string,
    locale: string
  ): Promise<ResolvedProductContent | null> {
    const rows = await this.listProductContents({ product_id: productId })
    const row = rows[0]
    if (!row) {
      return null
    }
    return this.resolveProductRow(row, locale)
  }

  async upsertProductContent(
    productId: string,
    locale: string,
    data: UpsertProductContentInput
  ): Promise<ResolvedProductContent> {
    this.assertSeoDescriptionLength(data.seo_description ?? null)

    const rows = await this.listProductContents({ product_id: productId })
    const existing = rows[0]

    const descMap = parseDescriptionRichMap(existing?.description_rich)
    const titleMap = parseLocaleStringField(existing?.seo_title)
    const seoDescMap = parseLocaleStringField(existing?.seo_description)

    let nextDesc = descMap
    if (data.description_rich !== undefined) {
      nextDesc = setDescriptionForLocale(descMap, locale, data.description_rich)
    }

    let nextTitle = titleMap
    if (data.seo_title !== undefined) {
      nextTitle = setLocaleString(titleMap, locale, data.seo_title)
    }

    let nextSeoDesc = seoDescMap
    if (data.seo_description !== undefined) {
      nextSeoDesc = setLocaleString(seoDescMap, locale, data.seo_description)
    }

    const payload: Partial<ProductContentRecord> = {
      description_rich: serializeDescriptionRichMap(nextDesc),
      seo_title: serializeLocaleStringMap(nextTitle),
      seo_description: serializeLocaleStringMap(nextSeoDesc),
    }

    if (data.seo_og_image_id !== undefined) {
      payload.seo_og_image_id = data.seo_og_image_id
    }
    if (data.media_gallery !== undefined) {
      payload.media_gallery = data.media_gallery
    }

    let row: ProductContentRecord
    if (!existing) {
      const created = await this.createProductContents({
        product_id: productId,
        description_rich: payload.description_rich ?? null,
        seo_title: payload.seo_title ?? null,
        seo_description: payload.seo_description ?? null,
        seo_og_image_id: payload.seo_og_image_id ?? null,
        media_gallery: payload.media_gallery ?? null,
      })
      row = Array.isArray(created) ? (created[0] as ProductContentRecord) : created
    } else {
      const updated = await this.updateProductContents({
        id: existing.id,
        ...payload,
      })
      row = Array.isArray(updated) ? (updated[0] as ProductContentRecord) : updated
    }

    return this.resolveProductRow(row, locale)
  }

  private resolveProductRow(
    row: ProductContentRecord,
    locale: string
  ): ResolvedProductContent {
    const descMap = parseDescriptionRichMap(row.description_rich)
    const titleMap = parseLocaleStringField(row.seo_title)
    const seoDescMap = parseLocaleStringField(row.seo_description)

    return {
      id: row.id,
      product_id: row.product_id,
      locale,
      description_rich: getDescriptionForLocale(descMap, locale) ?? null,
      seo_title: getLocaleString(titleMap, locale),
      seo_description: getLocaleString(seoDescMap, locale),
      seo_og_image_id: row.seo_og_image_id,
      media_gallery: row.media_gallery,
    }
  }

  async retrieveCategoryContentForLocale(
    categoryId: string,
    locale: string
  ): Promise<ResolvedCategoryContent | null> {
    const rows = await this.listCategoryContents({ category_id: categoryId })
    const row = rows[0]
    if (!row) {
      return null
    }
    return this.resolveCategoryRow(row, locale)
  }

  async upsertCategoryContent(
    categoryId: string,
    locale: string,
    data: UpsertCategoryContentInput
  ): Promise<ResolvedCategoryContent> {
    this.assertSeoDescriptionLength(data.seo_description ?? null)

    const rows = await this.listCategoryContents({ category_id: categoryId })
    const existing = rows[0]

    const descMap = parseDescriptionRichMap(existing?.description_rich)
    const titleMap = parseLocaleStringField(existing?.seo_title)
    const seoDescMap = parseLocaleStringField(existing?.seo_description)

    let nextDesc = descMap
    if (data.description_rich !== undefined) {
      nextDesc = setDescriptionForLocale(descMap, locale, data.description_rich)
    }

    let nextTitle = titleMap
    if (data.seo_title !== undefined) {
      nextTitle = setLocaleString(titleMap, locale, data.seo_title)
    }

    let nextSeoDesc = seoDescMap
    if (data.seo_description !== undefined) {
      nextSeoDesc = setLocaleString(seoDescMap, locale, data.seo_description)
    }

    const payload: Partial<CategoryContentRecord> = {
      description_rich: serializeDescriptionRichMap(nextDesc),
      seo_title: serializeLocaleStringMap(nextTitle),
      seo_description: serializeLocaleStringMap(nextSeoDesc),
    }

    if (data.seo_og_image_id !== undefined) {
      payload.seo_og_image_id = data.seo_og_image_id
    }
    if (data.banner_image_id !== undefined) {
      payload.banner_image_id = data.banner_image_id
    }

    let row: CategoryContentRecord
    if (!existing) {
      const created = await this.createCategoryContents({
        category_id: categoryId,
        description_rich: payload.description_rich ?? null,
        seo_title: payload.seo_title ?? null,
        seo_description: payload.seo_description ?? null,
        seo_og_image_id: payload.seo_og_image_id ?? null,
        banner_image_id: payload.banner_image_id ?? null,
      })
      row = Array.isArray(created)
        ? (created[0] as CategoryContentRecord)
        : created
    } else {
      const updated = await this.updateCategoryContents({
        id: existing.id,
        ...payload,
      })
      row = Array.isArray(updated) ? (updated[0] as CategoryContentRecord) : updated
    }

    return this.resolveCategoryRow(row, locale)
  }

  private resolveCategoryRow(
    row: CategoryContentRecord,
    locale: string
  ): ResolvedCategoryContent {
    const descMap = parseDescriptionRichMap(row.description_rich)
    const titleMap = parseLocaleStringField(row.seo_title)
    const seoDescMap = parseLocaleStringField(row.seo_description)

    return {
      id: row.id,
      category_id: row.category_id,
      locale,
      description_rich: getDescriptionForLocale(descMap, locale) ?? null,
      seo_title: getLocaleString(titleMap, locale),
      seo_description: getLocaleString(seoDescMap, locale),
      seo_og_image_id: row.seo_og_image_id,
      banner_image_id: row.banner_image_id,
    }
  }
}

export default ContentModuleService
