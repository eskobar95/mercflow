import { PlaceholderPage } from "@/pages/PlaceholderPage"

export function OrdersPage(): JSX.Element {
  return (
    <PlaceholderPage
      title="Orders"
      description="A single sheet of every incoming order: filter by status or channel, dispatch fulfilment, review refunds, and jump to the customer on each row."
      fallback={{ label: "Open the catalogue", to: "/products" }}
    />
  )
}
