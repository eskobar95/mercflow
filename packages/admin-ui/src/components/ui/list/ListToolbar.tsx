import type { ReactNode } from "react"

type ListToolbarProps = {
  title: string
  description?: string
  /** Filter controls, search, chips — place between title and end slot. */
  children?: ReactNode
  end?: ReactNode
}

/**
 * List header: title, optional description, filter row, optional actions.
 * Matches the ListPage structure from `admin-ui.mdc` at a presentational level.
 */
export function ListToolbar({
  title,
  description,
  children,
  end,
}: ListToolbarProps): ReactNode {
  return (
    <div className="border-b border-border-default bg-surface-raised">
      <div className="flex flex-col gap-3 px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-content-primary">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 text-sm text-content-secondary">
                {description}
              </p>
            ) : null}
          </div>
          {end ? <div className="shrink-0">{end}</div> : null}
        </div>
        {children ? (
          <search className="flex flex-wrap items-center gap-3 border-t border-border-subtle pt-3">
            {children}
          </search>
        ) : null}
      </div>
    </div>
  )
}
