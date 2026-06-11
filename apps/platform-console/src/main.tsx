import { ClerkProvider } from "@clerk/react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"

import { PlatformAuthGuard } from "@/components/auth/PlatformAuthGuard"
import { platformRouter } from "@/router"

import "./index.css"

const publishableKey = import.meta.env.VITE_PLATFORM_CLERK_PUBLISHABLE_KEY

const rootElement = document.getElementById("root")
if (!rootElement) {
  throw new Error("Root element #root not found")
}

createRoot(rootElement).render(
  <StrictMode>
    {publishableKey ? (
      <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
        <PlatformAuthGuard>
          <RouterProvider router={platformRouter} />
        </PlatformAuthGuard>
      </ClerkProvider>
    ) : (
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
    )}
  </StrictMode>,
)
