import Stripe from "stripe"

export type StripePaymentOverviewRow = {
  /** Stripe PI id */
  id: string
  amount_minor: number
  currency: string
  status: string
  customerLabel: string | null
  created_epoch: number
}

/**
 * Returns the most recently created payment intents (newest first).
 */
export async function stripeListRecentPaymentIntents(
  stripe: Stripe,
  limit: number
): Promise<StripePaymentOverviewRow[]> {
  const res = await stripe.paymentIntents.list({
    limit,
    expand: ["data.customer"],
  })

  const rows: StripePaymentOverviewRow[] = []
  for (const pi of res.data) {
    const customer = pi.customer
    let customerLabel: string | null = null
    if (typeof customer === "object" && customer !== null) {
      const isDeleted =
        "deleted" in customer && (customer as { deleted?: unknown }).deleted === true
      if (!isDeleted) {
        const c = customer as { id?: string; email?: string | null; name?: string | null }
        const email =
          typeof c.email === "string" && c.email.trim() !== "" ? c.email.trim() : null
        const name = typeof c.name === "string" && c.name.trim() !== "" ? c.name.trim() : null
        customerLabel = email ?? name ?? (typeof c.id === "string" ? c.id : null)
      }
    } else if (typeof customer === "string") {
      customerLabel = customer
    }

    rows.push({
      id: pi.id,
      amount_minor: pi.amount,
      currency: pi.currency,
      status: pi.status,
      customerLabel,
      created_epoch: pi.created,
    })
  }

  return rows
}
