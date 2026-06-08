import { type ChangeEvent, type ReactNode, useMemo, useRef, useState } from "react"

import { EditorSection } from "@/components/products/editor/EditorSection"
import type { ProductEditorDraft } from "@/components/products/editor/productEditorTypes"
import { useToast } from "@/components/ui/Toast"
import { extractMessageFromMedusaError } from "@/lib/products/productUnifiedPersistence"
import { resolveMedusaAssetUrl } from "@/lib/products/resolveMedusaAssetUrl"
import { createMercflowMedusaSdk } from "@/medusa-admin/createMercflowMedusaSdk"

import { MediaIconButton } from "./MediaIconButton"

type Props = {
  draft: ProductEditorDraft
  update: (patch: Partial<ProductEditorDraft>) => void
}

export function ProductMediaManager({ draft, update }: Props): ReactNode {
  const sdk = useMemo(() => createMercflowMedusaSdk(), [])
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const primaryUrl = draft.thumbnail ?? draft.images[0]?.url ?? null

  const moveImage = (index: number, direction: -1 | 1): void => {
    const target = index + direction
    if (target < 0 || target >= draft.images.length) {
      return
    }
    const next = [...draft.images]
    const [moved] = next.splice(index, 1)
    if (moved !== undefined) {
      next.splice(target, 0, moved)
      update({ images: next })
    }
  }

  const removeImage = (url: string): void => {
    const next = draft.images.filter((image) => image.url !== url)
    update({ images: next, thumbnail: draft.thumbnail === url ? null : draft.thumbnail })
  }

  const onFiles = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = event.target.files
    if (files === null || files.length === 0 || sdk === null) {
      return
    }
    setUploading(true)
    try {
      const response = await sdk.admin.upload.create({ files: Array.from(files) })
      const uploaded = (response.files ?? [])
        .map((file) => file.url)
        .filter((url): url is string => typeof url === "string" && url.trim() !== "")
        .map((url) => ({ url }))
      update({ images: [...draft.images, ...uploaded] })
    } catch (error) {
      toast({ variant: "error", title: "Upload failed", description: extractMessageFromMedusaError(error) })
    } finally {
      setUploading(false)
      if (inputRef.current !== null) {
        inputRef.current.value = ""
      }
    }
  }

  return (
    <EditorSection
      title="Media"
      description="The first image is the storefront thumbnail unless you pick another."
    >
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {draft.images.map((image, index) => {
          const resolved = resolveMedusaAssetUrl(image.url)
          const isPrimary = image.url === primaryUrl
          return (
            <div
              key={image.url}
              className="group/media relative aspect-square overflow-hidden rounded-md border border-border-default bg-surface-subtle"
            >
              {resolved !== null ? (
                <img src={resolved} alt="" className="h-full w-full object-cover" />
              ) : null}
              {isPrimary ? (
                <span className="absolute left-1 top-1 rounded-full bg-interactive-primary px-1.5 py-0.5 text-2xs font-semibold text-content-inverse">
                  Thumbnail
                </span>
              ) : null}
              <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1 opacity-0 transition-opacity duration-150 group-hover/media:opacity-100 group-focus-within/media:opacity-100">
                <div className="flex gap-1">
                  <MediaIconButton label="Move left" disabled={index === 0} onClick={() => moveImage(index, -1)}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </MediaIconButton>
                  <MediaIconButton
                    label="Move right"
                    disabled={index === draft.images.length - 1}
                    onClick={() => moveImage(index, 1)}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </MediaIconButton>
                </div>
                <div className="flex gap-1">
                  <MediaIconButton
                    label="Set as thumbnail"
                    active={isPrimary}
                    onClick={() => update({ thumbnail: image.url })}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M6 1.5l1.4 2.9 3.1.4-2.3 2.2.6 3.1L6 8.9 3.2 10.1l.6-3.1L1.5 4.8l3.1-.4L6 1.5z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" fill={isPrimary ? "currentColor" : "none"} />
                    </svg>
                  </MediaIconButton>
                  <MediaIconButton label="Remove image" onClick={() => removeImage(image.url)}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </MediaIconButton>
                </div>
              </div>
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || sdk === null}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border-default text-xs text-content-tertiary transition-colors duration-150 hover:border-border-strong hover:text-content-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M9 3.5v11M3.5 9h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {uploading ? "Uploading…" : "Add"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          void onFiles(event)
        }}
      />
    </EditorSection>
  )
}
