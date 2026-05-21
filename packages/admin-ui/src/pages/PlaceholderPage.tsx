type PlaceholderPageProps = {
  title: string
  description?: string
}

/**
 * Stub page for routes whose feature UI ships in a later sprint.
 */
export function PlaceholderPage({
  title,
  description = "Coming soon.",
}: PlaceholderPageProps): JSX.Element {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-content-primary">{title}</h1>
      <p className="mt-2 max-w-prose text-sm text-content-secondary">{description}</p>
    </div>
  )
}
