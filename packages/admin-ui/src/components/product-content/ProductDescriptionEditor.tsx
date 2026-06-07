import type { ReactNode } from "react"
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
  variant = "embedded",
  placeholder = "Describe this product for shoppers…",
}: ProductDescriptionEditorProps): ReactNode {
  return (
    <RichTextEditor
      value={value}
      onChange={onChange as (json: JSONContent) => void}
      disabled={disabled}
      extensions="full"
      variant={variant}
      placeholder={placeholder}
      label="Rich text description editor"
    />
  )
}
