import { useCallback, useMemo, useRef, useState } from "react"
import type { AdminProduct } from "@medusajs/types"
import type { VariantRowModel } from "@/lib/products/productOptionMatrix"
import { hydrateEditorModelsFromAdminProduct } from "@/lib/products/productFormHydration"
import { emptyVariantShippingDraft, type VariantShippingDraft } from "@/lib/products/variantShippingDraft"
import { resolvePersistVariantShipping, type PersistVariantShipping } from "@/lib/products/productUnifiedPersistence"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

type ComboSnapshot = Pick<VariantRowModel, "comboKey" | "selections">

export function useUnifiedCatalogProductShipping(params: {
  derivedCombos: ComboSnapshot[]
  productHydrationKey: string | null
  productEntity: AdminProduct | undefined
  /** Pre-loaded shipping state from keyed edit bootstrap; skips async hydration. */
  shippingBootstrap?: {
    isPhysicalProduct: boolean
    shippingByComboKey: Partial<Record<string, VariantShippingDraft>>
  }
}) {
  const shippingBootstrap = params.shippingBootstrap

  const [isPhysicalProduct, setIsPhysicalProduct] = useState(
    () => shippingBootstrap?.isPhysicalProduct ?? true,
  )
  const [shippingMap, setShippingMap] = useState<
    Partial<Record<string, VariantShippingDraft>>
  >(() => shippingBootstrap?.shippingByComboKey ?? {})
  const hydratedShippingRef = useRef<Partial<Record<string, VariantShippingDraft>>>(
    shippingBootstrap?.shippingByComboKey ?? {},
  )
  const derivedComboKeys = params.derivedCombos.map((c) => c.comboKey).join("\u0000")

  useAdjustStateWhenKeyChanges(derivedComboKeys === "" ? null : derivedComboKeys, () => {
    setShippingMap((prev) => {
      const next: Partial<Record<string, VariantShippingDraft>> = {}
      for (const key of params.derivedCombos.map((c) => c.comboKey)) {
        next[key] = prev[key] ?? hydratedShippingRef.current[key] ?? emptyVariantShippingDraft()
      }
      return next
    })
  })

  useAdjustStateWhenKeyChanges(
    shippingBootstrap === undefined ? params.productHydrationKey : null,
    () => {
      if (!params.productEntity) {
        return
      }
      const hydrated = hydrateEditorModelsFromAdminProduct(params.productEntity)
      setIsPhysicalProduct(hydrated.isPhysicalProduct)
      hydratedShippingRef.current = hydrated.shippingByComboKey
      setShippingMap(hydrated.shippingByComboKey)
    },
  )

  const shippingVariantRowsPreview = useMemo(
    () => params.derivedCombos.map((combo) => ({ comboKey: combo.comboKey, selections: combo.selections, priceDkk: "", stock: "" })),
    [params.derivedCombos],
  )

  const updateShippingRow = useCallback((comboKey: string, patch: Partial<VariantShippingDraft>) => {
    setShippingMap((prev) => ({ ...prev, [comboKey]: { ...(prev[comboKey] ?? emptyVariantShippingDraft()), ...patch } }))
  }, [])

  const applyShippingToAllVariants = useCallback((sourceComboKey: string) => {
    setShippingMap((prev) => {
      const source = prev[sourceComboKey] ?? emptyVariantShippingDraft()
      const next = { ...prev }
      for (const combo of params.derivedCombos) next[combo.comboKey] = { ...source }
      return next
    })
  }, [params.derivedCombos])

  const resolveShippingForCombo = useCallback((comboKey: string): PersistVariantShipping => resolvePersistVariantShipping(shippingMap[comboKey]), [shippingMap])

  return {
    isPhysicalProduct,
    shippingVariantRowsPreview,
    shippingMap,
    setIsPhysicalProduct,
    updateShippingRow,
    applyShippingToAllVariants,
    resolveShippingForCombo,
    requiresShipping: isPhysicalProduct,
  }
}
