import { ClerkProvider } from "@clerk/react"
import type { ReactNode } from "react"

type OperatorClerkRootProps = {
  children: ReactNode
}

export function OperatorClerkRoot({ children }: OperatorClerkRootProps): ReactNode {
  const publishableKey = import.meta.env.VITE_PLATFORM_CLERK_PUBLISHABLE_KEY

  if (!publishableKey) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-appCanvas px-6">
        <p className="max-w-md text-center text-sm text-content-secondary">
          Set{" "}
          <code className="font-mono text-content-primary">
            VITE_PLATFORM_CLERK_PUBLISHABLE_KEY
          </code>{" "}
          in <code className="font-mono text-content-primary">.env.local</code>{" "}
          to start Platform Console.
        </p>
      </div>
    )
  }

  return (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      {children}
    </ClerkProvider>
  )
}
