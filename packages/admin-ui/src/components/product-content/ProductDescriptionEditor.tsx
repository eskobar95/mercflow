import type { JSONContent } from "@tiptap/core"

import {
  RichTextEditor,
  type RichTextEditorProps,
} from "@/components/ui/RichTextEditor"

export type ProductDescriptionEditorProps = Omit<
  RichTextEditorProps,
  "extensions" | "label"
> & {
  value: unknown
}

/**
 * Product content rich text — delegates to the shared RichTextEditor primitive.
 */
export function ProductDescriptionEditor({
  value,
  onChange,
  disabled = false,
}: ProductDescriptionEditorProps): JSX.Element {
  return (
    <RichTextEditor
      value={value}
      onChange={onChange as (json: JSONContent) => void}
      disabled={disabled}
      extensions="full"
      label="Rich text description editor"
    />
  )
}
