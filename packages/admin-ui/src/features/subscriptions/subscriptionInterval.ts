import type { SubscriptionInterval } from "./types"

const INTERVAL_LABEL: Record<SubscriptionInterval, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
}

export function subscriptionIntervalLabel(interval: SubscriptionInterval): string {
  return INTERVAL_LABEL[interval]
}
