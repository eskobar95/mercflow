import { PlaceholderPage } from "@/pages/PlaceholderPage"

export function ContentGlobalsPage(): JSX.Element {
  return (
    <PlaceholderPage
      title="Globals"
      description="Reusable content fragments — headers, footers, banners — translated once and pulled into every storefront page that needs them."
      fallback={{ label: "Edit a category's content", to: "/product-categories" }}
    />
  )
}
