import { StrictMode } from "react"
import { ClerkProvider } from "@clerk/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"

import { ClerkAuthGuard } from "@/components/auth/ClerkAuthGuard"
import { ToastProvider } from "@/components/ui/Toast"

import { router } from "./router"
import "./index.css"

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const el = document.getElementById("root")
if (!el) {
  throw new Error("Root element #root not found")
}

const routerContent = (
  <QueryClientProvider client={queryClient}>
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  </QueryClientProvider>
)

createRoot(el).render(
  <StrictMode>
    {CLERK_PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
        <ClerkAuthGuard>{routerContent}</ClerkAuthGuard>
      </ClerkProvider>
    ) : (
      routerContent
    )}
  </StrictMode>,
)
