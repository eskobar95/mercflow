import type { ReactNode } from "react"

import type { ProductStatus } from "@medusajs/types"

import { EditorSection } from "@/components/products/editor/EditorSection"
import type { ProductEditorDraft } from "@/components/products/editor/productEditorTypes"
import { FormField } from "@/components/ui/FormField"
import { Select } from "@/components/ui/Select"
import { Switch } from "@/components/ui/Switch"

type Props = {
  draft: ProductEditorDraft
  update: (patch: Partial<ProductEditorDraft>) => void
}

const STATUS_OPTIONS: Array<{ value: ProductStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "proposed", label: "Proposed" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
]

export function ProductStatusCard({ draft, update }: Props): ReactNode {
  const discountableId = "product-discountable"

  return (
    <EditorSection title="Status">
      <FormField label="Visibility">
        <Select
          value={draft.status}
          onValueChange={(value) => update({ status: value as ProductStatus })}
          options={STATUS_OPTIONS}
          aria-label="Product status"
        />
      </FormField>

      <div className="flex items-start justify-between gap-3 border-t border-border-subtle pt-4">
        <div className="min-w-0">
          <label htmlFor={discountableId} className="text-sm font-medium text-content-primary">
            Discountable
          </label>
          <p className="mt-0.5 text-xs text-content-tertiary">Allow discounts to apply to this product.</p>
        </div>
        <Switch
          id={discountableId}
          checked={draft.discountable}
          onCheckedChange={(checked) => update({ discountable: checked })}
        />
      </div>
    </EditorSection>
  )
}
