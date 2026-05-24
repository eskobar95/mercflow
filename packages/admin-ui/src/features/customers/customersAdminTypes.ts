export type AdminCustomer = {
  id: string
  /** Nullable in Medusa for some profiles — UI should fall back to id. */
  email: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  created_at: string
}

/** Minimal order shape returned from `/admin/orders` for aggregates and listing. */
export type AdminOrderLite = {
  id: string
  currency_code: string
  payment_status: string | null
  status?: string | null
  /** Smallest currency unit as string from Medusa (e.g. "1999"). */
  total: string | number | null
  created_at?: string
}

export type CustomerPaidSpendSummary = {
  /** Rows returned across all fetched `/admin/orders` pages. */
  totalOrderCount: number
  paidOrderCount: number
  /** Single-store assumption: usually one currency on the summed lines. */
  lifetimeByCurrency: Map<string, bigint>
}
