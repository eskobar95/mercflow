import { createBrowserRouter, Navigate } from "react-router-dom"

import { PlatformShell } from "@/components/layout/PlatformShell"
import { PlatformAuditPage } from "@/pages/PlatformAuditPage"
import { PlatformEmailPage } from "@/pages/PlatformEmailPage"
import { PlatformHomePage } from "@/pages/PlatformHomePage"
import { PlatformPlaceholderPage } from "@/pages/PlatformPlaceholderPage"
import { PlatformSystemPage } from "@/pages/PlatformSystemPage"

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
        element: (
          <PlatformPlaceholderPage
            title="Queues"
            description="Monitor BullMQ queues, DLQ size, and failed job retries."
          />
        ),
      },
      { path: "email", element: <PlatformEmailPage /> },
      { path: "system", element: <PlatformSystemPage /> },
      { path: "audit", element: <PlatformAuditPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
])
