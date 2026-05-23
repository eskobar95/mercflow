import { Link } from "react-router-dom"

import { IconArrowRight } from "@/components/ui/icons"

/**
 * Catch-all 404 — operational empty-state framing with a single primary CTA
 * back to home. Matches the new shell zones (cool canvas + amber accents).
 */
export function NotFoundPage(): JSX.Element {
  return (
    <div className="px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border-app bg-surface-appCard px-2.5 py-0.5 font-mono text-2xs font-semibold uppercase tracking-label text-amber-text">
          404 · Not found
        </span>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-content-primary md:text-[34px]">
          We couldn't find that page
        </h2>
        <p className="mt-3 max-w-md text-sm text-content-secondary">
          The link you followed is missing or no longer exists. Try the sidebar,
          search from the top bar, or head back home.
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex h-9 items-center gap-2 rounded-md bg-interactive-primary px-4 text-xs font-semibold text-content-inverse shadow-sm transition-colors hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
        >
          Back to home
          <IconArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
