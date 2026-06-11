import type { AdminSubscriptionRow } from "./types"

export function applyOptimisticSubscriptionStatus(
  row: AdminSubscriptionRow,
  status: string
): AdminSubscriptionRow {
  return {
    ...row,
    status,
    cancelled_at: status === "cancelled" ? new Date().toISOString() : row.cancelled_at,
    pause_requested_at: status === "paused" ? new Date().toISOString() : row.pause_requested_at,
  }
}
