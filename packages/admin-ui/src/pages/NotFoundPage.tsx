import { Link } from "react-router-dom"

/**
 * Catch-all 404 — quiet editorial framing, single primary CTA back home.
 */
export function NotFoundPage(): JSX.Element {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-5 px-6 py-20 text-center md:py-32">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-default px-2.5 py-0.5 text-2xs font-medium uppercase tracking-label text-content-tertiary">
        404
      </span>
      <h1 className="text-3xl font-semibold tracking-tight text-content-primary">
        Page not found
      </h1>
      <p className="max-w-md text-sm text-content-secondary">
        The page you requested does not exist in MercFlow admin. Use the sidebar
        to navigate or head back to the dashboard.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-content-inverse transition-colors duration-150 hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
