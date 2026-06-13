import { isPublicSignupEnabled } from "@/lib/signupEnv"
import { SignupStepIndicator } from "@/signup/SignupStepIndicator"
import { useSignupWizard, type SignupWizardStep } from "@/signup/SignupWizardContext"
import { SignupStep2Account } from "@/signup/steps/SignupStep2Account"
import { SignupStep3StoreDetails } from "@/signup/steps/SignupStep3StoreDetails"
import { SignupStep4Domain } from "@/signup/steps/SignupStep4Domain"

function renderSignupStep(currentStep: SignupWizardStep): React.ReactElement {
  switch (currentStep) {
    case 1:
      return (
        <p className="text-sm text-content-secondary">
          Validating invite…
        </p>
      )
    case 2:
      return <SignupStep2Account />
    case 3:
      return <SignupStep3StoreDetails />
    case 4:
      return <SignupStep4Domain />
    default: {
      const _exhaustive: never = currentStep
      return _exhaustive
    }
  }
}

export function SignupPage(): React.ReactElement {
  const { state } = useSignupWizard()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-content-secondary">
          MercFlow signup
        </p>
        <h1 className="text-2xl font-semibold text-content-primary">
          Set up your store
        </h1>
        <p className="text-sm text-content-secondary">
          {isPublicSignupEnabled()
            ? "Complete the steps below to create your MercFlow store."
            : "You were invited to MercFlow. Complete the steps below to create your store."}
        </p>
        <SignupStepIndicator currentStep={state.currentStep} />
      </header>

      {renderSignupStep(state.currentStep)}
    </div>
  )
}
