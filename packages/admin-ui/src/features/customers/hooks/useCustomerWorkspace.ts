import { useEffect, useState } from "react"

import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import {
  CustomersAdminConfigError,
  fetchCustomerPaidSpendSummary,
  fetchRecentOrdersForCustomer,
  getCustomer,
  getStoreDefaultCurrencyCode,
} from "../customersAdminApi"
import type {
  AdminCustomer,
  AdminOrderLite,
  CustomerPaidSpendSummary,
} from "../customersAdminTypes"

type CustomerWorkspacePhase = "idle" | "loading" | "ready" | "error"

export function useCustomerWorkspace(
  customerId: string | undefined
): {
  readonly hasBackendConfiguration: boolean
  readonly phase: CustomerWorkspacePhase
  readonly errorMessage: string | null
  readonly customer: AdminCustomer | null
  readonly recentOrders: AdminOrderLite[]
  readonly spendSummary: CustomerPaidSpendSummary | null
  /** Currency code for formatting zero / empty lifetime value (store default → first recent order → usd). */
  readonly lifetimeValueDisplayCurrency: string
  readonly requestReload: () => void
} {
  const hasBackendConfiguration = resolveMedusaAdminBackendUrl() !== null
  const [phase, setPhase] = useState<CustomerWorkspacePhase>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [customer, setCustomer] = useState<AdminCustomer | null>(null)
  const [recentOrders, setRecentOrders] = useState<AdminOrderLite[]>([])
  const [spendSummary, setSpendSummary] = useState<CustomerPaidSpendSummary | null>(null)
  const [lifetimeValueDisplayCurrency, setLifetimeValueDisplayCurrency] = useState<string>("usd")
  const [reloadKey, setReloadKey] = useState(0)

  const requestReload = (): void => {
    setReloadKey((value) => {
      return value + 1
    })
  }

  useEffect(() => {
    if (!customerId) {
      setPhase("idle")
      setCustomer(null)
      setRecentOrders([])
      setSpendSummary(null)
      setLifetimeValueDisplayCurrency("usd")
      setErrorMessage(null)
      return
    }

    const scopedCustomerId = customerId

    if (!hasBackendConfiguration) {
      setPhase("error")
      setErrorMessage(
        "Missing backend URL. Configure VITE_MEDUSA_ADMIN_BACKEND_URL to load customer data."
      )
      setCustomer(null)
      setRecentOrders([])
      setSpendSummary(null)
      setLifetimeValueDisplayCurrency("usd")
      return
    }

    const controller = new AbortController()

    async function loadWorkspace(): Promise<void> {
      setPhase("loading")
      setErrorMessage(null)
      try {
        const profile = await getCustomer(scopedCustomerId, { signal: controller.signal })

        const [orders, lifetime, storeCurrency] = await Promise.all([
          fetchRecentOrdersForCustomer(scopedCustomerId, 10, { signal: controller.signal }),
          fetchCustomerPaidSpendSummary(scopedCustomerId, { signal: controller.signal }),
          getStoreDefaultCurrencyCode({ signal: controller.signal }),
        ])

        if (controller.signal.aborted) {
          return
        }

        const orderCurrency =
          typeof orders[0]?.currency_code === "string"
            ? orders[0]?.currency_code.trim().toLowerCase()
            : null
        const resolvedDisplayCurrency = storeCurrency ?? orderCurrency ?? "usd"

        setCustomer(profile)
        setRecentOrders(orders)
        setSpendSummary(lifetime)
        setLifetimeValueDisplayCurrency(resolvedDisplayCurrency)
        setPhase("ready")
      } catch (error) {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          return
        }
        setCustomer(null)
        setRecentOrders([])
        setSpendSummary(null)
        setLifetimeValueDisplayCurrency("usd")

        if (error instanceof CustomersAdminConfigError) {
          setPhase("error")
          setErrorMessage(error.message)
          return
        }
        if (error instanceof Error && error.message === "Customer was not found") {
          setPhase("error")
          setErrorMessage(error.message)
          return
        }
        setPhase("error")
        setErrorMessage(error instanceof Error ? error.message : "Failed to load customer")
      }
    }

    void loadWorkspace()

    return (): void => {
      controller.abort()
    }
  }, [customerId, hasBackendConfiguration, reloadKey])

  return {
    hasBackendConfiguration,
    phase,
    errorMessage,
    customer,
    recentOrders,
    spendSummary,
    lifetimeValueDisplayCurrency,
    requestReload,
  }
}
