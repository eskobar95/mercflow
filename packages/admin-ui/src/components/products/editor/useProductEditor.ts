import { useCallback, useMemo, useRef, useState } from "react"

import type { AdminProduct } from "@medusajs/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  buildProductUpdatePayload,
  draftFromAdminProduct,
  fingerprintDraft,
  type ProductEditorDraft,
} from "@/components/products/editor/productEditorTypes"
import { useToast } from "@/components/ui/Toast"
import {
  extractMessageFromMedusaError,
  persistProductPartialUpdate,
} from "@/lib/products/productUnifiedPersistence"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"
import { createMercflowMedusaSdk } from "@/medusa-admin/createMercflowMedusaSdk"

const EMPTY_DRAFT: ProductEditorDraft = {
  title: "",
  subtitle: "",
  handle: "",
  description: "",
  status: "draft",
  discountable: true,
  collectionId: null,
  typeId: null,
  categoryIds: [],
  tags: [],
  material: "",
  weight: "",
  length: "",
  height: "",
  width: "",
  hsCode: "",
  midCode: "",
  originCountry: "",
  images: [],
  thumbnail: null,
  metadata: {},
}

export type ProductEditorController = {
  draft: ProductEditorDraft
  update: (patch: Partial<ProductEditorDraft>) => void
  setMetadata: (metadata: Record<string, unknown>) => void
  isDirty: boolean
  isSaving: boolean
  canSave: boolean
  save: () => Promise<void>
  discard: () => void
}

export function useProductEditor(params: {
  product: AdminProduct | undefined
  productId: string
}): ProductEditorController {
  const sdk = useMemo(() => createMercflowMedusaSdk(), [])
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [draft, setDraft] = useState<ProductEditorDraft>(EMPTY_DRAFT)
  const baselineRef = useRef<ProductEditorDraft>(EMPTY_DRAFT)
  const [baselineFingerprint, setBaselineFingerprint] = useState("")

  const hydrationKey =
    params.product !== undefined ? `${params.product.id}:${params.product.updated_at ?? ""}` : null

  useAdjustStateWhenKeyChanges(hydrationKey, () => {
    if (params.product === undefined) {
      return
    }
    const next = draftFromAdminProduct(params.product)
    baselineRef.current = next
    setDraft(next)
    setBaselineFingerprint(fingerprintDraft(next))
  })

  const update = useCallback((patch: Partial<ProductEditorDraft>): void => {
    setDraft((previous) => ({ ...previous, ...patch }))
  }, [])

  const setMetadata = useCallback((metadata: Record<string, unknown>): void => {
    setDraft((previous) => ({ ...previous, metadata }))
  }, [])

  const isDirty = baselineFingerprint !== "" && fingerprintDraft(draft) !== baselineFingerprint
  const canSave = isDirty && draft.title.trim() !== "" && sdk !== null

  const discard = useCallback((): void => {
    setDraft(baselineRef.current)
  }, [])

  const saveMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (sdk === null) {
        throw new Error("Medusa Admin backend URL is not configured for this build.")
      }
      await persistProductPartialUpdate({
        sdk,
        productId: params.productId,
        payload: buildProductUpdatePayload(draft),
        tagValues: draft.tags,
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-product-detail", params.productId] }),
        queryClient.invalidateQueries({
          predicate: ({ queryKey }) => queryKey[0] === "products-catalog-list",
        }),
      ])
    },
    onSuccess: () => {
      baselineRef.current = draft
      setBaselineFingerprint(fingerprintDraft(draft))
      toast({ variant: "success", title: "Product saved", description: "Changes saved to Medusa." })
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
    setMetadata,
    isDirty,
    isSaving: saveMutation.isPending,
    canSave,
    save,
    discard,
  }
}
