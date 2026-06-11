import { createBrowserRouter, Navigate } from "react-router-dom"

import { PlatformShell } from "@/components/layout/PlatformShell"
import { PlatformHomePage } from "@/pages/PlatformHomePage"
import { PlatformPlaceholderPage } from "@/pages/PlatformPlaceholderPage"
import { PlatformQueuesPage } from "@/pages/PlatformQueuesPage"

export const platformRouter = createBrowserRouter([
  {
    path: "/",
    element: <PlatformShell />,
    children: [
      { index: true, element: <PlatformHomePage /> },
      {
        path: "tenants",
        element: (
          <PlatformPlaceholderPage
            title="Tenants"
            description="List stores, provision new tenants, and suspend misbehaving shops."
          />
        ),
      },
      {
        path: "queues",
        element: <PlatformQueuesPage />,
      },
      {
        path: "email",
        element: (
          <PlatformPlaceholderPage
            title="Email"
            description="Cross-tenant delivery history and SES domain health."
          />
        ),
      },
      {
        path: "system",
        element: (
          <PlatformPlaceholderPage
            title="System"
            description="Hetzner, Neon, and Redis operational metrics."
          />
        ),
      },
      {
        path: "audit",
        element: (
          <PlatformPlaceholderPage
            title="Audit"
            description="Operator action history across the platform."
          />
        ),
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
])
