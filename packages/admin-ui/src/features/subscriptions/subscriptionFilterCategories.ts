import type { FilterCategory } from "@/components/list-filter/types"
import { subscriptionStatusLabel } from "@/features/subscriptions/subscriptionUi"
import type { CanonicalSubscriptionUiStatus } from "@/features/subscriptions/types"

const SUBSCRIPTION_STATUS_VALUES: CanonicalSubscriptionUiStatus[] = [
  "active",
  "paused",
  "cancelled",
  "past_due",
]

export const SUBSCRIPTION_FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: "status",
    label: "Status",
    type: "enum",
    operators: ["is", "is not"],
    values: SUBSCRIPTION_STATUS_VALUES.map((status) => ({
      id: status,
      label: subscriptionStatusLabel(status),
      tone:
        status === "active"
          ? "success"
          : status === "paused"
            ? "warning"
            : status === "cancelled"
              ? "danger"
              : status === "past_due"
                ? "danger"
                : "neutral",
    })),
  },
]
