import { Link } from "react-router-dom"

/**
 * Unknown routes inside the shell — keeps sidebar chrome for wayfinding.
 */
export function NotFoundPage(): JSX.Element {
  return (
    <div className="p-6 md:p-8">
      <div className="max-w-lg space-y-4">
        <h1 className="text-2xl font-semibold text-content-primary">
          Page not found
        </h1>
        <p className="text-base text-content-secondary">
          This path does not exist yet in the MercFlow admin shell.
        </p>
        <Link
          to="/"
          className="inline-flex text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
