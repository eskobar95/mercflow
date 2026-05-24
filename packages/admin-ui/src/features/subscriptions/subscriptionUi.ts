import type { CanonicalSubscriptionUiStatus } from "./types"

export function canonicalSubscriptionUiStatus(raw: string): CanonicalSubscriptionUiStatus {
  const collapsed = raw.trim().toLowerCase().replace(/\s+/g, "_")
  switch (collapsed) {
    case "active":
      return "active"
    case "paused":
      return "paused"
    case "on_hold":
    case "onhold":
      return "on_hold"
    case "cancelled":
    case "canceled":
      return "cancelled"
    case "expired":
      return "expired"
    default:
      return "unknown"
  }
}

const LABEL: Record<CanonicalSubscriptionUiStatus, string> = {
  active: "Active",
  paused: "Paused",
  on_hold: "On Hold",
  cancelled: "Cancelled",
  expired: "Expired",
  unknown: "Unknown",
}

export function subscriptionStatusLabel(statusKey: CanonicalSubscriptionUiStatus): string {
  return LABEL[statusKey]
}

/**
 * Token-backed Tailwind classes for pills (MercFlow Tailwind preset + status semantics).
 */
export function subscriptionStatusPillClassName(
  statusKey: CanonicalSubscriptionUiStatus
): string {
  const base =
    "inline-flex items-center rounded-md border px-2 py-0.5 text-2xs font-medium capitalize"

  switch (statusKey) {
    case "active":
      return `${base} border-feedback-success-border bg-feedback-success-subtle text-feedback-success-content`
    case "paused":
      return `${base} border-feedback-warning-border bg-feedback-warning-subtle text-feedback-warning-content`
    case "on_hold":
      return `${base} border-feedback-pending-border bg-feedback-pending-subtle text-feedback-pending-content`
    case "cancelled":
      return `${base} border-border-default bg-surface-subtle text-content-secondary`
    case "expired":
      return `${base} border-feedback-danger-border bg-feedback-danger-subtle text-feedback-danger-content`
    default:
      return `${base} border-border-default bg-surface-subtle text-content-tertiary`
  }
}
