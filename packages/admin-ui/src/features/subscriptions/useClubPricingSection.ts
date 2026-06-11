import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"

import type { VariantRowModel } from "@/lib/products/productOptionMatrix"
import { PRODUCT_FORM_PRICE_CURRENCY } from "@/lib/products/productOptionMatrix"

import {
  deleteClubMemberPrice,
  fetchProductClubPricing,
  upsertClubMemberPrice,
} from "./clubPricingApi"

export type ClubPricingDraft = {
  memberPriceDkk: string
}

export type ClubPricingFieldErrors = Record<string, string>

export type ClubPricingLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; clubEnabled: boolean }
  | { status: "error"; message: string }

function minorUnitsToMajorDkk(amount: number): string {
  const major = amount / 100
  if (Number.isInteger(major)) {
    return String(major)
  }
  return major.toFixed(2).replace(/\.?0+$/u, "")
}

function parseOptionalDkkMajorToMinorUnits(
  rawInput: string
): { ok: true; minorUnits: number | null } | { ok: false; message: string } {
  const normalized = rawInput.trim().replace(",", ".")
  if (normalized === "") {
    return { ok: true, minorUnits: null }
  }

  const major = Number.parseFloat(normalized)
  if (!Number.isFinite(major) || major < 0) {
    return { ok: false, message: "Enter a valid non-negative amount in DKK." }
  }

  return { ok: true, minorUnits: Math.round(major * 100) }
}

function buildServerDrafts(
  variantRows: VariantRowModel[],
  serverPrices: Map<string, number>
): Record<string, ClubPricingDraft> {
  const drafts: Record<string, ClubPricingDraft> = {}
  for (const row of variantRows) {
    const variantId = row.medusaVariantId
    if (typeof variantId !== "string" || variantId.trim() === "") {
      continue
    }
    const amount = serverPrices.get(variantId)
    drafts[variantId] = {
      memberPriceDkk: amount !== undefined ? minorUnitsToMajorDkk(amount) : "",
    }
  }
  return drafts
}

export function useClubPricingSection(params: {
  productId: string | undefined
  variantRows: VariantRowModel[]
  enabled: boolean
}): {
  loadState: ClubPricingLoadState
  drafts: Record<string, ClubPricingDraft>
  fieldErrors: ClubPricingFieldErrors
  isDirty: boolean
  updateMemberPrice: (variantId: string, memberPriceDkk: string) => void
  persist: (productId: string) => Promise<void>
  reload: () => void
} {
  const queryClient = useQueryClient()
  const [fieldErrors, setFieldErrors] = useState<ClubPricingFieldErrors>({})
  const [draftOverrides, setDraftOverrides] = useState<Record<string, ClubPricingDraft>>({})

  const queryEnabled =
    params.enabled && params.productId !== undefined && params.productId.trim() !== ""

  const {
    data: pricingData,
    isLoading: isPricingLoading,
    isError: isPricingError,
    error: pricingError,
  } = useQuery({
    queryKey: ["product-club-pricing", params.productId],
    enabled: queryEnabled,
    queryFn: async () => fetchProductClubPricing(params.productId as string),
  })

  const serverPrices = useMemo((): Map<string, number> => {
    const map = new Map<string, number>()
    if (pricingData?.club_enabled) {
      for (const price of pricingData.prices) {
        map.set(price.variant_id, price.amount)
      }
    }
    return map
  }, [pricingData])

  const serverDrafts = useMemo(
    () => buildServerDrafts(params.variantRows, serverPrices),
    [params.variantRows, serverPrices]
  )

  const drafts = useMemo((): Record<string, ClubPricingDraft> => {
    const merged: Record<string, ClubPricingDraft> = { ...serverDrafts }
    for (const [variantId, override] of Object.entries(draftOverrides)) {
      merged[variantId] = override
    }
    return merged
  }, [draftOverrides, serverDrafts])

  const loadState = useMemo((): ClubPricingLoadState => {
    if (!queryEnabled) {
      return { status: "idle" }
    }
    if (isPricingLoading) {
      return { status: "loading" }
    }
    if (isPricingError) {
      const message =
        pricingError instanceof Error
          ? pricingError.message
          : "Unable to load club member prices."
      return { status: "error", message }
    }
    if (pricingData === undefined) {
      return { status: "loading" }
    }
    return { status: "ready", clubEnabled: pricingData.club_enabled }
  }, [isPricingError, isPricingLoading, pricingData, pricingError, queryEnabled])

  const reload = useCallback((): void => {
    if (!queryEnabled) {
      return
    }
    setDraftOverrides({})
    void queryClient.invalidateQueries({ queryKey: ["product-club-pricing", params.productId] })
  }, [params.productId, queryClient, queryEnabled])

  const updateMemberPrice = useCallback((variantId: string, memberPriceDkk: string): void => {
    setDraftOverrides((previous) => ({
      ...previous,
      [variantId]: { memberPriceDkk },
    }))
    setFieldErrors((previous) => {
      const next = { ...previous }
      delete next[`club_price_${variantId}`]
      return next
    })
  }, [])

  const isDirty = useMemo((): boolean => {
    for (const [variantId, override] of Object.entries(draftOverrides)) {
      const baseline = serverDrafts[variantId]?.memberPriceDkk ?? ""
      if (override.memberPriceDkk !== baseline) {
        return true
      }
    }
    return false
  }, [draftOverrides, serverDrafts])

  const persistMutation = useMutation({
    mutationFn: async (productId: string): Promise<void> => {
      if (loadState.status !== "ready" || !loadState.clubEnabled) {
        return
      }

      const validationErrors: ClubPricingFieldErrors = {}
      const mutations: Array<Promise<void>> = []

      for (const [variantId, draft] of Object.entries(drafts)) {
        const parsed = parseOptionalDkkMajorToMinorUnits(draft.memberPriceDkk)
        if (!parsed.ok) {
          validationErrors[`club_price_${variantId}`] = parsed.message
          continue
        }

        const serverAmount = serverPrices.get(variantId)
        const hadServerPrice = serverAmount !== undefined

        if (parsed.minorUnits === null) {
          if (hadServerPrice) {
            mutations.push(deleteClubMemberPrice(productId, variantId))
          }
          continue
        }

        if (parsed.minorUnits !== serverAmount) {
          mutations.push(
            upsertClubMemberPrice(productId, {
              variant_id: variantId,
              amount: parsed.minorUnits,
              currency_code: PRODUCT_FORM_PRICE_CURRENCY,
            }).then(() => undefined)
          )
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors)
        throw new Error("Fix club member price fields before saving.")
      }

      await Promise.all(mutations)
    },
    onSuccess: async (_data, productId) => {
      setDraftOverrides({})
      setFieldErrors({})
      await queryClient.invalidateQueries({ queryKey: ["product-club-pricing", productId] })
    },
  })

  const persist = useCallback(
    async (productId: string): Promise<void> => {
      await persistMutation.mutateAsync(productId)
    },
    [persistMutation]
  )

  return {
    loadState,
    drafts,
    fieldErrors,
    isDirty,
    updateMemberPrice,
    persist,
    reload,
  }
}
