import { useCallback, useEffect, useReducer } from "react"

import {
  getAdminDomainStatus,
  getAdminEmailConfig,
  postAdminSetupDomain,
} from "@/features/notifications/notificationConfigApi"
import {
  DEFAULT_FALLBACK_FROM,
  DOMAIN_STATUS_POLL_INTERVAL_MS,
  flattenDnsRecords,
  type DomainDnsRecordRow,
  type SesDomainStatus,
} from "@/features/notifications/types"
import { useInterval } from "@/hooks/useInterval"

type EmailDomainTabState = {
  phase: "loading" | "ready" | "error"
  message: string | null
  domainInput: string
  configuredDomain: string | null
  status: SesDomainStatus
  records: DomainDnsRecordRow[]
  fallbackFrom: string
  settingUp: boolean
  setupError: string | null
  pollingError: string | null
}

type EmailDomainTabAction =
  | { type: "loadStart" }
  | {
      type: "loadSuccess"
      domainInput: string
      configuredDomain: string | null
      status: SesDomainStatus
      records: DomainDnsRecordRow[]
      fallbackFrom: string
    }
  | { type: "loadError"; message: string }
  | { type: "setDomainInput"; value: string }
  | { type: "setupStart" }
  | { type: "setupSuccess"; domain: string; status: SesDomainStatus; records: DomainDnsRecordRow[]; fallbackFrom: string }
  | { type: "setupError"; message: string }
  | { type: "statusPollSuccess"; status: SesDomainStatus; records: DomainDnsRecordRow[]; fallbackFrom: string }
  | { type: "statusPollError"; message: string }

const INITIAL_STATE: EmailDomainTabState = {
  phase: "loading",
  message: null,
  domainInput: "",
  configuredDomain: null,
  status: "pending",
  records: [],
  fallbackFrom: DEFAULT_FALLBACK_FROM,
  settingUp: false,
  setupError: null,
  pollingError: null,
}

function emailDomainTabReducer(
  state: EmailDomainTabState,
  action: EmailDomainTabAction,
): EmailDomainTabState {
  switch (action.type) {
    case "loadStart":
      return { ...state, phase: "loading", message: null }
    case "loadSuccess":
      return {
        ...state,
        phase: "ready",
        domainInput: action.domainInput,
        configuredDomain: action.configuredDomain,
        status: action.status,
        records: action.records,
        fallbackFrom: action.fallbackFrom,
        message: null,
        setupError: null,
        pollingError: null,
      }
    case "loadError":
      return { ...state, phase: "error", message: action.message }
    case "setDomainInput":
      return { ...state, domainInput: action.value, setupError: null }
    case "setupStart":
      return { ...state, settingUp: true, setupError: null }
    case "setupSuccess":
      return {
        ...state,
        settingUp: false,
        configuredDomain: action.domain,
        domainInput: action.domain,
        status: action.status,
        records: action.records,
        fallbackFrom: action.fallbackFrom,
        setupError: null,
        pollingError: null,
      }
    case "setupError":
      return { ...state, settingUp: false, setupError: action.message }
    case "statusPollSuccess":
      return {
        ...state,
        status: action.status,
        records: action.records,
        fallbackFrom: action.fallbackFrom,
        pollingError: null,
      }
    case "statusPollError":
      return { ...state, pollingError: action.message }
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

export type UseEmailDomainTabResult = {
  state: EmailDomainTabState
  reload: () => Promise<void>
  setDomainInput: (value: string) => void
  setupDomain: () => Promise<void>
  checkStatus: () => Promise<void>
  domainLocked: boolean
  showFallbackInfo: boolean
}

export function useEmailDomainTab(): UseEmailDomainTabResult {
  const [state, dispatch] = useReducer(emailDomainTabReducer, INITIAL_STATE)

  const reload = useCallback(async (): Promise<void> => {
    dispatch({ type: "loadStart" })
    try {
      const config = await getAdminEmailConfig()
      dispatch({
        type: "loadSuccess",
        domainInput: config.domain ?? "",
        configuredDomain: config.domain,
        status: config.ses_domain_status,
        records: flattenDnsRecords(config.dns_records),
        fallbackFrom: config.fallback_from ?? DEFAULT_FALLBACK_FROM,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load email domain settings"
      dispatch({ type: "loadError", message })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const checkStatus = useCallback(async (): Promise<void> => {
    if (state.configuredDomain === null) {
      return
    }
    try {
      const result = await getAdminDomainStatus()
      dispatch({
        type: "statusPollSuccess",
        status: result.status,
        records: flattenDnsRecords(result.records),
        fallbackFrom: result.fallback_from,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to refresh domain status"
      dispatch({ type: "statusPollError", message })
    }
  }, [state.configuredDomain])

  useInterval(
    () => {
      void checkStatus()
    },
    DOMAIN_STATUS_POLL_INTERVAL_MS,
    state.phase === "ready" && state.status === "pending" && state.configuredDomain !== null,
  )

  const setupDomain = useCallback(async (): Promise<void> => {
    const domain = state.domainInput.trim()
    if (domain === "") {
      dispatch({ type: "setupError", message: "Enter a domain before setting up." })
      return
    }
    dispatch({ type: "setupStart" })
    try {
      const result = await postAdminSetupDomain(domain)
      dispatch({
        type: "setupSuccess",
        domain: result.domain,
        status: result.ses_domain_status,
        records: flattenDnsRecords(result.records),
        fallbackFrom: result.fallback_from,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to set up sending domain"
      dispatch({ type: "setupError", message })
    }
  }, [state.domainInput])

  const setDomainInput = useCallback((value: string): void => {
    dispatch({ type: "setDomainInput", value })
  }, [])

  const domainLocked = state.configuredDomain !== null
  const showFallbackInfo = state.status === "pending" || state.status === "failed"

  return {
    state,
    reload,
    setDomainInput,
    setupDomain,
    checkStatus,
    domainLocked,
    showFallbackInfo,
  }
}
