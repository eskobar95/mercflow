import { PlaceholderPage } from "@/pages/PlaceholderPage"

export function ConnectorsPage(): JSX.Element {
  return (
    <PlaceholderPage
      title="Connectors"
      description="Sales channels, payment providers, shipping carriers, and webhooks live here. Add a Stripe key, plug in a fulfilment carrier, or wire a webhook from one screen."
      fallback={{ label: "Open the catalogue", to: "/products" }}
    />
  )
}
