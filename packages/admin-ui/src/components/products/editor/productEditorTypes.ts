import type { AdminProduct, ProductStatus } from "@medusajs/types"

/**
 * Editable product-level state for the unified product page. Variant economics,
 * per-locale content and inventory have their own flows — this draft owns the
 * Medusa-owned product scalars, organisation, media and metadata only.
 */
export type ProductEditorDraft = {
  title: string
  subtitle: string
  handle: string
  description: string
  status: ProductStatus
  discountable: boolean
  collectionId: string | null
  typeId: string | null
  categoryIds: string[]
  tags: string[]
  material: string
  weight: string
  length: string
  height: string
  width: string
  hsCode: string
  midCode: string
  originCountry: string
  /** Ordered product images; the first is treated as primary in the UI. */
  images: Array<{ url: string }>
  /** Explicit thumbnail URL; falls back to the first image when null. */
  thumbnail: string | null
  metadata: Record<string, unknown>
}

/** Structural subset of Medusa's admin product update payload. */
export type ProductPartialUpdatePayload = {
  title?: string
  subtitle?: string | null
  handle?: string
  description?: string | null
  status?: ProductStatus
  discountable?: boolean
  collection_id?: string | null
  type_id?: string | null
  categories?: Array<{ id: string }>
  tags?: Array<{ id: string }>
  material?: string | null
  weight?: number | null
  length?: number | null
  height?: number | null
  width?: number | null
  hs_code?: string | null
  mid_code?: string | null
  origin_country?: string | null
  thumbnail?: string | null
  images?: Array<{ url: string }>
  metadata?: Record<string, unknown>
}

function text(value: string | null | undefined): string {
  return typeof value === "string" ? value : ""
}

function numericText(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : ""
}

export function draftFromAdminProduct(product: AdminProduct): ProductEditorDraft {
  const collection = product.collection_id ?? product.collection?.id ?? null
  const type = product.type_id ?? product.type?.id ?? null

  return {
    title: text(product.title),
    subtitle: text(product.subtitle),
    handle: text(product.handle),
    description: text(product.description),
    status: (product.status as ProductStatus | undefined) ?? "draft",
    discountable: product.discountable !== false,
    collectionId: collection,
    typeId: type,
    categoryIds: (product.categories ?? [])
      .map((category) => category.id)
      .filter((id): id is string => typeof id === "string"),
    tags: (product.tags ?? [])
      .map((tag) => tag.value)
      .filter((value): value is string => typeof value === "string"),
    material: text(product.material),
    weight: numericText(product.weight),
    length: numericText(product.length),
    height: numericText(product.height),
    width: numericText(product.width),
    hsCode: text(product.hs_code),
    midCode: text(product.mid_code),
    originCountry: text(product.origin_country),
    images: (product.images ?? [])
      .map((image) => image.url)
      .filter((url): url is string => typeof url === "string" && url.trim() !== "")
      .map((url) => ({ url })),
    thumbnail: typeof product.thumbnail === "string" ? product.thumbnail : null,
    metadata:
      product.metadata !== null && typeof product.metadata === "object"
        ? { ...(product.metadata as Record<string, unknown>) }
        : {},
  }
}

export function fingerprintDraft(draft: ProductEditorDraft): string {
  return JSON.stringify(draft)
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim().replace(",", ".")
  if (trimmed === "") {
    return null
  }
  const parsed = Number.parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function nullableText(value: string): string | null {
  return value.trim() === "" ? null : value.trim()
}

export function buildProductUpdatePayload(draft: ProductEditorDraft): ProductPartialUpdatePayload {
  return {
    title: draft.title.trim(),
    subtitle: nullableText(draft.subtitle),
    handle: draft.handle.trim(),
    description: nullableText(draft.description),
    status: draft.status,
    discountable: draft.discountable,
    collection_id: draft.collectionId,
    type_id: draft.typeId,
    categories: draft.categoryIds.map((id) => ({ id })),
    material: nullableText(draft.material),
    weight: parseOptionalNumber(draft.weight),
    length: parseOptionalNumber(draft.length),
    height: parseOptionalNumber(draft.height),
    width: parseOptionalNumber(draft.width),
    hs_code: nullableText(draft.hsCode),
    mid_code: nullableText(draft.midCode),
    origin_country: nullableText(draft.originCountry),
    thumbnail: draft.thumbnail,
    images: draft.images.map((image) => ({ url: image.url })),
    metadata: draft.metadata,
  }
}
