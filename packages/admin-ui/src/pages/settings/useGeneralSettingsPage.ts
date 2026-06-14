import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react"

import type { SelectOption } from "@/components/ui/Select"
import { validateGeneralSettingsForm } from "@/features/settings/storeGeneralFormValidation"
import {
  buildStoreUpdatePayload,
  fetchPrimaryStore,
  listAdminCurrencies,
  storeToGeneralFormValues,
  updateAdminStore,
} from "@/features/settings/storeSettingsApi"
import type { AdminCurrencyDto, GeneralSettingsFormValues } from "@/features/settings/types"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

type GeneralSettingsPhase = "loading" | "ready" | "error"

type GeneralSettingsState = {
  phase: GeneralSettingsPhase
  message: string | null
  storeId: string | null
  savedValues: GeneralSettingsFormValues | null
  currencies: AdminCurrencyDto[]
  saving: boolean
}

type GeneralSettingsAction =
  | { type: "loadStart" }
  | {
      type: "loadSuccess"
      storeId: string
      savedValues: GeneralSettingsFormValues
      currencies: AdminCurrencyDto[]
    }
  | { type: "loadError"; message: string }
  | { type: "saveStart" }
  | { type: "saveSuccess"; savedValues: GeneralSettingsFormValues }
  | { type: "saveError"; message: string }

const INITIAL_STATE: GeneralSettingsState = {
  phase: "loading",
  message: null,
  storeId: null,
  savedValues: null,
  currencies: [],
  saving: false,
}

function generalSettingsReducer(
  state: GeneralSettingsState,
  action: GeneralSettingsAction,
): GeneralSettingsState {
  switch (action.type) {
    case "loadStart":
      return { ...state, phase: "loading", message: null }
    case "loadSuccess":
      return {
        ...state,
        phase: "ready",
        storeId: action.storeId,
        savedValues: action.savedValues,
        currencies: action.currencies,
      }
    case "loadError":
      return { ...state, phase: "error", message: action.message }
    case "saveStart":
      return { ...state, saving: true, message: null }
    case "saveSuccess":
      return {
        ...state,
        saving: false,
        savedValues: action.savedValues,
        message: null,
      }
    case "saveError":
      return { ...state, saving: false, message: action.message }
    default: {
      const _exhaustive: never = action
      return _exhaustive as GeneralSettingsState
    }
  }
}

function valuesEqual(left: GeneralSettingsFormValues, right: GeneralSettingsFormValues): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function useGeneralSettingsPage(): {
  hasBackend: boolean
  state: GeneralSettingsState
  formValues: GeneralSettingsFormValues
  isDirty: boolean
  currencyOptions: SelectOption[]
  setFormValues: Dispatch<SetStateAction<GeneralSettingsFormValues>>
  reload: () => Promise<void>
  save: () => Promise<boolean>
} {
  const [state, dispatch] = useReducer(generalSettingsReducer, INITIAL_STATE)
  const [formValues, setFormValues] = useState<GeneralSettingsFormValues>({
    storeName: "",
    contactEmail: "",
    defaultCurrency: "dkk",
    timezone: "Europe/Copenhagen",
    address: { street: "", city: "", postalCode: "", country: "dk" },
  })
  const hasBackend = resolveMedusaAdminBackendUrl() !== null

  const reload = useCallback(async (): Promise<void> => {
    if (!hasBackend) return
    dispatch({ type: "loadStart" })
    try {
      const [store, currencies] = await Promise.all([fetchPrimaryStore(), listAdminCurrencies()])
      const savedValues = storeToGeneralFormValues(store)
      dispatch({ type: "loadSuccess", storeId: store.id, savedValues, currencies })
      setFormValues(savedValues)
    } catch (error: unknown) {
      dispatch({
        type: "loadError",
        message: error instanceof Error ? error.message : "Failed to load store settings",
      })
    }
  }, [hasBackend])

  useEffect(() => {
    void reload()
  }, [reload])

  const isDirty = useMemo((): boolean => {
    if (state.savedValues === null) return false
    return !valuesEqual(formValues, state.savedValues)
  }, [formValues, state.savedValues])

  const currencyOptions = useMemo(
    (): SelectOption[] =>
      state.currencies.map((currency) => ({
        value: currency.code,
        label: `${currency.code.toUpperCase()} — ${currency.name}`,
      })),
    [state.currencies],
  )

  const save = useCallback(async (): Promise<boolean> => {
    if (state.storeId === null) return false
    const validationError = validateGeneralSettingsForm(formValues)
    if (validationError !== null) {
      dispatch({ type: "saveError", message: validationError })
      return false
    }
    dispatch({ type: "saveStart" })
    try {
      const store = await fetchPrimaryStore()
      const updated = await updateAdminStore(
        state.storeId,
        buildStoreUpdatePayload(store, formValues),
      )
      const savedValues = storeToGeneralFormValues(updated)
      dispatch({ type: "saveSuccess", savedValues })
      setFormValues(savedValues)
      return true
    } catch (error: unknown) {
      dispatch({
        type: "saveError",
        message: error instanceof Error ? error.message : "Failed to save store settings",
      })
      return false
    }
  }, [formValues, state.storeId])

  return {
    hasBackend,
    state,
    formValues,
    isDirty,
    currencyOptions,
    setFormValues,
    reload,
    save,
  }
}
