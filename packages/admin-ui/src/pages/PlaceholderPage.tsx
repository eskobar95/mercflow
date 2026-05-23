type PlaceholderPageProps = {
  title: string
  description?: string
}

/**
 * Quiet, editorial stub page for routes whose feature UI ships later.
 * Mirrors the Claude/Anthropic vellum aesthetic: airy padding, soft borders,
 * no decoration, single muted status pill.
 */
export function PlaceholderPage({
  title,
  description = "This area will ship in a later sprint.",
}: PlaceholderPageProps): JSX.Element {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 md:px-10 md:py-12">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-content-primary">
          {title}
        </h1>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-subtle px-2.5 py-0.5 text-2xs font-medium uppercase tracking-label text-content-tertiary">
          <span className="block h-1.5 w-1.5 rounded-full bg-amber-default" aria-hidden />
          Coming soon
        </span>
      </div>
      <p className="mt-2 max-w-prose text-sm text-content-secondary">
        {description}
      </p>
      <div className="mt-8 rounded-lg border border-border-subtle bg-surface-default p-6 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 rounded-md border border-dashed border-border-subtle bg-surface-canvas/60"
              aria-hidden
            />
          ))}
        </div>
        <p className="mt-6 text-xs text-content-tertiary">
          Layout slot reserved. Build will replace these blocks with real lists, tables, or forms.
        </p>
      </div>
    </div>
  )
}
