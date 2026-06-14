import { useCallback, useEffect, useMemo, useState } from "react"

import { useAdjustStateWhenSnapshotChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

import { listMetafieldDefinitions } from "@/features/metafields/metafieldDefinitionsApi"
import {
  metafieldValueToDraftString,
  parseMetafieldDraftValue,
  sortMetafieldDefinitionsByPinned,
} from "@/features/metafields/metafieldValueForm"
import {
  batchUpsertMetafieldValues,
  listMetafieldValues,
} from "@/features/metafields/metafieldValuesApi"
import type { MetafieldDefinitionDto } from "@/features/metafields/types"

type CategoryMetafieldsLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready"
      definitions: MetafieldDefinitionDto[]
      drafts: Record<string, string>
      initialDrafts: Record<string, string>
    }

export type UseCategoryMetafieldsResult = {
  state: CategoryMetafieldsLoadState
  saving: boolean
  saveError: string | null
  saveMessage: string | null
  isDirty: boolean
  reload: () => void
  setDraft: (definitionId: string, draft: string) => void
  save: () => Promise<boolean>
}

const DEFAULT_LOCALE = "en"

function buildDraftsForDefinitions(
  definitions: readonly MetafieldDefinitionDto[],
  values: ReadonlyArray<{ namespace: string; key: string; value: unknown }>
): Record<string, string> {
  const drafts: Record<string, string> = {}
  for (const definition of definitions) {
    const matched = values.find(
      (row) => row.namespace === definition.namespace && row.key === definition.key
    )
    drafts[definition.id] = metafieldValueToDraftString(definition.type, matched?.value)
  }
  return drafts
}

export function useCategoryMetafields(categoryId: string): UseCategoryMetafieldsResult {
  const [loadToken, setLoadToken] = useState(0)
  const [state, setState] = useState<CategoryMetafieldsLoadState>({ status: "idle" })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const reload = useCallback((): void => {
    setLoadToken((token) => token + 1)
  }, [])

  useAdjustStateWhenSnapshotChanges([categoryId, loadToken], () => {
    setState({ status: "loading" })
    setSaveError(null)
    setSaveMessage(null)
  })

  useEffect(() => {
    let cancelled = false

    void (async (): Promise<void> => {
      try {
        const [definitions, values] = await Promise.all([
          listMetafieldDefinitions({ ownerType: "category" }),
          listMetafieldValues({
            ownerType: "category",
            ownerId: categoryId,
            locale: DEFAULT_LOCALE,
          }),
        ])

        if (cancelled) {
          return
        }

        const sorted = sortMetafieldDefinitionsByPinned(definitions)
        const drafts = buildDraftsForDefinitions(sorted, values)

        setState({
          status: "ready",
          definitions: sorted,
          drafts,
          initialDrafts: { ...drafts },
        })
      } catch (error: unknown) {
        if (cancelled) {
          return
        }
        const message = error instanceof Error ? error.message : "Failed to load category metafields"
        setState({ status: "error", message })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [categoryId, loadToken])

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
    setSaveMessage(null)
    setSaveError(null)
  }, [])

  const isDirty = useMemo((): boolean => {
    if (state.status !== "ready") {
      return false
    }
    return Object.keys(state.drafts).some(
      (definitionId) => state.drafts[definitionId] !== state.initialDrafts[definitionId]
    )
  }, [state])

  const save = useCallback(async (): Promise<boolean> => {
    if (state.status !== "ready") {
      return false
    }

    setSaving(true)
    setSaveError(null)
    setSaveMessage(null)

    try {
      const payloads: Array<{
        definition_id: string
        owner_id: string
        owner_type: "category"
        locale: string
        value: unknown
      }> = []

      for (const definition of state.definitions) {
        const draft = state.drafts[definition.id] ?? ""
        const initial = state.initialDrafts[definition.id] ?? ""
        if (draft === initial) {
          continue
        }

        if (definition.is_required && draft.trim() === "") {
          setSaveError(`${definition.name} is required`)
          return false
        }

        if (draft.trim() === "") {
          continue
        }

        const parsed = parseMetafieldDraftValue(definition.type, draft)
        if (!parsed.ok) {
          setSaveError(`${definition.name}: ${parsed.message}`)
          return false
        }

        payloads.push({
          definition_id: definition.id,
          owner_id: categoryId,
          owner_type: "category",
          locale: DEFAULT_LOCALE,
          value: parsed.value,
        })
      }

      await batchUpsertMetafieldValues(payloads)

      setState((current) => {
        if (current.status !== "ready") {
          return current
        }
        return {
          ...current,
          initialDrafts: { ...current.drafts },
        }
      })
      setSaveMessage("Category metafields saved")
      return true
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save category metafields"
      setSaveError(message)
      return false
    } finally {
      setSaving(false)
    }
  }, [categoryId, state])

  return {
    state,
    saving,
    saveError,
    saveMessage,
    isDirty,
    reload,
    setDraft,
    save,
  }
}
