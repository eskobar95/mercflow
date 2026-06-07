import type { ReactNode } from "react"

import { useOrdersListPageModel } from "@/hooks/orders/useOrdersListPageModel"
import { OrdersListPageView } from "@/pages/orders/OrdersListPageView"

export function OrdersListPage(): ReactNode {
  const model = useOrdersListPageModel()
  return <OrdersListPageView model={model} />
}
