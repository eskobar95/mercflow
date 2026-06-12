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
        handle: { title: "Create product" } satisfies AppRouteHandle,
        lazy: async () => {
          const { ProductCreatePage } = await import("@/pages/ProductCreatePage")
          return { Component: ProductCreatePage }
        },
      },
      {
        path: "products/:productId/edit",
        handle: { title: "Edit product" } satisfies AppRouteHandle,
        lazy: async () => {
          const { ProductEditPage } = await import("@/pages/ProductEditPage")
          return { Component: ProductEditPage }
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
        path: "orders/pick-list",
        handle: { title: "Pick list" } satisfies AppRouteHandle,
        lazy: async () => {
          const { OrdersPickListPage } = await import("@/pages/OrdersPickListPage")
          return { Component: OrdersPickListPage }
        },
      },
      {
        path: "orders/:orderId",
        handle: { title: "Order" } satisfies AppRouteHandle,
        lazy: async () => {
          const { OrderDetailPage } = await import("@/pages/OrderDetailPage")
          return { Component: OrderDetailPage }
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
        path: "subscriptions/:subscriptionId",
        handle: { title: "Subscription" } satisfies AppRouteHandle,
        lazy: async () => {
          const { SubscriptionDetailPage } = await import("@/pages/SubscriptionDetailPage")
          return { Component: SubscriptionDetailPage }
        },
      },
      {
        path: "subscriptions",
        handle: { title: "Subscriptions" } satisfies AppRouteHandle,
        lazy: async () => {
          const { SubscriptionsListPage } = await import("@/pages/SubscriptionsListPage")
          return { Component: SubscriptionsListPage }
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
        path: "content/articles/new",
        handle: { title: "New article" } satisfies AppRouteHandle,
        lazy: async () => {
          const { ArticleEditPage } = await import("@/pages/ArticleEditPage")
          return { Component: ArticleEditPage }
        },
      },
      {
        path: "content/articles/:articleId",
        handle: { title: "Article" } satisfies AppRouteHandle,
        lazy: async () => {
          const { ArticleEditPage } = await import("@/pages/ArticleEditPage")
          return { Component: ArticleEditPage }
        },
      },
      {
        path: "content/articles",
        handle: { title: "Articles" } satisfies AppRouteHandle,
        lazy: async () => {
          const { ArticlesListPage } = await import("@/pages/ArticlesListPage")
          return { Component: ArticlesListPage }
        },
      },
      {
        path: "content/pages/new",
        handle: { title: "New page" } satisfies AppRouteHandle,
        lazy: async () => {
          const { PageEditPage } = await import("@/pages/PageEditPage")
          return { Component: PageEditPage }
        },
      },
      {
        path: "content/pages/:pageId",
        handle: { title: "Edit page" } satisfies AppRouteHandle,
        lazy: async () => {
          const { PageEditPage } = await import("@/pages/PageEditPage")
          return { Component: PageEditPage }
        },
      },
      {
        path: "content/pages",
        handle: { title: "Pages" } satisfies AppRouteHandle,
        lazy: async () => {
          const { PagesListPage } = await import("@/pages/PagesListPage")
          return { Component: PagesListPage }
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
        path: "inventory/purchase-orders/new",
        handle: { title: "New purchase order" } satisfies AppRouteHandle,
        lazy: async () => {
          const { PurchaseOrderCreatePage } = await import("@/pages/PurchaseOrderCreatePage")
          return { Component: PurchaseOrderCreatePage }
        },
      },
      {
        path: "inventory/purchase-orders/:poId/receive",
        handle: { title: "Receive purchase order" } satisfies AppRouteHandle,
        lazy: async () => {
          const { PurchaseOrderReceivePage } = await import(
            "@/pages/PurchaseOrderReceivePage"
          )
          return { Component: PurchaseOrderReceivePage }
        },
      },
      {
        path: "inventory/purchase-orders",
        handle: { title: "Purchase orders" } satisfies AppRouteHandle,
        lazy: async () => {
          const { PurchaseOrdersListPage } = await import("@/pages/PurchaseOrdersListPage")
          return { Component: PurchaseOrdersListPage }
        },
      },
      {
        path: "inventory/suppliers/new",
        handle: { title: "New supplier" } satisfies AppRouteHandle,
        lazy: async () => {
          const { SupplierFormPage } = await import("@/pages/SupplierFormPage")
          return { Component: SupplierFormPage }
        },
      },
      {
        path: "inventory/suppliers/:supplierId",
        handle: { title: "Edit supplier" } satisfies AppRouteHandle,
        lazy: async () => {
          const { SupplierFormPage } = await import("@/pages/SupplierFormPage")
          return { Component: SupplierFormPage }
        },
      },
      {
        path: "inventory/suppliers",
        handle: { title: "Suppliers" } satisfies AppRouteHandle,
        lazy: async () => {
          const { SuppliersListPage } = await import("@/pages/SuppliersListPage")
          return { Component: SuppliersListPage }
        },
      },
      {
        path: "inventory",
        handle: { title: "Inventory" } satisfies AppRouteHandle,
        lazy: async () => {
          const { InventoryOverviewPage } = await import("@/pages/InventoryOverviewPage")
          return { Component: InventoryOverviewPage }
        },
      },
      {
        path: "feed",
        handle: { title: "Feed" } satisfies AppRouteHandle,
        lazy: async () => {
          const { FeedOverviewPage } = await import("@/pages/FeedOverviewPage")
          return { Component: FeedOverviewPage }
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
        path: "settings/general",
        handle: { title: "General settings" } satisfies AppRouteHandle,
        lazy: async () => {
          const { PlaceholderPage } = await import("@/pages/PlaceholderPage")
          return {
            Component: () => (
              <PlaceholderPage
                title="General settings"
                description="Workspace defaults — store name, locales, taxes, shipping zones, currencies, and the notifications operators receive."
                fallback={{ label: "Back to settings", to: "/settings" }}
              />
            ),
          }
        },
      },
      {
        path: "settings/email",
        handle: { title: "Email settings" } satisfies AppRouteHandle,
        lazy: async () => {
          const { EmailSettingsPage } = await import("@/pages/EmailSettingsPage")
          return { Component: EmailSettingsPage }
        },
      },
      {
        path: "settings/shipping/packaging",
        handle: { title: "Packaging" } satisfies AppRouteHandle,
        lazy: async () => {
          const { PackagingSettingsPage } = await import("@/pages/PackagingSettingsPage")
          return { Component: PackagingSettingsPage }
        },
      },
      {
        path: "settings/shipping/carriers",
        handle: { title: "Carriers" } satisfies AppRouteHandle,
        lazy: async () => {
          const { ShipmondoConnectorSettingsPage } = await import(
            "@/pages/ShipmondoConnectorSettingsPage"
          )
          return { Component: ShipmondoConnectorSettingsPage }
        },
      },
      {
        path: "settings/payments",
        handle: { title: "Payments" } satisfies AppRouteHandle,
        lazy: async () => {
          const { StripeConnectorSettingsPage } = await import("@/pages/StripeConnectorSettingsPage")
          return { Component: StripeConnectorSettingsPage }
        },
      },
      {
        path: "settings/subscriptions",
        handle: { title: "Subscriptions" } satisfies AppRouteHandle,
        lazy: async () => {
          const { SubscriptionsSettingsPage } = await import("@/pages/SubscriptionsSettingsPage")
          return { Component: SubscriptionsSettingsPage }
        },
      },
      {
        path: "settings/store-details",
        handle: { title: "Store details" } satisfies AppRouteHandle,
        lazy: async () => {
          const { PlaceholderPage } = await import("@/pages/PlaceholderPage")
          return {
            Component: () => (
              <PlaceholderPage
                title="Store details"
                description="Domain, branding, legal pages, and the public identity your storefront presents to customers."
                fallback={{ label: "Back to settings", to: "/settings" }}
              />
            ),
          }
        },
      },
      {
        path: "settings/seo",
        handle: { title: "SEO" } satisfies AppRouteHandle,
        lazy: async () => {
          const { RedirectToSeoOrganisation } = await import("@/routing/settingsRedirects")
          return { Component: RedirectToSeoOrganisation }
        },
      },
      {
        path: "settings/custom-data",
        handle: { title: "Custom data" } satisfies AppRouteHandle,
        lazy: async () => {
          const { CustomDataSettingsPage } = await import("@/pages/CustomDataSettingsPage")
          return { Component: CustomDataSettingsPage }
        },
      },
      {
        path: "settings/packaging",
        handle: { title: "Packaging" } satisfies AppRouteHandle,
        lazy: async () => {
          const { RedirectToShippingPackaging } = await import("@/routing/settingsRedirects")
          return { Component: RedirectToShippingPackaging }
        },
      },
      {
        path: "settings/seo/organisation",
        handle: { title: "SEO — Organisation" } satisfies AppRouteHandle,
        lazy: async () => {
          const { SeoOrganizationSettingsPage } = await import(
            "@/pages/SeoOrganizationSettingsPage"
          )
          return { Component: SeoOrganizationSettingsPage }
        },
      },
      {
        path: "settings/seo/structured-data",
        handle: { title: "SEO — Structured data" } satisfies AppRouteHandle,
        lazy: async () => {
          const { SeoStructuredDataSettingsPage } = await import(
            "@/pages/SeoStructuredDataSettingsPage"
          )
          return { Component: SeoStructuredDataSettingsPage }
        },
      },
      {
        path: "settings/seo/slug",
        handle: { title: "SEO — Slugs" } satisfies AppRouteHandle,
        lazy: async () => {
          const { SeoSlugSettingsPage } = await import("@/pages/SeoSlugSettingsPage")
          return { Component: SeoSlugSettingsPage }
        },
      },
      {
        path: "settings/seo/redirects",
        handle: { title: "SEO — Redirects" } satisfies AppRouteHandle,
        lazy: async () => {
          const { RedirectsListPage } = await import("@/pages/RedirectsListPage")
          return { Component: RedirectsListPage }
        },
      },
      {
        path: "settings/seo/sitemap",
        handle: { title: "SEO — Sitemap" } satisfies AppRouteHandle,
        lazy: async () => {
          const { SitemapSettingsPage } = await import("@/pages/SitemapSettingsPage")
          return { Component: SitemapSettingsPage }
        },
      },
      {
        path: "settings/seo/robots",
        handle: { title: "SEO — Robots.txt" } satisfies AppRouteHandle,
        lazy: async () => {
          const { RobotsSettingsPage } = await import("@/pages/RobotsSettingsPage")
          return { Component: RobotsSettingsPage }
        },
      },
      {
        path: "settings/connectors/gtm",
        handle: { title: "Google Tag Manager" } satisfies AppRouteHandle,
        lazy: async () => {
          const { GtmConnectorSettingsPage } = await import(
            "@/pages/GtmConnectorSettingsPage"
          )
          return { Component: GtmConnectorSettingsPage }
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
        path: "settings/connectors/stripe",
        handle: { title: "Stripe connector" } satisfies AppRouteHandle,
        lazy: async () => {
          const { RedirectToPayments } = await import("@/routing/settingsRedirects")
          return { Component: RedirectToPayments }
        },
      },
      {
        path: "settings/connectors/plunk",
        handle: { title: "Plunk email" } satisfies AppRouteHandle,
        lazy: async () => {
          const { PlunkConnectorPage } = await import("@/pages/PlunkConnectorPage")
          return { Component: PlunkConnectorPage }
        },
      },
      {
        path: "settings/connectors/shipmondo",
        handle: { title: "Shipmondo" } satisfies AppRouteHandle,
        lazy: async () => {
          const { RedirectToShippingCarriers } = await import("@/routing/settingsRedirects")
          return { Component: RedirectToShippingCarriers }
        },
      },
      {
        path: "settings/connectors/:connectorType",
        handle: { title: "Connector" } satisfies AppRouteHandle,
        lazy: async () => {
          const { ConnectorDetailPlaceholderPage } = await import(
            "@/pages/ConnectorDetailPlaceholderPage"
          )
          return { Component: ConnectorDetailPlaceholderPage }
        },
      },
      {
        path: "settings/workspace",
        handle: { title: "Workspace" } satisfies AppRouteHandle,
        lazy: async () => {
          const { RedirectToStoreDetails } = await import("@/routing/settingsRedirects")
          return { Component: RedirectToStoreDetails }
        },
      },
      {
        path: "settings/team",
        handle: { title: "Team" } satisfies AppRouteHandle,
        lazy: async () => {
          const { TeamSettingsPage } = await import("@/pages/settings/TeamSettingsPage")
          return { Component: TeamSettingsPage }
        },
      },
      {
        path: "settings/billing",
        handle: { title: "Billing" } satisfies AppRouteHandle,
        lazy: async () => {
          const { BillingSettingsPage } = await import("@/pages/settings/BillingSettingsPage")
          return { Component: BillingSettingsPage }
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
