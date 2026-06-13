import { useCallback, useEffect, useMemo, useState } from "react"

import { formatPlanPrice, formatTierLabel } from "@/lib/formatPlanPrice"
import { getPlanTierFeatures } from "@/lib/planTierFeatures"
import { fetchPlatformBillingPlans } from "@/lib/signupPlansApi"
import { BillingIntervalToggle } from "@/signup/steps/BillingIntervalToggle"
import { PlanCard } from "@/signup/steps/PlanCard"
import type { BillingInterval, PlatformPlan, PlatformTier } from "@/types/platformPlan"
import { PLATFORM_TIERS } from "@/types/platformPlan"

type PlanPickerProps = {
  currency: string
  selectedPriceId: string | null
  onSelectPriceId: (priceId: string) => void
}

function PlanPickerSkeleton(): React.ReactElement {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading plans">
      <div className="h-10 w-48 animate-pulse rounded-md bg-surface-subtle" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-56 animate-pulse rounded-lg bg-surface-subtle" />
        <div className="h-56 animate-pulse rounded-lg bg-surface-subtle" />
      </div>
    </div>
  )
}

function findPlanForSelection(
  plans: PlatformPlan[],
  tier: PlatformTier,
  interval: BillingInterval,
): PlatformPlan | null {
  return (
    plans.find((plan) => plan.tier === tier && plan.interval === interval) ?? null
  )
}

export function PlanPicker({
  currency,
  selectedPriceId,
  onSelectPriceId,
}: PlanPickerProps): React.ReactElement {
  const [plans, setPlans] = useState<PlatformPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [interval, setInterval] = useState<BillingInterval>("month")
  const [selectedTier, setSelectedTier] = useState<PlatformTier>("standard")

  const loadPlans = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetchPlatformBillingPlans(currency)
      setPlans(response.plans)
    } catch (loadError: unknown) {
      setPlans([])
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load subscription plans",
      )
    } finally {
      setIsLoading(false)
    }
  }, [currency])

  useEffect(() => {
    void loadPlans()
  }, [loadPlans])

  const plansForInterval = useMemo(() => {
    return PLATFORM_TIERS.map((tier) => ({
      tier,
      plan: findPlanForSelection(plans, tier, interval),
    }))
  }, [interval, plans])

  const availableIntervals = useMemo(() => {
    const intervals = new Set<BillingInterval>()
    for (const plan of plans) {
      if (plan.interval === "month" || plan.interval === "year") {
        intervals.add(plan.interval)
      }
    }
    return intervals
  }, [plans])

  useEffect(() => {
    if (!availableIntervals.has(interval) && availableIntervals.size > 0) {
      const nextInterval = availableIntervals.has("month") ? "month" : "year"
      setInterval(nextInterval)
    }
  }, [availableIntervals, interval])

  useEffect(() => {
    const selectedPlan = findPlanForSelection(plans, selectedTier, interval)
    if (selectedPlan && selectedPlan.price_id !== selectedPriceId) {
      onSelectPriceId(selectedPlan.price_id)
    }
  }, [interval, onSelectPriceId, plans, selectedPriceId, selectedTier])

  if (isLoading) {
    return <PlanPickerSkeleton />
  }

  if (error !== null) {
    return (
      <div className="rounded-md border border-feedback-danger-border bg-feedback-danger-subtle p-4">
        <p className="text-sm text-feedback-danger-content">{error}</p>
        <button
          type="button"
          className="mt-3 rounded-md border border-border-subtle px-4 py-2 text-sm font-medium text-content-primary"
          onClick={() => {
            void loadPlans()
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-md border border-border-subtle bg-surface-appCanvas p-4">
        <p className="text-sm text-content-secondary">
          No subscription plans are available for your currency yet.
        </p>
        <a
          className="mt-2 inline-block text-sm font-medium text-interactive-primary underline"
          href="mailto:hello@mercflow.com"
        >
          Contact MercFlow
        </a>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <BillingIntervalToggle
        value={interval}
        onChange={setInterval}
        disabled={!availableIntervals.has("month") || !availableIntervals.has("year")}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {plansForInterval.map(({ tier, plan }) => {
          if (!plan) {
            return (
              <div
                key={tier}
                className="rounded-lg border border-dashed border-border-subtle p-5 text-sm text-content-secondary"
              >
                {formatTierLabel(tier)} is not available for this billing interval.
              </div>
            )
          }

          const isSelected = selectedPriceId === plan.price_id

          return (
            <PlanCard
              key={plan.price_id}
              name={formatTierLabel(tier)}
              priceLabel={formatPlanPrice(plan.amount, plan.currency, plan.interval)}
              features={getPlanTierFeatures(tier)}
              selected={isSelected}
              onSelect={() => {
                setSelectedTier(tier)
                onSelectPriceId(plan.price_id)
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
