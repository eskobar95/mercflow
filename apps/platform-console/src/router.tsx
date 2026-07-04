import { createBrowserRouter, Navigate } from "react-router-dom"

import { PlatformShell } from "@/components/layout/PlatformShell"
import { PlatformAuthGuard } from "@/components/auth/PlatformAuthGuard"
import { OperatorClerkRoot } from "@/components/auth/OperatorClerkRoot"
import { PlatformAuditPage } from "@/pages/PlatformAuditPage"
import { PlatformEmailPage } from "@/pages/PlatformEmailPage"
import { PlatformHomePage } from "@/pages/PlatformHomePage"
import { PlatformQueuesPage } from "@/pages/PlatformQueuesPage"
import { PlatformSystemPage } from "@/pages/PlatformSystemPage"
import { PlatformTenantsPage } from "@/pages/PlatformTenantsPage"
import { TenantDetailPage } from "@/pages/TenantDetailPage"
import { SignupPage } from "@/signup/SignupPage"
import { SignupBillingReturnPage } from "@/signup/steps/SignupStep5Billing"
import { SignupShell } from "@/signup/SignupShell"

export const platformRouter = createBrowserRouter([
  {
    path: "/signup",
    element: <SignupShell />,
    children: [
      { index: true, element: <SignupPage /> },
      { path: "billing/return", element: <SignupBillingReturnPage /> },
    ],
  },
  {
    path: "/",
    element: (
      <OperatorClerkRoot>
        <PlatformAuthGuard>
          <PlatformShell />
        </PlatformAuthGuard>
      </OperatorClerkRoot>
    ),
    children: [
      { index: true, element: <PlatformHomePage /> },
      {
        path: "tenants",
        element: <PlatformTenantsPage />,
      },
      {
        path: "tenants/:storeId",
        element: <TenantDetailPage />,
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
