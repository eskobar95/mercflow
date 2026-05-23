import { Link } from "react-router-dom"

import { IconArrowRight } from "@/components/ui/icons"

type PlaceholderPageProps = {
  title: string
  description?: string
  /** What the user will be able to do here once the feature ships. */
  intent?: string
}

/**
 * Operational placeholder — Stripe empty-state pattern, no AI sparkle slop.
 *
 *   - Small status pill at top (blue dot · "Coming soon")
 *   - Bold title
 *   - Description, then optional intent line
 *   - Single primary CTA back to a useful screen
 *
 * The blue dot is the only chromatic element on the page. No decorative
 * sparkle icon, no shouting WHEN LIVE labels.
 */
export function PlaceholderPage({
  title,
  description = "This area will ship in a later sprint.",
  intent,
}: PlaceholderPageProps): JSX.Element {
  return (
    <div className="px-4 py-12 md:px-8 md:py-20">
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">
        <p className="flex items-center gap-1.5 text-[12px] font-medium text-content-tertiary">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber" />
          </span>
          Coming soon
        </p>

        <h2 className="mt-3 text-[26px] font-semibold tracking-tight text-content-primary md:text-[30px]">
          {title}
        </h2>

        <p className="mt-3 max-w-md text-[14px] leading-relaxed text-content-secondary">
          {description}
        </p>

        {intent ? (
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-content-tertiary">
            <span className="font-medium text-content-secondary">When live: </span>
            {intent}
          </p>
        ) : null}

        <div className="mt-7">
          <Link
            to="/"
            className="group/cta inline-flex h-9 items-center gap-1.5 rounded-full bg-amber px-4 text-[13px] font-semibold text-content-inverse shadow-sm transition-[background-color,transform,box-shadow] duration-150 hover:bg-amber-strong hover:shadow-md active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
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
    </div>
  )
}
