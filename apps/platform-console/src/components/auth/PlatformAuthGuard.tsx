import { SignIn, useAuth, useUser } from "@clerk/react"
import type { ReactNode } from "react"

import { isAllowedOperatorEmail } from "@/lib/operatorEmailDomain"

const ALLOWED_DOMAIN =
  import.meta.env.VITE_PLATFORM_ALLOWED_EMAIL_DOMAIN ?? "mercflow.shop"

type Props = {
  children: ReactNode
}

function PlatformAccessDenied(): ReactNode {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface-appCanvas px-6">
      <div className="max-w-md rounded-lg border border-border-subtle bg-surface-raised p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-content-primary">
          Access restricted
        </h1>
        <p className="mt-2 text-sm text-content-secondary">
          Platform Console is limited to @{ALLOWED_DOMAIN} operator accounts.
        </p>
      </div>
    </div>
  )
}

function PlatformLoading(): ReactNode {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface-appCanvas">
      <p className="text-sm text-content-secondary">Loading session…</p>
    </div>
  )
}

export function PlatformAuthGuard({ children }: Props): ReactNode {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()

  if (!isLoaded) {
    return <PlatformLoading />
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-appCanvas">
        <SignIn routing="hash" />
      </div>
    )
  }

  const email = user?.primaryEmailAddress?.emailAddress ?? null
  if (!isAllowedOperatorEmail(email, ALLOWED_DOMAIN)) {
    return <PlatformAccessDenied />
  }

  return children
}
