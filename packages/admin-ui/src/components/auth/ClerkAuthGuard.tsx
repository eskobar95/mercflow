import { createContext, type ReactNode, useContext, useMemo } from "react"
import { SignIn, useAuth, useClerk, useOrganization, useUser } from "@clerk/react"

import { MainLoadingFallback } from "@/components/ui/MainLoadingFallback"
import { useAdminTokenSync } from "@/hooks/useAdminTokenSync"

// ---------------------------------------------------------------------------
// Context — Clerk session data available to all children of ClerkAuthGuard
// ---------------------------------------------------------------------------

type ClerkSession = {
  displayName: string
  initials: string
  email: string | null
  orgName: string | null
  orgId: string | null
  signOut: () => void
}

const ClerkSessionContext = createContext<ClerkSession | null>(null)

/** Returns Clerk session data when Clerk is active, otherwise null. */
export function useClerkSession(): ClerkSession | null {
  return useContext(ClerkSessionContext)
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

// ---------------------------------------------------------------------------
// Guard
// ---------------------------------------------------------------------------

type Props = {
  children: ReactNode
}

/**
 * Auth guard that wraps the admin shell when Clerk is configured.
 *
 * Only mount this component inside `<ClerkProvider>`. It:
 *   1. Shows a loading screen while Clerk bootstraps.
 *   2. Shows the Clerk `<SignIn>` widget when the user is signed out.
 *   3. Syncs the active Clerk JWT to `adminTokenStore` on every render.
 *   4. Provides `ClerkSessionContext` to all children.
 *   5. Passes children through when the user is authenticated.
 */
export function ClerkAuthGuard({ children }: Props): ReactNode {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user } = useUser()
  const { organization } = useOrganization()
  const clerk = useClerk()

  useAdminTokenSync(getToken)

  const session = useMemo<ClerkSession | null>(() => {
    if (!user) return null
    const firstName = user.firstName ?? ""
    const lastName = user.lastName ?? ""
    const fullName = [firstName, lastName].filter(Boolean).join(" ")
    const email = user.primaryEmailAddress?.emailAddress ?? null
    const displayName = fullName || email?.split("@")[0] || "Admin"
    return {
      displayName,
      initials: deriveInitials(displayName),
      email,
      orgName: organization?.name ?? null,
      orgId: organization?.id ?? null,
      signOut: () => { void clerk.signOut() },
    }
  }, [user, organization, clerk])

  if (!isLoaded) {
    return <MainLoadingFallback />
  }

  if (!isSignedIn) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-surface-appCanvas">
        <SignIn routing="hash" />
      </div>
    )
  }

  return (
    <ClerkSessionContext.Provider value={session}>
      {children}
    </ClerkSessionContext.Provider>
  )
}
