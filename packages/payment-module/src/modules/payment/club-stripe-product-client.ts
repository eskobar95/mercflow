export type StripePriceRow = {
  id: string
  recurring?: { interval?: string } | null
  currency?: string
  unit_amount?: number | null
}

export type ClubStripeProductClient = {
  products: {
    create: (params: {
      name: string
      metadata: Record<string, string>
      active: boolean
    }) => Promise<{ id: string }>
    update: (
      productId: string,
      params: {
        name: string
        metadata: Record<string, string>
        active: boolean
      }
    ) => Promise<unknown>
  }
  prices: {
    list: (params: {
      product: string
      active: boolean
      limit: number
    }) => Promise<{ data: StripePriceRow[] }>
    create: (params: {
      product: string
      currency: string
      unit_amount: number
      recurring: { interval: "month" | "year" }
      nickname: string
    }) => Promise<unknown>
    update: (priceId: string, params: { active: boolean }) => Promise<unknown>
  }
}
