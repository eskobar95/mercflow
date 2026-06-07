import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { IconArrowRight } from "@/components/ui/icons"

/**
 * Catch-all 404 — Stripe / Mercury empty-state framing.
 * Single primary CTA back to home. No decorative graphics.
 */
export function NotFoundPage(): ReactNode {
  return (
    <div className="px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-subtle px-2.5 py-0.5 font-mono text-2xs font-semibold text-accent-text">
          404
        </span>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-content-primary md:text-4xl">
          We couldn't find that page
        </h2>
        <p className="mt-3 max-w-md text-base leading-relaxed text-content-secondary">
          The link you followed is missing or no longer exists. Try the sidebar,
          search from the top bar, or head back home.
        </p>
        <Link
          to="/"
          className="group/cta mt-7 inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-semibold text-content-inverse shadow-sm transition-[background-color,transform,box-shadow] duration-150 hover:bg-accent-strong hover:shadow-md active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
        >
          Back to home
          <IconArrowRight
            size={14}
            className="transition-transform duration-200 group-hover/cta:translate-x-0.5"
          />
        </Link>
      </div>
    </div>
  )
}
