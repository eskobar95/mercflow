import type { RouteObject } from "react-router-dom"
import { createBrowserRouter } from "react-router-dom"

import { AdminShell } from "@/components/layout/AdminShell"
import { HomePage } from "@/pages/HomePage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { PlaceholderPage } from "@/pages/PlaceholderPage"

export type MercflowRouteHandle = {
  title: string
}

/**
 * Route tree for the MercFlow admin shell (shared by the browser router and tests).
 */
export const mercflowAdminShellRoutes: RouteObject[] = [
  {
    path: "/",
    element: <AdminShell />,
    children: [
      {
        index: true,
        element: <HomePage />,
        handle: { title: "Dashboard" } satisfies MercflowRouteHandle,
      },
      {
        path: "products",
        element: (
          <PlaceholderPage
            title="Products"
            description="Product catalog and editing tools will be added in Sprint 2."
          />
        ),
        handle: { title: "Products" } satisfies MercflowRouteHandle,
      },
      {
        path: "orders",
        element: (
          <PlaceholderPage
            title="Orders"
            description="Order queue and operations will be added in a later sprint."
          />
        ),
        handle: { title: "Orders" } satisfies MercflowRouteHandle,
      },
      {
        path: "customers",
        element: (
          <PlaceholderPage
            title="Customers"
            description="Customer profiles will be added in a later sprint."
          />
        ),
        handle: { title: "Customers" } satisfies MercflowRouteHandle,
      },
      {
        path: "categories",
        element: (
          <PlaceholderPage
            title="Categories"
            description="Category management will be added in a later sprint."
          />
        ),
        handle: { title: "Categories" } satisfies MercflowRouteHandle,
      },
      {
        path: "content/articles",
        element: (
          <PlaceholderPage
            title="Articles"
            description="Content tools will be added in a later sprint."
          />
        ),
        handle: { title: "Articles" } satisfies MercflowRouteHandle,
      },
      {
        path: "content/pages",
        element: (
          <PlaceholderPage
            title="Pages"
            description="Content tools will be added in a later sprint."
          />
        ),
        handle: { title: "Pages" } satisfies MercflowRouteHandle,
      },
      {
        path: "content/globals",
        element: (
          <PlaceholderPage
            title="Globals"
            description="Global content fields will be added in a later sprint."
          />
        ),
        handle: { title: "Globals" } satisfies MercflowRouteHandle,
      },
      {
        path: "settings/connectors",
        element: (
          <PlaceholderPage
            title="Connectors"
            description="Connector settings will be added in a later sprint."
          />
        ),
        handle: { title: "Connectors" } satisfies MercflowRouteHandle,
      },
      {
        path: "*",
        element: <NotFoundPage />,
        handle: { title: "Not found" } satisfies MercflowRouteHandle,
      },
    ],
  },
]

/**
 * Browser router for production / local dev.
 */
export function createMercflowAdminRouter(): ReturnType<typeof createBrowserRouter> {
  return createBrowserRouter(mercflowAdminShellRoutes)
}
