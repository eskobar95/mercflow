import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/utils"
import {
  buildAbsoluteLoc,
  categoryPath,
  loadSitemapCatalog,
  productPath,
} from "./catalog-loader"
import { pagePublicPathFromSlug } from "./utils/paths"
import { buildSitemapXml } from "./sitemap-xml"
import type SeoModuleService from "./service"
import type {
  MercflowSitemapConfigRecord,
  SitemapPageType,
  SitemapPageTypeSetting,
  SitemapPageTypeSettings,
  SitemapUrlEntry,
} from "./sitemap-types"

const DEFAULT_PAGE_TYPE_SETTINGS: SitemapPageTypeSettings = {
  product: { priority: 0.8, changefreq: "weekly" },
  category: { priority: 0.6, changefreq: "weekly" },
  page: { priority: 0.5, changefreq: "monthly" },
}

function settingForType(
  settings: SitemapPageTypeSettings,
  pageType: SitemapPageType
): SitemapPageTypeSetting {
  return settings[pageType] ?? DEFAULT_PAGE_TYPE_SETTINGS[pageType]!
}

function productExcluded(
  product: { id: string; category_ids: string[] },
  config: MercflowSitemapConfigRecord
): boolean {
  if (config.excluded_product_ids.includes(product.id)) {
    return true
  }
  for (const categoryId of product.category_ids) {
    if (config.excluded_category_ids.includes(categoryId)) {
      return true
    }
  }
  return false
}

export type SitemapGeneratorDeps = {
  seoService: SeoModuleService
  scope: MedusaContainer
}

export class SitemapGeneratorService {
  constructor(private readonly deps: SitemapGeneratorDeps) {}

  async generate(storeId: string): Promise<string> {
    const seoConfig = await this.deps.seoService.getSeoConfig(storeId)
    if (!seoConfig?.storefront_url) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Sitemap is not configured for this store (missing storefront_url)"
      )
    }
    const storefrontUrl = seoConfig.storefront_url
    const sitemapConfig = await this.deps.seoService.getOrCreateSitemapConfig(storeId)
    const settings = {
      ...DEFAULT_PAGE_TYPE_SETTINGS,
      ...sitemapConfig.page_type_settings,
    }

    const catalog = await loadSitemapCatalog(this.deps.scope, storeId)
    const entries: SitemapUrlEntry[] = []

    for (const product of catalog.products) {
      if (productExcluded(product, sitemapConfig)) {
        continue
      }
      const typeSetting = settingForType(settings, "product")
      entries.push({
        loc: buildAbsoluteLoc(storefrontUrl, productPath(product.handle)),
        lastmod: product.updated_at ?? undefined,
        changefreq: typeSetting.changefreq,
        priority: typeSetting.priority,
      })
    }

    for (const category of catalog.categories) {
      if (sitemapConfig.excluded_category_ids.includes(category.id)) {
        continue
      }
      const typeSetting = settingForType(settings, "category")
      entries.push({
        loc: buildAbsoluteLoc(storefrontUrl, categoryPath(category.handle)),
        lastmod: category.updated_at ?? undefined,
        changefreq: typeSetting.changefreq,
        priority: typeSetting.priority,
      })
    }

    for (const page of catalog.pages) {
      if (sitemapConfig.excluded_page_ids.includes(page.id)) {
        continue
      }
      const typeSetting = settingForType(settings, "page")
      entries.push({
        loc: buildAbsoluteLoc(
          storefrontUrl,
          pagePublicPathFromSlug(page.slug, page.locale)
        ),
        lastmod: page.updated_at ?? undefined,
        changefreq: typeSetting.changefreq,
        priority: typeSetting.priority,
      })
    }

    return buildSitemapXml(entries)
  }
}

export function createSitemapGeneratorFromScope(
  scope: MedusaContainer,
  seoService: SeoModuleService
): SitemapGeneratorService {
  return new SitemapGeneratorService({ seoService, scope })
}
