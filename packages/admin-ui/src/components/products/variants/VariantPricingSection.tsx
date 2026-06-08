import type { ReactNode } from "react"

import { EditorSection } from "@/components/products/editor/EditorSection"
import type { VariantEditorDraft } from "@/components/products/variants/useVariantEditor"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"

type Props = {
  draft: VariantEditorDraft
  update: (patch: Partial<VariantEditorDraft>) => void
}

export function VariantPricingSection({ draft, update }: Props): ReactNode {
  return (
    <EditorSection title="Pricing">
      <FormField label="Price (DKK)" hint="Amount customers pay, in Danish kroner.">
        <Input
          value={draft.priceDkk}
          onChange={(event) => update({ priceDkk: event.target.value })}
          inputMode="decimal"
          leadingIcon={<span className="text-xs">kr</span>}
          placeholder="0,00"
        />
      </FormField>
    </EditorSection>
  )
}
