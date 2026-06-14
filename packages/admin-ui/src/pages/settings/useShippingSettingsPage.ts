import { type Dispatch, useCallback, useEffect, useMemo, useReducer } from "react"

import type { ListColumnDef } from "@/components/ui/list/types"
import type { RowActionItem } from "@/components/ui/list/RowActionsMenu"
import {
  resolveShippingOptionCarrierLabel,
  formatShippingOptionConditions,
  formatShippingOptionPrice,
  formatShippingPriceType,
  formatShippingProfileType,
} from "@/features/shipping/shippingDisplayHelpers"
import {
  createFlatShippingRate,
  createShippingProfile,
  deleteShippingProfile,
  deleteShippingRate,
  fetchShippingSetupContext,
  listShippingOptionsForProfile,
  listShippingProfiles,
  type ShippingProfileFormInput,
  type ShippingRateFormInput,
  toShippingSettingsError,
  updateFlatShippingRate,
  updateShippingProfile,
} from "@/features/shipping/shippingSettingsApi"
import { createMercflowMedusaSdk } from "@/medusa-admin/createMercflowMedusaSdk"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import {
  INITIAL_SHIPPING_SETTINGS_STATE,
  type ShippingSettingsAction,
  shippingSettingsReducer,
  type ShippingSettingsState,
} from "./shippingSettingsState"

type ProfileCol = "name" | "type"
type ProfileRow = { id: string; name: string; type: string }
type RateCol = "name" | "carrier" | "price" | "priceType" | "conditions"
type RateRow = { id: string; name: string; carrier: string; price: string; priceType: string; conditions: string }

