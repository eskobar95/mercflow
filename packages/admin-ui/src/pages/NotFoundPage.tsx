import { Link } from "react-router-dom"

/**
 * Catch-all route when no admin path matches.
 */
export function NotFoundPage(): JSX.Element {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-3xl font-semibold text-content-primary">Page not found</p>
      <p className="max-w-md text-sm text-content-secondary">
        The page you requested does not exist in MercFlow admin.
      </p>
      <Link
        to="/"
        className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-content-inverse hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
