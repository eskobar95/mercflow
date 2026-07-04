import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  loadPersistedSignupWizardState,
  persistSignupWizardState,
} from "@/lib/signupWizardStorage"

import type {
  SignupDomainDetails,
  SignupDomainType,
  SignupStoreDetails,
} from "@/lib/signupStoreOptions"

export type SignupWizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type SignupBillingDetails = {
  clientSecret: string | null
  customerId: string | null
  subscriptionId: string | null
  paymentIntentId: string | null
}

export type SignupProvisioningDetails = {
  jobId: string | null
  tenantUrl: string | null
  adminUrl: string | null
}

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
  billing: SignupBillingDetails
  provisioning: SignupProvisioningDetails
}

type SignupWizardContextValue = {
  state: SignupWizardState
  setInviteValidation: (input: { token: string; email: string | null }) => void
  completeStep2: (clerkUserId: string) => void
  updateStoreDetails: (details: Partial<SignupStoreDetails>) => void
  updateDomainDetails: (details: Partial<SignupDomainDetails>) => void
  setBillingDetails: (details: Partial<SignupBillingDetails>) => void
  setProvisioningDetails: (details: Partial<SignupProvisioningDetails>) => void
  goToStep: (step: SignupWizardStep) => void
}

const DEFAULT_BILLING: SignupBillingDetails = {
  clientSecret: null,
  customerId: null,
  subscriptionId: null,
  paymentIntentId: null,
}

const DEFAULT_PROVISIONING: SignupProvisioningDetails = {
  jobId: null,
  tenantUrl: null,
  adminUrl: null,
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
  billing: DEFAULT_BILLING,
  provisioning: DEFAULT_PROVISIONING,
}

const SignupWizardContext = createContext<SignupWizardContextValue | null>(null)

type SignupWizardProviderProps = {
  children: ReactNode
}

export function SignupWizardProvider({
  children,
}: SignupWizardProviderProps): React.ReactElement {
  const [state, setState] = useState<SignupWizardState>(
    () => loadPersistedSignupWizardState() ?? DEFAULT_STATE,
  )

  useEffect(() => {
    persistSignupWizardState(state)
  }, [state])

  const setInviteValidation = useCallback(
    (input: { token: string; email: string | null }): void => {
      setState((current) => ({
        ...current,
        inviteToken: input.token,
        inviteEmail: input.email,
        currentStep: current.currentStep > 1 ? current.currentStep : (2 as SignupWizardStep),
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

  const setBillingDetails = useCallback((details: Partial<SignupBillingDetails>): void => {
    setState((current) => ({
      ...current,
      billing: {
        ...current.billing,
        ...details,
      },
    }))
  }, [])

  const setProvisioningDetails = useCallback(
    (details: Partial<SignupProvisioningDetails>): void => {
      setState((current) => ({
        ...current,
        provisioning: {
          ...current.provisioning,
          ...details,
        },
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
      setBillingDetails,
      setProvisioningDetails,
      goToStep,
    }),
    [
      state,
      setInviteValidation,
      completeStep2,
      updateStoreDetails,
      updateDomainDetails,
      setBillingDetails,
      setProvisioningDetails,
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
