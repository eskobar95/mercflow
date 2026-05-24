import { PlaceholderPage } from "@/pages/PlaceholderPage"

export function ContentArticlesPage(): JSX.Element {
  return (
    <PlaceholderPage
      title="Articles"
      description="Editorial CMS for storefront articles — rich text, SEO, and media gallery on every entry. Draft, schedule, and translate alongside the catalogue."
      fallback={{ label: "Edit a product's content", to: "/products" }}
    />
  )
}
