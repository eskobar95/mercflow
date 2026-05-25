export type OrderListRow = {
  id: string
  displayId: string
  /** Medusa workflow status (`pending`, `completed`, `canceled`, …). */
  orderStatus: string
  customerName: string
  customerEmail: string
  createdAt: string
  paymentStatus: string
  fulfillmentStatus: string
  totalMinor: number
  currencyCode: string
}

export type OrderStatusFilterBucket =
  | "all"
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"

export type OrderLineItemRow = {
  id: string
  title: string
  variantLabel: string
  quantity: number
  unitPriceMinor: number
  rowTotalMinor: number
  thumbnailUrl: string | null
}

export type OrderAddress = {
  line1: string
  line2: string | null
  city: string | null
  postalCode: string | null
  countryCode: string | null
  province: string | null
  name: string
}

export type OrderDetail = {
  id: string
  displayId: string
  status: string
  email: string
  createdAt: string
  updatedAt: string
  paymentStatus: string
  fulfillmentStatus: string
  totalMinor: number
  currencyCode: string
  customer: {
    id: string | null
    firstName: string | null
    lastName: string | null
    email: string | null
  } | null
  shippingAddress: OrderAddress | null
  lineItems: OrderLineItemRow[]
  /** Raw shape for timeline derivation (fulfillments, payment_collections, …). */
  raw: Record<string, unknown>
}
