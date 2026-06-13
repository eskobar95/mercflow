import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

import type {
  SignupDomainDetails,
  SignupDomainType,
  SignupStoreDetails,
} from "@/lib/signupStoreOptions"

export type SignupWizardStep = 1 | 2 | 3 | 4

export type SignupWizardState = {
  currentStep: SignupWizardStep
  inviteToken: string | null
  inviteEmail: string | null
  clerkUserId: string | null
  storeName: string
  currency: string
  country: string
  timezone: string
  domainType: SignupDomainType
  subdomain: string
  customDomain: string
}

type SignupWizardContextValue = {
  state: SignupWizardState
  setInviteValidation: (input: { token: string; email: string | null }) => void
  completeStep2: (clerkUserId: string) => void
  updateStoreDetails: (details: Partial<SignupStoreDetails>) => void
  updateDomainDetails: (details: Partial<SignupDomainDetails>) => void
  goToStep: (step: SignupWizardStep) => void
}

const DEFAULT_STATE: SignupWizardState = {
  currentStep: 1,
  inviteToken: null,
  inviteEmail: null,
  clerkUserId: null,
  storeName: "",
  currency: "dkk",
  country: "dk",
  timezone: "Europe/Copenhagen",
  domainType: "subdomain",
  subdomain: "",
  customDomain: "",
}

const SignupWizardContext = createContext<SignupWizardContextValue | null>(null)

type SignupWizardProviderProps = {
  children: ReactNode
}

export function SignupWizardProvider({
  children,
}: SignupWizardProviderProps): React.ReactElement {
  const [state, setState] = useState<SignupWizardState>(DEFAULT_STATE)

  const setInviteValidation = useCallback(
    (input: { token: string; email: string | null }): void => {
      setState((current) => ({
        ...current,
        inviteToken: input.token,
        inviteEmail: input.email,
        currentStep: 2,
      }))
    },
    [],
  )

  const completeStep2 = useCallback((clerkUserId: string): void => {
    setState((current) => ({
      ...current,
      clerkUserId,
      currentStep: 3,
    }))
  }, [])

  const updateStoreDetails = useCallback(
    (details: Partial<SignupStoreDetails>): void => {
      setState((current) => ({
        ...current,
        storeName: details.storeName ?? current.storeName,
        currency: details.currency ?? current.currency,
        country: details.country ?? current.country,
        timezone: details.timezone ?? current.timezone,
      }))
    },
    [],
  )

  const updateDomainDetails = useCallback(
    (details: Partial<SignupDomainDetails>): void => {
      setState((current) => ({
        ...current,
        domainType: details.domainType ?? current.domainType,
        subdomain: details.subdomain ?? current.subdomain,
        customDomain: details.customDomain ?? current.customDomain,
      }))
    },
    [],
  )

  const goToStep = useCallback((step: SignupWizardStep): void => {
    setState((current) => ({
      ...current,
      currentStep: step,
    }))
  }, [])

  const value = useMemo<SignupWizardContextValue>(
    () => ({
      state,
      setInviteValidation,
      completeStep2,
      updateStoreDetails,
      updateDomainDetails,
      goToStep,
    }),
    [
      state,
      setInviteValidation,
      completeStep2,
      updateStoreDetails,
      updateDomainDetails,
      goToStep,
    ],
  )

  return (
    <SignupWizardContext.Provider value={value}>
      {children}
    </SignupWizardContext.Provider>
  )
}

export function useSignupWizard(): SignupWizardContextValue {
  const context = useContext(SignupWizardContext)
  if (!context) {
    throw new Error("useSignupWizard must be used within SignupWizardProvider")
  }
  return context
}
