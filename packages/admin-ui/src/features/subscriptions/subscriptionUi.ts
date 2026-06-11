import type { CanonicalSubscriptionUiStatus } from "./types"

export function canonicalSubscriptionUiStatus(raw: string): CanonicalSubscriptionUiStatus {
  const collapsed = raw.trim().toLowerCase().replace(/\s+/g, "_")
  switch (collapsed) {
    case "active":
      return "active"
    case "paused":
      return "paused"
    case "past_due":
    case "pastdue":
      return "past_due"
    case "pending_payment":
    case "pendingpayment":
      return "pending_payment"
    case "cancelled":
    case "canceled":
      return "cancelled"
    default:
      return "unknown"
  }
}

const LABEL: Record<CanonicalSubscriptionUiStatus, string> = {
  active: "Active",
  paused: "Paused",
  past_due: "Past Due",
  cancelled: "Cancelled",
  pending_payment: "Pending Payment",
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
    case "past_due":
    case "pending_payment":
      return `${base} border-feedback-danger-border bg-feedback-danger-subtle text-feedback-danger-content`
    case "cancelled":
      return `${base} border-border-default bg-surface-subtle text-content-secondary`
    default:
      return `${base} border-border-default bg-surface-subtle text-content-tertiary`
  }
}

export function subscriptionCanPause(status: string): boolean {
  return canonicalSubscriptionUiStatus(status) === "active"
}

export function subscriptionCanResume(status: string): boolean {
  return canonicalSubscriptionUiStatus(status) === "paused"
}

export function subscriptionCanCancel(status: string): boolean {
  const key = canonicalSubscriptionUiStatus(status)
  return key === "active" || key === "paused" || key === "past_due" || key === "pending_payment"
}
