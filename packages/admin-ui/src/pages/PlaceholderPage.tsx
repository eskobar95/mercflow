import { Link } from "react-router-dom"

import { IconArrowRight } from "@/components/ui/icons"

type PlaceholderPageProps = {
  title: string
  /** What lives here, folded into a single sentence. */
  description: string
  /**
   * Optional route-aware fallback CTA — points to a route that *is* shipped
   * so the visitor lands somewhere useful instead of looping back home.
   * Defaults to the catalogue, which is MercFlow's first real surface.
   */
  fallback?: {
    label: string
    to: string
  }
}

const DEFAULT_FALLBACK = {
  label: "Open the catalogue",
  to: "/products",
}

/**
 * Placeholder for routes whose real implementation hasn't shipped yet.
 *
 * Earlier versions of this page wore a pulsing amber dot, a "Coming soon"
 * pill, a "When live:" prefix, and a generic "Back to home" CTA — all
 * Tailwind-tutorial chrome that read identically across nine routes. Now
 * the page is just title + plain prose + a contextual exit, so each
 * placeholder feels like a real page-in-progress rather than the same
 * template wallpapered everywhere.
 */
export function PlaceholderPage({
  title,
  description,
  fallback = DEFAULT_FALLBACK,
}: PlaceholderPageProps): JSX.Element {
  return (
    <div className="px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto flex max-w-xl flex-col items-start">
        <h2 className="text-2xl font-semibold tracking-tight text-content-primary md:text-3xl">
          {title}
        </h2>

        <p className="mt-3 text-base leading-relaxed text-content-secondary">
          {description}
        </p>

        <p className="mt-1 text-sm text-content-tertiary">
          Not in this slice yet — landing in a later sprint.
        </p>

        <Link
          to={fallback.to}
          className="group/cta mt-6 inline-flex h-9 items-center gap-1.5 rounded-full border border-border-default bg-surface-appCard px-3.5 text-sm font-semibold text-content-primary shadow-sm transition-[background-color,border-color,transform,box-shadow] duration-150 hover:border-border-strong hover:bg-surface-subtle hover:shadow-md active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
        >
          {fallback.label}
          <IconArrowRight
            size={13}
            className="text-content-tertiary transition-transform duration-200 group-hover/cta:translate-x-0.5 group-hover/cta:text-content-secondary"
          />
        </Link>
      </div>
    </div>
  )
}
