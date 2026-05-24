import { useCallback, useEffect, useState } from "react"

import { fetchAdminOrder } from "@/features/orders/ordersAdminApi"
import type { OrderDetail } from "@/features/orders/orderTypes"

type UseOrderDetailReturn = {
  order: OrderDetail | null
  isLoading: boolean
  errorMessage: string | null
  refetch: () => void
}

export function useOrderDetail(orderId: string | undefined): UseOrderDetailReturn {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(orderId && orderId.trim() !== ""))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const refetch = useCallback((): void => {
    setReloadToken((t) => t + 1)
  }, [])

  useEffect(() => {
    if (orderId === undefined || orderId.trim() === "") {
      setOrder(null)
      setIsLoading(false)
      setErrorMessage("Missing order id")
      return
    }
    let cancelled = false
    const run = async (): Promise<void> => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const d = await fetchAdminOrder(orderId)
        if (!cancelled) {
          setOrder(d)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load order"
        if (!cancelled) {
          setOrder(null)
          setErrorMessage(msg)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }
    void run()
    return (): void => {
      cancelled = true
    }
  }, [orderId, reloadToken])

  return { order, isLoading, errorMessage, refetch }
}
