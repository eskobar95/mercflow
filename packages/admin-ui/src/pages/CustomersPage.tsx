import { PlaceholderPage } from "@/pages/PlaceholderPage"

export function CustomersPage(): JSX.Element {
  return (
    <PlaceholderPage
      title="Customers"
      description="Look up any customer, jump to their orders, see lifetime value at a glance, and build segments for campaigns."
      fallback={{ label: "Open the catalogue", to: "/products" }}
    />
  )
}
