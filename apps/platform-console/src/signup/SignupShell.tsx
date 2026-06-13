import { ClerkProvider } from "@clerk/react"
import { Outlet } from "react-router-dom"

import { SignupGate } from "@/signup/SignupGate"
import { SignupWizardProvider } from "@/signup/SignupWizardContext"

const storeAdminClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

export function SignupShell(): React.ReactElement {
  if (!storeAdminClerkKey) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-appCanvas px-6">
        <p className="max-w-md text-center text-sm text-content-secondary">
          Set{" "}
          <code className="font-mono text-content-primary">
            VITE_CLERK_PUBLISHABLE_KEY
          </code>{" "}
          (mercflow-store-admin Clerk app) in{" "}
          <code className="font-mono text-content-primary">.env.local</code> to
          enable merchant signup.
        </p>
      </div>
    )
  }

  return (
    <ClerkProvider publishableKey={storeAdminClerkKey} afterSignOutUrl="/signup">
      <SignupWizardProvider>
        <SignupGate>
          <div className="min-h-[100dvh] bg-surface-appCanvas px-6 py-10">
            <Outlet />
          </div>
        </SignupGate>
      </SignupWizardProvider>
    </ClerkProvider>
  )
}
