import { createBrowserRouter, Navigate } from "react-router-dom"

import { PlatformShell } from "@/components/layout/PlatformShell"
import { PlatformAuditPage } from "@/pages/PlatformAuditPage"
import { PlatformEmailPage } from "@/pages/PlatformEmailPage"
import { PlatformHomePage } from "@/pages/PlatformHomePage"
import { PlatformQueuesPage } from "@/pages/PlatformQueuesPage"
import { PlatformSystemPage } from "@/pages/PlatformSystemPage"
import { PlatformTenantsPage } from "@/pages/PlatformTenantsPage"

export const platformRouter = createBrowserRouter([
  {
    path: "/",
    element: <PlatformShell />,
    children: [
      { index: true, element: <PlatformHomePage /> },
      {
        path: "tenants",
        element: <PlatformTenantsPage />,
      },
      {
        path: "queues",
        element: <PlatformQueuesPage />,
      },
      { path: "email", element: <PlatformEmailPage /> },
      { path: "system", element: <PlatformSystemPage /> },
      { path: "audit", element: <PlatformAuditPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
])
