import { useQuery } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"

import { listMetafieldDefinitions } from "@/features/metafields/metafieldDefinitionsApi"
import {
  buildMetafieldDraftsForDefinitions,
  parseMetafieldDraftValue,
  sortMetafieldDefinitionsByPinned,
} from "@/features/metafields/metafieldValueForm"
import {
  batchUpsertMetafieldValues,
  listMetafieldValues,
} from "@/features/metafields/metafieldValuesApi"
import type { MetafieldDefinitionDto, MetafieldValueUpsertPayload } from "@/features/metafields/types"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

const DEFAULT_LOCALE = "en"

type ProductFormMetafieldsData = {
  productDefinitions: MetafieldDefinitionDto[]
  categoryDefinitions: MetafieldDefinitionDto[]
  categoryMetafieldCountsAll: ReadonlyMap<string, number>
  initialDrafts: Record<string, string>
}

type ProductFormMetafieldsLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready"
      productDefinitions: MetafieldDefinitionDto[]
      categoryDefinitions: MetafieldDefinitionDto[]
      categoryMetafieldCountsAll: ReadonlyMap<string, number>
      drafts: Record<string, string>
      initialDrafts: Record<string, string>
    }

export type UseProductFormMetafieldsResult = {
  state: ProductFormMetafieldsLoadState
  isDirty: boolean
  categoryMetafieldCounts: ReadonlyMap<string, number>
  expandedSecondaryIds: ReadonlySet<string>
  fieldErrors: Record<string, string>
  toggleSecondaryExpanded: (definitionId: string) => void
  setDraft: (definitionId: string, draft: string) => void
  reload: () => void
  validateDrafts: () =>
    | { ok: true }
    | { ok: false; fieldErrors: Record<string, string>; message: string }
  buildPayloads: (productId: string) => MetafieldValueUpsertPayload[]
  markSaved: (drafts: Record<string, string>) => void
  persist: (productId: string) => Promise<void>
}

function dedupeDefinitionsById(
  definitions: readonly MetafieldDefinitionDto[]
): MetafieldDefinitionDto[] {
  const seen = new Set<string>()
  const result: MetafieldDefinitionDto[] = []
  for (const definition of definitions) {
    if (seen.has(definition.id)) {
      continue
    }
    seen.add(definition.id)
    result.push(definition)
  }
  return result
}

function countDefinitionsByCategory(
  definitions: readonly MetafieldDefinitionDto[]
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const definition of definitions) {
    if (definition.category_constraint_id === null) {
      continue
    }
    const current = counts.get(definition.category_constraint_id) ?? 0
    counts.set(definition.category_constraint_id, current + 1)
  }
  return counts
}

async function fetchProductFormMetafieldsData(params: {
  productId?: string
  selectedCategoryIds: readonly string[]
}): Promise<ProductFormMetafieldsData> {
  const allDefinitions = sortMetafieldDefinitionsByPinned(
    await listMetafieldDefinitions({ ownerType: "product" })
  )

  const categoryMetafieldCountsAll = countDefinitionsByCategory(allDefinitions)

  const productDefinitions = allDefinitions.filter(
    (definition) => definition.category_constraint_id === null
  )

  const categoryDefinitionLists = await Promise.all(
    params.selectedCategoryIds.map(async (categoryId) =>
      listMetafieldDefinitions({ ownerType: "product", categoryId })
    )
  )
  const categoryDefinitions = dedupeDefinitionsById(
    sortMetafieldDefinitionsByPinned(categoryDefinitionLists.flat())
  )

  const allApplicable = dedupeDefinitionsById([...productDefinitions, ...categoryDefinitions])

  let values: Awaited<ReturnType<typeof listMetafieldValues>> = []
  if (typeof params.productId === "string" && params.productId.trim() !== "") {
    values = await listMetafieldValues({
      ownerType: "product",
      ownerId: params.productId,
      locale: DEFAULT_LOCALE,
    })
  }

  const initialDrafts = buildMetafieldDraftsForDefinitions(allApplicable, values)

  return {
    productDefinitions,
    categoryDefinitions,
    categoryMetafieldCountsAll,
    initialDrafts,
  }
}

