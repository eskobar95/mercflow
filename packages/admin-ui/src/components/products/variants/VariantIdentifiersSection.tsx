import type { ReactNode } from "react"

import { EditorSection } from "@/components/products/editor/EditorSection"
import type { VariantEditorDraft } from "@/components/products/variants/useVariantEditor"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"

type Props = {
  draft: VariantEditorDraft
  update: (patch: Partial<VariantEditorDraft>) => void
}

export function VariantIdentifiersSection({ draft, update }: Props): ReactNode {
  return (
    <EditorSection title="Identifiers" description="Variant name and the codes channels and feeds use.">
      <FormField
        label="Variant title"
        required
        error={draft.title.trim() === "" ? "Title is required." : undefined}
      >
        <Input
          value={draft.title}
          onChange={(event) => update({ title: event.target.value })}
          error={draft.title.trim() === ""}
          placeholder="e.g. 50 ml"
        />
      </FormField>

      <FormField label="SKU">
        <Input value={draft.sku} onChange={(event) => update({ sku: event.target.value })} placeholder="SKU-001" />
      </FormField>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormField label="Barcode">
          <Input value={draft.barcode} onChange={(event) => update({ barcode: event.target.value })} />
        </FormField>
        <FormField label="EAN">
          <Input value={draft.ean} onChange={(event) => update({ ean: event.target.value })} />
        </FormField>
        <FormField label="UPC">
          <Input value={draft.upc} onChange={(event) => update({ upc: event.target.value })} />
        </FormField>
      </div>
    </EditorSection>
  )
}
