import { model } from "@medusajs/framework/utils"

/**
 * Mirrors the Guapo `subscription` table migrated into MercFlow.
 * Lifecycle transitions stay out of this read-only overview slice — no service helpers change state here.
 */
export const Subscription = model.define("subscription", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  /** Stored as lowercase snake (e.g. active, paused, on_hold); UI maps to badges. */
  status: model.text(),
  cycle_weeks: model.number(),
  next_renewal_at: model.dateTime().nullable(),
  variant_id: model.text(),
  discount_percent: model.number().nullable(),
})