export function useProductFormMetafields(params: {
  productId?: string
  selectedCategoryIds: ReadonlySet<string>
  enabled: boolean
}): UseProductFormMetafieldsResult {
  const selectedCategoryIds = useMemo(
    () => [...params.selectedCategoryIds].sort(),
    [params.selectedCategoryIds]
  )
  const selectedCategoryKey = selectedCategoryIds.join(",")
  const hydrationKey =
    params.enabled === true ? `${params.productId ?? "new"}:${selectedCategoryKey}` : null

  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    enabled: params.enabled,
    queryKey: ["product-form-metafields", params.productId ?? "new", selectedCategoryKey],
    queryFn: async (): Promise<ProductFormMetafieldsData> =>
      fetchProductFormMetafieldsData({
        productId: params.productId,
        selectedCategoryIds,
      }),
  })

  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [initialDrafts, setInitialDrafts] = useState<Record<string, string>>({})
  const [expandedSecondaryIds, setExpandedSecondaryIds] = useState<Set<string>>(() => new Set())
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useAdjustStateWhenKeyChanges(hydrationKey, () => {
    setExpandedSecondaryIds(new Set())
    setFieldErrors({})
  })

  const draftSyncKey =
    data === undefined ? null : `${hydrationKey}:${JSON.stringify(data.initialDrafts)}`

  useAdjustStateWhenKeyChanges(draftSyncKey, () => {
    if (data !== undefined) {
      setDrafts(data.initialDrafts)
      setInitialDrafts(data.initialDrafts)
    }
  })

  const reload = useCallback((): void => {
    void refetch()
  }, [refetch])

  const state = useMemo((): ProductFormMetafieldsLoadState => {
    if (!params.enabled) {
      return { status: "idle" }
    }
    if (isLoading || isFetching) {
      return { status: "loading" }
    }
    if (error instanceof Error) {
      return { status: "error", message: error.message }
    }
    if (error !== null && error !== undefined) {
      return { status: "error", message: "Failed to load product metafields" }
    }
    if (data === undefined) {
      return { status: "loading" }
    }
    return {
      status: "ready",
      productDefinitions: data.productDefinitions,
      categoryDefinitions: data.categoryDefinitions,
      categoryMetafieldCountsAll: data.categoryMetafieldCountsAll,
      drafts,
      initialDrafts,
    }
  }, [data, drafts, error, initialDrafts, isFetching, isLoading, params.enabled])

  const categoryMetafieldCounts = useMemo((): ReadonlyMap<string, number> => {
    return data?.categoryMetafieldCountsAll ?? new Map()
  }, [data])

  const isDirty = useMemo((): boolean => {
    if (state.status !== "ready") {
      return false
    }

    const draftKeys = new Set([...Object.keys(drafts), ...Object.keys(initialDrafts)])
    for (const key of draftKeys) {
      if ((drafts[key] ?? "") !== (initialDrafts[key] ?? "")) {
        return true
      }
    }

    return false
  }, [drafts, initialDrafts, state.status])

  const toggleSecondaryExpanded = useCallback((definitionId: string): void => {
    setExpandedSecondaryIds((previous) => {
      const next = new Set(previous)
      if (next.has(definitionId)) {
        next.delete(definitionId)
      } else {
        next.add(definitionId)
      }
      return next
    })
  }, [])

  const setDraft = useCallback((definitionId: string, draft: string): void => {
    setDrafts((previous) => ({
      ...previous,
      [definitionId]: draft,
    }))
    setFieldErrors((previous) => {
      if (!(definitionId in previous)) {
        return previous
      }
      const next = { ...previous }
      delete next[definitionId]
      return next
    })
  }, [])

  const getApplicableDefinitions = useCallback((): MetafieldDefinitionDto[] => {
    if (data === undefined) {
      return []
    }
    return dedupeDefinitionsById([...data.productDefinitions, ...data.categoryDefinitions])
  }, [data])

  const validateDrafts = useCallback(():
    | { ok: true }
    | { ok: false; fieldErrors: Record<string, string>; message: string } => {
    if (data === undefined) {
      return { ok: true }
    }

    const definitions = getApplicableDefinitions()
    const nextFieldErrors: Record<string, string> = {}

    for (const definition of definitions) {
      const draft = drafts[definition.id] ?? ""
      const initial = initialDrafts[definition.id] ?? ""
      if (draft === initial) {
        continue
      }

      if (definition.is_required && draft.trim() === "") {
        nextFieldErrors[definition.id] = `${definition.name} is required`
        continue
      }

      if (draft.trim() === "") {
        continue
      }

      const parsed = parseMetafieldDraftValue(definition.type, draft)
      if (!parsed.ok) {
        nextFieldErrors[definition.id] = parsed.message
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      return {
        ok: false,
        fieldErrors: nextFieldErrors,
        message: "Fix metafield validation errors before saving.",
      }
    }

    return { ok: true }
  }, [data, drafts, getApplicableDefinitions, initialDrafts])

  const buildPayloads = useCallback(
    (productId: string): MetafieldValueUpsertPayload[] => {
      if (data === undefined) {
        return []
      }

      const definitions = getApplicableDefinitions()
      const payloads: MetafieldValueUpsertPayload[] = []

      for (const definition of definitions) {
        const draft = drafts[definition.id] ?? ""
        const initial = initialDrafts[definition.id] ?? ""
        if (draft === initial || draft.trim() === "") {
          continue
        }

        const parsed = parseMetafieldDraftValue(definition.type, draft)
        if (!parsed.ok) {
          continue
        }

        payloads.push({
          definition_id: definition.id,
          owner_id: productId,
          owner_type: "product",
          locale: DEFAULT_LOCALE,
          value: parsed.value,
        })
      }

      return payloads
    },
    [data, drafts, getApplicableDefinitions, initialDrafts]
  )

  const markSaved = useCallback((nextDrafts: Record<string, string>): void => {
    setInitialDrafts({ ...nextDrafts })
    setFieldErrors({})
  }, [])

  const persist = useCallback(
    async (productId: string): Promise<void> => {
      const validation = validateDrafts()
      if (!validation.ok) {
        throw new Error(validation.message)
      }

      const payloads = buildPayloads(productId)
      await batchUpsertMetafieldValues(payloads)
      markSaved(drafts)
    },
    [buildPayloads, drafts, markSaved, validateDrafts]
  )

  return {
    state,
    isDirty,
    categoryMetafieldCounts,
    expandedSecondaryIds,
    fieldErrors,
    toggleSecondaryExpanded,
    setDraft,
    reload,
    validateDrafts,
    buildPayloads,
    markSaved,
    persist,
  }
}