export function useShippingSettingsPage(): {
  hasBackend: boolean
  state: ShippingSettingsState
  dispatch: Dispatch<ShippingSettingsAction>
  reload: () => Promise<void>
  profileColumns: ListColumnDef<ProfileRow, ProfileCol>[]
  rateColumns: ListColumnDef<RateRow, RateCol>[]
  profileRows: ProfileRow[]
  rateRows: RateRow[]
  getProfileRowActions: (row: ProfileRow) => RowActionItem[]
  getRateRowActions: (row: RateRow) => RowActionItem[]
  submitProfile: (input: ShippingProfileFormInput) => Promise<void>
  submitRate: (input: ShippingRateFormInput) => Promise<void>
} {
  const hasBackend = resolveMedusaAdminBackendUrl() !== null
  const sdk = useMemo(() => createMercflowMedusaSdk(), [])
  const [state, dispatch] = useReducer(shippingSettingsReducer, INITIAL_SHIPPING_SETTINGS_STATE)

  const reload = useCallback(async (): Promise<void> => {
    if (!sdk) {
      dispatch({ type: "reloadError", message: "Medusa backend URL is not configured." })
      return
    }
    dispatch({ type: "reloadStart" })
    try {
      const profiles = await listShippingProfiles(sdk)
      let setup = null
      try {
        setup = await fetchShippingSetupContext(sdk)
      } catch {
        setup = null
      }
      dispatch({ type: "reloadSuccess", profiles, setup })
    } catch (error: unknown) {
      dispatch({ type: "reloadError", message: toShippingSettingsError(error).message })
    }
  }, [sdk])

  const reloadRates = useCallback(async (): Promise<void> => {
    if (!sdk || !state.selectedProfileId) {
      dispatch({ type: "ratesLoadSuccess", rates: [] })
      return
    }
    dispatch({ type: "ratesLoadStart" })
    try {
      const rates = await listShippingOptionsForProfile(sdk, state.selectedProfileId)
      dispatch({ type: "ratesLoadSuccess", rates })
    } catch (error: unknown) {
      dispatch({ type: "ratesLoadError", message: toShippingSettingsError(error).message })
    }
  }, [sdk, state.selectedProfileId])

  useEffect(() => {
    if (hasBackend) void reload()
  }, [hasBackend, reload])

  useEffect(() => {
    if (state.phase === "ready" && state.activeTab === "rates") void reloadRates()
  }, [state.phase, state.activeTab, state.selectedProfileId, reloadRates])

  const profileRows = useMemo(
    () => state.profiles.map((p) => ({ id: p.id, name: p.name, type: p.type })),
    [state.profiles],
  )
  const rateRows = useMemo(
    () =>
      state.rates.map((rate) => ({
        id: rate.id,
        name: rate.name,
        carrier: resolveShippingOptionCarrierLabel(rate),
        price: formatShippingOptionPrice(rate),
        priceType: formatShippingPriceType(rate.price_type),
        conditions: formatShippingOptionConditions(rate),
      })),
    [state.rates],
  )

  const profileColumns = useMemo(
    (): ListColumnDef<ProfileRow, ProfileCol>[] => [
      { id: "name", header: "Name", renderCell: (row) => row.name },
      { id: "type", header: "Type", renderCell: (row) => formatShippingProfileType(row.type) },
    ],
    [],
  )
  const rateColumns = useMemo(
    (): ListColumnDef<RateRow, RateCol>[] => [
      { id: "name", header: "Name", renderCell: (row) => row.name },
      { id: "carrier", header: "Carrier", renderCell: (row) => row.carrier },
      { id: "price", header: "Price", renderCell: (row) => row.price },
      { id: "priceType", header: "Rate type", renderCell: (row) => row.priceType },
      { id: "conditions", header: "Conditions", renderCell: (row) => row.conditions },
    ],
    [],
  )

  const getProfileRowActions = useCallback(
    (row: ProfileRow): RowActionItem[] => [
      {
        id: "edit",
        label: "Edit",
        onSelect: () => {
          const profile = state.profiles.find((item) => item.id === row.id)
          if (profile) dispatch({ type: "openEditProfileSheet", profile })
        },
      },
      {
        id: "delete",
        label: "Delete",
        destructive: true,
        onSelect: () => {
          void (async () => {
            if (!sdk) return
            try {
              await deleteShippingProfile(sdk, row.id)
              await reload()
            } catch (error: unknown) {
              dispatch({ type: "setMessage", message: toShippingSettingsError(error).message })
            }
          })()
        },
      },
    ],
    [dispatch, reload, sdk, state.profiles],
  )

  const getRateRowActions = useCallback(
    (row: RateRow): RowActionItem[] => [
      {
        id: "edit",
        label: "Edit",
        onSelect: () => {
          const rate = state.rates.find((item) => item.id === row.id)
          if (rate) dispatch({ type: "openEditRateSheet", rate })
        },
      },
      {
        id: "delete",
        label: "Delete",
        destructive: true,
        onSelect: () => {
          void (async () => {
            if (!sdk) return
            try {
              await deleteShippingRate(sdk, row.id)
              await reloadRates()
            } catch (error: unknown) {
              dispatch({ type: "setMessage", message: toShippingSettingsError(error).message })
            }
          })()
        },
      },
    ],
    [dispatch, reloadRates, sdk, state.rates],
  )

  const submitProfile = useCallback(
    async (input: ShippingProfileFormInput): Promise<void> => {
      if (!sdk) return
      dispatch({ type: "profileSaveStart" })
      try {
        if (state.profileSheetMode === "create") await createShippingProfile(sdk, input)
        else if (state.editingProfile) await updateShippingProfile(sdk, state.editingProfile.id, input)
        dispatch({ type: "profileSaveFinish" })
        await reload()
      } catch (error: unknown) {
        dispatch({ type: "profileSaveError", message: toShippingSettingsError(error).message })
      }
    },
    [reload, sdk, state.editingProfile, state.profileSheetMode],
  )

  const submitRate = useCallback(
    async (input: ShippingRateFormInput): Promise<void> => {
      if (!sdk || !state.selectedProfileId || !state.setup) {
        dispatch({
          type: "rateSaveError",
          message:
            "Shipping prerequisites are missing. Add a stock location service zone and region in Medusa first.",
        })
        return
      }
      dispatch({ type: "rateSaveStart" })
      try {
        const payload = { ...input, shippingProfileId: state.selectedProfileId }
        if (state.rateSheetMode === "create") {
          await createFlatShippingRate(sdk, payload, state.setup)
        } else if (state.editingRate) {
          if (state.editingRate.price_type !== "flat") {
            dispatch({
              type: "rateSaveError",
              message: "Only flat-rate options can be edited from this settings page.",
            })
            return
          }
          await updateFlatShippingRate(sdk, state.editingRate.id, payload, state.setup)
        }
        dispatch({ type: "rateSaveFinish" })
        await reloadRates()
      } catch (error: unknown) {
        dispatch({ type: "rateSaveError", message: toShippingSettingsError(error).message })
      }
    },
    [reloadRates, sdk, state.editingRate, state.rateSheetMode, state.selectedProfileId, state.setup],
  )

  return {
    hasBackend,
    state,
    dispatch,
    reload,
    profileColumns,
    rateColumns,
    profileRows,
    rateRows,
    getProfileRowActions,
    getRateRowActions,
    submitProfile,
    submitRate,
  }
}
