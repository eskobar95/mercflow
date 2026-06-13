type PlanCardProps = {
  name: string
  priceLabel: string
  features: readonly string[]
  selected: boolean
  onSelect: () => void
}

function CheckIcon(): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 text-interactive-primary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

export function PlanCard({
  name,
  priceLabel,
  features,
  selected,
  onSelect,
}: PlanCardProps): React.ReactElement {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex h-full flex-col rounded-lg border p-5 text-left transition-colors ${
        selected
          ? "border-interactive-primary bg-surface-raised shadow-sm"
          : "border-border-subtle bg-surface-appCanvas hover:border-border-strong"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-content-primary">{name}</h3>
          <p className="mt-1 text-lg font-semibold text-content-primary">{priceLabel}</p>
        </div>
        {selected ? <CheckIcon /> : null}
      </div>

      <ul className="mt-4 grid gap-2 text-sm text-content-secondary">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span aria-hidden="true" className="mt-1 text-content-tertiary">
              •
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </button>
  )
}
