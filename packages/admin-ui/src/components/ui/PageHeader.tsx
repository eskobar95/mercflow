import type { ReactNode } from "react"

import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/Breadcrumb"

import { cn } from "@/lib/cn"

type PageHeaderProps = {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
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
}: PageHeaderProps): ReactNode {
  return (
    <header
      className={cn(
        "border-b border-border-default bg-surface-raised px-4 py-4 sm:px-6",
        className,
      )}
    >
      {breadcrumbs && breadcrumbs.length > 0 ? <Breadcrumb items={breadcrumbs} /> : null}
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

export type { BreadcrumbItem as PageHeaderBreadcrumb }
