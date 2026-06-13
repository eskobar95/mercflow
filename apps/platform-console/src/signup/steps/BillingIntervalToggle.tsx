import type { BillingInterval } from "@/types/platformPlan"

type BillingIntervalToggleProps = {
  value: BillingInterval
  onChange: (interval: BillingInterval) => void
  disabled?: boolean
}

const INTERVAL_OPTIONS: Array<{ value: BillingInterval; label: string }> = [
  { value: "month", label: "Monthly" },
  { value: "year", label: "Annual" },
]

export function BillingIntervalToggle({
  value,
  onChange,
  disabled = false,
}: BillingIntervalToggleProps): React.ReactElement {
  return (
    <div
      className="inline-flex rounded-md border border-border-subtle bg-surface-appCanvas p-1"
      role="group"
      aria-label="Billing interval"
    >
      {INTERVAL_OPTIONS.map((option) => {
        const isSelected = value === option.value

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={isSelected}
            className={`rounded px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              isSelected
                ? "bg-interactive-primary text-content-inverse"
                : "text-content-secondary hover:text-content-primary"
            }`}
            onClick={() => {
              onChange(option.value)
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
