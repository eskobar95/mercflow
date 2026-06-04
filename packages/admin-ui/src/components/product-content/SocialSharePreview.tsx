export type SocialSharePreviewProps = {
  title: string
  description: string
  imageUrl: string | null
  fallbackTitle?: string
}

/**
 * Presentational Open Graph / Twitter Card style preview for the Content tab.
 */
export function SocialSharePreview({
  title,
  description,
  imageUrl,
  fallbackTitle = "Product",
}: SocialSharePreviewProps): JSX.Element {
  const displayTitle = title.trim() !== "" ? title.trim() : fallbackTitle
  const displayDescription =
    description.trim() !== ""
      ? description.trim()
      : "Add a meta description for richer social previews."

  return (
    <div
      className="overflow-hidden rounded-md border border-border-default bg-surface-subtle"
      aria-label="Social share preview"
    >
      <p className="border-b border-border-subtle px-3 py-2 text-xs font-medium uppercase tracking-wide text-content-tertiary">
        Social share preview
      </p>
      {imageUrl ? (
        <div className="aspect-[1.91/1] w-full bg-surface-default">
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-surface-default text-xs text-content-tertiary">
          No image — add an OG image URL
        </div>
      )}
      <div className="space-y-1 px-3 py-3">
        <p className="text-xs uppercase tracking-wide text-content-tertiary">example.com</p>
        <p className="line-clamp-2 text-sm font-semibold text-content-primary">{displayTitle}</p>
        <p className="line-clamp-2 text-xs text-content-secondary">{displayDescription}</p>
      </div>
    </div>
  )
}
