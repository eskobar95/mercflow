import { PlaceholderPage } from "@/pages/PlaceholderPage"

export function ContentPagesPage(): JSX.Element {
  return (
    <PlaceholderPage
      title="Pages"
      description="Standalone storefront pages — About, FAQ, Shipping — built with reusable blocks and the same content fields as products."
      fallback={{ label: "Edit a product's content", to: "/products" }}
    />
  )
}
