import { useCallback, useEffect, useMemo, useState } from "react"

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

export function useProductFormMetafields(params: {
  productId?: string
  selectedCategoryIds: ReadonlySet<string>
  enabled: boolean
}): UseProductFormMetafieldsResult {
  const selectedCategoryKey = [...params.selectedCategoryIds].sort().join(",")
  const hydrationKey =
    params.enabled === true
      ? `${params.productId ?? "new"}:${selectedCategoryKey}`
      : null

  const [loadToken, setLoadToken] = useState(0)
  const [state, setState] = useState<ProductFormMetafieldsLoadState>({ status: "idle" })
  const [expandedSecondaryIds, setExpandedSecondaryIds] = useState<Set<string>>(() => new Set())
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const reload = useCallback((): void => {
    setLoadToken((token) => token + 1)
  }, [])

  useEffect(() => {
    if (!params.enabled) {
      setState({ status: "idle" })
      return
    }

    let cancelled = false
    setState({ status: "loading" })
    setFieldErrors({})

    void (async (): Promise<void> => {
      try {
        const allDefinitions = sortMetafieldDefinitionsByPinned(
          await listMetafieldDefinitions({ ownerType: "product" })
        )

        const categoryMetafieldCountsAll = countDefinitionsByCategory(allDefinitions)

        const productDefinitions = allDefinitions.filter(
          (definition) => definition.category_constraint_id === null
        )

        const selectedIds = [...params.selectedCategoryIds]
        const categoryDefinitionLists = await Promise.all(
          selectedIds.map(async (categoryId) =>
            listMetafieldDefinitions({ ownerType: "product", categoryId })
          )
        )
        const categoryDefinitions = dedupeDefinitionsById(
          sortMetafieldDefinitionsByPinned(categoryDefinitionLists.flat())
        )

        const allApplicable = dedupeDefinitionsById([
          ...productDefinitions,
          ...categoryDefinitions,
        ])

        let values: Awaited<ReturnType<typeof listMetafieldValues>> = []
        if (typeof params.productId === "string" && params.productId.trim() !== "") {
          values = await listMetafieldValues({
            ownerType: "product",
            ownerId: params.productId,
            locale: DEFAULT_LOCALE,
          })
        }

        if (cancelled) {
          return
        }

        const drafts = buildMetafieldDraftsForDefinitions(allApplicable, values)

        setState({
          status: "ready",
          productDefinitions,
          categoryDefinitions,
          categoryMetafieldCountsAll,
          drafts,
          initialDrafts: { ...drafts },
        })
      } catch (error: unknown) {
        if (cancelled) {
          return
        }
        const message =
          error instanceof Error ? error.message : "Failed to load product metafields"
        setState({ status: "error", message })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [params.enabled, params.productId, selectedCategoryKey, loadToken])

  useAdjustStateWhenKeyChanges(hydrationKey, () => {
    setExpandedSecondaryIds(new Set())
    setFieldErrors({})
  })

  const categoryMetafieldCounts = useMemo((): ReadonlyMap<string, number> => {
    if (state.status !== "ready") {
      return new Map()
    }
    return state.categoryMetafieldCountsAll
  }, [state])

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
    setState((current) => {
      if (current.status !== "ready") {
        return current
      }
      return {
        ...current,
        drafts: {
          ...current.drafts,
          [definitionId]: draft,
        },
      }
    })
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
    if (state.status !== "ready") {
      return []
    }
    return dedupeDefinitionsById([...state.productDefinitions, ...state.categoryDefinitions])
  }, [state])

  const validateDrafts = useCallback(():
    | { ok: true }
    | { ok: false; fieldErrors: Record<string, string>; message: string } => {
    if (state.status !== "ready") {
      return { ok: true }
    }

    const definitions = getApplicableDefinitions()
    const nextFieldErrors: Record<string, string> = {}

    for (const definition of definitions) {
      const draft = state.drafts[definition.id] ?? ""
      const initial = state.initialDrafts[definition.id] ?? ""
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
  }, [getApplicableDefinitions, state])

  const buildPayloads = useCallback(
    (productId: string): MetafieldValueUpsertPayload[] => {
      if (state.status !== "ready") {
        return []
      }

      const definitions = getApplicableDefinitions()
      const payloads: MetafieldValueUpsertPayload[] = []

      for (const definition of definitions) {
        const draft = state.drafts[definition.id] ?? ""
        const initial = state.initialDrafts[definition.id] ?? ""
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
    [getApplicableDefinitions, state]
  )

  const markSaved = useCallback((drafts: Record<string, string>): void => {
    setState((current) => {
      if (current.status !== "ready") {
        return current
      }
      return {
        ...current,
        initialDrafts: { ...drafts },
      }
    })
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

      if (state.status === "ready") {
        markSaved(state.drafts)
      }
    },
    [buildPayloads, markSaved, state, validateDrafts]
  )

  return {
    state,
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
