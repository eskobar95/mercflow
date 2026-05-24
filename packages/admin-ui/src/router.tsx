import { createBrowserRouter } from "react-router-dom"

import { AdminShell } from "@/components/layout/AdminShell"

export type AppRouteHandle = {
  title: string
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AdminShell />,
    children: [
      {
        index: true,
        handle: { title: "Home" } satisfies AppRouteHandle,
        lazy: async () => {
          const { HomePage } = await import("@/pages/HomePage")
          return { Component: HomePage }
        },
      },
      {
        path: "products/new",
        handle: { title: "New product" } satisfies AppRouteHandle,
        lazy: async () => {
          const { ProductNewPage } = await import("@/pages/ProductNewPage")
          return { Component: ProductNewPage }
        },
      },
      {
        path: "products/:productId",
        handle: { title: "Product" } satisfies AppRouteHandle,
        lazy: async () => {
          const { ProductDetailPage } = await import("@/pages/ProductDetailPage")
          return { Component: ProductDetailPage }
        },
      },
      {
        path: "products",
        handle: { title: "Products" } satisfies AppRouteHandle,
        lazy: async () => {
          const { ProductListPage } = await import("@/pages/ProductListPage")
          return { Component: ProductListPage }
        },
      },
      {
        path: "orders",
        handle: { title: "Orders" } satisfies AppRouteHandle,
        lazy: async () => {
          const { OrdersPage } = await import("@/pages/OrdersPage")
          return { Component: OrdersPage }
        },
      },
      {
        path: "customers/:customerId",
        handle: { title: "Customer" } satisfies AppRouteHandle,
        lazy: async () => {
          const { CustomerDetailPage } = await import("@/pages/CustomerDetailPage")
          return { Component: CustomerDetailPage }
        },
      },
      {
        path: "customers",
        handle: { title: "Customers" } satisfies AppRouteHandle,
        lazy: async () => {
          const { CustomersListPage } = await import("@/pages/CustomersListPage")
          return { Component: CustomersListPage }
        },
      },
      {
        path: "product-categories/new",
        handle: { title: "New category" } satisfies AppRouteHandle,
        lazy: async () => {
          const { ProductCategoryNewPage } = await import(
            "@/pages/ProductCategoryNewPage"
          )
          return { Component: ProductCategoryNewPage }
        },
      },
      {
        path: "product-categories/:categoryId",
        handle: { title: "Category" } satisfies AppRouteHandle,
        lazy: async () => {
          const { ProductCategoryDetailPage } = await import(
            "@/pages/ProductCategoryDetailPage"
          )
          return { Component: ProductCategoryDetailPage }
        },
      },
      {
        path: "product-categories",
        handle: { title: "Categories" } satisfies AppRouteHandle,
        lazy: async () => {
          const { ProductCategoryListPage } = await import(
            "@/pages/ProductCategoryListPage"
          )
          return { Component: ProductCategoryListPage }
        },
      },
      {
        path: "content/articles",
        handle: { title: "Articles" } satisfies AppRouteHandle,
        lazy: async () => {
          const { ContentArticlesPage } = await import("@/pages/ContentArticlesPage")
          return { Component: ContentArticlesPage }
        },
      },
      {
        path: "content/pages",
        handle: { title: "Pages" } satisfies AppRouteHandle,
        lazy: async () => {
          const { ContentPagesPage } = await import("@/pages/ContentPagesPage")
          return { Component: ContentPagesPage }
        },
      },
      {
        path: "content/globals",
        handle: { title: "Globals" } satisfies AppRouteHandle,
        lazy: async () => {
          const { ContentGlobalsPage } = await import("@/pages/ContentGlobalsPage")
          return { Component: ContentGlobalsPage }
        },
      },
      {
        path: "settings",
        handle: { title: "Settings" } satisfies AppRouteHandle,
        lazy: async () => {
          const { SettingsPage } = await import("@/pages/SettingsPage")
          return { Component: SettingsPage }
        },
      },
      {
        path: "settings/connectors",
        handle: { title: "Connectors" } satisfies AppRouteHandle,
        lazy: async () => {
          const { ConnectorsPage } = await import("@/pages/ConnectorsPage")
          return { Component: ConnectorsPage }
        },
      },
      {
        path: "settings/workspace",
        handle: { title: "Workspace" } satisfies AppRouteHandle,
        lazy: async () => {
          const { PlaceholderPage } = await import("@/pages/PlaceholderPage")
          return {
            Component: () => (
              <PlaceholderPage
                title="Workspace"
                description="Store name, logo, default currency, timezone, and the languages your storefront speaks — all in one place."
                fallback={{ label: "Open Connectors", to: "/settings/connectors" }}
              />
            ),
          }
        },
      },
      {
        path: "settings/team",
        handle: { title: "Team" } satisfies AppRouteHandle,
        lazy: async () => {
          const { PlaceholderPage } = await import("@/pages/PlaceholderPage")
          return {
            Component: () => (
              <PlaceholderPage
                title="Team"
                description="Invite teammates, assign owner / admin / support roles, and audit the last sign-in for each member."
                fallback={{ label: "Open General settings", to: "/settings" }}
              />
            ),
          }
        },
      },
      {
        path: "settings/billing",
        handle: { title: "Billing" } satisfies AppRouteHandle,
        lazy: async () => {
          const { PlaceholderPage } = await import("@/pages/PlaceholderPage")
          return {
            Component: () => (
              <PlaceholderPage
                title="Billing"
                description="Current plan, invoices, billing cycle, and the card on file for your MercFlow workspace."
                fallback={{ label: "Open General settings", to: "/settings" }}
              />
            ),
          }
        },
      },
      {
        path: "list-demo",
        handle: { title: "List demo" } satisfies AppRouteHandle,
        lazy: async () => {
          const { ListDemoPage } = await import("@/pages/ListDemoPage")
          return { Component: ListDemoPage }
        },
      },
      {
        path: "*",
        handle: { title: "Not found" } satisfies AppRouteHandle,
        lazy: async () => {
          const { NotFoundPage } = await import("@/pages/NotFoundPage")
          return { Component: NotFoundPage }
        },
      },
    ],
  },
])
