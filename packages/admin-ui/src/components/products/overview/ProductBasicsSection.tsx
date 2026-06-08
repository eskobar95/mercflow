import type { ReactNode } from "react"

import { EditorSection } from "@/components/products/editor/EditorSection"
import type { ProductEditorDraft } from "@/components/products/editor/productEditorTypes"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"

type Props = {
  draft: ProductEditorDraft
  update: (patch: Partial<ProductEditorDraft>) => void
}

export function ProductBasicsSection({ draft, update }: Props): ReactNode {
  return (
    <EditorSection title="Basics" description="The core identity customers and search engines see first.">
      <FormField
        label="Title"
        required
        error={draft.title.trim() === "" ? "Title is required." : undefined}
      >
        <Input
          value={draft.title}
          onChange={(event) => update({ title: event.target.value })}
          error={draft.title.trim() === ""}
          placeholder="e.g. Hydrating Face Serum"
        />
      </FormField>

      <FormField label="Subtitle">
        <Input
          value={draft.subtitle}
          onChange={(event) => update({ subtitle: event.target.value })}
          placeholder="Optional short tagline"
        />
      </FormField>

      <FormField label="Handle" hint="Used in the storefront URL.">
        <Input
          value={draft.handle}
          onChange={(event) => update({ handle: event.target.value })}
          leadingIcon={<span className="text-xs">/</span>}
          placeholder="product-handle"
        />
      </FormField>

      <FormField label="Description" hint="Plain summary. Rich content lives in the Content & SEO tab.">
        <Textarea
          value={draft.description}
          onChange={(event) => update({ description: event.target.value })}
          rows={5}
          placeholder="Describe the product…"
        />
      </FormField>
    </EditorSection>
  )
}
