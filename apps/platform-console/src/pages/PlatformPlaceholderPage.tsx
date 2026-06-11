type Props = {
  title: string
  description: string
}

export function PlatformPlaceholderPage({
  title,
  description,
}: Props): React.ReactElement {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold text-content-primary">{title}</h2>
      <p className="mt-2 text-sm text-content-secondary">{description}</p>
      <p className="mt-6 rounded-md border border-dashed border-border-subtle bg-surface-subtle px-4 py-3 text-sm text-content-tertiary">
        Placeholder — implementation scheduled in a later M014 sprint task.
      </p>
    </div>
  )
}
