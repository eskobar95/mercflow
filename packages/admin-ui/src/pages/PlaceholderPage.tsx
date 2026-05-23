import { Link } from "react-router-dom"

import { IconArrowRight, IconSparkle } from "@/components/ui/icons"

type PlaceholderPageProps = {
  title: string
  description?: string
  /** What the user would normally do here once the feature ships. */
  intent?: string
}

/**
 * Operational empty-state page used by routes whose feature UI ships later.
 *
 * Pattern borrowed from Shopify's empty states (e.g. "Draft orders"):
 *   - Centered illustration token (amber sparkle in a soft tinted square)
 *   - Single bold heading + supporting copy
 *   - Primary action that takes the user to the closest live workspace
 *
 * Replaces the previous dashed placeholder grid which read as "dead" on
 * mobile. This version stays interactive at every breakpoint.
 */
export function PlaceholderPage({
  title,
  description = "This area will ship in a later sprint.",
  intent,
}: PlaceholderPageProps): JSX.Element {
  return (
    <div className="px-4 py-10 md:px-8 md:py-16">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-subtle text-amber-text"
          aria-hidden
        >
          <IconSparkle size={26} />
        </span>
        <p className="mt-5 text-2xs font-semibold uppercase tracking-label text-content-tertiary">
          Coming soon
        </p>
        <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-content-primary md:text-3xl">
          {title}
        </h2>
        <p className="mt-3 max-w-md text-sm text-content-secondary">
          {description}
        </p>
        {intent ? (
          <p className="mt-2 max-w-md text-xs text-content-tertiary">
            <span className="font-semibold uppercase tracking-label">When live: </span>
            {intent}
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <Link
            to="/"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-interactive-primary px-4 text-xs font-semibold text-content-inverse shadow-sm transition-colors hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          >
            Back to home
            <IconArrowRight size={14} />
          </Link>
          <Link
            to="/products"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border-app bg-surface-appCard px-4 text-xs font-semibold text-content-primary transition-colors hover:border-border-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          >
            Go to products
          </Link>
        </div>
      </div>
    </div>
  )
}
