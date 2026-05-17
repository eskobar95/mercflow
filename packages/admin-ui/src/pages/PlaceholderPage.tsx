type PlaceholderPageProps = {
  title: string
  description?: string
}

/**
 * Sprint 1 shell placeholder — real list/detail UIs land in later tasks.
 */
export function PlaceholderPage({
  title,
  description = "Page content will be added in a future sprint.",
}: PlaceholderPageProps): JSX.Element {
  return (
    <div className="p-6 md:p-8">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-2xl font-semibold text-content-primary">{title}</h1>
        <p className="text-base text-content-secondary">{description}</p>
      </div>
    </div>
  )
}
