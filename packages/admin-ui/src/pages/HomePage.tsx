import { Link } from "react-router-dom"

type ShortcutCard = {
  label: string
  description: string
  to: string
}

const SHORTCUTS: ShortcutCard[] = [
  {
    label: "Products",
    description: "Catalogue, variants, and inventory.",
    to: "/products",
  },
  {
    label: "Categories",
    description: "Taxonomy, hierarchy, and content.",
    to: "/product-categories",
  },
  {
    label: "Articles",
    description: "Editorial CMS for the storefront.",
    to: "/content/articles",
  },
  {
    label: "Connectors",
    description: "Channels, payments, and webhooks.",
    to: "/settings/connectors",
  },
]

/**
 * Default home route. Operational dashboard placeholder with the
 * Claude vellum-editorial chrome and amber accent discipline.
 */
export function HomePage(): JSX.Element {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 md:px-10 md:py-12">
      <header className="max-w-2xl">
        <p className="text-2xs font-semibold uppercase tracking-label text-content-tertiary">
          Workspace
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-content-primary">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-content-secondary">
          MercFlow admin shell is live. Pick a workspace below or use the sidebar
          to navigate. Page content for each route ships in upcoming sprints.
        </p>
      </header>

      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-label text-content-tertiary">
            Quick access
          </h2>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SHORTCUTS.map((card) => (
            <li key={card.to}>
              <Link
                to={card.to}
                className="group flex h-full flex-col justify-between rounded-lg border border-border-subtle bg-surface-default p-5 transition-colors duration-150 hover:border-border-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              >
                <div>
                  <p className="text-sm font-semibold text-content-primary">
                    {card.label}
                  </p>
                  <p className="mt-1 text-xs text-content-secondary">
                    {card.description}
                  </p>
                </div>
                <span
                  className="mt-6 inline-flex items-center gap-1 text-2xs font-medium uppercase tracking-label text-amber-text opacity-80 transition-opacity duration-150 group-hover:opacity-100"
                  aria-hidden
                >
                  Open
                  <span aria-hidden>→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-lg border border-border-subtle bg-surface-default p-6 md:p-8">
        <h2 className="text-sm font-semibold text-content-primary">
          Shell readiness
        </h2>
        <p className="mt-1 text-xs text-content-secondary">
          Foundational layout in place. Future passes will land real product
          lists, order tables, and content editors.
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Design tokens", value: "Brand Kit v1" },
            { label: "Navigation", value: "Routed + responsive" },
            { label: "Accent", value: "Amber, discipline-only" },
          ].map((row) => (
            <div
              key={row.label}
              className="rounded-md bg-surface-canvas/70 px-4 py-3"
            >
              <dt className="text-2xs font-medium uppercase tracking-label text-content-tertiary">
                {row.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-content-primary">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
