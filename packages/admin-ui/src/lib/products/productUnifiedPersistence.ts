import type Medusa from "@medusajs/js-sdk"
import { FetchError } from "@medusajs/js-sdk"
import type { AdminProductVariant, ProductStatus } from "@medusajs/types"

import type { ProductPartialUpdatePayload } from "@/components/products/editor/productEditorTypes"
import { ADMIN_PRODUCT_EDITOR_FIELDS } from "@/lib/products/adminProductEditorFields"
import { ADMIN_PRODUCT_DETAIL_FIELDS } from "@/lib/products/adminProductFieldSets"
import {
  buildVariantComboKey,
  DEFAULT_SINGLE_OPTION_TITLE,
  DEFAULT_SINGLE_OPTION_VALUE,
  type ProductOptionRowModel,
} from "@/lib/products/productOptionMatrix"

export type ProductFormPrerequisites = {
  shippingProfileId: string
  primaryStockLocationId: string
  primarySalesChannelId: string | null
}

export function extractMessageFromMedusaError(error: unknown): string {
  if (error instanceof FetchError && error.message.trim() !== "") {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return "Unexpected error while saving the product."
}

export async function fetchProductFormPrerequisites(
  sdk: Medusa,
): Promise<ProductFormPrerequisites> {
  const [profiles, locations, channels] = await Promise.all([
    sdk.admin.shippingProfile.list({ limit: 50 }),
    sdk.admin.stockLocation.list({ limit: 50 }),
    sdk.admin.salesChannel.list({ limit: 50 }),
  ])

  const shippingProfileId = profiles.shipping_profiles?.[0]?.id
  const primaryStockLocationId = locations.stock_locations?.[0]?.id
  const primarySalesChannelId = channels.sales_channels?.[0]?.id ?? null

  if (shippingProfileId === undefined || shippingProfileId === "") {
    throw new FetchError(
      "No shipping profile found. Create one in Medusa before adding products.",
      "Bad Request",
      400,
    )
  }

  if (primaryStockLocationId === undefined || primaryStockLocationId === "") {
    throw new FetchError(
      "No stock location found. Create one in Medusa before managing inventory quantities.",
      "Bad Request",
      400,
    )
  }

  return { shippingProfileId, primaryStockLocationId, primarySalesChannelId }
}

export function readVariantSelections(variant: AdminProductVariant): Record<string, string> {
  const entries: Record<string, string> = {}

  const options = variant.options
  if (Array.isArray(options)) {
    for (const ov of options) {
      const titleCandidate = ov.option?.title ?? ov.option_id
      const title = typeof titleCandidate === "string" ? titleCandidate.trim() : ""

      const valueCandidate = ov.value ?? ""
      const value = typeof valueCandidate === "string" ? valueCandidate.trim() : ""

      if (title !== "" && value !== "") {
        entries[title] = value
      }
    }
  }

  return entries
}

function variantComboKey(variant: AdminProductVariant): string | null {
  const selections = readVariantSelections(variant)
  if (Object.keys(selections).length === 0) {
    return null
  }

  const keys = Object.keys(selections).sort((a, b) => a.localeCompare(b))
  return keys.map((k) => `${k}=${selections[k]}`).join("|")
}

function deriveVariantPayloadTitle(selections: Record<string, string>): string {
  const keys = Object.keys(selections).sort((a, b) => a.localeCompare(b))
  if (
    keys.length === 1 &&
    keys[0] === DEFAULT_SINGLE_OPTION_TITLE &&
    selections[DEFAULT_SINGLE_OPTION_TITLE] === DEFAULT_SINGLE_OPTION_VALUE
  ) {
    return selections[DEFAULT_SINGLE_OPTION_TITLE]
  }

  const parts = keys.map((title) => `${title}: ${selections[title]}`)
  return parts.join(" · ")
}

function medianFirstInventoryItem(variant: AdminProductVariant): string | null {
  const link = variant.inventory_items?.find(
    (row) =>
      typeof row.inventory_item_id === "string" && row.inventory_item_id.trim() !== "",
  )
  if (link?.inventory_item_id) {
    return link.inventory_item_id
  }

  const deep = variant as AdminProductVariant & {
    inventory?: { items?: Array<{ inventory_item_id?: string }> }
  }

  const fromDeep = deep.inventory?.items?.[0]?.inventory_item_id
  return typeof fromDeep === "string" && fromDeep.trim() !== "" ? fromDeep : null
}

async function setInventoryLevelQuantityAtLocation(params: {
  sdk: Medusa
  inventoryItemId: string
  locationId: string
  stockedQuantity: number
}): Promise<void> {
  const levels = await params.sdk.admin.inventoryItem.listLevels(params.inventoryItemId, {
    limit: 50,
  })

  const match = levels.inventory_levels?.find((level) => level.location_id === params.locationId)

  if (
    typeof match?.id === "string" &&
    match.location_id !== undefined &&
    match.inventory_item_id !== undefined
  ) {
    await params.sdk.admin.inventoryItem.batchInventoryItemsLocationLevels({
      update: [
        {
          id: match.id,
          inventory_item_id: params.inventoryItemId,
          location_id: params.locationId,
          stocked_quantity: params.stockedQuantity,
        },
      ],
    })
    return
  }

  await params.sdk.admin.inventoryItem.batchInventoryItemsLocationLevels({
    create: [
      {
        inventory_item_id: params.inventoryItemId,
        location_id: params.locationId,
        stocked_quantity: params.stockedQuantity,
      },
    ],
  })
}

export type PersistVariantEconomics = {
  comboKey: string
  selections: Record<string, string>
  priceMinorUnits: number
  stockQuantity: number
  existingVariantId?: string | null
}

function resolvePersistSelections(row: PersistVariantEconomics): Record<string, string> {
  return Object.keys(row.selections).length > 0
    ? row.selections
    : { [DEFAULT_SINGLE_OPTION_TITLE]: DEFAULT_SINGLE_OPTION_VALUE }
}

/** Aligns persisted stock lookup with {@link variantComboKey} when callers omit comboKey. */
function resolvePersistVariantComboKey(row: PersistVariantEconomics): string {
  if (row.comboKey.trim() !== "") {
    return row.comboKey
  }
  return buildVariantComboKey(resolvePersistSelections(row))
}

export async function persistUnifiedProductCreate(params: {
  sdk: Medusa
  prerequisites: ProductFormPrerequisites
  title: string
  description: string
  status: ProductStatus
  categoryIds: string[]
  /** Full option definitions (excluding empty titles). Defaults row generated upstream when empty. */
  optionRows: ProductOptionRowModel[]
  variants: PersistVariantEconomics[]
}): Promise<{ productId: string }> {
  const optionsPayload =
    params.optionRows.length > 0
      ? params.optionRows.map((row) => ({
          title: row.title.trim(),
          values: row.values,
        }))
      : [
          {
            title: DEFAULT_SINGLE_OPTION_TITLE,
            values: [DEFAULT_SINGLE_OPTION_VALUE],
          },
        ]

  const variantPayloads = params.variants.map((row) => {
    const selections = resolvePersistSelections(row)

    return {
      title: deriveVariantPayloadTitle(selections),
      sku: null,
      manage_inventory: true,
      options: selections,
      prices: [
        {
          currency_code: "dkk",
          amount: row.priceMinorUnits,
        },
      ],
    }
  })

  const { product } = await params.sdk.admin.product.create(
    {
      title: params.title.trim(),
      description: params.description.trim() === "" ? null : params.description.trim(),
      status: params.status,
      shipping_profile_id: params.prerequisites.shippingProfileId,
      categories: params.categoryIds.map((id) => ({ id })),
      sales_channels: params.prerequisites.primarySalesChannelId
        ? [{ id: params.prerequisites.primarySalesChannelId }]
        : undefined,
      options: optionsPayload,
      variants: variantPayloads,
    },
    { fields: ADMIN_PRODUCT_EDITOR_FIELDS },
  )

  if (product?.id === undefined || product.id === "") {
    throw new FetchError("Medusa did not return a product id after create.", "Server Error", 500)
  }

  const hydrated = await params.sdk.admin.product.retrieve(product.id, {
    fields: ADMIN_PRODUCT_EDITOR_FIELDS,
  })

  const variantList = hydrated.product?.variants ?? []
  const stockByKey = new Map(
    params.variants.map((row) => [resolvePersistVariantComboKey(row), row.stockQuantity] as const),
  )

  const stockUpdates: Array<Promise<void>> = []
  for (const variant of variantList) {
    const key = variantComboKey(variant)
    if (key === null) {
      continue
    }

    const quantity = stockByKey.get(key)
    if (quantity === undefined || typeof quantity !== "number") {
      continue
    }

    const inventoryItemId = medianFirstInventoryItem(variant)
    if (inventoryItemId === null) {
      continue
    }

    stockUpdates.push(
      setInventoryLevelQuantityAtLocation({
        sdk: params.sdk,
        inventoryItemId,
        locationId: params.prerequisites.primaryStockLocationId,
        stockedQuantity: quantity,
      }),
    )
  }

  await Promise.all(stockUpdates)

  return { productId: product.id }
}

export async function persistUnifiedProductUpdate(params: {
  sdk: Medusa
  prerequisites: ProductFormPrerequisites
  productId: string
  title: string
  description: string
  status: ProductStatus
  categoryIds: string[]
  optionRows: ProductOptionRowModel[]
  variants: PersistVariantEconomics[]
}): Promise<void> {
  const current = await params.sdk.admin.product.retrieve(params.productId, {
    fields: ADMIN_PRODUCT_EDITOR_FIELDS,
  })

  const optionsUpdatePayload: Array<{
    id: string
    title: string
    values: string[]
  }> = []
  for (const row of params.optionRows) {
    if (
      typeof row.medusaOptionId === "string" &&
      row.medusaOptionId.trim() !== "" &&
      row.title.trim() !== "" &&
      row.values.length > 0
    ) {
      optionsUpdatePayload.push({
        id: row.medusaOptionId.trim(),
        title: row.title.trim(),
        values: row.values,
      })
    }
  }

  await params.sdk.admin.product.update(
    params.productId,
    {
      title: params.title.trim(),
      description: params.description.trim() === "" ? null : params.description.trim(),
      status: params.status,
      categories: params.categoryIds.map((id) => ({ id })),
      ...(optionsUpdatePayload.length > 0 ? { options: optionsUpdatePayload } : {}),
    },
    { fields: ADMIN_PRODUCT_EDITOR_FIELDS },
  )

  const newOptionCreates: Array<Promise<unknown>> = []
  for (const row of params.optionRows) {
    const hasId = typeof row.medusaOptionId === "string" && row.medusaOptionId.trim() !== ""
    if (hasId) {
      continue
    }

    if (row.title.trim() === "" || row.values.length === 0) {
      continue
    }

    newOptionCreates.push(
      params.sdk.admin.product.createOption(
        params.productId,
        {
          title: row.title.trim(),
          values: row.values,
        },
        { fields: ADMIN_PRODUCT_EDITOR_FIELDS },
      ),
    )
  }

  await Promise.all(newOptionCreates)

  const existingVariants = current.product?.variants ?? []
  const desiredKeys = new Set(params.variants.map((row) => resolvePersistVariantComboKey(row)))

  const existingByKey = new Map<string, AdminProductVariant>()
  const existingById = new Map<string, AdminProductVariant>()
  for (const variant of existingVariants) {
    existingById.set(variant.id, variant)
    const key = variantComboKey(variant)
    if (key !== null) {
      existingByKey.set(key, variant)
    }
  }

  const createPayload: Array<{
    title: string
    sku: null
    manage_inventory: true
    options: Record<string, string>
    prices: Array<{ currency_code: string; amount: number }>
  }> = []

  const updatePayload: Array<{
    id: string
    title: string
    manage_inventory: true
    options: Record<string, string>
    prices: Array<{ currency_code: string; amount: number }>
  }> = []

  const deleteIds: string[] = []

  for (const row of params.variants) {
    const selections = resolvePersistSelections(row)
    const mapKey = resolvePersistVariantComboKey(row)

    const resolvedExisting =
      (typeof row.existingVariantId === "string" && row.existingVariantId.trim() !== ""
        ? existingById.get(row.existingVariantId.trim())
        : undefined) ?? existingByKey.get(mapKey)

    if (resolvedExisting !== undefined) {
      updatePayload.push({
        id: resolvedExisting.id,
        title: deriveVariantPayloadTitle(selections),
        manage_inventory: true,
        options: selections,
        prices: [{ currency_code: "dkk", amount: row.priceMinorUnits }],
      })
    } else {
      createPayload.push({
        title: deriveVariantPayloadTitle(selections),
        sku: null,
        manage_inventory: true,
        options: selections,
        prices: [{ currency_code: "dkk", amount: row.priceMinorUnits }],
      })
    }
  }

  for (const variant of existingVariants) {
    const key = variantComboKey(variant)
    if (key !== null && !desiredKeys.has(key)) {
      deleteIds.push(variant.id)
    }
  }

  if (createPayload.length > 0 || updatePayload.length > 0 || deleteIds.length > 0) {
    await params.sdk.admin.product.batchVariants(
      params.productId,
      {
        create: createPayload,
        update: updatePayload,
        delete: deleteIds,
      },
      { fields: ADMIN_PRODUCT_EDITOR_FIELDS },
    )
  }

  const refreshed = await params.sdk.admin.product.retrieve(params.productId, {
    fields: ADMIN_PRODUCT_EDITOR_FIELDS,
  })

  const stockByKey = new Map(
    params.variants.map((row) => [resolvePersistVariantComboKey(row), row.stockQuantity] as const),
  )

  const stockUpdates: Array<Promise<void>> = []
  for (const variant of refreshed.product?.variants ?? []) {
    const key = variantComboKey(variant)
    if (key === null) {
      continue
    }

    const quantity = stockByKey.get(key)
    if (quantity === undefined || typeof quantity !== "number") {
      continue
    }

    const inventoryItemId = medianFirstInventoryItem(variant)
    if (inventoryItemId === null) {
      continue
    }

    stockUpdates.push(
      setInventoryLevelQuantityAtLocation({
        sdk: params.sdk,
        inventoryItemId,
        locationId: params.prerequisites.primaryStockLocationId,
        stockedQuantity: quantity,
      }),
    )
  }

  await Promise.all(stockUpdates)
}

/**
 * Partial product-level update for the unified editor (Overview + Relations).
 * Covers Medusa scalars, organisation, physical attributes, media and metadata.
 * Variants, prices, inventory and per-locale content persist through their own
 * flows — this never touches them.
 */
/**
 * Resolves free-form tag values to Medusa tag ids, creating any that do not yet
 * exist. Medusa attaches tags to a product by id, so the editor's value-based UX
 * is reconciled here.
 */
async function resolveTagIds(sdk: Medusa, values: string[]): Promise<Array<{ id: string }>> {
  const wanted = [...new Set(values.map((value) => value.trim()).filter((value) => value !== ""))]
  if (wanted.length === 0) {
    return []
  }

  const existing = await sdk.admin.productTag.list({ limit: 1000, fields: "id,value" })
  const byValue = new Map<string, string>()
  for (const tag of existing.product_tags ?? []) {
    if (typeof tag.value === "string" && typeof tag.id === "string") {
      byValue.set(tag.value.toLowerCase(), tag.id)
    }
  }

  const resolved: Array<{ id: string }> = []
  for (const value of wanted) {
    const found = byValue.get(value.toLowerCase())
    if (found !== undefined) {
      resolved.push({ id: found })
      continue
    }
    const created = await sdk.admin.productTag.create({ value })
    if (typeof created.product_tag?.id === "string") {
      resolved.push({ id: created.product_tag.id })
    }
  }
  return resolved
}

export async function persistProductPartialUpdate(params: {
  sdk: Medusa
  productId: string
  payload: ProductPartialUpdatePayload
  tagValues: string[]
}): Promise<void> {
  const tags = await resolveTagIds(params.sdk, params.tagValues)
  await params.sdk.admin.product.update(
    params.productId,
    { ...params.payload, tags },
    { fields: ADMIN_PRODUCT_DETAIL_FIELDS },
  )
}

export type VariantDetailFields = {
  title: string
  sku: string | null
  barcode: string | null
  ean: string | null
  upc: string | null
  manageInventory: boolean
  allowBackorder: boolean
  priceMinorUnits: number | null
  weight: number | null
  length: number | null
  height: number | null
  width: number | null
  material: string | null
  hsCode: string | null
  midCode: string | null
  originCountry: string | null
}

/**
 * Deep update of a single variant (identifiers, price, dimensions) plus optional
 * inventory level at the primary stock location. Used by the variant sub-page.
 */
export async function persistVariantDetailUpdate(params: {
  sdk: Medusa
  productId: string
  variantId: string
  primaryStockLocationId: string
  fields: VariantDetailFields
  stockQuantity: number | null
}): Promise<void> {
  const f = params.fields

  type VariantBatchUpdate = {
    id: string
    title: string
    sku: string | null
    barcode: string | null
    ean: string | null
    upc: string | null
    manage_inventory: boolean
    allow_backorder: boolean
    weight: number | null
    length: number | null
    height: number | null
    width: number | null
    material: string | null
    hs_code: string | null
    mid_code: string | null
    origin_country: string | null
    prices?: Array<{ currency_code: string; amount: number }>
  }

  const updateRow: VariantBatchUpdate = {
    id: params.variantId,
    title: f.title.trim(),
    sku: f.sku,
    barcode: f.barcode,
    ean: f.ean,
    upc: f.upc,
    manage_inventory: f.manageInventory,
    allow_backorder: f.allowBackorder,
    weight: f.weight,
    length: f.length,
    height: f.height,
    width: f.width,
    material: f.material,
    hs_code: f.hsCode,
    mid_code: f.midCode,
    origin_country: f.originCountry,
    ...(f.priceMinorUnits !== null
      ? { prices: [{ currency_code: "dkk", amount: f.priceMinorUnits }] }
      : {}),
  }

  await params.sdk.admin.product.batchVariants(
    params.productId,
    { update: [updateRow] },
    { fields: ADMIN_PRODUCT_EDITOR_FIELDS },
  )

  if (!f.manageInventory || params.stockQuantity === null) {
    return
  }

  const refreshed = await params.sdk.admin.product.retrieve(params.productId, {
    fields: ADMIN_PRODUCT_EDITOR_FIELDS,
  })
  const variant = refreshed.product?.variants?.find((row) => row.id === params.variantId)
  if (variant === undefined) {
    return
  }

  const inventoryItemId = medianFirstInventoryItem(variant)
  if (inventoryItemId === null) {
    return
  }

  await setInventoryLevelQuantityAtLocation({
    sdk: params.sdk,
    inventoryItemId,
    locationId: params.primaryStockLocationId,
    stockedQuantity: params.stockQuantity,
  })
}