import { useCallback, useMemo, useRef, useState } from "react"

import type { AdminProductVariant } from "@medusajs/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useToast } from "@/components/ui/Toast"
import {
  extractMessageFromMedusaError,
  persistVariantDetailUpdate,
} from "@/lib/products/productUnifiedPersistence"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"
import { createMercflowMedusaSdk } from "@/medusa-admin/createMercflowMedusaSdk"

export type VariantEditorDraft = {
  title: string
  sku: string
  barcode: string
  ean: string
  upc: string
  priceDkk: string
  manageInventory: boolean
  allowBackorder: boolean
  stock: string
  weight: string
  length: string
  height: string
  width: string
  material: string
  hsCode: string
  midCode: string
  originCountry: string
}

const EMPTY: VariantEditorDraft = {
  title: "",
  sku: "",
  barcode: "",
  ean: "",
  upc: "",
  priceDkk: "",
  manageInventory: true,
  allowBackorder: false,
  stock: "",
  weight: "",
  length: "",
  height: "",
  width: "",
  material: "",
  hsCode: "",
  midCode: "",
  originCountry: "",
}

function str(value: string | null | undefined): string {
  return typeof value === "string" ? value : ""
}

function num(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : ""
}

function dkkFromPrices(variant: AdminProductVariant): string {
  const price = (variant.prices ?? []).find(
    (entry) => entry.currency_code === "dkk" && typeof entry.amount === "number",
  )
  if (price === undefined || typeof price.amount !== "number") {
    return ""
  }
  return String(price.amount / 100)
}

function draftFromVariant(variant: AdminProductVariant): VariantEditorDraft {
  return {
    title: str(variant.title),
    sku: str(variant.sku),
    barcode: str(variant.barcode),
    ean: str(variant.ean),
    upc: str(variant.upc),
    priceDkk: dkkFromPrices(variant),
    manageInventory: variant.manage_inventory !== false,
    allowBackorder: variant.allow_backorder === true,
    stock: typeof variant.inventory_quantity === "number" ? String(variant.inventory_quantity) : "",
    weight: num(variant.weight),
    length: num(variant.length),
    height: num(variant.height),
    width: num(variant.width),
    material: str(variant.material),
    hsCode: str(variant.hs_code),
    midCode: str(variant.mid_code),
    originCountry: str(variant.origin_country),
  }
}

export type VariantEditorController = {
  draft: VariantEditorDraft
  update: (patch: Partial<VariantEditorDraft>) => void
  isDirty: boolean
  isSaving: boolean
  canSave: boolean
  save: () => Promise<void>
  discard: () => void
}

export function useVariantEditor(params: {
  variant: AdminProductVariant | undefined
  productId: string
  variantId: string
  primaryStockLocationId: string | undefined
}): VariantEditorController {
  const sdk = useMemo(() => createMercflowMedusaSdk(), [])
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [draft, setDraft] = useState<VariantEditorDraft>(EMPTY)
  const baselineRef = useRef<VariantEditorDraft>(EMPTY)
  const [baselineFingerprint, setBaselineFingerprint] = useState("")

  const hydrationKey =
    params.variant !== undefined ? `${params.variant.id}:${params.variant.updated_at ?? ""}` : null

  useAdjustStateWhenKeyChanges(hydrationKey, () => {
    if (params.variant === undefined) {
      return
    }
    const next = draftFromVariant(params.variant)
    baselineRef.current = next
    setDraft(next)
    setBaselineFingerprint(JSON.stringify(next))
  })

  const update = useCallback((patch: Partial<VariantEditorDraft>): void => {
    setDraft((previous) => ({ ...previous, ...patch }))
  }, [])

  const isDirty = baselineFingerprint !== "" && JSON.stringify(draft) !== baselineFingerprint
  const canSave = isDirty && draft.title.trim() !== "" && sdk !== null

  const discard = useCallback((): void => {
    setDraft(baselineRef.current)
  }, [])

  const saveMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (sdk === null) {
        throw new Error("Medusa Admin backend URL is not configured for this build.")
      }
      if (params.primaryStockLocationId === undefined) {
        throw new Error("No stock location available to write inventory levels.")
      }

      await persistVariantDetailUpdate({
        sdk,
        productId: params.productId,
        variantId: params.variantId,
        primaryStockLocationId: params.primaryStockLocationId,
        fields: {
          title: draft.title,
          sku: nullable(draft.sku),
          barcode: nullable(draft.barcode),
          ean: nullable(draft.ean),
          upc: nullable(draft.upc),
          manageInventory: draft.manageInventory,
          allowBackorder: draft.allowBackorder,
          priceMinorUnits: parsePrice(draft.priceDkk),
          weight: parseOptional(draft.weight),
          length: parseOptional(draft.length),
          height: parseOptional(draft.height),
          width: parseOptional(draft.width),
          material: nullable(draft.material),
          hsCode: nullable(draft.hsCode),
          midCode: nullable(draft.midCode),
          originCountry: nullable(draft.originCountry),
        },
        stockQuantity: draft.manageInventory ? parseStock(draft.stock) : null,
      })

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-product-detail", params.productId] }),
        queryClient.invalidateQueries({ queryKey: ["variant-detail", params.productId, params.variantId] }),
        queryClient.invalidateQueries({
          predicate: ({ queryKey }) => queryKey[0] === "products-catalog-list",
        }),
      ])
    },
    onSuccess: () => {
      baselineRef.current = draft
      setBaselineFingerprint(JSON.stringify(draft))
      toast({ variant: "success", title: "Variant saved", description: "Changes saved to Medusa." })
    },
    onError: (error: unknown) => {
      toast({ variant: "error", title: "Save failed", description: extractMessageFromMedusaError(error) })
    },
  })

  const save = useCallback(async (): Promise<void> => {
    await saveMutation.mutateAsync()
  }, [saveMutation])

  return {
    draft,
    update,
    isDirty,
    isSaving: saveMutation.isPending,
    canSave,
    save,
    discard,
  }
}

function nullable(value: string): string | null {
  return value.trim() === "" ? null : value.trim()
}

function parseOptional(value: string): number | null {
  const trimmed = value.trim().replace(",", ".")
  if (trimmed === "") {
    return null
  }
  const parsed = Number.parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function parsePrice(value: string): number | null {
  const trimmed = value.trim().replace(",", ".")
  if (trimmed === "") {
    return null
  }
  const major = Number.parseFloat(trimmed)
  return Number.isFinite(major) && major >= 0 ? Math.round(major * 100) : null
}

function parseStock(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === "") {
    return null
  }
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}
