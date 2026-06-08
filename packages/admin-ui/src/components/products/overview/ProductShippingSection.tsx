import type { ReactNode } from "react"

import { EditorSection } from "@/components/products/editor/EditorSection"
import type { ProductEditorDraft } from "@/components/products/editor/productEditorTypes"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"

type Props = {
  draft: ProductEditorDraft
  update: (patch: Partial<ProductEditorDraft>) => void
}

export function ProductShippingSection({ draft, update }: Props): ReactNode {
  return (
    <EditorSection title="Shipping & customs" description="Defaults for new variants and customs declarations.">
      <FormField label="Material">
        <Input value={draft.material} onChange={(event) => update({ material: event.target.value })} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Weight (g)">
          <Input value={draft.weight} onChange={(event) => update({ weight: event.target.value })} inputMode="decimal" />
        </FormField>
        <FormField label="Length (cm)">
          <Input value={draft.length} onChange={(event) => update({ length: event.target.value })} inputMode="decimal" />
        </FormField>
        <FormField label="Height (cm)">
          <Input value={draft.height} onChange={(event) => update({ height: event.target.value })} inputMode="decimal" />
        </FormField>
        <FormField label="Width (cm)">
          <Input value={draft.width} onChange={(event) => update({ width: event.target.value })} inputMode="decimal" />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormField label="HS code">
          <Input value={draft.hsCode} onChange={(event) => update({ hsCode: event.target.value })} />
        </FormField>
        <FormField label="MID code">
          <Input value={draft.midCode} onChange={(event) => update({ midCode: event.target.value })} />
        </FormField>
        <FormField label="Origin country">
          <Input
            value={draft.originCountry}
            onChange={(event) => update({ originCountry: event.target.value })}
            placeholder="DK"
          />
        </FormField>
      </div>
    </EditorSection>
  )
}
