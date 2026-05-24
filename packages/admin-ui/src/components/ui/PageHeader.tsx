import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { cn } from "@/lib/cn"

export type PageHeaderBreadcrumb = {
  label: string
  href?: string
}

type PageHeaderProps = {
  title: string
  description?: string
  breadcrumbs?: PageHeaderBreadcrumb[]
  actions?: ReactNode
  className?: string
}

/**
 * Page header — title, optional breadcrumb trail, and action slot.
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps): JSX.Element {
  return (
    <header
      className={cn(
        "border-b border-border-default bg-surface-raised px-4 py-4 sm:px-6",
        className,
      )}
    >
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-content-tertiary">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1
              return (
                <li key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1">
                  {index > 0 ? <span aria-hidden>/</span> : null}
                  {crumb.href && !isLast ? (
                    <Link
                      to={crumb.href}
                      className="font-medium text-content-secondary hover:text-content-primary"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={isLast ? "font-medium text-content-secondary" : ""}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {crumb.label}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-content-primary sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-sm text-content-secondary">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
