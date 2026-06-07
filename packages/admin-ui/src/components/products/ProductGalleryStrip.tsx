import type { ReactNode } from "react"
type ProductGalleryStripProps = {
  thumbnails: Array<{ alt: string; src: string }>
}

/** Horizontal scrolling strip used on product detail Overview for media previews. */
export function ProductGalleryStrip({ thumbnails }: ProductGalleryStripProps): ReactNode {
  if (thumbnails.length === 0) {
    return (
      <p className="text-sm text-content-tertiary">
        Upload imagery in Medusa Admin to populate this carousel.
      </p>
    )
  }

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1 md:flex-wrap md:gap-3">
      {thumbnails.map((img) => (
        <div
          key={img.src}
          className="h-24 w-24 shrink-0 overflow-hidden rounded-sm border border-border-default bg-surface-subtle md:h-28 md:w-28"
        >
          <img
            src={img.src}
            alt={img.alt}
            loading="lazy"
            width={112}
            height={112}
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  )
}
