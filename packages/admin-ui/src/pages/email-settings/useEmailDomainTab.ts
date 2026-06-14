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
  fromEmail: string
  status: SesDomainStatus
  records: DomainDnsRecordRow[]
  fallbackFrom: string
  settingUp: boolean
  verifying: boolean
  setupError: string | null
  pollingError: string | null
}

type EmailDomainTabAction =
  | { type: "loadStart" }
  | {
      type: "loadSuccess"
      domainInput: string
      configuredDomain: string | null
      fromEmail: string
      status: SesDomainStatus
      records: DomainDnsRecordRow[]
      fallbackFrom: string
    }
  | { type: "loadError"; message: string }
  | { type: "setDomainInput"; value: string }
  | { type: "setupStart" }
  | {
      type: "setupSuccess"
      domain: string
      fromEmail: string
      status: SesDomainStatus
      records: DomainDnsRecordRow[]
      fallbackFrom: string
    }
  | { type: "setupError"; message: string }
  | { type: "verifyStart" }
  | { type: "verifyFinish" }
  | {
      type: "statusPollSuccess"
      status: SesDomainStatus
      records: DomainDnsRecordRow[]
      fallbackFrom: string
      fromEmail?: string
    }
  | { type: "statusPollError"; message: string }

const INITIAL_STATE: EmailDomainTabState = {
  phase: "loading",
  message: null,
  domainInput: "",
  configuredDomain: null,
  fromEmail: DEFAULT_FALLBACK_FROM,
  status: "pending",
  records: [],
  fallbackFrom: DEFAULT_FALLBACK_FROM,
  settingUp: false,
  verifying: false,
  setupError: null,
  pollingError: null,
}

function resolveFromEmail(
  fromEmail: string | null,
  domain: string | null,
  fallbackFrom: string,
): string {
  if (fromEmail !== null && fromEmail.trim() !== "") {
    return fromEmail
  }
  if (domain !== null && domain.trim() !== "") {
    return `noreply@${domain}`
  }
  return fallbackFrom
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
        fromEmail: action.fromEmail,
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
        fromEmail: action.fromEmail,
        status: action.status,
        records: action.records,
        fallbackFrom: action.fallbackFrom,
        setupError: null,
        pollingError: null,
      }
    case "setupError":
      return { ...state, settingUp: false, setupError: action.message }
    case "verifyStart":
      return { ...state, verifying: true, pollingError: null }
    case "verifyFinish":
      return { ...state, verifying: false }
    case "statusPollSuccess":
      return {
        ...state,
        status: action.status,
        records: action.records,
        fallbackFrom: action.fallbackFrom,
        fromEmail: action.fromEmail ?? state.fromEmail,
        pollingError: null,
      }
    case "statusPollError":
      return { ...state, pollingError: action.message }
    default: {
      const exhaustive: never = action
      return exhaustive
    }
  }
}

export type UseEmailDomainTabResult = {
  state: EmailDomainTabState
  reload: () => Promise<void>
  setDomainInput: (value: string) => void
  setupDomain: () => Promise<void>
  verifyNow: () => Promise<void>
  domainLocked: boolean
  showFallbackInfo: boolean
}

export function useEmailDomainTab(): UseEmailDomainTabResult {
  const [state, dispatch] = useReducer(emailDomainTabReducer, INITIAL_STATE)

  const reload = useCallback(async (): Promise<void> => {
    dispatch({ type: "loadStart" })
    try {
      const config = await getAdminEmailConfig()
      const fallbackFrom = config.fallback_from ?? DEFAULT_FALLBACK_FROM
      dispatch({
        type: "loadSuccess",
        domainInput: config.domain ?? "",
        configuredDomain: config.domain,
        fromEmail: resolveFromEmail(config.from_email, config.domain, fallbackFrom),
        status: config.ses_domain_status,
        records: flattenDnsRecords(config.dns_records),
        fallbackFrom,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load email domain settings"
      dispatch({ type: "loadError", message })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const verifyNow = useCallback(async (): Promise<void> => {
    if (state.configuredDomain === null) {
      return
    }
    dispatch({ type: "verifyStart" })
    try {
      const result = await getAdminDomainStatus()
      const fromEmail =
        result.status === "verified" && state.configuredDomain !== null
          ? `noreply@${state.configuredDomain}`
          : state.fromEmail
      dispatch({
        type: "statusPollSuccess",
        status: result.status,
        records: flattenDnsRecords(result.records),
        fallbackFrom: result.fallback_from,
        fromEmail,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to refresh domain status"
      dispatch({ type: "statusPollError", message })
    } finally {
      dispatch({ type: "verifyFinish" })
    }
  }, [state.configuredDomain, state.fromEmail])

  useInterval(
    () => {
      void verifyNow()
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
        fromEmail: `noreply@${result.domain}`,
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
  const showFallbackInfo =
    state.configuredDomain === null || state.status === "pending" || state.status === "failed"

  return {
    state,
    reload,
    setDomainInput,
    setupDomain,
    verifyNow,
    domainLocked,
    showFallbackInfo,
  }
}
