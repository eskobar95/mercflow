const SIGNUP_STEPS = [
  { step: 1, label: "Invite" },
  { step: 2, label: "Account" },
  { step: 3, label: "Store" },
  { step: 4, label: "Domain" },
  { step: 5, label: "Billing" },
  { step: 6, label: "Provisioning" },
  { step: 7, label: "Ready" },
] as const

type SignupStepIndicatorProps = {
  currentStep: number
}

export function SignupStepIndicator({
  currentStep,
}: SignupStepIndicatorProps): React.ReactElement {
  return (
    <ol className="flex flex-wrap gap-2">
      {SIGNUP_STEPS.map(({ step, label }) => {
        const isActive = step === currentStep
        const isComplete = step < currentStep

        return (
          <li
            key={step}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              isActive
                ? "bg-interactive-primary text-content-inverse"
                : isComplete
                  ? "bg-surface-subtle text-content-primary"
                  : "bg-surface-appCanvas text-content-secondary"
            }`}
          >
            {step}. {label}
          </li>
        )
      })}
    </ol>
  )
}
